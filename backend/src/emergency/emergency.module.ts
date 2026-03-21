import { Module } from '@nestjs/common';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './services/emergency.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EmergencyController],
  providers: [EmergencyService, PrismaService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
