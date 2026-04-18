"""
Seed all CMS models with the static content currently hardcoded in the
frontend .tsx files.  Idempotent — safe to re-run.

Usage:
    python manage.py seed_cms_content
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Populate CMS models with static frontend content"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing CMS records before seeding.",
        )

    def handle(self, *args, **options):
        self.user = User.objects.filter(is_superuser=True).first()
        if not self.user:
            self.stderr.write(self.style.ERROR("No superuser found. Create one first."))
            return

        if options["flush"]:
            self._flush_cms()

        self.stdout.write("Seeding CMS content …")
        self._seed_site_settings()
        self._seed_page_meta()
        self._seed_navigation()
        self._seed_hero_sections()
        self._seed_page_blocks()
        self._seed_services()
        self._seed_arcplus_modules()
        self._seed_pricing()
        self._seed_support()
        self._seed_tag_categories()
        self._seed_scanner_features()
        self._seed_case_studies()
        self._seed_documentation()
        self._seed_api_reference()
        self._seed_blog()
        self._seed_testimonials()
        self.stdout.write(self.style.SUCCESS("CMS seed complete."))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _flush_cms(self):
        """Remove all CMS records so we can re-seed cleanly."""
        from apps.cms import models as m

        counts = {}
        for Model in [
            m.Testimonial,
            m.BlogPost,
            m.BlogCategory,
            m.APIEndpoint,
            m.APIEndpointGroup,
            m.DocumentationPage,
            m.CaseStudy,
            m.ScannerFeature,
            m.TagCategory,
            m.SupportFeatureValue,
            m.SupportFeature,
            m.SupportTier,
            m.PlanFeatureValue,
            m.PlanFeature,
            m.PricingPlan,
            m.ArcplusModule,
            m.ServiceOffering,
            m.PageBlock,
            m.HeroSection,
            m.NavigationItem,
            m.PageMeta,
            m.SiteSettings,
        ]:
            n, _ = Model.objects.all().delete()
            counts[Model.__name__] = n
        total = sum(counts.values())
        self.stdout.write(self.style.WARNING(f"  Flushed {total} CMS records"))

    def _pub(self, extra=None):
        """Return common publishable fields."""
        d = {
            "status": "published",
            "created_by": self.user,
            "updated_by": self.user,
        }
        if extra:
            d.update(extra)
        return d

    # ------------------------------------------------------------------
    # Site Settings
    # ------------------------------------------------------------------

    def _seed_site_settings(self):
        from apps.cms.models import SiteSettings

        obj, _ = SiteSettings.objects.update_or_create(
            pk=1,
            defaults={
                "company_email": "contact@abssystems.com",
                "company_phone": "+1 (800) 555-0199",
                "company_address": "100 Enterprise Way\nSuite 400\nBoston, MA 02110",
                "currency_rates": {"USD": 1, "UGX": 3750, "KES": 154},
                "social_links": {
                    "twitter": "https://twitter.com/absplatform",
                    "linkedin": "https://linkedin.com/company/absplatform",
                },
                "google_analytics_id": "",
                "robots_txt_extra": "",
                "organization_schema": {},
                "updated_by": self.user,
            },
        )
        self.stdout.write(f"  SiteSettings: updated (pk={obj.pk})")

    # ------------------------------------------------------------------
    # Page Meta (SEO)
    # ------------------------------------------------------------------

    def _seed_page_meta(self):
        from apps.cms.models import PageMeta

        pages = [
            {
                "route": "/",
                "title": "ABS Platform | Enterprise Asset Management",
                "description": "The enterprise digital product showroom for intelligent asset management, hardware, and lifecycle services.",
            },
            {
                "route": "/arcplus",
                "title": "Arcplus Platform | ABS",
                "description": "The enterprise nervous system for your physical assets. Eight powerful modules working in perfect sync.",
            },
            {
                "route": "/scanners",
                "title": "Industrial Scanners | ABS",
                "description": "Industrial-grade barcode and RFID readers designed for harsh environments and high-volume operations.",
            },
            {
                "route": "/tags",
                "title": "Asset Tags | ABS",
                "description": "Industrial RFID, Barcode, and GPS tags engineered to survive the lifecycle of the assets they track.",
            },
            {
                "route": "/services",
                "title": "Expert Services | ABS",
                "description": "We deploy, verify, and optimize your entire asset ecosystem with outcome-based delivery.",
            },
            {
                "route": "/training",
                "title": "Training Academy | ABS",
                "description": "Empower your team with expert-led training on asset management tools and methodologies.",
            },
            {
                "route": "/resources/support",
                "title": "Support | ABS",
                "description": "Get help with ABS products and services. Contact support, access documentation, and manage your account.",
            },
            {
                "route": "/resources/docs",
                "title": "Documentation | ABS",
                "description": "Guides, references, and tutorials for the Arcplus platform.",
            },
            {
                "route": "/resources/api-reference",
                "title": "API Reference | ABS",
                "description": "REST API documentation for the Arcplus and hardware platform.",
            },
            {
                "route": "/resources/case-studies",
                "title": "Case Studies | ABS",
                "description": "Real-world results from ABS customers across Africa.",
            },
            {
                "route": "/resources/blog",
                "title": "Blog & Articles | ABS Platform",
                "description": "Insights, tutorials, and industry updates on asset management, RFID tracking, and enterprise solutions across Africa.",
            },
            {
                "route": "/compare",
                "title": "Compare Solutions | ABS",
                "description": "Compare Arcplus plans and hardware configurations side by side.",
            },
        ]
        created = 0
        for p in pages:
            _, is_new = PageMeta.objects.get_or_create(route=p["route"], defaults=p)
            if is_new:
                created += 1
        self.stdout.write(
            f"  PageMeta: {created} created, {len(pages) - created} existed"
        )

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def _seed_navigation(self):
        from apps.cms.models import NavigationItem

        # --- Header top-level ---
        header_items = [
            {"label": "Arcplus", "url": "/arcplus", "order": 1},
            {"label": "Scanners", "url": "/scanners", "order": 2},
            {"label": "Tags", "url": "/tags", "order": 3},
            {"label": "Services", "url": "/services", "order": 4},
            {"label": "Training", "url": "/training", "order": 5},
        ]
        created = 0
        for item in header_items:
            parent, is_new = NavigationItem.objects.get_or_create(
                label=item["label"],
                location="header_main",
                parent=None,
                defaults={**item, "location": "header_main", "is_active": True},
            )
            if is_new:
                created += 1

        # --- Mega-menu children for Scanners ---
        scanners_parent = NavigationItem.objects.filter(
            label="Scanners", location="header_main", parent=None
        ).first()
        if scanners_parent:
            scanner_children = [
                {
                    "label": "Handheld Series 700",
                    "url": "/scanners/handheld-series-700",
                    "order": 1,
                },
                {
                    "label": "Fixed RFID Reader FX9600",
                    "url": "/scanners/fixed-rfid-reader-fx9600",
                    "order": 2,
                },
            ]
            for child in scanner_children:
                _, is_new = NavigationItem.objects.get_or_create(
                    label=child["label"],
                    location="header_main",
                    parent=scanners_parent,
                    defaults={**child, "location": "header_main", "is_active": True},
                )
                if is_new:
                    created += 1

        # --- Mega-menu children for Tags ---
        tags_parent = NavigationItem.objects.filter(
            label="Tags", location="header_main", parent=None
        ).first()
        if tags_parent:
            tag_children = [
                {
                    "label": "Industrial RFID Tag IT-250",
                    "url": "/tags/industrial-rfid-tag-it250",
                    "order": 1,
                },
                {
                    "label": "Barcode Label BL-120",
                    "url": "/tags/barcode-label-bl120",
                    "order": 2,
                },
            ]
            for child in tag_children:
                _, is_new = NavigationItem.objects.get_or_create(
                    label=child["label"],
                    location="header_main",
                    parent=tags_parent,
                    defaults={**child, "location": "header_main", "is_active": True},
                )
                if is_new:
                    created += 1

        # --- Footer platform links ---
        footer_platform = [
            {
                "label": "Arcplus Software",
                "url": "/arcplus",
                "order": 1,
                "column": "platform",
            },
            {
                "label": "Industrial Scanners",
                "url": "/scanners",
                "order": 2,
                "column": "platform",
            },
            {
                "label": "RFID & Barcode Tags",
                "url": "/tags",
                "order": 3,
                "column": "platform",
            },
            {
                "label": "Field Services",
                "url": "/services",
                "order": 4,
                "column": "platform",
            },
            {
                "label": "Training Academy",
                "url": "/training",
                "order": 5,
                "column": "platform",
            },
            {
                "label": "Compare Solutions",
                "url": "/compare",
                "order": 6,
                "column": "platform",
            },
        ]
        for item in footer_platform:
            _, is_new = NavigationItem.objects.get_or_create(
                label=item["label"],
                location="footer_platform",
                parent=None,
                defaults={**item, "location": "footer_platform", "is_active": True},
            )
            if is_new:
                created += 1

        # --- Footer resource links ---
        footer_resources = [
            {
                "label": "Case Studies",
                "url": "/resources/case-studies",
                "order": 1,
                "column": "resources",
            },
            {
                "label": "Documentation",
                "url": "/resources/docs",
                "order": 2,
                "column": "resources",
            },
            {
                "label": "API Reference",
                "url": "/resources/api-reference",
                "order": 3,
                "column": "resources",
            },
            {
                "label": "Support Portal",
                "url": "/resources/support",
                "order": 4,
                "column": "resources",
            },
            {"label": "System Status", "url": "#", "order": 5, "column": "resources"},
        ]
        for item in footer_resources:
            _, is_new = NavigationItem.objects.get_or_create(
                label=item["label"],
                location="footer_resources",
                parent=None,
                defaults={**item, "location": "footer_resources", "is_active": True},
            )
            if is_new:
                created += 1

        self.stdout.write(f"  NavigationItem: {created} created")

    # ------------------------------------------------------------------
    # Hero Sections
    # ------------------------------------------------------------------

    def _seed_hero_sections(self):
        from apps.cms.models import HeroSection

        heroes = [
            {
                "page": "home",
                "headline": "Control\nEvery Asset.",
                "subheadline": "The enterprise digital product showroom for intelligent asset management, hardware, and lifecycle services.",
                "cta_primary_text": "Start Free Trial",
                "cta_primary_link": "/arcplus",
                "cta_secondary_text": "Configure Solution",
                "cta_secondary_link": "/configurator",
                "variant": "overlay",
            },
            {
                "page": "services",
                "headline": "Expert Services",
                "subheadline": "We don't just sell products. We deploy, verify, and optimize your entire asset ecosystem.",
                "cta_primary_text": "Request Consultation",
                "cta_primary_link": "/rfq",
                "cta_secondary_text": "Start Free Trial",
                "cta_secondary_link": "/arcplus#pricing",
                "variant": "overlay",
            },
            {
                "page": "scanners",
                "headline": "Capture data at the source.",
                "subheadline": "Industrial-grade barcode and RFID readers designed specifically for harsh environments and high-volume operations.",
                "cta_primary_text": "Configure Hardware",
                "cta_primary_link": "/configurator",
                "cta_secondary_text": "Get Quote",
                "cta_secondary_link": "/rfq",
                "variant": "overlay",
            },
            {
                "page": "tags",
                "headline": "A digital identity for physical assets.",
                "subheadline": "Industrial RFID, Barcode, and GPS tags engineered to survive the lifecycle of the assets they track.",
                "cta_primary_text": "Configure Tags",
                "cta_primary_link": "/configurator",
                "cta_secondary_text": "Get Quote",
                "cta_secondary_link": "/rfq",
                "variant": "overlay",
            },
            {
                "page": "arcplus",
                "headline": "Arcplus Platform",
                "subheadline": "The enterprise nervous system for your physical assets. Eight powerful modules working in perfect sync to digitize every stage of the lifecycle.",
                "cta_primary_text": "Start Free Trial",
                "cta_primary_link": "/arcplus#pricing",
                "cta_secondary_text": "Get Quote",
                "cta_secondary_link": "/rfq",
                "variant": "overlay",
            },
        ]
        created = 0
        for h in heroes:
            _, is_new = HeroSection.objects.get_or_create(
                page=h["page"],
                defaults={**h, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(
            f"  HeroSection: {created} created (existing heroes preserved)"
        )

    # ------------------------------------------------------------------
    # Page Blocks
    # ------------------------------------------------------------------

    def _seed_page_blocks(self):
        from apps.cms.models import PageBlock

        blocks = [
            # --- Homepage ---
            {
                "page": "home",
                "block_type": "feature_grid",
                "title": "The Ecosystem",
                "body": "Asset Management Software and services",
                "order": 1,
                "data": {
                    "cards": [
                        {
                            "title": "Arcplus",
                            "href": "/arcplus",
                            "ctaText": "More about Arcplus",
                            "imageAlt": "Arcplus Asset Management System",
                            "imageSrc": "/images/hardware_software_hero_1772490241653.png",
                        },
                        {
                            "title": "Training",
                            "href": "/training",
                            "ctaText": "More about Training",
                            "imageAlt": "Asset Management Training",
                            "imageSrc": "/images/training_hero.png",
                        },
                        {
                            "title": "Services",
                            "href": "/services",
                            "ctaText": "More about Services",
                            "imageAlt": "Asset Management Services",
                            "imageSrc": "/images/services_hero.png",
                        },
                        {
                            "title": "Tags",
                            "href": "/tags",
                            "ctaText": "More about Tags",
                            "imageAlt": "Asset Tags",
                            "imageSrc": "/images/rfid_tag_1772490270592.png",
                        },
                        {
                            "title": "Scanners",
                            "href": "/scanners",
                            "ctaText": "More about Scanners",
                            "imageAlt": "Barcode and RFID Scanners",
                            "imageSrc": "/images/barcode_scanner_1772490256748.png",
                        },
                    ]
                },
            },
            {
                "page": "home",
                "block_type": "guided_path",
                "title": "What do you need to achieve?",
                "body": "We build solutions aligned to your operational goals.",
                "order": 2,
                "data": {
                    "items": [
                        {
                            "href": "/arcplus",
                            "icon": "Layers",
                            "title": "Digitize asset management",
                            "desc": "Build a central digital register with automated depreciation and lifecycle tracking.",
                            "cta": "Arcplus Software",
                        },
                        {
                            "href": "/scanners",
                            "icon": "Target",
                            "title": "Capture assets faster",
                            "desc": "Ditch manual counts with long-range RFID and intelligent barcode scanning terminals.",
                            "cta": "Hardware Catalog",
                        },
                        {
                            "href": "/tags",
                            "icon": "Box",
                            "title": "Tag assets permanently",
                            "desc": "Industrial-grade labels and tags engineered for harsh environments and extreme temperatures.",
                            "cta": "Tags Selector",
                        },
                        {
                            "href": "/services",
                            "icon": "Settings",
                            "title": "Build an asset register",
                            "desc": "Let our expert field teams tag, locate, and catalogue your entire fixed asset network.",
                            "cta": "Consulting Services",
                        },
                    ]
                },
            },
            {
                "page": "home",
                "block_type": "workflow",
                "title": "Why organisations choose ABS?",
                "body": "Here is why",
                "order": 3,
                "data": {
                    "steps": [
                        {
                            "title": "Expertise",
                            "desc": "Deep technical knowledge in asset management",
                        },
                        {
                            "title": "Experience",
                            "desc": "Proven delivery across diverse environments",
                        },
                        {
                            "title": "Methodology",
                            "desc": "Structured system driven approach",
                        },
                        {
                            "title": "Reliable delivery",
                            "desc": "Consistent results that exceed expectations",
                        },
                    ],
                },
            },
            {
                "page": "home",
                "block_type": "stats_row",
                "title": "Deployed at scale",
                "body": "",
                "order": 4,
                "data": {
                    "eyebrow": "Trusted globally",
                    "stats": [
                        {"value": "5M+", "label": "Assets Under Management"},
                        {"value": "42", "label": "Countries Deployed"},
                        {"value": "99.9%", "label": "Inventory Accuracy Achieved"},
                    ],
                    "industries_header": "Powering leaders in",
                    "industries": [
                        "Logistics",
                        "Manufacturing",
                        "Healthcare",
                        "Defense",
                        "IT Assets",
                    ],
                },
            },
            {
                "page": "home",
                "block_type": "cta_banner",
                "title": "Ready to gain control?",
                "link_text": "Start Free Trial",
                "link_url": "/arcplus#pricing",
                "order": 5,
                "data": {
                    "secondary_text": "Configure Solution",
                    "secondary_link": "/configurator",
                    "tertiary_text": "or request a custom quote →",
                    "tertiary_link": "/rfq",
                },
            },
            # --- Services page CTA ---
            {
                "page": "services",
                "block_type": "cta_banner",
                "title": "Ready to deploy expert services?",
                "body": "Our specialized teams operate globally. Tell us your requirements and we'll scope a custom engagement.",
                "link_text": "Request Consultation",
                "link_url": "/rfq",
                "order": 1,
                "data": {
                    "eyebrow": "Outcome-Based Delivery",
                    "section_title": "Problem → Process → Result",
                    "secondary_text": "Start Free Trial",
                    "secondary_link": "/arcplus#pricing",
                },
            },
            # --- Arcplus page blocks ---
            {
                "page": "arcplus",
                "block_type": "workflow",
                "title": "Visual Lifecycle Management",
                "body": "See exactly where your assets are in their lifecycle context. The Arcplus dashboard acts as a single pane of glass.",
                "order": 1,
                "data": {
                    "steps": [
                        "Register",
                        "Operate",
                        "Maintain",
                        "Depreciate",
                        "Dispose",
                    ],
                },
            },
            {
                "page": "arcplus",
                "block_type": "cta_banner",
                "title": "Transform your asset lifecycle.",
                "link_text": "Start Free Trial",
                "link_url": "/arcplus#pricing",
                "order": 2,
                "data": {
                    "secondary_text": "Get Quote",
                    "secondary_link": "/rfq",
                },
            },
            # --- Scanners page CTA ---
            {
                "page": "scanners",
                "block_type": "cta_banner",
                "title": "Need help choosing?",
                "link_text": "Compare Models",
                "link_url": "/compare",
                "order": 1,
                "data": {
                    "secondary_text": "Get Quote",
                    "secondary_link": "/rfq",
                },
            },
            # --- Tags page CTA ---
            {
                "page": "tags",
                "block_type": "cta_banner",
                "title": "Ready to tag your assets?",
                "link_text": "Configure Tags",
                "link_url": "/configurator",
                "order": 1,
                "data": {
                    "secondary_text": "Get Quote",
                    "secondary_link": "/rfq",
                },
            },
        ]
        created = 0
        for b in blocks:
            # Use page + block_type + order as uniqueness key
            _, is_new = PageBlock.objects.get_or_create(
                page=b["page"],
                block_type=b["block_type"],
                order=b["order"],
                defaults={**b, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  PageBlock: {created} created")

    # ------------------------------------------------------------------
    # Service Offerings
    # ------------------------------------------------------------------

    def _seed_services(self):
        from apps.cms.models import ServiceOffering

        services = [
            {
                "title": "Physical Asset Verification",
                "slug": "pav",
                "icon": "ClipboardList",
                "short_description": "Locate, identify, and tag every asset with certified field teams.",
                "problem": "Ghost assets distort financial records, insurance premiums are paid on retired equipment, and teams waste hours searching for missing tools.",
                "process": "Our certified field teams deploy to your facilities. We locate, identify, and permanently affix industrial-grade RFID/barcode tags to every asset.",
                "deliverables": [
                    "Clean structured database",
                    "Normalized asset descriptions",
                    "Precise GPS locations",
                    "Photographic evidence of each tagged item",
                    "Reconciliation report",
                ],
                "result": "Immediate operational control. Accurate depreciation schedules, reduced tax liabilities, and a foundation for automated lifecycle management.",
                "order": 1,
            },
            {
                "title": "Asset Register Construction",
                "slug": "register",
                "icon": "Database",
                "short_description": "Design a standardized data schema and build your single source of truth.",
                "problem": "Spreadsheets and siloed systems cannot scale. Data inconsistency across locations makes enterprise reporting impossible.",
                "process": "We design a standardized data schema tailored to your industry, then populate it with verified field data and integrate it with your ERP/financial system.",
                "deliverables": [
                    "Custom data schema",
                    "ERP integration mapping",
                    "Hierarchical asset tree",
                    "Depreciation schedule setup",
                    "Staff training materials",
                ],
                "result": "A single source of truth for your entire fixed asset portfolio, ready for audits, compliance, and strategic planning.",
                "order": 2,
            },
            {
                "title": "Lifecycle Consulting",
                "slug": "consulting",
                "icon": "BarChart3",
                "short_description": "Assess maturity, benchmark against standards, and design improvement roadmaps.",
                "problem": "Organizations lack a coherent strategy for managing assets from acquisition through disposal, leading to unplanned costs and compliance gaps.",
                "process": "Senior consultants assess your current maturity, benchmark against industry standards, and design a phased improvement roadmap.",
                "deliverables": [
                    "Maturity assessment report",
                    "Gap analysis document",
                    "Phased implementation roadmap",
                    "ROI projections",
                    "Change management plan",
                ],
                "result": "A clear, actionable plan to move from reactive asset management to proactive lifecycle optimization.",
                "order": 3,
            },
            {
                "title": "Hardware Deployment",
                "slug": "deployment",
                "icon": "HardDrive",
                "short_description": "Pre-configure, deploy, and integrate scanners across all your sites.",
                "problem": "Rolling out scanners and readers across multiple sites is complex — firmware versions, network configs, and user training create friction.",
                "process": "Our engineers pre-configure all hardware, deploy on-site, integrate with your network, and deliver operator training.",
                "deliverables": [
                    "Pre-configured hardware fleet",
                    "Network integration documentation",
                    "Operator training sessions",
                    "Warranty registration",
                    "Support hotline access",
                ],
                "result": "Day-one operational readiness. Your teams scan assets within hours of deployment, not weeks.",
                "order": 4,
            },
            {
                "title": "Managed Field Teams",
                "slug": "staffing",
                "icon": "Users",
                "short_description": "Trained, background-checked teams for large-scale inventory projects.",
                "problem": "Large-scale inventory projects require temporary skilled labor that understands asset management methodology.",
                "process": "We provide trained, background-checked teams who follow standardized procedures to verify assets across any number of sites simultaneously.",
                "deliverables": [
                    "Trained field operators",
                    "Standardized operating procedures",
                    "Daily progress reports",
                    "Quality audit checkpoints",
                    "Final sign-off per site",
                ],
                "result": "Scalable execution without permanent headcount. Complete multi-site projects in weeks, not months.",
                "order": 5,
            },
            {
                "title": "Warehouse Optimization",
                "slug": "warehousing",
                "icon": "Warehouse",
                "short_description": "Map flows, implement zone-based tracking, and redesign layouts.",
                "problem": "Poor warehouse layout and lack of real-time inventory visibility lead to picking errors, stock-outs, and wasted movement.",
                "process": "We map your current flows, implement zone-based RFID tracking, and redesign layouts for optimal throughput.",
                "deliverables": [
                    "Current-state flow analysis",
                    "Optimized zone layout plan",
                    "RFID infrastructure blueprint",
                    "KPI dashboard setup",
                    "Operator retraining",
                ],
                "result": "Measurable improvements in pick accuracy, throughput speed, and space utilization.",
                "order": 6,
            },
        ]
        created = 0
        for s in services:
            _, is_new = ServiceOffering.objects.get_or_create(
                slug=s["slug"],
                defaults={**s, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  ServiceOffering: {created} created")

    # ------------------------------------------------------------------
    # Arcplus Modules
    # ------------------------------------------------------------------

    def _seed_arcplus_modules(self):
        from apps.cms.models import ArcplusModule

        modules = [
            {
                "name": "Register",
                "slug": "register",
                "icon": "Database",
                "tagline": "Centralized asset database to log and identify every piece of equipment.",
                "description": "Create digital twins of physical assets. Standardize naming conventions, assign unique identifiers (barcodes/RFID), and categorize equipment instantly.",
                "features": [
                    "Digital twin creation",
                    "Unique identifier assignment",
                    "Standardized naming",
                    "Instant categorization",
                ],
                "order": 1,
            },
            {
                "name": "Operations",
                "slug": "operations",
                "icon": "Activity",
                "tagline": "Track assignments, locations, and utilization in real-time.",
                "description": "Know exactly who has what and where. Manage check-in/check-out processes, perform audits, and locate missing equipment efficiently.",
                "features": [
                    "Real-time tracking",
                    "Check-in/check-out",
                    "Audit management",
                    "Equipment location",
                ],
                "order": 2,
            },
            {
                "name": "Depreciation",
                "slug": "depreciation",
                "icon": "Layers",
                "tagline": "Automated calculations for straight-line and declining balance.",
                "description": "Keep finance aligned with operations. Automatically calculate monthly and annual depreciation values for accurate financial reporting.",
                "features": [
                    "Straight-line method",
                    "Declining balance",
                    "Monthly calculations",
                    "Financial reporting",
                ],
                "order": 3,
            },
            {
                "name": "Disposal",
                "slug": "disposal",
                "icon": "Trash2",
                "tagline": "Secure end-of-life workflows and compliance proof.",
                "description": "Retire assets cleanly. Generate disposal certificates, manage e-waste compliance, and remove written-off assets from active registers.",
                "features": [
                    "Disposal certificates",
                    "E-waste compliance",
                    "Write-off management",
                    "Audit trail",
                ],
                "order": 4,
            },
            {
                "name": "AACSM",
                "slug": "aacsm",
                "icon": "Shield",
                "tagline": "Asset Acquisition & Construction Supervision Module.",
                "description": "Track capital projects from procurement to commissioning. Monitor construction milestones and automatically register newly completed assets.",
                "features": [
                    "Capital project tracking",
                    "Procurement management",
                    "Milestone monitoring",
                    "Auto-registration",
                ],
                "order": 5,
            },
            {
                "name": "Stock",
                "slug": "stock",
                "icon": "Box",
                "tagline": "Inventory and consumable management directly tied to assets.",
                "description": "Track spare parts and consumables. Set minimum viable stock levels and automate reorder alerts for critical components.",
                "features": [
                    "Spare parts tracking",
                    "Stock level management",
                    "Reorder alerts",
                    "Consumable tracking",
                ],
                "order": 6,
            },
            {
                "name": "Fleet",
                "slug": "fleet",
                "icon": "Truck",
                "tagline": "Vehicle tracking, licensing, and compliance tracking.",
                "description": "Manage your vehicle fleet. Track MOT dates, tax renewals, fuel consumption, and driver assignments in one place.",
                "features": [
                    "Vehicle tracking",
                    "License management",
                    "Fuel consumption",
                    "Driver assignments",
                ],
                "order": 7,
            },
            {
                "name": "Maintenance",
                "slug": "maintenance",
                "icon": "Wrench",
                "tagline": "Preventive schedules and reactive work orders.",
                "description": "Minimize downtime. Schedule routine maintenance, assign work orders, and track repair costs against asset value.",
                "features": [
                    "Preventive scheduling",
                    "Work orders",
                    "Repair cost tracking",
                    "Downtime reduction",
                ],
                "order": 8,
            },
        ]
        created = 0
        for m in modules:
            _, is_new = ArcplusModule.objects.get_or_create(
                slug=m["slug"],
                defaults={**m, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  ArcplusModule: {created} created")

    # ------------------------------------------------------------------
    # Pricing Plans + Features
    # ------------------------------------------------------------------

    def _seed_pricing(self):
        from apps.cms.models import PricingPlan, PlanFeature, PlanFeatureValue

        plans_data = [
            {
                "name": "Starter",
                "slug": "starter",
                "tagline": "For small teams getting started",
                "asset_range": "Up to 1,000",
                "price_usd": 4500,
                "price_ugx": 16875000,
                "price_kes": 693000,
                "billing_period": "annual",
                "is_recommended": False,
                "cta_text": "Start Free Trial",
                "cta_link": "/arcplus#pricing",
                "order": 1,
            },
            {
                "name": "Growth",
                "slug": "growth",
                "tagline": "For growing organizations",
                "asset_range": "1,001–5,000",
                "price_usd": 7500,
                "price_ugx": 28125000,
                "price_kes": 1155000,
                "billing_period": "annual",
                "is_recommended": True,
                "cta_text": "Start Free Trial",
                "cta_link": "/arcplus#pricing",
                "order": 2,
            },
            {
                "name": "Professional",
                "slug": "professional",
                "tagline": "For enterprises with complex needs",
                "asset_range": "5,001–20,000",
                "price_usd": 12500,
                "price_ugx": 46875000,
                "price_kes": 1925000,
                "billing_period": "annual",
                "is_recommended": False,
                "cta_text": "Start Free Trial",
                "cta_link": "/arcplus#pricing",
                "order": 3,
            },
            {
                "name": "Enterprise",
                "slug": "enterprise",
                "tagline": "Custom solutions for large organizations",
                "asset_range": "Unlimited",
                "price_usd": 0,
                "price_ugx": 0,
                "price_kes": 0,
                "billing_period": "annual",
                "is_recommended": False,
                "cta_text": "Contact Sales",
                "cta_link": "/rfq",
                "order": 4,
            },
        ]

        plans = {}
        plans_created = 0
        for p in plans_data:
            obj, is_new = PricingPlan.objects.get_or_create(
                slug=p["slug"],
                defaults={**p, **self._pub()},
            )
            plans[p["slug"]] = obj
            if is_new:
                plans_created += 1

        # Feature comparison matrix
        features_data = [
            {"name": "Asset Register", "category": "core", "order": 1},
            {"name": "Mobile App", "category": "core", "order": 2},
            {"name": "Barcode Scanning", "category": "core", "order": 3},
            {"name": "RFID Support", "category": "hardware", "order": 4},
            {"name": "Maintenance Module", "category": "modules", "order": 5},
            {"name": "API Access", "category": "integration", "order": 6},
            {"name": "Depreciation Module", "category": "modules", "order": 7},
            {"name": "Fleet Tracking", "category": "modules", "order": 8},
            {"name": "SSO Integration", "category": "integration", "order": 9},
            {"name": "On-Premise Deployment", "category": "enterprise", "order": 10},
            {"name": "Custom ERP Integration", "category": "enterprise", "order": 11},
            {"name": "White Labeling", "category": "enterprise", "order": 12},
            {"name": "24/7 SLA", "category": "enterprise", "order": 13},
        ]

        features = {}
        features_created = 0
        for f in features_data:
            obj, is_new = PlanFeature.objects.get_or_create(
                name=f["name"],
                defaults=f,
            )
            features[f["name"]] = obj
            if is_new:
                features_created += 1

        # Value matrix: feature_name -> {plan_slug: (value, is_included)}
        matrix = {
            "Asset Register": {
                "starter": ("✓", True),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "Mobile App": {
                "starter": ("✓", True),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "Barcode Scanning": {
                "starter": ("✓", True),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "RFID Support": {
                "starter": ("—", False),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "Maintenance Module": {
                "starter": ("—", False),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "API Access": {
                "starter": ("—", False),
                "growth": ("✓", True),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "Depreciation Module": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "Fleet Tracking": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "SSO Integration": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("✓", True),
                "enterprise": ("✓", True),
            },
            "On-Premise Deployment": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("—", False),
                "enterprise": ("✓", True),
            },
            "Custom ERP Integration": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("—", False),
                "enterprise": ("✓", True),
            },
            "White Labeling": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("—", False),
                "enterprise": ("✓", True),
            },
            "24/7 SLA": {
                "starter": ("—", False),
                "growth": ("—", False),
                "professional": ("—", False),
                "enterprise": ("✓", True),
            },
        }

        values_created = 0
        for feature_name, plan_values in matrix.items():
            feature = features[feature_name]
            for plan_slug, (value, is_included) in plan_values.items():
                plan = plans[plan_slug]
                _, is_new = PlanFeatureValue.objects.get_or_create(
                    plan=plan,
                    feature=feature,
                    defaults={"value": value, "is_included": is_included},
                )
                if is_new:
                    values_created += 1

        self.stdout.write(f"  PricingPlan: {plans_created} created")
        self.stdout.write(f"  PlanFeature: {features_created} created")
        self.stdout.write(f"  PlanFeatureValue: {values_created} created")

    # ------------------------------------------------------------------
    # Support Tiers + Features
    # ------------------------------------------------------------------

    def _seed_support(self):
        from apps.cms.models import (
            SupportTier,
            SupportFeature,
            SupportFeatureValue,
            PricingPlan,
        )

        tier_names = ["Starter", "Growth", "Professional", "Enterprise"]
        tiers = {}
        tiers_created = 0
        for i, name in enumerate(tier_names):
            plan = PricingPlan.objects.filter(slug=name.lower()).first()
            obj, is_new = SupportTier.objects.get_or_create(
                slug=name.lower(),
                defaults={
                    "name": name,
                    "plan": plan,
                    "order": i + 1,
                    **self._pub(),
                },
            )
            tiers[name.lower()] = obj
            if is_new:
                tiers_created += 1

        features_data = [
            {"name": "Initial response time", "order": 1},
            {"name": "Support channels", "order": 2},
            {"name": "Dedicated account manager", "order": 3},
            {"name": "Custom SLA", "order": 4},
            {"name": "Onboarding assistance", "order": 5},
            {"name": "Training sessions included", "order": 6},
            {"name": "Bug fix priority", "order": 7},
        ]
        features = {}
        features_created = 0
        for f in features_data:
            obj, is_new = SupportFeature.objects.get_or_create(
                name=f["name"],
                defaults=f,
            )
            features[f["name"]] = obj
            if is_new:
                features_created += 1

        # tier_slug -> feature_name -> value
        matrix = {
            "starter": {
                "Initial response time": "48 hours",
                "Support channels": "Email",
                "Dedicated account manager": "No",
                "Custom SLA": "No",
                "Onboarding assistance": "Self-serve docs",
                "Training sessions included": "0",
                "Bug fix priority": "Standard queue",
            },
            "growth": {
                "Initial response time": "8 hours",
                "Support channels": "Email",
                "Dedicated account manager": "No",
                "Custom SLA": "No",
                "Onboarding assistance": "Guided setup call",
                "Training sessions included": "1",
                "Bug fix priority": "Standard queue",
            },
            "professional": {
                "Initial response time": "4 hours",
                "Support channels": "Email + Chat",
                "Dedicated account manager": "No",
                "Custom SLA": "No",
                "Onboarding assistance": "Dedicated onboarding",
                "Training sessions included": "3",
                "Bug fix priority": "Priority queue",
            },
            "enterprise": {
                "Initial response time": "1 hour",
                "Support channels": "Email + Chat + Phone",
                "Dedicated account manager": "Yes",
                "Custom SLA": "Yes",
                "Onboarding assistance": "Full implementation",
                "Training sessions included": "Unlimited",
                "Bug fix priority": "Critical escalation",
            },
        }

        values_created = 0
        for tier_slug, feat_vals in matrix.items():
            tier = tiers[tier_slug]
            for feat_name, value in feat_vals.items():
                feature = features[feat_name]
                _, is_new = SupportFeatureValue.objects.get_or_create(
                    tier=tier,
                    feature=feature,
                    defaults={"value": value},
                )
                if is_new:
                    values_created += 1

        self.stdout.write(f"  SupportTier: {tiers_created} created")
        self.stdout.write(f"  SupportFeature: {features_created} created")
        self.stdout.write(f"  SupportFeatureValue: {values_created} created")

    # ------------------------------------------------------------------
    # Tag Categories
    # ------------------------------------------------------------------

    def _seed_tag_categories(self):
        from apps.cms.models import TagCategory

        tags = [
            {
                "name": "Metal Mount RFID",
                "slug": "metal-mount-rfid",
                "icon": "Cog",
                "description": "Specialized RFID tags with isolators that prevent signal bounce on steel containers and heavy equipment.",
                "environment": "Metal / Industrial",
                "range_category": "long",
                "application": "Heavy Equipment",
                "order": 1,
            },
            {
                "name": "Long Range UHF",
                "slug": "long-range-uhf",
                "icon": "Radio",
                "description": "Up to 20m read range for yard management and open-area asset tracking.",
                "environment": "Outdoor / Yard",
                "range_category": "long",
                "application": "Yard Management",
                "order": 2,
            },
            {
                "name": "Industrial Harsh",
                "slug": "industrial-harsh",
                "icon": "Thermometer",
                "description": "Teflon and ceramic-encased tags designed for caustic washdowns and extreme temperatures.",
                "environment": "Chemical / Extreme Temp",
                "range_category": "medium",
                "application": "Manufacturing",
                "order": 3,
            },
            {
                "name": "Tamper Proof",
                "slug": "tamper-proof",
                "icon": "ShieldCheck",
                "description": "Destructible antennas and brittle face-stocks prevent unauthorized tag transfers on high-value IT assets.",
                "environment": "Indoor / Office",
                "range_category": "short",
                "application": "IT Assets",
                "order": 4,
            },
            {
                "name": "Fleet GPS",
                "slug": "fleet-gps",
                "icon": "MapPin",
                "description": "Real-time GPS tracking for vehicles and high-value mobile assets.",
                "environment": "Outdoor / Mobile",
                "range_category": "gps",
                "application": "Fleet Management",
                "order": 5,
            },
            {
                "name": "Chemical Resistant",
                "slug": "chemical-resistant",
                "icon": "Waves",
                "description": "Resistant to oceanic submersion, salt spray, and caustic chemical exposure.",
                "environment": "Chemical / Extreme Temp",
                "range_category": "medium",
                "application": "Manufacturing",
                "order": 6,
            },
        ]
        created = 0
        for t in tags:
            _, is_new = TagCategory.objects.get_or_create(
                slug=t["slug"],
                defaults={**t, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  TagCategory: {created} created")

    # ------------------------------------------------------------------
    # Scanner Features
    # ------------------------------------------------------------------

    def _seed_scanner_features(self):
        from apps.cms.models import ScannerFeature

        features = [
            {
                "title": "Built for the frontline.",
                "slug": "built-for-frontline",
                "description": "Equipment doesn't matter if it can't survive the environment. Our scanners are deployable in freezers, foundries, and flight lines. Drop-tested to concrete, sealed against dust and water.",
                "icon": "Shield",
                "feature_type": "durability",
                "specs": [
                    "IP65 / IP67 Sealing Options",
                    "8ft (2.4m) Concrete Drop Spec",
                    "Extreme Temp Operations (-20°C to 50°C)",
                ],
                "order": 1,
            },
            {
                "title": "Engineered precision.",
                "slug": "engineered-precision",
                "description": "Every material choice serves a functional purpose, from the high-friction grips to the chemically resistant plastics.",
                "icon": "Crosshair",
                "feature_type": "precision",
                "specs": [
                    "Tactile scan trigger rated for 5M presses",
                    "Gorilla Glass display rated IP67",
                ],
                "order": 2,
            },
            {
                "title": "Instant data validation.",
                "slug": "instant-data-validation",
                "description": "Reading the barcode is only half the job. Real-time visual, haptic, and audio feedback ensure operators know immediately if a scan was successful or if an anomaly was detected.",
                "icon": "CheckCircle",
                "feature_type": "validation",
                "specs": [],
                "order": 3,
            },
            {
                "title": "Configure for your operation.",
                "slug": "configure-for-operation",
                "description": "Select scan engines, battery tiers, and environmental protection levels to match your exact workflow.",
                "icon": "Settings",
                "feature_type": "configurator",
                "specs": [
                    {
                        "step": "01",
                        "label": "Base Model",
                        "desc": "Standard Wi-Fi or Professional LTE",
                    },
                    {
                        "step": "02",
                        "label": "Scan Engine",
                        "desc": "1D/2D imager, long-range, or RFID",
                    },
                    {
                        "step": "03",
                        "label": "Battery",
                        "desc": "Standard, extended, or hot-swap",
                    },
                    {
                        "step": "04",
                        "label": "Protection",
                        "desc": "Standard IP65, rugged boot, or ATEX",
                    },
                ],
                "order": 4,
            },
        ]
        created = 0
        for f in features:
            _, is_new = ScannerFeature.objects.get_or_create(
                slug=f["slug"],
                defaults={**f, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  ScannerFeature: {created} created")

    # ------------------------------------------------------------------
    # Case Studies
    # ------------------------------------------------------------------

    def _seed_case_studies(self):
        from apps.cms.models import CaseStudy

        studies = [
            {
                "title": "Lamu County Government",
                "slug": "lamu-county",
                "client_name": "Lamu County Government",
                "industry": "Government",
                "country": "Kenya",
                "challenge": "Manual spreadsheets and disconnected registers were causing recurring audit failures. Ghost assets inflated the county balance sheet by an estimated KES 2.4M, and annual stock-takes took six weeks to complete.",
                "solution": "Full Arcplus platform deployment combined with ABS Asset Verification Service. All departments onboarded simultaneously using phased data migration from legacy Excel registers.",
                "results": [
                    {"metric": "68%", "label": "reduction in ghost assets"},
                    {"metric": "14 days", "label": "to full compliance"},
                    {"metric": "KES 2.4M", "label": "recovered in written-off assets"},
                ],
                "quote": "Achieved 100% asset visibility across 47 departments",
                "quote_author": "County Asset Manager",
                "quote_role": "Asset Manager, Lamu County",
                "order": 1,
            },
            {
                "title": "Pan African Airways",
                "slug": "pan-african-airways",
                "client_name": "Pan African Airways",
                "industry": "Aviation MRO",
                "country": "Uganda",
                "challenge": "Ground support equipment was untracked between flights, leading to last-minute scrambles that caused an average of 11 delay events per month. Maintenance schedules were paper-based and not linked to actual asset usage.",
                "solution": "RFID UHF tagging of all ground support equipment combined with the Arcplus Operations module. Real-time location tracking integrated with the flight operations scheduling system.",
                "results": [
                    {"metric": "40%", "label": "less equipment downtime"},
                    {"metric": "Real-time", "label": "location tracking across apron"},
                    {"metric": "ISO 55001", "label": "certified post-deployment"},
                ],
                "quote": "Reduced equipment downtime by 40% with predictive maintenance",
                "quote_author": "Head of Ground Operations",
                "quote_role": "Head of Ground Operations, Pan African Airways",
                "order": 2,
            },
            {
                "title": "Nairobi Metropolitan Services",
                "slug": "nairobi-metro",
                "client_name": "Nairobi Metropolitan Services",
                "industry": "Public Utilities",
                "country": "Kenya",
                "challenge": "No centralized asset register existed. Infrastructure assets — spanning roads, water networks, and municipal buildings — were aging with no lifecycle visibility. Capital budget decisions were made on incomplete data.",
                "solution": "ABS Asset Register Build service combined with Arcplus Starter plan. Field teams used mobile barcode scanning for rapid data capture; QA pipeline validated asset records in real time.",
                "results": [
                    {"metric": "28K", "label": "assets registered at launch"},
                    {"metric": "3 weeks", "label": "full deployment timeline"},
                    {"metric": "72%", "label": "cost reduction vs manual audit"},
                ],
                "quote": "Digitized 28,000 assets in 3 weeks",
                "quote_author": "Director of Infrastructure",
                "quote_role": "Director of Infrastructure, Nairobi Metro",
                "order": 3,
            },
        ]
        created = 0
        for s in studies:
            _, is_new = CaseStudy.objects.get_or_create(
                slug=s["slug"],
                defaults={**s, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  CaseStudy: {created} created")

    # ------------------------------------------------------------------
    # Documentation Pages
    # ------------------------------------------------------------------

    def _seed_documentation(self):
        from apps.cms.models import DocumentationPage

        docs = [
            {
                "title": "Getting Started",
                "slug": "getting-started",
                "order": 1,
                "content": """<h2>Prerequisites</h2>
<ul>
<li>Active Arcplus subscription (any tier)</li>
<li>Admin credentials (received via email after purchase)</li>
<li>CSV or Excel export of existing assets (optional)</li>
</ul>
<h2>First Login</h2>
<ol>
<li>Navigate to <code>yourorg.arcplus.io</code></li>
<li>Enter your admin email and temporary password</li>
<li>Set a new password when prompted</li>
</ol>
<div class="tip"><strong>Tip:</strong> Enable two-factor authentication immediately from Settings → Security.</div>""",
            },
            {
                "title": "Asset Fields",
                "slug": "asset-fields",
                "order": 2,
                "content": """<h2>Standard Fields</h2>
<table>
<thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>asset_id</code></td><td>string</td><td>Yes</td><td>Auto-generated if blank</td></tr>
<tr><td><code>name</code></td><td>string</td><td>Yes</td><td>Descriptive asset name</td></tr>
<tr><td><code>category</code></td><td>enum</td><td>Yes</td><td>From your configured categories</td></tr>
<tr><td><code>location</code></td><td>string</td><td>Yes</td><td>Physical location reference</td></tr>
<tr><td><code>status</code></td><td>enum</td><td>Yes</td><td>active | in_maintenance | disposed</td></tr>
</tbody>
</table>""",
            },
            {
                "title": "CSV Import",
                "slug": "csv-import",
                "order": 3,
                "content": """<h2>CSV Template</h2>
<pre><code>asset_id,name,category,location,status,purchase_date,purchase_value,serial_number</code></pre>
<h2>Example Row</h2>
<pre><code>,Laptop Dell XPS 15,IT Equipment,HQ Floor 2,active,2023-06-15,1250.00,DLX9823</code></pre>
<p>Leave <code>asset_id</code> blank for auto-generation.</p>
<h2>Import Limits</h2>
<ul>
<li><strong>Growth:</strong> 5,000 rows per import</li>
<li><strong>Professional:</strong> 20,000 rows per import</li>
</ul>""",
            },
            {
                "title": "RFID Scanning",
                "slug": "rfid-scanning",
                "order": 4,
                "content": """<h2>Pairing a Scanner</h2>
<ol>
<li>Download the Arcplus Mobile app (iOS / Android)</li>
<li>Go to <strong>Settings → Hardware → Add Scanner</strong></li>
<li>Hold the scanner trigger for 5 seconds to enter pairing mode</li>
<li>Select your scanner from the Bluetooth device list</li>
<li>Assign the scanner to a user or mark as shared</li>
</ol>
<p>Once paired, scans will automatically sync to the asset register in real-time.</p>""",
            },
            {
                "title": "Depreciation",
                "slug": "depreciation",
                "order": 5,
                "content": """<h2>Supported Methods</h2>
<table>
<thead><tr><th>Method</th><th>Formula</th></tr></thead>
<tbody>
<tr><td>Straight Line</td><td><code>(Cost − Residual Value) / Useful Life</code></td></tr>
<tr><td>Declining Balance</td><td><code>Book Value × Depreciation Rate</code></td></tr>
<tr><td>Units of Production</td><td><code>(Cost − Residual) / Total Units × Units Used</code></td></tr>
</tbody>
</table>
<p>Select the method per asset category under <strong>Settings → Depreciation Rules</strong>.</p>""",
            },
            {
                "title": "User Roles",
                "slug": "user-roles",
                "order": 6,
                "content": """<h2>Role Permissions</h2>
<table>
<thead><tr><th>Role</th><th>View</th><th>Edit</th><th>Admin</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Owner</td><td>✓</td><td>✓</td><td>✓</td><td>Full platform access, billing</td></tr>
<tr><td>Admin</td><td>✓</td><td>✓</td><td>✓</td><td>All except billing management</td></tr>
<tr><td>Editor</td><td>✓</td><td>✓</td><td>—</td><td>Can create/edit assets and reports</td></tr>
<tr><td>Viewer</td><td>✓</td><td>—</td><td>—</td><td>Read-only access</td></tr>
</tbody>
</table>""",
            },
            {
                "title": "Maintenance Module",
                "slug": "maintenance-module",
                "order": 7,
                "content": """<h2>Creating a Work Order</h2>
<ol>
<li>Open the asset detail page → <strong>Maintenance</strong> tab</li>
<li>Click <strong>New Work Order</strong></li>
<li>Select type: <em>Preventive</em>, <em>Corrective</em>, or <em>Inspection</em></li>
<li>Assign a technician (must have Field Agent or Editor role)</li>
<li>Set a due date — the asset status automatically changes to <em>In Maintenance</em></li>
<li>When complete, the assignee is notified and the asset returns to <em>Active</em></li>
</ol>""",
            },
            {
                "title": "API Access",
                "slug": "api-access",
                "order": 8,
                "content": """<h2>Generating a Token</h2>
<p>Navigate to <strong>Settings → API → New Token</strong>. Select one or more scopes:</p>
<ul>
<li><code>read</code> — Read asset data and reports</li>
<li><code>write</code> — Create and update assets</li>
<li><code>admin</code> — Manage users and configuration</li>
</ul>
<h2>Rate Limits</h2>
<p><strong>1,000 requests per minute</strong> per token. Available on Growth plans and above.</p>""",
            },
        ]
        created = 0
        for d in docs:
            _, is_new = DocumentationPage.objects.get_or_create(
                slug=d["slug"],
                defaults={**d, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  DocumentationPage: {created} created")

    # ------------------------------------------------------------------
    # API Reference
    # ------------------------------------------------------------------

    def _seed_api_reference(self):
        from apps.cms.models import APIEndpointGroup, APIEndpoint

        groups_data = [
            {
                "name": "Products",
                "slug": "products",
                "badge_class": "bg-[var(--color-info-light)] text-primary-500",
                "order": 1,
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/products",
                        "description": "List all asset products in your catalogue",
                        "order": 1,
                    },
                    {
                        "method": "GET",
                        "path": "/products/{id}",
                        "description": "Retrieve a single product record by ID",
                        "order": 2,
                    },
                    {
                        "method": "POST",
                        "path": "/products",
                        "description": "Create a new product entry",
                        "order": 3,
                    },
                    {
                        "method": "PATCH",
                        "path": "/products/{id}",
                        "description": "Update product details or availability status",
                        "order": 4,
                    },
                ],
            },
            {
                "name": "Services",
                "slug": "services",
                "badge_class": "bg-[var(--color-success-light)] text-[var(--color-success)]",
                "order": 2,
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/services",
                        "description": "List all active service packages",
                        "order": 1,
                    },
                    {
                        "method": "GET",
                        "path": "/services/{id}",
                        "description": "Get service details and SLA terms",
                        "order": 2,
                    },
                    {
                        "method": "POST",
                        "path": "/services/quote",
                        "description": "Request a service quotation",
                        "order": 3,
                    },
                    {
                        "method": "PATCH",
                        "path": "/services/{id}/status",
                        "description": "Update a service engagement status",
                        "order": 4,
                    },
                ],
            },
            {
                "name": "Training",
                "slug": "training",
                "badge_class": "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
                "order": 3,
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/training/courses",
                        "description": "List all available training modules",
                        "order": 1,
                    },
                    {
                        "method": "GET",
                        "path": "/training/enrollments",
                        "description": "List enrollments for your organisation",
                        "order": 2,
                    },
                    {
                        "method": "POST",
                        "path": "/training/enroll",
                        "description": "Enroll one or more users in a course",
                        "order": 3,
                    },
                    {
                        "method": "GET",
                        "path": "/training/certificates/{userId}",
                        "description": "Fetch issued certificates for a user",
                        "order": 4,
                    },
                ],
            },
            {
                "name": "Admin",
                "slug": "admin",
                "badge_class": "bg-[var(--color-error-light)] text-[var(--color-error)]",
                "order": 4,
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/admin/users",
                        "description": "List all users in your organisation",
                        "order": 1,
                    },
                    {
                        "method": "POST",
                        "path": "/admin/users/invite",
                        "description": "Invite a new user to the platform",
                        "order": 2,
                    },
                    {
                        "method": "PATCH",
                        "path": "/admin/users/{id}/role",
                        "description": "Update a user's platform role",
                        "order": 3,
                    },
                    {
                        "method": "GET",
                        "path": "/admin/audit-log",
                        "description": "Retrieve the full platform audit log",
                        "order": 4,
                    },
                ],
            },
            {
                "name": "Subscriptions",
                "slug": "subscriptions",
                "badge_class": "bg-[#F5F3FF] text-[#7C3AED]",
                "order": 5,
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/subscriptions/current",
                        "description": "Get current plan details and usage data",
                        "order": 1,
                    },
                    {
                        "method": "GET",
                        "path": "/subscriptions/invoices",
                        "description": "List all billing invoices",
                        "order": 2,
                    },
                    {
                        "method": "POST",
                        "path": "/subscriptions/upgrade",
                        "description": "Initiate a plan upgrade request",
                        "order": 3,
                    },
                    {
                        "method": "GET",
                        "path": "/subscriptions/usage",
                        "description": "Retrieve API call usage statistics",
                        "order": 4,
                    },
                ],
            },
        ]

        groups_created = 0
        endpoints_created = 0
        for g in groups_data:
            endpoints = g.pop("endpoints")
            obj, is_new = APIEndpointGroup.objects.get_or_create(
                slug=g["slug"],
                defaults={**g, "is_active": True},
            )
            if is_new:
                groups_created += 1
            for ep in endpoints:
                _, ep_new = APIEndpoint.objects.get_or_create(
                    group=obj,
                    method=ep["method"],
                    path=ep["path"],
                    defaults=ep,
                )
                if ep_new:
                    endpoints_created += 1

        self.stdout.write(f"  APIEndpointGroup: {groups_created} created")
        self.stdout.write(f"  APIEndpoint: {endpoints_created} created")

    # ------------------------------------------------------------------
    # Blog
    # ------------------------------------------------------------------

    def _seed_blog(self):
        from apps.cms.models import BlogCategory, BlogPost

        categories_data = [
            {
                "name": "Industry Insights",
                "slug": "industry-insights",
                "description": "Industry trends and analysis",
                "order": 1,
            },
            {
                "name": "Product Guides",
                "slug": "product-guides",
                "description": "Product tutorials and comparisons",
                "order": 2,
            },
            {
                "name": "Tutorials",
                "slug": "tutorials",
                "description": "Step-by-step guides and how-tos",
                "order": 3,
            },
        ]
        categories = {}
        cat_created = 0
        for c in categories_data:
            obj, is_new = BlogCategory.objects.get_or_create(
                slug=c["slug"],
                defaults=c,
            )
            categories[c["slug"]] = obj
            if is_new:
                cat_created += 1

        posts_data = [
            {
                "title": "How RFID Is Transforming Asset Management in East Africa",
                "slug": "rfid-transforming-east-africa",
                "excerpt": "Discover how enterprises across East Africa are leveraging RFID technology to streamline asset tracking and reduce losses.",
                "body": "<p>RFID technology is revolutionizing how organizations across East Africa manage their physical assets. From government agencies in Kenya to aviation companies in Uganda, the adoption of RFID-based asset management systems is accelerating.</p><p>This article explores the key drivers behind this transformation and what it means for the future of asset management in the region.</p>",
                "category": categories["industry-insights"],
                "author_name": "ABS Team",
                "reading_time_minutes": 5,
                "is_featured": True,
                "order": 1,
            },
            {
                "title": "Top 5 Barcode Scanner Models for Warehouse Operations",
                "slug": "top-barcode-scanners-warehouse",
                "excerpt": "A comprehensive comparison of the most reliable barcode scanners for high-volume warehouse environments.",
                "body": "<p>Choosing the right barcode scanner for warehouse operations can significantly impact productivity and accuracy. In this guide, we compare the top 5 models based on durability, scan speed, connectivity, and total cost of ownership.</p>",
                "category": categories["product-guides"],
                "author_name": "ABS Team",
                "reading_time_minutes": 7,
                "is_featured": False,
                "order": 2,
            },
            {
                "title": "Getting Started with ARC+ Asset Management Platform",
                "slug": "getting-started-arcplus",
                "excerpt": "A step-by-step guide to setting up and configuring the ARC+ platform for your organisation.",
                "body": "<p>Setting up the ARC+ platform is straightforward. This tutorial walks you through the initial configuration steps, from creating your first asset register to importing existing data and setting up user roles.</p>",
                "category": categories["tutorials"],
                "author_name": "ABS Team",
                "reading_time_minutes": 10,
                "is_featured": False,
                "order": 3,
            },
        ]
        posts_created = 0
        for p in posts_data:
            _, is_new = BlogPost.objects.get_or_create(
                slug=p["slug"],
                defaults={**p, **self._pub()},
            )
            if is_new:
                posts_created += 1

        self.stdout.write(f"  BlogCategory: {cat_created} created")
        self.stdout.write(f"  BlogPost: {posts_created} created")

    # ------------------------------------------------------------------
    # Testimonials
    # ------------------------------------------------------------------

    def _seed_testimonials(self):
        from apps.cms.models import Testimonial

        testimonials = [
            {
                "quote": "Achieved 100% asset visibility across 47 departments",
                "author_name": "County Asset Manager",
                "author_role": "Asset Manager",
                "company_name": "Lamu County Government",
                "industry": "Government",
                "rating": 5,
                "placement": "homepage",
                "order": 1,
            },
            {
                "quote": "Reduced equipment downtime by 40% with predictive maintenance",
                "author_name": "Head of Ground Operations",
                "author_role": "Head of Ground Operations",
                "company_name": "Pan African Airways",
                "industry": "Aviation MRO",
                "rating": 5,
                "placement": "homepage",
                "order": 2,
            },
            {
                "quote": "Digitized 28,000 assets in 3 weeks",
                "author_name": "Director of Infrastructure",
                "author_role": "Director of Infrastructure",
                "company_name": "Nairobi Metropolitan Services",
                "industry": "Public Utilities",
                "rating": 5,
                "placement": "global",
                "order": 3,
            },
        ]
        created = 0
        for t in testimonials:
            _, is_new = Testimonial.objects.get_or_create(
                quote=t["quote"],
                company_name=t["company_name"],
                defaults={**t, **self._pub()},
            )
            if is_new:
                created += 1
        self.stdout.write(f"  Testimonial: {created} created")
