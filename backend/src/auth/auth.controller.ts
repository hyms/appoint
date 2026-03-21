import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
  Param,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  UpdateUserDto,
  ValidateMagicLinkDto,
  GetUsersQueryDto,
  UserIdParamDto,
  UpdateTelegramChatIdDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/roles.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    // Use forwarded IP if behind proxy, otherwise use direct IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || ip || 'unknown';
    return this.authService.login(loginDto, clientIp);
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'magic-link': { limit: 3, ttl: 60000 } })
  async generateMagicLink(
    @Body() magicLinkDto: MagicLinkDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || ip || 'unknown';
    return this.authService.sendMagicLink(magicLinkDto, clientIp);
  }

  @Post('magic-link/validate')
  @HttpCode(HttpStatus.OK)
  async validateMagicLink(@Body() dto: ValidateMagicLinkDto) {
    return this.authService.validateMagicLink(dto.token);
  }

  @Post('request-telegram-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'telegram-link': { limit: 3, ttl: 60000 } })
  async requestTelegramAuth(
    @Body() magicLinkDto: MagicLinkDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || ip || 'unknown';
    return this.authService.requestTelegramAuth(magicLinkDto, clientIp);
  }

  @Get('telegram/validate')
  @HttpCode(HttpStatus.OK)
  async validateTelegramAuth(@Query('token') token: string) {
    return this.authService.validateTelegramToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  @Get('one-signal-player-id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getOneSignalPlayerId(@CurrentUser() user: any) {
    return this.authService.getOneSignalPlayerId(user.id);
  }

  @Post('one-signal-id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateOneSignalId(
    @CurrentUser() user: any,
    @Body('playerId') playerId: string,
  ) {
    return this.authService.updatePlayerId(user.id, playerId);
  }

  @Patch('telegram-chat-id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateTelegramChatId(
    @CurrentUser() user: any,
    @Body() dto: UpdateTelegramChatIdDto,
  ) {
    return this.authService.updateTelegramChatId(user.id, dto.telegramChatId);
  }

  @Get('professionals')
  @UseGuards(JwtAuthGuard)
  async getProfessionals() {
    return this.authService.getProfessionals();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.authService.getUsers(query.role);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUserById(@Param() params: UserIdParamDto) {
    return this.authService.getUserById(params.id);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createUser(@Body() createUserDto: RegisterDto) {
    return this.authService.createUser(createUserDto);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateUser(
    @Param() params: UserIdParamDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(params.id, updateUserDto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param() params: UserIdParamDto, @CurrentUser() user: any) {
    return this.authService.deleteUser(params.id, user.id);
  }
}
