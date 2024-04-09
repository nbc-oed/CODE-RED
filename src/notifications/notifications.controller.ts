import { Controller, Post, Body, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}
}

/** Redis Stream을 이용한 실시간 재난 알림 서비스 구현 시나리오
 *
 * ㅁ 시나리오
 *  0. 사용자가 코드레드 웹/앱을 켜고, 위치정보 제공 동의를 '허용'한다.
 *  1. @사용자위치정보수집API @updateUserLocation
 *     Param과 Body(userId, longitude, latitude) 를 userId와 매핑하여 redis/DB에 저장/업데이트한다.
 *
 *     TODO - userId 연동해야함.
 *
 *  2. @역지오코딩_KAKAO_API
 *     @getAreaFromCoordinates
 *     Reverse-geocoding KAKAO API를 이용하여 위도-경도에서 지역명을 추출한다.
 *     서버는,
 *     @createStreamAndAssignUser
 *     동일한 스트림이 존재한다면, xadd() 명령어로 해당 지역 Stream의 컨슈머 그룹에 사용자를 할당한다.
 *     존재하지 않으면, xgroup() 명령어를 사용하여 지역명을 기반으로하는 식별자로 Stream을 생성한다.
 *
 *     TODO - Key 생성하는 함수를 별도 파일로 관리해야함.
 *
 * <------ Test 확인 ------->
 *
 *  3. @공공데이터수집API @Cron('45 * * * * *') fetchDisasterMessages
 *     NestJS 스케쥴러(Cron)를 이용하여 주기적으로 재난 문자 데이터를 파싱하여 가져오고, 필요한 정보(지역, 메세지 등)을 추출한다.
 *
 *     TODO - 재난 문자 -> disaster / emergency 분류 -> 각 Entity에 맞게 DB에 저장 -> fetch_지역명 = Reverse-geo_지역명 일치 여부를 확인하는 로직도 있어야함.
 *
 *  4. @RedisStream메세지추가API addDisasterMessageToStream
 *     stream의 이름인 지역명과 공공데이터를 수신한 지역명이 일치한다면, 해당 스트림의 사용자에게 메세지가 담긴 재난 문자를 발송한다.
 *      <알림 매칭 로직>
 *
 *  5. @사용자알림처리API sendNotificationToUsers
 *     생성된 특정 StreamId의 메세지를 읽고, 각 지역의 컨슈머 그룹을 순회하면서, 해당 지역의 사용자에게 해당하는 메시지를 전송한다. 사용자가 확인했다면, xack 처리를 해준다.
 *
 *  6. @사용자알림전송API @FCM @AWS_SMS
 *     FCM 및 AWS_SMS 푸시 서비스에 API 요청을 보내 실제로 사용자에게 푸시 알림을 전송한다.
 *
 */
