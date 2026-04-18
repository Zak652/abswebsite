# ABS Django Headless CMS — Implementation Plan

## TL;DR

All marketing/public page content is hardcoded in `.tsx` files. The Django backend already has product CRUD + admin API + audit logging. Extend Django as an enterprise-grade headless CMS with content models, media library, publishing workflows, structured SEO, and API endpoints — then replace hardcoded frontend content with API-driven data using Next.js ISR (Incremental Static Regeneration) for marketing pages and TanStack Query for admin portal management. No third-party CMS needed.

The CMS is designed in four phases: backend models & API → frontend content replacement (server-side rendering + ISR) → admin portal UI → extended content types (blog, email templates, testimonials, regional variants).

## Why Django-as-CMS (not Sanity/Strapi/etc.)

- Django Admin already exists at `/django-admin/` with full auth
- Custom admin portal already at `/admin-portal/` with audit logging
- Existing API patterns (DRF serializers + views) can be reused for CMS endpoints
- No new service to deploy/manage — stays in `docker-compose.yml`
- Product model already demonstrates the pattern (categories, images, specs, config)
- Existing `AuditLog` model provides enterprise audit trail foundation

---

## Content Audit — What Needs CMS Control

### Tier 1: Marketing Pages (highest value)

| Page | Hardcoded Content | Model Needed |
|------|------------------|-------------|
| Landing (`/`) | Hero headline/subtext/CTA, product gallery cards, decision cards, trust stats | `HeroSection`, `PageBlock` |
| Arcplus (`/arcplus`) | 8 modules, 4 pricing plans, 13-row feature matrix, lifecycle steps | `ArcplusModule`, `PricingPlan`, `PlanFeature` |
| Scanners (`/scanners`) | Hero, 4 context images, 4-step config process, specs | Reuse `Product` model + new `PageBlock` |
| Tags (`/tags`) | 6 tag categories, 3 filter dimensions | Reuse `Product` model + new `PageBlock` |
| Services (`/services`) | 6 service cards (problem/process/deliverables/result) | `ServiceOffering` |

### Tier 2: Resources & Support

| Page | Hardcoded Content | Model Needed |
|------|------------------|-------------|
| Case Studies (`/resources/case-studies`) | 3 case studies with metrics & quotes | `CaseStudy` |
| Support (`/resources/support`) | 4-tier support comparison (7+ features) | `SupportTier`, `SupportFeature` |
| Docs (`/resources/docs`) | 5 getting started guide sections | `DocumentationPage` |
| API Reference (`/resources/api-reference`) | 20 endpoints in 5 groups | `APIEndpointGroup` |

### Tier 3: Global/Shared

| Element | Hardcoded Content | Model Needed |
|---------|------------------|-------------|
| Header | Navigation links, product dropdown items | `NavigationItem` |
| Footer | Links, contact info (Boston address, phone, email), CTAs | `NavigationItem` + `SiteSettings` |
| Compare page — Arcplus tab | 3 plans, 8 features (hardware tabs already API-driven) | Reuse `PricingPlan`/`PlanFeature` |
| Currency rates | USD:1, UGX:3700, KES:130 (hardcoded in PricingTable + training) | `SiteSettings` singleton |
| SEO metadata | title, description, OG tags per page | `PageMeta` |

### Tier 4: Enterprise CMS Capabilities

| Capability | Current State | Model/System Needed |
|------------|--------------|-------------------|
| Publishing workflow | No drafts — all edits go live instantly | `PublishableMixin` on content models |
| Content revision history | Only `AuditLog` tracks admin actions | `ContentRevision` (auto-snapshot on save) |
| Multi-image product galleries | Single CharField URL fields per product | `ProductImage` (ordered, typed, linked to `MediaAsset`) |
| Media asset library | No centralized media browser | `MediaAsset`, `AssetTag` |
| Image processing pipeline | No image optimization | Celery task → WebP + multiple sizes |
| Structured data / Schema.org | No structured data | `PageMeta.structured_data` JSONField |
| Email templates | Hardcoded Jinja2 templates in `notifications/templates/` (8+ emails via Resend) | `EmailTemplate` |
| Blog / articles | None | `BlogPost`, `BlogCategory` |
| Testimonials / social proof | None | `Testimonial` |
| Regional content variants | Single-region content | `RegionalVariant` |

### Already API-Driven (no CMS work needed)

- Training sessions & registrations (multi-currency pricing already in DB)
- Product catalog (scanners/tags) — categories, specs, config sections/options
- RFQ/Service request forms & submissions
- Portal & admin portal data (quotes, subscriptions, training, users, services)
- Compare page — hardware Scanner/Tags tabs (via `ProductCompareTable`)

---

## Phase 1: Backend — Content Models & API

### Step 1: Media Upload Infrastructure

- Add `MEDIA_URL = "/media/"` and `MEDIA_ROOT = BASE_DIR / "media"` to Django settings
- Add `Pillow` to requirements (for ImageField support)
- Add `django-storages` to requirements (for future S3/Cloudflare R2 migration)
- Add media URL pattern to `abs_backend/urls.py` (dev-only static serving)
- Add `media_data:/app/media` volume mount to `docker-compose.yml` (persist uploads across container restarts)
- Add Django dev media domain (`localhost:8000`) to `next.config.ts` `images.remotePatterns` (AWS S3, Cloudflare R2, `cdn.absplatform.com`, and localhost are already configured)

**Files:** `backend/abs_backend/settings/base.py`, `backend/abs_backend/urls.py`, `backend/requirements.txt`, `docker-compose.yml`, `next.config.ts`

### Step 2: New `cms` Django App

Create `backend/apps/cms/` with models:

#### Core Infrastructure Models

**`PublishableMixin`** (abstract model — inherited by content models that need editorial workflow)

- `status` (CharField, choices: draft, review, approved, published, archived; default: draft)
- `version` (IntegerField, default: 1) — incremented on every save; enables optimistic locking
- `created_by` (ForeignKey → User, nullable) — who created the content
- `updated_by` (ForeignKey → User, nullable) — who last edited
- `approved_by` (ForeignKey → User, nullable) — who approved for publishing
- `approved_at` (DateTimeField, nullable)
- `published_at` (DateTimeField, nullable) — when it went live
- `scheduled_publish_at` (DateTimeField, nullable) — future auto-publish time
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

Note: Models inheriting `PublishableMixin` do NOT have a separate `is_active` field. The `status` field handles lifecycle: `status=archived` replaces deactivation. Public APIs filter by `status=published` only.

Publishing workflow rules:

1. Draft → Review (author submits)
2. Review → Approved (reviewer signs off)
3. Approved → Published (manual or scheduled via Celery)
4. Any → Archived (soft delete, stays in DB)
5. Published → Draft (unpublish for re-editing)
6. Public API only returns `status=published` records

Optimistic locking: Admin API PATCH requests must include `version`. If `version` doesn't match current DB value → return 409 Conflict. Prevents two admins silently overwriting each other's edits.

Custom `save()` override: Auto-increments `version` on every save. Auto-creates `ContentRevision` snapshot (see below).

**`ContentRevision`** (audit trail with rollback capability)

- `id` (UUIDField, PK)
- `content_type` (ForeignKey → Django ContentType)
- `object_id` (CharField) — PK of the content object
- `revision_number` (IntegerField) — matches `version` at time of save
- `data` (JSONField) — full serialized snapshot of the object at this version
- `status_at_revision` (CharField) — status value when this revision was created
- `created_by` (ForeignKey → User, nullable)
- `created_at` (DateTimeField, auto_now_add)

Usage: Auto-created via `post_save` signal on any `PublishableMixin` model. Enables "View History" and "Rollback to Version N" in admin UI. Builds on existing `AuditLog` pattern in `accounts/models.py` but stores full object snapshots rather than just change diffs.

**`MediaAsset`** (centralized media library)

- `id` (UUIDField, PK)
- `file` (FileField) — original uploaded file
- `asset_type` (CharField, choices: image, video, document, diagram)
- `filename` (CharField) — original filename
- `alt_text` (CharField, optional)
- `caption` (CharField, optional)
- `file_size` (IntegerField) — bytes
- `width` (IntegerField, nullable) — for images
- `height` (IntegerField, nullable) — for images
- `file_webp` (FileField, nullable) — auto-generated WebP version (images only)
- `file_thumbnail` (FileField, nullable) — 200px wide thumbnail
- `file_medium` (FileField, nullable) — 800px wide
- `file_large` (FileField, nullable) — 1600px wide
- `processing_status` (CharField, choices: pending, processing, completed, failed; default: pending) — tracks async image pipeline
- `tags` (ManyToManyField → AssetTag, blank=True)
- `uploaded_by` (ForeignKey → User)
- `usage_count` (IntegerField, default: 0) — track references
- `created_at` (DateTimeField, auto_now_add)

Note: On upload, original file is saved immediately. A Celery task then generates WebP + thumbnail/medium/large variants. `processing_status` tracks progress. Frontend uses `file_webp` (with `file` as fallback) for optimal performance.

**`AssetTag`** (media organization — simple lookup, no publishing workflow)

- `name` (CharField, unique)
- `slug` (SlugField, unique)

**`ProductImage`** (multi-image galleries per product, per the Visual Product Gallery System)

- `product` (ForeignKey → Product, cascade)
- `asset` (ForeignKey → MediaAsset, PROTECT) — links to centralized media library
- `image_type` (CharField, choices: hero, context, detail, workflow, config)
- `alt_text` (CharField) — can override MediaAsset.alt_text for product-specific context
- `caption` (CharField, optional)
- `order` (IntegerField, default: 0)
- `is_active` (BooleanField, default: True)
- `created_at` (DateTimeField, auto_now_add)

Note: Supports the 5-layer visual system — Hero, Context, Detail, Workflow, Configuration — with multiple images per layer (e.g., 3 context images for a scanner). References `MediaAsset` instead of duplicating file storage, enabling centralized search, tagging, and usage tracking.

#### Site-Wide Models

**`SiteSettings`** (singleton — no publishing workflow needed)

- `currency_rates` (JSONField) — {USD: 1, UGX: 3700, KES: 130}
- `company_phone`, `company_email`, `company_address` (CharFields)
- `social_links` (JSONField) — {linkedin, twitter, etc.}
- `default_og_image` (ForeignKey → MediaAsset, nullable) — fallback social share image
- `google_analytics_id` (CharField, optional) — GA4 measurement ID
- `robots_txt_extra` (TextField, optional) — additional disallow rules
- `organization_schema` (JSONField, optional) — Schema.org Organization data
- `updated_by` (ForeignKey → User, nullable)
- `updated_at` (DateTimeField, auto_now)

Singleton enforcement: Custom `save()` method ensures only one instance exists (`self.__class__.objects.exclude(pk=self.pk).delete()` before save). Custom manager with `get()` shortcut that auto-creates if missing.

**`PageMeta`** (one per route — simple lookup, no publishing workflow)

- `route` (CharField, unique) — e.g. "/", "/arcplus", "/services"
- `title` (CharField, max_length=60) — SEO title (validated ≤ 60 chars)
- `description` (TextField, max_length=160) — meta description (validated ≤ 160 chars)
- `og_image` (ForeignKey → MediaAsset, nullable) — validated ≥ 1200×630px on save
- `canonical_url` (CharField, optional) — override canonical for duplicate content
- `is_indexed` (BooleanField, default: True) — set false for draft/staging pages
- `structured_data` (JSONField, optional) — Schema.org JSON-LD per page (Product, FAQ, etc.)
- `hreflang_alternates` (JSONField, optional) — language alternates for future localization
- `updated_at` (DateTimeField, auto_now)

**`HeroSection`** (one per page, inherits `PublishableMixin`)

- `page` (CharField, unique) — "home", "scanners", "tags", etc.
- `headline` (CharField)
- `subheadline` (TextField)
- `cta_primary_text`, `cta_primary_link` (CharFields)
- `cta_secondary_text`, `cta_secondary_link` (CharFields, optional)
- `background_image` (ForeignKey → MediaAsset, nullable)
- `variant` (CharField, choices: overlay, split; default: overlay) — maps to existing `HeroSection` pattern component variants
- `eyebrow` (CharField, optional) — small text above headline (supported by pattern component)
- `badges` (JSONField, optional) — list of {text, variant} for badge pills

Note: One hero per page enforced by unique constraint on `page`. No `order` field needed. No separate `is_active` — use `status` from `PublishableMixin`. Serializer maps directly to `src/components/patterns/HeroSection.tsx` props.

**`PageBlock`** (flexible content blocks, multiple per page, inherits `PublishableMixin`)

- `page` (CharField) — "home", "scanners", etc.
- `block_type` (CharField, choices — see mapping below)
- `title` (CharField, optional)
- `body` (TextField, optional)
- `image` (ForeignKey → MediaAsset, nullable)
- `video_url` (CharField, optional) — YouTube/Vimeo embed URL
- `icon` (CharField, optional) — Lucide icon name
- `link_url`, `link_text` (CharFields, optional)
- `data` (JSONField, optional) — flexible extra fields per block_type
- `order` (IntegerField)

Block type → frontend pattern component mapping:

| `block_type` | Renders with | `data` JSONField schema |
|---|---|---|
| `hero` | `src/components/patterns/HeroSection.tsx` | `{variant, eyebrow, badges[], ctas[]}` |
| `feature_grid` | `src/components/patterns/FeatureGrid.tsx` | `{columns, variant, items: [{icon, eyebrow, title, description, badge}]}` |
| `guided_path` | `src/components/patterns/GuidedPathSelector.tsx` | `{paths: [{href, icon, title, description, ctaLabel}]}` |
| `workflow` | `src/components/patterns/WorkflowVisualizer.tsx` | `{steps: [{label, description}]}` |
| `pricing` | `src/components/patterns/PricingTable.tsx` | `{plans_ref: "arcplus"}` (references PricingPlan records) |
| `text` | Prose block (new simple component) | — |
| `cta_banner` | CTA banner (new simple component) | `{variant}` |
| `stats_row` | Stats display (new simple component) | `{stats: [{value, label, icon}]}` |
| `image_text` | Image + text side-by-side | `{layout: "image-left" \| "image-right"}` |
| `video` | Video embed | — |

**`NavigationItem`** (simple lookup — no publishing workflow)

- `label` (CharField)
- `url` (CharField)
- `parent` (ForeignKey to self, nullable) — for dropdowns
- `location` (CharField, choices: header, footer)
- `column` (CharField, optional) — footer column grouping (e.g., "Platform", "Resources")
- `order` (IntegerField)
- `is_active` (BooleanField, default: True)

Note: Navigation items are either active or not — no draft/review/publish cycle needed. Dropdown children use `parent` FK. Header mega-menus for Scanners/Tags continue to fetch products dynamically via existing `/api/nav-products` endpoint.

**`ServiceOffering`** (replaces hardcoded service cards, inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `icon` (CharField) — Lucide icon name
- `short_description` (TextField)
- `problem` (TextField)
- `process` (TextField)
- `deliverables` (JSONField) — list of strings
- `result` (TextField)
- `image` (ForeignKey → MediaAsset, nullable)
- `order` (IntegerField)

Note: `ServiceOffering` is a marketing content model, independent of `ServiceRequest.service_type` backend choices (asset_register, verification, disposal, training_outsource, full_outsource). The frontend services page currently shows 6 different service offerings (PAV, Asset Register Construction, Lifecycle Consulting, Hardware Deployment, Managed Field Teams, Warehouse Optimization) which don't map 1:1 to the 5 backend intake types. This model captures the marketing presentation; `ServiceRequest.service_type` remains the intake categorization.

**`ArcplusModule`** (inherits `PublishableMixin`)

- `name` (CharField)
- `slug` (SlugField, unique)
- `tagline` (CharField)
- `description` (TextField)
- `icon` (CharField) — Lucide icon name
- `features` (JSONField) — list of feature strings
- `image` (ForeignKey → MediaAsset, nullable)
- `order` (IntegerField)

**`PricingPlan`** (inherits `PublishableMixin`)

- `name` (CharField) — Starter, Growth, etc.
- `slug` (SlugField, unique)
- `tagline` (CharField)
- `asset_range` (CharField) — "Up to 1,000", "1,001–5,000", etc.
- `price_usd` (DecimalField)
- `price_ugx` (DecimalField, nullable)
- `price_kes` (DecimalField, nullable)
- `price_monthly_usd` (DecimalField, nullable) — for monthly billing display
- `billing_period` (CharField) — "year", "month"
- `is_recommended` (BooleanField)
- `cta_text` (CharField)
- `cta_link` (CharField)
- `order` (IntegerField)

**`PlanFeature`** (simple lookup — no publishing workflow)

- `name` (CharField)
- `category` (CharField, optional) — grouping for feature matrix sections
- `order` (IntegerField)

**`PlanFeatureValue`** (through table)

- `plan` (ForeignKey → PricingPlan)
- `feature` (ForeignKey → PlanFeature)
- `value` (CharField) — "✓", "✗", "5 users", "Unlimited", etc.
- `is_included` (BooleanField, default: True) — for simple check/cross rendering

**`SupportTier`** (inherits `PublishableMixin`)

- `name` (CharField) — Starter, Growth, Professional, Enterprise
- `slug` (SlugField, unique)
- `plan` (ForeignKey → PricingPlan, nullable) — links to corresponding pricing plan
- `order` (IntegerField)

**`SupportFeature`** (simple lookup — no publishing workflow)

- `name` (CharField) — "First Response Time", "Support Channels", etc.
- `order` (IntegerField)

**`SupportFeatureValue`** (through table)

- `tier` (ForeignKey → SupportTier)
- `feature` (ForeignKey → SupportFeature)
- `value` (CharField) — "< 4 hours", "Email + Chat", etc.

**`CaseStudy`** (inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `client_name` (CharField)
- `industry` (CharField)
- `country` (CharField, optional)
- `challenge` (TextField)
- `solution` (TextField)
- `results` (JSONField) — [{metric, value, label}]
- `quote` (TextField, optional)
- `quote_author` (CharField, optional)
- `quote_role` (CharField, optional) — author's title/role
- `image` (ForeignKey → MediaAsset, nullable)
- `order` (IntegerField)

**Files:** `backend/apps/cms/models.py`, `backend/apps/cms/mixins.py`, `backend/apps/cms/admin.py`, `backend/apps/cms/serializers.py`, `backend/apps/cms/urls.py`, `backend/apps/cms/views.py`, `backend/apps/cms/signals.py`, migrations

### Step 3: CMS API Endpoints (public, read-only)

All `AllowAny` permission, cached via Django cache framework (Redis backend). Only returns `status=published` records for publishable models.

Cache strategy:

- Redis cache backend (already available via `docker-compose.yml` Redis service)
- Cache key pattern: `cms:{model}:{filter_params}` (e.g., `cms:hero:page=home`)
- Default TTL: 600 seconds (10 minutes)
- Cache invalidation: Automatic on any admin write operation (save/delete/publish) via `post_save`/`post_delete` signal that clears relevant cache keys
- HTTP response headers: `Cache-Control: public, max-age=600, s-maxage=3600` on all public CMS endpoints (enables Cloudflare edge caching per deployment docs)

| Endpoint | Returns |
|----------|---------|
| `GET /api/v1/cms/settings/` | SiteSettings singleton |
| `GET /api/v1/cms/meta/?route=/arcplus` | PageMeta for route (includes structured data, canonical) |
| `GET /api/v1/cms/hero/?page=home` | HeroSection for page |
| `GET /api/v1/cms/blocks/?page=home` | PageBlocks for page, ordered |
| `GET /api/v1/cms/navigation/?location=header` | NavigationItems tree |
| `GET /api/v1/cms/services/` | ServiceOfferings ordered |
| `GET /api/v1/cms/arcplus/modules/` | ArcplusModules ordered |
| `GET /api/v1/cms/arcplus/pricing/` | PricingPlans with features via PlanFeatureValue |
| `GET /api/v1/cms/support-tiers/` | SupportTiers with features via SupportFeatureValue |
| `GET /api/v1/cms/case-studies/` | CaseStudies ordered |
| `GET /api/v1/cms/case-studies/<slug>/` | Single CaseStudy detail |
| `GET /api/v1/cms/docs/` | DocumentationPages ordered, tree structure |
| `GET /api/v1/cms/docs/<slug>/` | Single DocumentationPage |
| `GET /api/v1/cms/api-reference/` | APIEndpointGroups ordered |
| `GET /api/v1/products/<slug>/gallery/` | ProductImage set for product, ordered by type+order |

Draft preview endpoint (authenticated, for admin preview):
| `GET /api/v1/cms/preview/<model>/?page=home&token=<preview_token>` | Returns content regardless of status (for Draft Mode) |

### Step 4: CMS Admin API Endpoints (admin-only, CRUD)

Following existing pattern in `backend/apps/accounts/admin_views.py` + `admin_urls.py`:

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/v1/admin/cms/settings/` | GET, PATCH | Edit site settings |
| `/api/v1/admin/cms/meta/` | GET, POST | List/create page metadata |
| `/api/v1/admin/cms/meta/<id>/` | PATCH, DELETE | Update/delete page metadata |
| `/api/v1/admin/cms/hero/` | GET, POST | List/create hero sections |
| `/api/v1/admin/cms/hero/<id>/` | PATCH, DELETE | Update/delete hero (PATCH requires `version` field) |
| `/api/v1/admin/cms/hero/<id>/transition/` | POST | Transition status (body: `{action: "submit" \| "approve" \| "publish" \| "archive" \| "unpublish"}`) |
| `/api/v1/admin/cms/blocks/` | GET, POST | List/create page blocks |
| `/api/v1/admin/cms/blocks/<id>/` | PATCH, DELETE | Update/delete block |
| `/api/v1/admin/cms/blocks/<id>/transition/` | POST | Transition status |
| `/api/v1/admin/cms/navigation/` | GET, POST | List/create nav items |
| `/api/v1/admin/cms/navigation/<id>/` | PATCH, DELETE | Update/delete nav item |
| `/api/v1/admin/cms/navigation/reorder/` | POST | Bulk reorder (body: `[{id, order}]`) |
| `/api/v1/admin/cms/media/` | GET, POST | List/upload media assets (POST accepts multipart form) |
| `/api/v1/admin/cms/media/<id>/` | GET, PATCH, DELETE | Get detail/update metadata/delete asset (DELETE warns if usage_count > 0) |
| `/api/v1/admin/cms/media/tags/` | GET, POST | List/create asset tags |
| `/api/v1/admin/cms/products/<id>/gallery/` | GET, POST | List/add product images |
| `/api/v1/admin/cms/products/<id>/gallery/<id>/` | PATCH, DELETE | Update/delete product image |
| `/api/v1/admin/cms/products/<id>/gallery/reorder/` | POST | Bulk reorder product images |
| `/api/v1/admin/cms/revisions/?content_type=<type>&object_id=<id>` | GET | List revisions for a content object |
| `/api/v1/admin/cms/revisions/<id>/rollback/` | POST | Rollback content to a specific revision |
| (same CRUD + transition pattern for services, modules, pricing, plans, case studies, support-tiers, docs, api-reference) | | |

All mutations write to `AuditLog` following existing `log_admin_action()` pattern. Status transitions validate the workflow (e.g., only `approved` content can be published). PATCH endpoints validate `version` for optimistic locking on all `PublishableMixin` models.

On publish: After transitioning content to `status=published`, the view triggers cache invalidation (clear relevant Redis keys) AND sends a POST request to the Next.js revalidation API route (`/api/revalidate`) with the relevant ISR tags to bust the static page cache. This ensures published content appears on the frontend within seconds, not after the ISR TTL expires.

### Step 5: Scheduled Publish Celery Task

Celery Beat periodic task `publish_scheduled_content`:

- Runs every 60 seconds (configurable via `django-celery-beat`)
- Queries all `PublishableMixin` models where `status=approved` AND `scheduled_publish_at <= now()`
- Transitions each to `status=published`, sets `published_at=now()`
- Triggers cache invalidation + Next.js ISR revalidation for each published item
- Logs each auto-publish to `AuditLog` with `action=cms_scheduled_publish`

Follows existing Celery pattern in `backend/apps/subscriptions/tasks.py` (`check_trial_expiry`).

**Files:** `backend/apps/cms/tasks.py`, register in `celery.py` autodiscover

### Step 6: Image Processing Pipeline

Celery task `process_media_asset`:

- Triggered on `MediaAsset` creation (via `post_save` signal) when `asset_type=image`
- Sets `processing_status=processing`
- Using Pillow:
  1. Generate WebP version of original → save to `file_webp`
  2. Generate thumbnail (200px width, maintain aspect ratio) → save to `file_thumbnail`
  3. Generate medium (800px width) → save to `file_medium`
  4. Generate large (1600px width) → save to `file_large`
  5. Extract and store `width`, `height` from original
- Sets `processing_status=completed` on success, `processing_status=failed` on error
- Idempotent: can be retried safely

**Files:** `backend/apps/cms/tasks.py`, `backend/apps/cms/signals.py`

### Step 7: Django Admin Registration

Register all CMS models in `backend/apps/cms/admin.py` with:

- Inline editors for PlanFeatureValues inside PricingPlan
- Inline editors for SupportFeatureValues inside SupportTier
- Inline editors for child NavigationItems
- Inline editors for ProductImages inside Product (via custom admin for Product)
- Image preview in list view (thumbnail from MediaAsset)
- Ordering by `order` field
- Filtering by `page`, `location`, `status`, `asset_type`
- Status color indicators (draft=grey, review=yellow, approved=blue, published=green, archived=red)
- Bulk actions: publish selected, archive selected
- Media library: searchable by tag, filterable by asset_type, processing_status, usage_count display

### Step 8: Data Migration — Seed Current Content

Management command `backend/apps/cms/management/commands/seed_cms_content.py`:

- Extract all hardcoded content from frontend `.tsx` files into CMS records
- Content to seed:
  - Homepage: hero section, product cards (PageBlocks), decision cards (guided_path block), trust stats (stats_row block)
  - Arcplus: 8 modules, 4 pricing plans, 13 plan features with values, lifecycle workflow block
  - Services: 6 service offerings (PAV, Asset Register, Lifecycle Consulting, Hardware Deployment, Managed Field Teams, Warehouse Optimization)
  - Navigation: header links (Arcplus, Scanners, Tags, Services, Training) + footer links (Platform, Resources columns) + contact info
  - Case studies: 3 studies (Lamu County, Pan African Airways, Nairobi Metropolitan Services)
  - Support tiers: 4 tiers with 7+ features
  - Docs: 5 sections (Getting Started, Asset Fields, CSV Import, RFID Scanning, Depreciation)
  - API Reference: 5 endpoint groups
  - Page metadata: SEO data for all 14+ routes in sitemap
  - Site settings: currency rates, contact info, social links
- All content created with `status=published`
- Ensures zero visual change on first deploy

**Files:** `backend/apps/cms/management/commands/seed_cms_content.py`

### Step 9: Content Validation Rules

Custom validator mixin applied on status transition to `published`:

- `PageMeta.title`: max 60 characters (SEO best practice)
- `PageMeta.description`: max 160 characters
- `PageMeta.og_image`: if set, referenced MediaAsset must be ≥ 1200×630px
- `HeroSection`: `headline`, `cta_primary_text`, `cta_primary_link` required
- `ServiceOffering`: `problem`, `process`, `deliverables`, `result` all required
- `CaseStudy`: `challenge`, `solution`, `results` required
- `PricingPlan`: `price_usd` > 0 (unless Enterprise/custom)

Validation errors returned as structured response on `/transition/` endpoint, preventing publish of incomplete content.

**Files:** `backend/apps/cms/validators.py`

---

## Phase 2: Frontend — Replace Hardcoded Content with Server-Side Rendering

### Architecture Decision: ISR for Marketing, TanStack Query for Admin

Marketing pages (`/`, `/arcplus`, `/services`, `/scanners`, `/tags`, `/resources/*`, `/compare`) are SEO-critical. These must be server-rendered for Google indexing. Using client-side TanStack Query hooks would mean crawlers see empty shells until JavaScript hydrates.

**Server-side approach (marketing pages):**

- `src/lib/api/cms-server.ts` — Server-side fetch functions using Next.js `fetch()` with `next: { tags: ['cms-home'], revalidate: 600 }` for ISR
- Data fetched in `page.tsx` (server component) → passed as props to `*Client.tsx` (client component)
- Pages are statically generated at build time, revalidated every 10 minutes OR on-demand when content is published

**Client-side approach (admin portal only):**

- `src/lib/api/cms.ts` — Client-side API functions (axios, following existing `src/lib/api/admin.ts` pattern)
- `src/lib/hooks/useCMSAdmin.ts` — TanStack Query hooks for admin CRUD operations only
- Used exclusively in `src/app/admin-portal/cms/` pages

### Step 10: Server-Side CMS Data Layer

*Parallel with Step 8*

Create `src/lib/api/cms-server.ts` with server-side fetch functions:

- `fetchHeroSection(page: string)` — returns hero data + ISR tag `cms-hero-{page}`
- `fetchPageBlocks(page: string)` — returns ordered blocks + ISR tag `cms-blocks-{page}`
- `fetchSiteSettings()` — returns settings + ISR tag `cms-settings`
- `fetchPageMeta(route: string)` — returns SEO data + ISR tag `cms-meta`
- `fetchNavigation(location: string)` — returns nav tree + ISR tag `cms-nav-{location}`
- `fetchServiceOfferings()` — returns services + ISR tag `cms-services`
- `fetchArcplusModules()` — returns modules + ISR tag `cms-arcplus-modules`
- `fetchPricingPlans()` — returns plans with features + ISR tag `cms-arcplus-pricing`
- `fetchSupportTiers()` — returns tiers with features + ISR tag `cms-support`
- `fetchCaseStudies()` — returns case studies + ISR tag `cms-case-studies`
- `fetchDocumentationPages()` — returns docs tree + ISR tag `cms-docs`
- `fetchAPIEndpointGroups()` — returns API reference + ISR tag `cms-api-reference`

Each function: calls Django CMS API → returns typed data → uses `next: { tags: [...], revalidate: 600 }` for ISR with tag-based on-demand revalidation.

Add CMS TypeScript types to `src/types/cms.ts`:

- `HeroSectionData`, `PageBlockData`, `SiteSettingsData`, `PageMetaData`, `NavigationItemData`, `ServiceOfferingData`, `ArcplusModuleData`, `PricingPlanData`, `PlanFeatureData`, `SupportTierData`, `CaseStudyData`, `DocumentationPageData`, `APIEndpointGroupData`

**Files:** `src/lib/api/cms-server.ts`, `src/types/cms.ts`

### Step 11: ISR Revalidation API Route

*Parallel with Step 10*

Create `src/app/api/revalidate/route.ts`:

- `POST /api/revalidate` — accepts `{ secret: string, tags: string[] }`
- Validates `secret` against `REVALIDATION_SECRET` env var (shared with Django backend)
- Calls `revalidateTag(tag)` for each tag
- Returns `{ revalidated: true, tags: [...] }`
- Called by Django admin API on every publish/unpublish/delete action

**Files:** `src/app/api/revalidate/route.ts`

### Step 12: CMS Admin API Client & Hooks

*Parallel with Steps 10–11*

For admin portal CMS management pages only:

- `src/lib/api/cms.ts` — Client-side CRUD functions for all admin CMS endpoints (following `src/lib/api/admin.ts` pattern)
- `src/lib/hooks/useCMSAdmin.ts` — TanStack Query mutations + queries for admin portal:
  - `useAdminHeroSections()`, `useCreateHero()`, `useUpdateHero()`, `useTransitionHero()`
  - `useAdminPageBlocks()`, `useCreateBlock()`, `useUpdateBlock()`, `useTransitionBlock()`
  - `useAdminMedia()`, `useUploadMedia()`, `useUpdateMedia()`, `useDeleteMedia()`
  - `useAdminNavigation()`, `useReorderNavigation()`
  - `useAdminServices()`, `useAdminModules()`, `useAdminPricing()`
  - `useAdminCaseStudies()`, `useAdminSupportTiers()`
  - `useAdminRevisions(contentType, objectId)`, `useRollback()`
  - etc.

**Files:** `src/lib/api/cms.ts`, `src/lib/hooks/useCMSAdmin.ts`

### Step 13: Replace Landing Page Content

*Depends on Steps 8, 10*

- `src/app/page.tsx` (server component):
  - Fetch `PageMeta` for "/" → generate dynamic `metadata` export
  - Fetch hero section, page blocks, site settings server-side
  - Pass as props to `HomePageClient`
- `src/app/HomePageClient.tsx` (client component):
  - Replace hardcoded hero ("Control Every Asset") with `HeroSection` pattern component fed by CMS hero data
  - Replace 4 product gallery cards with `PageBlock` data (type: `feature_grid`)
  - Replace 4 decision cards with `PageBlock` data (type: `guided_path`) → renders via existing `GuidedPathSelector` pattern
  - Replace trust stats (5M+ Assets, 42 Countries, 99.9% Accuracy) with `PageBlock` data (type: `stats_row`)
  - Replace industries list with `PageBlock` data

### Step 14: Replace Arcplus Page Content

*Depends on Steps 8, 10*

- `src/app/arcplus/page.tsx`:
  - Fetch modules, pricing plans, plan features, hero, page meta server-side
  - Pass as props to `ArcplusPageClient`
- `src/app/arcplus/ArcplusPageClient.tsx`:
  - Replace 8 hardcoded module objects with CMS `ArcplusModule` data
  - Replace lifecycle steps `WorkflowVisualizer` data with `PageBlock` (type: `workflow`)
  - Replace 4 pricing plan cards with CMS `PricingPlan` data → feed into existing `PricingTable` pattern component
  - Replace 13-row feature matrix with CMS `PlanFeature`/`PlanFeatureValue` data
  - Currency selector continues to work — rates now from `SiteSettings.currency_rates`

### Step 15: Replace Services Page Content

*Depends on Steps 8, 10*

- `src/app/services/page.tsx`: Fetch service offerings + page meta server-side
- `src/app/services/ServicesPageClient.tsx`: Replace 6 hardcoded service card objects with CMS `ServiceOffering` data. Maintain existing 4-section card layout (Problem → Process → Deliverables → Result).

### Step 16: Replace Navigation Content

*Depends on Steps 8, 10*

- `src/components/layout/Header.tsx`: Fetch navigation server-side in layout, replace hardcoded desktop nav links + mobile menu with CMS `NavigationItem` data. Product mega-menu dropdowns continue using existing `/api/nav-products` endpoint for dynamic product data.
- `src/components/layout/Footer.tsx`: Replace hardcoded links, contact info (Boston address, phone, email), and column structure with CMS `NavigationItem` (location=footer) + `SiteSettings` data.
- `src/app/layout.tsx`: Fetch navigation + site settings in root layout server component, pass to Header/Footer.

### Step 17: Replace Resources Pages

*Depends on Steps 8, 10*

- Case studies (`/resources/case-studies`): Replace 3 hardcoded case studies (Lamu County, Pan African Airways, Nairobi Metropolitan Services) with `fetchCaseStudies()`
- Support (`/resources/support`): Replace 4-tier comparison table with `fetchSupportTiers()`
- Docs (`/resources/docs`): Replace 5 hardcoded sections with `fetchDocumentationPages()`
- API Reference (`/resources/api-reference`): Replace 5 endpoint groups with `fetchAPIEndpointGroups()`

### Step 18: Replace Compare Arcplus Tab

*Depends on Step 14*

- `src/app/compare/ComparePageClient.tsx`:
  - Hardware Scanner/Tags tabs are already API-driven via `ProductCompareTable` — no changes needed
  - Replace only the `ArcplusCompareTable` hardcoded software tier data with CMS `PricingPlan` + `PlanFeatureValue` data (reuse same fetch as Arcplus page)

### Step 19: Replace Scanner/Tags Page Heroes

*Depends on Steps 8, 10*

- `src/app/scanners/page.tsx` + `ScannersPageClient.tsx`: Replace hardcoded hero section with `fetchHeroSection("scanners")`. Product catalog data is already API-driven; only marketing hero copy and page blocks need CMS.
- `src/app/tags/page.tsx` + `TagsPageClient.tsx`: Same pattern with `fetchHeroSection("tags")`.

### Step 20: Currency Rates from CMS

- Replace hardcoded `{ USD: 1, UGX: 3700, KES: 130 }` in `src/components/patterns/PricingTable.tsx` with `SiteSettings.currency_rates` (passed as server-side prop)
- Update training page `TrainingPageClient.tsx` currency selector to use `SiteSettings.currency_rates`
- Ensure all components referencing hardcoded rates receive rates from CMS data

---

## Phase 3: Admin Portal CMS UI

### Step 21: CMS Management Section in Admin Portal

*Depends on Steps 4, 12*

Add CMS section to `/admin-portal/` with pages:

- **Pages & Content** — List pages, edit hero sections and page blocks per page. Status badges (draft=grey, review=yellow, approved=blue, published=green, archived=red). Version number display. Block type selection with pattern component preview.
- **Navigation** — Drag-to-reorder header/footer links. Parent/child nesting for dropdowns.
- **Services** — CRUD service offerings with publishing workflow
- **Arcplus** — Edit modules, pricing plans, feature matrix with publishing workflow
- **Support Tiers** — Edit support tier comparison table
- **Case Studies** — CRUD case studies with publishing workflow
- **Docs & API Reference** — Edit documentation pages (tree structure) and API endpoint groups
- **Site Settings** — Company info, currency rates, social links, analytics config, structured data
- **SEO / Page Meta** — Edit title, description, OG image, structured data per route. Inline validation (title ≤ 60, description ≤ 160).
- **Media Library** — Browse, search, tag, upload, and organize all media assets. Grid/list view toggle. Filter by type, tag, processing status. Usage tracking (warn before deleting assets in use). Bulk operations (tag, delete). Image preview with thumbnail/medium/large variants.
- **Product Galleries** — Manage 5-layer image sequences per product (hero, context, detail, workflow, config). Drag-to-reorder within each layer. Image type assignment. Links to MediaAsset library.

Follow existing admin portal patterns in `src/app/admin-portal/` (DataTable, ExpandPanel, status dropdowns, export CSV, hooks integration).

**Files:** New route group `src/app/admin-portal/cms/` with sub-pages: `page.tsx`, `content/`, `navigation/`, `services/`, `arcplus/`, `support/`, `case-studies/`, `docs/`, `settings/`, `seo/`, `media/`, `galleries/`

### Step 22: Image Upload Component

- Build reusable `<MediaUploader />` component for admin portal
- Upload to Django media endpoint (`POST /api/v1/admin/cms/media/`), return MediaAsset data
- Show preview with processing_status indicator (pending → processing → completed)
- Support drag-and-drop + file picker
- Display file size, dimensions, WebP/thumbnail availability
- Inline alt text and caption editing
- Reusable across all admin CMS pages that reference MediaAsset

### Step 23: Publishing Workflow UI

- Status badge on every content item (Draft → Review → Approved → Published → Archived)
- "Submit for Review" button for editors (transition: draft → review)
- "Approve" / "Reject" actions for reviewers (transition: review → approved or review → draft)
- "Publish Now" / "Schedule Publish" for publishers (transition: approved → published, or set scheduled_publish_at)
- "Unpublish" button (transition: published → draft)
- Version number display with conflict detection (if version mismatch on save, show warning)
- Activity log per content item — fetched from `ContentRevision` records (who changed what, when, what version)
- "Rollback to Version N" button in revision history

### Step 24: Content Preview (Next.js Draft Mode)

- "Preview" button in admin portal activates Next.js Draft Mode
- Clicking Preview: opens new tab to the relevant page URL with `?preview=true` query param
- Draft Mode API route (`src/app/api/draft/route.ts`):
  - `GET /api/draft?secret=<token>&slug=<page>` — sets draft mode cookies, redirects to page
  - `GET /api/draft/disable` — clears draft mode cookies
- When Draft Mode is active, `page.tsx` server components call CMS preview endpoint (returns content regardless of status) instead of the public endpoint
- Preview banner component shown at top of page in draft mode: "You are previewing draft content — [Exit Preview]"

**Files:** `src/app/api/draft/route.ts`, preview banner component

---

## Phase 4: Extended Content Types

### Step 25: Blog & Articles System

*Parallel with Phase 3*

New models in `backend/apps/cms/`:

**`BlogCategory`** (simple lookup — no publishing workflow)

- `name` (CharField)
- `slug` (SlugField, unique)
- `description` (TextField, optional)
- `order` (IntegerField)

**`BlogPost`** (inherits `PublishableMixin`)

- `title` (CharField)
- `slug` (SlugField, unique)
- `excerpt` (TextField) — short preview text
- `body` (TextField) — full article content (Markdown or HTML)
- `featured_image` (ForeignKey → MediaAsset, nullable)
- `category` (ForeignKey → BlogCategory)
- `author_name` (CharField)
- `author_avatar` (ForeignKey → MediaAsset, nullable)
- `seo_keywords` (CharField, optional) — comma-separated
- `reading_time_minutes` (IntegerField, optional)
- `is_featured` (BooleanField, default: False)
- `order` (IntegerField)

API endpoints:

- `GET /api/v1/cms/blog/` — published posts (filterable by `?category=`, paginated)
- `GET /api/v1/cms/blog/<slug>/` — single post detail
- `GET /api/v1/cms/blog/categories/` — all categories
- Admin CRUD + transition endpoints following existing pattern

Frontend:

- New route `/resources/blog/` (list) and `/resources/blog/[slug]` (detail)
- Server-side rendering with ISR for SEO
- Add blog posts to `src/app/sitemap.ts` dynamic generation (fetch published post slugs at build time)
- Add to sitemap.ts: `GET /api/v1/cms/blog/` → map to `/resources/blog/[slug]` entries

**Files:** `src/app/resources/blog/page.tsx`, `src/app/resources/blog/[slug]/page.tsx`, admin portal blog management page

### Step 26: Email Template Management

*Depends on Phase 1*

**`EmailTemplate`** (inherits `PublishableMixin`)

- `name` (CharField) — "Trial Welcome", "Quote Received"
- `slug` (SlugField, unique) — matches trigger key in notification service
- `subject` (CharField)
- `body_html` (TextField)
- `body_text` (TextField) — plain text fallback
- `trigger_type` (CharField, choices: trial_welcome, trial_reminder_7d, trial_reminder_3d, trial_expired, quote_received, quote_received_admin, quote_response, training_confirmation, service_request, payment_receipt)
- `available_variables` (JSONField) — ["{{user.full_name}}", "{{trial.expiry_date}}", etc.]
- `preview_data` (JSONField) — sample data for admin preview

Integration:

- Modify `backend/apps/notifications/service.py` to load templates from DB instead of filesystem Jinja2 templates
- Uses existing Resend API sending pattern (`_send()` function) — only the template source changes
- Fallback: if no DB template found for a trigger, use existing hardcoded template in `notifications/templates/` (backward compatible)
- Template rendering: Python `string.Template` or Jinja2 for variable substitution

Admin UI:

- Template editor with variable picker sidebar (populated from `available_variables`)
- Preview pane (render with `preview_data`)
- Send test email button (via Resend to admin's own email)
- Version history via ContentRevision

**Files:** `backend/apps/cms/models.py` (EmailTemplate), `backend/apps/notifications/service.py` (modify to check DB first), admin portal email management page

### Step 27: Testimonials & Social Proof

**`Testimonial`** (inherits `PublishableMixin`)

- `quote` (TextField)
- `author_name` (CharField)
- `author_role` (CharField, optional) — "Asset Manager"
- `company_name` (CharField)
- `industry` (CharField, optional)
- `avatar` (ForeignKey → MediaAsset, nullable)
- `rating` (IntegerField, optional) — 1-5 stars
- `placement` (CharField, choices: homepage, arcplus, services, global) — where to show
- `order` (IntegerField)

API endpoints:

- `GET /api/v1/cms/testimonials/?placement=homepage` — filtered by placement
- Admin CRUD + transition endpoints

Frontend:

- New reusable `<TestimonialCarousel />` component in `src/components/patterns/`
- Integrate into homepage, Arcplus, and services pages (server-side fetch, pass as props)

### Step 28: Regional Content Variants

*Depends on Phase 2 completion*

**`RegionalVariant`** (generic override system)

- `content_type` (ForeignKey → Django ContentType)
- `object_id` (CharField) — PK of the content object
- `region` (CharField, choices: ug, ke, global)
- `language` (CharField, choices: en, sw; default: en)
- `title_override` (CharField, nullable)
- `body_override` (TextField, nullable)
- `image_override` (ForeignKey → MediaAsset, nullable)
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

- `backend/abs_backend/settings/base.py` — Add `cms` to INSTALLED_APPS, configure MEDIA_ROOT/URL, add Django cache framework config (Redis backend)
- `backend/abs_backend/urls.py` — Add CMS URL patterns + media serving in dev
- `backend/requirements.txt` — Add `Pillow` (ImageField), `django-storages` (optional for future cloud migration)
- `backend/apps/notifications/service.py` — Load email templates from DB with filesystem fallback (Phase 4)
- `docker-compose.yml` — Add `media_data` volume mount for backend service

### Backend (create)

- `backend/apps/cms/__init__.py`
- `backend/apps/cms/apps.py`
- `backend/apps/cms/models.py` — All content models
- `backend/apps/cms/mixins.py` — `PublishableMixin` abstract model
- `backend/apps/cms/signals.py` — ContentRevision auto-creation + MediaAsset image processing trigger + cache invalidation
- `backend/apps/cms/tasks.py` — `publish_scheduled_content` + `process_media_asset` Celery tasks
- `backend/apps/cms/validators.py` — Content validation rules for publish transitions
- `backend/apps/cms/admin.py` — Django Admin registration
- `backend/apps/cms/serializers.py` — DRF serializers (public read + admin write)
- `backend/apps/cms/urls.py` — Public CMS API routes
- `backend/apps/cms/admin_urls.py` — Admin CMS API routes (following accounts pattern)
- `backend/apps/cms/views.py` — Public CMS API views
- `backend/apps/cms/admin_views.py` — Admin CMS API views (following accounts pattern)
- `backend/apps/cms/cache.py` — Cache key helpers + invalidation utilities
- `backend/apps/cms/management/commands/seed_cms_content.py` — Data seed
- `backend/apps/cms/migrations/` — Auto-generated

### Frontend (modify)

- `src/app/layout.tsx` — Fetch navigation + site settings server-side, pass to Header/Footer
- `src/app/page.tsx` + `src/app/HomePageClient.tsx` — Replace hardcoded content with server-fetched CMS data
- `src/app/arcplus/page.tsx` + `ArcplusPageClient.tsx` — Replace modules, pricing, features
- `src/app/services/page.tsx` + `ServicesPageClient.tsx` — Replace service cards
- `src/app/scanners/page.tsx` + `ScannersPageClient.tsx` — Replace hero section
- `src/app/tags/page.tsx` + `TagsPageClient.tsx` — Replace hero section
- `src/app/compare/ComparePageClient.tsx` — Replace only ArcplusCompareTable static data (hardware tabs already API-driven)
- `src/components/layout/Header.tsx` — CMS navigation data (keep existing product mega-menu from `/api/nav-products`)
- `src/components/layout/Footer.tsx` — CMS navigation + site settings
- `src/components/patterns/PricingTable.tsx` — Accept currency rates from CMS instead of hardcoded
- `src/app/resources/case-studies/page.tsx` — CMS case studies
- `src/app/resources/support/page.tsx` — CMS support tiers
- `src/app/resources/docs/page.tsx` — CMS documentation pages
- `src/app/resources/api-reference/page.tsx` — CMS API endpoint groups
- `src/app/training/TrainingPageClient.tsx` — Currency rates from CMS
- `src/app/sitemap.ts` — Add dynamic blog post URLs (Phase 4)
- `next.config.ts` — Add Django dev media domain to image config

### Frontend (create)

- `src/lib/api/cms-server.ts` — Server-side CMS fetch functions (ISR + tag-based revalidation)
- `src/lib/api/cms.ts` — Client-side CMS admin API functions
- `src/lib/hooks/useCMSAdmin.ts` — TanStack Query hooks for admin CMS CRUD only
- `src/types/cms.ts` — CMS TypeScript type definitions
- `src/app/api/revalidate/route.ts` — ISR on-demand revalidation endpoint
- `src/app/api/draft/route.ts` — Draft Mode enable/disable endpoint
- `src/app/admin-portal/cms/` — Admin CMS management pages (content, media library, publishing workflow, preview)
- `src/app/resources/blog/page.tsx` + `[slug]/page.tsx` — Blog list and detail pages (Phase 4)
- `src/components/patterns/TestimonialCarousel.tsx` — Reusable testimonial component (Phase 4)

---

## Verification

### Phase 1 — Backend

1. **Migration test:** `python manage.py makemigrations cms && python manage.py migrate` — no errors
2. **Singleton test:** Attempt to create two `SiteSettings` instances → only one persists
3. **Seed test:** `python manage.py seed_cms_content` — creates all records with `status=published`, verify count and content via Django admin
4. **API test:** `curl localhost:8000/api/v1/cms/hero/?page=home` returns hero data with correct fields
5. **Draft filtering:** `curl localhost:8000/api/v1/cms/hero/?page=home` does NOT return draft/review/archived content
6. **Cache test:** Hit public CMS endpoint twice → second response should be served from Redis cache (verify with `Cache-Control` headers)
7. **Optimistic lock test:** PATCH a hero with wrong `version` → returns 409 Conflict
8. **Scheduled publish test:** Set `scheduled_publish_at` to 1 minute in future on approved content → verify Celery task auto-publishes and triggers revalidation
9. **Image pipeline test:** Upload an image → verify Celery task generates WebP + thumbnail/medium/large variants, processing_status transitions pending → processing → completed
10. **Content validation test:** Attempt to publish HeroSection with empty headline → returns validation error
11. **Revision test:** Edit a hero section 3 times → verify 3 `ContentRevision` records exist with correct snapshots

### Phase 2 — Frontend

1. **Lighthouse SEO test:** Score ≥ 95 on all CMS-driven marketing pages (verifies server-side rendering works correctly — no empty shells)
2. **ISR revalidation test:** Publish content via admin API → POST to `/api/revalidate` → verify page updates within seconds (not waiting for 10-minute TTL)
3. **Visual regression:** Compare screenshots before/after for landing, arcplus, services, tags, scanners, resources pages — should be pixel-identical to current hardcoded version
4. **Pattern component mapping:** Verify each `block_type` renders correctly via its mapped pattern component (hero → HeroSection, feature_grid → FeatureGrid, etc.)
5. **Fallback test:** If CMS API is down/empty, pages should render graceful fallback (skeleton or static defaults) — no blank pages
6. **Currency rates test:** Change currency rates in SiteSettings → verify PricingTable and training page reflect new rates
7. **`npm run build`** — No TypeScript errors after all replacements

### Phase 3 — Admin Portal

1. **Admin CRUD test:** Create/edit/delete a hero section via admin portal, verify frontend reflects change after revalidation
2. **Publishing workflow test:** Create draft → submit for review → approve → publish → verify it appears on frontend
3. **Draft Mode preview test:** Create draft content → click Preview → verify draft content visible in new tab with preview banner → exit preview → verify draft NOT visible
4. **Concurrent editing test:** Two admin browser sessions edit same hero section → second save with stale version shows conflict warning
5. **Media library test:** Upload, tag, search, delete assets. Verify delete-in-use warning. Verify processing status indicators.
6. **Product gallery test:** Add 5 images (hero, context, detail, workflow, config) to a product via MediaAsset references → verify gallery renders correctly
7. **Revision rollback test:** Edit content → rollback to previous version → verify content reverts

### Phase 4 — Extended Content

1. **Blog test:** Create blog post → publish → verify renders at `/resources/blog/<slug>` with correct SEO metadata
2. **Sitemap test:** Publish blog post → verify slug appears in `/sitemap.xml`
3. **Email template test:** Edit trial welcome template in admin → send test email via Resend → verify formatting with variable substitution
4. **Email fallback test:** Delete DB template for a trigger → verify system falls back to filesystem template in `notifications/templates/`
5. **Structured data test:** Check `<script type="application/ld+json">` renders correctly on product and organization pages
6. **Load test:** Public CMS endpoints respond < 50ms p95 with Redis cache warm

---

## Decisions

- **Django-as-CMS over third-party** — Avoids new service, leverages existing stack, keeps data in one database
- **ISR + on-demand revalidation over client-side fetching** — Marketing pages are SEO-critical; server-rendering with ISR gives static-site performance + instant updates on publish. TanStack Query used only in admin portal.
- **Existing pattern components as rendering layer** — `HeroSection`, `PricingTable`, `FeatureGrid`, `GuidedPathSelector`, `WorkflowVisualizer` patterns already built and tested. CMS data flows into these components via props — no UI rebuild needed.
- **`PublishableMixin` only on editorial content** — Applied to `HeroSection`, `PageBlock`, `ServiceOffering`, `ArcplusModule`, `PricingPlan`, `SupportTier`, `CaseStudy`, `BlogPost`, `EmailTemplate`, `Testimonial`, `DocumentationPage`. NOT applied to lookup/config models (`NavigationItem`, `PlanFeature`, `SupportFeature`, `AssetTag`, `SiteSettings`, `PageMeta`, `BlogCategory`, `APIEndpointGroup`) which use simple `is_active` or are always-on.
- **No redundant `is_active` on publishable models** — `status=archived` replaces deactivation. Eliminates conflicting state (what if `is_active=False` but `status=published`?).
- **Optimistic locking via `version` field** — Enterprise requirement to prevent concurrent edit overwrites. Low implementation cost, high data integrity value.
- **`ContentRevision` auto-snapshots** — Cheap storage (JSONField), enables rollback, builds on existing `AuditLog` foundation. Not deferred — included from Phase 1.
- **`ProductImage` references `MediaAsset` via FK** — Centralizes all media in one library with search, tagging, usage tracking. Avoids scattered ImageFields with duplicated storage.
- **`PageBlock` with explicit pattern component mapping** — `block_type` choices map directly to tested frontend pattern components. `data` JSONField provides type-specific schema per block_type.
- **Singleton enforcement on `SiteSettings`** — Custom `save()` ensures exactly one instance. No `django-solo` dependency needed.
- **Async image processing via Celery** — Upload returns immediately with `processing_status=pending`. Celery task generates WebP + sizes without blocking the request. Follows existing Celery pattern.
- **Redis cache with signal-based invalidation** — Uses existing Redis service in docker-compose. Automatic cache clear on admin writes via Django signals. HTTP Cache-Control headers enable Cloudflare edge caching.
- **`ServiceOffering` independent of `ServiceRequest.service_type`** — Marketing descriptions (6 cards) don't map 1:1 to backend intake categories (5 types). Keeps content and intake concerns separate.
- **Docs & API Reference in Phase 2, not Phase 4** — Tier 2 priority content; same CMS pattern as other pages. No reason to defer.
- **ImageField + Pillow over URL strings** — Proper file upload support (existing Product model uses URL strings — migration optional)
- **`PageBlock` with JSONField flexibility** — Avoids creating a model per block type; `block_type` + `data` allows extensibility
- **Structured data via JSONField on `PageMeta`** — Flexible Schema.org support without a rigid model per schema type; admin can preview rendered JSON-LD
- **Email templates in DB with filesystem fallback** — Existing hardcoded Jinja2 templates via Resend still work if no DB record exists; gradual migration
- **Regional variants via generic ContentType** — `RegionalVariant` can override any content model without modifying each model individually
- **Seed migration over manual re-entry** — Zero-downtime content transition; current hardcoded content becomes initial CMS data with `status=published`
- **Phase 3 (Admin UI) is separate** — Django Admin serves as interim CMS UI while custom admin portal CMS pages are built
- **Phase 4 (Extended Types) is additive** — Blog, testimonials, email templates, regional variants built on the same `PublishableMixin` foundation

## Scope Boundaries

- **Included (Phases 1–3):** All marketing pages, navigation, settings, media library with image processing pipeline, product galleries, publishing workflow with optimistic locking, content revision history, structured SEO with validation, server-side rendering with ISR, on-demand revalidation, Draft Mode preview, admin CRUD with audit logging, support tiers, documentation pages, API reference
- **Included (Phase 4):** Blog/articles with sitemap integration, email template management (Resend integration), testimonials, regional content variants
- **Excluded:** Rich text / WYSIWYG editor (TextField is sufficient for now), A/B testing framework, AI content recommendations, CDN cache purging via Cloudflare API (Cache-Control headers + ISR sufficient for now)
- **Deferred:** Full localization / i18n (English + Swahili via `next-intl`), campaign-specific dynamic landing pages, partner/reseller portal content
- **Deferred:** Migrating existing Product `image_hero` etc. from CharField(URL) to ImageField (works as-is, `ProductImage` model complements it)

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
