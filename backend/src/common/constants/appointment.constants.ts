export const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'] as const;
export type ActiveAppointmentStatus =
  (typeof ACTIVE_APPOINTMENT_STATUSES)[number];
