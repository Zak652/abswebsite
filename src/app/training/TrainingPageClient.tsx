"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useTrainingSessions } from "@/lib/hooks/useTraining";
import { TrainingRegistrationModal } from "@/components/training/TrainingRegistrationModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TrainingSession } from "@/types/training";

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

export function TrainingPageClient() {
  const { data: sessions, isLoading } = useTrainingSessions();
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);

  const formatSessionDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (start: string, end: string) =>
    `${start} - ${end}`;

  return (
    <div className="min-h-screen bg-surface pt-24 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-900/60 hover:text-accent-500 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-900 mb-6">
            Training Academy
          </h1>
          <p className="text-xl text-primary-900/60 max-w-2xl">
            Empower your team. Become certified in asset lifecycle management
            and hardware deployment.
          </p>
        </div>

        <motion.div
          className="mb-20 w-full rounded-[2rem] overflow-hidden shadow-xl relative h-[300px] md:h-[500px]"
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
          {/* Upcoming Sessions List */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-heading text-primary-900 mb-6">
              Upcoming Sessions
            </h2>

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
            ) : (
              sessions.map((session) => (
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
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-accent-500">
                        ${Number(session.price_usd).toLocaleString()}
                      </p>
                      <p className="text-xs text-primary-900/40">USD / person</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center text-primary-900/70">
                      <Calendar className="w-5 h-5 mr-2 text-accent-500" />
                      <span className="text-sm font-medium">
                        {formatSessionDate(session.date)}
                      </span>
                    </div>
                    <div className="flex items-center text-primary-900/70">
                      <Clock className="w-5 h-5 mr-2 text-accent-500" />
                      <span className="text-sm font-medium">
                        {formatTime(session.time_start, session.time_end)}
                      </span>
                    </div>
                    <div className="flex items-center text-primary-900/70">
                      <MapPin className="w-5 h-5 mr-2 text-accent-500" />
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
                    {session.seats_remaining > 0
                      ? "Register Now"
                      : "Session Full"}
                  </button>
                </div>
              ))
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
