// ─── Enums ───────────────────────────────────────────────

export type CaseStatus =
  | 'NEW'
  | 'TRIAGED'
  | 'SELF_SERVICE'
  | 'MATCHING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'INVOICED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'EMERGENCY';

export type CaseCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'APPLIANCE'
  | 'ROOFING'
  | 'PEST_CONTROL'
  | 'LOCKSMITH'
  | 'GENERAL';

export type Severity = 'EMERGENCY' | 'URGENT' | 'NORMAL';

export type VendorTier = 'PROBATIONARY' | 'ACTIVE' | 'PREFERRED' | 'ELITE';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'DISPUTED';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'PUSH';

export type ResolutionType = 'SELF_SERVICE' | 'VENDOR' | 'EMERGENCY' | 'CANCELLED';

export type UserRole = 'HOMEOWNER' | 'PROPERTY_MANAGER' | 'ADMIN';

// ─── Row Types ───────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  categories: CaseCategory[];
  tier: VendorTier;
  rating: number;
  total_jobs: number;
  service_radius_miles: number;
  license_number?: string;
  insurance_url?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  vendor_id?: string;
  category: CaseCategory;
  severity: Severity;
  status: CaseStatus;
  description: string;
  address?: string;
  photo_urls: string[];
  diagnosis?: string;
  playbook?: string[];
  safety_flags: string[];
  confidence?: number;
  resolution_type?: ResolutionType;
  created_at: string;
  updated_at: string;
  // joined fields
  user?: User;
  vendor?: Vendor;
  timeline?: CaseTimeline[];
}

export interface CaseTimeline {
  id: string;
  case_id: string;
  stage: CaseStatus;
  actor: 'USER' | 'VENDOR' | 'AI' | 'SYSTEM';
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Appointment {
  id: string;
  case_id: string;
  vendor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  confirmed: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  case_id: string;
  vendor_id: string;
  amount: number;
  description: string;
  line_items: { description: string; amount: number }[];
  status: PaymentStatus;
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  case_id: string;
  user_id: string;
  vendor_id?: string;
  rating: number;
  tags: string[];
  comment?: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Media {
  id: string;
  case_id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  filename: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  read: boolean;
  sent_at: string;
  created_at: string;
}

export interface VendorApplication {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  categories: CaseCategory[];
  service_radius_miles: number;
  license_number?: string;
  insurance_url?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

// ─── Database helper type ────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at' | 'updated_at'>; Update: Partial<User> };
      vendors: { Row: Vendor; Insert: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Vendor> };
      cases: { Row: Case; Insert: Omit<Case, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Case> };
      case_timeline: { Row: CaseTimeline; Insert: Omit<CaseTimeline, 'id' | 'created_at'>; Update: Partial<CaseTimeline> };
      appointments: { Row: Appointment; Insert: Omit<Appointment, 'id' | 'created_at'>; Update: Partial<Appointment> };
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at'>; Update: Partial<Invoice> };
      feedback: { Row: Feedback; Insert: Omit<Feedback, 'id' | 'created_at'>; Update: Partial<Feedback> };
      sessions: { Row: Session; Insert: Omit<Session, 'id' | 'created_at'>; Update: Partial<Session> };
      media: { Row: Media; Insert: Omit<Media, 'id' | 'uploaded_at'>; Update: Partial<Media> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> };
      vendor_applications: { Row: VendorApplication; Insert: Omit<VendorApplication, 'id' | 'created_at'>; Update: Partial<VendorApplication> };
    };
  };
}
