import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  UseGuards,
  Redirect,
} from '@nestjs/common';
import { MaydayService } from './mayday.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';
import { LocationDto } from './dto/location.dto';
import { RescueCompleteDto } from './dto/rescueCompleteDto.dto';
import { SendRescueMessageDto } from './dto/sendRescueMessage.dto';
import { query } from 'express';
@Controller('mayday')
@UseGuards(AuthGuard('jwt'))
export class MaydayController {
  constructor(private readonly maydayService: MaydayService) {}

  // 내위치 정보 저장
  @Post()
  async saveMyLocation(
    @UserInfo() user: Users,
    @Body() locationDto: LocationDto,
  ) {
    await this.maydayService.saveMyLocation(locationDto, user.id);
    return { message: '위치정보 저장 성공' };
  }

  // 내 위치 기반 유저 찾기
  @Get('findHelper')
  @Render('rescue/rescue-request')
  async findHelper(@UserInfo() user: Users) {
    const helpersAndDistance = await this.maydayService.findHelper(user.id);
    return {
      helpers: helpersAndDistance.helpers,
      distance: helpersAndDistance.distanceThreshold,
    };
  }

  // 구조 요청 보내기
  @Post('sos')
  async sendRequestRescue(
    @UserInfo() user: Users,
    @Body() sendRescueMessageDto: SendRescueMessageDto,
  ) {
    console.log('@@@@@@@@@@@@sendRescueMessageDto => ', sendRescueMessageDto);
    console.log('@@@@@@@@@@@@@@@user => ', user);

    await this.maydayService.sendRequestRescue(user.id, sendRescueMessageDto);
  }

  // 헬퍼 구조 요청 페이지
  @Get('help-request')
  @Render('rescue/helper')
  helper() {} // 수락  거절

  // 알림 받은 유저 정보 저장 및 거리 계산
  /* 알림 보낼때 세션같은걸로 유저 아이디 받아와야함 userId = 1 */
  /* 이곳은 helper가 수락 버튼을 누르면 작동되는 곳
    user = 도움 요청하는 사람 = userID 1
    helper = 도움 주는 사람 = helperID 2
    locationDto = 도움 주는 사람의 현재 위치 정보 가져오기(확실하게 하기 위하여)
  */
  @Post('accept-rescue')
  async acceptRescue(
    @UserInfo() helper: Users,
    @Body() locationDto: LocationDto,
  ) {
    const distance = await this.maydayService.acceptRescue(
      1,
      helper.id,
      locationDto,
    );

    return { message: `유저와 헬퍼의 최단 거리 ${distance}Km` };
  }

  @Get('rescue-request-loading')
  @Render('rescue/rescue-request-loading')
  loading() {}

  // 구조 요청 완료 하기
  @Post('rescue-complete')
  async rescueComplete(
    @UserInfo() user: Users,
    @Body() rescueCompleteDto: RescueCompleteDto,
  ) {
    await this.maydayService.rescueComplete(user.id, rescueCompleteDto);
  }
}
