import environ
from .base import *  # noqa: F401, F403

env = environ.Env()

# Read .env file if it exists
from pathlib import Path

_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    environ.Env.read_env(_env_file)

DEBUG = True

# Re-read settings that depend on .env (base.py evaluated before read_env)
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3001")
REVALIDATION_SECRET = env("REVALIDATION_SECRET", default="")

ALLOWED_HOSTS = ["*"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://localhost:3001",
]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
