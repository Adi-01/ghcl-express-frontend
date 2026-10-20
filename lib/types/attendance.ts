import { WorkLocation } from "@/lib/location";

export interface AttendanceLog {
  id: string;
  userId?: string;
  user_id?: string;
  userName: string;
  user_name: string;
  phoneNumber?: string | null;
  phone_number?: string | null;
  worklocation: WorkLocation | string;
  checkInTime: string;
  check_in_time: string;
  checkOutTime: string | null;
  check_out_time: string | null;
  attendanceDate: string;
  attendance_date: string;
  duration: string;
  inLatitude?: string | null;
  in_latitude?: string | null;
  inLongitude?: string | null;
  in_longitude?: string | null;
  outLatitude?: string | null;
  out_latitude?: string | null;
  outLongitude?: string | null;
  out_longitude?: string | null;
}

export interface UserActiveShift {
  id: string;
  worklocation: WorkLocation | string;
  check_in_time: string;
  checkInTime?: string;
}

export interface UserRecentAttendance {
  id: string;
  attendance_date: string;
  attendanceDate?: string;
  check_in_time: string;
  checkInTime?: string;
  check_out_time: string | null;
  checkOutTime?: string | null;
  worklocation: WorkLocation | string;
  duration: string;
}

export interface AttendanceDashboardStatusResponse {
  is_active: boolean;
  isActive?: boolean;
  active_shift: UserActiveShift | null;
  activeShift?: UserActiveShift | null;
  recent_history: UserRecentAttendance[];
  recentHistory?: UserRecentAttendance[];
  cooldown_until: string | null;
  cooldownUntil?: string | null;
}

export interface AttendancePunchPayload {
  worklocation?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface AttendancePunchResponse {
  action: "checked_in" | "checked_out";
  status: string;
  message: string;
  shift_data?: AttendanceLog;
  shiftData?: AttendanceLog;
}

export interface AttendanceRegisterDayData {
  count: number;
  is_working: boolean;
}

export interface AttendanceRegisterUser {
  id: string;
  userName: string;
  user_name: string;
  empId?: string | null;
  emp_id?: string | null;
  designation?: string | null;
  attendance: Record<string, AttendanceRegisterDayData>;
  totalShiftsWorked: number;
  total_shifts_worked: number;
}

export interface AttendanceRegisterResponse {
  month: string;
  daysInMonth: number;
  days_in_month: number;
  dates: string[];
  register: AttendanceRegisterUser[];
}

export interface CreateAdminAttendancePayload {
  userId?: string;
  user_id?: string;
  worklocation: string;
  checkInTime?: string;
  check_in_time?: string;
  checkOutTime?: string | null;
  check_out_time?: string | null;
  inLatitude?: string | null;
  in_latitude?: string | null;
  inLongitude?: string | null;
  in_longitude?: string | null;
  outLatitude?: string | null;
  out_latitude?: string | null;
  outLongitude?: string | null;
  out_longitude?: string | null;
}

export interface UpdateAdminAttendancePayload {
  worklocation?: string;
  checkInTime?: string;
  check_in_time?: string;
  checkOutTime?: string | null;
  check_out_time?: string | null;
  inLatitude?: string | null;
  in_latitude?: string | null;
  inLongitude?: string | null;
  in_longitude?: string | null;
  outLatitude?: string | null;
  out_latitude?: string | null;
  outLongitude?: string | null;
  out_longitude?: string | null;
}

export interface AdminAttendanceLogsResponse {
  entries: AttendanceLog[];
  results?: AttendanceLog[];
  count: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

