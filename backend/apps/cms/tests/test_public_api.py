"""Tests for public (read-only) CMS API endpoints."""

import pytest
from django.test import override_settings
from unittest.mock import patch

from apps.cms.tests.factories import (
    CaseStudyFactory,
    HeroSectionFactory,
    NavigationItemFactory,
    PageBlockFactory,
    PageMetaFactory,
    ServiceOfferingFactory,
    SiteSettingsFactory,
    UserFactory,
    DocumentationPageFactory,
    APIEndpointGroupFactory,
    APIEndpointFactory,
)


@pytest.fixture
def user(db):
    return UserFactory()


# Patch get_cached to always call the callback directly (skip cache in tests)
@pytest.fixture(autouse=True)
def bypass_cache():
    with patch("apps.cms.views.get_cached", side_effect=lambda name, cb, **kw: cb()):
        yield


# ---------------------------------------------------------------------------
# Site Settings
# ---------------------------------------------------------------------------


class TestPublicSiteSettings:
    def test_returns_settings(self, anon_client, db):
        SiteSettingsFactory(company_email="info@abs.com")
        resp = anon_client.get("/api/v1/cms/settings/")
        assert resp.status_code == 200
        assert resp.data["company_email"] == "info@abs.com"


# ---------------------------------------------------------------------------
# Page Meta
# ---------------------------------------------------------------------------


class TestPublicPageMeta:
    def test_get_by_route(self, anon_client, db):
        PageMetaFactory(route="/about", title="About Us")
        resp = anon_client.get("/api/v1/cms/meta/", {"route": "/about"})
        assert resp.status_code == 200
        assert resp.data["title"] == "About Us"

    def test_404_for_missing_route(self, anon_client, db):
        resp = anon_client.get("/api/v1/cms/meta/", {"route": "/nonexistent"})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Hero Section
# ---------------------------------------------------------------------------


class TestPublicHero:
    def test_returns_published_hero(self, anon_client, user):
        hero = HeroSectionFactory(
            page="home", headline="Welcome", created_by=user, updated_by=user
        )
        hero.transition_to("review", user=user)
        hero.transition_to("approved", user=user)
        hero.transition_to("published", user=user)
        resp = anon_client.get("/api/v1/cms/hero/", {"page": "home"})
        assert resp.status_code == 200
        assert resp.data["headline"] == "Welcome"

    def test_draft_hero_not_returned(self, anon_client, user):
        HeroSectionFactory(
            page="home", status="draft", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/hero/", {"page": "home"})
        assert resp.status_code == 404

    def test_review_hero_not_returned(self, anon_client, user):
        HeroSectionFactory(
            page="home", status="review", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/hero/", {"page": "home"})
        assert resp.status_code == 404

    def test_archived_hero_not_returned(self, anon_client, user):
        HeroSectionFactory(
            page="home", status="archived", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/hero/", {"page": "home"})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Page Blocks
# ---------------------------------------------------------------------------


class TestPublicBlocks:
    def test_returns_published_blocks_ordered(self, anon_client, user):
        b2 = PageBlockFactory(
            page="home",
            order=2,
            title="Second",
            status="published",
            created_by=user,
            updated_by=user,
        )
        b1 = PageBlockFactory(
            page="home",
            order=1,
            title="First",
            status="published",
            created_by=user,
            updated_by=user,
        )
        resp = anon_client.get("/api/v1/cms/blocks/", {"page": "home"})
        assert resp.status_code == 200
        assert len(resp.data) == 2
        assert resp.data[0]["title"] == "First"

    def test_excludes_draft_blocks(self, anon_client, user):
        PageBlockFactory(page="home", status="draft", created_by=user, updated_by=user)
        PageBlockFactory(
            page="home", status="published", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/blocks/", {"page": "home"})
        assert len(resp.data) == 1


# ---------------------------------------------------------------------------
# Navigation
# ---------------------------------------------------------------------------


class TestPublicNavigation:
    def test_returns_active_root_items(self, anon_client, db):
        NavigationItemFactory(label="Home", location="header", is_active=True)
        NavigationItemFactory(label="Hidden", location="header", is_active=False)
        resp = anon_client.get("/api/v1/cms/navigation/", {"location": "header"})
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]["label"] == "Home"

    def test_filters_by_location(self, anon_client, db):
        NavigationItemFactory(label="Header Item", location="header")
        NavigationItemFactory(label="Footer Item", location="footer")
        resp = anon_client.get("/api/v1/cms/navigation/", {"location": "footer"})
        assert len(resp.data) == 1
        assert resp.data[0]["label"] == "Footer Item"


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------


class TestPublicServices:
    def test_returns_published_services(self, anon_client, user):
        ServiceOfferingFactory(
            title="Consulting", status="published", created_by=user, updated_by=user
        )
        ServiceOfferingFactory(
            title="Draft Service", status="draft", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/services/")
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]["title"] == "Consulting"


# ---------------------------------------------------------------------------
# Case Studies
# ---------------------------------------------------------------------------


class TestPublicCaseStudies:
    def test_list_published_only(self, anon_client, user):
        CaseStudyFactory(
            title="Published CS", status="published", created_by=user, updated_by=user
        )
        CaseStudyFactory(
            title="Draft CS", status="draft", created_by=user, updated_by=user
        )
        resp = anon_client.get("/api/v1/cms/case-studies/")
        assert len(resp.data) == 1

    def test_detail_by_slug(self, anon_client, user):
        cs = CaseStudyFactory(
            slug="test-case", status="published", created_by=user, updated_by=user
        )
        resp = anon_client.get(f"/api/v1/cms/case-studies/{cs.slug}/")
        assert resp.status_code == 200
        assert resp.data["slug"] == "test-case"

    def test_detail_404_for_draft(self, anon_client, user):
        cs = CaseStudyFactory(
            slug="draft-case", status="draft", created_by=user, updated_by=user
        )
        resp = anon_client.get(f"/api/v1/cms/case-studies/{cs.slug}/")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Cache-Control headers
# ---------------------------------------------------------------------------


class TestCacheHeaders:
    def test_cache_control_header_set(self, anon_client, db):
        SiteSettingsFactory(company_email="cache@test.com")
        resp = anon_client.get("/api/v1/cms/settings/")
        assert "max-age=600" in resp["Cache-Control"]
        assert "s-maxage=3600" in resp["Cache-Control"]


# ---------------------------------------------------------------------------
# Documentation Pages
# ---------------------------------------------------------------------------


class TestPublicDocumentation:
    def test_list_published_only(self, anon_client, user):
        DocumentationPageFactory(
            title="Published Doc",
            slug="published-doc",
            status="published",
            created_by=user,
            updated_by=user,
        )
        DocumentationPageFactory(
            title="Draft Doc",
            slug="draft-doc",
            status="draft",
            created_by=user,
            updated_by=user,
        )
        resp = anon_client.get("/api/v1/cms/documentation/")
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]["title"] == "Published Doc"

    def test_ordered_by_order_field(self, anon_client, user):
        DocumentationPageFactory(
            title="Second",
            slug="second",
            order=2,
            status="published",
            created_by=user,
            updated_by=user,
        )
        DocumentationPageFactory(
            title="First",
            slug="first",
            order=1,
            status="published",
            created_by=user,
            updated_by=user,
        )
        resp = anon_client.get("/api/v1/cms/documentation/")
        assert resp.data[0]["title"] == "First"
        assert resp.data[1]["title"] == "Second"

    def test_returns_content_field(self, anon_client, user):
        DocumentationPageFactory(
            title="With Content",
            slug="with-content",
            content="<p>Hello world</p>",
            status="published",
            created_by=user,
            updated_by=user,
        )
        resp = anon_client.get("/api/v1/cms/documentation/")
        assert resp.data[0]["content"] == "<p>Hello world</p>"

    def test_empty_when_no_published(self, anon_client, db):
        resp = anon_client.get("/api/v1/cms/documentation/")
        assert resp.status_code == 200
        assert resp.data == []


# ---------------------------------------------------------------------------
# API Endpoint Groups
# ---------------------------------------------------------------------------


class TestPublicAPIEndpoints:
    def test_list_active_groups_with_endpoints(self, anon_client, db):
        group = APIEndpointGroupFactory(name="Products", slug="products")
        APIEndpointFactory(
            group=group, method="GET", path="/products", description="List products"
        )
        APIEndpointFactory(
            group=group,
            method="POST",
            path="/products",
            description="Create product",
        )
        resp = anon_client.get("/api/v1/cms/api-endpoints/")
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]["name"] == "Products"
        assert len(resp.data[0]["endpoints"]) == 2

    def test_excludes_inactive_groups(self, anon_client, db):
        APIEndpointGroupFactory(name="Active", slug="active", is_active=True)
        APIEndpointGroupFactory(name="Inactive", slug="inactive", is_active=False)
        resp = anon_client.get("/api/v1/cms/api-endpoints/")
        assert len(resp.data) == 1
        assert resp.data[0]["name"] == "Active"

    def test_ordered_by_order_field(self, anon_client, db):
        APIEndpointGroupFactory(name="Second", slug="second", order=2)
        APIEndpointGroupFactory(name="First", slug="first", order=1)
        resp = anon_client.get("/api/v1/cms/api-endpoints/")
        assert resp.data[0]["name"] == "First"
        assert resp.data[1]["name"] == "Second"

    def test_endpoint_fields(self, anon_client, db):
        group = APIEndpointGroupFactory(
            name="Test", slug="test", badge_class="bg-blue-50"
        )
        APIEndpointFactory(
            group=group,
            method="PATCH",
            path="/test/{id}",
            description="Update test",
            order=0,
        )
        resp = anon_client.get("/api/v1/cms/api-endpoints/")
        ep = resp.data[0]["endpoints"][0]
        assert ep["method"] == "PATCH"
        assert ep["path"] == "/test/{id}"
        assert ep["description"] == "Update test"

    def test_empty_when_no_groups(self, anon_client, db):
        resp = anon_client.get("/api/v1/cms/api-endpoints/")
        assert resp.status_code == 200
        assert resp.data == []
