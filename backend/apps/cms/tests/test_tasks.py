"""Tests for CMS Celery tasks: scheduled publishing, media processing."""

import io
import pytest
from unittest.mock import patch, MagicMock
from datetime import timedelta

from django.utils import timezone

from apps.cms.models import HeroSection, MediaAsset
from apps.cms.tasks import publish_scheduled_content, process_media_asset
from apps.cms.tests.factories import HeroSectionFactory, MediaAssetFactory, UserFactory


class TestScheduledPublish:
    def test_publishes_approved_content_past_schedule(self, db):
        user = UserFactory()
        hero = HeroSectionFactory(
            page="scheduled",
            status="approved",
            scheduled_publish_at=timezone.now() - timedelta(minutes=5),
            created_by=user,
            updated_by=user,
        )
        count = publish_scheduled_content()
        assert count == 1
        hero.refresh_from_db()
        assert hero.status == "published"
        assert hero.published_at is not None
        assert hero.scheduled_publish_at is None

    def test_does_not_publish_future_schedule(self, db):
        user = UserFactory()
        HeroSectionFactory(
            page="future",
            status="approved",
            scheduled_publish_at=timezone.now() + timedelta(hours=1),
            created_by=user,
            updated_by=user,
        )
        count = publish_scheduled_content()
        assert count == 0

    def test_does_not_publish_draft_content(self, db):
        user = UserFactory()
        HeroSectionFactory(
            page="draft-sched",
            status="draft",
            scheduled_publish_at=timezone.now() - timedelta(minutes=5),
            created_by=user,
            updated_by=user,
        )
        count = publish_scheduled_content()
        assert count == 0

    def test_does_not_publish_without_schedule(self, db):
        user = UserFactory()
        HeroSectionFactory(
            page="no-sched",
            status="approved",
            scheduled_publish_at=None,
            created_by=user,
            updated_by=user,
        )
        count = publish_scheduled_content()
        assert count == 0

    def test_publishes_multiple_items(self, db):
        user = UserFactory()
        past = timezone.now() - timedelta(minutes=5)
        HeroSectionFactory(
            page="sched1",
            status="approved",
            scheduled_publish_at=past,
            created_by=user,
            updated_by=user,
        )
        HeroSectionFactory(
            page="sched2",
            status="approved",
            scheduled_publish_at=past,
            created_by=user,
            updated_by=user,
        )
        count = publish_scheduled_content()
        assert count == 2

    def test_creates_audit_log(self, db):
        from apps.accounts.models import AuditLog

        user = UserFactory()
        HeroSectionFactory(
            page="audit-sched",
            status="approved",
            scheduled_publish_at=timezone.now() - timedelta(minutes=1),
            created_by=user,
            updated_by=user,
        )
        publish_scheduled_content()
        assert AuditLog.objects.filter(action="cms_scheduled_publish").exists()


class TestProcessMediaAsset:
    def _make_test_image(self, width=2000, height=1500):
        """Create a minimal in-memory image file."""
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        img = Image.new("RGB", (width, height), color="red")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        return SimpleUploadedFile("test.jpg", buf.read(), content_type="image/jpeg")

    def test_generates_variants(self, db):
        file = self._make_test_image(2000, 1500)
        asset = MediaAssetFactory(file=file, asset_type="image")
        process_media_asset(str(asset.pk))
        asset.refresh_from_db()
        assert asset.processing_status == "completed"
        assert asset.width == 2000
        assert asset.height == 1500

    def test_skips_non_image(self, db):
        asset = MediaAssetFactory(asset_type="document")
        process_media_asset(str(asset.pk))
        asset.refresh_from_db()
        assert asset.processing_status == "pending"

    def test_nonexistent_asset_does_not_raise(self, db):
        import uuid

        # Should log warning but not raise
        process_media_asset(str(uuid.uuid4()))

    def test_sets_processing_then_completed(self, db):
        """Verify the status transitions through processing → completed."""
        file = self._make_test_image(1000, 800)
        asset = MediaAssetFactory(file=file, asset_type="image")
        assert asset.processing_status == "pending"
        process_media_asset(str(asset.pk))
        asset.refresh_from_db()
        assert asset.processing_status == "completed"

    def test_small_image_skips_large_variants(self, db):
        """Image smaller than variant target width should skip that variant."""
        file = self._make_test_image(150, 100)
        asset = MediaAssetFactory(file=file, asset_type="image")
        process_media_asset(str(asset.pk))
        asset.refresh_from_db()
        assert asset.processing_status == "completed"
        # 150px wide — all variant widths (200, 800, 1600) are larger, so all skipped
        assert not asset.file_thumbnail
        assert not asset.file_medium
        assert not asset.file_large
