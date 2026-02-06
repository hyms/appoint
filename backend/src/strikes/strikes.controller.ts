import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StrikeService } from './services/strike.service';
import { CreateStrikeDto, ResolveStrikeDto } from './dto/strike.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('strikes')
export class StrikeController {
  constructor(private readonly strikeService: StrikeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async createStrike(@Body() dto: CreateStrikeDto, @CurrentUser() user: any) {
    return this.strikeService.createStrike(user.id, dto);
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async getPatientStrikes(@Param('patientId') patientId: string) {
    return this.strikeService.getPatientStrikes(patientId);
  }

  @Get('professional')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async getProfessionalStrikes(@CurrentUser() user: any) {
    return this.strikeService.getProfessionalStrikes(user.id);
  }

  @Post(':strikeId/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL')
  async resolveStrike(
    @Param('strikeId') strikeId: string,
    @Body() dto: ResolveStrikeDto,
    @CurrentUser() user: any,
  ) {
    return this.strikeService.resolveStrike(strikeId, dto, user.id);
  }

  @Get('check/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async checkPatientBlocked(
    @Param('patientId') patientId: string,
    @Query('professionalId') professionalId?: string,
  ) {
    if (professionalId) {
      return { blocked: await this.strikeService.checkPatientBlocked(patientId, professionalId) };
    }
    return this.strikeService.isPatientBlockedForAny(patientId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async getStats(@CurrentUser() user: any) {
    return this.strikeService.getStrikeStats(user.id);
  }

  @Post('cancel-appointments/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async cancelAppointments(@Param('patientId') patientId: string) {
    return this.strikeService.cancelUpcomingAppointmentsForBlockedPatient(patientId);
  }
}
