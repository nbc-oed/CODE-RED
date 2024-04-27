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
  Render,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UtilsService } from 'src/utils/utils.service';
import { JwtAuthGuard } from 'src/auth/guard/client-custom.guard';
import { ClientsDto } from './dto/clients.dto';
import { MaydayService } from 'src/mayday/mayday.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly utilsService: UtilsService,
    private readonly maydayService: MaydayService,
  ) {}

  // 모든 유저 조회
  @Get()
  @UseGuards(AuthGuard('jwt'))
  getUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('/api/myId')
  @UseGuards(AuthGuard('jwt'))
  getMyUserId(@UserInfo() user: Users) {
    return user.id;
  }

  // 유저 상세 조회
  @Get('/myinfo')
  @UseGuards(AuthGuard('jwt'))
  @Render('member/myinfo')
  async getOneUsers(@UserInfo() user: Users) {
    return await this.usersService.findOne(user.id);
  }

  // 유저 수정
  @Patch('/myinfo')
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
  @Delete('/myinfo')
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
    if (userId) {
      const location = {
        latitude: body.latitude,
        longitude: body.longitude,
      };
      await this.maydayService.saveMyLocation(location, userId);
    }
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
