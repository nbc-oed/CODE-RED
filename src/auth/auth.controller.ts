import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from 'src/users/dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  @UseInterceptors(FileInterceptor('image'))
  async signUp(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.authService.signUp(file, createUserDto);
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
