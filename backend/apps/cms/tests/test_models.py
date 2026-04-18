"""Tests for PublishableMixin and core CMS models."""

import pytest
from django.db import IntegrityError

from apps.cms.models import (
    ContentRevision,
    HeroSection,
    PageBlock,
    SiteSettings,
    NavigationItem,
)
from apps.cms.tests.factories import (
    HeroSectionFactory,
    NavigationItemFactory,
    PageBlockFactory,
    SiteSettingsFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# PublishableMixin
# ---------------------------------------------------------------------------


class TestPublishableMixin:
    def test_default_status_is_draft(self, db):
        hero = HeroSectionFactory()
        assert hero.status == "draft"

    def test_default_version_is_1(self, db):
        hero = HeroSectionFactory()
        hero.refresh_from_db()
        assert hero.version == 1

    def test_version_auto_increments_on_save(self, db):
        hero = HeroSectionFactory()
        hero.refresh_from_db()
        assert hero.version == 1
        hero.headline = "Updated"
        hero.save()
        hero.refresh_from_db()
        assert hero.version == 2

    def test_version_increments_multiple_times(self, db):
        hero = HeroSectionFactory()
        hero.refresh_from_db()
        for i in range(5):
            hero.headline = f"Update {i}"
            hero.save()
            hero.refresh_from_db()
        assert hero.version == 6  # 1 initial + 5 saves

    def test_valid_transition_draft_to_review(self, db):
        hero = HeroSectionFactory()
        assert hero.can_transition_to("review") is True

    def test_invalid_transition_draft_to_published(self, db):
        hero = HeroSectionFactory()
        assert hero.can_transition_to("published") is False

    def test_transition_to_valid_status(self, db):
        hero = HeroSectionFactory()
        user = hero.created_by
        hero.transition_to("review", user=user)
        assert hero.status == "review"

    def test_transition_to_invalid_status_raises(self, db):
        hero = HeroSectionFactory()
        with pytest.raises(ValueError, match="Cannot transition"):
            hero.transition_to("published")

    def test_transition_to_approved_sets_metadata(self, db):
        hero = HeroSectionFactory()
        user = hero.created_by
        hero.transition_to("review", user=user)
        hero.transition_to("approved", user=user)
        hero.refresh_from_db()
        assert hero.approved_by == user
        assert hero.approved_at is not None

    def test_transition_to_published_sets_published_at(self, db):
        hero = HeroSectionFactory()
        user = hero.created_by
        hero.transition_to("review", user=user)
        hero.transition_to("approved", user=user)
        hero.transition_to("published", user=user)
        hero.refresh_from_db()
        assert hero.published_at is not None
        assert hero.status == "published"

    def test_transition_to_published_clears_scheduled(self, db):
        from django.utils import timezone

        hero = HeroSectionFactory(scheduled_publish_at=timezone.now())
        user = hero.created_by
        hero.transition_to("review", user=user)
        hero.transition_to("approved", user=user)
        hero.transition_to("published", user=user)
        hero.refresh_from_db()
        assert hero.scheduled_publish_at is None

    def test_full_lifecycle(self, db):
        """draft → review → approved → published → archived → draft"""
        hero = HeroSectionFactory()
        user = hero.created_by

        hero.transition_to("review", user=user)
        assert hero.status == "review"

        hero.transition_to("approved", user=user)
        assert hero.status == "approved"

        hero.transition_to("published", user=user)
        assert hero.status == "published"

        hero.transition_to("archived", user=user)
        assert hero.status == "archived"

        hero.transition_to("draft", user=user)
        assert hero.status == "draft"

    def test_all_valid_transitions(self, db):
        from apps.cms.mixins import PublishableMixin

        for from_status, to_statuses in PublishableMixin.VALID_TRANSITIONS.items():
            for to_status in to_statuses:
                hero = HeroSectionFactory(status=from_status)
                assert hero.can_transition_to(to_status) is True


# ---------------------------------------------------------------------------
# SiteSettings (Singleton)
# ---------------------------------------------------------------------------


class TestSiteSettings:
    def test_singleton_enforced(self, db):
        SiteSettingsFactory(company_email="first@abs.com")
        SiteSettingsFactory(company_email="second@abs.com")
        assert SiteSettings.objects.count() == 1
        assert SiteSettings.objects.get().company_email == "second@abs.com"

    def test_singleton_always_pk_1(self, db):
        settings = SiteSettingsFactory()
        assert settings.pk == 1


# ---------------------------------------------------------------------------
# HeroSection (unique page)
# ---------------------------------------------------------------------------


class TestHeroSection:
    def test_unique_page_constraint(self, db):
        HeroSectionFactory(page="home")
        with pytest.raises(IntegrityError):
            HeroSectionFactory(page="home")

    def test_str_representation(self, db):
        hero = HeroSectionFactory(page="home", headline="Welcome")
        assert "home" in str(hero)


# ---------------------------------------------------------------------------
# NavigationItem (self-referencing)
# ---------------------------------------------------------------------------


class TestNavigationItem:
    def test_children_relationship(self, db):
        parent = NavigationItemFactory(label="Products")
        child = NavigationItemFactory(label="Scanners", parent=parent)
        assert child.parent == parent
        assert parent.children.count() == 1
        assert parent.children.first() == child

    def test_root_items_have_no_parent(self, db):
        item = NavigationItemFactory()
        assert item.parent is None


# ---------------------------------------------------------------------------
# PageBlock ordering
# ---------------------------------------------------------------------------


class TestPageBlock:
    def test_ordering_by_order_field(self, db):
        user = UserFactory()
        b2 = PageBlockFactory(page="home", order=2, created_by=user, updated_by=user)
        b1 = PageBlockFactory(page="home", order=1, created_by=user, updated_by=user)
        b3 = PageBlockFactory(page="home", order=3, created_by=user, updated_by=user)
        blocks = list(PageBlock.objects.filter(page="home"))
        assert blocks == [b1, b2, b3]
