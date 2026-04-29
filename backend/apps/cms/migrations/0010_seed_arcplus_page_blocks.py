"""Seed default Arcplus PageBlock content.

Creates published PageBlock rows for every Arcplus section that previously
had hardcoded copy in the frontend so the live page keeps rendering after
the frontend switches to CMS-driven content. Each block has a stable
`key` so the frontend can resolve it by name.
"""

from django.db import migrations


ARCPLUS_BLOCKS = [
    {
        "key": "arcplus_modules_intro",
        "block_type": "intro",
        "order": 10,
        "title": "Eight modules. One platform.",
        "body": (
            "Each Arcplus module is a focused workflow that plugs into the "
            "shared asset register. Click any module to learn what it does."
        ),
        "data": {"eyebrow": "Modules"},
    },
    {
        "key": "arcplus_lifecycle",
        "block_type": "workflow",
        "order": 20,
        "title": "Visual Lifecycle Management",
        "body": (
            "See exactly where your assets are in their lifecycle context. "
            "The Arcplus dashboard acts as a single pane of glass."
        ),
        "data": {
            "dashboard_label": "Arcplus Dashboard Overview",
            "steps": [
                {
                    "label": "Register",
                    "dashboard_title": "Register Workflow",
                    "dashboard_caption": "Logging new assets into the register…",
                    "icon": "Database",
                },
                {
                    "label": "Operate",
                    "dashboard_title": "Operate Workflow",
                    "dashboard_caption": "Tracking assignments and utilization…",
                    "icon": "Activity",
                },
                {
                    "label": "Maintain",
                    "dashboard_title": "Maintain Workflow",
                    "dashboard_caption": "Scheduling preventive maintenance…",
                    "icon": "Wrench",
                },
                {
                    "label": "Depreciate",
                    "dashboard_title": "Depreciate Workflow",
                    "dashboard_caption": "Calculating period depreciation…",
                    "icon": "Layers",
                },
                {
                    "label": "Dispose",
                    "dashboard_title": "Dispose Workflow",
                    "dashboard_caption": "Generating disposal certificates…",
                    "icon": "Trash2",
                },
            ],
        },
    },
    {
        "key": "arcplus_pricing_intro",
        "block_type": "intro",
        "order": 30,
        "title": "Simple, scale-based pricing.",
        "body": "",
        "data": {},
    },
    {
        "key": "arcplus_feature_comparison",
        "block_type": "feature_comparison",
        "order": 40,
        "title": "Full feature comparison",
        "body": "",
        "data": {
            "toggle_show": "Show full feature comparison",
            "toggle_hide": "Hide full feature comparison",
            "feature_label": "Feature",
            "column_labels": {
                "starter": "Starter",
                "growth": "Growth",
                "pro": "Professional",
                "enterprise": "Enterprise",
            },
        },
    },
    {
        "key": "arcplus_cta",
        "block_type": "cta_banner",
        "order": 50,
        "title": "Transform your asset lifecycle.",
        "body": "",
        "link_text": "Start Free Trial",
        "link_url": "#trial",
        "data": {
            "secondary_label": "Get Quote",
            "secondary_url": "/rfq",
        },
    },
]


def seed_arcplus_blocks(apps, schema_editor):
    PageBlock = apps.get_model("cms", "PageBlock")
    for block in ARCPLUS_BLOCKS:
        PageBlock.objects.update_or_create(
            page="arcplus",
            key=block["key"],
            defaults={
                "block_type": block["block_type"],
                "title": block.get("title", ""),
                "body": block.get("body", ""),
                "icon": block.get("icon", ""),
                "link_url": block.get("link_url", ""),
                "link_text": block.get("link_text", ""),
                "video_url": block.get("video_url", ""),
                "data": block.get("data", {}),
                "order": block["order"],
                "status": "published",
            },
        )


def unseed_arcplus_blocks(apps, schema_editor):
    PageBlock = apps.get_model("cms", "PageBlock")
    PageBlock.objects.filter(
        page="arcplus",
        key__in=[b["key"] for b in ARCPLUS_BLOCKS],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0009_pageblock_key_alter_pageblock_block_type"),
    ]

    operations = [
        migrations.RunPython(seed_arcplus_blocks, unseed_arcplus_blocks),
    ]
