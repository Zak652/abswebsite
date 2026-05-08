# ABS Website — Stakeholder Brief

A non-technical summary of where the ABS website project stands, what's risky, and what we're building next. Written for founders, managers, and reviewers — not engineers.

> Engineering counterpart with full detail: [`ABS_BUILD_GUIDE.md`](./ABS_BUILD_GUIDE.md).

---

## 1. The vision in one paragraph

The ABS website is a **self-guided digital showroom** for an enterprise asset-tracking business — benchmarked against apple.com. A visitor should be able to land on the site, understand the products, compare options, configure hardware, and complete a purchase or quote request **without ever speaking to sales**. Imagery does most of the work: clean product shots, real-environment context, close-up detail, and software walkthroughs. The site sells access to the Arcplus platform, hardware (scanners and tags), professional services, and training. It accepts payments through a hosted Flutterwave checkout and runs an in-house content management system so non-engineers can update pages, pricing, and stories.

---

## 2. Where we are today

A more honest picture than the original launch-readiness matrix. The site is further along than that document suggests, but several launch-blocking risks remain.

### 2.1 What's working

- **Product experience.** The homepage, Arcplus page, scanners page, tags page, configurator, comparison view, pricing, training catalogue, and request-for-quote (RFQ) flow are all built and click-throughable. Mega menus, mobile guided navigation, and a working CMS are in place.
- **Payments.** Training registration redirects to a Flutterwave hosted checkout and receives a callback. The plumbing works.
- **Content management.** The CMS lets non-engineers manage pages, posts, media, navigation, redirects, and email templates with scheduled publishing.
- **Local development.** The site can be brought up on any developer machine alongside other Docker projects without port collisions (recently hardened).

### 2.2 What's not working well enough yet

| Area | Status | Headline issue |
|---|---|---|
| Payment integrity | 🔴 Not safe to take real money | Several bypasses possible in the webhook validation |
| Authentication | 🔴 Hardening needed | Sessions and refresh tokens stored in browser-readable places |
| Security headers | 🔴 Missing | No content-security policy, no transport-security headers, no clickjacking protection |
| Abuse prevention | 🟠 Open | No rate limiting on login, registration, or quote forms; no account lockout |
| Content safety | 🟠 Open | Admin can paste raw HTML into pages with no sanitisation |
| Production setup | 🟠 Not built | No production Docker images, no reverse proxy, no SSL, no media storage off-server |
| Monitoring | 🟠 Not built | No error tracking, no uptime alerts, no business metrics |
| Compliance | 🟠 Open | No privacy policy, terms, cookie banner, or data export/delete |
| Apple-grade polish | 🟡 Aspirational | Configurator, compare, and product galleries work but don't yet feel like a showroom |
| Tests and CI | 🟠 Sparse | Some frontend tests; almost none on the backend; no automated checks on pull requests |

🔴 = blocks launch. 🟠 = ship-stopper before going public. 🟡 = elevation work after launch.

---

## 3. Top risks (plain English)

### 3.1 We could lose money on payments

The Flutterwave webhook (the message that confirms a payment was successful) isn't being validated correctly. A motivated attacker could mark unpaid registrations as "paid", or change the amount the system records. If two confirmation messages arrive at the same time, the system could process both. **What we're doing:** rebuild webhook validation against the raw payload, lock the database row during the update, recalculate the price on the server, reject events that arrive too late. All in Phase 0.

### 3.2 Customer accounts are easier to compromise than they should be

The login session and refresh token are kept in browser storage that JavaScript can read. If someone manages to inject a script (through a vulnerable dependency, a CMS field, or a third-party widget), they can steal credentials. There's also no lockout after repeated bad logins. **What we're doing:** move session and refresh tokens to secure cookies, add rate limiting and lockouts, layer on industry-standard browser security headers. Phase 0.

### 3.3 We have no idea when something breaks

There's no error tracking, no uptime monitoring, no alerting. A payment could fail silently for hours and we wouldn't know. **What we're doing:** add Sentry (error tracking) on both backend and frontend, structured logs, request correlation IDs, and a `/health` endpoint. Phase 1.

### 3.4 Every change goes straight to main

There's no automated check on pull requests — no linter, no test runner, no security scan. A typo or a regression can land on the main branch unnoticed. **What we're doing:** GitHub Actions running lint, types, tests, build, dependency audit, and container scan on every pull request. Branch protection so main can't be updated without those checks. Phase 1.

### 3.5 We are not GDPR-presentable

There is no privacy policy, no terms, no cookie banner, no way for a user to export or delete their data. For a B2B site with EU prospects this is exposure. **What we're doing:** privacy + terms pages, cookie consent banner, self-serve data export and delete endpoints. Phase 1.

### 3.6 The showroom isn't yet a showroom

The pages exist but the *feel* — the scroll choreography, the per-product image storytelling, the live configurator — is below the apple.com bar the vision sets. **What we're doing:** Phase 2 work to build the full visual gallery system per product, real-time configurator pricing, smooth pricing transitions, and other polish.

---

## 4. The roadmap

We've split the work into three phases. Sizes are rough effort bands, not dates — they sharpen once a delivery cadence and team size are agreed.

### Phase 0 — Critical security and launch blockers (size: M)

**Done when:** the site is safe to take real customer payments. No public payment go-live until this phase is closed.

- Fix all payment integrity issues (correct signature verification, atomic updates, server-side amount, replay protection).
- Harden authentication (HttpOnly cookies, refresh-token storage fix, session security flags, brute-force protection).
- Add the standard set of browser security headers (CSP, HSTS, clickjacking protection).
- Sanitise CMS HTML, validate file uploads, block server-side request forgery on URL fields.
- Make production fail closed if any required secret or hostname is missing.

### Phase 1 — Launch-quality polish (size: L)

**Done when:** the site is ready for a public soft-launch.

- Accessibility: WCAG AA across the showroom routes — focus traps, alt text, keyboard nav, motion preferences, contrast.
- SEO: structured data on products and articles, image sitemap, canonical URLs.
- Performance: Lighthouse ≥ 90 on the four hero routes; pick one animation library; tighter image rules.
- Visible UX gaps: image-led hero on the scanner and tag list pages; sticky configurator summary; "recommended" treatment in the comparison; CMS-driven (not hard-coded) data.
- Observability: Sentry, structured logs, request IDs, health check.
- CI/CD: lint, types, tests, build, security scans on every PR; branch protection.
- Production deploy: real Dockerfiles, gunicorn, reverse proxy, SSL, S3/R2 for media, backups.
- Compliance: privacy / terms / cookie consent / data export-delete endpoints.
- Tests: ≥ 60 % backend coverage; key user journeys covered end-to-end.

### Phase 2+ — Apple-grade polish and feature roadmap (size: L–XL)

**Done when:** the site lives up to the vision document.

- Per-product visual gallery system (HERO → CONTEXT → DETAIL → USE-CASE → CONFIG).
- Configurator: real-time pricing from the API, shareable URLs, save-to-account.
- Comparison: dynamic data, multi-product up to 4 columns, recommended treatment.
- Scroll choreography across pricing, modules grid, and product pages.
- Multi-factor authentication for admins; full admin audit log; soft-delete for customer data.
- API versioning with auto-generated OpenAPI documentation.
- End-to-end tests with Playwright; visual regression tests.
- Developer experience: Makefile, pre-commit hooks, ADRs, runbooks, architecture diagram.

---

## 5. What "good" looks like at the end of each phase

- **End of Phase 0.** A security review and a webhook-replay test both pass. We can confidently take Sandile's first £100 in training revenue.
- **End of Phase 1.** A new visitor on a mobile phone can find a product, understand it, request a quote, register for training and pay — without our team knowing or intervening. If anything breaks, we know within 60 seconds.
- **End of Phase 2.** Someone scrolling the homepage on an iPad describes the experience as "Apple-style." A non-engineer at ABS publishes a new product page from the CMS without help. A new engineer joining the team can ship a fix on day one.

---

## 6. Decisions we need from you

The engineering plan can move forward on most points autonomously, but a handful of choices need stakeholder direction. The sooner these are made, the less rework is needed later.

| Decision | Why it matters | Default if unanswered |
|---|---|---|
| Hosting target (AWS / Cloudflare / Railway / Fly) | Drives Dockerfile, secrets vault, media-storage choice | Cloudflare Pages + R2 + a small Postgres host (lowest cost, Africa-friendly latency) |
| Monitoring vendor (Sentry alone vs. Sentry + Datadog/Grafana) | Affects ongoing cost and observability depth | Sentry only on free tier for now |
| Refresh-token strategy (HttpOnly cookie vs. in-memory only) | Affects user experience on tab close | HttpOnly cookie — keeps users logged in across reloads |
| Image transform service (Next.js built-in vs. Cloudinary/Imgix) | Affects monthly cost and image quality | Next.js built-in initially; revisit at >100k page views/month |
| Stripe yes/no | An unused Stripe webhook secret currently lives in settings | Remove until/unless Stripe is needed |
| Owner for content sign-off (pricing, copy, imagery) | Final review gate for what goes live | Marketing — needs an explicit name |
| Launch criteria sign-off | Who declares Phase 0 / Phase 1 done | Founder / GM — needs an explicit name |

---

## 7. What to ask if you want a status check

- "Where are we against Phase 0?" — every item is in the build guide § 2 with an acceptance test. Engineering can read out the checklist.
- "Has anything in production broken in the last 24 hours?" — once Sentry is wired in Phase 1, this becomes a one-line answer.
- "What's the biggest risk this week?" — refer to § 3 here, updated as items close.

---

*This brief is intentionally short. For full technical detail, file paths, and acceptance tests, see [`ABS_BUILD_GUIDE.md`](./ABS_BUILD_GUIDE.md).*
