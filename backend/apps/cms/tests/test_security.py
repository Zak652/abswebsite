"""Tests for cms/security.py: HTML sanitisation, media validation, SSRF guard.

Covers § 2.4.1 (file upload), § 2.4.2 (HTML), § 2.4.3 (URL).
"""
from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.cms.security import (
    sanitise_html,
    validate_public_url,
    validate_uploaded_media,
)


# ---------------------------------------------------------------------------
# HTML sanitisation
# ---------------------------------------------------------------------------


def test_sanitise_strips_script_tags():
    raw = "<p>Hi</p><script>alert(1)</script>"
    cleaned = sanitise_html(raw)
    assert "<script>" not in cleaned
    assert "alert(1)" not in cleaned
    assert "<p>Hi</p>" in cleaned


def test_sanitise_strips_event_handlers():
    raw = '<img src="x" onerror="evil()" alt="x">'
    cleaned = sanitise_html(raw)
    assert "onerror" not in cleaned


def test_sanitise_keeps_safe_anchors_and_adds_rel():
    raw = '<a href="https://example.com" target="_blank">link</a>'
    cleaned = sanitise_html(raw)
    assert "noopener" in cleaned
    assert "noreferrer" in cleaned


def test_sanitise_blocks_javascript_protocol():
    raw = '<a href="javascript:alert(1)">x</a>'
    cleaned = sanitise_html(raw)
    assert "javascript:" not in cleaned


def test_sanitise_empty_returns_empty():
    assert sanitise_html("") == ""


# ---------------------------------------------------------------------------
# Media validation
# ---------------------------------------------------------------------------


def _png_bytes(size: int = 100) -> bytes:
    """A minimal valid PNG header followed by padding so size > threshold tests
    can be exercised without a giant fixture."""
    header = b"\x89PNG\r\n\x1a\n" + b"\x00" * (size - 8)
    return header


def _jpeg_bytes(size: int = 100) -> bytes:
    return b"\xff\xd8\xff" + b"\x00" * (size - 3)


def test_rejects_unknown_asset_type():
    f = SimpleUploadedFile("a.png", _png_bytes(), content_type="image/png")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "weapon")


def test_rejects_disallowed_mime_for_image():
    f = SimpleUploadedFile("evil.exe", b"MZ\x90\x00", content_type="application/x-msdownload")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "image")


def test_rejects_oversize_image():
    big = _png_bytes(26 * 1024 * 1024)  # 26 MB > 25 MB cap
    f = SimpleUploadedFile("a.png", big, content_type="image/png")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "image")


def test_rejects_extension_mime_mismatch():
    f = SimpleUploadedFile("a.png", _jpeg_bytes(), content_type="image/jpeg")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "image")


def test_rejects_polyglot_with_wrong_magic_bytes():
    # Declared as PNG but bytes are JPEG.
    f = SimpleUploadedFile("a.png", _jpeg_bytes(), content_type="image/png")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "image")


def test_rejects_pdf_without_magic_bytes():
    f = SimpleUploadedFile("a.pdf", b"NotApdf", content_type="application/pdf")
    with pytest.raises(ValidationError):
        validate_uploaded_media(f, "document")


# ---------------------------------------------------------------------------
# SSRF guard
# ---------------------------------------------------------------------------


def test_rejects_localhost():
    with pytest.raises(ValidationError):
        validate_public_url("http://localhost/secrets")


def test_rejects_link_local_metadata():
    with pytest.raises(ValidationError):
        validate_public_url("http://169.254.169.254/")


def test_rejects_file_scheme():
    with pytest.raises(ValidationError):
        validate_public_url("file:///etc/passwd")


def test_rejects_private_ip_via_dns():
    # Force getaddrinfo to return a private IP.
    private = [(0, 0, 0, "", ("10.0.0.1", 0))]
    with patch("apps.cms.security.socket.getaddrinfo", return_value=private):
        with pytest.raises(ValidationError):
            validate_public_url("http://attacker.example/")


def test_accepts_public_url():
    public = [(0, 0, 0, "", ("142.250.72.110", 0))]
    with patch("apps.cms.security.socket.getaddrinfo", return_value=public):
        validate_public_url("https://example.com/page")  # no exception


def test_empty_url_accepted():
    validate_public_url("")  # no exception
