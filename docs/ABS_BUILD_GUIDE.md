# ABS Website — Build Guide

**Single source of truth for engineering work on the ABS digital showroom.**

> Supersedes: `docs/ABS_LAUNCH_READINESS_MATRIX.md`, `docs/plans/ABS_POST_CMS_IMPLEMENTATION_PLAN.md`, `docs/plans/platform-implementation-plan.md`. Those documents are kept in the repo for history with a banner pointing here.
>
> Companion doc for non-engineers: [`ABS_STAKEHOLDER_BRIEF.md`](./ABS_STAKEHOLDER_BRIEF.md).
>
> Vision (do not modify, only reference): [`ABS_FRONTEND_EXPERIENCE_BUILDER_V2.md`](../ABS_FRONTEND_EXPERIENCE_BUILDER_V2.md), [`ABS_WEBSITE_INFORMATION_ARCHITECTURE.md`](./ABS_WEBSITE_INFORMATION_ARCHITECTURE.md), [`ABS_VISUAL_PRODUCT_GALLERY_SYSTEM.md`](./ABS_VISUAL_PRODUCT_GALLERY_SYSTEM.md).

---

## 0. How to use this document

- **Pick the next item from the highest unfinished phase.** Don't cherry-pick across phases.
- **Phase 0 is a hard gate.** No public payment go-live until every P0 item is closed.
- Each item lists: file path(s), severity, fix summary, acceptance test.
- Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.
- When you close an item, tick it in the relevant checklist and add a one-line note in the **Decision Log** (§ 8).
- Audit findings that are *not* called out explicitly are still tracked; see § 5.4 *Carry-forward*.

---

## 1. Vision recap and where we are today

### 1.1 Vision (one paragraph)

The ABS website is a **self-guided digital showroom** for an enterprise asset-tracking platform — benchmarked against apple.com / apple.com/store. Users must travel **SEE → UNDERSTAND → COMPARE → CONFIGURE → ACT** without contacting sales. Images are the primary communication layer (clean hero → real-environment context → close-up detail → use-case → configuration UI). The site sells access to the Arcplus SaaS, hardware (scanners / tags), professional services, and training; it accepts payments through a hosted Flutterwave checkout and runs an in-house CMS for content. Quality bars from the vision doc: **Lighthouse ≥ 90, WCAG AA, motion ≤ 400 ms, prefers-reduced-motion respected.**

### 1.2 Stack snapshot

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| State / data | Zustand (auth), TanStack Query (server data), React Hook Form + Zod, jose |
| Animation | Framer Motion + GSAP (one will likely be removed in P1) |
| Backend | Django 5.1, DRF 3.15, djangorestframework-simplejwt |
| Async | Celery + django-celery-beat |
| Data | PostgreSQL 16, Redis 7 |
| Infra (dev) | docker-compose (parameterized for port collisions) |
| Email | Resend |
| Payments | Flutterwave (hosted checkout, webhook callback) |

### 1.3 Already built (do not redo)

The launch-readiness matrix understates current state. These are functional today:

- Mega menus for Scanners and Tags ([src/components/layout/Header.tsx:173](../src/components/layout/Header.tsx))
- Mobile guided-step navigation ([src/components/layout/Header.tsx:276](../src/components/layout/Header.tsx))
- Homepage guided-decision section + product gallery carousel ([src/app/HomePageClient.tsx](../src/app/HomePageClient.tsx))
- Configurator skeleton ([src/app/configurator/ConfiguratorPageClient.tsx](../src/app/configurator/ConfiguratorPageClient.tsx))
- Compare overlay ([src/app/compare/ComparePageClient.tsx](../src/app/compare/ComparePageClient.tsx))
- Arcplus pricing page with billing toggle ([src/app/arcplus/ArcplusPageClient.tsx](../src/app/arcplus/ArcplusPageClient.tsx))
- Training catalogue + Flutterwave hosted checkout ([backend/apps/training/views.py](../backend/apps/training/views.py))
- RFQ engine end-to-end (form + API + Resend email)
- Auth: register, login, refresh, logout (JWT) + admin role
- CMS Phase 2: pages, posts, media, navigation, redirects, site-settings, scheduled publish, audit log
- Testimonials carousel + logo carousel components
- Sitemap, robots, ISR + on-demand revalidation
- docker-compose dev stack with port-conflict overrides

### 1.4 Today's red flags (top of mind)

These are the most consequential issues surfaced by the audit. All are addressed in P0 or P1.

| # | Item | Where | Severity |
|---|---|---|---|
| 1 | Flutterwave webhook HMAC compares signature against the **secret literal**, not an HMAC of the raw body | [backend/apps/training/views.py:88-91](../backend/apps/training/views.py) | 🔴 |
| 2 | Webhook handler has a non-atomic `if reg.status != "paid"` race; duplicate deliveries can both pass | [backend/apps/training/views.py:115-122](../backend/apps/training/views.py) | 🔴 |
| 3 | Webhook saves `event_data["amount"]` without server-side recalculation | [backend/apps/training/views.py:121](../backend/apps/training/views.py) | 🔴 |
| 4 | `abs_session` cookie set with `httponly=False` (and `secure=not DEBUG`) | [backend/apps/accounts/views.py:25-33](../backend/apps/accounts/views.py) | 🔴 |
| 5 | Refresh token persisted to `sessionStorage` via Zustand persist | [src/lib/store/authStore.ts:39-55](../src/lib/store/authStore.ts) | 🔴 |
| 6 | No security headers in `next.config.ts` (no CSP/HSTS/X-Frame/Permissions-Policy) | [next.config.ts](../next.config.ts) | 🔴 |
| 7 | DRF has no global throttle classes; public endpoints unprotected from brute-force | [backend/abs_backend/settings/base.py:115-127](../backend/abs_backend/settings/base.py) | 🟠 |
| 8 | CMS HTML body fields stored unsanitised | [backend/apps/cms/models.py:288, 559, 715, 771](../backend/apps/cms/models.py) | 🟠 |
| 9 | CMS file upload accepts any MIME / size / extension | [backend/apps/cms/serializers.py:86-107](../backend/apps/cms/serializers.py) | 🟠 |
| 10 | No CI/CD; no Sentry; no structured logs; no health check | repo-wide | 🟠 |

---

## 2. Phase 0 — Critical security and launch blockers

> **Gate:** every item must be closed and tested before a real payment runs in production. Use the checklist in § 6.1 to sign off.

### 2.1 Payment integrity (Flutterwave)

#### 2.1.1 🔴 HMAC must be computed over the raw request body
**File:** [backend/apps/training/views.py:86-91](../backend/apps/training/views.py)
**Today:** `hmac.compare_digest(signature, secret_hash)` — compares the inbound `verif-hash` header against the *secret itself*. Anyone who knows the secret can forge any payload.
**Fix:** compute `hmac.new(secret, request.body, hashlib.sha256).hexdigest()` over the **raw bytes** of the request body, then `compare_digest` against the inbound header. Use `request.body`, not `request.data`. Document the chosen Flutterwave webhook scheme (verify-hash OR raw-body-hmac) and stick to one.
**Acceptance:** unit test `test_webhook_invalid_signature_rejected_401`, `test_webhook_valid_signature_accepted_200`, `test_webhook_signature_does_not_match_parsed_body`. Replay-the-test rejects.

#### 2.1.2 🔴 Webhook idempotency must be atomic
**File:** [backend/apps/training/views.py:115-122](../backend/apps/training/views.py)
**Today:** the `if reg.status != "paid"` check is read-then-write without locking; two simultaneous deliveries can both flip status and double-send the confirmation email.
**Fix:** wrap in `with transaction.atomic(): reg = TrainingRegistration.objects.select_for_update().get(...)`. Send confirmation email only inside the transaction or via Celery task triggered post-commit.
**Acceptance:** integration test fires the same valid webhook twice in parallel; assert exactly one transition to `paid` and one confirmation email.

#### 2.1.3 🔴 Recalculate the charge amount server-side
**File:** [backend/apps/training/views.py:121](../backend/apps/training/views.py)
**Today:** `reg.amount_paid = event_data.get("amount")` — trusts the webhook payload.
**Fix:** compute `expected = session.price_usd * registration.team_size` at registration creation; in the webhook, assert `event_data["amount"] == expected_at_creation` and reject (log + alert) if it differs. Persist the expected amount on the registration so it's tamper-evident.
**Acceptance:** test sends a valid-signature webhook with a tampered (lower) amount; status remains `pending`, alert is fired.

#### 2.1.4 🟠 Replay protection
**File:** [backend/apps/training/views.py:86](../backend/apps/training/views.py)
**Fix:** read Flutterwave's event timestamp; reject events older than 5 min. Optionally store seen event IDs (Redis SET, 24h TTL) for true replay prevention.
**Acceptance:** test rejects a payload with a 10-min-old timestamp.

#### 2.1.5 🟠 Atomic capacity enforcement
**File:** [backend/apps/training/models.py:42](../backend/apps/training/models.py)
**Today:** `seats_remaining` is a Python property computed at read time; two parallel registrations can both see seats available.
**Fix:** in registration creation, `select_for_update()` on the session and re-check `paid_count < capacity` inside the transaction. Add a DB constraint via migration: a CHECK or a partial unique index keying on `(session_id, slot_n)` if granular seats are tracked.
**Acceptance:** stress test races N+1 registrations against an N-seat session; only N succeed.

### 2.2 Auth and session hardening

#### 2.2.1 🔴 `abs_session` cookie must be `HttpOnly`
**File:** [backend/apps/accounts/views.py:25-33](../backend/apps/accounts/views.py)
**Today:** `httponly=False`. The comment on [accounts/views.py:16](../backend/apps/accounts/views.py) says "read by Next.js middleware" — but no `src/middleware.ts` exists in the repo today (see § 2.6). The cookie is currently read by *nothing*. Setting `HttpOnly` is correct, and § 2.6 introduces the middleware that will read it server-side.
**Fix:** `httponly=True`, `samesite="Strict"` (already in code; safe because we have no cross-site auth flow yet — downgrade to `Lax` if/when OAuth or external return-paths are introduced), `secure=True` in production (do not gate on `DEBUG` alone — drive from settings).
**Acceptance:** browser devtools shows `HttpOnly`; the new Next.js middleware (§ 2.6) reads the cookie via `request.cookies` (server-side); manual `document.cookie` returns no `abs_session`.

#### 2.2.2 🔴 Refresh token must not live in `sessionStorage`
**File:** [src/lib/store/authStore.ts:39-55](../src/lib/store/authStore.ts), [backend/apps/accounts/views.py](../backend/apps/accounts/views.py) (login + refresh endpoints)
**Today:** `partialize` includes `refreshToken` and the storage is `sessionStorage`. Any successful XSS exfiltrates a long-lived refresh token.
**Fix (decided 2026-05-08):** issue the refresh token as an `HttpOnly`, `Secure`, `SameSite=Lax` cookie named `abs_refresh` from `LoginView` and `TokenRefreshView`. The refresh endpoint reads `request.COOKIES["abs_refresh"]` (not the request body). On logout, clear the cookie and blacklist the token. Frontend keeps only the access token, in memory — drop `refreshToken` from `partialize` entirely.

- Cookie path: `/api/v1/auth/` so it isn't sent on every request.
- `SameSite=Lax` (not `Strict`) is intentional here so a login redirect from an external site still carries the cookie; the access-token cookie is independent.

**Acceptance:**

- After login, `sessionStorage.getItem("abs-auth")` contains no `refreshToken` field.
- `document.cookie` does not include `abs_refresh` (HttpOnly).
- `POST /api/v1/auth/refresh/` succeeds when the cookie is present and returns 401 when it isn't (test by clearing the cookie in DevTools).
- Page reload preserves the session; closing the browser does not (cookie is `Max-Age` ~7 days, refresh tokens rotate on each use).

#### 2.2.3 🟠 Production security settings
**File:** [backend/abs_backend/settings/production.py](../backend/abs_backend/settings/production.py)
The current `production.py` is ~18 lines; some lines below already exist (marked `# already set`), the rest are deltas. Don't paste the whole block over the existing file — add/keep individual lines as marked:

```python
# Already in production.py (verify, don't overwrite):
SECURE_SSL_REDIRECT = True            # already set
SECURE_HSTS_SECONDS = 31536000        # already set (1 year)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True # already set
SESSION_COOKIE_SECURE = True          # already set
CSRF_COOKIE_SECURE = True             # already set

# Add:
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # required behind DO App Platform
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"    # match abs_session cookie (§ 2.2.1)
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")        # required, no default
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")        # required, no default — see § 5.2
```

Also: assert `len(ALLOWED_HOSTS) > 0`, `DEBUG is False`, and `len(CSRF_TRUSTED_ORIGINS) > 0` and `len(CORS_ALLOWED_ORIGINS) > 0` in `production.py` so a misconfigured deploy fails closed.
**Acceptance:** `python manage.py check --deploy` returns clean on production settings.

#### 2.2.4 🟠 Strict security headers on the frontend
**File:** [next.config.ts](../next.config.ts)
**Fix:** add a `headers()` export. Starter CSP (tighten as you remove inline styles/scripts):

```ts
{ key: "Content-Security-Policy", value:
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +    // remove 'unsafe-inline' when feasible
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://media.absplatform.com; " +  // R2 origin + Cloudflare-proxied media subdomain
    "connect-src 'self' https://api.absplatform.com; " +
    "frame-ancestors 'none'; base-uri 'self';"
}
{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
{ key: "X-Frame-Options", value: "DENY" }
{ key: "X-Content-Type-Options", value: "nosniff" }
{ key: "Referrer-Policy", value: "same-origin" }
{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
```

**Acceptance:** Mozilla Observatory ≥ B+; CSP blocks an injected `<script src="evil.example">`.

### 2.3 Abuse prevention

#### 2.3.1 🟠 DRF global throttles
**File:** [backend/abs_backend/settings/base.py:115-127](../backend/abs_backend/settings/base.py)

```python
REST_FRAMEWORK = {
    ...,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "240/min",
        "login": "10/min",
        "register": "5/min",
        "rfq": "10/min",
        "training_register": "10/min",
        "trial_signup": "5/min",
        "webhook": "120/min",
    },
}
```

Apply scoped throttles (`ScopedRateThrottle`) to the relevant views (`LoginView`, `RegisterView`, `RFQCreateView`, `TrainingRegistrationCreateView`, `TrialSignupCreateView`, `FlutterwaveWebhookView`).
**Acceptance:** integration test floods login endpoint with 11 attempts/min; the 11th returns 429.

#### 2.3.2 🟠 Account lockout
Add `django-axes`. Default: 5 failures / 15-min cool-off, scoped by `(username, IP)`. Disable behind authenticated webhooks.
**Acceptance:** 5 bad-password attempts on a real account locks for 15 min; legitimate user from another IP is unaffected.

#### 2.3.3 🟠 Frontend admin-callable API routes
**Files:** [src/app/api/draft/route.ts](../src/app/api/draft/route.ts), [src/app/api/revalidate/route.ts](../src/app/api/revalidate/route.ts)
**Fix:** rate-limit (e.g., `@upstash/ratelimit` or a simple Redis sliding window — Redis is already in the stack); compare secrets in constant time (`crypto.timingSafeEqual`); log every attempt; for `/api/draft`, validate `slug` against a whitelist of CMS-known pages before issuing draft cookies.
**Acceptance:** brute-force test (200 reqs/min) against `/api/revalidate` returns 429 after threshold; logs show attempt count and IP.

### 2.4 Input and content safety

#### 2.4.1 🟠 File upload validation (CMS media)
**Files:** [backend/apps/cms/serializers.py:86-107](../backend/apps/cms/serializers.py), [src/lib/api/cms.ts:116-119](../src/lib/api/cms.ts)
**Fix:**
- Server: validate `Content-Type` against an allowlist (`image/jpeg|png|webp|gif`, `application/pdf`, `video/mp4`), max size (e.g., 25 MB image / 200 MB video), extension match. For images, sniff with Pillow; for PDFs, reject if `%PDF-` magic bytes are absent.
- Client: pre-flight the same checks for UX.
**Acceptance:** test rejects a `.exe` renamed to `.png`; rejects a 50 MB image; accepts a real 5 MB JPEG.

#### 2.4.2 🟠 Sanitize CMS HTML
**Files:** [backend/apps/cms/models.py:288, 559, 715, 771](../backend/apps/cms/models.py) (`body`, `content`, `body_html`)
**Fix:** install `bleach`; sanitize on save (model `clean()`) with a fixed allowlist:

```python
ALLOWED_TAGS = ["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "a", "strong", "em", "blockquote", "code", "pre", "img", "figure", "figcaption"]
ALLOWED_ATTRS = {"a": ["href", "title", "rel"], "img": ["src", "alt", "loading", "width", "height"]}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]
```

Auto-add `rel="noopener noreferrer"` to outbound links.
**Acceptance:** an admin who pastes `<script>` or `onerror=` into a body field gets a clean output with the danger stripped.

#### 2.4.3 🟠 SSRF guard on CMS URL fields
**File:** [backend/apps/cms/models.py:204, 296, 298, 321](../backend/apps/cms/models.py) (`canonical_url`, `video_url`, `link_url`)
**Fix:** custom `validate_public_url`:
- Resolve hostname, reject if it's an RFC 1918 / loopback / link-local / IPv6 ULA address.
- Allow only `http`/`https` schemes.
- Validate against an optional admin-managed domain allowlist for embed URLs.
**Acceptance:** test rejects `http://169.254.169.254`, `http://localhost`, `file:///etc/passwd`; accepts `https://www.youtube.com/...`.

#### 2.4.4 🔴 Sanitize email-template preview
**File:** [src/app/admin-portal/cms/email-templates/page.tsx:67](../src/app/admin-portal/cms/email-templates/page.tsx)
**Today:** `dangerouslySetInnerHTML={{ __html: html }}` from a CMS-stored template field.
**Fix:** render the preview inside a sandboxed iframe (`<iframe sandbox="allow-same-origin" srcDoc={html} />`) so even bad HTML can't execute against the admin's session. Server-side sanitize the field on save as a defense-in-depth.
**Acceptance:** a template with `<script>alert(1)</script>` in body renders as text in the preview, no alert.

#### 2.4.5 🟠 Path-traversal guard on `/media/*` rewrite
**File:** [next.config.ts:47-54](../next.config.ts)
**Fix:** validate at startup that `BACKEND_ORIGIN` is `https://` (or `http://` only for dev) with a known host; reject incoming `:path*` segments that contain `..`, encoded `%2e%2e`, or null bytes — Next.js rewrites pass these through. Use `middleware.ts` to early-return on suspicious paths.
**Acceptance:** request to `/media/../../etc/passwd` returns 400 before reaching the backend.

### 2.5 Production gating

- Raise `ImproperlyConfigured` in `production.py` if any of `DJANGO_SECRET_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS` is unset or matches a known-default placeholder string.
- The frontend should fail at build time if any required `NEXT_PUBLIC_*` is missing — add `src/lib/env.ts` with a `zod` schema validated at import.

### 2.6 🔴 Frontend admin / portal middleware (proxy.ts)

**File:** [src/proxy.ts](../src/proxy.ts) (Next.js 16 renamed `middleware.ts` → `proxy.ts`; the logic and `config` export are otherwise identical)
**Today:** an existing skeleton existed, but it was missing path-traversal guard, returned 302 instead of 403 for non-admin, and used a `callbackUrl` query param that didn't sanitise against open-redirect.
**Fix:** rewrite `src/proxy.ts` exporting `proxy(req)` and a `config` matcher for `/admin-portal/:path*`, `/portal/:path*`, `/auth/login`, `/auth/register`, and `/media/:path*`. For each request:

- Read the `abs_session` cookie via `req.cookies.get("abs_session")`.
- Verify it with `jose.jwtVerify` against `JWT_SECRET` (same secret the backend signs with — already in env). Reject expired or unsigned tokens.
- For `/admin-portal/*`: require `payload.role === "admin"`; redirect to `/auth/login?next=...` if missing, return a `403` JSON response if the role is wrong.
- For `/portal/*`: require `payload.sub` (any authenticated user); redirect to `/auth/login?next=...` if missing.
- Use `safeRedirect` (§ 3.8) for the `next=` value so we don't introduce an open-redirect vector.

**Acceptance:**

- Logged out, GET `/admin-portal/cms` → 302 to `/auth/login?next=/admin-portal/cms`.
- Logged in as `role=user`, GET `/admin-portal/cms` → 403.
- Logged in as `role=admin`, GET `/admin-portal/cms` → 200.
- Edit `JWT_SECRET` mid-session → middleware rejects the now-invalid cookie on the next protected request.
- Vitest suite `src/__tests__/middleware.test.ts` covers all four cases.

---

## 3. Phase 1 — Launch-quality polish

> **Gate:** ship to production once all P0 items are closed and these P1 items meet the acceptance bar in § 6.2.

### 3.1 Accessibility (target: WCAG 2.1 AA)

| Item | Where | Fix |
|---|---|---|
| Alt-text required on every CMS media asset | ✅ shipped (PR #14) | `MediaAssetUploadSerializer.validate()` rejects image uploads with empty/whitespace-only `alt_text` (400 with field-keyed error). The bespoke patch handler in `AdminMediaDetailView` enforces the same end-state rule on PATCH, so a partial update can't blank an image's alt text. Documents/videos remain unconstrained. 7 backend tests pin the contract. |
| Focus trap + return on modals (TrialSignupModal et al.) | ✅ shipped (PR #16) | New [`useFocusTrap`](../src/lib/hooks/useFocusTrap.ts) hook (~50 LoC, no new deps) wired into `TrialSignupModal` and `TrainingRegistrationModal`. Both now declare `role="dialog" aria-modal="true" aria-labelledby`. The hook activates on open, cycles Tab + Shift+Tab within the dialog, calls `onEscape` on Escape, and restores focus to the originally-focused element on close. 5 vitest cases pin the contract. |
| `aria-label` on every interactive control | ✅ shipped (PR #14 public, PR #18 admin + CI rule) | Public components already carried `aria-label` on icon buttons. PR #18 added the `jsx-a11y/control-has-associated-label` rule to [`eslint.config.mjs`](../eslint.config.mjs) (with `tr`/`th`/`td` ignored to avoid table-scaffold misfires) and worked through every violation it surfaced — ~150 fixes across 30 admin-portal pages, public-form components, and modal dialogs. Most fixes were `aria-label` derived from the visually-adjacent `<label>` text. The rule is now an ERROR in CI, so future regressions block PRs. |
| `prefers-reduced-motion` respected by every motion component | ✅ shipped (PR #14) | New [`useMotionPreference()`](../src/lib/hooks/useMotionPreference.ts) reads the OS query natively (no framer-motion bundle pull-in). Sibling `useMotionVariant(reducedValue, animatedValue)` picks the right Framer Motion variant key. Existing `motion.*` usage continues to work — apply the hook as those components are touched for other reasons. |
| Color contrast audited | 🟡 deferred | Needs an axe-core run (build guide § 3.10) — heavier follow-up. The Signal Orange on warm-white case-study background was flagged in the audit and stays on the watch list. |
| Form `<label htmlFor>` connected to inputs | ✅ shipped (PR #14) | `FormInput` derives a slugified id from `label` when none is supplied, applies it to both `<label htmlFor>` and `<input id>`, and respects an explicit id when given. Error messages are announced via `role="alert"`. 4 vitest cases pin the contract. |

**Acceptance:** axe-core run in vitest reports 0 critical violations on `/`, `/scanners`, `/tags`, `/configurator`, `/auth/login`, `/portal`.

### 3.2 SEO

| Item | Where | Fix |
|---|---|---|
| `Product` JSON-LD on hardware detail pages | ✅ shipped (PR #12) | New SSR fetcher [`apps/lib/api/products-server.ts`](../src/lib/api/products-server.ts) mirrors the `cms-server` ISR pattern. Both [`/scanners/[slug]/page.tsx`](../src/app/scanners/[slug]/page.tsx) and [`/tags/[slug]/page.tsx`](../src/app/tags/[slug]/page.tsx) now fetch the product server-side, mount `<JsonLd>` with the Product schema (name, description, images, category-aware URL, quote-only Offer), and the metadata uses real product data for title/description/canonical/OG image instead of slug-derived placeholders. The client component still hydrates the rest of the UI — same render, just with a richer SSR shell. |
| `Article` JSON-LD on blog posts | ✅ shipped (PR #11) | [`buildArticleLd`](../src/lib/seo.ts) emits a `BlogPosting` with headline (capped at 110 chars), `datePublished`, author, featured image (absolute URL), keywords, and a `publisher` block. Mounted via `<JsonLd>` at the top of [`/resources/blog/[slug]/page.tsx`](../src/app/resources/blog/[slug]/page.tsx). |
| `Organization` schema in root layout | ✅ shipped (PR #11) | [`buildOrganizationLd`](../src/lib/seo.ts) composes a base shape (`@context`, `name`, `url`, `logo`) with contact details from `site_settings` and any admin-supplied JSON in `organization_schema` (the CMS override always wins). Mounted via `<JsonLd>` in `app/layout.tsx`. |
| Image entries in sitemap | ✅ shipped (PR #11) | [`sitemap.ts`](../src/app/sitemap.ts) now emits `images: [post.featured_image.file]` on blog post entries. Other routes don't have a single canonical image yet — add as their hero/og pipeline lands. |
| Canonical URL wired from CMS | ✅ shipped (PR #11) | Blog post pages now set `metadata.alternates.canonical = '/resources/blog/<slug>'` and pass the same path to `openGraph.url`. Pattern is ready to extend to other dynamic templates as their `PageMeta` row is consulted. |
| `hreflang` alternates | layout / metadata | Skip until regional variants exist; leave a TODO. |
| OG images sized 1200×630 | metadata factories | Specify `width`/`height` in OG image objects; ensure source images are at least 16:9. |

**Acceptance:** Google's Rich Results Test passes on a product detail page and a blog post.

### 3.3 Performance

| Item | Where | Fix |
|---|---|---|
| Pick **one** animation library | ✅ shipped (PR #13) | Audit found zero GSAP imports across the codebase — the dependency was dead weight. Removed via `npm uninstall gsap`. Framer Motion is now the sole animation library. |
| Dynamic-import heavy client routes | ✅ shipped (PR #13) | Both `/configurator` and `/compare` page roots now use `next/dynamic` with a Skeleton-style loading state. The interactive client chunks no longer ship to users who never visit those paths. |
| Tighten `images.remotePatterns` | ✅ already tight | `next.config.ts` is already restricted to `**.r2.cloudflarestorage.com` + `media.absplatform.com` + `localhost` (dev). No `**.amazonaws.com` wildcard to remove. |
| Conditional `priority` on hero images | ✅ shipped (PR #13) | `HeroSection` now takes a `priority?: boolean` prop (default `false`) that flows into `next/image`'s `priority` attr. `CMSHero` propagates it. The homepage `HomePageClient` opts in (`priority`); every other page uses the safer default so we don't preload an off-screen image and regress LCP. |
| Use CMS-provided variants via Next.js Image | 🟡 partial | The CMS already serializes `file_webp`/`file_large`/`file_medium` on `MediaAsset`. Wiring the renderer to prefer those over runtime transforms is a follow-up — it touches every `<Image>` site that consumes a CMS asset and benefits from a small picker helper (`pickMediaVariant(asset, slot)`). |
| Tune TanStack Query staleTime per query type | ✅ shipped (PR #13) | [`providers.tsx`](../src/app/providers.tsx) exports `STALE_PRICING` (30 s), `STALE_USER_SCOPED` (1 min), `STALE_CMS_CONTENT` (5 min, default), and `STALE_STATIC_CATALOG` (1 h). Existing user-scoped queries (`useMySubscriptions`, `useMyTrainingRegistrations`) and the availability query (`useTrainingSessions`) now use the right tier. New `useQuery` calls pick a constant from the same module. |

**Acceptance:** Lighthouse mobile ≥ 90 on `/`, `/arcplus`, `/scanners`, `/configurator`. Bundle analyzer shows configurator chunk loaded only on `/configurator`.

### 3.4 UX baseline (closing visible vision gaps)

| Item | Vision ref | Fix |
|---|---|---|
| Image-first hero on `/scanners` and `/tags` index | "Images ARE the primary communication layer" | Add a hero band above each list with one large environment image and the category headline. |
| Sticky summary bar on configurator | § 7 in vision | Fixed-bottom bar with running total, selected options, "Add to Quote" CTA. Keep visible on mobile. |
| "Recommended" highlight in compare | § 8 in vision + `recommended: true` flag exists | Visual treatment: subtle accent border, badge, slight `bg` shift. Keep `recommended` data-driven. |
| Wire CMS data into compare and configurator | (current state: hardcoded fallback arrays) | Replace hardcoded fallback arrays in `ComparePageClient`, `ConfiguratorPageClient`, `ArcplusPageClient` with CMS reads; keep the arrays as the seeder's source so dev still works without DB content. |
| Pricing toggle uses `layoutId` for smooth animation | § 6 in vision ("price animates smoothly") | Wrap each price in `<motion.span layoutId={tier.id} />`. |

**Acceptance:** a designer review confirms the four hero routes "feel like a showroom"; no PR merges if compare/configurator regress in image quality vs. screenshots filed in `docs/`.

### 3.5 Observability

Decision 2026-05-08: **Sentry only** for P1. No additional metrics vendor (Grafana Cloud / Datadog) yet — revisit when we have real traffic and a clear question Sentry can't answer.

| Item | Where | Fix |
|---|---|---|
| Sentry — backend | `backend/abs_backend/settings/production.py` | `sentry-sdk` with `DjangoIntegration`, `CeleryIntegration`. Tracesample 0.1. PII scrubbing on. |
| Sentry — frontend | `src/instrumentation.ts` (Next.js 16) | `@sentry/nextjs`; share a single Sentry org / project pair. |
| Structured JSON logs | `LOGGING` in base settings | `python-json-logger`; emit to stdout (Docker collects). |
| Request-ID middleware | new `apps/core/middleware.py` | Generate UUID per request, set in log context, return as `X-Request-ID` header; thread through Celery via task headers. |
| `/api/v1/health/` | `apps/core/views.py` | Returns 200 with `{db: ok, redis: ok, celery: ok, time}`; checks DB connection, Redis ping, Celery via `inspect.ping()` (timeboxed). 503 if any fails. Wire into Docker `HEALTHCHECK` and any orchestrator probe. |
| Celery task result monitoring | settings + `apps/core/celery.py` | Enable result backend; alert on `task_failure` signal (Sentry receives by default). |
| Celery beat schedule registered | `backend/abs_backend/celery.py` + settings | `cms.tasks.publish_scheduled_content` is implemented but no `CELERY_BEAT_SCHEDULE` entry exists. Register it (every 1 min) plus any future periodic tasks (trial-expiry, audit-log retention). Verify the beat container is running in DO App Platform. |

**Acceptance:** triggering an exception locally lands in Sentry within 60 s; `curl /api/v1/health/` returns 200 when stack is healthy and 503 if redis is stopped; a CMS post scheduled for `now() + 90s` flips to `published` automatically.

### 3.6 CI/CD

Create `.github/workflows/ci.yml` running on PRs to `main`:

1. Frontend job: `npm ci`, `npm run lint`, `tsc --noEmit`, `npm test`, `npm run build`.
2. Backend job: `pip install -r requirements-dev.txt`, `ruff check`, `mypy backend`, `pytest --cov --cov-fail-under=60`, `python manage.py check --deploy --settings=abs_backend.settings.production`.
3. Security job: `npm audit --audit-level=high`, `pip-audit`, `gitleaks detect`. Block on Critical findings.
4. Container job: build `Dockerfile.prod` and scan with Trivy; fail on Critical CVEs.

Branch protection on `main`: require all jobs green + 1 review.

**Acceptance:** a PR with a failing test cannot be merged; a PR introducing a vulnerable dep is blocked.

### 3.7 Production deployment

Decision 2026-05-08: **DigitalOcean App Platform** for both Django and Next.js, **DO Managed Postgres** + **DO Managed Redis**, **Cloudflare** in front (CDN, DDoS, WAF) + **Cloudflare R2** for media. R2 chosen over DO Spaces because egress to the Cloudflare CDN we're already proxying through is free.

| Item | Where | Fix |
|---|---|---|
| `Dockerfile.prod` for backend | `backend/Dockerfile.prod` (new) | Multi-stage; non-root user `appuser`; `gunicorn abs_backend.wsgi:application -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8080`; add `HEALTHCHECK` hitting `/api/v1/health/`. |
| `Dockerfile.prod` for frontend | `Dockerfile.prod` (new) | Build with `output: "standalone"`; copy `.next/standalone` only; non-root; serve on `:3000`. |
| `output: "standalone"` | `next.config.ts` | Add. |
| App Platform spec | `.do/app.yaml` (new) | Three services: `web` (Django), `worker` (`celery -A abs_backend worker`), `beat` (`celery -A abs_backend beat`); two databases (Postgres, Redis); one static site (Next.js). One env var group shared across services. |
| Cloudflare in front | DNS + Cloudflare dashboard | Proxy the apex + `www` through Cloudflare. Enable Full (Strict) TLS, Always Use HTTPS, HSTS preload (after § 2.2.4 lands). Add a WAF rule to block known-bad webhook signatures. |
| Media to object storage | settings + `django-storages[s3]` (R2 is S3-compatible) | `DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"`, `AWS_S3_ENDPOINT_URL` → R2 endpoint, `MEDIA_URL` points at the Cloudflare-proxied bucket subdomain. Container volume is dev-only. |
| Email sender authentication | DNS (apex domain) | Add Resend's required SPF and DKIM TXT/CNAME records before any production email goes out — otherwise transactional mail (RFQ replies, training receipts, password resets) lands in spam. Verify in Resend dashboard. Document the records in `docs/runbooks/email-deliverability.md` (P2). |
| Postgres backup | DO Managed Postgres handles daily backups; runbook | DO automatically retains 7 days of backups. Document a quarterly drill: restore latest backup to a new DB, run `python manage.py check`, run a smoke test. |
| Zero-downtime migrations | runbook | Document the additive-migration pattern (add column → backfill → switch reads → drop in next release); never block a deploy on a destructive migration. |

**Acceptance:** a clean deploy from `main` reaches green health on first request; rollback path documented (DO App Platform: redeploy a prior commit from the dashboard or CLI); a transactional email passes SPF + DKIM checks via `mail-tester.com`.

### 3.8 Account lifecycle (auth completeness)

Today's auth flow stops at register / login / refresh / logout. Add the missing pieces before public launch:

| Item | Where | Fix |
|---|---|---|
| Password reset | ✅ shipped (PR #6) | `POST /auth/password/reset/` (enumeration-safe) issues a `TimestampSigner`-signed token via [`apps/core/signing.py`](../backend/apps/core/signing.py) embedding the user's password-hash fingerprint; one-shot link expires after 1 h. `POST /auth/password/reset/confirm/` rotates the password and blacklists every outstanding refresh token. Both endpoints throttled at `5/hour` per IP via the `password_reset` scope. Frontend pages: [`/auth/forgot-password`](../src/app/auth/forgot-password/page.tsx), [`/auth/reset-password/[token]`](../src/app/auth/reset-password/[token]/page.tsx). |
| Email verification | ✅ shipped (PR #7) | `User.email_verified_at` added; register auto-sends a signed link (24 h TTL, fingerprint binds `email + email_verified_at` so the token is single-use). `POST /auth/email/verify/request/` (auth-required, 5/h throttle) re-sends; `POST /auth/email/verify/confirm/` consumes the token, flips `email_verified_at`, writes an audit row. Frontend pages: [`/auth/verify-email/[token]`](../src/app/auth/verify-email/[token]/page.tsx) (auto-confirms on mount), [`/auth/verify-email`](../src/app/auth/verify-email/page.tsx) (auth re-send). `User.email_verified` is exposed via `/auth/me/`. *Gating sensitive actions on verified email is a follow-up.* |
| Signed links generally | ✅ shipped (PR #6) | [`apps/core/signing.py`](../backend/apps/core/signing.py) wraps `django.core.signing.TimestampSigner` — used by password reset and email verification today. |
| Frontend safe-redirect helper | ✅ shipped (PR #8) | [`src/lib/redirect.ts`](../src/lib/redirect.ts) exports `safeRedirect(target)` plus `isInternalPath` / `isAllowedExternalUrl` predicates. Internal targets must start with `/` and not `//` (rejects protocol-relative); external targets must be on a Flutterwave-hosted-checkout allowlist. Both `lib/api/client.ts` (401 → login redirect) and `lib/hooks/useTraining.ts` (Flutterwave hand-off) now route through it. |
| Sanitised client error display | ✅ shipped (PR #8) | [`src/lib/api/errors.ts`](../src/lib/api/errors.ts) exports `parseApiError(error)` returning a `{code, message, fieldErrors?}` shape with a typed `ApiErrorCode` union. Backend `detail` strings only pass through when they appear in an explicit allowlist; everything else collapses to a generic "Something went wrong." Status codes 429/403/404/5xx/400-with-field-errors get bespoke curated messages. `LoginForm`, `ResetPasswordForm`, and `VerifyEmailClient` now consume `parseApiError(error).message` instead of reaching into `error.response.data.detail` directly. |
| Subscription cancellation | new view in `apps/subscriptions/views.py` | `POST /subscriptions/{id}/cancel/` (`IsAuthenticated`, owner-only): flip status to `cancelled`, set `cancelled_at`, queue cancellation email, prevent further trial extensions. Admin-side cancel via the existing CMS admin. Today only `TrialSignupCreateView` and `TrialSignupListView` exist — there's no path for a user to end their own trial. |

**Acceptance:** a user who forgets their password can recover via email in < 5 min; an unverified user can't access the portal payment flow; a user can cancel their own active trial from `/portal/subscription` and stops receiving lifecycle emails.

### 3.9 Compliance and privacy

| Item | Fix |
|---|---|
| `/privacy` and `/terms` routes | ✅ shipped (PR #10) — static React server pages at [`src/app/privacy/page.tsx`](../src/app/privacy/page.tsx) and [`src/app/terms/page.tsx`](../src/app/terms/page.tsx) with `LAST_UPDATED` constants. Footer links wired up (no more `href="#"` placeholders). Privacy policy lists subprocessors, retention windows per record type, and the user's rights with a link to `/portal/account` for self-service export/delete. |
| Cookie consent banner | ✅ shipped (PR #10) — [`<CookieConsentBanner />`](../src/components/CookieConsentBanner.tsx) mounts in the root layout; renders only when no choice has been made (avoids SSR flash via `useShouldShowBanner`). Choice persists in `localStorage` (not a cookie — using a cookie to track consent itself is circular). [`useAnalyticsAllowed()`](../src/lib/cookies.ts) is the gate hook for any future third-party script — defaults to denied so adding analytics later is opt-in by construction. Footer "Cookie Settings" link calls `clearConsent()` to re-surface the banner. |
| `GET /auth/me/export/` | ✅ shipped (PR #9) — `IsAuthenticated` returns the user's full data set (profile + RFQs + training + subscriptions + service requests + last 500 audit rows) as a JSON envelope built by [`apps/accounts/gdpr.export_user_data`](../backend/apps/accounts/gdpr.py). Each call writes a `user_data_exported` audit row. The frontend [`/portal/account`](../src/app/portal/account/page.tsx) page offers it as a `application/json` Blob download — never round-trips through any third party. |
| `POST /auth/me/delete/` | ✅ shipped (PR #9) — body must include `{"confirm": true}`. Atomically: soft-deletes the user (`is_active=False`, `deleted_at=now()`), anonymises PII fields on the row, replaces email with `deleted-<sha>@example.invalid`, sets unusable password; cancels every active `ArcplusTrialSignup`; anonymises and FK-nulls every `RFQSubmission` / `TrainingRegistration` / `ServiceRequest` (financial-records retention pattern); blacklists every outstanding refresh token; sends a final confirmation email to the *original* address; writes a `user_self_deleted` audit row. Frontend confirmation requires typing the phrase `"delete my account"` to enable the destructive button. |
| PCI scope statement | ✅ shipped (PR #10) — [`docs/COMPLIANCE.md`](COMPLIANCE.md) records SAQ-A scope (Flutterwave hosted checkout, zero card data on ABS infra), the integration constraints that hold the scope (must stay redirect-based, not iframe/SDK), and the audit-record retention rules. Subprocessor table lives there too so any change touches one document. |
| Audit log for admin actions | ✅ shipped (PR #5) — every CMS admin viewset that mutates state inherits [`AuditedAdminMixin`](../backend/apps/cms/admin_mixins.py) and calls `self.audit(action, resource_id, changes)` (helpers `audit_create` / `audit_update` / `audit_delete` for the common case). The marker is enforced at the edge by [`backend/scripts/check_audit_coverage.py`](../backend/scripts/check_audit_coverage.py), wired into the CI `backend-lint` job: any new write handler (`post`/`put`/`patch`/`delete`) on a class that doesn't inherit the mixin fails the build. Signals were considered and rejected — they're hard to test, easy to skip with `bulk_update`, and lose request/IP context. |
| Data-retention notes | ✅ shipped (PR #10) — published verbatim in the Privacy Policy `/privacy` § 4 and mirrored in `docs/COMPLIANCE.md` § GDPR. Automated retention sweeps remain a follow-up Celery beat task (tracked in `COMPLIANCE.md`). |

**Acceptance:** a test user can export and then delete their account end-to-end via the portal.

### 3.10 Tests added in P1

Target: ≥ 60 % backend coverage; key user journeys covered E2E.

**Backend (pytest)**
- ✅ `apps/training/tests/test_webhook.py` — signature, replay, duplicate, amount-tampering (PR set #1).
- ✅ `apps/training/tests/test_registration_flow.py` (PR #17) — full register → mocked Flutterwave checkout init → webhook → verify → confirmation email. Uses `transaction=True` so `transaction.on_commit` actually fires. Replay test pinned: a duplicate webhook for an already-paid registration returns `already=paid` without re-sending the confirmation email.
- ✅ `apps/training/tests/test_capacity.py` — concurrent registrations don't exceed capacity (P0).
- ✅ Login/auth-cookies covered in `test_auth_cookies.py`; password reset in `test_password_reset.py`; email verification in `test_email_verification.py`; GDPR in `test_gdpr.py`; subscription cancel in `test_cancel.py`.
- ✅ `apps/accounts/tests/test_lockout.py` (PR #15) — 5 wrong attempts lock the account; correct password rejected post-lockout. Reset-on-success and IP-vs-username scoping informally verified; pinning them as automated tests was flaky against axes' DB-backed handler under `transaction=True`.
- ✅ `apps/accounts/tests/test_admin_permissions.py` (PR #15) — parameterised across 15 representative admin endpoints; anon → 401, client → 403, admin → through.
- ✅ `apps/cms/tests/test_security.py` covers HTML sanitisation, media validation (incl. magic-byte sniffing), SSRF guard. `test_alt_text.py` (PR #14) covers the image-alt constraint.
- ✅ `apps/rfq/tests/test_submission.py` (PR #15) — anonymous + auth happy path, validation (email, company, asset count, solution-type-required), email-failure-doesn't-break, rate limit, my-RFQs ownership scoping.

**Frontend (vitest + RTL)**
- ✅ `src/__tests__/auth-store.test.ts` — hydration, logout clears storage.
- ✅ `src/__tests__/api-client-401.test.ts` (PR #17) — 401 → refresh → retry interceptor. Module-level `vi.mock` on `axios` + `@/lib/redirect` so the interceptor's bound references hit the test doubles. 5 cases: happy-path retry (with adapter swap to capture the replayed config + bearer rewrite), refresh-fails-redirects, refresh-endpoint-itself-401-doesn't-loop, non-401-skips-refresh, `_retry`-flagged-doesn't-loop.
- ✅ `src/__tests__/middleware.test.ts` — proxy.ts gate behaviour (renamed from middleware.ts in Next 16; same coverage).
- ✅ `src/__tests__/a11y.test.tsx` (PR #14) — FormInput label/htmlFor + role=alert; useMotionPreference variants. Full axe-core sweep on `/`, `/arcplus`, etc. is a follow-up.
- ✅ Form-validation + error-display tests across `PasswordReset`, `EmailVerification`, `AccountPanel`, `CookieConsent`, plus `LoginForm`/`RegisterForm`/`RFQ` (PRs #6, #7, #9, #10, #16).
- ✅ `src/__tests__/useFocusTrap.test.tsx` (PR #16) — trap activation/deactivation, Tab + Shift+Tab cycling, Escape, focus restoration. Wired into `TrialSignupModal` and `TrainingRegistrationModal` with `role="dialog" aria-modal="true" aria-labelledby`.

---

## 4. Phase 2+ — Apple-grade polish and feature roadmap

These items elevate the site from "ships well" to "feels like apple.com." Tackle in any order; some unlock others.

### 4.1 Visual gallery system per product
**Vision:** [`ABS_VISUAL_PRODUCT_GALLERY_SYSTEM.md`](./ABS_VISUAL_PRODUCT_GALLERY_SYSTEM.md). Each product gets a HERO → CONTEXT → DETAIL → USE-CASE → CONFIG sequence with scroll-bound transitions.
**Plan:** extend `MediaAsset` with a `gallery_role` enum and `gallery_order`; new `<ProductGallery>` component reading the sequence; add to `/scanners/[slug]` and `/tags/[slug]`. Pilot on three products before rolling out.

### 4.2 Configurator real-time pricing + share/save
- Wire selections to a Django `POST /products/configurations/price/` endpoint that returns total + line-items.
- URL-encode the configuration so any state is shareable: `/configurator?c=<base64>`.
- Logged-in users: "Save configuration" stored on the user; show in `/portal`.

### 4.3 Compare overhaul
- Pull rows + columns from CMS / API. Up to 4 columns on desktop, swipeable on mobile.
- "Recommended" treatment from § 3.4.
- Per-row "explain" disclosure for technical specs.

### 4.4 Scroll choreography
- Pricing layoutId animation (covered in P1 — extend to Arcplus modules grid).
- Hero-to-product-image transitions (use `view-transition-name` once Next.js exposes it stably; until then, Framer's `LayoutGroup`).
- Training session vibrancy badges: "few seats left" / "selling fast" computed from `seats_remaining`.

### 4.5 Hardening +
- **MFA (TOTP) for admin** — `django-otp` + admin login flow change; recovery codes; require for `role=admin` users.
- **Full admin audit log** — every CMS mutation, RFQ status change, subscription change writes to `cms.AuditLog` with actor, IP, user-agent, before/after diff.
- **Soft-delete strategy** — abstract `SoftDeleteModel` for User, RFQSubmission, ArcplusTrialSignup, TrainingRegistration; default manager hides deleted; admin manager shows all. Hard-delete only via a privileged management command.
- **API versioning + OpenAPI** — install `drf-spectacular`; expose `/api/schema/`, `/api/docs/`. Document deprecation policy.
- **Idempotency keys** for `POST /training/register/` and `POST /rfq/` — accept `Idempotency-Key` header; cache response in Redis 24 h.

### 4.6 Test maturity
- **Playwright E2E** — auth (register → login → portal), RFQ submission, training purchase against a Flutterwave sandbox, admin moderation flow.
- **Visual regression** — Chromatic or Percy on key components; gate PRs.
- Backend coverage to ≥ 80 %.

### 4.7 Developer experience
- `Makefile` with: `dev`, `test`, `test-frontend`, `test-backend`, `migrate`, `seed`, `reset-db`, `lint`.
- `.pre-commit-config.yaml` — black, isort, ruff, prettier, eslint, gitleaks.
- `frontend/.env.local.example` matching the values `next.config.ts` expects.
- ADRs in `docs/adr/` — start with: "Why Flutterwave (not Stripe) for training," "Why Tailwind v4," "Why Next.js App Router."
- Architecture diagram in `docs/ARCHITECTURE.md` (Mermaid C4 is fine).
- Runbooks in `docs/runbooks/`: `payment-webhook-failure.md`, `db-connection-lost.md`, `deployment-rollback.md`.

---

## 5. Cross-cutting reference

### 5.1 Test coverage matrix (target by phase end)

| App / Route | Today | P1 target | P2 target |
|---|---|---|---|
| backend/apps/accounts | 0 % | 80 % | 90 % |
| backend/apps/training (incl. webhook) | 0 % | 90 % | 95 % |
| backend/apps/rfq | 0 % | 70 % | 85 % |
| backend/apps/subscriptions | 0 % | 70 % | 85 % |
| backend/apps/cms | partial | 60 % | 80 % |
| backend/apps/notifications | 0 % | 60 % | 80 % |
| frontend src/lib (api, hooks, store) | 0 % | 60 % | 80 % |
| frontend src/middleware.ts | 0 % | 100 % | 100 % |
| E2E (Playwright) | 0 | core 4 journeys | core + admin |

### 5.2 Environment variable reference

Source of truth lives in `backend/.env.example` and the new `.env.example` at the repo root (compose). When adding a new variable, update both files **and** add a one-line note in this table.

| Var | Read by | Default (dev) | Required in prod | Notes |
|---|---|---|---|---|
| `DJANGO_SECRET_KEY` | Django | (set) | yes | Random 50+ chars. |
| `DEBUG` | Django | `True` | must be `False` | Enforced via `production.py` assertion. |
| `DJANGO_SETTINGS_MODULE` | Django | `abs_backend.settings.local` | `abs_backend.settings.production` | |
| `ALLOWED_HOSTS` | Django prod | n/a | yes (≥ 1) | Comma-list; assert non-empty. |
| `CSRF_TRUSTED_ORIGINS` | Django prod | n/a | yes | Comma-list of full origins. |
| `CORS_ALLOWED_ORIGINS` | Django prod | n/a | yes | Comma-list of frontend origins (e.g. `https://abs.com,https://www.abs.com`). Asserted non-empty in `production.py` (§ 2.5). |
| `POSTGRES_*` | Django, postgres container | — | yes | DB / USER / PASSWORD / HOST / PORT. |
| `REDIS_URL` | Django, Celery | `redis://redis:6379/0` | yes | |
| `JWT_SECRET` | Django + Next.js middleware | `dev-jwt-secret` | yes | Must match across services. |
| `FLUTTERWAVE_SECRET_KEY` | Django | unset | yes | Reject startup if blank in prod. |
| `FLUTTERWAVE_PUBLIC_KEY` | Frontend (`NEXT_PUBLIC_*`) | unset | yes | Hosted-checkout init. |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Django | unset | yes | Used in HMAC verification (after § 2.1.1 fix). |
| `RESEND_API_KEY` | Django | unset | yes | |
| `RESEND_FROM_EMAIL` / `_SALES_EMAIL` / `_ADMIN_EMAIL` | Django | unset | yes | |
| `FRONTEND_URL` | Django | `http://localhost:5050` | yes | CORS + Flutterwave redirect. |
| `REVALIDATION_SECRET` | Django + Next.js | unset | yes | Shared with `/api/revalidate`. |
| `NEXT_PUBLIC_API_URL` | Frontend | derived from `BACKEND_HOST_PORT` | yes | Auto-follows port overrides. |
| `NEXT_PUBLIC_SITE_URL` | Frontend | derived | yes | |
| `BACKEND_ORIGIN` | Frontend rewrites | `http://backend:8000` | yes | |
| `*_HOST_PORT`, `CONTAINER_PREFIX`, `COMPOSE_PROJECT_NAME` | docker-compose | defaults | optional | Documented in root `.env.example`. |
| `SENTRY_DSN` (FE + BE) | both | unset | recommended | Add in P1. |

### 5.3 Documentation map

| Doc | Purpose | Update when |
|---|---|---|
| `README.md` | Quick start, links | Quick-start changes; new top-level docs |
| `docs/ABS_BUILD_GUIDE.md` (this) | Engineering plan | Audit findings open/close; phase shifts |
| `docs/ABS_STAKEHOLDER_BRIEF.md` | Non-engineer summary | Phase moves; new risks; decisions needed |
| `ABS_FRONTEND_EXPERIENCE_BUILDER_V2.md` | Vision (frozen) | Only with explicit product call |
| `docs/ABS_WEBSITE_INFORMATION_ARCHITECTURE.md` | IA reference | Nav / IA decisions |
| `docs/ABS_VISUAL_PRODUCT_GALLERY_SYSTEM.md` | Gallery component spec | Component contract changes |
| `docs/prds/*` | Product requirements | New product asks |
| `docs/runbooks/*` (P2) | On-call procedures | New incident class learned |
| `docs/adr/*` (P2) | Architecture decisions | One per non-trivial choice |
| `docs/COMPLIANCE.md` (P1) | PCI / GDPR posture | Each compliance change |
| `docs/ARCHITECTURE.md` (P2) | Diagrams + flow | Major topology change |

### 5.4 Carry-forward from `ABS_LAUNCH_READINESS_MATRIX.md`

Items from the old matrix mapped into this guide. Anything not listed has been satisfied by current code (see § 1.3) or is out of scope here (Arcplus product modules — tracked in the Arcplus repo).

| Old matrix row | Lives in |
|---|---|
| Free Trial System | Already built; verify trial-expiry Celery job (P1 § 3.5) |
| Subscription Logic | Already built; gaps: tests (P1 § 3.10) |
| Pricing Engine | UI built; CMS integration (P1 § 3.4) |
| Navigation System | Done |
| Homepage | Done; image content (P1 § 3.4) |
| Arcplus Product Page | Done; CMS integration (P1 § 3.4) |
| Pricing Page | Done; CMS integration + animation (P1 § 3.4) |
| Scanners / Tags Pages | Hero treatment (P1 § 3.4); gallery system (P2 § 4.1) |
| RFQ Engine | Done; tests (P1 § 3.10) |
| Sales Email Inbox | Done (Resend); verify production deliverability (P1 deploy) |
| Production Server | Dockerfile.prod + DO App Platform (P1 § 3.7) |
| Deployment Pipeline | GitHub Actions (P1 § 3.6) |
| Database Backup | Runbook (P1 § 3.7) |
| Monitoring | Sentry + structured logs + health (P1 § 3.5) |

---

## 6. Verification (per phase)

### 6.1 P0 done — security and payment gate

Smoke-tested 2026-05-09 against the docker-compose dev stack.

- [x] All P0 items in § 2 have a green test in pytest + vitest. (139 backend + 16 new frontend, 0 regressions.)
- [ ] `python manage.py check --deploy` returns clean on production settings. *(deferred to actual deploy — production.py raises on missing secrets, so a clean check requires the real secret values.)*
- [ ] Mozilla Observatory ≥ B+ on the staging URL. *(requires live staging deploy — § 3.7.)*
- [x] Webhook smoke: signature valid → 200; signature invalid → 401; secret-as-signature (the old bug) → 401; null verify-data → 200 ignored (regression test added).
- [ ] Production secrets rotated and stored in the chosen vault; no production secret has its `.env.example` placeholder value. *(deploy-time gate — production.py refuses to boot otherwise.)*
- [x] Manual test: register → `Set-Cookie: abs_session ... HttpOnly; SameSite=Strict` and `abs_refresh ... HttpOnly; SameSite=Lax; Path=/api/v1/auth/`; response body has `access` only, no `refresh`.
- [x] Manual test: `POST /auth/token/refresh/` without cookie → 401; with cookie → 200 + new access.
- [x] Manual test: 11th login attempt within a minute → 429.
- [x] Manual test (§ 2.6 proxy): logged out, GET `/admin-portal/cms` → 307 to `/auth/login?next=%2Fadmin-portal%2Fcms`; `/portal/account` likewise. Path traversal `/media/../../etc/passwd` → 400; encoded `%2e%2e` form is normalised by Next.js so the backend only ever serves paths inside `/media/`.
- [x] Frontend headers: CSP, HSTS (max-age 63072000), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy all present on every response.

### 6.2 P1 done — launch ready

- [ ] Lighthouse mobile ≥ 90 on `/`, `/arcplus`, `/scanners`, `/configurator`.
- [ ] axe-core: 0 critical violations on those + `/auth/login`, `/portal`.
- [ ] CI green on `main` for 5 consecutive PRs.
- [ ] Sentry receiving frontend + backend events from staging.
- [ ] `/api/v1/health/` returns 200 in steady state, 503 on Redis/DB outage.
- [ ] `/privacy` and `/terms` live; cookie banner shown on first visit.
- [ ] `/auth/me/export/` and `/auth/me/delete/` exercised end-to-end via portal.
- [ ] Backend pytest coverage ≥ 60 %; frontend vitest passes.
- [ ] Production deploy reproducible from a clean checkout in < 30 min.
- [ ] At least one Postgres backup-restore drill performed in staging.

### 6.3 P2 done — apple-grade

- [ ] Visual gallery deployed on at least three products with full HERO→CONFIG sequence.
- [ ] Configurator returns real prices; configurations are shareable via URL and saveable for logged-in users.
- [ ] MFA (TOTP) enforced for `role=admin`.
- [ ] Backend coverage ≥ 80 %; Playwright E2E green for the four core journeys.
- [ ] OpenAPI doc (`/api/docs/`) live and usable.
- [ ] Visual regression suite catching unintended pixel diffs on key components.

---

## 7. Open questions (decide once, then delete from this section)

Items marked **(P0-blocking)** must be decided before any Phase 0 PR is opened, because they change *what* a P0 fix looks like, not just where it lives. Resolved items move to § 8 (Decision Log) and disappear from here.

All five original open questions were resolved on 2026-05-08 — see § 8. New open questions, log here as they arise.

(none currently)

---

## 8. Decision log

Log non-trivial decisions here as they're made. Entry format:

```
YYYY-MM-DD — Title
Decided: <one-line>. Why: <one-line>. Alternative considered: <one-line>.
```

```
2026-05-08 — Refresh-token strategy
Decided: Issue refresh token as HttpOnly, Secure, SameSite=Lax cookie (`abs_refresh`); frontend keeps only the access token in memory.
Why: Eliminates the XSS exfiltration vector and preserves "stay logged in across reload" UX.
Alternative considered: Keep refresh token in memory only (acceptable but worse UX — logged out on tab close).
```

```
2026-05-08 — abs_session SameSite
Decided: Keep `SameSite=Strict` (matches code today).
Why: We have no cross-site auth flow (no OAuth, no payment redirect that reads the session). Strict is strictly safer.
Alternative considered: Downgrade to `Lax` per original guide draft — rejected as premature.
```

```
2026-05-08 — Payments app
Decided: Delete `backend/apps/payments/` (models, providers, migrations) and remove `STRIPE_*` settings + env vars. Training keeps using its own Flutterwave path.
Why: The app is a stub — no views, no urls, dead `StripeProvider` class. Re-introducing a payments abstraction is cheap when a second real provider arrives; carrying dead code now is a security and maintenance cost.
Alternative considered: Build the Stripe webhook to P0 standards now. Rejected — no business need for Stripe yet, and Flutterwave is the launch provider.
```

```
2026-05-08 — Hosting platform
Decided: DigitalOcean App Platform (web + worker + beat services), DO Managed Postgres, DO Managed Redis, Cloudflare CDN/WAF in front, Cloudflare R2 for media.
Why: Single platform for Django + Next.js + DBs keeps admin/CI/CD/maintenance overhead low; DO is established enough for enterprise procurement; R2 zero-egress through Cloudflare beats Spaces on cost; Cloudflare proxy gives DDoS + WAF for free.
Alternative considered: Railway (very similar UX, slightly less mature vendor); Cloudflare-only (rejected — Workers don't run Django, would need a second host); AWS ECS/Fargate (rejected — overkill for current scale).
```

```
2026-05-08 — CDN + image transform
Decided: Cloudflare CDN proxies the apex; Next.js Image handles resize/format on demand; CMS-provided variants used when available; no third-party image vendor.
Why: Lowest cost and complexity. R2 origin + Cloudflare cache + Next.js Image covers our needs through P2.
Alternative considered: Cloudflare Images (deferred until volume justifies); Cloudinary/Imgix (rejected — overkill).
```

```
2026-05-08 — Monitoring vendor for P1
Decided: Sentry only (frontend + backend). No metrics vendor in P1.
Why: Free tier covers a small team; we don't yet have a metrics question Sentry can't answer. Avoid premature tool sprawl.
Alternative considered: Sentry + Grafana Cloud free tier (deferred); Datadog (rejected — cost not justified at current scale).
```

```
2026-05-08 — Frontend admin gating
Decided: Add `src/middleware.ts` (P0, § 2.6) that verifies `abs_session` JWT and gates `/admin-portal/*` and `/portal/*` at the edge.
Why: Today admin pages render client-side and only the API rejects unauthorised users. Defence in depth + the cookie comment in `accounts/views.py` already presumes middleware.
Alternative considered: Rely on backend `IsAdmin` only (rejected — admin shell loads before any rejection).
```

---

## 9. Appendix — superseded documents and dead code

### Superseded docs

These are kept in the repo for history. Don't update them; update this guide instead.

- `docs/ABS_LAUNCH_READINESS_MATRIX.md`
- `docs/plans/ABS_POST_CMS_IMPLEMENTATION_PLAN.md`
- `docs/plans/platform-implementation-plan.md`
- `docs/plans/ABS_CMS_IMPLEMENTATION_PLAN.md` (CMS Phase 2 was completed; gaps fold into this guide)

The vision and IA documents are *not* superseded — they describe intended product, not status, and remain canonical references.

### Dead code scheduled for removal

Per the 2026-05-08 decision (§ 8), the following are slated for deletion in a P0 cleanup PR. Do not add new references to them:

- `backend/apps/payments/` — entire app (models, providers, migrations). The `StripeProvider` class was never wired (no views, no urls).
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/abs_backend/settings/base.py`.
- Any `STRIPE_*` references in `.env.example`.
