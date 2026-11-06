export interface User {
  id: string;
  role: 'admin';
  full_name: string;
  specialty?: string | null;
  structure_type?: string | null;
  structure_name?: string | null;
  city?: string | null;
  phone_whatsapp?: string | null;
  email: string;
  created_at?: string;
}

export interface DoctorContactInfo {
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  doctor_specialty?: string;
  structure_type?: 'cabinet' | 'clinique' | 'laboratoire' | 'centre_dentaire' | 'autre';
  structure_name?: string;
  doctor_city?: string;
}

export type DelayPreference = 'urgent' | 'sous_une_semaine' | 'sous_un_mois' | 'pas_presse';

export type RequestStatus = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'refusee';

export type RevenueType = 'commission' | 'forfait' | 'abonnement';

export interface ServiceField {
  id: string;
  service_id?: string;
  name: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'file';
  is_required: boolean;
  options?: string[] | null;
  placeholder?: string | null;
  help_text?: string | null;
  display_order: number;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  warning_message?: string | null;
  fields: ServiceField[];
}

export interface StatusHistoryItem {
  id: string;
  request_id: string;
  old_status?: string | null;
  new_status: RequestStatus;
  changed_by_name?: string;
  message?: string | null;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  reference_code: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  doctor_specialty?: string;
  structure_type?: string;
  structure_name?: string;
  doctor_city?: string;
  service_id: string;
  service_title: string;
  service_icon?: string;
  service_description?: string;
  delay_preference: DelayPreference;
  notes?: string | null;
  form_data: Record<string, any>;
  status: RequestStatus;
  admin_internal_notes?: string | null;
  admin_public_message?: string | null;
  billed_amount?: number;
  revenue_type?: RevenueType | null;
  photo_data?: string | null;
  created_at: string;
  updated_at: string;
  history?: StatusHistoryItem[];
}

export interface AdminDashboardData {
  stats: {
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    rejectedRequests: number;
    totalRequests: number;
    totalDoctors: number;
    totalRevenue: number;
  };
  latestRequests: ServiceRequest[];
  monthlyStats: Array<{
    month: string;
    requests_count: number;
    revenue: number;
  }>;
}

export interface RevenueData {
  summary: {
    grand_total: number;
    total_commission: number;
    total_forfait: number;
    total_abonnement: number;
  };
  byService: Array<{
    service_id: string;
    service_title: string;
    requests_count: number;
    total_amount: number;
    commission_amount: number;
    forfait_amount: number;
    abonnement_amount: number;
  }>;
  byMonth: Array<{
    month: string;
    total_requests: number;
    total_amount: number;
    commission_amount: number;
    forfait_amount: number;
    abonnement_amount: number;
  }>;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: any;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_role: string;
  subject: string;
  body: string;
  request_id?: string | null;
  is_read: number;
  created_at: string;
}
