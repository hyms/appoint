import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE_STATUS = 'UPDATE_STATUS',
  UPDATE = 'UPDATE',
  CANCEL = 'DELETE',
  DELETE = 'DELETE',
}

export interface CreateAuditParams {
  appointmentId: string;
  userId: string;
  action: AuditAction;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AppointmentAuditService {
  constructor(private prisma: PrismaService) {}

  async logChange(params: CreateAuditParams) {
    return this.prisma.appointmentAudit.create({
      data: {
        appointmentId: params.appointmentId,
        userId: params.userId,
        action: params.action,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        reason: params.reason,
        metadata: params.metadata as any,
      },
    });
  }

  async getAuditLogs(appointmentId: string) {
    return this.prisma.appointmentAudit.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
