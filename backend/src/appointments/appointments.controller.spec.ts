import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from '../../src/appointments/appointments.controller';
import { AppointmentsService } from '../../src/appointments/services/appointment.service';
import { JwtAuthGuard } from '../../src/auth/guards/roles.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockAppointmentsService = {
    getAllAppointments: jest.fn(),
    getPatientAppointments: jest.fn(),
    getUpcomingAppointments: jest.fn(),
    getProfessionalAppointments: jest.fn(),
    createAppointment: jest.fn(),
    getAppointmentByIdAdmin: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    updateStatus: jest.fn(),
    cancelAppointment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAppointments', () => {
    it('should call service.getAllAppointments', async () => {
      const result = [{ id: 'apt-1' }];
      mockAppointmentsService.getAllAppointments.mockResolvedValue(result);

      expect(await controller.getAllAppointments('1', '20', 'PENDING', 'p1', 'prof1', '2024-01-01', '2024-01-02')).toBe(result);
      expect(service.getAllAppointments).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'PENDING',
        patientId: 'p1',
        professionalId: 'prof1',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
      });
    });
  });

  describe('getMyAppointments', () => {
    it('should call service.getPatientAppointments', async () => {
      const result = [{ id: 'apt-1' }];
      mockAppointmentsService.getPatientAppointments.mockResolvedValue(result);
      const user = { id: 'user-1' };

      expect(await controller.getMyAppointments(user)).toBe(result);
      expect(service.getPatientAppointments).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUpcoming', () => {
    it('should call service.getUpcomingAppointments', async () => {
      const result = [{ id: 'apt-1' }];
      mockAppointmentsService.getUpcomingAppointments.mockResolvedValue(result);
      const user = { id: 'user-1', role: 'PATIENT' };

      expect(await controller.getUpcoming(user)).toBe(result);
      expect(service.getUpcomingAppointments).toHaveBeenCalledWith('user-1', 'PATIENT');
    });
  });
  
  describe('getPatientAppointments', () => {
      it('should call service.getPatientAppointments', async () => {
          const result = [{ id: 'apt-1' }];
          mockAppointmentsService.getPatientAppointments.mockResolvedValue(result);
          
          expect(await controller.getPatientAppointments('p1')).toBe(result);
          expect(service.getPatientAppointments).toHaveBeenCalledWith('p1');
      });
  });

  describe('create', () => {
    it('should call service.createAppointment', async () => {
      const dto = { professionalId: 'prof-1', date: new Date(), startTime: '10:00', endTime: '11:00' };
      const user = { id: 'user-1', role: 'PATIENT' };
      const result = { id: 'apt-1' };
      mockAppointmentsService.createAppointment.mockResolvedValue(result);

      expect(await controller.create(dto as any, user)).toBe(result);
      expect(service.createAppointment).toHaveBeenCalledWith(
          expect.objectContaining({ ...dto, patientId: 'user-1' }),
          'user-1',
          'PATIENT'
      );
    });
  });
  
  describe('updateStatus', () => {
      it('should call service.updateStatus', async () => {
          const dto = { status: 'CONFIRMED' };
          const user = { id: 'admin-1', role: 'ADMIN' };
          const result = { id: 'apt-1', status: 'CONFIRMED' };
          mockAppointmentsService.updateStatus.mockResolvedValue(result);
          
          expect(await controller.updateStatus('apt-1', dto as any, user)).toBe(result);
          expect(service.updateStatus).toHaveBeenCalledWith('apt-1', dto, 'admin-1', 'ADMIN');
      });
  });
});
