import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, MagicLinkDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async generateMagicLink(@Body() magicLinkDto: MagicLinkDto) {
    return this.authService.generateMagicLink(magicLinkDto);
  }

  @Post('magic-link/validate')
  @HttpCode(HttpStatus.OK)
  async validateMagicLink(@Body('token') token: string) {
    return this.authService.validateMagicLink(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }
}
