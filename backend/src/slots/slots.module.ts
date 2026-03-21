import { Module } from '@nestjs/common';
import { SlotController } from './slots.controller';
import { SlotService } from './services/slot.service';
import { ProfessionalConfigService } from '../professional-config/professional-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SlotController],
  providers: [SlotService, PrismaService, ProfessionalConfigService],
  exports: [SlotService],
})
export class SlotsModule {}
