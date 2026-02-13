import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { EmergencyService } from './services/emergency.service';
import { ActivateEmergencyDto, DeactivateEmergencyDto } from './dto/emergency.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus() {
    return this.emergencyService.getEmergencyStatus();
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async activate(@Body() dto: ActivateEmergencyDto) {
    return this.emergencyService.activateEmergency(dto);
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async deactivate(@Body() dto: DeactivateEmergencyDto) {
    return this.emergencyService.deactivateEmergency(dto);
  }

  @Get('affected-patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async getAffectedPatients() {
    return this.emergencyService.getAffectedPatients();
  }
}
