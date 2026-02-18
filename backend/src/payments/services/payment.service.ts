import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifyPaymentDto, UploadPaymentDto } from '../dto/payment.dto';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async generatePaymentQR(appointmentId: string): Promise<string> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { profile: true } },
        professional: { include: { profile: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const paymentData = {
      appointmentId: appointment.id,
      amount: 50,
      currency: 'USD',
      patient: `${appointment.patient?.profile?.firstName} ${appointment.patient?.profile?.lastName}`,
      professional: `${appointment.professional?.profile?.firstName} ${appointment.professional?.profile?.lastName}`,
      date: appointment.date,
    };

    const qrData = JSON.stringify(paymentData);
    const fileName = `payment-${appointmentId}-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'uploads', 'payments', fileName);

    await QRCode.toFile(filePath, qrData, {
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 300,
    });

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/payments/${fileName}`;
  }

  async uploadPayment(appointmentId: string, file: Express.Multer.File) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const qrImageUrl = `${baseUrl}/uploads/payments/${file.filename}`;

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId },
      update: {
        qrImageUrl,
        status: 'UPLOADED',
        uploadedAt: new Date(),
      },
      create: {
        appointmentId,
        qrImageUrl,
        status: 'UPLOADED',
        uploadedAt: new Date(),
      },
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: 'PENDING' },
    });

    return payment;
  }

  async getPaymentStatus(appointmentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { appointmentId },
    });

    if (!payment) {
      return null;
    }

    return payment;
  }

  async getPaymentsList(filters?: { status?: string; patientId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.appointment = { patientId: filters.patientId };
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            patient: { include: { profile: true } },
            professional: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentsByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        appointment: { patientId: userId },
      },
      include: {
        appointment: {
          include: {
            patient: { include: { profile: true } },
            professional: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPayment(
    paymentId: string,
    dto: VerifyPaymentDto,
    userId: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        verifiedAt: new Date(),
        verifiedBy: userId,
        notes: dto.notes,
      },
    });

    if (dto.status === 'VERIFIED') {
      await this.prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { paymentStatus: 'PAID' },
      });
    }

    return updatedPayment;
  }

  async rejectPayment(paymentId: string, reason: string) {
    return this.verifyPayment(
      paymentId,
      { status: 'REJECTED', notes: reason },
      'system',
    );
  }
}
