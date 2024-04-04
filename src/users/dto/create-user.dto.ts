import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '패스워드를 입력해주세요.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '패스워드 확인을 입력해주세요.' })
  passwordConfirm: string;

  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '별명을 입력해주세요.' })
  nickname: string;

  @IsString()
  @Matches(/^\d{3}-\d{3,4}-\d{4}$/, {
    message:
      '올바른 전화번호 형식이 아닙니다. 형식에 맞춰 입력해주세요. ex) 010-0000-0000',
  })
  @IsNotEmpty({ message: '핸드폰 번호를 입력해주세요.' })
  phone_number: string;

  @IsString()
  @IsOptional()
  profile_image: string;
}
