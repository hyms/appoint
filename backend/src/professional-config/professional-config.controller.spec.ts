import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalConfigController } from './professional-config.controller';
import { ProfessionalConfigService } from './professional-config.service';

describe('ProfessionalConfigController', () => {
  let controller: ProfessionalConfigController;
  let service: ProfessionalConfigService;

  const mockService = {
    getConfig: jest.fn().mockResolvedValue({}),
    updateConfig: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalConfigController],
      providers: [
        { provide: ProfessionalConfigService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProfessionalConfigController>(ProfessionalConfigController);
    service = module.get<ProfessionalConfigService>(ProfessionalConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMyConfig should call service', async () => {
    await controller.getMyConfig({ id: '1' } as any);
    expect(service.getConfig).toHaveBeenCalledWith('1');
  });

  it('updateMyConfig should call service', async () => {
    await controller.updateMyConfig({ id: '1' } as any, {} as any);
    expect(service.updateConfig).toHaveBeenCalledWith('1', {});
  });
});
