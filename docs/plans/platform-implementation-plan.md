# ABS Digital Platform — Full Implementation Plan

## Context Summary

- **Repo:** `/home/zak/projects/abswebsite` — greenfield, zero code exists
- **Stack:** Next.js 14 (App Router, TypeScript, Tailwind) + Django 5 (DRF, PostgreSQL) + Docker
- **Arcplus:** External system — we build the acquisition funnel only (trial signup, subscriptions)
- **Payments:** MTN Mobile Money (UGX), Airtel Money (UGX/KES), Stripe/Flutterwave (USD, card)
- **Admin:** Custom React admin panel inside Next.js (not Django Admin)
- **Scope:** All three phases

---

## Repository Structure

Monorepo. Single repo, two top-level app directories: `frontend/` and `backend/`.

```
abswebsite/
├── .github/workflows/        # ci.yml + deploy.yml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx + globals.css
│   │   │   ├── (public)/     # /, /hardware, /hardware/[slug], /rfq,
│   │   │   │                 # /arcplus, /pricing, /trial, /training, /services
│   │   │   ├── (auth)/       # /login, /register
│   │   │   ├── (portal)/     # /dashboard, /quotes, /subscriptions,
│   │   │   │                 # /training, /documents  [requires client JWT]
│   │   │   └── (admin)/      # /admin, /admin/quotes, /admin/subscriptions,
│   │   │                     # /admin/training, /admin/users [requires admin JWT]
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Badge, Card, Modal, Spinner, Table
│   │   │   ├── layout/       # Navbar, Footer, PortalSidebar, AdminSidebar
│   │   │   ├── forms/        # QuoteForm, TrialSignupForm, TrainingRegForm,
│   │   │   │                 # ServiceRequestForm, LoginForm
│   │   │   ├── products/     # ProductCard, ProductGrid, SpecSelector, QuoteSummaryPanel
│   │   │   ├── portal/       # QuoteTracker, SubscriptionStatus
│   │   │   └── admin/        # QuoteTable, UserTable, StatusBadge, ExportCSVButton
│   │   ├── lib/
│   │   │   ├── api/          # client.ts (Axios + JWT interceptor), auth.ts, products.ts,
│   │   │   │                 # quotes.ts, subscriptions.ts, training.ts, admin.ts
│   │   │   ├── auth/         # tokens.ts, guards.ts
│   │   │   ├── hooks/        # useAuth, useProducts, useQuotes, useSubscription
│   │   │   └── utils/        # currency.ts (UGX/USD/KES), date.ts, cn.ts
│   │   ├── store/            # authStore.ts, quoteStore.ts, uiStore.ts (Zustand)
│   │   └── types/            # auth.ts, product.ts, quote.ts, subscription.ts,
│   │                         # training.ts, api.ts (ApiResponse<T>, PaginatedResponse<T>)
│   └── middleware.ts          # Edge JWT guard for /dashboard/*, /admin/*
├── backend/
│   ├── config/
│   │   ├── settings/         # base.py, development.py, production.py
│   │   ├── urls.py
│   │   ├── wsgi.py + asgi.py
│   ├── apps/
│   │   ├── authentication/   # Custom User model, JWT views, permission classes
│   │   ├── organizations/    # Organization model
│   │   ├── products/         # Product catalog + seed command
│   │   ├── quotes/           # QuoteRequest model, public + auth + admin endpoints
│   │   ├── subscriptions/    # Subscription model, trial logic, Celery tasks
│   │   ├── training/         # TrainingSession + TrainingRegistration, Celery tasks
│   │   ├── services/         # ServiceRequest model
│   │   ├── payments/
│   │   │   └── providers/    # base.py (abstract), mtn.py, airtel.py,
│   │   │                     # stripe_provider.py, flutterwave.py
│   │   └── notifications/    # email.py (Resend), email HTML templates, tasks.py
│   └── requirements/         # base.txt, development.txt, production.txt
├── docker/
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── nginx/                # Dockerfile, nginx.dev.conf, nginx.prod.conf
├── docker-compose.yml        # dev: db, redis, backend, celery, celery-beat, frontend, nginx
├── docker-compose.prod.yml
└── .env.example
```

---

## Phase 1 — Foundation

**Goal:** Working marketing website, product catalog, quote submission, auth. Admin can log in and view quotes.

### Backend (build first — frontend depends on real data)

**B1-1 · Project Scaffold**

- `django-admin startproject config .` inside `backend/`
- `pip install djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary python-decouple pillow`
- Configure `base.py`: INSTALLED_APPS, DATABASES, CORS, REST_FRAMEWORK with JWT auth defaults, pagination (page_size=20)
- `development.py`: DEBUG=True; `production.py`: DEBUG=False, SSL redirects, ALLOWED_HOSTS from env

**B1-2 · Custom User Model** ⚠️ MUST be done before `python manage.py migrate` is ever run

```python
# apps/authentication/models.py
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=[('admin','Admin'),('client','Client'),('trial','Trial')], default='client')
    country = models.CharField(max_length=2, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    organization = models.ForeignKey('organizations.Organization', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

Set `AUTH_USER_MODEL = 'authentication.User'` in `base.py` before the first migration.

**B1-3 · Organization Model**

```python
class Organization(models.Model):
    name, country, subscription_plan (none/starter/professional/enterprise),
    trial_expiry, created_at, updated_at
    # method: is_trial_active()
```

**B1-4 · JWT Auth Endpoints**

- Custom `TokenObtainPairSerializer` that injects `role`, `email`, `org_id` into token claims
- `POST /api/auth/register` — create User + optional Org, return access + refresh tokens
- `POST /api/auth/login` — custom TokenObtainPairView
- `POST /api/auth/refresh` — standard TokenRefreshView
- `POST /api/auth/logout` — blacklist refresh token (enable `token_blacklist` app)
- Refresh token set as HTTP-only cookie by Django; access token returned in JSON body

**B1-5 · Permission Classes**

```python
# apps/authentication/permissions.py
class IsAdminUser(BasePermission): ...   # role == 'admin'
class IsClientUser(BasePermission): ...  # role in ('client', 'admin')
```

Rate-limit auth endpoints: 10 requests/minute via DRF throttle classes.

**B1-6 · Products App** (`/api/products/`, `/api/products/{slug}/`)

```python
class Product(models.Model):
    name, slug (auto-generated, unique), category (rfid/barcode/gps/scanners/accessories/software),
    short_description, description, specifications (JSONField), image, datasheet,
    is_active, sort_order, created_at
    # specifications structure:
    # {"tag_type": {"label": "Tag Type", "options": ["UHF","HF","NFC"]}, ...}
```

- Both endpoints: public, no auth required
- `?category=rfid` filter support
- Management command: `seed_products` — creates 8-10 real products with spec options

**B1-7 · Quotes App**

```python
class QuoteRequest(models.Model):
    organization (nullable FK), submitted_by (nullable FK — anon allowed),
    product (FK), selected_specs (JSONField), quantity,
    contact_name, contact_email, contact_phone, company_name, country, notes,
    status (pending/reviewing/responded/closed), admin_response, created_at, updated_at
    # Meta.indexes: [status, created_at, contact_email]
```

- `POST /api/quote-request/` — public (no auth), captures contact info in body
- `GET /api/quotes/` — auth required, returns quotes for the user's org
- `GET /api/admin/quotes/` + `PATCH /api/admin/quotes/{id}/` — admin only

**B1-8 · Services App** (`POST /api/service-request/`, `GET /api/service-requests/`)

```python
class ServiceRequest(models.Model):
    contact_name, contact_email, contact_phone, company_name, country,
    service_type (asset_register/asset_verification/asset_disposal/
                  asset_management_training/asset_outsourcing),
    details (JSONField), status (submitted/reviewing/in_progress/completed/cancelled),
    submitted_by (nullable FK), created_at
```

**B1-9 · Standardized Response Envelope**

```python
# apps/core/response.py
def success_response(data, message=None, status=200): ...
def error_response(errors, message=None, status=400): ...
```

Every API endpoint uses this. Frontend TypeScript type: `ApiResponse<T>`.

**B1-10 · Root URL Configuration + CORS**
Wire all app URL modules. Configure `CORS_ALLOWED_ORIGINS` and `CORS_ALLOW_CREDENTIALS = True`.

---

### Frontend

**F1-1 · Next.js Scaffold + Design System**

Packages to install:

```
zustand @tanstack/react-query axios clsx tailwind-merge
react-hook-form zod lucide-react jose
```

- `tailwind.config.ts`: brand color scale, display font (Sora for headings), body font (Inter)
- Data fetching split: **Server Components** use native `fetch` with `next: { revalidate: N }`; **Client Components** use Axios via `apiClient`

**F1-2 · API Client + Token Strategy**

```typescript
// lib/api/client.ts — Axios instance
// Request interceptor: attach access token from authStore
// Response interceptor: on 401 → attempt token refresh → retry → on refresh fail → redirect /login
```

Token storage:

- **Access token**: Zustand store (in-memory only; cleared on tab close)
- **Refresh token**: HTTP-only cookie (set by Django; persists across page reload; not JS-accessible)

**F1-3 · Auth Store (Zustand)**

```typescript
// store/authStore.ts — persisted to sessionStorage
interface AuthState {
  user: { id: number; email: string; role: 'admin'|'client'|'trial'; orgId?: number } | null
  accessToken: string | null
  isHydrated: boolean
  setTokens, setUser, logout
}
```

**F1-4 · Quote Store (Zustand)**

```typescript
// store/quoteStore.ts — persisted to sessionStorage (survives refresh)
interface QuoteState {
  product: Product | null
  selectedSpecs: Record<string, string>  // { "tag_type": "UHF" }
  quantity: number
  setProduct, setSpec, setQuantity, clear
}
```

**F1-5 · Middleware (Edge JWT Guard)**

```typescript
// middleware.ts
// Protect /dashboard/*, /quotes/*, /subscriptions/*, /training/*, /documents/*, /admin/*
// Verify JWT from cookie/header using `jose`
// Redirect /admin to /dashboard if role !== 'admin'
```

**F1-6 · Homepage** (Apple-style, vertical scroll, Server Component)

1. Hero — full viewport, dark bg, headline + two CTAs (Start Free Trial / Explore Hardware)
2. Product Showcase — 3 cards: Arcplus AM System, Asset Tags, Scanners
3. Services Section — 4 service tiles
4. Guided Flow — 3-step horizontal: Choose Solution → Configure → Get Quote/Start Trial
5. Footer — links, countries, legal

**F1-7 · Hardware Listing** (`/hardware`) — Server Component

- Fetches products from Django with `?category=` filter
- `CategoryFilterBar` is a Client Component that updates URL search params via `useRouter`

**F1-8 · Hardware Product Detail** (`/hardware/[slug]`) — Hybrid

- Two-column desktop layout: product image + description (left 2/3), sticky spec panel (right 1/3)
- `SpecSelector` is Client Component: clicking option calls `quoteStore.setSpec(key, value)`
- Sticky summary panel reflects quoteStore in real time
- "Get Quote" CTA navigates to `/rfq`

**F1-9 · RFQ Summary Page** (`/rfq`) — Client Component

- On mount: if `quoteStore.product` is null → redirect to `/hardware`
- Left: read-only summary of product + selected specs + quantity
- Right: company details form (`react-hook-form` + `zod`)
- On submit: `POST /api/quote-request/` → success state with reference number → clear quoteStore

**F1-10 · Services Page** (`/services`)

- 5 service cards with "Request This Service" CTA
- Each opens a modal with a service-specific form → `POST /api/service-request/`

**F1-11 · Login + Register Pages**

- `react-hook-form` + `zod` validation
- On login: set access token in authStore, Django sets HTTP-only refresh cookie → redirect `/dashboard`

---

## Phase 2 — Self-Service Platform

**Goal:** Full payment processing, client portal, training registration, Arcplus subscriptions, custom admin dashboard.
**Build order:** Payment infrastructure backend → frontend flows.

### Backend

**B2-1 · Payment Provider Architecture (Strategy Pattern)**

```python
# apps/payments/providers/base.py
@dataclass class PaymentInitResult:
    success, reference, provider_reference, redirect_url (Stripe), ussd_code (MoMo), message

@dataclass class PaymentStatusResult:
    success, status (pending/confirmed/failed), provider_reference, amount, currency

class BasePaymentProvider(ABC):
    @abstractmethod def initiate(...) -> PaymentInitResult: ...
    @abstractmethod def verify_webhook(request_data, headers) -> bool: ...
    @abstractmethod def check_status(reference) -> PaymentStatusResult: ...
```

**B2-2 · MTN Mobile Money Provider**

- Auth: Basic (api_user:api_key) → Bearer token
- Initiate: `POST /collection/v1_0/requesttopay` (phone format: `256771234567`, no `+`)
- Webhook: `POST /api/payments/webhook/mtn/`
- Polling fallback: Celery task polls status every 30s for up to 10 minutes

**B2-3 · Airtel Money Provider**

- Auth: `POST /auth/oauth2/token` (client_credentials)
- Initiate: `POST /merchant/v1/payments/`
- Webhook: `POST /api/payments/webhook/airtel/`

**B2-4 · Stripe Provider**

- Create Stripe Checkout Session → return `checkout_url` (redirect model)
- Webhook: `POST /api/payments/webhook/stripe/` (verify `Stripe-Signature` header)
- Success redirect: `/payment/success?ref={reference}`

**B2-5 · Flutterwave Provider**

- Inline popup (JavaScript SDK) or redirect model
- Webhook: `POST /api/payments/webhook/flutterwave/`

**B2-6 · PaymentTransaction Model**

```python
class PaymentTransaction(models.Model):
    reference (unique), provider (mtn_momo/airtel_money/stripe/flutterwave),
    provider_reference, payment_for (subscription/training), object_id,
    amount, currency, status (pending/processing/confirmed/failed/refunded),
    phone_number, payer (FK User),
    raw_request (JSONField), raw_response (JSONField),  # full audit trail
    created_at, confirmed_at
    # Meta.indexes: [reference, provider_reference, status]
```

**B2-7 · Webhook idempotency pattern**

```python
def handle_payment_webhook(provider_ref, status):
    tx = PaymentTransaction.objects.filter(provider_reference=provider_ref).first()
    if not tx: return           # unknown, ignore
    if tx.status == 'confirmed': return   # already processed — idempotent
    tx.status = status; tx.save()
    payment_confirmed.send(sender=PaymentTransaction, transaction=tx)

@receiver(payment_confirmed)
def post_confirm(sender, transaction, **kwargs):
    if transaction.payment_for == 'subscription': activate_subscription(...)
    elif transaction.payment_for == 'training': confirm_training_registration(...)
```

**B2-8 · Subscriptions App**

```python
class Subscription(models.Model):
    organization (FK), plan (starter/professional/enterprise),
    billing_cycle (monthly/annual), currency, amount,
    status (pending_payment/trial/active/expired/cancelled),
    started_at, expiry_date, arcplus_org_id (CharField — external ref), created_at
```

- `POST /api/trial/start` — create Org, set 30-day trial_expiry, set user role='trial', send welcome email
- `POST /api/subscription/create` — create pending Subscription, initiate payment, return payment URL/USSD
- `GET /api/subscription/status` — auth, returns current subscription state

**B2-9 · Training App**

```python
class TrainingSession(models.Model):
    training_type, title, description, date, duration_hours,
    location, is_virtual, virtual_link,
    seats_total, seats_remaining, price_ugx, price_usd, is_active

class TrainingRegistration(models.Model):
    user (nullable FK), session (FK), attendee_name, attendee_email,
    attendee_phone, company, country, currency, amount_paid,
    status (pending_payment/confirmed/cancelled),
    payment (OneToOneField → PaymentTransaction), created_at
```

Endpoints: `GET /api/training/sessions/`, `POST /api/training/register/`

**B2-10 · Multi-Currency Logic**

```python
# apps/payments/currency.py
CURRENCY_BY_COUNTRY = {'UG': 'UGX', 'KE': 'KES', 'default': 'USD'}
PAYMENT_METHODS_BY_COUNTRY = {'UG': ['mtn_momo','airtel_money','stripe'], 'KE': ['airtel_money','stripe'], ...}
PRICING_TABLE = {
    'starter':      {'monthly': {'UGX': 150000, 'USD': 40, 'KES': 5000}, 'annual': {...}},
    'professional': {'monthly': {'UGX': 350000, 'USD': 95, 'KES': 12000}, 'annual': {...}},
    'enterprise':   {'monthly': None, ...}  # Contact sales
}
# Note: prices are placeholders — confirm actual values with ABS business team
```

**B2-11 · Celery Setup**

```python
# Periodic tasks (django-celery-beat):
# - check_trial_expiry — daily at 08:00 Africa/Kampala
#   Sends email reminders at 7 days, 3 days, expiry day; expires overdue trials
# - timeout_stale_payments — every 15 minutes
#   Marks 'pending' payments older than 15 min as 'failed'
```

**B2-12 · Full Admin API** (all endpoints require `IsAdminUser`)

```
GET  /api/admin/quotes/             + PATCH /api/admin/quotes/{id}/
GET  /api/admin/subscriptions/
GET  /api/admin/users/              + PATCH /api/admin/users/{id}/
GET  /api/admin/training/sessions/  + POST + PATCH /{id}/
GET  /api/admin/dashboard/          # summary stats: counts, revenue totals
```

All admin write actions log to `AuditLog` model (actor, action, target, old_value, new_value, ip, timestamp).

**B2-13 · Email via Resend**
Templates to build:

- `trial_welcome`, `trial_reminder_7_days`, `trial_reminder_3_days`, `trial_expired`
- `subscription_active`, `training_confirmation`
- `quote_received` (to customer), `quote_received_admin` (to ABS team), `quote_response` (admin reply)

---

### Frontend

**F2-1 · Client Portal Layout** (`(portal)/layout.tsx`)

- Left sidebar: nav links (Dashboard, Quotes, Subscriptions, Training, Documents)
- Top header: user name, role badge, logout
- Mobile: hamburger → collapsible sidebar
- All portal pages use TanStack Query with loading skeletons

**F2-2 · Portal Pages**

- `dashboard` — stats cards (open quotes, active subscription, upcoming training), activity feed
- `quotes` — table of own quotes, click to expand with admin response
- `subscriptions` — current plan, expiry, upgrade CTA, billing history
- `training` — registered sessions, status badges, virtual join links
- `documents` — placeholder in Phase 2 (populated in Phase 3)

**F2-3 · Training Registration Multi-Step Flow**
State lives in local `useReducer` (ephemeral, not Zustand):

1. Select session (list of available sessions with date, seats, price)
2. Attendee info (name, email, phone, company, country)
3. Payment method (filtered by country: MoMo / Airtel / Stripe / Flutterwave)
4. Complete payment:
   - Mobile Money → phone number input → "waiting for confirmation" spinner → poll every 5s
   - Stripe → redirect to Checkout URL
   - Flutterwave → inline popup
5. Confirmation screen

**F2-4 · Arcplus Landing Page** — static marketing, Server Component
Problem statement → Features Grid → Pricing Table (links to `/pricing`) → Free Trial CTA → FAQs

**F2-5 · Pricing Page** — Client Component

- Monthly/Annual billing toggle (state via `useState`)
- Starter / Professional / Enterprise columns with feature lists
- Enterprise → "Contact Sales" → `/services?type=enterprise_inquiry`
- Prices fetched from `/api/pricing/` (backed by PRICING_TABLE dict or DB in Phase 3)

**F2-6 · Free Trial Signup** (`/trial`)

- Form: company name, country (dropdown), email, password
- On submit: `POST /api/trial/start`
- On success: set tokens → redirect to Arcplus dashboard URL (env var) or `/dashboard`

**F2-7 · Admin Dashboard** (route group `(admin)`)

- `admin/page.tsx` — summary cards from `/api/admin/dashboard/`
- `admin/quotes/page.tsx` — table + status filter tabs + side panel for detail/response + CSV export
- `admin/subscriptions/page.tsx` — table, plan filter, payment status
- `admin/training/page.tsx` — session list + registration counts, create/edit session modals
- `admin/users/page.tsx` — user table, role filter, deactivate action

CSV export: `GET /api/admin/quotes/?format=csv` — Django returns `HttpResponse(content_type='text/csv')`

---

## Phase 3 — Advanced Integration

**Goal:** Deeper Arcplus integration, dynamic pricing, AI recommendations, multi-language, analytics.

**B3-1 · Arcplus Integration Client**

```python
# apps/integrations/arcplus.py
class ArcplusClient:
    def provision_organization(self, org) -> str: ...       # returns arcplus_org_id
    def get_usage_stats(self, arcplus_org_id) -> dict: ...  # assets, users, last_activity
    def exchange_token(self, abs_user_id) -> str: ...       # SSO single-use token
```

Store `arcplus_org_id` already on `Subscription` model.

**B3-2 · Dynamic Pricing Engine**

```python
class PricingRule(models.Model):
    plan, billing_cycle, currency, amount, is_active, valid_from, valid_until
# Replaces the hardcoded PRICING_TABLE dict — admin can update without deploy
```

**B3-3 · AI Product Recommendations**
Implement in phases:

1. Keyword matching against `specifications` JSONField (free, ship first)
2. OpenAI `text-embedding-3-small` + cosine similarity (upgrade if data shows it matters)

**B3-4 · Multi-Language** — `next-intl` library

```
frontend/src/messages/en.json, sw.json  # Swahili for East Africa
frontend/src/app/[locale]/              # locale-prefixed route group
```

**B3-5 · Analytics Dashboard** (admin)
Revenue by month, trial signup rate, quote conversion rate (submitted → responded → closed), training trend
Data from new aggregated Django queries in `/api/admin/dashboard/`.

---

## Docker Setup

**docker-compose.yml (development) — 7 services:**

- `db` — postgres:15-alpine, healthcheck: `pg_isready`
- `redis` — redis:7-alpine, healthcheck: `redis-cli ping`
- `backend` — runs `python manage.py runserver 0.0.0.0:8000`, depends on db+redis health
- `celery` — runs `celery -A config worker`, same image as backend
- `celery-beat` — runs `celery -A config beat`, uses `django_celery_beat` scheduler
- `frontend` — runs `npm run dev`
- `nginx` — proxies `/api/` to backend, `/` to frontend, serves `/static/` and `/media/`

**Nginx routing:**

- `/api/` → `proxy_pass backend:8000`
- `/django-admin/` → `proxy_pass backend:8000`
- `/static/` → serve from volume
- `/media/` → serve from volume
- `/` → `proxy_pass frontend:3000` (WebSocket upgrade headers for HMR)

**Production Dockerfile highlights:**

- Backend: `python:3.11-slim`, `gunicorn --workers 3`, `collectstatic` in build
- Frontend: multi-stage, `next build` in builder stage, `output: 'standalone'` in next.config.ts

**VPS Deployment:** Hetzner CX21 (2 vCPU, 4GB RAM) → Docker + Certbot + Cloudflare
Cloudflare: Page Rule to bypass cache for `/api/*`. SSL/TLS: Full (strict).

---

## Security Decisions

| Concern | Implementation |
|---|---|
| Auth tokens | Access in Zustand memory + HTTP-only refresh cookie |
| Route protection | Edge middleware (Next.js) + DRF permission classes (Django) |
| HTTPS | Let's Encrypt on VPS + Cloudflare full strict |
| Rate limiting | DRF throttle: 10 req/min on auth endpoints |
| Input validation | Zod (frontend) + DRF serializers (backend) |
| Webhook security | Signature verification on every webhook endpoint |
| Webhook idempotency | Check `provider_reference` uniqueness before processing |
| Admin audit trail | `AuditLog` model records all admin write actions |
| CORS | Explicit allowed origins from env var |

---

## Key Design Decisions (Rationale)

1. **Custom User model before first migration** — Django mandates this. Retrofitting later breaks migration history permanently.
2. **Organization as a separate model** — ABS sells B2B; multiple users share one subscription/org.
3. **JSONField for product specifications** — Spec shape varies per product category. JSONField avoids one table per product type; compensate with serializer-level validation.
4. **Generic payment FK (`payment_for` + `object_id`)** — Both subscriptions and training need payment. Avoids duplicating payment provider logic across two models.
5. **Anonymous quote submissions** — Requiring registration before quoting creates friction. Contact info captured in form body; `submitted_by` nullable.
6. **Strategy pattern for payments** — All four providers implement `BasePaymentProvider`. Adding a 5th provider touches only one new file.
7. **Server vs Client Component split** — Public marketing pages (SEO-critical) are Server Components with `fetch + revalidate`. Portal/admin (interactive) are Client Components with TanStack Query.
8. **No API versioning in Phase 1/2** — Only one consumer (the frontend). Version when/if needed in Phase 3+.

---

## Environment Variables (.env.example)

```bash
# Django
SECRET_KEY=change-me
DJANGO_SETTINGS_MODULE=config.settings.development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
DB_NAME=abs_platform
DB_USER=abs_user
DB_PASSWORD=change-me
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:80
API_URL=http://backend:8000
NEXTAUTH_SECRET=change-me

# Email (Resend)
RESEND_API_KEY=
DEFAULT_FROM_EMAIL=noreply@absco.ug

# MTN Mobile Money
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_ENVIRONMENT=sandbox

# Airtel Money
AIRTEL_CLIENT_ID=
AIRTEL_CLIENT_SECRET=
AIRTEL_ENVIRONMENT=sandbox

# Stripe
STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# Flutterwave
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=

# Phase 3
ARCPLUS_API_URL=
ARCPLUS_API_KEY=
FRONTEND_URL=http://localhost:3000
```

---

## Testing Strategy

**Backend:** `pytest-django` + `factory_boy` + `responses` (mock external HTTP)

- Models: 100% coverage
- API views: 90% — success, auth failure, validation failure, edge cases
- Payment providers: mock all external HTTP calls — never hit real APIs in tests

**Frontend:** `jest` + `@testing-library/react` + `msw` (Mock Service Worker)

- All form components, SpecSelector, QuoteStore behavior

**E2E:** Playwright — run nightly + before every production deploy

- Quote flow: Browse → Configure → Submit RFQ → Verify in admin
- Trial signup: Form → Submit → Dashboard redirect
- Training payment: Select session → Attendee info → Mock payment → Confirmation
- Admin flow: Login → View quotes → Update status

---

## Phase Verification Checklists

### Phase 1 ✓

- [ ] `docker compose up` starts all services cleanly
- [ ] `GET /api/products/` returns seeded product list
- [ ] `POST /api/quote-request/` with valid data → 201
- [ ] `POST /api/quote-request/` missing fields → 400 with field errors
- [ ] `GET /api/quotes/` no auth → 401; with client JWT → own quotes only
- [ ] `GET /api/admin/quotes/` with client JWT → 403; with admin JWT → all quotes
- [ ] `npm run build` zero TypeScript errors
- [ ] Homepage renders at 375px, 768px, 1440px
- [ ] `?category=rfid` shows only RFID products
- [ ] SpecSelector updates sticky summary panel in real time
- [ ] Navigating to `/rfq` with empty quoteStore → redirected to `/hardware`
- [ ] `/dashboard` without auth → `/login`; `/admin` as client → `/dashboard`

### Phase 2 ✓

- [ ] MTN sandbox: initiate → USSD prompt → webhook → PaymentTransaction=confirmed
- [ ] Stripe: initiate → Checkout redirect → test card → webhook → confirmed
- [ ] Payment timeout: pending > 15 mins → marked failed by Celery
- [ ] Trial signup: creates Org, 30-day expiry, user role='trial', welcome email sent
- [ ] Trial reminder emails fire at 7 days and 3 days remaining (verify in Resend logs)
- [ ] Client cannot view another org's data
- [ ] Admin quote filter tabs work; status update sends email to customer
- [ ] Export CSV is valid and has correct headers
- [ ] Rate limit: 11th login attempt → 429

### Phase 3 ✓

- [ ] Arcplus SSO: "Open Arcplus" redirects to Arcplus in authenticated state
- [ ] Language toggle changes all UI text, no missing keys
- [ ] AI recommendations return relevant products
- [ ] Pricing update in admin reflects on `/pricing` page immediately
- [ ] Analytics chart counts match database records
