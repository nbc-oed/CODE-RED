import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

    // 모든 유저 조회
  @Get()
  getUsers(){
    return this.usersService.getAllUsers();
  }

  // 유저 상세 조회
  @Get(":id")
  async getOneUsers(
    @Param('id') id: number) {
    return await this.usersService.findOne(id);
  }


  // 유저 수정 
    @Patch(':id')
    async update(
      @Param('id') id : number,
      @UserInfo() user:Users,
      @Body() updateUserDto: UpdateUserDto) 
      {
      return await this.usersService.update(id,user, updateUserDto);
    }
  
    //유저 삭제
    @Delete(':id')
    async remove(
      @Param('id') id : number, 
      @UserInfo() user : Users)
      {
      return await this.usersService.remove(id, user);
    }
}
