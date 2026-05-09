import type { Metadata } from "next";
import { AccountPanel } from "@/components/portal/AccountPanel";

export const metadata: Metadata = {
  title: "Account",
  description: "Export your data or delete your ABS Platform account.",
};

export default function AccountPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Account
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your privacy settings — download a copy of your data or
          delete your account permanently.
        </p>
      </header>
      <AccountPanel />
    </div>
  );
}
