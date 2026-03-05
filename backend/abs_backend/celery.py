import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "abs_backend.settings.local")

app = Celery("abs")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
