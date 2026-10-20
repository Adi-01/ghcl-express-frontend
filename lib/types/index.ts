export type UserRole = "ADMIN" | "EMPLOYEE";

export interface BankDetails {
  id: string;
  user_id?: string;
  account_number: string;
  bank_name: string;
  branch_name?: string | null;
  ifsc_code: string;
  account_holder_name: string;
  account_type?: "SAVINGS" | "CURRENT" | "SALARY";
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
  phone_number?: string | null;
  phoneNumber?: string | null;
  emp_id?: string | null;
  designation?: string | null;
  profile_image?: string | null;
  labels?: string[];
  role?: UserRole;
  is_active: boolean;
  is_admin?: boolean;
  active_sessions_count?: number;
  documents_count?: number;
  created_at?: string;
  updated_at?: string;
  bank_details?: BankDetails | null;
}

export interface Session {
  id?: string;
  token?: string;
  userId?: string;
  user_id?: string;
  deviceInfo?: string;
  ipAddress?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  isRevoked?: boolean;
  is_revoked?: boolean;
  lastActive?: string;
  expiresAt?: string;
  expires_at?: string;
  createdAt?: string;
  created_at?: string;
}

export type DocumentType =
  | "AADHAAR"
  | "PAN"
  | "PASSPORT"
  | "VOTER_ID"
  | "DRIVING_LICENSE"
  | "OTHER"
  | string;

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DocumentItem {
  id: string;
  user_id: string;
  document_type: DocumentType;
  document_number?: string | null;
  document_url?: string;
  document_file_url?: string;
  document_file_name?: string | null;
  status?: DocumentStatus;
  verification_status?: DocumentStatus;
  rejection_reason?: string | null;
  remarks?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    email: string;
    username?: string | null;
    phone_number?: string | null;
  };
}

export interface DocumentStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface PaginationMeta {
  page: number;
  limit?: number;
  pageSize?: number;
  total_items?: number;
  totalItems?: number;
  total_pages?: number;
  totalPages?: number;
  has_next_page?: boolean;
  hasNextPage?: boolean;
  has_prev_page?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  items?: T[];
  meta?: PaginationMeta;
  pagination?: PaginationMeta;
}
