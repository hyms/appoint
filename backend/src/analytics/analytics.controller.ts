import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService, OccupationFilter } from './services/analytics.service';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('occupation')
  @Roles('ADMIN', 'SECRETARY')
  async getAgendaOccupation(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('professionalId') professionalId?: string,
    @Query('locationId') locationId?: string,
  ) {
    const filters: OccupationFilter = {
      startDate,
      endDate,
      professionalId,
      locationId,
    };
    return this.analyticsService.getAgendaOccupation(filters);
  }
}