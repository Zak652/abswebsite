"""Alt-text constraint on image media assets (build guide § 3.1).

Two layers covered:
- Upload (POST /api/v1/admin/cms/media/) via MediaAssetUploadSerializer.
- Update (PATCH /api/v1/admin/cms/media/<id>/) via the bespoke patch
  handler that bypasses a serializer.

Documents/videos still allow blank alt_text — only images carry the
accessibility requirement.
"""
from __future__ import annotations

import io

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.cms.models import MediaAsset


def _png_bytes() -> bytes:
    """Return a minimal valid PNG so Pillow's verify() passes."""
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color="red").save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def png_upload():
    return SimpleUploadedFile(
        "tiny.png", _png_bytes(), content_type="image/png"
    )


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


def test_image_upload_requires_alt_text(admin_client, png_upload):
    res = admin_client.post(
        "/api/v1/admin/cms/media/",
        {"file": png_upload, "asset_type": "image", "alt_text": ""},
        format="multipart",
    )
    assert res.status_code == 400
    assert "alt_text" in res.data


def test_image_upload_with_whitespace_only_alt_text_is_rejected(
    admin_client, png_upload,
):
    res = admin_client.post(
        "/api/v1/admin/cms/media/",
        {
            "file": png_upload,
            "asset_type": "image",
            "alt_text": "   \t  ",
        },
        format="multipart",
    )
    assert res.status_code == 400
    assert "alt_text" in res.data


def test_image_upload_with_real_alt_text_succeeds(admin_client, png_upload):
    res = admin_client.post(
        "/api/v1/admin/cms/media/",
        {
            "file": png_upload,
            "asset_type": "image",
            "alt_text": "Warehouse worker scanning a pallet barcode",
        },
        format="multipart",
    )
    assert res.status_code == 201, res.data
    asset = MediaAsset.objects.get(pk=res.data["id"])
    assert asset.alt_text.startswith("Warehouse")


def test_document_upload_does_not_require_alt_text(admin_client):
    pdf = SimpleUploadedFile("d.pdf", b"%PDF-1.4\n", content_type="application/pdf")
    res = admin_client.post(
        "/api/v1/admin/cms/media/",
        {"file": pdf, "asset_type": "document", "alt_text": ""},
        format="multipart",
    )
    # Document validation is separate; this assert is about NOT being
    # blocked by the alt-text rule. A 400 is still acceptable if it's
    # for a different reason (PDF magic-byte check, size, etc.).
    if res.status_code == 400:
        assert "alt_text" not in res.data


# ---------------------------------------------------------------------------
# PATCH
# ---------------------------------------------------------------------------


def test_patch_blanking_alt_text_on_image_is_rejected(admin_client, png_upload):
    create = admin_client.post(
        "/api/v1/admin/cms/media/",
        {"file": png_upload, "asset_type": "image", "alt_text": "Initial alt"},
        format="multipart",
    )
    assert create.status_code == 201
    pk = create.data["id"]

    res = admin_client.patch(
        f"/api/v1/admin/cms/media/{pk}/",
        {"alt_text": ""},
        format="json",
    )
    assert res.status_code == 400
    assert "alt_text" in res.data


def test_patch_changing_alt_text_to_a_valid_value_succeeds(
    admin_client, png_upload,
):
    create = admin_client.post(
        "/api/v1/admin/cms/media/",
        {"file": png_upload, "asset_type": "image", "alt_text": "Initial alt"},
        format="multipart",
    )
    pk = create.data["id"]

    res = admin_client.patch(
        f"/api/v1/admin/cms/media/{pk}/",
        {"alt_text": "Updated alt for warehouse photo"},
        format="json",
    )
    assert res.status_code == 200
    asset = MediaAsset.objects.get(pk=pk)
    assert asset.alt_text == "Updated alt for warehouse photo"


def test_patch_caption_only_on_image_does_not_trigger_alt_check(
    admin_client, png_upload,
):
    create = admin_client.post(
        "/api/v1/admin/cms/media/",
        {"file": png_upload, "asset_type": "image", "alt_text": "Initial alt"},
        format="multipart",
    )
    pk = create.data["id"]

    res = admin_client.patch(
        f"/api/v1/admin/cms/media/{pk}/",
        {"caption": "New caption text"},
        format="json",
    )
    assert res.status_code == 200
