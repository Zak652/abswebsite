# Compliance scope statement

_Last reviewed: 2026-05-09 — owner: ABS engineering._

This document records the compliance posture of the ABS website / Arcplus
trial / training-payment system. It is a working artefact — when the
payment provider, hosting topology, or data-collection surface changes,
this document and `docs/ABS_BUILD_GUIDE.md` must be updated together.

## PCI-DSS v4.0

**Scope: SAQ-A.**

We use Flutterwave Hosted Checkout for the only place this site collects
payment — training course registration. The flow is:

1. User submits the training registration form
   (`POST /api/v1/training/register/`).
2. Backend (`backend/apps/training/views.py`) creates the
   `TrainingRegistration` row in `pending_payment` state and asks
   Flutterwave to create a payment session, receiving a `payment_link`.
3. Browser redirects to `payment_link`, which is on
   `checkout.flutterwave.com`. **Card data is entered, transmitted, and
   stored entirely by Flutterwave**, on infrastructure they assess to
   PCI-DSS Level 1.
4. Flutterwave POSTs a webhook to
   `POST /api/v1/training/payment/webhook/` containing only the
   transaction reference, status, and amount. We verify the HMAC
   signature, recompute the expected amount server-side, and flip the
   row to `paid` if everything matches.

Therefore:

- **No primary account number (PAN), CVC, or expiry date ever touches
  ABS infrastructure.** Web logs, application logs, the database, and
  caches contain none of the above.
- **No card data is stored on ABS systems.** What we keep is the
  Flutterwave transaction reference, the amount we expected, and the
  status — none of which is cardholder data.

This places the merchant (ABS) within the SAQ-A category: e-commerce
merchant who has fully outsourced all account-data functions to a
PCI-DSS-validated third-party service provider, with the hosted payment
page owned and served by that third party.

### What this means in practice

- We do **not** need to commission an external PCI-DSS audit.
- We **do** need to:
  - Maintain Flutterwave as a current PCI-DSS-validated provider (if
    they fall out of compliance we change provider; tracked in our
    runbook).
  - Confirm the integration remains hosted-redirect (not a JS SDK or
    iframe that injects card fields into our DOM). Any deviation
    moves us into SAQ-A-EP and triggers an internal review.
  - Log webhook delivery and signature verification failures (already
    in place — see `apps/training/views.py`).
  - Restrict access to webhook secrets to the production environment
    only (managed via DigitalOcean App Platform env-var groups; not
    in committed config).
  - Re-confirm scope when adding any new payment method.

## GDPR / data protection

See [Privacy Policy](../src/app/privacy/page.tsx) for the user-facing
statement. Internal controls:

- **Lawful basis** is one of: explicit consent (cookies), contract
  (account/trial/training), legitimate interest (security, abuse
  prevention), legal obligation (financial records).
- **Subject access** is self-service: `GET /api/v1/auth/me/export/`
  surfaces a complete JSON copy of every user-linked record.
- **Erasure** is self-service: `POST /api/v1/auth/me/delete/`
  anonymises the user row and PII fields on linked records, cancels
  active subscriptions, blacklists refresh tokens, and emails a
  confirmation to the original address. See
  [`apps/accounts/gdpr.py`](../backend/apps/accounts/gdpr.py).
- **Audit trail** for admin mutations runs through
  `cms.AuditedAdminMixin` (build guide § 3.9 B7); user-self actions
  (export, delete, login) write `AuditLog` rows directly.
- **Data retention** is documented per record type in the privacy
  policy. The actual retention sweeps are not yet automated — that
  becomes a follow-up Celery beat task once we have a year of
  production data to validate the retention windows against.

## Subprocessors

| Subprocessor   | Purpose                              | Region           |
|----------------|--------------------------------------|------------------|
| DigitalOcean   | Application + database hosting       | EU/US (App Platform region)  |
| Cloudflare     | CDN, DDoS, WAF; R2 for media         | Global edge      |
| Resend         | Transactional email                  | US               |
| Flutterwave    | Payment processing (training fees)   | NG / regional    |
| Sentry         | Error monitoring                     | US (PII scrubbing on) |

Material change to this list (adding, removing, or changing region of a
subprocessor that handles personal data) requires an update to both
this document and the user-facing privacy policy, with 14 days notice
to active users.

## Records to retain for compliance review

- This document, in version control with commit history.
- The privacy policy and terms of service, with their `LAST_UPDATED`
  fields kept current.
- The Flutterwave PCI-DSS Attestation of Compliance (AoC) — request
  annually from Flutterwave and store in a private location (not the
  public repo).
- `AuditLog` entries — retained for 24 months minimum for compliance
  trace and dispute defence.
