"""Mixin used by every admin viewset that mutates CMS state.

Why this exists
---------------
Audit-log coverage drifts when each viewset hand-rolls its own
``log_admin_action(...)`` call: a new viewset gets added, the developer
forgets the audit line, and we silently lose visibility on a class of
admin mutations. The CI lint at ``backend/scripts/check_audit_coverage.py``
walks the AST of ``apps/cms/admin_views.py`` and fails the build if a
class declares a write handler (``post`` / ``put`` / ``patch`` / ``delete``)
without inheriting from :class:`AuditedAdminMixin` — so the marker is the
forcing function and ``self.audit(...)`` is the canonical call.

Pure read-only viewsets (only a ``get`` handler) don't need this mixin.
A mutating view that genuinely should not write to the audit log can opt
out via ``audit_exempt = True`` plus a one-line ``# audit-exempt: <reason>``
comment, which the lint allowlists but a reviewer can still see.
"""

from __future__ import annotations

from typing import Any, Mapping

from apps.accounts.models import log_admin_action


class AuditedAdminMixin:
    """Adds :py:meth:`audit` to admin viewsets and marks them audit-aware.

    Class attributes
    ----------------
    audit_resource_type:
        Override the resource label written to ``AuditLog.resource_type``.
        Falls back to ``self.model.__name__`` when unset (the publishable
        base classes set ``model``).
    audit_action_prefix:
        Used by :py:meth:`audit_create` / :py:meth:`audit_update` /
        :py:meth:`audit_delete` to build the action key
        ``cms_<prefix>_<verb>``. Required only when those helpers are used.
    audit_exempt:
        Marker recognized by the CI lint to allow a mutating view to skip
        audit logging. Use sparingly and document why.
    """

    audit_resource_type: str | None = None
    audit_action_prefix: str | None = None
    audit_exempt: bool = False

    def audit(
        self,
        action: str,
        resource_id: Any,
        changes: Mapping[str, Any] | None = None,
        *,
        resource_type: str | None = None,
    ) -> None:
        """Record one entry in :class:`apps.accounts.models.AuditLog`.

        ``resource_type`` resolution order:
        explicit kwarg → ``self.audit_resource_type`` → ``self.model.__name__``.
        Raises if none can be resolved, since an unlabelled audit row is
        worse than a missing one.
        """
        rt = resource_type or self.audit_resource_type
        if rt is None:
            model = getattr(self, "model", None)
            if model is not None:
                rt = model.__name__
        if rt is None:
            raise RuntimeError(
                f"{type(self).__name__}.audit(): cannot resolve resource_type. "
                "Set audit_resource_type, set self.model, or pass "
                "resource_type=... explicitly."
            )
        log_admin_action(
            user=self.request.user,
            action=action,
            resource_type=rt,
            resource_id=str(resource_id),
            changes=dict(changes) if changes else {},
            request=self.request,
        )

    def audit_create(self, instance: Any, changes: Mapping[str, Any]) -> None:
        self._require_prefix("audit_create")
        self.audit(
            f"cms_{self.audit_action_prefix}_create",
            instance.pk,
            changes,
        )

    def audit_update(self, pk: Any, changes: Mapping[str, Any]) -> None:
        self._require_prefix("audit_update")
        self.audit(
            f"cms_{self.audit_action_prefix}_update",
            pk,
            changes,
        )

    def audit_delete(self, pk: Any) -> None:
        self._require_prefix("audit_delete")
        self.audit(
            f"cms_{self.audit_action_prefix}_delete",
            pk,
            {},
        )

    def _require_prefix(self, helper: str) -> None:
        if not self.audit_action_prefix:
            raise RuntimeError(
                f"{type(self).__name__}.{helper}(): audit_action_prefix is required."
            )
