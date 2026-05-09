/**
 * API error normaliser.
 *
 * Why this exists
 * ---------------
 * Render-the-raw-`detail`-string is the classic information-leak path:
 * a backend stack trace, a database column name, or a half-finished
 * exception message can land verbatim in front of a user. Build guide
 * § 3.8 forbids that — we map upstream errors to a small typed enum
 * here, and components surface only the curated `message` from
 * :func:`parseApiError` (or a field-error map for form validation).
 *
 * Adding a new "safe" detail
 * --------------------------
 * If the backend coins a new user-safe `detail` string (e.g. a new
 * 409 conflict reason), add a row to ``SAFE_DETAILS`` so it gets
 * passed through verbatim and mapped to a stable code. Anything not
 * on that list collapses to the generic fallback — even if it's
 * harmless-looking, the policy is "explicit allowlist, not implicit
 * pass-through."
 */

export type ApiErrorCode =
  | "invalid_credentials"
  | "account_disabled"
  | "rate_limited"
  | "validation_failed"
  | "invalid_token"
  | "token_already_used"
  | "permission_denied"
  | "not_found"
  | "conflict"
  | "server_error"
  | "network_error"
  | "unknown";

export interface ApiError {
  code: ApiErrorCode;
  /** User-safe message ready to render. Never echoes raw backend text
   * unless that text appears in :data:`SAFE_DETAILS`. */
  message: string;
  /** Per-field validation errors when the backend returns a 400 with
   * field-keyed string arrays (DRF's standard shape). */
  fieldErrors?: Record<string, string[]>;
}

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/**
 * Detail strings the backend returns that are known to be user-safe.
 * The pattern is matched case-insensitively. Order matters when
 * patterns overlap — the first match wins.
 */
const SAFE_DETAILS: ReadonlyArray<{
  test: RegExp;
  code: ApiErrorCode;
  message: string;
}> = [
    {
      test: /invalid email or password/i,
      code: "invalid_credentials",
      message: "Invalid email or password.",
    },
    {
      test: /account is disabled/i,
      code: "account_disabled",
      message: "Your account has been disabled. Please contact support.",
    },
    {
      test: /this reset link has already been used/i,
      code: "token_already_used",
      message: "This reset link has already been used.",
    },
    {
      test: /this reset link is invalid or has expired/i,
      code: "invalid_token",
      message: "This reset link is invalid or has expired.",
    },
    {
      test: /this verification link has already been used/i,
      code: "token_already_used",
      message: "This verification link has already been used.",
    },
    {
      test: /this verification link is invalid or has expired/i,
      code: "invalid_token",
      message: "This verification link is invalid or has expired.",
    },
    {
      test: /trial is already cancelled|trial is in a terminal state/i,
      code: "conflict",
      message: "This trial can no longer be cancelled.",
    },
  ];

function matchSafeDetail(detail: string): ApiError | null {
  for (const row of SAFE_DETAILS) {
    if (row.test.test(detail)) {
      return { code: row.code, message: row.message };
    }
  }
  return null;
}

interface MaybeAxiosError {
  code?: string;
  response?: {
    status?: number;
    data?: {
      detail?: string;
      non_field_errors?: string[];
      [k: string]: unknown;
    };
  };
}

export function parseApiError(error: unknown): ApiError {
  const e = error as MaybeAxiosError;

  // Network failure: axios sets `code` and never gets a response.
  if (e?.code === "ERR_NETWORK" || e?.code === "ECONNABORTED") {
    return {
      code: "network_error",
      message:
        "We couldn't reach the server. Check your connection and try again.",
    };
  }

  const response = e?.response;
  if (!response) {
    return { code: "unknown", message: GENERIC_FALLBACK };
  }

  const status = response.status;
  const data = response.data ?? {};

  if (status === 429) {
    return {
      code: "rate_limited",
      message:
        "You've made too many attempts. Please try again in a few minutes.",
    };
  }
  if (status === 403) {
    return {
      code: "permission_denied",
      message: "You don't have permission to do that.",
    };
  }
  if (status === 404) {
    return {
      code: "not_found",
      message: "We couldn't find that.",
    };
  }
  if (status && status >= 500) {
    return {
      code: "server_error",
      message: "Our server hit an error. Please try again in a moment.",
    };
  }

  // 400/409 — try to pull a curated detail or non_field_errors entry.
  const candidate =
    (data.non_field_errors && data.non_field_errors[0]) || data.detail;
  if (typeof candidate === "string") {
    const matched = matchSafeDetail(candidate);
    if (matched) return matched;
  }

  // 400 with per-field validation errors. DRF returns `{field: [errors]}`.
  if (status === 400) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "detail" || k === "non_field_errors") continue;
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
        fieldErrors[k] = v as string[];
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        code: "validation_failed",
        message: "Please correct the highlighted fields.",
        fieldErrors,
      };
    }
  }

  if (status === 409) {
    return { code: "conflict", message: GENERIC_FALLBACK };
  }

  return { code: "unknown", message: GENERIC_FALLBACK };
}
