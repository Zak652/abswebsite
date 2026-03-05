export type ServiceType =
  | "asset_register"
  | "verification"
  | "disposal"
  | "training_outsource"
  | "full_outsource";

export type ServiceUrgency = "urgent" | "standard" | "flexible";

export type ServiceStatus =
  | "new"
  | "reviewing"
  | "scoped"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequestPayload {
  service_type: ServiceType;
  urgency: ServiceUrgency;
  company_name: string;
  full_name: string;
  email: string;
  phone?: string;
  intake_data: Record<string, string | number | boolean>;
}

export interface ServiceRequest {
  id: string;
  service_type: ServiceType;
  service_type_display: string;
  urgency: ServiceUrgency;
  urgency_display: string;
  status: ServiceStatus;
  status_display: string;
  company_name: string;
  full_name: string;
  email: string;
  phone: string;
  intake_data: Record<string, string | number | boolean>;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}
