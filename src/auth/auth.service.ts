import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/common/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const { email, password, passwordConfirm, name, nickname, phone_number } =
      createUserDto;
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.getUserByEmail(email);

    // 이메일 중복 확인
    if (user) {
      throw new ConflictException('이미 존재하는 이메일 입니다.');
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      throw new BadRequestException('패스워드가 확인과 일치하지 않습니다.');
    }

    // 유저 생성
    const newUser = this.usersRepository.create({
      email,
      password: hashPassword,
      name,
      nickname,
      phone_number,
    });

    return this.usersRepository.save(newUser);
  }

  async signIn(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      select: ['id', 'email', 'password'],
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('비밀번호를 확인해주세요.');
    }

    const payload = { email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async authentication(user: Pick<Users, 'email' | 'password'>) {
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    // 입력된 비밀번호와 사용자 정보에 저장되어있는 hash 를 비교
    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existingUser;
  }

  async extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');

    const typeOfToken = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== typeOfToken) {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    const token = splitToken[1];

    return token;
  }

  verifyToken(token: string) {
    const JWT_SECRET_KEY = this.configService.get<string>('JWT_SECRET_KEY'); // .env에서 JWT_SECRET_KEY 가져오기
    return this.jwtService.verify(token, { secret: JWT_SECRET_KEY });
  }
}
