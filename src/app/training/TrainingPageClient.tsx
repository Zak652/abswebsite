"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, List, MapPin, Users } from "lucide-react";
import { useTrainingSessions } from "@/lib/hooks/useTraining";
import { TrainingRegistrationModal } from "@/components/training/TrainingRegistrationModal";
import { TrainingCalendar } from "@/components/training/TrainingCalendar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TrainingSession } from "@/types/training";

type ViewMode = "list" | "calendar";
type Currency = "USD" | "UGX" | "KES";

const DEFAULT_RATES: Record<Currency, number> = { USD: 1, UGX: 3700, KES: 130 };
const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", UGX: "UGX ", KES: "KES " };

const levelStyles: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  advanced: "bg-blue-100 text-blue-700",
  expert: "bg-primary-900 text-white",
};

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  advanced: "Advanced",
  expert: "Expert",
};

interface TrainingPageClientProps {
  currencyRates: Record<string, number> | null;
}

export function TrainingPageClient({ currencyRates }: TrainingPageClientProps) {
  const RATES: Record<Currency, number> = {
    USD: 1,
    UGX: currencyRates?.UGX ?? DEFAULT_RATES.UGX,
    KES: currencyRates?.KES ?? DEFAULT_RATES.KES,
  };

  function formatPrice(priceUSD: string, currency: Currency): string {
    const usd = Number(priceUSD);
    if (isNaN(usd)) return "—";
    const converted = Math.round(usd * RATES[currency]);
    return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString()}`;
  }
  const { data: sessions, isLoading } = useTrainingSessions();
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("abs_preferred_currency");
    if (saved === "USD" || saved === "UGX" || saved === "KES") setCurrency(saved);
  }, []);

  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem("abs_preferred_currency", c);
  };

  const formatSessionDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">
            Training Academy
          </h1>
          <p className="text-xl text-primary-900/60 max-w-2xl">
            Empower your team. Become certified in asset lifecycle management
            and hardware deployment.
          </p>
        </div>

        <motion.div
          className="mb-16 w-full rounded-[2rem] overflow-hidden shadow-xl relative h-[300px] md:h-[400px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/images/training_hero.png"
            alt="Corporate training session in a modern boardroom"
            fill
            className="object-cover object-top"
            priority
          />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Main content: sessions */}
          <div className="md:col-span-2">
            {/* Controls bar: view mode + currency */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold font-heading text-primary-900">
                Upcoming Sessions
              </h2>

              <div className="flex items-center gap-3">
                {/* Currency toggle */}
                <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1">
                  {(["USD", "UGX", "KES"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCurrencyChange(c)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currency === c
                        ? "bg-white text-primary-900 shadow-sm"
                        : "text-primary-900/50 hover:text-primary-900"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* View toggle */}
                <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-full transition-all ${viewMode === "list"
                      ? "bg-white text-primary-900 shadow-sm"
                      : "text-primary-900/50 hover:text-primary-900"
                      }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`p-1.5 rounded-full transition-all ${viewMode === "calendar"
                      ? "bg-white text-primary-900 shadow-sm"
                      : "text-primary-900/50 hover:text-primary-900"
                      }`}
                    aria-label="Calendar view"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-neutral-100 text-center">
                <p className="text-primary-900/60">
                  No upcoming sessions at this time. Check back soon.
                </p>
              </div>
            ) : viewMode === "calendar" ? (
              <TrainingCalendar
                sessions={sessions}
                onSelectSession={setSelectedSession}
              />
            ) : (
              <div className="space-y-6">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-3 ${levelStyles[session.level] ?? "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {levelLabels[session.level] ?? session.level}
                        </span>
                        <h3 className="text-2xl font-bold font-heading text-primary-900">
                          {session.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-2xl font-bold font-mono text-accent-500">
                          {formatPrice(session.price_usd, currency)}
                        </p>
                        <p className="text-xs text-primary-900/40">per person</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center text-primary-900/70">
                        <Calendar className="w-5 h-5 mr-2 text-accent-500 shrink-0" />
                        <span className="text-sm font-medium">
                          {formatSessionDate(session.date)}
                        </span>
                      </div>
                      <div className="flex items-center text-primary-900/70">
                        <Clock className="w-5 h-5 mr-2 text-accent-500 shrink-0" />
                        <span className="text-sm font-medium">
                          {session.time_start} – {session.time_end}
                        </span>
                      </div>
                      <div className="flex items-center text-primary-900/70">
                        <MapPin className="w-5 h-5 mr-2 text-accent-500 shrink-0" />
                        <span className="text-sm font-medium">
                          {session.location}
                        </span>
                      </div>
                    </div>

                    {session.seats_remaining <= 5 && session.seats_remaining > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-accent-500 mb-4">
                        <Users className="w-3.5 h-3.5" />
                        Only {session.seats_remaining} seat
                        {session.seats_remaining !== 1 ? "s" : ""} remaining
                      </div>
                    )}

                    <button
                      onClick={() =>
                        session.seats_remaining > 0
                          ? setSelectedSession(session)
                          : undefined
                      }
                      disabled={session.seats_remaining === 0}
                      className={`w-full py-4 rounded-xl font-medium transition-colors ${session.seats_remaining > 0
                        ? "bg-accent-500 text-white hover:bg-accent-600"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      {session.seats_remaining > 0 ? "Register Now" : "Session Full"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Private Training Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-primary-900 rounded-3xl p-8 sticky top-32">
              <h2 className="text-2xl font-bold font-heading text-white mb-4">
                Need private team training?
              </h2>
              <p className="text-white/70 mb-8">
                We can deliver custom curriculum tailored specifically to your
                company&apos;s instance of Arcplus and operating procedures.
              </p>
              <Link
                href="/rfq"
                className="block w-full py-4 bg-accent-500 text-white font-medium rounded-xl hover:bg-accent-600 transition-colors text-center"
              >
                Request Custom Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      <TrainingRegistrationModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
