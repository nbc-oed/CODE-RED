import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from 'src/users/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signUp(createUserDto);
  }

  @Post('/sign-in')
  async signIn(@Body() loginDto: LoginDto, @Res() res) {
    const user = await this.authService.signIn(
      loginDto.email,
      loginDto.password,
    );
    res.cookie('authorization', `Bearer ${user.access_token}`);
    res.end();
  }
}
