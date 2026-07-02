import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  login(loginDto: LoginDto) {
    console.log(loginDto);
    return 'login';
  }

  register(registerDto: RegisterDto) {
    console.log(registerDto);
    return 'register';
  }
}
