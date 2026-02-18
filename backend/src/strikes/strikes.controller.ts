import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StrikeService } from './services/strike.service';
import { CreateStrikeDto, ResolveStrikeDto } from './dto/strike.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('strikes')
@UseGuards(JwtAuthGuard)
export class StrikesController {
  constructor(private readonly strikeService: StrikeService) {}

  // Create strike - Professionals only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROFESSIONAL', 'ADMIN')
  async createStrike(
    @Body() dto: CreateStrikeDto,
    @CurrentUser() user: any,
  ) {
    return this.strikeService.createStrike(user.id, dto);
  }

  // Get my strikes (as patient) - Any authenticated user
  @Get('my')
  async getMyStrikes(@CurrentUser() user: any) {
    return this.strikeService.getMyStrikes(user.id);
  }

  // Get strikes created by me (as professional) - Professionals only
  @Get('professional/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROFESSIONAL')
  async getMyProfessionalStrikes(@CurrentUser() user: any) {
    return this.strikeService.getProfessionalStrikes(user.id);
  }

  // Get strikes for a specific patient - Admin/Secretary/Professional (their own)
  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async getPatientStrikes(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    // If professional, only show strikes they created for this patient
    if (user.role === 'PROFESSIONAL') {
      return this.strikeService.getPatientStrikesWithProfessional(patientId, user.id);
    }
    // Admin/Secretary can see all
    return this.strikeService.getAllStrikes({ patientId });
  }

  // Get all strikes - Admin/Secretary only
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY')
  async getAllStrikes(
    @Query('patientId') patientId?: string,
    @Query('professionalId') professionalId?: string,
  ) {
    return this.strikeService.getAllStrikes({ patientId, professionalId });
  }

  // Resolve strike - Professional (own) or Admin
  @Post(':strikeId/resolve')
  async resolveStrike(
    @Param('strikeId') strikeId: string,
    @Body() dto: ResolveStrikeDto,
    @CurrentUser() user: any,
  ) {
    return this.strikeService.resolveStrike(strikeId, dto, user.id, user.role);
  }

  // Check if patient is blocked with specific professional
  @Get('check/:patientId/:professionalId')
  async checkBlocked(
    @Param('patientId') patientId: string,
    @Param('professionalId') professionalId: string,
  ) {
    const blocked = await this.strikeService.checkPatientBlocked(
      patientId,
      professionalId,
    );
    return { blocked, patientId, professionalId };
  }

  // Get stats - Professionals only (their own stats)
  @Get('stats/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROFESSIONAL')
  async getMyStats(@CurrentUser() user: any) {
    return this.strikeService.getStrikeStats(user.id);
  }

  // Cancel appointments due to strike - Professional or Admin
  @Post('cancel-appointments/:patientId/:professionalId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROFESSIONAL', 'ADMIN')
  async cancelAppointments(
    @Param('patientId') patientId: string,
    @Param('professionalId') professionalId: string,
    @CurrentUser() user: any,
  ) {
    // Professional can only cancel their own patient's appointments
    if (user.role === 'PROFESSIONAL' && user.id !== professionalId) {
      return { error: 'Can only cancel appointments for your own patients' };
    }
    return this.strikeService.cancelUpcomingAppointmentsForBlockedPatient(
      patientId,
      professionalId,
    );
  }
}
