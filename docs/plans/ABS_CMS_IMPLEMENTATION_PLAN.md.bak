# ABS Django Headless CMS — Implementation Plan

## TL;DR

All marketing/public page content is hardcoded in `.tsx` files. The Django backend already has product CRUD + admin API + audit logging. Extend Django as an enterprise-grade headless CMS with content models, media library, publishing workflows, structured SEO, and API endpoints — then replace hardcoded frontend content with API-driven data. No third-party CMS needed.

The CMS is designed in four phases: backend models & API → frontend content replacement → admin portal UI → extended content types (blog, email templates, testimonials, regional variants).

## Why Django-as-CMS (not Sanity/Strapi/etc.)

- Django Admin already exists at `/django-admin/` with full auth
- Custom admin portal already at `/admin-portal/` with audit logging
- Existing API patterns (DRF + TanStack Query hooks) can be reused
- No new service to deploy/manage — stays in `docker-compose.yml`
- Product model already demonstrates the pattern (categories, images, specs, config)

---

## Content Audit — What Needs CMS Control

### Tier 1: Marketing Pages (highest value)

| Page | Hardcoded Content | Model Needed |
|------|------------------|-------------|
| Landing (`/`) | Hero headline/subtext/CTA, product gallery cards, decision cards | `HeroSection`, `PageBlock` |
| Arcplus (`/arcplus`) | 8 modules, 4 pricing plans, 13-row feature matrix | `ArcplusModule`, `PricingPlan`, `PlanFeature` |
| Scanners (`/scanners`) | Hero, 4 context images, 4-step config process | Reuse `Product` model + new `PageBlock` |
| Tags (`/tags`) | 6 tag categories, 3 filter dimensions | Reuse `Product` model + new `PageBlock` |
| Services (`/services`) | 6 service cards (problem/process/deliverables/result) | `ServiceOffering` |

### Tier 2: Resources & Support

| Page | Hardcoded Content | Model Needed |
|------|------------------|-------------|
| Case Studies (`/resources/case-studies`) | 3 case studies with metrics & quotes | `CaseStudy` |
| Support (`/resources/support`) | 7-row support tier comparison | `SupportTier` |
| Docs (`/resources/docs`) | Getting started guides | `DocumentationPage` |
| API Reference (`/resources/api-reference`) | 20 endpoints in 5 groups | `APIEndpointGroup` |

### Tier 3: Global/Shared

| Element | Hardcoded Content | Model Needed |
|---------|------------------|-------------|
| Header | Navigation links, product dropdown items | `NavigationItem` |
| Footer | Links, contact info, CTAs | `FooterSection` |
| Compare Arcplus tab | 3 plans, 8 features | Reuse `PricingPlan`/`PlanFeature` |
| Currency rates | USD:1, UGX:3700, KES:130 | `SiteSettings` singleton |
| SEO metadata | title, description, OG tags per page | `PageMeta` |

### Tier 4: Enterprise CMS Capabilities

| Capability | Current State | Model/System Needed |
|------------|--------------|-------------------|
| Publishing workflow | No drafts — all edits go live instantly | `ContentStatus` mixin on all models |
| Multi-image product galleries | Single image fields per product | `ProductImage` (ordered, typed) |
| Media asset library | No centralized media browser | `MediaAsset`, `AssetTag` |
| Structured data / Schema.org | No structured data | `StructuredDataTemplate` + `PageMeta` extension |
| Email templates | Hardcoded Django templates (8+ emails) | `EmailTemplate` |
| Blog / articles | None | `BlogPost`, `BlogCategory` |
| Testimonials / social proof | None | `Testimonial` |
| Regional content variants | Single-region content | `RegionalVariant` |

### Already API-Driven (no CMS work needed)

- Training sessions & registrations
- Product catalog (scanners/tags) — categories, specs, config
- RFQ/Service request forms
- Portal & admin portal data

---

## Phase 1: Backend — Content Models & API

### Step 1: Media Upload Infrastructure

- Add `MEDIA_URL` and `MEDIA_ROOT` to Django settings
- Add `django-storages` to requirements (for future S3/cloud migration)
- Add media URL pattern to `abs_backend/urls.py`
- Configure Next.js `next.config.ts` `images.remotePatterns` for the Django media domain

**Files:** `backend/abs_backend/settings/base.py`, `backend/abs_backend/urls.py`, `backend/requirements.txt`, `next.config.ts`

### Step 2: New `cms` Django App

Create `backend/apps/cms/` with models:

#### Core Infrastructure Models

**`PublishableMixin`** (abstract model — inherited by all content models)

- `status` (CharField, choices: draft, review, approved, published, archived; default: draft)
- `created_by` (ForeignKey → User, nullable) — who created the content
- `updated_by` (ForeignKey → User, nullable) — who last edited
- `approved_by` (ForeignKey → User, nullable) — who approved for publishing
- `approved_at` (DateTimeField, nullable)
- `published_at` (DateTimeField, nullable) — when it went live
- `scheduled_publish_at` (DateTimeField, nullable) — future auto-publish time
- `created_at` (DateTimeField, auto)
- `updated_at` (DateTimeField, auto)

Publishing workflow rules:

1. Draft → Review (author submits)
2. Review → Approved (reviewer signs off)
3. Approved → Published (manual or scheduled)
4. Any → Archived (soft delete, stays in DB)
5. Public API only returns `status=published` records

**`MediaAsset`** (centralized media library)

- `id` (UUIDField, PK)
- `file` (FileField) — uploaded file
- `asset_type` (CharField, choices: image, video, document, diagram)
- `filename` (CharField) — original filename
- `alt_text` (CharField, optional)
- `caption` (CharField, optional)
- `file_size` (IntegerField) — bytes
- `width` (IntegerField, nullable) — for images
- `height` (IntegerField, nullable) — for images
- `tags` (ManyToManyField → AssetTag)
- `uploaded_by` (ForeignKey → User)
- `usage_count` (IntegerField, default: 0) — track references
- `created_at` (DateTimeField, auto)

**`AssetTag`** (media organization)

- `name` (CharField, unique)
- `slug` (SlugField, unique)

**`ProductImage`** (multi-image galleries per product, per the Visual Product Gallery System)

- `product` (ForeignKey → Product, cascades)
- `image_type` (CharField, choices: hero, context, detail, workflow, config)
- `image` (ImageField)
- `alt_text` (CharField)
- `caption` (CharField, optional)
- `order` (IntegerField, default: 0)
- `is_active` (BooleanField, default: True)
- `created_at` (DateTimeField, auto)

Note: Supports the 5-layer visual system — Hero, Context, Detail, Workflow, Configuration — with multiple images per layer (e.g., 3 context images for a scanner).

#### Site-Wide Models

**`SiteSettings`** (singleton)

- `currency_rates` (JSONField) — {USD: 1, UGX: 3700, KES: 130}
- `company_phone`, `company_email`, `company_address` (CharFields)
- `social_links` (JSONField) — {linkedin, twitter, etc.}
- `default_og_image` (ImageField, optional) — fallback social share image
- `google_analytics_id` (CharField, optional) — GA4 measurement ID
- `robots_txt_extra` (TextField, optional) — additional disallow rules
- `organization_schema` (JSONField, optional) — Schema.org Organization data
- `updated_at` (DateTimeField)

**`PageMeta`** (one per route)

- `route` (CharField, unique) — e.g. "/", "/arcplus", "/services"
- `title` (CharField)
- `description` (TextField)
- `og_image` (ImageField, optional)
- `canonical_url` (CharField, optional) — override canonical for duplicate content
- `is_indexed` (BooleanField, default: True) — set false for draft/staging pages
- `structured_data` (JSONField, optional) — Schema.org JSON-LD per page (Product, FAQ, etc.)
- `hreflang_alternates` (JSONField, optional) — language alternates for future localization

**`HeroSection`** (one per page, inherits `PublishableMixin`)

- `page` (CharField, unique) — "home", "scanners", "tags", etc.
- `headline` (CharField)
- `subheadline` (TextField)
- `cta_primary_text`, `cta_primary_link` (CharFields)
- `cta_secondary_text`, `cta_secondary_link` (CharFields, optional)
- `background_image` (ImageField)
- `is_active` (BooleanField)
- `order` (IntegerField)

**`PageBlock`** (flexible content blocks, multiple per page, inherits `PublishableMixin`)

- `page` (CharField) — "home", "scanners", etc.
- `block_type` (CharField, choices: text, feature_card, image_text, cta_banner, stats_row, video, embed)
- `title` (CharField, optional)
- `body` (TextField, optional)
- `image` (ImageField, optional)
- `video_url` (CharField, optional) — YouTube/Vimeo embed URL
- `icon` (CharField, optional) — Lucide icon name
- `link_url`, `link_text` (CharFields, optional)
- `data` (JSONField, optional) — flexible extra fields
- `order` (IntegerField)
- `is_active` (BooleanField)

**`NavigationItem`**

- `label` (CharField)
- `url` (CharField)
- `parent` (ForeignKey to self, nullable) — for dropdowns
- `location` (CharField, choices: header, footer)
- `column` (CharField, optional) — footer column grouping
- `order` (IntegerField)
- `is_active` (BooleanField)

**`ServiceOffering`** (replaces hardcoded service cards, inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `icon` (CharField) — Lucide icon name
- `short_description` (TextField)
- `problem` (TextField)
- `process` (TextField)
- `deliverables` (JSONField) — list of strings
- `result` (TextField)
- `image` (ImageField, optional)
- `order` (IntegerField)
- `is_active` (BooleanField)

**`ArcplusModule`** (inherits `PublishableMixin`)

- `name` (CharField)
- `slug` (SlugField, unique)
- `tagline` (CharField)
- `description` (TextField)
- `icon` (CharField)
- `features` (JSONField) — list of feature strings
- `image` (ImageField, optional)
- `order` (IntegerField)
- `is_active` (BooleanField)

**`PricingPlan`** (inherits `PublishableMixin`)

- `name` (CharField) — Starter, Growth, etc.
- `slug` (SlugField, unique)
- `tagline` (CharField)
- `price_usd` (DecimalField)
- `price_ugx` (DecimalField, nullable)
- `price_kes` (DecimalField, nullable)
- `billing_period` (CharField) — "year", "month"
- `is_recommended` (BooleanField)
- `cta_text` (CharField)
- `cta_link` (CharField)
- `order` (IntegerField)
- `is_active` (BooleanField)

**`PlanFeature`**

- `name` (CharField)
- `plans` — through table mapping feature to plan with value (CharField or BooleanField)
- `order` (IntegerField)

**`CaseStudy`** (inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `client_name` (CharField)
- `industry` (CharField)
- `challenge` (TextField)
- `solution` (TextField)
- `results` (JSONField) — [{metric, value, label}]
- `quote` (TextField, optional)
- `quote_author` (CharField, optional)
- `image` (ImageField, optional)
- `is_active` (BooleanField)
- `order` (IntegerField)

**Files:** `backend/apps/cms/models.py`, `backend/apps/cms/admin.py`, `backend/apps/cms/serializers.py`, `backend/apps/cms/urls.py`, `backend/apps/cms/views.py`, migrations

### Step 3: CMS API Endpoints (public, read-only)

All `AllowAny` permission, cached. Only returns `status=published` records:

| Endpoint | Returns |
|----------|---------|
| `GET /api/v1/cms/settings/` | SiteSettings singleton |
| `GET /api/v1/cms/meta/?route=/arcplus` | PageMeta for route (includes structured data, canonical) |
| `GET /api/v1/cms/hero/?page=home` | HeroSection for page |
| `GET /api/v1/cms/blocks/?page=home` | PageBlocks for page, ordered |
| `GET /api/v1/cms/navigation/?location=header` | NavigationItems tree |
| `GET /api/v1/cms/services/` | ServiceOfferings ordered |
| `GET /api/v1/cms/arcplus/modules/` | ArcplusModules ordered |
| `GET /api/v1/cms/arcplus/pricing/` | PricingPlans with features |
| `GET /api/v1/cms/case-studies/` | CaseStudies ordered |
| `GET /api/v1/cms/case-studies/<slug>/` | Single CaseStudy detail |
| `GET /api/v1/products/<slug>/gallery/` | ProductImage set for product, ordered by type+order |

### Step 4: CMS Admin API Endpoints (admin-only, CRUD)

Following existing pattern in `backend/apps/accounts/admin_views.py`:

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/v1/admin/cms/settings/` | GET, PATCH | Edit site settings |
| `/api/v1/admin/cms/hero/` | GET, POST | List/create hero sections |
| `/api/v1/admin/cms/hero/<id>/` | PATCH, DELETE | Update/delete hero |
| `/api/v1/admin/cms/hero/<id>/publish/` | POST | Transition status → published |
| `/api/v1/admin/cms/blocks/` | GET, POST | List/create page blocks |
| `/api/v1/admin/cms/blocks/<id>/` | PATCH, DELETE | Update/delete block |
| `/api/v1/admin/cms/blocks/<id>/publish/` | POST | Transition status → published |
| `/api/v1/admin/cms/navigation/` | GET, POST | List/create nav items |
| `/api/v1/admin/cms/navigation/<id>/` | PATCH, DELETE | Update/delete nav item |
| `/api/v1/admin/cms/media/` | GET, POST | List/upload media assets |
| `/api/v1/admin/cms/media/<id>/` | PATCH, DELETE | Update metadata/delete asset |
| `/api/v1/admin/cms/media/tags/` | GET, POST | List/create asset tags |
| `/api/v1/admin/cms/products/<id>/gallery/` | GET, POST | List/add product images |
| `/api/v1/admin/cms/products/<id>/gallery/<id>/` | PATCH, DELETE | Update/delete product image |
| (same CRUD + publish pattern for services, modules, pricing, case studies) | | |

All mutations write to `AuditLog` following existing pattern. Status transitions validate the workflow (e.g., only `approved` content can be published).

### Step 5: Django Admin Registration

Register all CMS models in `backend/apps/cms/admin.py` with:

- Inline editors for PlanFeatures inside PricingPlan
- Inline editors for child NavigationItems
- Inline editors for ProductImages inside Product
- Image preview in list view
- Ordering by `order` field
- Filtering by `is_active`, `page`, `location`, `status`
- Status color indicators (draft=grey, review=yellow, published=green, archived=red)
- Bulk actions: publish selected, archive selected
- Media library: searchable by tag, filterable by asset_type, usage_count display

### Step 6: Data Migration — Seed Current Content

Management command `backend/apps/cms/management/commands/seed_cms_content.py`:

- Extract all hardcoded content from frontend `.tsx` files
- Create initial CMS records matching current website content
- Ensures zero visual change on first deploy

**Files:** `backend/apps/cms/management/commands/seed_cms_content.py`

---

## Phase 2: Frontend — Replace Hardcoded Content

### Step 7: CMS API Client & Hooks

*Parallel with Step 6*

Add to frontend:

- `src/lib/api/cms.ts` — API functions for all CMS endpoints
- `src/lib/hooks/useCMS.ts` — TanStack Query hooks with long stale times (content changes rarely)

Follow existing patterns in `src/lib/api/products.ts` and `src/lib/hooks/useProducts.ts`.

**Files:** `src/lib/api/cms.ts`, `src/lib/hooks/useCMS.ts`

### Step 8: Replace Landing Page Content

*Depends on Steps 6, 7*

- `src/app/HomePageClient.tsx` — Replace hardcoded hero, product gallery text, decision cards with `useHeroSection("home")`, `usePageBlocks("home")`
- `src/app/page.tsx` — Replace static metadata with dynamic fetch from `PageMeta`

### Step 9: Replace Arcplus Page Content

*Depends on Steps 6, 7*

- Replace 8 hardcoded module objects with `useArcplusModules()`
- Replace 4 pricing plans with `usePricingPlans()`
- Replace 13-row feature matrix with `usePlanFeatures()`

### Step 10: Replace Services Page Content

*Depends on Steps 6, 7*

- Replace 6 hardcoded service cards with `useServiceOfferings()`

### Step 11: Replace Navigation Content

*Depends on Steps 6, 7*

- Header component: Replace hardcoded nav links with `useNavigation("header")`
- Footer component: Replace hardcoded links/contact info with `useNavigation("footer")` + `useSiteSettings()`

### Step 12: Replace Resources Pages

*Depends on Steps 6, 7*

- Case studies: `useCaseStudies()`
- Support tiers, docs, API reference: `usePageBlocks("support")`, etc.

### Step 13: Replace Compare Arcplus Tab

*Depends on Step 9*

- Reuse `usePricingPlans()` + `usePlanFeatures()` in compare page

### Step 14: Replace Scanner/Tags Page Heroes

*Depends on Steps 6, 7*

- Replace hardcoded hero sections with `useHeroSection("scanners")`, `useHeroSection("tags")`
- Product data already API-driven; only marketing copy needs CMS

### Step 15: Currency Rates from CMS

- Replace hardcoded `{ USD: 1, UGX: 3700, KES: 130 }` with `useSiteSettings().currency_rates`
- Update all components that reference hardcoded rates (Arcplus pricing, training)

---

## Phase 3: Admin Portal CMS UI

### Step 16: CMS Management Section in Admin Portal

*Depends on Step 4*

Add CMS section to `/admin-portal/` with pages:

- **Pages & Content** — List pages, edit hero sections and page blocks per page. Status indicators (draft/review/published/archived). Inline preview before publishing.
- **Navigation** — Drag-to-reorder header/footer links
- **Services** — CRUD service offerings with publishing workflow
- **Arcplus** — Edit modules, pricing plans, feature matrix with publishing workflow
- **Case Studies** — CRUD case studies with publishing workflow
- **Site Settings** — Company info, currency rates, social links, analytics config, structured data
- **Media Library** — Browse, search, tag, upload, and organize all media assets. Grid/list view toggle. Filter by type and tag. Usage tracking (warn before deleting assets in use). Bulk operations (tag, delete).
- **Product Galleries** — Manage 5-layer image sequences per product. Drag-to-reorder. Image type assignment.

Follow existing admin portal patterns in `src/app/admin-portal/`.

**Files:** New route group `src/app/admin-portal/cms/` with sub-pages

### Step 17: Image Upload Component

- Build reusable image upload component for admin portal
- Upload to Django media endpoint, return URL
- Show preview, support drag-and-drop
- Auto-resize and convert to WebP on upload (via Pillow backend processing)
- Display file size and dimensions

### Step 18: Publishing Workflow UI

- Status badge on every content item (Draft → Review → Published → Archived)
- "Submit for Review" button for editors
- "Approve" / "Reject" actions for reviewers
- "Publish Now" / "Schedule Publish" for publishers
- Content preview — render page as it would appear when published
- Activity log per content item (who changed what, when)

---

## Phase 4: Extended Content Types

### Step 19: Blog & Articles System

*Parallel with Phase 3*

New models in `backend/apps/cms/`:

**`BlogCategory`**

- `name` (CharField)
- `slug` (SlugField, unique)
- `description` (TextField, optional)
- `order` (IntegerField)

**`BlogPost`** (inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `excerpt` (TextField) — short preview text
- `body` (TextField) — full article content
- `featured_image` (ImageField, optional)
- `category` (ForeignKey → BlogCategory)
- `author_name` (CharField)
- `author_avatar` (ImageField, optional)
- `seo_keywords` (CharField, optional) — comma-separated
- `reading_time_minutes` (IntegerField, optional)
- `is_featured` (BooleanField, default: False)
- `order` (IntegerField)

API endpoints:

- `GET /api/v1/cms/blog/` — published posts (filterable by `?category=`, paginated)
- `GET /api/v1/cms/blog/<slug>/` — single post detail
- `GET /api/v1/cms/blog/categories/` — all categories
- Admin CRUD endpoints following existing pattern

Frontend:

- New route `/resources/blog/` (list) and `/resources/blog/[slug]` (detail)
- Add to sitemap generation

**Files:** `src/app/resources/blog/`, admin portal blog management page

### Step 20: Email Template Management

*Depends on Phase 1*

**`EmailTemplate`** (inherits `PublishableMixin`)

- `name` (CharField) — "Trial Welcome", "Quote Received"
- `slug` (SlugField, unique) — matches trigger enum in notification service
- `subject` (CharField)
- `body_html` (TextField)
- `body_text` (TextField) — plain text fallback
- `trigger_type` (CharField, choices: trial_welcome, trial_reminder_7d, trial_reminder_3d, trial_expired, quote_received, quote_received_admin, quote_response, training_confirmation, service_request, payment_receipt)
- `available_variables` (JSONField) — ["{{user.full_name}}", "{{trial.expiry_date}}", etc.]
- `preview_data` (JSONField) — sample data for admin preview

Integration:

- Modify `backend/apps/notifications/service.py` to load templates from DB instead of filesystem
- Fallback: if no DB template found for a trigger, use hardcoded template (backward compatible)

Admin UI:

- Template editor with variable picker sidebar
- Preview pane (render with `preview_data`)
- Send test email button
- Version indicator (last edited by, when)

**Files:** `backend/apps/cms/models.py` (EmailTemplate), `backend/apps/notifications/service.py` (modify), admin portal email management page

### Step 21: Testimonials & Social Proof

**`Testimonial`** (inherits `PublishableMixin`)

- `quote` (TextField)
- `author_name` (CharField)
- `author_role` (CharField, optional) — "Asset Manager"
- `company_name` (CharField)
- `industry` (CharField, optional)
- `avatar` (ImageField, optional)
- `rating` (IntegerField, optional) — 1-5 stars
- `placement` (CharField, choices: homepage, arcplus, services, global) — where to show
- `order` (IntegerField)

API endpoints:

- `GET /api/v1/cms/testimonials/?placement=homepage` — filtered by placement
- Admin CRUD endpoints

Frontend:

- New reusable `<TestimonialCarousel />` component
- Integrate into homepage, Arcplus, and services pages

### Step 22: Documentation Pages

**`DocumentationPage`** (inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `section` (CharField, choices: getting_started, user_guide, api_reference, troubleshooting)
- `body` (TextField)
- `parent` (ForeignKey to self, nullable) — for nested docs
- `order` (IntegerField)

**`APIEndpointGroup`**

- `name` (CharField) — "Authentication", "Products", etc.
- `description` (TextField)
- `endpoints` (JSONField) — [{method, path, description, params[], response_example}]
- `order` (IntegerField)

Frontend:

- Replace hardcoded docs/API reference content with CMS data
- Sidebar navigation auto-generated from parent/child structure

### Step 23: Regional Content Variants

*Depends on Phase 2 completion*

**`RegionalVariant`** (generic override system)

- `content_type` (ForeignKey → Django ContentType)
- `object_id` (CharField) — PK of the content object
- `region` (CharField, choices: ug, ke, global)
- `language` (CharField, choices: en, sw; default: en)
- `title_override` (CharField, nullable)
- `body_override` (TextField, nullable)
- `image_override` (ImageField, nullable)
- `cta_link_override` (CharField, nullable)
- `data_override` (JSONField, nullable) — flexible overrides

Usage pattern:

- Frontend passes `?region=ug&lang=en` to CMS endpoints
- API applies overrides on top of base content (null fields use parent)
- Enables country-specific hero images, pricing CTAs, service availability

Note: Full localization (English + Swahili) is separate from regional variants. Regional variants handle country-specific content within the same language. Full i18n (`next-intl`) is deferred to a future phase.

---

## Relevant Files

### Backend (modify)

- `backend/abs_backend/settings/base.py` — Add `cms` to INSTALLED_APPS, configure MEDIA_ROOT/URL
- `backend/abs_backend/urls.py` — Add CMS URL patterns + media serving
- `backend/requirements.txt` — Add `Pillow` (ImageField), `django-storages` (optional)
- `backend/apps/notifications/service.py` — Load email templates from DB instead of filesystem (Phase 4)

### Backend (create)

- `backend/apps/cms/` — Entire new app (models, admin, serializers, urls, views, migrations)
- `backend/apps/cms/management/commands/seed_cms_content.py` — Data seed
- `backend/apps/cms/mixins.py` — `PublishableMixin` abstract model

### Frontend (modify)

- `src/app/HomePageClient.tsx` — Replace hardcoded content
- `src/app/arcplus/` — Replace modules, pricing, features
- `src/app/services/` — Replace service cards
- `src/app/scanners/` — Replace hero section
- `src/app/tags/` — Replace hero section
- `src/app/compare/ComparePageClient.tsx` — Replace Arcplus static data
- `src/components/layout/` — Header/Footer navigation
- `src/app/resources/` — Case studies, support, docs
- `next.config.ts` — Add media domain to image config

### Frontend (create)

- `src/lib/api/cms.ts` — CMS API client
- `src/lib/hooks/useCMS.ts` — CMS data hooks
- `src/app/admin-portal/cms/` — Admin CMS management pages (content, media library, publishing workflow)
- `src/app/resources/blog/` — Blog list and detail pages (Phase 4)
- `src/components/ui/TestimonialCarousel.tsx` — Reusable testimonial component (Phase 4)

---

## Verification

1. **Migration test:** `python manage.py makemigrations cms && python manage.py migrate` — no errors
2. **Seed test:** `python manage.py seed_cms_content` — creates all records with `status=published`, verify via Django admin
3. **API test:** `curl localhost:8000/api/v1/cms/hero/?page=home` returns hero data
4. **Draft filtering:** `curl localhost:8000/api/v1/cms/hero/?page=home` does NOT return draft/review/archived content
5. **Visual regression:** Compare screenshots before/after for landing, arcplus, services, tags, scanners pages — should be pixel-identical
6. **Admin CRUD test:** Create/edit/delete a hero section via admin portal, verify frontend reflects change
7. **Publishing workflow test:** Create draft → submit for review → approve → publish → verify it appears on frontend
8. **Scheduled publish test:** Set `scheduled_publish_at` to 1 minute in future, verify auto-publish via Celery task
9. **Image upload test:** Upload image via media library, verify it renders on frontend with correct dimensions
10. **Product gallery test:** Add 5 images (hero, context, detail, workflow, config) to a product, verify gallery renders
11. **Media library test:** Upload, tag, search, delete assets. Verify delete-in-use warning.
12. **Structured data test:** Check `<script type="application/ld+json">` renders correctly on product and organization pages
13. **Email template test:** Edit a trial welcome template in admin, send test email, verify formatting
14. **Fallback test:** If CMS API is down/empty, pages should render graceful fallback (skeleton or static defaults)
15. **`npm run build`** — No TypeScript errors after all replacements

---

## Decisions

- **Django-as-CMS over third-party** — Avoids new service, leverages existing stack, keeps data in one database
- **ImageField + Pillow over URL strings** — Proper file upload support (existing Product model uses URL strings — migration optional)
- **`PageBlock` with JSONField flexibility** — Avoids creating a model per block type; `block_type` + `data` allows extensibility
- **`PublishableMixin` on all content models** — Baked in from day one to avoid costly retrofit; draft/review/published/archived workflow with role-based access
- **Centralized media library** — `MediaAsset` + `AssetTag` models instead of scattered ImageFields; enables reuse, search, and usage tracking across all content
- **`ProductImage` model for 5-layer galleries** — Supports the documented Visual Product Gallery System (hero, context, detail, workflow, config) with ordered multi-image sequences per product
- **Structured data via JSONField on `PageMeta`** — Flexible Schema.org support without a rigid model per schema type; admin can preview rendered JSON-LD
- **Email templates in DB with filesystem fallback** — Existing hardcoded templates still work if no DB record exists; gradual migration
- **Regional variants via generic ContentType** — `RegionalVariant` can override any content model without modifying each model individually
- **Seed migration over manual re-entry** — Zero-downtime content transition; current hardcoded content becomes initial CMS data with `status=published`
- **Long stale times on CMS queries** — Content changes rarely; 10-minute `staleTime` reduces API calls
- **Phase 3 (Admin UI) is separate** — Django Admin serves as interim CMS UI while custom admin portal CMS pages are built
- **Phase 4 (Extended Types) is additive** — Blog, testimonials, docs, email templates, regional variants built on the same `PublishableMixin` foundation

## Scope Boundaries

- **Included (Phases 1–3):** All marketing pages, navigation, settings, media library, product galleries, publishing workflow, structured SEO, admin CRUD with audit logging
- **Included (Phase 4):** Blog/articles, email template management, testimonials, documentation pages, regional content variants
- **Excluded:** Rich text / WYSIWYG editor (TextField is sufficient for now), A/B testing framework, AI content recommendations
- **Deferred:** Full localization / i18n (English + Swahili via `next-intl`), campaign-specific dynamic landing pages, content versioning with rollback history, partner/reseller portal content
- **Deferred:** Migrating existing Product `image_hero` etc. from CharField(URL) to ImageField (works as-is, `ProductImage` model complements it)
