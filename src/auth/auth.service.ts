import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/common/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'
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
        private readonly configService: ConfigService
    ){}

    async create(createUserDto: CreateUserDto) {
        const { email, password, passwordConfirm, name, nickname, phone_number} = createUserDto;
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await this.findEmail(email);
        
        // 이메일 중복 확인
        if(user){
          throw new ConflictException("이미 존재하는 이메일 입니다.");
        }
    
        // 비밀번호 확인
        if(password !== passwordConfirm){
          throw new BadRequestException("패스워드가 확인과 일치하지 않습니다.");
        }
        
        //phone_number 010-0000-0000 
        if(phone_number[3] !== "-" || phone_number[8] !== "-"){
            throw new BadRequestException("올바른 전화번호 형식이 아닙니다. 형식에 맞춰 입력해주세요. ex) 010-0000-0000")
        }

        // 유저 생성
        const newUser = this.usersRepository.create({
            email,
            password: hashPassword,
            name,
            nickname,
            phone_number,
        }
        
        );
        await this.usersRepository.save(newUser);
        }

      
    
    signToken(user: Pick<Users, 'email' | 'id'>, isRefreshToken: boolean){
        // Payload 에 들어갈 정보 (아무나 볼 수 있음)
        const payload = {
            email: user.email,
            sub: user.id,
            type: isRefreshToken ? 'refresh' : 'access',
        };

        return this.jwtService.sign(payload, {
            expiresIn : isRefreshToken ? 3600 : 300, //seconds
        })
    }

    // loginUser(user: Pick<Users, 'email' | 'id'>){
    //     return {
    //         accessToken: this.signToken(user, false),
    //         refreshToken: this.signToken(user, true),
    //     }
    // }

    async login(email: string, password: string) {
        const user = await this.usersRepository.findOne({
          select: ['id', 'email', 'password'],
          where: { email },
        });
    
        if(user === null){
          throw new Error("유저가 존재하지 않습니다.");
        }
    
        if (!(await bcrypt.compare(password, user.password))) {
          throw new Error('비밀번호를 확인해주세요.');
        }
    
        const payload = { email, sub: user.id };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }

    async authentication(user: Pick<Users, 'email' | 'password'>){
        const existingUser = await this.usersService.getUserByEmail(user.email);

        if(!existingUser){
            throw new UnauthorizedException('존재하지 않는 사용자입니다.');
        }

            // 입력된 비밀번호와 사용자 정보에 저장되어있는 hash 를 비교
        const passOk = await bcrypt.compare(user.password, existingUser.password);

        if(!passOk){
            throw new UnauthorizedException('비밀번호가 틀렸습니다.')
        }

        return existingUser;
    }

    // async loginWithEmail(user:Pick<Users, 'email' | 'password'>){
    //     const existingUser = await this.authentication(user);

    //     return this.loginUser(existingUser);
    // }

    // async registerWithEmail(user: Pick<Users, 'nickname'|'email'|'password'|'phone_number'>){
    //     const hash = await bcrypt.hash(
    //         user.password,
    //         HASH_ROUNDS,
    //     );

    //     const newUser = await this.usersService.createUser({
    //         ...user,
    //         password:hash,
    //      });

    //     return this.loginUser(newUser);
    // }

    async extractTokenFromHeader(header:string, isBearer:boolean){
        const splitToken = header.split(' ')

        const typeOfToken = isBearer ? 'Bearer':'Basic';

        if(splitToken.length !== 2 || splitToken[0] !== typeOfToken){
            throw new UnauthorizedException ('잘못된 토큰입니다.');
        }

        const token = splitToken[1];
        
        return token;
    }

    async findEmail( email : string ){
        return await this.usersRepository.findOne({ where : { email } });
      }


    verifyToken(token:string){
        const JWT_SECRET_KEY = this.configService.get<string>('JWT_SECRET_KEY'); // .env에서 JWT_SECRET_KEY 가져오기
        return this.jwtService.verify(token,{secret:JWT_SECRET_KEY})
    }
}
 

/**
 * 
 * 1) registerWithEmail
 *  - email, nickname, password 를 입력받아 사용자 생성
 *  - 생성 완료 시 accessToken refreshToken 반환
 * 
 * 2) loginWithEmail
 *  - email, password 입력 -> 사용자 검증 진행
 *  - 검증 완료 시 accessToken refreshToken 반환
 * 
 * 3) loginUser
 *  - 1) 2) 에서 필요한 accessToken refreshToken 반환하는 로직
 * 
 * 4) signToken
 *  - 3) 에서 필요한 accessToken refreshToken sign 하는 로직
 * 
 * 5) authentication
 *  - 2) 에서 로그인 진행 시 필요한 기본적인 검증 진행
 *      1. 사용자 존재 확인 (email)
 *      2. 비밀번호 맞는지 확인
 *      3. 상용자 정보 반환
 *      4. 2)에서 반환된 데이터를 기반으로 토큰 생성
 */