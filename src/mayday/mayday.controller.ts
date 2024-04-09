import { Controller, Get, Post, Body, Render, UseGuards } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { LocationDto } from './dto/location.dto';

@Controller('mayday')
@UseGuards(AuthGuard('jwt'))
export class MaydayController {
  constructor(private readonly maydayService: MaydayService) {}

  // 지울것
  @Get()
  @Render('index')
  main() {
    return { title: '내 위치 정보 저장' };
  }

  // 내위치 정보 저장
  @Post()
  async saveMyLocation(
    @UserInfo() user: Users,
    @Body() locationDto: LocationDto,
  ) {
    await this.maydayService.saveMyLocation(locationDto, user.id);
  }

  // 내 위치 기반 유저 찾기
  @Get('findHelper')
  async findHelper(@UserInfo() user: Users) {
    const helper = await this.maydayService.findHelper(user.id);

    return { message: `1km안에 나를 도와줄수 있는 사람 ${helper}` };
  }

  // 알림 받은 유저 정보 저장 및 거리 계산
  @Post('accept-rescue')
  async acceptRescue(
    @UserInfo() user: Users,
    @Body() locationDto: LocationDto,
  ) {
    const distance = await this.maydayService.acceptRescue(
      user.id,
      locationDto,
    );

    return { message: `유저와 헬퍼의 최단 거리 ${distance}Km` };
  }
}
