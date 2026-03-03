# ABS Digital Platform

A full-stack digital showroom for ABS — an asset tracking and management solutions provider. Built for the user journey: **SEE → UNDERSTAND → COMPARE → CONFIGURE → ACT**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 |
| State | Zustand (auth), TanStack Query (server data) |
| Forms | React Hook Form + Zod |
| Backend | Django 5.1 / Django REST Framework 3.15 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Email | Resend |
| Payments | Flutterwave (hosted checkout) |
| Animation | Framer Motion + GSAP |

## Local Development

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ (for local frontend dev outside Docker)

### Start all services

```bash
# Copy backend env file and fill in your values
cp backend/.env.example backend/.env

# Start postgres, redis, django, and next.js
docker compose up
```

| Service | URL |
|---|---|
| Frontend | <http://localhost:3000> |
| Django API | <http://localhost:8000/api/v1/> |
| Django Admin | <http://localhost:8000/django-admin/> |

### Frontend only (without Docker)

```bash
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required backend variables:

- `DJANGO_SECRET_KEY`, `DEBUG`, `DJANGO_SETTINGS_MODULE`
- `POSTGRES_*` — database connection
- `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_SALES_EMAIL`, `RESEND_ADMIN_EMAIL`
- `JWT_SECRET` — used by both Django and Next.js middleware for session cookie verification
- `FRONTEND_URL` — for CORS and Flutterwave redirect URLs

Frontend env (`.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SITE_URL=https://absplatform.com
```

## Routes

### Public

| Route | Description |
|---|---|
| `/` | Homepage — product overview + guided decision flow |
| `/arcplus` | Arcplus SaaS platform — pricing, modules, trial signup |
| `/scanners` | Hardware scanner catalog |
| `/tags` | Asset tag catalog |
| `/configurator` | Hardware configuration tool |
| `/compare` | Product and pricing comparison |
| `/services` | Professional services |
| `/training` | Training sessions + Flutterwave registration |
| `/rfq` | Request for Quote form |
| `/resources/*` | Case studies, docs, API reference, support |

### Auth

| Route | Description |
|---|---|
| `/auth/login` | Email + password login |
| `/auth/register` | Account registration |

### Client Portal (requires login)

| Route | Description |
|---|---|
| `/portal` | Dashboard — RFQs, subscriptions, training overview |
| `/portal/quotes` | Submitted quote history |
| `/portal/subscriptions` | Arcplus trial status |
| `/portal/training` | Training registration history |

### Admin (requires `role=admin`)

| Route | Description |
|---|---|
| `/admin-portal` | Stats dashboard |
| `/admin-portal/quotes` | RFQ management with inline status updates |
| `/admin-portal/subscriptions` | Trial signup management |
| `/admin-portal/training` | Training registration overview |

## Backend API

Base URL: `/api/v1/`

```
POST /auth/register/
POST /auth/login/
POST /auth/token/refresh/
POST /auth/logout/
GET  /auth/me/

POST /rfq/                        Public
GET  /rfq/                        Auth

POST /subscriptions/trial/        Public
GET  /subscriptions/              Auth

GET  /training/sessions/          Public
POST /training/register/          Public → returns Flutterwave payment_link
POST /training/webhook/           Flutterwave webhook (HMAC verified)
GET  /training/registrations/     Auth

GET    /admin/rfq/                Admin
PATCH  /admin/rfq/{id}/           Admin
GET    /admin/subscriptions/      Admin
PATCH  /admin/subscriptions/{id}/ Admin
GET    /admin/training/           Admin
GET    /admin/stats/              Admin
```

## Project Structure

```
abswebsite/
├── backend/                Django 5 API
│   ├── apps/
│   │   ├── accounts/       User model + JWT auth
│   │   ├── rfq/            Quote submissions
│   │   ├── subscriptions/  Arcplus trial signups
│   │   ├── training/       Sessions + Flutterwave
│   │   └── notifications/  Resend email service
│   └── abs_backend/        Django settings (base/local/production)
└── src/                    Next.js frontend
    ├── app/                Route pages (server components + metadata)
    ├── components/
    │   ├── primitives/     Button, Container, Text, Badge
    │   ├── ui/             FormInput, SelectInput, Stepper, LoadingSpinner
    │   ├── auth/           LoginForm, RegisterForm
    │   ├── portal/         PortalSidebar, QuoteCard, SubscriptionStatusCard
    │   ├── admin/          AdminSidebar, DataTable, StatsCard, StatusBadge
    │   └── layout/         Header, Footer
    ├── lib/
    │   ├── api/            Axios client + service modules
    │   ├── hooks/          useAuth, useRFQ, useSubscription, useTraining
    │   └── store/          Zustand authStore
    ├── types/              TypeScript interfaces
    └── middleware.ts       Route protection (portal, admin, auth)
```
