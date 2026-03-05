"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { TrainingSession } from "@/types/training";

// Level colours (dot + legend)
const LEVEL_DOT: Record<string, string> = {
  beginner: "bg-green-500",
  advanced: "bg-blue-500",
  expert: "bg-primary-900",
};

const LEVEL_TEXT: Record<string, string> = {
  beginner: "text-green-700 bg-green-100",
  advanced: "text-blue-700 bg-blue-100",
  expert: "text-white bg-primary-900",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  advanced: "Advanced",
  expert: "Expert",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  sessions: TrainingSession[];
  onSelectSession: (session: TrainingSession) => void;
}

export function TrainingCalendar({ sessions, onSelectSession }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Cells: leading empties + days of month
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build a map: "YYYY-MM-DD" → sessions[]
  const sessionMap: Record<string, TrainingSession[]> = {};
  for (const s of sessions) {
    const key = s.date.slice(0, 10);
    if (!sessionMap[key]) sessionMap[key] = [];
    sessionMap[key].push(s);
  }

  const todayKey = today.toISOString().slice(0, 10);

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Month nav header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-primary-900" />
        </button>
        <h3 className="text-lg font-heading font-bold text-primary-900">
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-primary-900" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-neutral-100">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-bold font-mono text-primary-900/40 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-7"
        >
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[80px] border-b border-r border-neutral-50 last:border-r-0 bg-neutral-50/40"
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const daySessions = sessionMap[dateKey] ?? [];
            const isToday = dateKey === todayKey;
            const isPast = dateKey < todayKey;
            const colPos = (firstDayOfWeek + i) % 7;
            const isLastCol = colPos === 6;

            return (
              <div
                key={day}
                className={`min-h-[80px] p-2 border-b border-neutral-100 flex flex-col gap-1 ${!isLastCol ? "border-r" : ""
                  } ${isPast ? "bg-neutral-50/50" : ""}`}
              >
                <span
                  className={`text-xs font-mono font-medium self-end w-6 h-6 flex items-center justify-center rounded-full ${isToday
                      ? "bg-accent-500 text-white"
                      : isPast
                        ? "text-primary-900/25"
                        : "text-primary-900/60"
                    }`}
                >
                  {day}
                </span>

                {daySessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => !isPast && onSelectSession(s)}
                    disabled={isPast || s.seats_remaining === 0}
                    title={s.title}
                    className={`w-full text-left text-[10px] font-medium rounded-lg px-1.5 py-1 leading-tight transition-opacity ${LEVEL_DOT[s.level]
                        ? `${LEVEL_TEXT[s.level]}`
                        : "bg-gray-100 text-gray-600"
                      } ${isPast || s.seats_remaining === 0
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:opacity-80"
                      }`}
                  >
                    <span className="truncate block">{s.title}</span>
                    {s.seats_remaining === 0 && (
                      <span className="opacity-70"> · Full</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
        {Object.entries(LEVEL_LABEL).map(([level, label]) => (
          <div key={level} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${LEVEL_DOT[level]}`} />
            <span className="text-xs text-primary-900/60">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-primary-900/40" />
          <span className="text-xs text-primary-900/40">Click a session to register</span>
        </div>
      </div>
    </div>
  );
}
