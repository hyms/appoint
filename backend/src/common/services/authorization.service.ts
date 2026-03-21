import { Injectable } from '@nestjs/common';
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from '../enums/permissions.enum';

export interface AuthorizationContext {
  userId: string;
  userRole: string;
}

@Injectable()
export class AuthorizationService {
  hasPermission(userRole: string, permission: Permission): boolean {
    const role = userRole as UserRole;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(userRole, p));
  }

  hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(userRole, p));
  }

  canViewAllAppointments(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.VIEW_ALL_APPOINTMENTS);
  }

  canManageAllAppointments(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_ALL_APPOINTMENTS);
  }

  canBookForOthers(
    userRole: string,
    userId: string,
    targetPatientId: string,
  ): boolean {
    if (userId === targetPatientId) {
      return true;
    }
    return this.hasPermission(userRole, Permission.BOOK_FOR_OTHERS);
  }

  canViewAllUsers(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.VIEW_ALL_USERS);
  }

  canManageUsers(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_USERS);
  }

  canManagePayments(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_PAYMENTS);
  }

  canManageStrikes(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_STRIKES);
  }

  canSendNotifications(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.SEND_NOTIFICATIONS);
  }

  canManageConfig(userRole: string): boolean {
    return this.hasPermission(userRole, Permission.MANAGE_CONFIG);
  }

  isAdmin(userRole: string): boolean {
    return userRole === UserRole.ADMIN;
  }

  isSecretary(userRole: string): boolean {
    return userRole === UserRole.SECRETARY;
  }

  isProfessional(userRole: string): boolean {
    return userRole === UserRole.PROFESSIONAL;
  }

  isPatient(userRole: string): boolean {
    return userRole === UserRole.PATIENT;
  }

  isAdminOrSecretary(userRole: string): boolean {
    return this.isAdmin(userRole) || this.isSecretary(userRole);
  }

  isAdminOrSecretaryOrProfessional(userRole: string): boolean {
    return (
      this.isAdmin(userRole) ||
      this.isSecretary(userRole) ||
      this.isProfessional(userRole)
    );
  }

  canAccessAppointment(
    userRole: string,
    userId: string,
    patientId: string,
    professionalId: string,
  ): boolean {
    return (
      this.isAdminOrSecretaryOrProfessional(userRole) ||
      userId === patientId ||
      userId === professionalId
    );
  }

  canUpdateAppointmentStatus(
    userRole: string,
    userId: string,
    professionalId: string,
  ): boolean {
    return this.isAdminOrSecretary(userRole) || userId === professionalId;
  }

  canCancelAppointment(
    userRole: string,
    userId: string,
    patientId: string,
    professionalId: string,
  ): boolean {
    return (
      this.isAdminOrSecretary(userRole) ||
      userId === patientId ||
      userId === professionalId
    );
  }
}
