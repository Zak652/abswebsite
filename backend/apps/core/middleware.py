"""Request-scoped middleware.

`RequestIDMiddleware`
    Generates (or accepts inbound) a UUID for every request and threads it
    through:
      - the response as `X-Request-ID`
      - the Sentry scope as a `request_id` tag
      - thread-local storage so the JSON logger can include it on every log
        line emitted during the request

Combined with `python-json-logger`'s formatter (see settings.LOGGING) this
gives us "show me everything that happened during request abc-123" with no
extra effort at the call site.
"""
from __future__ import annotations

import threading
import uuid

_local = threading.local()


def get_request_id() -> str | None:
    return getattr(_local, "request_id", None)


class RequestIDMiddleware:
    """Generate/propagate a request id, expose it via header + log filter."""

    HEADER_IN = "HTTP_X_REQUEST_ID"
    HEADER_OUT = "X-Request-ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        rid = request.META.get(self.HEADER_IN) or uuid.uuid4().hex
        # Stash on the request for views, on thread-local for the log filter.
        request.request_id = rid
        _local.request_id = rid

        # If sentry-sdk is configured, surface the id as a tag so a Sentry
        # event search by request id Just Works.
        try:
            import sentry_sdk

            sentry_sdk.set_tag("request_id", rid)
        except Exception:
            pass

        try:
            response = self.get_response(request)
            response[self.HEADER_OUT] = rid
            return response
        finally:
            _local.request_id = None


class RequestIDLogFilter:
    """Logging filter that attaches the current request id to every record.

    Wired in via the LOGGING `filters` config — every record gets a
    `request_id` attribute that the JSON formatter then renders.
    """

    def filter(self, record):
        record.request_id = get_request_id() or "-"
        return True
