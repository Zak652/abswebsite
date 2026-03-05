"""
Seed management command: create_products

Migrates product data that is currently hardcoded in the frontend JavaScript
into the database. Run once after the initial migration.

Usage:
    python manage.py seed_products
    python manage.py seed_products --clear  # delete existing products first
"""

from django.core.management.base import BaseCommand

from apps.products.models import (
    Product,
    ProductCategory,
    ProductConfigOption,
    ProductConfigSection,
)


SEED_DATA = {
    "categories": [
        {
            "name": "Scanners",
            "slug": "scanners",
            "description": "RFID and barcode scanning hardware",
            "order": 1,
        },
        {
            "name": "Tags",
            "slug": "tags",
            "description": "RFID and barcode tags and labels",
            "order": 2,
        },
    ],
    "products": [
        # ── SCANNERS ─────────────────────────────────────────────────────────
        {
            "category_slug": "scanners",
            "name": "Handheld Series 700",
            "slug": "handheld-series-700",
            "short_description": "Industrial-grade handheld scanner for warehouse and field operations",
            "full_description": (
                "The Series 700 is our flagship handheld scanner, designed for harsh environments. "
                "IP65/IP67 rated, drop-tested to 2.4m on concrete, and operable in extreme temperatures. "
                "Available with standard Wi-Fi or LTE+Wi-Fi connectivity."
            ),
            "image_hero": "/images/barcode_scanner_1772490256748.png",
            "image_context": "/images/scanner_context.png",
            "specifications": {
                "Connectivity": "Wi-Fi 802.11 a/b/g/n/ac or LTE + Wi-Fi",
                "Display": '4.0" HD (720×1280) touchscreen',
                "OS": "Android 11+ GMS Certified",
                "Processor": "Octa-core 2.2 GHz",
                "Battery": "4000mAh or 6000mAh extended",
                "Drop Spec": "8ft (2.4m) onto concrete",
                "Sealing": "IP65 / IP67 options",
                "Temperature": "-20°C to 50°C operating range",
                "Weight": "385g",
            },
            "is_configurable": True,
            "is_recommended": True,
            "is_active": True,
            "order": 1,
            "config_sections": [
                {
                    "name": "Base Model",
                    "step_number": 1,
                    "order": 1,
                    "options": [
                        {
                            "option_id": "std",
                            "name": "Standard (Wi-Fi Only)",
                            "description": "Perfect for indoor warehouse operations.",
                            "price_usd": "850.00",
                            "badge": "",
                            "is_default": True,
                            "overlay_icon": "",
                            "overlay_label": "",
                            "overlay_position": "",
                            "overlay_color": "",
                            "order": 1,
                        },
                        {
                            "option_id": "pro",
                            "name": "Professional (LTE + Wi-Fi)",
                            "description": "For field service and yard management.",
                            "price_usd": "1150.00",
                            "badge": "Popular",
                            "is_default": False,
                            "overlay_icon": "Zap",
                            "overlay_label": "LTE Enabled",
                            "overlay_position": "top-10 left-10",
                            "overlay_color": "bg-purple-500 text-white",
                            "order": 2,
                        },
                    ],
                },
                {
                    "name": "Scanning Engine",
                    "step_number": 2,
                    "order": 2,
                    "options": [
                        {
                            "option_id": "2d",
                            "name": "1D/2D Imager",
                            "description": "Standard range scanning.",
                            "price_usd": "0.00",
                            "badge": "",
                            "is_default": True,
                            "overlay_icon": "",
                            "overlay_label": "",
                            "overlay_position": "",
                            "overlay_color": "",
                            "order": 1,
                        },
                        {
                            "option_id": "lr",
                            "name": "Long-Range Imager",
                            "description": "Scan barcodes up to 45 ft away.",
                            "price_usd": "200.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Zap",
                            "overlay_label": "Long Range",
                            "overlay_position": "top-10 right-10",
                            "overlay_color": "bg-blue-500 text-white",
                            "order": 2,
                        },
                        {
                            "option_id": "rfid",
                            "name": "RFID UHF Module",
                            "description": "Bulk capture of hundreds of tags instantly.",
                            "price_usd": "500.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Tag",
                            "overlay_label": "RFID Ready",
                            "overlay_position": "top-10 right-10",
                            "overlay_color": "bg-accent-500 text-white",
                            "order": 3,
                        },
                    ],
                },
                {
                    "name": "Battery",
                    "step_number": 3,
                    "order": 3,
                    "options": [
                        {
                            "option_id": "std_bat",
                            "name": "Standard 4000mAh",
                            "description": "Up to 8 hours of continuous use.",
                            "price_usd": "0.00",
                            "badge": "",
                            "is_default": True,
                            "overlay_icon": "",
                            "overlay_label": "",
                            "overlay_position": "",
                            "overlay_color": "",
                            "order": 1,
                        },
                        {
                            "option_id": "ext_bat",
                            "name": "Extended 6000mAh",
                            "description": "Up to 14 hours of continuous use.",
                            "price_usd": "75.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Battery",
                            "overlay_label": "Extended Battery",
                            "overlay_position": "bottom-10 right-10",
                            "overlay_color": "bg-emerald-500 text-white",
                            "order": 2,
                        },
                        {
                            "option_id": "hot_swap",
                            "name": "Hot-Swap System",
                            "description": "Zero downtime battery replacement.",
                            "price_usd": "150.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Battery",
                            "overlay_label": "Hot-Swap",
                            "overlay_position": "bottom-10 right-10",
                            "overlay_color": "bg-emerald-600 text-white",
                            "order": 3,
                        },
                    ],
                },
                {
                    "name": "Protection",
                    "step_number": 4,
                    "order": 4,
                    "options": [
                        {
                            "option_id": "none",
                            "name": "Standard Casing",
                            "description": "IP65 rated against dust and water.",
                            "price_usd": "0.00",
                            "badge": "",
                            "is_default": True,
                            "overlay_icon": "",
                            "overlay_label": "",
                            "overlay_position": "",
                            "overlay_color": "",
                            "order": 1,
                        },
                        {
                            "option_id": "boot",
                            "name": "Rugged Boot",
                            "description": "Added drop protection up to 6ft.",
                            "price_usd": "85.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Shield",
                            "overlay_label": "Rugged Boot",
                            "overlay_position": "bottom-10 left-10",
                            "overlay_color": "bg-green-500 text-white",
                            "order": 2,
                        },
                        {
                            "option_id": "ex",
                            "name": "Full ATEX / Ex-Proof",
                            "description": "Intrinsically safe for hazardous areas.",
                            "price_usd": "800.00",
                            "badge": "",
                            "is_default": False,
                            "overlay_icon": "Shield",
                            "overlay_label": "ATEX Ex-Proof",
                            "overlay_position": "bottom-10 left-10",
                            "overlay_color": "bg-yellow-400 text-black",
                            "order": 3,
                        },
                    ],
                },
            ],
        },
        {
            "category_slug": "scanners",
            "name": "Fixed RFID Reader FX9600",
            "slug": "fixed-rfid-reader-fx9600",
            "short_description": "High-performance fixed RFID reader for dock doors and conveyor lines",
            "full_description": (
                "The FX9600 is an enterprise-grade fixed RFID reader for high-throughput scanning at dock doors, "
                "conveyor belts, and entry/exit points. Supports up to 4 antennas simultaneously with automatic "
                "tag deduplication and real-time inventory tracking."
            ),
            "image_hero": "/images/barcode_scanner_1772490256748.png",
            "image_context": "/images/scanner_context.png",
            "specifications": {
                "Reader Type": "Fixed RFID UHF",
                "Frequency": "860–960 MHz",
                "Antenna Ports": "4 (SMA connectors)",
                "Read Range": "Up to 9 meters (antenna dependent)",
                "Interface": "Gigabit Ethernet, Wi-Fi, USB",
                "Air Protocol": "EPC Gen2 v2 / ISO 18000-63",
                "Output Power": "30 dBm adjustable",
                "Sealing": "IP65",
                "Operating Temp": "-20°C to 55°C",
            },
            "is_configurable": False,
            "is_recommended": False,
            "is_active": True,
            "order": 2,
            "config_sections": [],
        },
        # ── TAGS ─────────────────────────────────────────────────────────────
        {
            "category_slug": "tags",
            "name": "Industrial RFID Tag IT-250",
            "slug": "industrial-rfid-tag-it250",
            "short_description": "Durable RFID tag for asset tracking in harsh industrial environments",
            "full_description": (
                "The IT-250 is an industrial-grade UHF RFID tag built for metal assets, vehicles, and equipment. "
                "On-metal design with adhesive backing and screw-mount option. "
                "Read range up to 8 meters with standard readers."
            ),
            "image_hero": "/images/rfid_tag_hero.png",
            "image_context": "/images/rfid_tag_context.png",
            "specifications": {
                "Type": "UHF RFID (EPC Gen2)",
                "Memory": "96-bit EPC, 32-bit TID",
                "Read Range": "Up to 8m (on metal)",
                "Material": "ABS plastic with embedded antenna",
                "Dimensions": "95mm × 25mm × 9mm",
                "Mounting": "Adhesive (3M) or 2× M4 screw",
                "Temperature": "-40°C to +85°C",
                "IP Rating": "IP67",
                "Certifications": "CE, FCC",
            },
            "is_configurable": False,
            "is_recommended": True,
            "is_active": True,
            "order": 1,
            "config_sections": [],
        },
        {
            "category_slug": "tags",
            "name": "Barcode Label BL-120",
            "slug": "barcode-label-bl120",
            "short_description": "High-durability barcode labels for equipment, shelves, and bins",
            "full_description": (
                "The BL-120 barcode label series is designed for long-term asset identification in warehouses, "
                "healthcare facilities, and outdoor environments. Available in polyester and aluminum variants "
                "with optional lamination for chemical resistance."
            ),
            "image_hero": "/images/barcode_label_hero.png",
            "image_context": "/images/barcode_label_context.png",
            "specifications": {
                "Barcode Formats": "Code 128, Code 39, QR, DataMatrix",
                "Material": "Polyester or anodized aluminum",
                "Print Method": "Thermal transfer or laser",
                "Sizes": "25×13mm to 100×50mm",
                "Adhesive": "Permanent acrylic",
                "Lamination": "Polyester overlaminate (optional)",
                "Temperature": "-40°C to +120°C (laminated)",
                "Chemical Resistance": "Oils, solvents, UV",
            },
            "is_configurable": False,
            "is_recommended": False,
            "is_active": True,
            "order": 2,
            "config_sections": [],
        },
    ],
}


class Command(BaseCommand):
    help = "Seed the database with ABS product catalog data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing products before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            Product.objects.all().delete()
            ProductCategory.objects.all().delete()
            self.stdout.write(
                self.style.WARNING("Cleared all existing products and categories.")
            )

        # Create/update categories
        category_map: dict[str, ProductCategory] = {}
        for cat_data in SEED_DATA["categories"]:
            cat, created = ProductCategory.objects.update_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "description": cat_data["description"],
                    "order": cat_data["order"],
                },
            )
            category_map[cat.slug] = cat
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} category: {cat.name}")

        # Create/update products
        for product_data in SEED_DATA["products"]:
            category = category_map[product_data["category_slug"]]
            config_sections_data = product_data.pop("config_sections", [])
            category_slug = product_data.pop("category_slug")

            product, created = Product.objects.update_or_create(
                slug=product_data["slug"],
                defaults={**product_data, "category": category},
            )
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} product: {product.name}")

            # Create config sections and options
            if config_sections_data:
                # Clear existing config sections for clean re-seed
                product.config_sections.all().delete()
                for section_data in config_sections_data:
                    options_data = section_data.pop("options", [])
                    section = ProductConfigSection.objects.create(
                        product=product, **section_data
                    )
                    for option_data in options_data:
                        ProductConfigOption.objects.create(
                            section=section, **option_data
                        )
                self.stdout.write(
                    f"    → {len(config_sections_data)} config sections created"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeded {len(SEED_DATA['categories'])} categories "
                f"and {len(SEED_DATA['products'])} products."
            )
        )
