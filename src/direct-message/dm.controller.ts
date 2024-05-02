import {
  Controller,
  Get,
  Param,
  Query,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { DmService } from './dm.service';

@UseGuards(AuthGuard('jwt'))
@Controller('/dm')
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @Get()
  @Render('dm/dm-list')
  async serveDmList(@UserInfo() user: Users) {
    const dmList = await this.dmService.getDmList(user.id);

    return { data: dmList };
  }

  @Get('/:roomName')
  @Render('dm/dm')
  async serveDmPage() {
    return {
      title: 'Direct Messages',
    };
  }

  @Get('/history/:roomName')
  async getDmHistory(
    @Param('roomName') roomName: string,
    @Query('page') page: string,
    @UserInfo() user: Users,
  ) {
    return await this.dmService.getDmHistory(
      roomName,
      user.id,
      page ? +page : 0,
    );
  }

  @Get('/userinfo/:roomName')
  async getUserInfoByRoomName(
    @Param('roomName') roomName: string,
    @UserInfo() user: Users,
  ) {
    return await this.dmService.getUserInfo(roomName, +user.id);
  }
}
