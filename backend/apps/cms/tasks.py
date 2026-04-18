import io
import logging

from celery import shared_task
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def publish_scheduled_content():
    """Publish content whose scheduled_publish_at has passed.

    Runs every 60 seconds via Celery Beat. Follows existing pattern
    in subscriptions/tasks.py (check_trial_expiry).
    """
    from apps.cms.mixins import PublishableMixin
    from apps.cms.models import (
        HeroSection,
        PageBlock,
        ServiceOffering,
        ArcplusModule,
        PricingPlan,
        SupportTier,
        CaseStudy,
    )
    from apps.accounts.models import log_admin_action

    now = timezone.now()
    publishable_models = [
        HeroSection,
        PageBlock,
        ServiceOffering,
        ArcplusModule,
        PricingPlan,
        SupportTier,
        CaseStudy,
    ]

    published_count = 0
    for model in publishable_models:
        qs = model.objects.filter(
            status="approved",
            scheduled_publish_at__lte=now,
        )
        for item in qs:
            item.status = "published"
            item.published_at = now
            item.scheduled_publish_at = None
            item.save()

            log_admin_action(
                user=item.updated_by or item.created_by,
                action="cms_scheduled_publish",
                resource_type=model.__name__,
                resource_id=str(item.pk),
                changes={"status": "published", "scheduled": True},
            )
            published_count += 1

    if published_count:
        logger.info(f"Scheduled publish: {published_count} items published")

    return published_count


@shared_task(bind=True, max_retries=3)
def process_media_asset(self, asset_id):
    """Generate WebP + thumbnail/medium/large variants for an image asset.

    Triggered by post_save signal on MediaAsset when asset_type='image'.
    """
    from apps.cms.models import MediaAsset

    try:
        asset = MediaAsset.objects.get(pk=asset_id)
    except MediaAsset.DoesNotExist:
        logger.warning(f"MediaAsset {asset_id} not found, skipping processing")
        return

    if asset.asset_type != "image":
        return

    asset.processing_status = "processing"
    MediaAsset.objects.filter(pk=asset.pk).update(processing_status="processing")

    try:
        from PIL import Image
        from django.core.files.base import ContentFile

        img = Image.open(asset.file)
        asset_width, asset_height = img.size

        # Store original dimensions on the instance (will be saved later)
        asset.width = asset_width
        asset.height = asset_height

        sizes = {
            "file_thumbnail": 200,
            "file_medium": 800,
            "file_large": 1600,
        }

        base_name = (
            asset.filename.rsplit(".", 1)[0]
            if "." in asset.filename
            else asset.filename
        )

        for field_name, target_width in sizes.items():
            if asset_width <= target_width:
                continue
            ratio = target_width / asset_width
            target_height = int(asset_height * ratio)
            resized = img.resize((target_width, target_height), Image.LANCZOS)

            buf = io.BytesIO()
            resized.save(buf, format="WebP", quality=85)
            buf.seek(0)
            filename = f"{base_name}_{target_width}w.webp"
            getattr(asset, field_name).save(
                filename, ContentFile(buf.read()), save=False
            )

        # WebP version of original
        buf = io.BytesIO()
        img.save(buf, format="WebP", quality=90)
        buf.seek(0)
        webp_filename = f"{base_name}.webp"
        asset.file_webp.save(webp_filename, ContentFile(buf.read()), save=False)

        asset.processing_status = "completed"
        asset.save()

        logger.info(f"MediaAsset {asset_id} processed successfully")

    except Exception as exc:
        MediaAsset.objects.filter(pk=asset.pk).update(processing_status="failed")
        logger.error(f"MediaAsset {asset_id} processing failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
