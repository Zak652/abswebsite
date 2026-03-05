# ABS Platform — PRD Implementation Plan (Phase 1 & 2)

## Assessment

The codebase is a **partial scaffold** — the structure, routing, and design foundations are mostly correct, but:

- Product data is hardcoded throughout (not from DB)
- Backend Products app, Services app, and Celery are absent
- Several pages have stub content (resources, service details)
- Admin portal lacks analytics, CSV export, user management, and products CRUD
- Multi-currency support is missing
- Pattern components need to be extracted and connected to real data

---

## Milestone 1: Backend Foundation

### 1A: Products App

**Create: `backend/apps/products/`** with full Django app structure.

**Models:** `ProductCategory`, `Product` (JSONField specs, 4 image fields, `is_configurable`), `ProductConfigSection`, `ProductConfigOption`

**APIs (all public, no auth):**

- `GET /api/v1/products/categories/` — list all categories
- `GET /api/v1/products/?category={slug}` — list products by category
- `GET /api/v1/products/{slug}/` — product detail
- `GET /api/v1/products/{slug}/config/` — nested config sections + options

**Management command:** `seed_products.py` — migrates all hardcoded product data from frontend JS to DB. **Must run before any frontend switch to API data.**

**Modify:**

- `backend/abs_backend/settings/base.py` — add `apps.products` to `LOCAL_APPS`
- `backend/abs_backend/urls.py` — register product routes

---

### 1B: Services App

**Create: `backend/apps/services/`**

**Model: `ServiceRequest`**

```
service_type: [asset_register, verification, disposal, training_outsource, full_outsource]
status: [new, reviewing, scoped, in_progress, completed, cancelled]
urgency: [urgent, standard, flexible]
intake_data: JSONField   # service-type specific guided answers
```

**API:**

- `POST /api/v1/services/requests/` — public, no auth required (matches RFQ pattern)
- Triggers two emails on submit (client confirmation + admin notification)

**Modify:** `backend/apps/notifications/service.py` — add `send_service_request_notification()`

---

### 1C: Organization Model

**Modify: `backend/apps/accounts/models.py`**

Add `Organization` model (name, industry, country, size_range) and nullable FK on `User.organization`. Create migration `0002_add_organization.py`.

---

### 1D: Celery Setup

**Modify: `backend/requirements.txt`** — add `celery==5.3.6`, `django-celery-beat==2.6.0`, `django-celery-results==2.5.1`, `redis==5.0.1`

**Create: `backend/abs_backend/celery.py`**

**Modify: `backend/abs_backend/__init__.py`** — import celery app

**Modify: `backend/abs_backend/settings/base.py`** — add Celery broker/backend config pointing to Redis

**Modify: `docker-compose.yml`** — add `celery_worker` and `celery_beat` services

---

### 1E: Trial Expiry Automation

**Modify: `backend/apps/subscriptions/models.py`**
Add fields: `trial_start`, `trial_expiry`, `reminder_sent_day7`, `reminder_sent_day3`

**Create: `backend/apps/subscriptions/tasks.py`**

- `check_trial_expiry()` — daily task: send day-7 reminder, day-3 reminder, auto-expire
- `auto_expire_trial(trial_id)` — triggered on provisioning

**Create email templates:**

- `backend/apps/notifications/templates/trial_day7_reminder.html`
- `backend/apps/notifications/templates/trial_day3_reminder.html`
- `backend/apps/notifications/templates/trial_expiry.html`

---

### 1F: Audit Logging

**Modify: `backend/apps/accounts/models.py`** — add `AuditLog` model with `performed_by`, `action`, `resource_type`, `resource_id`, `changes` (JSONField), `ip_address`

Add `log_admin_action()` helper called by all admin views on mutations.

---

### 1G: Multi-currency for Training

**Modify: `backend/apps/training/models.py`** — add `price_ugx` and `price_kes` to `TrainingSession`. Update serializer to expose all three prices.

---

### 1H: Enhanced Admin API Endpoints

**Modify: `backend/apps/accounts/admin_views.py`** — add:

- `GET /admin/analytics/?period=30` — revenue summary, conversion rate, RFQs by status, new signups
- `GET /admin/export/rfq/` — CSV blob download
- `GET /admin/export/trials/` — CSV blob download
- `GET /admin/export/training/` — CSV blob download
- `GET /admin/users/` — with search + role filter
- `PATCH /admin/users/{id}/` — deactivate, role change
- Products CRUD: `POST`, `PATCH`, `DELETE /admin/products/`
- `GET /admin/services/` — service request list with filters
- `PATCH /admin/services/{id}/` — status + admin_notes update
- Update `AdminStatsView` to include `new_service_requests` count

---

### 1I: Payment Strategy Pattern

**Create: `backend/apps/payments/providers.py`**

Abstract `PaymentProvider` (ABC) with `initiate()` and `verify()` methods. Concrete implementations: `FlutterwaveProvider` (extracted from training views), `StripeProvider`, `MTNMoMoProvider`, `AirtelMoneyProvider`. Factory function `get_payment_provider(currency, method)`.

Add `STRIPE_SECRET_KEY`, `MTN_MOMO_API_KEY`, `AIRTEL_MONEY_API_KEY` to settings.

---

## Milestone 2: Component Architecture

### 2A: Fix Existing Primitives

**Modify: `src/components/primitives/Button.tsx`** — implement all 4 variants (primary/secondary/ghost/danger), 3 sizes, loading state with spinner, 5 interactive states. Zero hardcoded hex values.

**Create: `src/components/primitives/Stack.tsx`** — vertical/horizontal layout with token-mapped gap props.

**Modify: `src/components/primitives/Text.tsx`** — map all variants to token classes (Plus Jakarta Sans for headings, Inter for body, JetBrains Mono for mono).

### 2B: Extract Signature Components

**Create: `src/components/patterns/GuidedPathSelector.tsx`** — extract from `HomePageClient.tsx`. Props: `heading`, `subheading`, `paths[]` (href, icon, title, description, ctaLabel). Retains hover interaction.

**Create: `src/components/patterns/WorkflowVisualizer.tsx`** — extract from `ArcplusPageClient.tsx`. Props: `steps[]` (label, description, dashboardContent), `title`, `subtitle`.

**Create: `src/components/patterns/PricingTable.tsx`** — extract from `ArcplusPageClient.tsx`. Adds currency toggle (USD/UGX/KES). Static rates: `{ UGX: 3700, KES: 130 }`. Accepts `onSelectPlan(plan, billing, currency)`.

**Create: `src/components/patterns/ServiceIntakeForm.tsx`** — new component. Multi-step form that varies step 2 questions by `serviceType`. Steps: Scale → Service-specific → Contact → Confirmation. Uses mock submit until backend is ready.

### 2C: New Pattern Components

**Create: `src/components/patterns/HeroSection.tsx`** — reusable hero with `overlay` and `split` layout variants, product image, eyebrow text, badges.

**Create: `src/components/patterns/FeatureGrid.tsx`** — 2/3/4-column grid with `light-on-dark`, `dark-on-light`, and `card` variants.

### 2D: Header Enhancements

**Modify: `src/components/layout/Header.tsx`** — add scroll-triggered background transition (transparent → white/95 + shadow at 80px scroll).

**Create: `src/lib/hooks/useScrollPosition.ts`** — passive scroll event listener returning boolean.

Add active route detection via `usePathname()` — underline current nav item.

---

## Milestone 3: Frontend API Layer

### 3A: Product Types + API

**Create: `src/types/products.ts`** — `ProductCategory`, `Product`, `ProductConfigSection`, `ProductConfigOption`

**Create: `src/lib/api/products.ts`** — `getCategories()`, `getByCategory(slug)`, `getProduct(slug)`, `getConfigOptions(slug)`

**Create: `src/lib/hooks/useProducts.ts`** — `useProductsByCategory(slug)`, `useProduct(slug)`, `useProductConfig(slug)` — all with 5-min stale time

### 3B: Services Types + API

**Create: `src/types/services.ts`** — `ServiceType` union, `ServiceRequestPayload`, `ServiceRequest`

**Create: `src/lib/api/services.ts`** — `submitRequest(data)`

**Create: `src/lib/hooks/useServices.ts`** — `useSubmitServiceRequest()` mutation

### 3C: Admin API Frontend

**Modify: `src/lib/api/admin.ts`** — add methods for analytics, CSV exports (responseType: blob), user management, products CRUD, services management.

---

## Milestone 4: Page Implementation

### 4A: Service Detail Pages (new)

**Create: `src/app/services/[slug]/page.tsx`** — server component with generateMetadata

**Create: `src/app/services/[slug]/ServiceDetailPageClient.tsx`** — layout:

1. Hero (service name + problem statement)
2. Process Timeline (4-step visual)
3. Deliverables (icon grid)
4. Outcome (bold stat/result)
5. `<ServiceIntakeForm serviceType={...} />` — inline, not modal

Route slugs: `asset-register`, `verification`, `disposal`, `training`, `outsourcing`

### 4B: Product Detail Pages (new)

**Create: `src/app/scanners/[slug]/page.tsx`** + **`ScannerDetailPageClient.tsx`**
**Create: `src/app/tags/[slug]/page.tsx`** + **`TagDetailPageClient.tsx`**

Layout:

1. Hero — `product.image_hero`, name, short_description
2. Context — `product.image_context`, body copy
3. Technical Specs — table from `product.specifications` JSONField
4. Use Case — `product.image_usecase`
5. Configurator CTA (if `product.is_configurable`) → `/configurator?product={slug}`
6. Datasheet download (if `product.datasheet_url`)

### 4C: Connect Configurator to Product API

**Modify: `src/app/configurator/ConfiguratorPageClient.tsx`**

- Read `?product=slug` from URL params
- Call `useProductConfig(productSlug)` to load sections and options
- Replace hardcoded `configOptions` with API response
- Add skeleton loading state for both panes
- "Add to Quote" CTA encodes selection as URL params → `/rfq?config={encoded}`

### 4D: Connect Compare Page to Products API

**Modify: `src/app/compare/ComparePageClient.tsx`**

- "Hardware Scanners" tab → `useProductsByCategory("scanners")`
- "Tags" tab → `useProductsByCategory("tags")`
- "Arcplus" tab → remains static (subscription plans, not DB products)
- Build comparison feature matrix from union of `specifications` keys

### 4E: Training Calendar View

**Create: `src/components/training/TrainingCalendar.tsx`**
Monthly grid with level-coded session dots. Month navigation. Click a session → opens registration modal.

**Modify: `src/app/training/TrainingPageClient.tsx`** — add List/Calendar view switcher. Add multi-currency price display.

### 4F: Resources Hub (static content)

**Modify: `src/app/resources/api-reference/page.tsx`** — auth overview, endpoint table grouped by app, code examples with copy buttons
**Modify: `src/app/resources/case-studies/page.tsx`** — 3–4 case study cards with hero metric + 3-column breakdown
**Modify: `src/app/resources/docs/page.tsx`** — two-column layout: sidebar nav + content sections
**Modify: `src/app/resources/support/page.tsx`** — support tier matrix + response times + contact form (submits to RFQ endpoint)

### 4G: Arcplus Multi-currency Pricing

**Modify: `src/app/arcplus/ArcplusPageClient.tsx`**

- Replace inline pricing with `<PricingTable>` component
- Add USD/UGX/KES picker above pricing section
- Persist currency preference to localStorage under `abs_preferred_currency`

---

## Milestone 5: Admin Portal Enhancements

### 5A: Analytics Dashboard

**Modify: `src/app/admin-portal/page.tsx`**

- Period selector: 7d / 30d / 90d pill toggle
- Revenue summary row: total RFQ value, active trials, conversion rate
- CSS-only horizontal bar chart for "RFQs by Status" (no chart library)

### 5B: CSV Export

**Modify:** `admin-portal/quotes/page.tsx`, `admin-portal/subscriptions/page.tsx`, `admin-portal/training/page.tsx`
Add "Export CSV" button — calls blob endpoint, triggers browser download via object URL.

### 5C: User Management (new)

**Create: `src/app/admin-portal/users/page.tsx`**
Debounced search, role filter, table with deactivate/role-change actions. Row-expand panel for details (no separate detail page).

### 5D: Products CRUD (new)

**Create: `src/app/admin-portal/products/page.tsx`** — list with category filter, thumbnail, edit/delete
**Create: `src/app/admin-portal/products/new/page.tsx`** — multi-section form (basic info, images, specs key-value array, config sections)
**Create: `src/app/admin-portal/products/[id]/page.tsx`** — same form pre-populated

### 5E: Services Request Management (new)

**Create: `src/app/admin-portal/services/page.tsx`**
Filter by service type + status. Table with urgency. Row click → full intake_data as readable key-value. Inline status + admin_notes update. Email client mailto shortcut.

### 5F: Admin Sidebar Update

**Modify: `src/components/admin/AdminSidebar.tsx`**
Add: Services, Users, Products nav items. Red badge on Services when `stats.new_service_requests > 0`.

---

## Milestone 6: Integration and Polish

### 6A: Dynamic Header Product Links

**Modify: `src/components/layout/Header.tsx`**
Replace hardcoded mega menu arrays with data from `GET /api/v1/products/?category=scanners` and `?category=tags`. Use Next.js Route Handler at `src/app/api/nav-products/route.ts` with edge cache for performance.

### 6B: Configurator URL Round-trip

- Scanner/Tag detail pages: "Configure" CTA → `/configurator?product={slug}`
- Configurator "Add to Quote": encodes selection → `/rfq?config={base64-encoded-json}`
- RFQ page: reads `config` param, pre-selects hardware, shows read-only "Configuration Summary"

### 6C: SEO Metadata

Dynamic `generateMetadata()` in all `page.tsx` files. Priority: scanner slugs, tag slugs, service slugs, arcplus.

Update `src/app/sitemap.ts` — add `/scanners/{slug}`, `/tags/{slug}`, service pages.

### 6D: Loading States

**Create: `src/components/ui/SkeletonCard.tsx`** — animated pulse skeleton

Apply to: Training sessions list, Compare product headers, Configurator panes.

### 6E: WCAG AA Compliance

- `aria-label` on all icon-only buttons
- Meaningful `alt` on all `<Image>` components
- Add `useReducedMotion()` from Framer Motion to animation components — set `duration: 0` when true
- All form inputs: `focus:ring-2 focus:ring-primary-500`

### 6F: Performance

- Audit GSAP imports — remove if unused (saves ~90KB), or implement one scroll-triggered animation to justify
- Add remote image domains to `next.config.ts` for S3/CDN
- All hero `<Image>` components: `priority` prop set
- All non-hero images: no `priority` (lazy load)

---

## Implementation Sequence

```
Step 1: M1A Products App + seed script
Step 2: M1B Services App + M1C Organization (parallel with Step 1)
Step 3: M2A/B/C/D Component Architecture (parallel track)
Step 4: M1D Celery + M1E Trial Tasks + M1F Audit + M1G Multi-currency
Step 5: M1H Admin API + M1I Payment Strategy
Step 6: M3A Products API/types/hooks + M3B Services API/hooks
Step 7: M3C Admin API frontend layer
Step 8: M4A Service detail pages + M4B Product detail pages
Step 9: M4C Configurator API + M4D Compare API + M4E Training calendar
Step 10: M4F Resources content + M4G Arcplus currency
Step 11: M5A-F Admin portal enhancements
Step 12: M6A-F Integration, SEO, a11y, performance
```

---

## Critical Dependencies

| Dependency | Blocks |
|---|---|
| M1A Products app + seed script | M3A, M4B, M4C, M4D, M6A |
| M1B Services app | M3B, M4A |
| M2B ServiceIntakeForm component | M4A (can use mock submit first) |
| M2B PricingTable component | M4G |
| M3A product hooks | M4C, M4D |

---

## Key Architectural Decisions

1. **Arcplus pricing plans stay as frontend constants** — not DB products. They change rarely and the billing toggle animation is tightly coupled to component state. The `PricingTable` component accepts a `rates` prop for future live exchange rates.

2. **RFQ ≠ ServiceRequest** — Two separate intake paths. RFQ for hardware quotation (quantity-based), ServiceRequest for professional services engagement (type-specific guided questions). Separate admin tables.

3. **Configurator state lives in URL params** — not React state. Enables deep-linking, browser navigation, and RFQ pre-fill from configurator session.

4. **Custom admin portal vs Django admin** — Custom portal handles operational workflows. Django `/django-admin/` handles data maintenance. Audit logging only applies to custom portal views.

5. **No chart library** — Admin analytics uses CSS-only bar charts (width as % of max). Avoids adding Recharts/Chart.js bundle weight.

---

## Verification Checklist (End-to-End)

### Backend

- [ ] `docker-compose up` starts all 6 services without errors (db, redis, backend, celery, celery_beat, frontend)
- [ ] `POST /api/v1/products/seed` (or management command) populates products matching current hardcoded frontend data
- [ ] `GET /api/v1/products/?category=scanners` returns scanner products
- [ ] `POST /api/v1/services/requests/` creates a ServiceRequest and sends two emails
- [ ] Celery task `check_trial_expiry` runs without error (manual trigger)
- [ ] `GET /api/v1/admin/analytics/` returns stats for an admin user
- [ ] `GET /api/v1/admin/export/rfq/` returns a CSV file

### Frontend

- [ ] `/configurator?product={slug}` loads product config from API (not hardcoded data)
- [ ] `/compare` scanner tab loads products from API
- [ ] `/services/asset-register` renders ServiceIntakeForm and submits successfully
- [ ] `/scanners/{slug}` renders a product detail page with specs from API
- [ ] `/arcplus` pricing table shows USD/UGX/KES toggle working
- [ ] `/training` calendar view renders sessions on correct dates
- [ ] Admin portal `/admin-portal/services` lists submitted service requests
- [ ] Admin portal `/admin-portal/products/new` creates a product visible in `/scanners`
- [ ] CSV export downloads from all three admin table pages
- [ ] Header mega menu product links reflect DB products (not hardcoded)

### Quality

- [ ] Lighthouse score ≥ 90 on homepage (mobile)
- [ ] No WCAG AA color contrast failures
- [ ] `prefers-reduced-motion` disables Framer Motion animations
- [ ] All form inputs have visible focus rings
