export type BulkerStatus =
  | "VRA"
  | "ALLOCATED"
  | "CANCEL"
  | "SEND"
  | "OUT"
  | "HOLD";

export interface BulkerEntryPreviousTrip {
  id: string;
  customerName: string;
  destination: string;
  salesOrderNumber: string | null;
  orderDate: string | null;
  plantOutAt: string | null;
}

export interface BulkerEntry {
  id: string;
  status: BulkerStatus;
  serialNumber: number | null;
  orderDate: string | null;
  bulkerNumber: string;
  transporterName: string;
  permit: string;
  salesOrderNumber: string | null;
  customerName: string;
  destination: string;
  vraInAt: string | null;
  allocatedAt: string | null;
  plantInAt: string | null;
  plantOutAt: string | null;
  remarks: string;
  previousTrip?: BulkerEntryPreviousTrip | null;
  createdAt: string;
  updatedAt: string;
}

export interface BulkerInfo {
  id: string;
  bulkerNumber: string;
  transporterName: string;
  permit: string;
  isAllowed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  id: string;
  customerName: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkerEntryPayload {
  bulkerNumber: string;
  transporterName?: string;
  permit?: string;
  salesOrderNumber?: string | number | null;
  customerName?: string;
  destination?: string;
  remarks?: string;
  status?: BulkerStatus;
  is_new_bulker?: boolean;
  is_new_customer?: boolean;
}

export interface UpdateBulkerEntryPayload {
  bulkerNumber?: string;
  transporterName?: string;
  permit?: string;
  salesOrderNumber?: string | number | null;
  customerName?: string;
  destination?: string;
  remarks?: string;
  status?: BulkerStatus;
  orderDate?: string | null;
  vraInAt?: string | null;
  allocatedAt?: string | null;
  plantInAt?: string | null;
  plantOutAt?: string | null;
  is_new_bulker?: boolean;
  is_new_customer?: boolean;
}

export interface BulkerEntriesResponse {
  entries: BulkerEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CustomerBulkerDetail {
  id: string;
  bulkerNumber: string;
  status: BulkerStatus;
  salesOrderNumber: string | null;
  transporterName: string;
  permit: string;
  destination: string;
  orderDate?: string | null;
  vraInAt?: string | null;
  allocatedAt?: string | null;
  plantInAt?: string | null;
  plantOutAt?: string | null;
  updatedAt?: string | null;
  remarks?: string;
}

export interface CustomerSummaryItem {
  customerName: string;
  vraCount: number;
  allocatedCount: number;
  sendCount: number;
  holdCount: number;
  totalCount: number;
  bulkers: CustomerBulkerDetail[];
}

export interface ActiveCustomerSummaryResponse {
  type: "active";
  summary: CustomerSummaryItem[];
  totals: {
    vraCount: number;
    allocatedCount: number;
    sendCount: number;
    holdCount: number;
    totalCount: number;
  };
}

export interface TransporterAssociation {
  transporterName: string;
  count: number;
}

export interface CustomerTransporterSummaryItem {
  customerName: string;
  totalCount: number;
  transporterCounts?: Record<string, number>;
  transporters: TransporterAssociation[];
  bulkers: CustomerBulkerDetail[];
}

export interface MonthlyTransporterSummaryResponse {
  type: "transporter_monthly";
  month: string;
  transportersList: string[];
  summary: CustomerTransporterSummaryItem[];
  totals: {
    totalCustomers: number;
    totalDispatches: number;
    transporterTotals?: Record<string, number>;
  };
}

export type BulkerSummaryResponse =
  | ActiveCustomerSummaryResponse
  | MonthlyTransporterSummaryResponse;



