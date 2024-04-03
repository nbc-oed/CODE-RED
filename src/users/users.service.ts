import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  // create(createUserDto: CreateUserDto) {
  //   throw new Error('Method not implemented.');
  // }

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ){}


// 유저 생성

  async createUser(user:Pick<Users, 'email' | 'nickname' | 'password'|'phone_number'>) {
    // nickname 중복 확인 / exist()는 조건에 해당되는 값이 존재할 시 true 반환
    const nicknameExists = await this.usersRepository.exist({
      where:{
        nickname: user.nickname,
      }
    })

      if(nicknameExists){
        throw new BadRequestException('이미 존재하는 nickname 입니다.')
      }

      const emailExists = await this.usersRepository.exist({
        where:{
          email: user.email,
        }
      })
  
        if(emailExists){
          throw new BadRequestException('이미 가입된 이메일 입니다.')
        }
    
    const userObject = this.usersRepository.create({
      nickname:user.nickname,
      email:user.email,
      password:user.password,
    })

    const newUser = await this.usersRepository.save(userObject);

    return newUser;
  }

  
  async getUserByEmail(email:string){
    return this.usersRepository.findOne({
      where:{
        email,
      }
    });
  }

  async getAllUsers(){
    return this.usersRepository.find();
  }


// 유저 상세 찾기

async findOne(id: number) {
  const users = await this.usersRepository.findOne({ where : { id },
  select: ['id', 'email', 'phone_number', 'name', 'nickname', 'profile_image']});

  if(!users){
    throw new NotFoundException("유저가 존재하지 않습니다.");
  }

  return users;
}


// 수정

async update(userId : number, user : Users, updateUserDto: UpdateUserDto) {
  const {name, nickname, profile_image} =  updateUserDto
  const users = await this.findUserById(userId);

  if(!users){
    throw new NotFoundException("유저가 존재하지 않습니다.");
  }
  
  if(userId !== user.id){
    throw new UnauthorizedException("정보가 일치하지 않습니다.");
  }
  // const test = await this.usersRepository.update(user.id, {name, nickname});
  return {message:'유저 정보가 수정되었습니다.'}
}

async findUserById (id : number) {
  return await this.usersRepository.findOne({ where : { id } });
}
  

// 삭제

async remove(userId : number, user : Users) {
  const users = await this.findUserById(userId);

  if(!users){
    throw new NotFoundException("유저가 존재하지 않습니다.");
  }

  if(userId !== users.id){
    throw new UnauthorizedException("정보가 일치하지 않습니다.");
  }

  return {message:'아이디가 삭제되었습니다.'}
  // return await this.usersRepository.delete(userId);
}

}
