import { Controller, Post, Get, Body, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { SlotService } from './services/slot.service';
import { GenerateSlotsDto, BlockSlotDto } from './dto/slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async generateSlots(@Body() dto: GenerateSlotsDto, @CurrentUser() user: any) {
    return this.slotService.generateSlots({
      ...dto,
      professionalId: dto.professionalId || user.id,
    });
  }

  @Get('available/:professionalId')
  async getAvailableSlots(
    @Param('professionalId') professionalId: string,
    @Query('date') date: string,
  ) {
    return this.slotService.getAvailableSlots(professionalId, date);
  }

  @Get('professional/:professionalId')
  async getSlotsByProfessional(
    @Param('professionalId') professionalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.slotService.getSlotsByProfessional(professionalId, startDate, endDate);
  }

  @Post('block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async blockSlot(@Body() dto: BlockSlotDto) {
    return this.slotService.blockSlot(dto);
  }

  @Delete(':slotId/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROFESSIONAL', 'SECRETARY')
  async unblockSlot(@Param('slotId') slotId: string) {
    return this.slotService.unblockSlot(slotId);
  }

  @Delete('cleanup/:professionalId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async cleanupExpiredSlots(@Param('professionalId') professionalId: string) {
    return this.slotService.deleteExpiredSlots(professionalId);
  }
}
