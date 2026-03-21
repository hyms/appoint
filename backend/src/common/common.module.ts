import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuthorizationService } from './services/authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [AuditService, AuthorizationService, PrismaService],
  exports: [AuditService, AuthorizationService, PrismaService],
})
export class CommonModule {}
