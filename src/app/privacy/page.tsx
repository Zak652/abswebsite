import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "How ABS Platform collects, uses, retains, and protects personal data — including your rights to access, correct, and delete your information.",
};

const LAST_UPDATED = "9 May 2026";

export default function PrivacyPage() {
    return (
        <main className="bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-neutral">
                <header className="not-prose mb-10">
                    <h1 className="text-3xl font-bold font-heading text-primary-900 mb-2">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
                </header>

                <p>
                    Asset Business Solutions Ltd. (&quot;ABS&quot;, &quot;we&quot;) operates absplatform.com,
                    the Arcplus asset-management software, and associated services (the
                    &quot;Service&quot;). This policy explains what personal data we collect,
                    why, how long we keep it, and how you can exercise your rights.
                </p>

                <h2>1. What we collect</h2>
                <ul>
                    <li>
                        <strong>Account profile</strong>: full name, work email, phone, company name.
                    </li>
                    <li>
                        <strong>Quote requests (RFQs)</strong>: the company details and asset
                        scope you provide on the RFQ form.
                    </li>
                    <li>
                        <strong>Training registrations</strong>: name, email, phone, company,
                        and the session you registered for. Payment is handled by Flutterwave;
                        we never see card numbers (see § 6 below).
                    </li>
                    <li>
                        <strong>Trial signups</strong>: company details and the plan you chose.
                    </li>
                    <li>
                        <strong>Service requests</strong>: the contact details and project scope
                        you submit when asking for asset register, verification, or other
                        field services.
                    </li>
                    <li>
                        <strong>Operational logs</strong>: request IDs, IP addresses, user-agent
                        strings, and admin actions. These tell us who did what and when, so we
                        can debug, defend the service, and respond to incidents.
                    </li>
                </ul>

                <h2>2. What we do with it</h2>
                <p>We use this data only to:</p>
                <ul>
                    <li>Run the Service (provision your trial, send your training receipt, etc.).</li>
                    <li>Respond to your sales / support requests.</li>
                    <li>Detect and prevent abuse (rate-limiting, fraud signals, account lockouts).</li>
                    <li>Meet our legal and accounting obligations.</li>
                </ul>
                <p>
                    We do <strong>not</strong> sell your data, and we do not share it with
                    third parties for advertising. Our subprocessors are listed in § 5.
                </p>

                <h2>3. Legal basis</h2>
                <p>
                    We process your data on the basis of: (a) your consent (e.g. cookie
                    preferences); (b) the contract you enter when you sign up or request a
                    quote; (c) our legitimate interest in running and securing the Service;
                    and (d) where required, our legal obligations.
                </p>

                <h2>4. How long we keep it</h2>
                <ul>
                    <li>
                        <strong>RFQ submissions</strong>: 24 months from the last interaction.
                    </li>
                    <li>
                        <strong>Trial signup data</strong>: 12 months after the trial ends.
                    </li>
                    <li>
                        <strong>Training registrations</strong>: 24 months for financial and
                        compliance records (transaction data persists in anonymised form
                        beyond that).
                    </li>
                    <li>
                        <strong>Operational logs</strong>: 12 months.
                    </li>
                    <li>
                        <strong>Account data after deletion</strong>: profile fields are
                        anonymised immediately on self-service delete; the underlying account
                        row is preserved as a tombstone for audit-trail integrity but contains
                        no PII.
                    </li>
                </ul>

                <h2>5. Subprocessors</h2>
                <p>We rely on the following third parties, each with their own data-protection terms:</p>
                <ul>
                    <li><strong>DigitalOcean</strong> — application hosting (EU/US regions).</li>
                    <li><strong>Cloudflare</strong> — CDN and DDoS protection.</li>
                    <li><strong>Resend</strong> — transactional email.</li>
                    <li><strong>Flutterwave</strong> — payment processing for training course fees.</li>
                    <li><strong>Sentry</strong> — error monitoring (PII scrubbing enabled).</li>
                </ul>

                <h2>6. Payments</h2>
                <p>
                    Card data for training payments is collected by Flutterwave on their
                    own hosted checkout pages. We never receive card numbers, CVCs, or
                    expiry dates — only Flutterwave&apos;s transaction reference and the
                    amount. We are PCI-DSS SAQ-A in scope.
                </p>

                <h2>7. Your rights</h2>
                <ul>
                    <li>
                        <strong>Access</strong>: download a complete JSON copy of every
                        record we hold about you from{" "}
                        <a href="/portal/account">/portal/account</a>.
                    </li>
                    <li>
                        <strong>Correction</strong>: update your profile from the same page,
                        or by replying to any email you receive from us.
                    </li>
                    <li>
                        <strong>Erasure</strong>: delete your account from{" "}
                        <a href="/portal/account">/portal/account</a>. We anonymise PII in
                        adjacent records (RFQs, training, subscriptions) on the same
                        request; financial records are retained without your name attached
                        for as long as accounting law requires.
                    </li>
                    <li>
                        <strong>Objection / restriction</strong>: email{" "}
                        <a href="mailto:privacy@absasset.com">privacy@absasset.com</a> with
                        the specific processing you wish to restrict.
                    </li>
                    <li>
                        <strong>Complaint</strong>: you may lodge a complaint with the data
                        protection authority in your jurisdiction.
                    </li>
                </ul>

                <h2>8. Cookies</h2>
                <p>
                    We use only first-party cookies that are strictly necessary to operate
                    the Service:
                </p>
                <ul>
                    <li>
                        <code>abs_session</code> — session JWT (HttpOnly, SameSite=Strict).
                    </li>
                    <li>
                        <code>abs_refresh</code> — refresh token (HttpOnly, SameSite=Lax,
                        path-limited to <code>/api/v1/auth/</code>).
                    </li>
                </ul>
                <p>
                    We do not run third-party advertising or cross-site tracking. If we
                    ever add analytics, we will surface a consent banner before any
                    non-essential cookie is set.
                </p>

                <h2>9. Contact</h2>
                <p>
                    Questions about this policy or your data? Email{" "}
                    <a href="mailto:privacy@absasset.com">privacy@absasset.com</a> or
                    write to: Asset Business Solutions Ltd., Plot 2048, Block 80,
                    Buwambo, Wakiso, Uganda.
                </p>

                <h2>10. Changes</h2>
                <p>
                    Material changes to this policy will be announced by email to active
                    users at least 14 days before they take effect. The current version
                    always lives at this URL with a &quot;last updated&quot; date.
                </p>
            </div>
        </main>
    );
}
