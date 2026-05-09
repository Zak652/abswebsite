"""Operational endpoints (health, request id) — keep deliberately tiny.

The health view is reachable unauthenticated and is hit by Docker
HEALTHCHECK + the App Platform liveness probe. Returns 200 only when DB
and Redis both respond; any failure flips to 503.
"""
from __future__ import annotations

import time

from django.db import connection
from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView


class _NoThrottle(AnonRateThrottle):
    """Health probes shouldn't be subject to throttles."""

    def allow_request(self, request, view):
        return True


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [_NoThrottle]
    authentication_classes: list = []  # don't run JWT decode for a probe

    def get(self, request):
        checks = {"db": False, "redis": False}
        status_code = 200

        try:
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            checks["db"] = True
        except Exception:
            status_code = 503

        try:
            probe_key = "_health_probe"
            cache.set(probe_key, "1", timeout=2)
            checks["redis"] = cache.get(probe_key) == "1"
            if not checks["redis"]:
                status_code = 503
        except Exception:
            status_code = 503

        return Response(
            {**checks, "time": int(time.time())},
            status=status_code,
        )
