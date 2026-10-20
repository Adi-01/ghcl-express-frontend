export type TruckStatus = "IN" | "OUT";

export interface TruckEntry {
  id: string;
  truckNumber: string;
  truck_number: string;
  transporterName: string;
  transporter_name: string;
  entryDate: string;
  entry_date: string;
  exitDate: string | null;
  exit_date: string | null;
  paperStatus: boolean;
  paper_status: boolean;
  driverStatus: boolean;
  driver_status: boolean;
  tarpulinStatus: boolean;
  tarpulin_status: boolean;
  remarks?: string | null;
  status: TruckStatus;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CreateTruckEntryPayload {
  truck_number?: string;
  truckNumber?: string;
  transporter_name?: string;
  transporterName?: string;
  entry_date?: string;
  entryDate?: string;
  exit_date?: string | null;
  exitDate?: string | null;
  paper_status?: boolean;
  paperStatus?: boolean;
  driver_status?: boolean;
  driverStatus?: boolean;
  tarpulin_status?: boolean;
  tarpulinStatus?: boolean;
  remarks?: string | null;
  status?: TruckStatus;
}

export type UpdateTruckEntryPayload = Partial<CreateTruckEntryPayload>;

export interface NightCheckingEntriesResponse {
  entries: TruckEntry[];
  results?: TruckEntry[];
  count?: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

export interface NightCheckingExportCSVRow {
  ID: string;
  "Truck Number": string;
  "Transporter Name": string;
  "Entry Date": string;
  "Exit Date": string;
  "Paper Status": string;
  "Driver Status": string;
  "Tarpulin Status": string;
  Status: string;
  Remarks?: string;
}

