import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { AuthGuard } from '@nestjs/passport';
import { LocationDto } from './dto/user-location.dto';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 모든 유저 조회
  @Get()
  @UseGuards(AuthGuard('jwt'))
  getUsers() {
    return this.usersService.getAllUsers();
  }

  // 유저 상세 조회
  @Get(':id')
  async getOneUsers(@Param('id') id: number) {
    return await this.usersService.findOne(id);
  }

  // 유저 수정
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: number,
    @UserInfo() user: Users,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.usersService.update(id, user, updateUserDto, file);
  }

  //유저 삭제
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: number, @UserInfo() user: Users) {
    return await this.usersService.remove(id, user);
  }
  //사용자 위치정보 수집
  @Post('location')
  async updateUserLocation(@Body() locationDto: LocationDto) {
    const data = await this.usersService.updateUserLocation(locationDto);
    return data;
  }
}
