import { IsNotEmpty, IsString } from 'class-validator';

export class SendRescueMessageDto {
  @IsString()
  @IsNotEmpty({ message: '어떠한 도움이 필요한지 적어주세요!' })
  context: string;

  @IsString({ each: true })
  @IsNotEmpty({ message: '도와줄수 있는 헬퍼가 없습니다.' })
  helpers: string[];
}
