import type { Metadata } from "next";
import { TrainingPageClient } from "./TrainingPageClient";

export const metadata: Metadata = {
    title: "Training Academy | ABS Platform",
    description:
        "Get certified in Arcplus asset management and RFID deployment. Live virtual and in-person sessions led by ABS-certified instructors.",
    openGraph: {
        title: "Training Academy | ABS Platform",
        description:
            "Become an Arcplus-certified professional. Join upcoming training sessions.",
        url: "/training",
    },
};

export default function TrainingPage() {
    return <TrainingPageClient />;
}
