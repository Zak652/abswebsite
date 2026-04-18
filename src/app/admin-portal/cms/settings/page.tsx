"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useAdminSettings, useUpdateSettings } from "@/lib/hooks/useCMSAdmin";

export default function SettingsPage() {
    const { data: settings, isLoading } = useAdminSettings();
    const updateSettings = useUpdateSettings();

    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [ogImage, setOgImage] = useState("");
    const [gaId, setGaId] = useState("");
    const [currencyRates, setCurrencyRates] = useState("{}");
    const [socialLinks, setSocialLinks] = useState("{}");
    const [orgSchema, setOrgSchema] = useState("{}");
    const [currencyJsonError, setCurrencyJsonError] = useState(false);
    const [socialJsonError, setSocialJsonError] = useState(false);
    const [schemaJsonError, setSchemaJsonError] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initialize form from fetched data once
    if (settings && !initialized) {
        setPhone(settings.company_phone || "");
        setEmail(settings.company_email || "");
        setAddress(settings.company_address || "");
        setOgImage(settings.default_og_image || "");
        setGaId(settings.google_analytics_id || "");
        setCurrencyRates(JSON.stringify(settings.currency_rates || {}, null, 2));
        setSocialLinks(JSON.stringify(settings.social_links || {}, null, 2));
        setOrgSchema(JSON.stringify(settings.organization_schema || {}, null, 2));
        setInitialized(true);
    }

    const handleJsonChange = (
        setter: (v: string) => void,
        errorSetter: (v: boolean) => void,
        value: string
    ) => {
        setter(value);
        try {
            JSON.parse(value);
            errorSetter(false);
        } catch {
            errorSetter(true);
        }
    };

    const handleSave = () => {
        let parsedRates: Record<string, number> = {};
        let parsedSocial: Record<string, string> = {};
        let parsedSchema: Record<string, unknown> = {};
        try {
            parsedRates = JSON.parse(currencyRates);
            parsedSocial = JSON.parse(socialLinks);
            parsedSchema = JSON.parse(orgSchema);
        } catch {
            return;
        }
        updateSettings.mutate({
            company_phone: phone,
            company_email: email,
            company_address: address,
            default_og_image: ogImage || null,
            google_analytics_id: gaId,
            currency_rates: parsedRates,
            social_links: parsedSocial,
            organization_schema: parsedSchema,
        } as unknown as Parameters<typeof updateSettings.mutate>[0]);
    };

    const hasJsonError = currencyJsonError || socialJsonError || schemaJsonError;

    if (isLoading) {
        return <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Loading…</div>;
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900 font-heading">Site Settings</h1>
                    <p className="text-sm text-neutral-500 mt-1">Global configuration (singleton)</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateSettings.isPending || hasJsonError}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    {updateSettings.isPending ? "Saving…" : "Save Settings"}
                </button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
                <h2 className="text-sm font-semibold text-primary-900">Company Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Phone</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Address</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                </div>

                <hr className="border-neutral-100" />

                <h2 className="text-sm font-semibold text-primary-900">SEO & Analytics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Default OG Image URL</label>
                        <input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Google Analytics ID</label>
                        <input value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                </div>

                <hr className="border-neutral-100" />

                <h2 className="text-sm font-semibold text-primary-900">JSON Fields</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Currency Rates <span className="font-normal text-neutral-400">{`{"USD": 1, "UGX": 3750}`}</span>
                        </label>
                        <textarea
                            value={currencyRates}
                            onChange={(e) => handleJsonChange(setCurrencyRates, setCurrencyJsonError, e.target.value)}
                            rows={3}
                            className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${currencyJsonError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                        />
                        {currencyJsonError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Social Links <span className="font-normal text-neutral-400">{`{"twitter": "https://…"}`}</span>
                        </label>
                        <textarea
                            value={socialLinks}
                            onChange={(e) => handleJsonChange(setSocialLinks, setSocialJsonError, e.target.value)}
                            rows={3}
                            className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${socialJsonError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                        />
                        {socialJsonError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Organization Schema (JSON-LD)</label>
                        <textarea
                            value={orgSchema}
                            onChange={(e) => handleJsonChange(setOrgSchema, setSchemaJsonError, e.target.value)}
                            rows={4}
                            className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono ${schemaJsonError ? "border-red-400 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"}`}
                        />
                        {schemaJsonError && <p className="text-[10px] text-red-500 mt-1">Invalid JSON</p>}
                    </div>
                </div>
            </div>

            {settings?.updated_at && (
                <p className="text-xs text-neutral-400 mt-4 text-right">
                    Last updated: {new Date(settings.updated_at).toLocaleString()}
                </p>
            )}
        </div>
    );
}
