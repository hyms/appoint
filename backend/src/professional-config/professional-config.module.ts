import { Module } from '@nestjs/common';
import { ProfessionalConfigController } from './professional-config.controller';
import { ProfessionalConfigService } from './professional-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProfessionalConfigController],
  providers: [ProfessionalConfigService, PrismaService],
  exports: [ProfessionalConfigService],
})
export class ProfessionalConfigModule {}
