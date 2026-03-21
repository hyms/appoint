import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AppointmentsService } from './services/appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  CancelAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ============ ADMIN CRUD - List All ============

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllAppointments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getAllAppointments({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      patientId,
      professionalId,
      startDate,
      endDate,
    });
  }

  // ============ PATIENT ENDPOINTS - Specific routes first ============

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.getPatientAppointments(user.id);
  }

  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  async getUpcoming(@CurrentUser() user: any) {
    return this.appointmentsService.getUpcomingAppointments(user.id, user.role);
  }

  // ============ ADMIN/SECRETARY/PROFESSIONAL ENDPOINTS ============

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async getPatientAppointments(@Param('patientId') patientId: string) {
    return this.appointmentsService.getPatientAppointments(patientId);
  }

  @Get('professional')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async getProfessionalAppointments(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getProfessionalAppointments(
      user.id,
      startDate,
      endDate,
    );
  }

  // ============ CRUD OPERATIONS ============

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    const patientId = dto.patientId || user.id;
    return this.appointmentsService.createAppointment(
      { ...dto, patientId },
      user.id,
      user.role,
    );
  }

  // ============ ADMIN BY ID - Must be after specific routes ============

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAppointmentByIdAdmin(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentByIdAdmin(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteAppointment(@Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(id);
  }

  // ============ OTHER OPERATIONS ============

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, dto, user.id, user.role);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.cancelAppointment(
      id,
      dto,
      user.id,
      user.role,
    );
  }
}
