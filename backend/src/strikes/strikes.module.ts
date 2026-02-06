import { Module } from '@nestjs/common';
import { StrikeController } from './strikes.controller';
import { StrikeService } from './services/strike.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StrikeController],
  providers: [StrikeService, PrismaService],
  exports: [StrikeService],
})
export class StrikesModule {}
