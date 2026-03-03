"use client";

import { useMyTrainingRegistrations } from "@/lib/hooks/useTraining";
import { TrainingRegistrationCard } from "@/components/portal/TrainingRegistrationCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function PortalTrainingPage() {
  const { data: registrations, isLoading } = useMyTrainingRegistrations();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">
            Training Registrations
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your registered training sessions
          </p>
        </div>
        <Link
          href="/training"
          className="text-sm font-medium text-primary-500 hover:text-primary-900 transition-colors"
        >
          Browse Sessions
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !registrations || registrations.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-neutral-100">
              <GraduationCap className="w-6 h-6 text-neutral-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            No training registrations
          </p>
          <p className="text-xs text-neutral-400 mb-4">
            Register for an Arcplus training session to get certified.
          </p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-900 rounded-xl px-5 py-2.5 transition-colors"
          >
            View Training Sessions
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <TrainingRegistrationCard key={reg.id} registration={reg} />
          ))}
        </div>
      )}
    </div>
  );
}
