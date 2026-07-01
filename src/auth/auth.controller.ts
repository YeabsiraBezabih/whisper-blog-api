import { Controller, Get, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  login() {
    return '/login';
  }

  @Post('register')
  register() {
    return '/register';
  }

  @Post('refresh')
  refresh() {
    return '/refresh';
  }

  @Post('logout')
  logout() {
    return '/logout';
  }

  @Get('profile')
  getProfile() {
    return '/profile';
  }
}
