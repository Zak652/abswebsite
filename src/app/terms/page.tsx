import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description:
        "The terms governing use of the ABS Platform website, Arcplus software trial, and associated services.",
};

const LAST_UPDATED = "9 May 2026";

export default function TermsPage() {
    return (
        <main className="bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-neutral">
                <header className="not-prose mb-10">
                    <h1 className="text-3xl font-bold font-heading text-primary-900 mb-2">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
                </header>

                <p>
                    These Terms govern your use of the websites, applications, and
                    services operated by Asset Business Solutions Ltd. (&quot;ABS&quot;,
                    &quot;we&quot;) at absplatform.com and absasset.com, including the Arcplus
                    asset-management software trial. By creating an account, requesting
                    a quote, registering for a training session, or otherwise using
                    these Services, you agree to these Terms.
                </p>

                <h2>1. Eligibility</h2>
                <p>
                    You must be at least 18 years old and authorised to bind the
                    organisation you represent. If you&apos;re using the Services on behalf
                    of a company, &quot;you&quot; means that company.
                </p>

                <h2>2. Your account</h2>
                <p>
                    You&apos;re responsible for keeping your credentials confidential. Notify
                    us immediately if you suspect unauthorised access. We may suspend or
                    terminate accounts that violate these Terms or applicable law.
                </p>

                <h2>3. Trials and subscriptions</h2>
                <p>
                    The Arcplus trial gives you time-limited access to evaluate the
                    software. We make no commercial commitment to renew, extend, or
                    convert a trial into a paid subscription. You can cancel your trial
                    at any time from <a href="/portal/subscriptions">/portal/subscriptions</a>.
                </p>

                <h2>4. Training fees and refunds</h2>
                <p>
                    Training course fees are due in full at registration via Flutterwave.
                    Cancellations made more than 7 days before the session start date are
                    refundable in full minus a 10% processing fee; cancellations within
                    7 days are non-refundable. We may relocate, reschedule, or cancel a
                    session at our discretion — if we do, you receive a full refund.
                </p>

                <h2>5. Acceptable use</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Probe, scan, or test the vulnerability of the Services without prior written authorisation.</li>
                    <li>Bypass authentication, rate limits, or access controls.</li>
                    <li>Submit content that is unlawful, infringing, or designed to harm others.</li>
                    <li>Use the Services to send unsolicited bulk communications.</li>
                    <li>Reverse-engineer, scrape, or republish the Services beyond what these Terms or fair use allow.</li>
                </ul>

                <h2>6. Intellectual property</h2>
                <p>
                    All trademarks, logos, software, and content on the Services are
                    owned by ABS or our licensors. Nothing in these Terms grants you any
                    rights in our IP beyond the limited licence needed to use the
                    Services for their intended purpose.
                </p>
                <p>
                    Content you submit (e.g. company information on RFQs, account
                    profile data) remains yours; you grant us a limited licence to host
                    and process it solely to deliver the Services.
                </p>

                <h2>7. Privacy</h2>
                <p>
                    Our handling of personal data is described in the{" "}
                    <a href="/privacy">Privacy Policy</a>, which forms part of these
                    Terms.
                </p>

                <h2>8. Disclaimers</h2>
                <p>
                    The Services are provided &quot;as is&quot; without warranties of any kind,
                    express or implied, to the maximum extent permitted by law. We do
                    not warrant that the Services will be uninterrupted, error-free, or
                    fit for any particular purpose. Trial environments may be wiped
                    between releases.
                </p>

                <h2>9. Limitation of liability</h2>
                <p>
                    To the fullest extent permitted by applicable law, ABS&apos;s aggregate
                    liability under these Terms is limited to the amounts you paid to
                    ABS in the 12 months preceding the claim, or USD 100 if no payment
                    was made. ABS is not liable for indirect, incidental, special,
                    consequential, or punitive damages.
                </p>

                <h2>10. Indemnity</h2>
                <p>
                    You agree to defend and indemnify ABS against any claim arising from
                    your breach of these Terms or your misuse of the Services.
                </p>

                <h2>11. Termination</h2>
                <p>
                    You may stop using the Services at any time and delete your account
                    from <a href="/portal/account">/portal/account</a>. We may suspend or
                    terminate your access for cause (including but not limited to breach
                    of these Terms, fraud, or risk to the Service). On termination,
                    these Terms cease to apply except for sections that by their nature
                    survive (intellectual property, disclaimers, liability, indemnity,
                    governing law).
                </p>

                <h2>12. Governing law</h2>
                <p>
                    These Terms are governed by the laws of Uganda. Disputes that cannot
                    be resolved by negotiation will be submitted to the exclusive
                    jurisdiction of the courts of Kampala.
                </p>

                <h2>13. Changes</h2>
                <p>
                    We may update these Terms from time to time. Material changes will
                    be announced at least 14 days before they take effect. Continued use
                    of the Services after the effective date means you accept the new
                    Terms.
                </p>

                <h2>14. Contact</h2>
                <p>
                    For questions about these Terms, email{" "}
                    <a href="mailto:legal@absasset.com">legal@absasset.com</a> or write
                    to: Asset Business Solutions Ltd., Plot 2048, Block 80, Buwambo,
                    Wakiso, Uganda.
                </p>
            </div>
        </main>
    );
}
