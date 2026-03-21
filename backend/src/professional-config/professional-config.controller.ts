import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ProfessionalConfigService } from './professional-config.service';
import { UpdateProfessionalConfigDto } from './dto/professional-config.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('professional-config')
@UseGuards(JwtAuthGuard)
export class ProfessionalConfigController {
  constructor(private readonly service: ProfessionalConfigService) {}

  @Get('my')
  async getMyConfig(@CurrentUser() user: any) {
    return this.service.getConfig(user.id);
  }

  @Patch('my')
  @Roles('PROFESSIONAL')
  async updateMyConfig(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfessionalConfigDto,
  ) {
    return this.service.updateConfig(user.id, dto);
  }

  @Get(':professionalId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async getConfig(@Param('professionalId') professionalId: string) {
    return this.service.getConfig(professionalId);
  }

  @Patch(':professionalId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async updateConfig(
    @Param('professionalId') professionalId: string,
    @Body() dto: UpdateProfessionalConfigDto,
  ) {
    return this.service.updateConfig(professionalId, dto);
  }
}
