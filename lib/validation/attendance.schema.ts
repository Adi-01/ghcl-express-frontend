import { z } from "zod";

export const editAttendanceLogSchema = z.object({
  worklocation: z.string().min(1, "Location is required"),
  out_location: z.string().optional().nullable(),
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
}).refine((data) => !data.out_location || data.out_location === data.worklocation, {
  message: "Out location must match In location",
  path: ["out_location"],
});

export const addAttendanceLogSchema = z.object({
  user_id: z.string().min(1, "User is required"),
  worklocation: z.string().min(1, "Location is required"),
  out_location: z.string().optional().nullable(),
  check_in_time: z.string().min(1, "Check-in time is required"),
  check_out_time: z.string().optional().nullable(),
}).refine((data) => !data.out_location || data.out_location === data.worklocation, {
  message: "Out location must match In location",
  path: ["out_location"],
});

export type EditAttendanceLogInput = z.infer<typeof editAttendanceLogSchema>;
export type AddAttendanceLogInput = z.infer<typeof addAttendanceLogSchema>;

