import { Test, TestingModule } from '@nestjs/testing';
import { SlotController } from './slots.controller';
import { SlotService } from './services/slot.service';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('SlotController', () => {
  let controller: SlotController;
  let service: SlotService;

  const mockSlotService = {
    getAllSlots: jest.fn(),
    getSlotById: jest.fn(),
    updateSlot: jest.fn(),
    deleteSlot: jest.fn(),
    generateSlots: jest.fn(),
    getAvailableSlots: jest.fn(),
    getSlotsByProfessional: jest.fn(),
    blockSlot: jest.fn(),
    unblockSlot: jest.fn(),
    deleteExpiredSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotController],
      providers: [
        {
          provide: SlotService,
          useValue: mockSlotService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SlotController>(SlotController);
    service = module.get<SlotService>(SlotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAllSlots should return slots', async () => {
    mockSlotService.getAllSlots.mockResolvedValue({ data: [] });
    const result = await controller.getAllSlots();
    expect(result).toEqual({ data: [] });
    expect(service.getAllSlots).toHaveBeenCalled();
  });

  it('getSlotById should return a slot', async () => {
    mockSlotService.getSlotById.mockResolvedValue({ id: '1' });
    const result = await controller.getSlotById('1');
    expect(result).toEqual({ id: '1' });
    expect(service.getSlotById).toHaveBeenCalledWith('1');
  });

  it('updateSlot should call updateSlot service', async () => {
    mockSlotService.updateSlot.mockResolvedValue({ id: '1' });
    const result = await controller.updateSlot('1', {} as any);
    expect(result).toEqual({ id: '1' });
    expect(service.updateSlot).toHaveBeenCalledWith('1', {});
  });

  it('deleteSlot should call deleteSlot service', async () => {
    mockSlotService.deleteSlot.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.deleteSlot('1');
    expect(result).toEqual({ message: 'Deleted' });
    expect(service.deleteSlot).toHaveBeenCalledWith('1');
  });

  it('generateSlots should call generateSlots service', async () => {
    mockSlotService.generateSlots.mockResolvedValue({ count: 1 });
    const result = await controller.generateSlots({} as any, { id: 'user-1' } as any);
    expect(result).toEqual({ count: 1 });
    expect(service.generateSlots).toHaveBeenCalled();
  });

  it('getAvailableSlots should call service', async () => {
    mockSlotService.getAvailableSlots.mockResolvedValue({ availableSlots: 0 });
    const result = await controller.getAvailableSlots('prof-1', '2024-01-01');
    expect(result).toEqual({ availableSlots: 0 });
    expect(service.getAvailableSlots).toHaveBeenCalledWith('prof-1', '2024-01-01');
  });

  it('getSlotsByProfessional should call service', async () => {
    mockSlotService.getSlotsByProfessional.mockResolvedValue([]);
    const result = await controller.getSlotsByProfessional('prof-1', '2024-01-01', '2024-01-02');
    expect(result).toEqual([]);
    expect(service.getSlotsByProfessional).toHaveBeenCalledWith('prof-1', '2024-01-01', '2024-01-02');
  });

  it('blockSlot should call service', async () => {
    mockSlotService.blockSlot.mockResolvedValue({ isBlocked: true });
    const result = await controller.blockSlot({ slotId: '1' } as any);
    expect(result).toEqual({ isBlocked: true });
    expect(service.blockSlot).toHaveBeenCalledWith({ slotId: '1' });
  });

  it('unblockSlot should call service', async () => {
    mockSlotService.unblockSlot.mockResolvedValue({ isBlocked: false });
    const result = await controller.unblockSlot('1');
    expect(result).toEqual({ isBlocked: false });
    expect(service.unblockSlot).toHaveBeenCalledWith('1');
  });

  it('cleanupExpiredSlots should call service', async () => {
    mockSlotService.deleteExpiredSlots.mockResolvedValue({ count: 1 });
    const result = await controller.cleanupExpiredSlots('prof-1');
    expect(result).toEqual({ count: 1 });
    expect(service.deleteExpiredSlots).toHaveBeenCalledWith('prof-1');
  });
});
