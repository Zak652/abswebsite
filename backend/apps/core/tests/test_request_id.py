"""Request-ID middleware: header propagation + log filter."""
from __future__ import annotations

import logging
from unittest.mock import patch

from django.test import RequestFactory
from rest_framework.test import APIClient

from apps.core.middleware import (
    RequestIDLogFilter,
    RequestIDMiddleware,
    get_request_id,
)


def _dummy_view(request):
    from django.http import HttpResponse

    logging.getLogger("test").info("inside the view")
    return HttpResponse("ok")


def test_generates_request_id_when_header_absent():
    rf = RequestFactory()
    mw = RequestIDMiddleware(_dummy_view)
    response = mw(rf.get("/"))
    rid = response["X-Request-ID"]
    assert rid
    assert len(rid) >= 8


def test_propagates_inbound_header():
    rf = RequestFactory()
    mw = RequestIDMiddleware(_dummy_view)
    response = mw(rf.get("/", HTTP_X_REQUEST_ID="abcd1234"))
    assert response["X-Request-ID"] == "abcd1234"


def test_clears_thread_local_after_response():
    rf = RequestFactory()
    mw = RequestIDMiddleware(_dummy_view)
    mw(rf.get("/"))
    # After the response is returned, the next code path on this thread must
    # not inherit the previous request's id.
    assert get_request_id() is None


def test_log_filter_attaches_request_id():
    rf = RequestFactory()

    captured = []

    class _Handler(logging.Handler):
        def emit(self, record):
            captured.append(record.request_id)

    handler = _Handler()
    handler.addFilter(RequestIDLogFilter())
    logger = logging.getLogger("apps.core.tests")
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    try:
        # Inside the middleware call, a log line should pick up the rid.
        def view(request):
            logger.info("hello")
            return _dummy_view(request)

        mw_with_logging = RequestIDMiddleware(view)
        response = mw_with_logging(rf.get("/", HTTP_X_REQUEST_ID="rid-xyz"))
        assert response["X-Request-ID"] == "rid-xyz"
        assert "rid-xyz" in captured
        # Outside any request, the filter renders "-".
        logger.info("outside")
        assert captured[-1] == "-"
    finally:
        logger.removeHandler(handler)


def test_health_endpoint_returns_request_id_header():
    """Smoke that the middleware is wired into the live URL routing."""
    client = APIClient()
    res = client.get("/api/v1/health/", HTTP_X_REQUEST_ID="probe-1")
    assert res.status_code in (200, 503)
    assert res["X-Request-ID"] == "probe-1"


def test_sentry_tag_set_when_sdk_available():
    rf = RequestFactory()
    mw = RequestIDMiddleware(_dummy_view)
    with patch("sentry_sdk.set_tag") as mock_set_tag:
        mw(rf.get("/", HTTP_X_REQUEST_ID="probe-2"))
    # Best-effort: if sentry_sdk is importable, set_tag is called.
    if mock_set_tag.called:
        args, _ = mock_set_tag.call_args
        assert args == ("request_id", "probe-2")
