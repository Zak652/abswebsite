export interface TrainingSession {
  id: string;
  title: string;
  level: "beginner" | "advanced" | "expert";
  date: string;
  time_start: string;
  time_end: string;
  location: string;
  delivery_mode: "virtual" | "in_person";
  price_usd: string;
  capacity: number;
  seats_remaining: number;
  is_active: boolean;
}

export interface TrainingRegistration {
  id: string;
  session: string;
  session_title: string;
  session_date: string;
  email: string;
  company_name: string;
  full_name: string;
  team_size: number;
  status: "pending_payment" | "paid" | "cancelled" | "refunded";
  amount_paid: string | null;
  currency: string;
  created_at: string;
}
