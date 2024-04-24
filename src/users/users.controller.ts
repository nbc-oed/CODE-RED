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
  Req,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { AuthGuard } from '@nestjs/passport';
import { LocationDto } from './dto/user-location.dto';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UtilsService } from 'src/utils/utils.service';
import { JwtAuthGuard } from 'src/auth/guard/client-custom.guard';
import { ClientsDto } from './dto/clients.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly utilsService: UtilsService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Post('register-location')
  async registerClientsLocation(
    @UserInfo() user: Users,
    @Body() body: ClientsDto,
  ) {
    const userId = user ? user.id : null;
    //uuid로 clientId 생성하는 함수
    let client_id = body.client_id;
    console.log('body => ', body);
    console.log('client_id => ', client_id);
    if (!client_id) {
      client_id = this.utilsService.getUUID();
    }

    const clientsDto = {
      ...body,
      user_id: userId,
      client_id: client_id,
    };
    const result = await this.usersService.saveClientsInfo(clientsDto);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('register-token')
  async registerToken(@UserInfo() user: Users, @Body() body: ClientsDto) {
    const userId = user ? user.id : null;
    //uuid로 clientId 생성하는 함수

    let client_id = body.client_id;
    if (!client_id) {
      client_id = this.utilsService.getUUID();
    }
    const clientsDto = {
      ...body,
      user_id: userId,
      client_id: client_id,
    };

    console.log('clientsDto => ####################', clientsDto);

    const result = await this.usersService.saveClientsInfo(clientsDto);
    return result;
  }

  // 만료된 사용자 푸시 토큰 삭제

  @Delete('/cleanup/tokens')
  async cleanUpOldClientsData() {
    await this.usersService.cleanUpOldClientsData();
    return {
      message: '1주일 지난 토큰 청소 완료',
    };
  }
}
