import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  UseGuards,
  Redirect,
  Query,
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

    const message = await this.maydayService.sendRequestRescue(
      user.id,
      sendRescueMessageDto,
    );
    console.log('sos 컨트롤러에서 받은 message => ', message);
    return message;
  }

  // 헬퍼 구조 요청 페이지
  //localhost:3000/mayday/help-request?distance=1&username=홍길동&message=살려주세요..
  @Get('help-request')
  @Render('rescue/helper')
  helperPage(@Query() rescue: any) {
    const { distance, username, message } = rescue;

    return { distance: distance, username: username, message: message };
  }

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
    const result = await this.maydayService.acceptRescue(
      helper.id,
      locationDto,
    );

    return {
      distance: result.distance,
      helperName: result.helperName,
      message: result.message,
    };
  }

  @Get('matchHelper')
  @Render('rescue/matchHelper')
  matchHelperPage(@Query() helpeInfo: any) {
    console.log('@@@@@@@@@@@@@helpeInfo => ', helpeInfo);

    const { distance, helperName, message } = helpeInfo;
    console.log('@@@@@@@@@@@@@distance => ', distance);
    console.log('@@@@@@@@@@@@@helperName => ', helperName);
    console.log('@@@@@@@@@@@@@message => ', message);

    return { distance: distance, helperName: helperName, message: message };
  }

  @Get('match')
  @Render('rescue/matchHelper')
  async matchUserPage(@UserInfo() user: Users) {
    console.log('@@@@@@@@@@@user@@@@@@', user);

    const matchInfo = await this.maydayService.matchInfo(user.id);

    return {
      distance: matchInfo.distance,
      helperName: matchInfo.helperName,
      message: matchInfo.message,
    };
  }

  // 구조 요청 완료 하기
  @Post('rescue-complete')
  async rescueComplete(
    @UserInfo() user: Users,
    @Body() rescueCompleteDto: RescueCompleteDto,
  ) {
    await this.maydayService.rescueComplete(user.id, rescueCompleteDto);
  }
}
