import { Injectable, Logger } from '@nestjs/common';
import { type UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logUserChange(
    userId: string,
    action: string,
    details: Record<string, any> = {},
    actorId?: string,
    actorRole?: UserRole,
  ): Promise<void> {
    const actor = actorId
      ? await this.prisma.user.findUnique({
          where: { id: actorId },
          select: { role: true },
        })
      : null;

    try {
      await this.prisma.appointmentAudit.create({
        data: {
          appointmentId: 'SYSTEM',
          userId,
          action,
          metadata: { details, performedBy: actorId || 'SYSTEM', actorRole: actorRole || actor?.role || 'UNKNOWN' },
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to create audit log for user ${userId}: ${(error as Error).message}`);
    }
  }
}
