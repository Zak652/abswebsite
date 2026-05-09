from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0002_add_trial_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="arcplustrialsignup",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Provisioning"),
                    ("provisioned", "Provisioned"),
                    ("active", "Active Trial"),
                    ("converted", "Converted"),
                    ("expired", "Expired"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="arcplustrialsignup",
            name="cancelled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="arcplustrialsignup",
            name="cancellation_reason",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
