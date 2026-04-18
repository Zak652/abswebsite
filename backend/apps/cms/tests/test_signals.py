"""Tests for CMS signals: auto-revisions, cache invalidation, image processing trigger."""

import pytest
from unittest.mock import patch

from django.contrib.contenttypes.models import ContentType

from apps.cms.models import ContentRevision, HeroSection, MediaAsset
from apps.cms.tests.factories import HeroSectionFactory, MediaAssetFactory, UserFactory


class TestRevisionAutoCreation:
    def test_revision_created_on_save(self, db):
        hero = HeroSectionFactory()
        ct = ContentType.objects.get_for_model(HeroSection)
        revisions = ContentRevision.objects.filter(
            content_type=ct, object_id=str(hero.pk)
        )
        assert revisions.count() == 1

    def test_revision_number_increments(self, db):
        hero = HeroSectionFactory()
        hero.headline = "Updated 1"
        hero.save()
        hero.refresh_from_db()
        hero.headline = "Updated 2"
        hero.save()

        ct = ContentType.objects.get_for_model(HeroSection)
        revisions = ContentRevision.objects.filter(
            content_type=ct, object_id=str(hero.pk)
        ).order_by("revision_number")
        assert revisions.count() == 3
        assert list(revisions.values_list("revision_number", flat=True)) == [1, 2, 3]

    def test_revision_stores_data_snapshot(self, db):
        hero = HeroSectionFactory(headline="Original")
        ct = ContentType.objects.get_for_model(HeroSection)
        rev = ContentRevision.objects.filter(
            content_type=ct, object_id=str(hero.pk)
        ).first()
        assert rev.data["headline"] == "Original"

    def test_revision_stores_status(self, db):
        hero = HeroSectionFactory()
        ct = ContentType.objects.get_for_model(HeroSection)
        rev = ContentRevision.objects.filter(
            content_type=ct, object_id=str(hero.pk)
        ).first()
        assert rev.status_at_revision == "draft"

    def test_revision_stores_created_by(self, db):
        user = UserFactory()
        hero = HeroSectionFactory(created_by=user, updated_by=user)
        ct = ContentType.objects.get_for_model(HeroSection)
        rev = ContentRevision.objects.filter(
            content_type=ct, object_id=str(hero.pk)
        ).first()
        assert rev.created_by == user


class TestCacheInvalidation:
    @patch("apps.cms.signals.invalidate_model")
    def test_cache_invalidated_on_save(self, mock_invalidate, db):
        HeroSectionFactory()
        mock_invalidate.assert_called()
        # Find the call for "hero"
        call_args = [c[0][0] for c in mock_invalidate.call_args_list]
        assert "hero" in call_args

    @patch("apps.cms.signals.invalidate_model")
    def test_cache_invalidated_on_delete(self, mock_invalidate, db):
        hero = HeroSectionFactory()
        mock_invalidate.reset_mock()
        hero.delete()
        call_args = [c[0][0] for c in mock_invalidate.call_args_list]
        assert "hero" in call_args


class TestImageProcessingTrigger:
    @patch("apps.cms.tasks.process_media_asset")
    def test_processing_triggered_for_new_image(self, mock_task, db):
        MediaAssetFactory(asset_type="image")
        mock_task.delay.assert_called_once()

    @patch("apps.cms.tasks.process_media_asset")
    def test_processing_not_triggered_for_non_image(self, mock_task, db):
        MediaAssetFactory(asset_type="document")
        mock_task.delay.assert_not_called()
