import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalConfigService } from './professional-config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfessionalConfigService', () => {
  let service: ProfessionalConfigService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrisma = {
      professionalConfig: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalConfigService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProfessionalConfigService>(ProfessionalConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getConfig', () => {
    it('should return existing config', async () => {
      const config = { professionalId: 'prof-1', slotDurationMinutes: 30 };
      prismaService.professionalConfig.findUnique.mockResolvedValue(config);

      const result = await service.getConfig('prof-1');

      expect(result).toEqual(config);
    });

    it('should create default config if none exists', async () => {
      prismaService.professionalConfig.findUnique.mockResolvedValue(null);
      const defaultConfig = {
        professionalId: 'prof-1',
        slotDurationMinutes: 30,
        workingHours: [],
      };
      prismaService.professionalConfig.create.mockResolvedValue(defaultConfig);

      const result = await service.getConfig('prof-1');

      expect(prismaService.professionalConfig.create).toHaveBeenCalledWith({
        data: {
          professionalId: 'prof-1',
          workingHours: expect.any(Array),
        },
        include: { location: true },
      });
      expect(result).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      const existingConfig = { professionalId: 'prof-1' };
      const updateData = { slotDurationMinutes: 45 };
      const updatedConfig = { ...existingConfig, ...updateData };

      prismaService.professionalConfig.findUnique.mockResolvedValue(existingConfig);
      prismaService.professionalConfig.update.mockResolvedValue(updatedConfig);

      const result = await service.updateConfig('prof-1', updateData);

      expect(prismaService.professionalConfig.update).toHaveBeenCalledWith({
        where: { professionalId: 'prof-1' },
        data: {
          slotDurationMinutes: 45,
          breakBetweenSlotsMinutes: undefined,
          locationId: undefined,
          workingHours: undefined,
        },
        include: { location: true },
      });
      expect(result).toEqual(updatedConfig);
    });

    it('should create new config if none exists', async () => {
      prismaService.professionalConfig.findUnique.mockResolvedValue(null);
      const newConfig = { professionalId: 'prof-1', slotDurationMinutes: 30 };
      prismaService.professionalConfig.create.mockResolvedValue(newConfig);

      const result = await service.updateConfig('prof-1', {
        slotDurationMinutes: 30,
      });

      expect(prismaService.professionalConfig.create).toHaveBeenCalledWith({
        data: {
          professionalId: 'prof-1',
          slotDurationMinutes: 30,
          breakBetweenSlotsMinutes: undefined,
          locationId: undefined,
          workingHours: expect.any(Array),
        },
        include: { location: true },
      });
      expect(result).toBeDefined();
    });

    it('should update working hours', async () => {
      const existingConfig = { professionalId: 'prof-1' };
      const workingHours = [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true },
      ];

      prismaService.professionalConfig.findUnique.mockResolvedValue(existingConfig);
      prismaService.professionalConfig.update.mockResolvedValue({
        professionalId: 'prof-1',
        workingHours,
      });

      const result = await service.updateConfig('prof-1', { workingHours } as any);

      expect(result).toBeDefined();
    });
  });

  describe('getWorkingHoursForDay', () => {
    it('should return working hours for specific day', async () => {
      const config = {
        professionalId: 'prof-1',
        workingHours: [
          { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        ],
      };
      prismaService.professionalConfig.findUnique.mockResolvedValue(config);

      const result = await service.getWorkingHoursForDay('prof-1', 'MONDAY');

      expect(result).toEqual({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      });
    });

    it('should return default for day not configured', async () => {
      const config = {
        professionalId: 'prof-1',
        workingHours: [],
      };
      prismaService.professionalConfig.findUnique.mockResolvedValue(config);

      const result = await service.getWorkingHoursForDay('prof-1', 'MONDAY');

      expect(result).toEqual({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
        isActive: false,
      });
    });
  });
});
