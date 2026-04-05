import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payment.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    generatePaymentQR: jest.fn(),
    uploadPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    getPaymentsList: jest.fn(),
    getPaymentsByUser: jest.fn(),
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('generateQR should call service.generatePaymentQR', async () => {
    mockPaymentsService.generatePaymentQR.mockResolvedValue('url');
    expect(await controller.generateQR('a1')).toEqual({ qrImageUrl: 'url' });
    expect(service.generatePaymentQR).toHaveBeenCalledWith('a1');
  });

  it('uploadPayment should call service.uploadPayment', async () => {
    const file = { filename: 'test.jpg' } as any;
    mockPaymentsService.uploadPayment.mockResolvedValue({ id: 'p1' });
    expect(await controller.uploadPayment('a1', file)).toEqual({ id: 'p1' });
    expect(service.uploadPayment).toHaveBeenCalledWith('a1', file);
  });

  it('getStatus should call service.getPaymentStatus', async () => {
    mockPaymentsService.getPaymentStatus.mockResolvedValue({ status: 'PENDING' });
    expect(await controller.getStatus('a1')).toEqual({ status: 'PENDING' });
    expect(service.getPaymentStatus).toHaveBeenCalledWith('a1');
  });

  it('getPayments should call service.getPaymentsList', async () => {
    mockPaymentsService.getPaymentsList.mockResolvedValue([]);
    await controller.getPayments('PENDING', 'p1');
    expect(service.getPaymentsList).toHaveBeenCalledWith({ status: 'PENDING', patientId: 'p1' });
  });

  it('getMyPayments should call service.getPaymentsByUser', async () => {
    mockPaymentsService.getPaymentsByUser.mockResolvedValue([]);
    await controller.getMyPayments({ id: 'u1' });
    expect(service.getPaymentsByUser).toHaveBeenCalledWith('u1');
  });

  it('verifyPayment should call service.verifyPayment', async () => {
    const body = { status: 'VERIFIED' };
    mockPaymentsService.verifyPayment.mockResolvedValue({ id: 'p1' });
    await controller.verifyPayment('p1', body, { id: 'admin1' });
    expect(service.verifyPayment).toHaveBeenCalledWith('p1', body, 'admin1');
  });
});
