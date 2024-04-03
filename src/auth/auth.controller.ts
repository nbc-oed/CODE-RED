import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from 'src/users/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  
  @Post('/sign-up')
  async create(@Body() createUserDto:CreateUserDto){
    return await this.authService.create(createUserDto);
  }
  
  // registerEmail(
  //   @Body('nickname') nickname:string,
  //   @Body('email') email:string,
  //   @Body('password') password:string,
  //   @Body('phone_number') phone_number:number,
  //   ){
  //     return this.authService.registerWithEmail({
  //       nickname,
  //       email,
  //       password,
  //       phone_number,
  //     })
  //   }
    
    @Post('/sign-in')
    async login(@Body() loginDto: LoginDto, @Res() res) {
      const user = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );
      res.cookie("authorization", `Bearer ${user.access_token}`);
      res.send("로그인 성공");
    }
  }
    // loginEmail(
    //   @Body('email') email:string,
    //   @Body('password') password:string,
    // ){
    //   return this.authService.loginWithEmail({
    //     email,
    //     password,
    //   });
    // }
