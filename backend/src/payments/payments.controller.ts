import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import { PaymentsService } from './services/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateQR(@Body('appointmentId') appointmentId: string) {
    const qrUrl = await this.paymentsService.generatePaymentQR(appointmentId);
    return { qrImageUrl: qrUrl };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('qrImage'))
  async uploadPayment(
    @Body('appointmentId') appointmentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.paymentsService.uploadPayment(appointmentId, file);
  }

  @Get('status/:appointmentId')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.getPaymentStatus(appointmentId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async getPayments(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.paymentsService.getPaymentsList({ status, patientId });
  }

  @Post(':paymentId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async verifyPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.verifyPayment(paymentId, body, user.id);
  }

  @Get('uploads/payments/:filename')
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'payments', filename);
    res.sendFile(filePath);
  }
}
