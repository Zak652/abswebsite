# ABS Platform — Post-CMS Launch Readiness Plan

## TL;DR

With the 4-phase CMS implementation complete (26 models, 20 admin pages, full ISR pipeline), the platform needs **launch-readiness work**: seed the CMS database with current hardcoded content, expand backend test coverage, set up CI/CD, harden production infrastructure, and wire remaining loose ends. Six phases, ordered by launch dependency.

### Current State Snapshot

| Area | Status |
|---|---|
| CMS backend (26 models, admin + public API) | ✅ Complete |
| CMS frontend (ISR pages, admin portal) | ✅ Complete |
| Backend tests — CMS app | ✅ 108 tests, 18 factories |
| Backend tests — other 7 apps | ❌ Zero tests |
| CMS seed command | ❌ Not built (~192 records needed) |
| CI/CD pipeline | ❌ No `.github/workflows/` |
| Production Docker/Nginx | ❌ Dev-only compose, no prod config |
| Stripe + Flutterwave | ✅ Fully implemented |
| MTN MoMo + Airtel Money | ⚠️ Stubs only |
| TestimonialCarousel | ⚠️ Built but not wired into any page |
| Scheduled publish task | ⚠️ Missing Phase 4 models |

---

## Phase A: CMS Content Seed Command

**Priority:** 🔴 Launch Blocker
**Effort:** Medium
**Dependencies:** None

**Why:** Every CMS-driven page falls back to hardcoded `FALLBACK_*` data when the database is empty. Without seeding, the first deploy serves fallback content and any admin edits create duplicates rather than updating existing records. The seed command is defined in the CMS plan (Step 8) but was never built.

**~192 records** across 17 models. All created with `status=published`.

### Steps

**A1. Create management command** — `backend/apps/cms/management/commands/seed_cms_content.py`

- Follow `seed_products.py` pattern: idempotent `update_or_create` keyed on `slug`/`page`/`route`, `--clear` flag, progress output
- Accept `--skip-existing` flag (for Docker entrypoint — only seed if empty)

**A2. Seed non-publishable lookup models first** (no FK dependencies):

- `SiteSettings` (1 singleton) — currency_rates `{USD:1, UGX:3700, KES:130}`, company phone/email/address, social_links
- `AssetTag` — basic tags: "product", "hero", "icon", "case-study"
- `PlanFeature` (13) — from `ArcplusPageClient.tsx` `featureComparison` array
- `SupportFeature` (7) — from `SupportPageClient.tsx` `FALLBACK_TIERS[].features`
- `BlogCategory` (3) — "Industry Insights", "Product Updates", "Best Practices"

**A3. Seed publishable models** (depend on lookups):

- `PageMeta` (~10 routes) — extract titles/descriptions from each page's `generateMetadata()` export
- `HeroSection` (3) — home, arcplus, services — from `DEFAULT_HERO` objects in client components
- `PageBlock` (~4) — homepage: guided_decision, trust_stats, feature_grid; arcplus: workflow
- `NavigationItem` (16) — 5 header from `Header.tsx DEFAULT_NAV_ITEMS` + 11 footer from `Footer.tsx`
- `ServiceOffering` (6) — from `ServicesPageClient.tsx` services array
- `ArcplusModule` (8) — from `ArcplusPageClient.tsx` modules array
- `PricingPlan` (4) — from `ArcplusPageClient.tsx` pricingPlans array
- `PlanFeatureValue` (52) — 13 features × 4 plans from featureComparison matrix
- `SupportTier` (4) — from `SupportPageClient.tsx`
- `SupportFeatureValue` (28) — 7 features × 4 tiers
- `CaseStudy` (3) — Lamu County, Pan African Airways, Nairobi Metro from `FALLBACK_CASE_STUDIES`
- `DocumentationPage` (8) — from `DocsPageClient.tsx` `FALLBACK_SECTIONS`
- `APIEndpointGroup` (5) + `APIEndpoint` (20) — from `APIReferencePageClient.tsx` `FALLBACK_ENDPOINTS`

**A4. Seed EmailTemplate records** (10 trigger types) — extract subject/body from `backend/apps/notifications/templates/` filesystem HTML templates, map to trigger_type choices

**A5. Add to Docker entrypoint** — append `python manage.py seed_cms_content --skip-existing` after `migrate` in `docker-compose.yml` backend command

### Relevant Files

| File | Purpose |
|---|---|
| `backend/apps/products/management/commands/seed_products.py` | Pattern to follow |
| `backend/apps/cms/models.py` | All 26 model definitions |
| `src/app/HomePageClient.tsx` | Homepage fallback data (hero, stats, guided paths) |
| `src/app/arcplus/ArcplusPageClient.tsx` | Modules, pricing plans, feature matrix, lifecycle |
| `src/app/services/ServicesPageClient.tsx` | 6 service offerings |
| `src/components/layout/Header.tsx` | `DEFAULT_NAV_ITEMS` (5 header links) |
| `src/components/layout/Footer.tsx` | Footer links (11) + contact info |
| `src/app/resources/case-studies/page.tsx` | 3 case studies |
| `src/app/resources/support/SupportPageClient.tsx` | 4 tiers, 7 features, 28 values |
| `src/app/resources/docs/DocsPageClient.tsx` | 8 documentation pages |
| `src/app/resources/api-reference/APIReferencePageClient.tsx` | 5 groups, 20 endpoints |
| `backend/apps/notifications/templates/` | Email HTML templates → EmailTemplate seed |

### Verification

1. `docker compose exec backend python manage.py seed_cms_content --verbosity=2` — all 192+ records created with success output
2. Re-run same command — idempotent, no duplicates, "already exists" messages
3. `docker compose exec backend python manage.py seed_cms_content --clear` — wipes and re-seeds
4. Browse homepage, arcplus, services, case-studies, docs, support, api-reference — content identical to current hardcoded fallbacks
5. All seeded publishable records have `status="published"` and `version=1`

---

## Phase B: Backend Test Coverage

**Priority:** 🟡 Launch Quality
**Effort:** Large
**Dependencies:** None (parallel with Phase A)

**Why:** Only the `cms` app has tests (108 methods across 6 files + 18 factories). The other 7 apps — including auth, payments, and quote submission — have zero test coverage. These are launch-critical flows.

### Steps

**B1. Add test dependencies to `requirements.txt`:**

- `pytest-cov` — coverage reporting
- `freezegun` — time-dependent tests (trial expiry, scheduled publish)

**B2. Create test factories** — `backend/apps/{app}/tests/factories.py` for each app:

- `accounts`: `OrganizationFactory` (extend root `conftest.py`)
- `products`: `ProductCategoryFactory`, `ProductFactory`, `ProductConfigSectionFactory`, `ProductConfigOptionFactory`
- `rfq`: `RFQSubmissionFactory`
- `services`: `ServiceRequestFactory`
- `subscriptions`: `TrialSignupFactory`
- `training`: `TrainingSessionFactory`, `TrainingRegistrationFactory`

**B3. Tests for `accounts` app** (~15 tests) — `backend/apps/accounts/tests/`:

- `test_register.py` — valid registration, duplicate email, missing fields, organization auto-creation
- `test_login.py` — success, wrong password, inactive user, session cookie set
- `test_logout.py` — refresh token blacklisted, session cookie deleted
- `test_permissions.py` — admin endpoints blocked for client role, `MeView` returns correct user

**B4. Tests for `products` app** (~10 tests) — `backend/apps/products/tests/`:

- `test_views.py` — list products, filter by category, detail by slug, config sections endpoint, 404 on invalid slug
- `test_seed_command.py` — `seed_products` creates expected records, idempotent re-run

**B5. Tests for `rfq` app** (~8 tests) — `backend/apps/rfq/tests/`:

- `test_views.py` — anonymous submission success, authenticated submission links to user, validation errors on missing fields, admin list/filter

**B6. Tests for `services` app** (~6 tests) — `backend/apps/services/tests/`:

- `test_views.py` — service request creation for all 5 types, validation on required fields

**B7. Tests for `subscriptions` app** (~12 tests) — `backend/apps/subscriptions/tests/`:

- `test_views.py` — trial signup success, duplicate email prevention, trial listing for authenticated user
- `test_tasks.py` — `check_trial_expiry` with `freezegun`: day-7 reminder sent, day-3 reminder sent, auto-expire on expiry date

**B8. Tests for `training` app** (~10 tests) — `backend/apps/training/tests/`:

- `test_views.py` — session listing, registration creation, payment callback with valid/invalid Flutterwave signature

**B9. Tests for `payments` app** (~8 tests) — `backend/apps/payments/tests/`:

- `test_providers.py` — Flutterwave initiate/verify (mocked HTTP), Stripe initiate/verify (mocked), provider routing logic returns correct provider class

**B10. Add Phase 4 CMS factories** (if missing from existing `factories.py`):

- `BlogCategoryFactory`, `BlogPostFactory`, `EmailTemplateFactory`, `TestimonialFactory`, `RegionalVariantFactory`

**B11. Configure coverage reporting** — add to `pytest.ini`:

```
addopts = --cov=apps --cov-report=term-missing --cov-fail-under=60
```

### Relevant Files

| File | Purpose |
|---|---|
| `backend/conftest.py` | Root fixtures: `admin_user`, `client_user`, API clients |
| `backend/apps/cms/tests/factories.py` | 18 existing factories (reference pattern) |
| `backend/apps/cms/tests/test_models.py` | Test structure pattern to follow |
| `backend/apps/accounts/views.py` | Register, login, logout, me views |
| `backend/apps/products/views.py` | Product list/detail views |
| `backend/apps/subscriptions/tasks.py` | Trial expiry Celery task |
| `backend/apps/payments/providers.py` | 4 payment providers |

### Verification

1. `docker compose exec backend pytest -v --tb=short` — all tests pass (target: 108 existing + ~70 new ≈ 178)
2. `docker compose exec backend pytest --cov=apps --cov-report=term-missing` — ≥60% coverage across all apps
3. No external API calls (Resend, Flutterwave, Stripe) — all mocked

---

## Phase C: CI/CD Pipeline

**Priority:** 🔴 Launch Blocker
**Effort:** Small
**Dependencies:** None (parallel with A and B)

**Why:** No `.github/workflows/` directory exists. Every merge to `main` is unvalidated — no lint, no type-check, no tests, no build verification.

### Steps

**C1. Create `.github/workflows/ci.yml`** — triggers on push to `main` + all PRs:

Backend job:

- Services: `postgres:16-alpine`, `redis:7-alpine`
- Install: `pip install -r backend/requirements.txt`
- Migrate: `python manage.py migrate --settings=abs_backend.settings.local`
- Test: `pytest -v --tb=short --cov=apps`

Frontend job (*parallel with backend*):

- Install: `npm ci`
- Lint: `npx eslint .`
- Type-check: `npx tsc --noEmit`
- Test: `npx vitest run`

Build verification job (*depends on both above*):

- `npm run build` — catches SSR/ISR errors not found by tsc alone

**C2. Create `.github/workflows/deploy.yml`** — triggers on push to `main` after CI passes:

- Build backend Docker image → push to container registry
- Build frontend Docker image (standalone) → push to registry
- Deploy placeholder (SSH/cloud API — actual target TBD)
- Post-deploy: run migrations + `seed_cms_content --skip-existing`

**C3. Document branch protection rules** — add to README or CONTRIBUTING.md:

- Require CI pass before merge to `main`
- Require at least 1 review (recommended)

### Relevant Files

| File | Purpose |
|---|---|
| `package.json` | npm scripts: `test`, `lint`, `build` |
| `backend/requirements.txt` | Python dependencies |
| `backend/pytest.ini` | pytest configuration |
| `eslint.config.mjs` | ESLint flat config |
| `docker-compose.yml` | Service definitions (reference for CI) |

### Verification

1. Push a feature branch → CI runs → backend + frontend jobs both pass
2. Introduce a deliberate test failure → CI fails → merge blocked
3. Merge to `main` → deploy workflow triggers

---

## Phase D: Production Infrastructure

**Priority:** 🔴 Launch Blocker
**Effort:** Large
**Dependencies:** Phase C (deploy workflow)

**Why:** Current Docker setup is dev-only (`runserver`, `npm run dev`). The launch readiness matrix requires production server, domain configuration, deployment pipeline, and monitoring.

### Steps

**D1. Create `backend/Dockerfile.prod`** — multi-stage production build:

- Stage 1: install Python dependencies
- Stage 2: copy code, `collectstatic`, create non-root user (`appuser`)
- CMD: `gunicorn abs_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120`
- Add `gunicorn==22.0.0` to `requirements.txt`

**D2. Create `Dockerfile.frontend`** — standalone Next.js production build:

- Stage 1: `npm ci` + `npm run build`
- Stage 2: copy `.next/standalone` + `.next/static` + `public/`
- CMD: `node server.js`
- Update `next.config.ts` — add `output: 'standalone'`

**D3. Create `docker-compose.prod.yml`** — production override:

- Backend: uses `Dockerfile.prod`, `DJANGO_SETTINGS_MODULE=abs_backend.settings.production`
- Frontend: uses `Dockerfile.frontend`, production env vars
- Nginx: reverse proxy (see D4)
- Remove source code volume mounts
- Add `restart: unless-stopped` on all services
- Health checks on postgres, redis, backend, frontend

**D4. Create `nginx/` directory:**

- `nginx.conf` — upstream backend:8000 + frontend:3000, SSL termination, proxy_pass, gzip, security headers (X-Frame-Options, Content-Security-Policy, HSTS, X-Content-Type-Options)
- `Dockerfile` — `nginx:alpine` with custom config
- Location blocks: `/api/` → backend, `/admin/` → backend, `/media/` → backend static, `/_next/` → frontend, `/` → frontend

**D5. Harden production settings** — `backend/abs_backend/settings/production.py`:

- `STATIC_ROOT = BASE_DIR / "staticfiles"` for collectstatic
- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`
- `LOGGING` config — structured JSON format, log to stdout
- `DEFAULT_FROM_EMAIL` / `SERVER_EMAIL` from env
- `MEDIA_ROOT` / `MEDIA_URL` for production media storage

**D6. Create `.env.example`** — document ALL required env vars:

- Django: `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL`, `REDIS_URL`, `CORS_ALLOWED_ORIGINS`
- Auth: `SIMPLE_JWT_SIGNING_KEY`
- Payments: `STRIPE_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`
- Email: `RESEND_API_KEY`, `DEFAULT_FROM_EMAIL`
- CMS: `REVALIDATION_SECRET`, `NEXT_PUBLIC_API_URL`
- Monitoring: `SENTRY_DSN` (optional)

### Relevant Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Current dev config (reference) |
| `backend/Dockerfile` | Current minimal dev Dockerfile |
| `backend/abs_backend/settings/production.py` | Existing bare-minimum prod settings |
| `backend/abs_backend/settings/base.py` | Base settings to extend |
| `next.config.ts` | Needs `output: 'standalone'` |

### Verification

1. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build` — all services start
2. Backend serves via gunicorn (check process, not runserver)
3. Frontend serves built Next.js app (check `node server.js`, not `npm run dev`)
4. `curl -I http://localhost` — returns security headers
5. `/api/v1/cms/settings/` proxied to backend correctly
6. Frontend pages load with proper SSR content
7. Media uploads work through nginx proxy

---

## Phase E: Wire Remaining Features

**Priority:** 🟢 Post-Launch Quality
**Effort:** Small
**Dependencies:** Phase A (seed data needed for testimonials)

**Why:** Several built components aren't connected. The scheduled publish task is missing Phase 4 models.

### Steps

**E1. Wire TestimonialCarousel into pages** — component exists at `src/components/patterns/TestimonialCarousel.tsx` but is imported nowhere:

- `src/app/page.tsx` — fetch `testimonials?placement=homepage` server-side via `fetchTestimonials("homepage")`, pass to `HomePageClient`
- `src/app/HomePageClient.tsx` — render `<TestimonialCarousel testimonials={testimonials} />` after services section
- `src/app/arcplus/page.tsx` — fetch `testimonials?placement=arcplus`, pass to client component
- `src/app/services/page.tsx` — fetch `testimonials?placement=services`, pass to client component

**E2. Fix `publish_scheduled_content` task** — `backend/apps/cms/tasks.py` currently queries only 7 models. Add missing:

- `BlogPost`
- `EmailTemplate`
- `Testimonial`
- `DocumentationPage`

**E3. Dynamic product slugs in sitemap** — `src/app/sitemap.ts` hardcodes scanner/tag slugs. Fetch from products API instead:

- Import product fetch function
- Map product slugs to `/scanners/{slug}` and `/tags/{slug}` routes
- Remove hardcoded slug arrays

**E4. Add Phase 4 CMS test factories** (if missing) — `BlogCategoryFactory`, `BlogPostFactory`, `EmailTemplateFactory`, `TestimonialFactory`, `RegionalVariantFactory` in `backend/apps/cms/tests/factories.py`

**E5. Seed sample testimonials** — add 3-4 testimonials to `seed_cms_content.py` (Phase A) for each placement (homepage, arcplus, services)

### Relevant Files

| File | Purpose |
|---|---|
| `src/components/patterns/TestimonialCarousel.tsx` | Built component, currently unused |
| `src/app/HomePageClient.tsx` | Wire testimonial carousel |
| `src/app/arcplus/ArcplusPageClient.tsx` | Wire testimonial carousel |
| `src/app/services/ServicesPageClient.tsx` | Wire testimonial carousel |
| `src/lib/api/cms-server.ts` | `fetchTestimonials()` already exists |
| `backend/apps/cms/tasks.py` | `publish_scheduled_content` — add missing models |
| `src/app/sitemap.ts` | Replace hardcoded product slugs |
| `backend/apps/cms/tests/factories.py` | Add Phase 4 factories |

### Verification

1. Homepage renders testimonial carousel below services section
2. Arcplus and services pages render placement-specific testimonials
3. Empty testimonials gracefully hidden (no carousel rendered)
4. Create a `BlogPost` with `scheduled_publish_at` in the past + `status=approved` → run task → verify it transitions to published
5. `npx tsc --noEmit` — zero errors
6. `npx vitest run` — all tests pass
7. Sitemap dynamically includes product slugs from DB

---

## Phase F: Mobile Money Providers

**Priority:** 🟢 Post-Launch (market expansion)
**Effort:** Large
**Dependencies:** None

**Why:** MTN MoMo and Airtel Money are stubs in `providers.py`. Stripe + Flutterwave already cover USD/KES/UGX card payments. Mobile money is needed for the Ugandan consumer market but Flutterwave handles UGX as a fallback.

### Steps

**F1. Complete MTN MoMo** — `MTNMoMoProvider` in `backend/apps/payments/providers.py`:

- Implement `initiate()` — Collection API v2: POST `/collection/v2_0/requesttopay` with phone number, amount, currency
- Implement `verify()` — GET transaction status by `referenceId`
- Phone number validation (Ugandan format `256...`)
- Handle async flow (user approves on phone → callback notification)

**F2. Complete Airtel Money** — `AirtelMoneyProvider`:

- Implement `initiate()` — Airtel Money API payment request
- Implement `verify()` — transaction status check
- Phone number validation (Ugandan/Kenyan Airtel format)

**F3. Add webhook endpoints:**

- `POST /api/v1/payments/mtn/callback/` — MTN payment notification, signature validation
- `POST /api/v1/payments/airtel/callback/` — Airtel notification, signature validation
- Update payment record status on callback

**F4. Frontend phone number flow:**

- Add phone number input step in payment forms when method is `mtn` or `airtel`
- Show "Approve on your phone" waiting state with polling

**F5. Sandbox testing:**

- MTN MoMo sandbox: initiate → approve on simulator → verify
- Airtel sandbox: same flow
- Error scenarios: timeout, declined, insufficient funds

### Relevant Files

| File | Purpose |
|---|---|
| `backend/apps/payments/providers.py` | `MTNMoMoProvider` + `AirtelMoneyProvider` stubs |
| `backend/abs_backend/urls.py` | Wire callback URLs |

### Verification

1. MTN sandbox: full payment lifecycle (initiate → approve → callback → verified)
2. Airtel sandbox: same lifecycle
3. Error handling works: timeout returns pending, declined returns failed
4. Provider routing: `(UGX, mtn)` → MTN, `(UGX, airtel)` → Airtel
5. Frontend shows phone input for mobile money, card form for Stripe/Flutterwave

---

## Execution Order & Dependencies

```
Phase A (seed command) ─────────────────→ Phase E (wire features)
        ↕ parallel                              ↑
Phase C (CI/CD) ──────→ Phase D (prod infra) ───┘
        ↕ parallel
Phase B (backend tests) ────────────────────────────────────→ Phase F (mobile money)
```

| Phase | Blocks Launch? | Can Start | Depends On |
|---|---|---|---|
| **A** — CMS Seed | 🔴 Yes | Immediately | — |
| **B** — Backend Tests | 🟡 Quality gate | Immediately | — |
| **C** — CI/CD | 🔴 Yes | Immediately | — |
| **D** — Prod Infra | 🔴 Yes | After C | C |
| **E** — Wire Features | 🟢 No | After A | A |
| **F** — Mobile Money | 🟢 No | Anytime | — |

**Recommended parallel tracks:**

- Track 1: A → E
- Track 2: C → D
- Track 3: B (continuous, feeds into C test jobs)

---

## Out of Scope

- Full i18n / Swahili localization (`next-intl`) — deferred to future phase
- Arcplus SaaS product (core modules) — separate product, this is the marketing funnel only
- Cloud storage migration (S3/R2) — works with local media storage at launch
- CDN configuration (Cloudflare) — post-launch optimization
- Monitoring/alerting setup (Sentry, uptime) — documented in `.env.example` but not configured
- CRM integration — manual email workflow at launch per readiness matrix
