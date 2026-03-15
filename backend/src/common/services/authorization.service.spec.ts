import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { UserRole, Permission } from '../enums/permissions.enum';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      expect(
        service.hasPermission(UserRole.ADMIN, Permission.VIEW_ALL_APPOINTMENTS),
      ).toBe(true);
    });

    it('should return false when user does not have permission', () => {
      expect(
        service.hasPermission(UserRole.PATIENT, Permission.VIEW_ALL_APPOINTMENTS),
      ).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(service.hasPermission('UNKNOWN', Permission.VIEW_ALL_APPOINTMENTS)).toBe(
        false,
      );
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has any of the permissions', () => {
      expect(
        service.hasAnyPermission(UserRole.ADMIN, [
          Permission.VIEW_ALL_APPOINTMENTS,
          Permission.MANAGE_ALL_APPOINTMENTS,
        ]),
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      expect(
        service.hasAnyPermission(UserRole.PATIENT, [
          Permission.VIEW_ALL_APPOINTMENTS,
          Permission.MANAGE_ALL_APPOINTMENTS,
        ]),
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      expect(
        service.hasAllPermissions(UserRole.ADMIN, [
          Permission.VIEW_ALL_APPOINTMENTS,
          Permission.MANAGE_ALL_APPOINTMENTS,
        ]),
      ).toBe(true);
    });

    it('should return false when user missing any permission', () => {
      expect(
        service.hasAllPermissions(UserRole.PROFESSIONAL, [
          Permission.VIEW_ALL_APPOINTMENTS,
          Permission.MANAGE_USERS,
        ]),
      ).toBe(false);
    });
  });

  describe('canViewAllAppointments', () => {
    it('should return true for ADMIN', () => {
      expect(service.canViewAllAppointments(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SECRETARY', () => {
      expect(service.canViewAllAppointments(UserRole.SECRETARY)).toBe(true);
    });

    it('should return true for PROFESSIONAL', () => {
      expect(service.canViewAllAppointments(UserRole.PROFESSIONAL)).toBe(true);
    });

    it('should return false for PATIENT', () => {
      expect(service.canViewAllAppointments(UserRole.PATIENT)).toBe(false);
    });
  });

  describe('canManageAllAppointments', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageAllAppointments(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SECRETARY', () => {
      expect(service.canManageAllAppointments(UserRole.SECRETARY)).toBe(true);
    });

    it('should return false for PROFESSIONAL', () => {
      expect(service.canManageAllAppointments(UserRole.PROFESSIONAL)).toBe(false);
    });

    it('should return false for PATIENT', () => {
      expect(service.canManageAllAppointments(UserRole.PATIENT)).toBe(false);
    });
  });

  describe('canBookForOthers', () => {
    it('should return true when booking for self', () => {
      expect(
        service.canBookForOthers(UserRole.PATIENT, 'user-1', 'user-1'),
      ).toBe(true);
    });

    it('should return true for ADMIN booking for others', () => {
      expect(
        service.canBookForOthers(UserRole.ADMIN, 'admin-1', 'patient-1'),
      ).toBe(true);
    });

    it('should return false for PATIENT booking for others', () => {
      expect(
        service.canBookForOthers(UserRole.PATIENT, 'patient-1', 'patient-2'),
      ).toBe(false);
    });
  });

  describe('canViewAllUsers', () => {
    it('should return true for ADMIN', () => {
      expect(service.canViewAllUsers(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SECRETARY', () => {
      expect(service.canViewAllUsers(UserRole.SECRETARY)).toBe(true);
    });

    it('should return false for PROFESSIONAL', () => {
      expect(service.canViewAllUsers(UserRole.PROFESSIONAL)).toBe(false);
    });

    it('should return false for PATIENT', () => {
      expect(service.canViewAllUsers(UserRole.PATIENT)).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageUsers(UserRole.ADMIN)).toBe(true);
    });

    it('should return false for SECRETARY', () => {
      expect(service.canManageUsers(UserRole.SECRETARY)).toBe(false);
    });
  });

  describe('canManagePayments', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManagePayments(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SECRETARY', () => {
      expect(service.canManagePayments(UserRole.SECRETARY)).toBe(true);
    });

    it('should return false for PROFESSIONAL', () => {
      expect(service.canManagePayments(UserRole.PROFESSIONAL)).toBe(false);
    });
  });

  describe('canManageStrikes', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageStrikes(UserRole.ADMIN)).toBe(true);
    });

    it('should return false for SECRETARY', () => {
      expect(service.canManageStrikes(UserRole.SECRETARY)).toBe(false);
    });
  });

  describe('canSendNotifications', () => {
    it('should return true for ADMIN', () => {
      expect(service.canSendNotifications(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for SECRETARY', () => {
      expect(service.canSendNotifications(UserRole.SECRETARY)).toBe(true);
    });

    it('should return false for PROFESSIONAL', () => {
      expect(service.canSendNotifications(UserRole.PROFESSIONAL)).toBe(false);
    });
  });

  describe('canManageConfig', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageConfig(UserRole.ADMIN)).toBe(true);
    });

    it('should return false for others', () => {
      expect(service.canManageConfig(UserRole.SECRETARY)).toBe(false);
    });
  });

  describe('role checks', () => {
    it('isAdmin should return true for ADMIN', () => {
      expect(service.isAdmin(UserRole.ADMIN)).toBe(true);
    });

    it('isAdmin should return false for others', () => {
      expect(service.isAdmin(UserRole.PATIENT)).toBe(false);
    });

    it('isSecretary should return true for SECRETARY', () => {
      expect(service.isSecretary(UserRole.SECRETARY)).toBe(true);
    });

    it('isProfessional should return true for PROFESSIONAL', () => {
      expect(service.isProfessional(UserRole.PROFESSIONAL)).toBe(true);
    });

    it('isPatient should return true for PATIENT', () => {
      expect(service.isPatient(UserRole.PATIENT)).toBe(true);
    });

    it('isAdminOrSecretary should return true for ADMIN', () => {
      expect(service.isAdminOrSecretary(UserRole.ADMIN)).toBe(true);
    });

    it('isAdminOrSecretary should return true for SECRETARY', () => {
      expect(service.isAdminOrSecretary(UserRole.SECRETARY)).toBe(true);
    });

    it('isAdminOrSecretary should return false for PROFESSIONAL', () => {
      expect(service.isAdminOrSecretary(UserRole.PROFESSIONAL)).toBe(false);
    });

    it('isAdminOrSecretaryOrProfessional should return true for all three roles', () => {
      expect(service.isAdminOrSecretaryOrProfessional(UserRole.ADMIN)).toBe(true);
      expect(service.isAdminOrSecretaryOrProfessional(UserRole.SECRETARY)).toBe(
        true,
      );
      expect(service.isAdminOrSecretaryOrProfessional(UserRole.PROFESSIONAL)).toBe(
        true,
      );
      expect(service.isAdminOrSecretaryOrProfessional(UserRole.PATIENT)).toBe(
        false,
      );
    });
  });

  describe('canAccessAppointment', () => {
    it('should return true for admin', () => {
      expect(
        service.canAccessAppointment(
          UserRole.ADMIN,
          'admin-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for secretary', () => {
      expect(
        service.canAccessAppointment(
          UserRole.SECRETARY,
          'sec-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for professional', () => {
      expect(
        service.canAccessAppointment(
          UserRole.PROFESSIONAL,
          'prof-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for patient viewing their own', () => {
      expect(
        service.canAccessAppointment(
          UserRole.PATIENT,
          'patient-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return false for patient viewing others', () => {
      expect(
        service.canAccessAppointment(
          UserRole.PATIENT,
          'patient-1',
          'patient-2',
          'prof-1',
        ),
      ).toBe(false);
    });
  });

  describe('canUpdateAppointmentStatus', () => {
    it('should return true for admin', () => {
      expect(
        service.canUpdateAppointmentStatus(UserRole.ADMIN, 'admin-1', 'prof-1'),
      ).toBe(true);
    });

    it('should return true for secretary', () => {
      expect(
        service.canUpdateAppointmentStatus(
          UserRole.SECRETARY,
          'sec-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for professional on their own appointment', () => {
      expect(
        service.canUpdateAppointmentStatus(
          UserRole.PROFESSIONAL,
          'prof-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return false for professional on others appointment', () => {
      expect(
        service.canUpdateAppointmentStatus(
          UserRole.PROFESSIONAL,
          'prof-1',
          'prof-2',
        ),
      ).toBe(false);
    });

    it('should return false for patient', () => {
      expect(
        service.canUpdateAppointmentStatus(UserRole.PATIENT, 'patient-1', 'prof-1'),
      ).toBe(false);
    });
  });

  describe('canCancelAppointment', () => {
    it('should return true for admin', () => {
      expect(
        service.canCancelAppointment(
          UserRole.ADMIN,
          'admin-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for patient canceling their own', () => {
      expect(
        service.canCancelAppointment(
          UserRole.PATIENT,
          'patient-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return true for professional on their own', () => {
      expect(
        service.canCancelAppointment(
          UserRole.PROFESSIONAL,
          'prof-1',
          'patient-1',
          'prof-1',
        ),
      ).toBe(true);
    });

    it('should return false for patient canceling others', () => {
      expect(
        service.canCancelAppointment(
          UserRole.PATIENT,
          'patient-1',
          'patient-2',
          'prof-1',
        ),
      ).toBe(false);
    });
  });
});
