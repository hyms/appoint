import { Module } from '@nestjs/common';
import { SlotController } from './slots.controller';
import { SlotService } from './services/slot.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SlotController],
  providers: [SlotService, PrismaService],
  exports: [SlotService],
})
export class SlotsModule {}
