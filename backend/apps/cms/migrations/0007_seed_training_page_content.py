from django.db import migrations


HERO_DEFAULTS = {
    "headline": "Training Academy",
    "subheadline": (
        "Empower your team. Become certified in asset lifecycle management "
        "and hardware deployment."
    ),
    "cta_primary_text": "",
    "cta_primary_link": "",
    "cta_secondary_text": "",
    "cta_secondary_link": "",
    "variant": "overlay",
    "eyebrow": "",
}

SIDEBAR_DEFAULTS = {
    "title": "Need private team training?",
    "body": (
        "We can deliver custom curriculum tailored specifically to your "
        "company\u2019s instance of Arcplus and operating procedures."
    ),
    "link_text": "Request Custom Quote",
    "link_url": "/rfq",
    "order": 0,
}

TRAINING_SETTINGS_DEFAULTS = {
    "sessions_heading": "Upcoming Sessions",
    "no_sessions_message": "No upcoming sessions at this time. Check back soon.",
    "low_seats_template": "Only {count} seat{plural} remaining",
    "register_button_label": "Register Now",
    "full_button_label": "Session Full",
}


def seed_training_content(apps, schema_editor):
    HeroSection = apps.get_model("cms", "HeroSection")
    PageBlock = apps.get_model("cms", "PageBlock")
    TrainingPageSettings = apps.get_model("cms", "TrainingPageSettings")

    HeroSection.objects.get_or_create(
        page="training",
        defaults={**HERO_DEFAULTS, "status": "published"},
    )

    PageBlock.objects.get_or_create(
        page="training",
        block_type="cta_banner",
        defaults={**SIDEBAR_DEFAULTS, "status": "published"},
    )

    TrainingPageSettings.objects.get_or_create(
        pk=1, defaults=TRAINING_SETTINGS_DEFAULTS
    )


def unseed_training_content(apps, schema_editor):
    # Best-effort reverse: only remove records that match our defaults exactly,
    # to avoid clobbering admin edits.
    HeroSection = apps.get_model("cms", "HeroSection")
    PageBlock = apps.get_model("cms", "PageBlock")
    TrainingPageSettings = apps.get_model("cms", "TrainingPageSettings")

    HeroSection.objects.filter(
        page="training", headline=HERO_DEFAULTS["headline"]
    ).delete()
    PageBlock.objects.filter(
        page="training",
        block_type="cta_banner",
        title=SIDEBAR_DEFAULTS["title"],
    ).delete()
    TrainingPageSettings.objects.filter(pk=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0006_trainingpagesettings"),
    ]

    operations = [
        migrations.RunPython(seed_training_content, unseed_training_content),
    ]
