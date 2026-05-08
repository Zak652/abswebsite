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
**Today:** `httponly=False`. The comment in [accounts/views.py:16](../backend/apps/accounts/views.py) says "read by Next.js middleware" — but middleware reads the cookie server-side, not via JavaScript. `HttpOnly` is correct here.
**Fix:** `httponly=True`, `samesite="Lax"` (allows top-level navigation cookies; `Strict` may break some flows), `secure=True` in production (do not gate on `DEBUG` alone — drive from settings).
**Acceptance:** browser devtools shows `HttpOnly`; Next.js middleware still reads cookie via `request.cookies` (server-side); manual `document.cookie` returns no `abs_session`.

#### 2.2.2 🔴 Refresh token must not live in `sessionStorage`
**File:** [src/lib/store/authStore.ts:39-55](../src/lib/store/authStore.ts)
**Today:** `partialize` includes `refreshToken` and the storage is `sessionStorage`. Any successful XSS exfiltrates a long-lived refresh token.
**Fix (recommended):** stop persisting the refresh token. Issue it as an `HttpOnly`, `Secure`, `SameSite=Lax` cookie from Django. Have the access-token refresh endpoint read it from the cookie. Frontend keeps only the access token, in memory.
**Alternative (acceptable):** keep the refresh token client-side **in memory only** (no `partialize`), and accept the UX cost of "logged out on tab close."
**Acceptance:** after login, `sessionStorage.getItem("abs-auth")` does not contain `refreshToken`; refresh flow still works after page reload (cookie path) or requires re-login (in-memory path).

#### 2.2.3 🟠 Production security settings
**File:** [backend/abs_backend/settings/production.py](../backend/abs_backend/settings/production.py)
Add explicitly:

```python
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")  # required, no default
```

Also: assert `len(ALLOWED_HOSTS) > 0` and `DEBUG is False` in `production.py` so a misconfigured deploy fails closed.
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
    "img-src 'self' data: blob: https://cdn.absplatform.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com; " +
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
        "webhook": "120/min",
    },
}
```

Apply scoped throttles (`ScopedRateThrottle`) to the relevant views (`LoginView`, `RegisterView`, `RFQCreateView`, `TrainingRegistrationCreateView`, `FlutterwaveWebhookView`).
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

- Raise `ImproperlyConfigured` in `production.py` if any of `DJANGO_SECRET_KEY`, `JWT_SECRET`, `RESEND_API_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `CSRF_TRUSTED_ORIGINS`, `ALLOWED_HOSTS` is unset or matches a known-default placeholder string.
- The frontend should fail at build time if any required `NEXT_PUBLIC_*` is missing — add `src/lib/env.ts` with a `zod` schema validated at import.

---

## 3. Phase 1 — Launch-quality polish

> **Gate:** ship to production once all P0 items are closed and these P1 items meet the acceptance bar in § 6.2.

### 3.1 Accessibility (target: WCAG 2.1 AA)

| Item | Where | Fix |
|---|---|---|
| Alt-text required on every CMS media asset | `backend/apps/cms/models.py` (MediaAsset) | Make `alt_text` non-blank on save; CMS UI flags missing alts; renderer falls back to `""` only after warning is dismissed. |
| Focus trap + return on modals (TrialSignupModal et al.) | [src/components/subscriptions/TrialSignupModal.tsx](../src/components/subscriptions/TrialSignupModal.tsx) and similar | Use a tested headless lib (Radix or React Aria) or implement: focus first input on open, trap Tab/Shift+Tab, Esc to close, return focus to trigger. |
| `aria-label` on every icon-only button | Header menu/close, configurator chevrons, compare expand toggles | Audit all `<button>` with no text child; require `aria-label` via lint rule. |
| `prefers-reduced-motion` respected by every motion component | All `motion.*` and GSAP timelines | Centralise in a `useMotionPreference()` hook that returns the right variants; lint rule fails the build if a `motion.div` without `transition: undefined` ships in a file that doesn't import the hook. |
| Color contrast audited | Tailwind config + `globals.css` | Run an automated contrast test (axe-core, or Pa11y) against the four hero routes; fix any AA failure. Signal Orange on warm-white especially. |
| Form `<label htmlFor>` connected to inputs | All form components | Done by primitives; verify any custom CMS-editor field. |

**Acceptance:** axe-core run in vitest reports 0 critical violations on `/`, `/scanners`, `/tags`, `/configurator`, `/auth/login`, `/portal`.

### 3.2 SEO

| Item | Where | Fix |
|---|---|---|
| `Product` JSON-LD on hardware detail pages | `src/app/scanners/[slug]/page.tsx`, `src/app/tags/[slug]/page.tsx` | `generateMetadata` adds a `<script type="application/ld+json">` with name/image/description/sku/offers from CMS. |
| `Article` JSON-LD on blog posts | `src/app/resources/blog/[slug]/page.tsx` | headline, datePublished, dateModified, author, image. |
| `Organization` schema in root layout | `src/app/layout.tsx` | Pull from CMS site-settings, render once. |
| Image entries in sitemap | `src/app/sitemap.ts` | Add `images: [...]` per page that has a hero/og image. |
| Canonical URL wired from CMS | dynamic page templates | Read `pageMetaData.canonical_url`; default to the request URL. |
| `hreflang` alternates | layout / metadata | Skip until regional variants exist; leave a TODO. |
| OG images sized 1200×630 | metadata factories | Specify `width`/`height` in OG image objects; ensure source images are at least 16:9. |

**Acceptance:** Google's Rich Results Test passes on a product detail page and a blog post.

### 3.3 Performance

| Item | Where | Fix |
|---|---|---|
| Pick **one** animation library | repo-wide | Audit GSAP usage. If <3 timelines, remove and use Framer Motion only. The vision allows both, but bundle weight is a P1 concern. |
| Dynamic-import heavy client routes | `src/app/configurator/*`, `src/app/compare/*` | `dynamic(() => import(...), { loading: <Skeleton /> })`. Drops initial bundle for users who don't visit those paths. |
| Tighten `images.remotePatterns` | `next.config.ts` | Replace `**.amazonaws.com` with the actual bucket subdomain(s). |
| Conditional `priority` on hero images | `src/components/patterns/HeroSection.tsx:126` | Only the homepage hero is LCP; pass `priority` as a prop (default `false`). |
| Use CMS-provided variants | `src/lib/api/cms-server.ts` | When `MediaAsset` includes `file_webp`/`file_large`/`file_medium`, pick the right size for the rendered slot. |
| Tune TanStack Query staleTime per query type | `src/app/providers.tsx` | Pricing & availability: 30 s. CMS content: 5 min. Static catalogs: 1 h. |

**Acceptance:** Lighthouse mobile ≥ 90 on `/`, `/arcplus`, `/scanners`, `/configurator`. Bundle analyzer shows configurator chunk loaded only on `/configurator`.

### 3.4 UX baseline (closing visible vision gaps)

| Item | Vision ref | Fix |
|---|---|---|
| Image-first hero on `/scanners` and `/tags` index | "Images ARE the primary communication layer" | Add a hero band above each list with one large environment image and the category headline. |
| Sticky summary bar on configurator | § 7 in vision | Fixed-bottom bar with running total, selected options, "Add to Quote" CTA. Keep visible on mobile. |
| "Recommended" highlight in compare | § 8 in vision + `recommended: true` flag exists | Visual treatment: subtle accent border, badge, slight `bg` shift. Keep `recommended` data-driven. |
| Wire CMS data into compare and configurator | duplicates audit finding #43 | Replace hardcoded fallback arrays in `ComparePageClient`, `ConfiguratorPageClient`, `ArcplusPageClient` with CMS reads; keep the arrays as the seeder's source so dev still works without DB content. |
| Pricing toggle uses `layoutId` for smooth animation | § 6 in vision ("price animates smoothly") | Wrap each price in `<motion.span layoutId={tier.id} />`. |

**Acceptance:** a designer review confirms the four hero routes "feel like a showroom"; no PR merges if compare/configurator regress in image quality vs. screenshots filed in `docs/`.

### 3.5 Observability

| Item | Where | Fix |
|---|---|---|
| Sentry — backend | `backend/abs_backend/settings/production.py` | `sentry-sdk` with `DjangoIntegration`, `CeleryIntegration`. Tracesample 0.1. PII scrubbing on. |
| Sentry — frontend | `src/instrumentation.ts` (Next.js 16) | `@sentry/nextjs`; share a single Sentry org / project pair. |
| Structured JSON logs | `LOGGING` in base settings | `python-json-logger`; emit to stdout (Docker collects). |
| Request-ID middleware | new `apps/core/middleware.py` | Generate UUID per request, set in log context, return as `X-Request-ID` header; thread through Celery via task headers. |
| `/api/v1/health/` | `apps/core/views.py` | Returns 200 with `{db: ok, redis: ok, celery: ok, time}`; checks DB connection, Redis ping, Celery via `inspect.ping()` (timeboxed). 503 if any fails. Wire into Docker `HEALTHCHECK` and any orchestrator probe. |
| Celery task result monitoring | settings + `apps/core/celery.py` | Enable result backend; alert on `task_failure` signal (Sentry receives by default). |

**Acceptance:** triggering an exception locally lands in Sentry within 60 s; `curl /api/v1/health/` returns 200 when stack is healthy and 503 if redis is stopped.

### 3.6 CI/CD

Create `.github/workflows/ci.yml` running on PRs to `main`:

1. Frontend job: `npm ci`, `npm run lint`, `tsc --noEmit`, `npm test`, `npm run build`.
2. Backend job: `pip install -r requirements-dev.txt`, `ruff check`, `mypy backend`, `pytest --cov --cov-fail-under=60`, `python manage.py check --deploy --settings=abs_backend.settings.production`.
3. Security job: `npm audit --audit-level=high`, `pip-audit`, `gitleaks detect`. Block on Critical findings.
4. Container job: build `Dockerfile.prod` and scan with Trivy; fail on Critical CVEs.

Branch protection on `main`: require all jobs green + 1 review.

**Acceptance:** a PR with a failing test cannot be merged; a PR introducing a vulnerable dep is blocked.

### 3.7 Production deployment

| Item | Where | Fix |
|---|---|---|
| `Dockerfile.prod` for backend | `backend/Dockerfile.prod` (new) | Multi-stage; non-root user `appuser`; `gunicorn abs_backend.wsgi:application -k uvicorn.workers.UvicornWorker -w 4`; add `HEALTHCHECK`. |
| `Dockerfile.prod` for frontend | `Dockerfile.prod` (new) | Build with `output: "standalone"`; copy `.next/standalone` only; non-root. |
| `output: "standalone"` | `next.config.ts` | Add. |
| Reverse proxy | `infra/nginx/nginx.conf` (new) | TLS termination, gzip, security headers (mirror Next.js header config), `/api/` upstream → gunicorn, `/` upstream → next standalone. Or use a hosted equivalent (Caddy / Traefik / Vercel + Railway). |
| Media to object storage | settings + `django-storages` | S3 or R2 bucket; `MEDIA_URL` points at CDN domain. Container volume becomes a dev-only convenience. |
| Postgres backup | runbook + cron | Document `pg_dump` strategy; verify a restore in staging quarterly. |
| Zero-downtime migrations | runbook | Document the additive-migration pattern (add column → backfill → switch reads → drop in next release); never block a deploy on a destructive migration. |

**Acceptance:** a clean deploy from `main` reaches green health on first request; rollback path documented.

### 3.8 Account lifecycle (auth completeness)

Today's auth flow stops at register / login / refresh / logout. Add the missing pieces before public launch:

| Item | Where | Fix |
|---|---|---|
| Password reset | new endpoints in `apps/accounts` | `POST /auth/password/reset/` issues a signed token via Django's `default_token_generator`; emails a one-shot URL; `POST /auth/password/reset/confirm/` consumes it. Tokens expire ≤ 1 h. Rate-limit both endpoints (`5/hour` per IP). |
| Email verification | new endpoints + `User.email_verified_at` | On register, send a signed verification link; gate sensitive actions (admin, payment) on verified email; allow re-send (rate-limited). |
| Signed links generally | shared util `apps/core/signing.py` | Use `django.core.signing.TimestampSigner` for any one-click email action so tokens can't be forged or reused after expiry. |
| Frontend safe-redirect helper | `src/lib/redirect.ts` (new) | Whitelist of internal-only paths; export `safeRedirect(url)` and use it everywhere we currently hardcode `window.location.href`. Pre-empts the "open redirect on logout" attack vector if logout is ever extended with a `?next=` param. |
| Sanitised client error display | `src/lib/api/client.ts` | Map upstream errors to a small typed enum; never render raw backend `detail` strings unless they're known-safe. Server logs the full exception (with request ID, § 3.5). |

**Acceptance:** a user who forgets their password can recover via email in < 5 min; an unverified user can't access the portal payment flow.

### 3.9 Compliance and privacy

| Item | Fix |
|---|---|
| `/privacy` and `/terms` routes | Static MDX or CMS-managed; link in footer. |
| Cookie consent banner | One-time consent for non-essential cookies; gate analytics until accepted. |
| `GET/POST /auth/me/export/` | Returns user's data (profile, RFQs, registrations, subscriptions) as a downloadable JSON. |
| `POST /auth/me/delete/` | Soft-delete user; anonymise PII in linked records; cancel active subscriptions; email confirmation. |
| PCI scope statement | Add `docs/COMPLIANCE.md`: confirm SAQ-A scope (Flutterwave hosted, no card data on our infra). |
| Audit log for admin actions | Wire all CMS mutations through `cms.AuditLog` (model exists). |
| Data-retention notes | RFQ: 24 months. Trial signup data: 12 months. Logs: 12 months. Documented in privacy policy. |

**Acceptance:** a test user can export and then delete their account end-to-end via the portal.

### 3.10 Tests added in P1

Target: ≥ 60 % backend coverage; key user journeys covered E2E.

**Backend (pytest)**
- `apps/training/tests/test_webhook.py` — signature valid/invalid, replay, duplicate delivery, amount-tampering.
- `apps/training/tests/test_registration_flow.py` — register → mock-Flutterwave → webhook → email sent.
- `apps/training/tests/test_capacity.py` — concurrent registrations don't exceed capacity.
- `apps/accounts/tests/test_register.py`, `test_login.py`, `test_lockout.py` (axes), `test_logout_blacklists_refresh.py`.
- `apps/accounts/tests/test_admin_permissions.py` — non-admin gets 403 on every `/admin/*`.
- `apps/cms/tests/test_html_sanitisation.py` — `<script>` removed, `rel` added to outbound links.
- `apps/cms/tests/test_media_validation.py` — invalid MIME, oversize, polyglot.
- `apps/rfq/tests/test_submission.py` — happy path + email mock.

**Frontend (vitest + RTL)**
- `src/__tests__/auth-store.test.ts` — hydration, logout clears storage.
- `src/__tests__/api-client-401.test.ts` — 401 → refresh → retry → success; refresh failure → logout redirect.
- `src/__tests__/middleware.test.ts` — protected routes redirect to `/auth/login`; admin routes 403 for non-admin role.
- `src/__tests__/a11y.test.ts` — axe-core on `/`, `/arcplus`, `/scanners`, `/configurator`.
- Form validation + error display tests for `LoginForm`, `RegisterForm`, `RFQForm`.

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
| backend/apps/payments | 0 % | 70 % | 90 % |
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
| Production Server | Dockerfile.prod, Nginx (P1 § 3.7) |
| Deployment Pipeline | GitHub Actions (P1 § 3.6) |
| Database Backup | Runbook (P1 § 3.7) |
| Monitoring | Sentry + structured logs + health (P1 § 3.5) |

---

## 6. Verification (per phase)

### 6.1 P0 done — security and payment gate

- [ ] All P0 items in § 2 have a green test in CI.
- [ ] `python manage.py check --deploy` returns clean on production settings.
- [ ] Mozilla Observatory ≥ B+ on the staging URL.
- [ ] Webhook simulator: signature valid → 200; signature invalid → 401; duplicate → 200, no double-write; tampered amount → rejected + alert.
- [ ] Production secrets rotated and stored in the chosen vault; no production secret has its `.env.example` placeholder value.
- [ ] Manual test: `document.cookie` in browser does **not** include `abs_session`.
- [ ] Manual test: `sessionStorage` does **not** contain `refreshToken` after login.

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

- **Hosting target.** AWS vs Cloudflare (Pages + Workers + R2) vs Railway/Fly. Drives Dockerfile.prod, secrets vault, media storage choices.
- **Monitoring vendor.** Sentry only (free tier covers small teams) vs Sentry + a metrics tool (Grafana Cloud / Datadog). Affects § 3.5 implementation.
- **Refresh-token strategy.** § 2.2.2 lists two acceptable approaches; pick one before P0 close so the frontend doesn't churn.
- **CDN / image transform.** Use Next.js's image optimizer behind the CDN, or push to a transform service (Cloudinary / Imgix)? Affects § 3.3.
- **Stripe?** `STRIPE_WEBHOOK_SECRET` is referenced in settings but no handler exists. If never adopted, remove the setting; if adopted, build the handler with the same care as Flutterwave (P0 rules apply).

---

## 8. Decision log

Log non-trivial decisions here as they're made. Entry format:

```
YYYY-MM-DD — Title
Decided: <one-line>. Why: <one-line>. Alternative considered: <one-line>.
```

(empty)

---

## 9. Appendix — superseded documents

These are kept in the repo for history. Don't update them; update this guide instead.

- `docs/ABS_LAUNCH_READINESS_MATRIX.md`
- `docs/plans/ABS_POST_CMS_IMPLEMENTATION_PLAN.md`
- `docs/plans/platform-implementation-plan.md`
- `docs/plans/ABS_CMS_IMPLEMENTATION_PLAN.md` (CMS Phase 2 was completed; gaps fold into this guide)

The vision and IA documents are *not* superseded — they describe intended product, not status, and remain canonical references.
