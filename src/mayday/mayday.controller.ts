import { Controller, Get, Post, Body, Render, UseGuards } from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { CreateLocationDto } from './dto/create-location.dto';

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
    @Body() createLocationDto: CreateLocationDto,
  ) {
    await this.maydayService.saveMyLocation(createLocationDto, user.id);
  }

  // 내 위치 기반 유저 찾기
  @Get('findHelper')
  async findHelper(@UserInfo() user: Users) {
    const helper = await this.maydayService.findHelper(user.id);

    return { message: `1km안에 나를 도와줄수 있는 사람 ${helper}` };
  }
}
