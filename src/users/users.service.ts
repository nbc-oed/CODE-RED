import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from 'src/common/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class UsersService {
  // create(createUserDto: CreateUserDto) {
  //   throw new Error('Method not implemented.');
  // }

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly awsService: AwsService,
  ) {}

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  async getAllUsers() {
    return this.usersRepository.find();
  }

  // 유저 상세 찾기

  async findOne(id: number) {
    const users = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'nickname', 'profile_image'],
    });

    if (!users) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    return users;
  }

  // 수정

  async update(
    id: number,
    user: Users,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const { name, nickname } = updateUserDto;
    // const users = await this.findUserById(user.id);
    const uploadedFile = file && (await this.awsService.uploadImage(file));

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (id !== user.id) {
      throw new UnauthorizedException('정보가 일치하지 않습니다.');
    }
    const updateUser = await this.usersRepository.update(user.id, {
      name,
      nickname,
      profile_image: uploadedFile,
    });

    return updateUser;
  }

  async findUserById(id: number) {
    return await this.usersRepository.findOne({ where: { id } });
  }

  // 삭제

  async remove(userId: number, user: Users) {
    const users = await this.findUserById(userId);

    if (!users) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    if (userId !== users.id) {
      throw new UnauthorizedException('정보가 일치하지 않습니다.');
    }

    return await this.usersRepository.delete(userId);
  }
}
