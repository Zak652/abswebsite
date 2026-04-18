import logging

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def cache_key(model_name, **kwargs):
    """Build a cache key: cms:hero:page=home"""
    params = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
    if params:
        return f"cms:{model_name}:{params}"
    return f"cms:{model_name}"


def invalidate_model(model_name):
    """Delete all cache keys for a model by using a versioned prefix.

    Since Django's cache backend doesn't support wildcard deletion,
    we use a version counter to effectively invalidate all keys.
    """
    version_key = f"cms:{model_name}:_version"
    try:
        cache.incr(version_key)
    except ValueError:
        cache.set(version_key, 1, timeout=None)


def versioned_cache_key(model_name, **kwargs):
    """Build a versioned cache key that changes when the model is invalidated."""
    version_key = f"cms:{model_name}:_version"
    version = cache.get(version_key, 0)
    base = cache_key(model_name, **kwargs)
    return f"{base}:v{version}"


def get_cached(model_name, callback, timeout=600, **kwargs):
    """Get from cache or execute callback and cache the result."""
    key = versioned_cache_key(model_name, **kwargs)
    result = cache.get(key)
    if result is None:
        result = callback()
        cache.set(key, result, timeout=timeout)
    return result


# ---------------------------------------------------------------------------
# Next.js ISR on-demand revalidation
# ---------------------------------------------------------------------------

# Map Django cache model names → Next.js ISR tags used in cms-server.ts
_MODEL_TO_ISR_TAGS = {
    "hero": ["cms-hero"],
    "blocks": ["cms-blocks"],
    "navigation": ["cms-nav"],
    "services": ["cms-services"],
    "arcplus_modules": ["cms-arcplus-modules"],
    "arcplus_pricing": ["cms-arcplus-pricing"],
    "support_tiers": ["cms-support-tiers"],
    "case_studies": ["cms-case-studies"],
    "settings": ["cms-settings"],
    "meta": ["cms-meta"],
    "product_gallery": ["cms-products"],
    "documentation_pages": ["cms-documentation"],
    "api_endpoint_groups": ["cms-api-endpoints"],
    "tag_categories": ["cms-tag-categories"],
    "scanner_features": ["cms-scanner-features"],
    "blog_categories": ["cms-blog-categories"],
    "blog_posts": ["cms-blog-posts"],
    "email_templates": [],
    "testimonials": ["cms-testimonials"],
}


def revalidate_frontend(model_name):
    """Call the Next.js /api/revalidate endpoint to purge ISR cache."""
    secret = getattr(settings, "REVALIDATION_SECRET", "")
    frontend_url = getattr(settings, "FRONTEND_URL", "")
    if not secret or not frontend_url:
        return

    tags = _MODEL_TO_ISR_TAGS.get(model_name, [])
    if not tags:
        return

    url = f"{frontend_url}/api/revalidate"
    try:
        resp = requests.post(
            url,
            json={"secret": secret, "tags": tags},
            timeout=2,
        )
        if resp.ok:
            logger.info("Revalidated Next.js ISR tags %s", tags)
        else:
            logger.warning(
                "Next.js revalidation returned %s: %s", resp.status_code, resp.text
            )
    except requests.RequestException as exc:
        logger.warning("Next.js revalidation failed: %s", exc)
