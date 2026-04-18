"""Tests for CMS admin API endpoints: CRUD, transitions, optimistic locking, revisions."""

import pytest
from django.contrib.contenttypes.models import ContentType

from apps.cms.models import ContentRevision, HeroSection, NavigationItem, SiteSettings
from apps.cms.tests.factories import (
    CaseStudyFactory,
    HeroSectionFactory,
    NavigationItemFactory,
    PageMetaFactory,
    PricingPlanFactory,
    ServiceOfferingFactory,
    SiteSettingsFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# Permission checks
# ---------------------------------------------------------------------------


class TestAdminPermissions:
    def test_anon_user_denied(self, anon_client, db):
        resp = anon_client.get("/api/v1/admin/cms/hero/")
        assert resp.status_code == 401

    def test_client_user_denied(self, client_client, db):
        resp = client_client.get("/api/v1/admin/cms/hero/")
        assert resp.status_code == 403

    def test_admin_user_allowed(self, admin_client, db):
        resp = admin_client.get("/api/v1/admin/cms/hero/")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Site Settings CRUD
# ---------------------------------------------------------------------------


class TestAdminSiteSettings:
    def test_get_settings(self, admin_client, db):
        SiteSettingsFactory(company_email="info@abs.com")
        resp = admin_client.get("/api/v1/admin/cms/settings/")
        assert resp.status_code == 200
        assert resp.data["company_email"] == "info@abs.com"

    def test_patch_settings(self, admin_client, db):
        SiteSettingsFactory(company_email="old@abs.com")
        resp = admin_client.patch(
            "/api/v1/admin/cms/settings/",
            {"company_email": "new@abs.com"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["company_email"] == "new@abs.com"


# ---------------------------------------------------------------------------
# Page Meta CRUD
# ---------------------------------------------------------------------------


class TestAdminPageMeta:
    def test_create_meta(self, admin_client, db):
        resp = admin_client.post(
            "/api/v1/admin/cms/meta/",
            {"route": "/test", "title": "Test Page", "description": "Desc"},
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["route"] == "/test"

    def test_update_meta(self, admin_client, db):
        meta = PageMetaFactory(route="/about", title="Old")
        resp = admin_client.patch(
            f"/api/v1/admin/cms/meta/{meta.pk}/",
            {"title": "New About"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["title"] == "New About"

    def test_delete_meta(self, admin_client, db):
        meta = PageMetaFactory()
        resp = admin_client.delete(f"/api/v1/admin/cms/meta/{meta.pk}/")
        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Hero CRUD + Transitions
# ---------------------------------------------------------------------------


class TestAdminHero:
    def test_create_hero(self, admin_client, admin_user):
        resp = admin_client.post(
            "/api/v1/admin/cms/hero/",
            {
                "page": "home",
                "headline": "Welcome",
                "subheadline": "Sub",
                "cta_primary_text": "Go",
                "cta_primary_link": "/go",
            },
            format="json",
        )
        assert resp.status_code == 201
        assert resp.data["headline"] == "Welcome"
        assert resp.data["status"] == "draft"

    def test_update_hero(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        hero.refresh_from_db()
        resp = admin_client.patch(
            f"/api/v1/admin/cms/hero/{hero.pk}/",
            {"headline": "Updated", "version": hero.version},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["headline"] == "Updated"

    def test_delete_hero(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        resp = admin_client.delete(f"/api/v1/admin/cms/hero/{hero.pk}/")
        assert resp.status_code == 204

    def test_transition_submit(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        resp = admin_client.post(
            f"/api/v1/admin/cms/hero/{hero.pk}/transition/",
            {"action": "submit"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "review"

    def test_transition_full_lifecycle(self, admin_client, admin_user):
        hero = HeroSectionFactory(
            page="lifecycle",
            headline="Test",
            cta_primary_text="CTA",
            cta_primary_link="/go",
            created_by=admin_user,
            updated_by=admin_user,
        )
        url = f"/api/v1/admin/cms/hero/{hero.pk}/transition/"

        # submit
        resp = admin_client.post(url, {"action": "submit"}, format="json")
        assert resp.data["status"] == "review"

        # approve
        resp = admin_client.post(url, {"action": "approve"}, format="json")
        assert resp.data["status"] == "approved"

        # publish
        resp = admin_client.post(url, {"action": "publish"}, format="json")
        assert resp.data["status"] == "published"

        # archive
        resp = admin_client.post(url, {"action": "archive"}, format="json")
        assert resp.data["status"] == "archived"

    def test_transition_invalid_action(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        resp = admin_client.post(
            f"/api/v1/admin/cms/hero/{hero.pk}/transition/",
            {"action": "bogus"},
            format="json",
        )
        assert resp.status_code == 400

    def test_transition_invalid_from_status(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        # draft → publish is not allowed (must go through review → approved first)
        resp = admin_client.post(
            f"/api/v1/admin/cms/hero/{hero.pk}/transition/",
            {"action": "publish"},
            format="json",
        )
        assert resp.status_code == 400

    def test_publish_validates_content(self, admin_client, admin_user):
        hero = HeroSectionFactory(
            page="val-test",
            headline="",  # Invalid for publish
            cta_primary_text="",
            cta_primary_link="",
            created_by=admin_user,
            updated_by=admin_user,
            status="approved",
        )
        resp = admin_client.post(
            f"/api/v1/admin/cms/hero/{hero.pk}/transition/",
            {"action": "publish"},
            format="json",
        )
        assert resp.status_code == 400
        assert "errors" in resp.data


# ---------------------------------------------------------------------------
# Optimistic Locking
# ---------------------------------------------------------------------------


class TestOptimisticLocking:
    def test_stale_version_returns_409(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        hero.refresh_from_db()
        stale_version = hero.version

        # Simulate another user updating
        hero.headline = "Someone else updated"
        hero.save()
        hero.refresh_from_db()
        assert hero.version == stale_version + 1

        # Try to update with stale version
        resp = admin_client.patch(
            f"/api/v1/admin/cms/hero/{hero.pk}/",
            {"headline": "My update", "version": stale_version},
            format="json",
        )
        assert resp.status_code == 409
        assert "current_version" in resp.data

    def test_correct_version_succeeds(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        hero.refresh_from_db()
        resp = admin_client.patch(
            f"/api/v1/admin/cms/hero/{hero.pk}/",
            {"headline": "Good update", "version": hero.version},
            format="json",
        )
        assert resp.status_code == 200

    def test_no_version_in_request_skips_check(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        resp = admin_client.patch(
            f"/api/v1/admin/cms/hero/{hero.pk}/",
            {"headline": "No version provided"},
            format="json",
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Navigation Reorder
# ---------------------------------------------------------------------------


class TestAdminNavigation:
    def test_reorder(self, admin_client, db):
        n1 = NavigationItemFactory(label="A", order=1)
        n2 = NavigationItemFactory(label="B", order=2)
        resp = admin_client.post(
            "/api/v1/admin/cms/navigation/reorder/",
            [{"id": n1.pk, "order": 2}, {"id": n2.pk, "order": 1}],
            format="json",
        )
        assert resp.status_code == 200
        n1.refresh_from_db()
        n2.refresh_from_db()
        assert n1.order == 2
        assert n2.order == 1


# ---------------------------------------------------------------------------
# Content Revisions & Rollback
# ---------------------------------------------------------------------------


class TestAdminRevisions:
    def test_revision_list_requires_params(self, admin_client, db):
        resp = admin_client.get("/api/v1/admin/cms/revisions/")
        assert resp.status_code == 400

    def test_revision_list_for_hero(self, admin_client, admin_user):
        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        hero.headline = "Rev 2"
        hero.save()
        hero.refresh_from_db()

        ct = ContentType.objects.get_for_model(HeroSection)
        resp = admin_client.get(
            "/api/v1/admin/cms/revisions/",
            {"content_type": ct.pk, "object_id": str(hero.pk)},
        )
        assert resp.status_code == 200
        assert len(resp.data) == 2

    def test_rollback_restores_content(self, admin_client, admin_user):
        hero = HeroSectionFactory(
            headline="Original",
            created_by=admin_user,
            updated_by=admin_user,
        )
        hero.headline = "Changed"
        hero.save()
        hero.refresh_from_db()

        ct = ContentType.objects.get_for_model(HeroSection)
        first_rev = (
            ContentRevision.objects.filter(content_type=ct, object_id=str(hero.pk))
            .order_by("revision_number")
            .first()
        )

        resp = admin_client.post(
            f"/api/v1/admin/cms/revisions/{first_rev.pk}/rollback/"
        )
        assert resp.status_code == 200

        hero.refresh_from_db()
        assert hero.headline == "Original"

    def test_rollback_nonexistent_revision_404(self, admin_client, db):
        import uuid

        resp = admin_client.post(
            f"/api/v1/admin/cms/revisions/{uuid.uuid4()}/rollback/"
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Audit Logging
# ---------------------------------------------------------------------------


class TestAuditLogging:
    def test_crud_creates_audit_log(self, admin_client, admin_user):
        from apps.accounts.models import AuditLog

        resp = admin_client.post(
            "/api/v1/admin/cms/hero/",
            {
                "page": "audit-test",
                "headline": "Audit",
                "subheadline": "Sub",
                "cta_primary_text": "Go",
                "cta_primary_link": "/go",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        logs = AuditLog.objects.filter(
            performed_by=admin_user, action="cms_hero_create"
        )
        assert logs.exists()

    def test_transition_creates_audit_log(self, admin_client, admin_user):
        from apps.accounts.models import AuditLog

        hero = HeroSectionFactory(created_by=admin_user, updated_by=admin_user)
        admin_client.post(
            f"/api/v1/admin/cms/hero/{hero.pk}/transition/",
            {"action": "submit"},
            format="json",
        )
        logs = AuditLog.objects.filter(performed_by=admin_user, action="cms_submit")
        assert logs.exists()
