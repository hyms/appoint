import { Module } from '@nestjs/common';
import { StrikesController } from './strikes.controller';
import { StrikeService } from './services/strike.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StrikesController],
  providers: [StrikeService, PrismaService],
  exports: [StrikeService],
})
export class StrikesModule {}
