import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "abs_backend.settings.production")

application = get_wsgi_application()
