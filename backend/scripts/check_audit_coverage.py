#!/usr/bin/env python3
"""Fail the build when a CMS admin view mutates state without auditing.

This is the enforcement leg of build guide § 3.9: every viewset in
``apps/cms/admin_views.py`` that defines a write handler
(``post`` / ``put`` / ``patch`` / ``delete``) must inherit from
:class:`apps.cms.admin_mixins.AuditedAdminMixin` (transitively counts —
inheriting from a base class that inherits the mixin is fine). A class
can opt out with a class-level ``audit_exempt = True`` and a comment
explaining why; the lint allowlists those but a reviewer still sees them
on the diff.

Run locally: ``python backend/scripts/check_audit_coverage.py``
Exit codes: 0 = clean, 1 = at least one offending class, 2 = file
parsing error / wrong invocation.

Notes
-----
This walks the AST so we don't need to import Django settings to lint.
Cross-file inheritance is intentionally NOT followed: every mutating
view should declare the mixin in its own bases or in a base class that
lives in the same file. That's a stronger guarantee with the same
import discipline already used in this file today.
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

MIXIN_NAME = "AuditedAdminMixin"
MUTATION_METHODS = {"post", "put", "patch", "delete"}

# Files where a mutating view *must* inherit AuditedAdminMixin.
TARGETS = [
    Path(__file__).resolve().parents[1] / "apps" / "cms" / "admin_views.py",
]


def _base_name(node: ast.expr) -> str | None:
    """Best-effort name extraction from an AST base expression."""
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _has_mutation_handler(cls: ast.ClassDef) -> bool:
    return any(
        isinstance(stmt, ast.FunctionDef) and stmt.name in MUTATION_METHODS
        for stmt in cls.body
    )


def _is_audit_exempt(cls: ast.ClassDef) -> bool:
    for stmt in cls.body:
        if isinstance(stmt, ast.Assign) and len(stmt.targets) == 1:
            target = stmt.targets[0]
            if isinstance(target, ast.Name) and target.id == "audit_exempt":
                if isinstance(stmt.value, ast.Constant) and stmt.value.value is True:
                    return True
        if (
            isinstance(stmt, ast.AnnAssign)
            and isinstance(stmt.target, ast.Name)
            and stmt.target.id == "audit_exempt"
            and stmt.value is not None
            and isinstance(stmt.value, ast.Constant)
            and stmt.value.value is True
        ):
            return True
    return False


def _inherits_mixin(
    cls: ast.ClassDef,
    classes_in_file: dict[str, ast.ClassDef],
    seen: set[str] | None = None,
) -> bool:
    seen = seen or set()
    if cls.name in seen:
        return False
    seen.add(cls.name)
    for base in cls.bases:
        name = _base_name(base)
        if name == MIXIN_NAME:
            return True
        if name and name in classes_in_file:
            if _inherits_mixin(classes_in_file[name], classes_in_file, seen):
                return True
    return False


def check_file(path: Path) -> list[str]:
    try:
        source = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return [f"{path}: file not found"]

    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        return [f"{path}:{exc.lineno}: SyntaxError: {exc.msg}"]

    classes = {n.name: n for n in tree.body if isinstance(n, ast.ClassDef)}
    failures: list[str] = []
    for cls in classes.values():
        if not _has_mutation_handler(cls):
            continue
        if _is_audit_exempt(cls):
            continue
        if _inherits_mixin(cls, classes):
            continue
        failures.append(
            f"{path}:{cls.lineno}: {cls.name} defines a write handler "
            "(post/put/patch/delete) but does not inherit "
            f"{MIXIN_NAME}. Add the mixin and call self.audit(...), "
            "or set audit_exempt = True with a justification comment."
        )
    return failures


def main(argv: list[str]) -> int:
    paths = [Path(p) for p in argv[1:]] if len(argv) > 1 else TARGETS
    all_failures: list[str] = []
    for path in paths:
        all_failures.extend(check_file(path))

    if all_failures:
        print("\n".join(all_failures), file=sys.stderr)
        print(
            f"\naudit-coverage check FAILED ({len(all_failures)} "
            "offending class(es))",
            file=sys.stderr,
        )
        return 1

    print(
        f"audit-coverage OK: every mutating view in {len(paths)} "
        f"file(s) inherits {MIXIN_NAME}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
