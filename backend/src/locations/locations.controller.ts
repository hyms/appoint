import { Controller, Get, UseGuards } from '@nestjs/common';
import { LocationService } from './services/location.service';
import { JwtAuthGuard } from '../auth/guards/roles.guard';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  async getActiveLocations() {
    return this.locationService.getActiveLocations();
  }
}
