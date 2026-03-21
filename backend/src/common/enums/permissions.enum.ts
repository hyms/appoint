export enum UserRole {
  ADMIN = 'ADMIN',
  SECRETARY = 'SECRETARY',
  PROFESSIONAL = 'PROFESSIONAL',
  PATIENT = 'PATIENT',
}

export enum Permission {
  // Appointment permissions
  VIEW_ALL_APPOINTMENTS = 'VIEW_ALL_APPOINTMENTS',
  MANAGE_ALL_APPOINTMENTS = 'MANAGE_ALL_APPOINTMENTS',
  BOOK_FOR_OTHERS = 'BOOK_FOR_OTHERS',

  // User permissions
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  MANAGE_USERS = 'MANAGE_USERS',

  // Payment permissions
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',

  // Strike permissions
  MANAGE_STRIKES = 'MANAGE_STRIKES',

  // Notification permissions
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',

  // Configuration permissions
  MANAGE_CONFIG = 'MANAGE_CONFIG',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.MANAGE_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_STRIKES,
    Permission.SEND_NOTIFICATIONS,
    Permission.MANAGE_CONFIG,
  ],
  [UserRole.SECRETARY]: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.MANAGE_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_PAYMENTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  [UserRole.PROFESSIONAL]: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
  ],
  [UserRole.PATIENT]: [],
};
