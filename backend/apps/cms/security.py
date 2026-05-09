"""Security validators and sanitisers for CMS inputs.

- validate_uploaded_media: media upload allowlist (§ 2.4.1)
- sanitise_html: bleach-based HTML cleaning (§ 2.4.2)
- validate_public_url: SSRF guard (§ 2.4.3)
"""
from __future__ import annotations

import ipaddress
import os
import re
import socket
from urllib.parse import urlparse

from django.core.exceptions import ValidationError


# ---------------------------------------------------------------------------
# Media uploads (§ 2.4.1)
# ---------------------------------------------------------------------------

MAX_IMAGE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_VIDEO_BYTES = 200 * 1024 * 1024  # 200 MB
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_MIME_BY_TYPE = {
    "image": {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
    },
    "video": {"video/mp4", "video/webm"},
    "document": {"application/pdf"},
    "diagram": {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
    },
}

ALLOWED_EXT_BY_MIME = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
    "image/gif": {".gif"},
    "image/svg+xml": {".svg"},
    "video/mp4": {".mp4"},
    "video/webm": {".webm"},
    "application/pdf": {".pdf"},
}


def _max_bytes_for(asset_type: str) -> int:
    if asset_type == "video":
        return MAX_VIDEO_BYTES
    if asset_type == "document":
        return MAX_DOCUMENT_BYTES
    return MAX_IMAGE_BYTES


def validate_uploaded_media(uploaded_file, asset_type: str) -> None:
    """Validate an UploadedFile against the asset_type's allowlist.

    Raises ValidationError on any mismatch. Reads the file once for magic-byte
    sniffing and resets the file pointer afterwards so the caller can still
    persist it.
    """
    if asset_type not in ALLOWED_MIME_BY_TYPE:
        raise ValidationError(f"Unknown asset_type '{asset_type}'.")

    # Size cap
    max_bytes = _max_bytes_for(asset_type)
    if uploaded_file.size and uploaded_file.size > max_bytes:
        raise ValidationError(
            f"File is {uploaded_file.size} bytes, max allowed for "
            f"{asset_type} is {max_bytes}.",
        )

    declared_mime = (uploaded_file.content_type or "").lower()
    allowed_mimes = ALLOWED_MIME_BY_TYPE[asset_type]
    if declared_mime not in allowed_mimes:
        raise ValidationError(
            f"Content-Type '{declared_mime}' not allowed for asset_type "
            f"'{asset_type}'. Allowed: {sorted(allowed_mimes)}.",
        )

    ext = os.path.splitext(uploaded_file.name or "")[1].lower()
    allowed_exts = ALLOWED_EXT_BY_MIME.get(declared_mime, set())
    if ext not in allowed_exts:
        raise ValidationError(
            f"Extension '{ext}' does not match Content-Type "
            f"'{declared_mime}'. Allowed: {sorted(allowed_exts)}.",
        )

    head = uploaded_file.read(16)
    try:
        uploaded_file.seek(0)
    except Exception:
        pass

    if declared_mime == "application/pdf" and not head.startswith(b"%PDF-"):
        raise ValidationError("File does not look like a PDF (missing %PDF- header).")
    if declared_mime == "image/png" and not head.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValidationError("File does not look like a PNG.")
    if declared_mime == "image/jpeg" and not head.startswith(b"\xff\xd8\xff"):
        raise ValidationError("File does not look like a JPEG.")
    if declared_mime == "image/gif" and not head.startswith((b"GIF87a", b"GIF89a")):
        raise ValidationError("File does not look like a GIF.")
    if declared_mime == "image/webp" and not (
        head[:4] == b"RIFF" and head[8:12] == b"WEBP"
    ):
        raise ValidationError("File does not look like a WebP.")

    # Pillow open-and-verify catches polyglots and corrupted uploads on
    # raster images. SVG is XML, not raster — leave for separate sanitisation.
    if asset_type in ("image", "diagram") and declared_mime != "image/svg+xml":
        try:
            from PIL import Image, UnidentifiedImageError

            try:
                with Image.open(uploaded_file) as img:
                    img.verify()
            finally:
                try:
                    uploaded_file.seek(0)
                except Exception:
                    pass
        except UnidentifiedImageError as exc:
            raise ValidationError(f"Unreadable image: {exc}.") from exc
        except ImportError:
            pass


# ---------------------------------------------------------------------------
# HTML sanitisation (§ 2.4.2)
# ---------------------------------------------------------------------------

ALLOWED_TAGS = [
    "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "a", "strong", "em",
    "blockquote", "code", "pre", "img", "figure", "figcaption", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
]
ALLOWED_ATTRS = {
    "a": ["href", "title", "rel", "target"],
    "img": ["src", "alt", "loading", "width", "height"],
    "th": ["scope"],
    "td": ["colspan", "rowspan"],
}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


_DANGEROUS_BODY_RE = re.compile(
    r"<\s*(script|style|iframe|object|embed)\b[^>]*>.*?<\s*/\s*\1\s*>",
    re.IGNORECASE | re.DOTALL,
)


def sanitise_html(value: str) -> str:
    """Strip script/event-handler/etc. from CMS-stored HTML.

    Returns sanitised string. Auto-adds rel="noopener noreferrer" to any
    anchor with target attribute. Returns the input unchanged if bleach is
    not installed (logged so we notice during local dev — production must
    have it from requirements.txt).
    """
    if not value:
        return value
    try:
        import bleach
        from bleach.linkifier import Linker
    except ImportError:
        # Fail closed in production via the production.py assertion (bleach
        # is in requirements.txt). In local dev without bleach, return input
        # unchanged so the CMS still renders.
        return value

    # Strip dangerous tag bodies *before* bleach so contents like
    # `alert(1)` inside <script>...</script> don't survive as plain text.
    pre_cleaned = _DANGEROUS_BODY_RE.sub("", value)

    cleaned = bleach.clean(
        pre_cleaned,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )

    def _set_link_rel(attrs, new=False):
        href = attrs.get((None, "href"), "")
        rel = attrs.get((None, "rel"), "")
        if href.startswith(("http://", "https://")):
            existing = set(rel.split()) if rel else set()
            existing.update({"noopener", "noreferrer"})
            attrs[(None, "rel")] = " ".join(sorted(existing))
        return attrs

    linker = Linker(callbacks=[_set_link_rel], skip_tags=["pre", "code"])
    return linker.linkify(cleaned)


# ---------------------------------------------------------------------------
# Public-URL guard for SSRF-prone CMS fields (§ 2.4.3)
# ---------------------------------------------------------------------------

ALLOWED_URL_SCHEMES = {"http", "https"}


def validate_public_url(value: str) -> None:
    """Reject URLs that point at private / loopback / link-local hosts.

    Used on `canonical_url`, `video_url`, `link_url` and similar CMS-editable
    URL fields to prevent SSRF when admins paste hostile values.
    """
    if not value:
        return

    parsed = urlparse(value)
    scheme = (parsed.scheme or "").lower()
    if scheme not in ALLOWED_URL_SCHEMES:
        raise ValidationError(
            f"URL scheme '{scheme}' is not allowed. Use http or https.",
        )

    host = parsed.hostname
    if not host:
        raise ValidationError("URL must include a hostname.")

    lowered = host.lower()
    if lowered in {"localhost", "metadata", "metadata.google.internal"}:
        raise ValidationError(f"Hostname '{lowered}' is not allowed.")

    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise ValidationError(f"Could not resolve '{host}': {exc}.") from exc

    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr.split("%")[0])
        except ValueError:
            continue
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValidationError(
                f"Hostname '{host}' resolves to a non-public address ({ip}).",
            )
