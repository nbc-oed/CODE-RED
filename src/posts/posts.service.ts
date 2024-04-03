import { Injectable, UnauthorizedException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AwsService } from 'src/aws/aws.service';

import { CreatePostDto } from './dto/create-post.dto';
import { Posts } from 'src/common/entities/posts.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts) private readonly postsRepo: Repository<Posts>,
    private readonly awsService: AwsService,
  ) {}

  // TODO? 한 유저가 몇초 이내엔 글 연달아 못 쓰도록 제어
  async createPost(
    userId: number,
    file: Express.Multer.File,
    createPostDto: CreatePostDto,
  ) {
    const uploadedFile = file && (await this.awsService.uploadImage(file));

    const createdPost = await this.postsRepo.save({
      user_id: userId,
      post_image: uploadedFile,
      ...createPostDto,
    });

    return createdPost;
  }

  // TODO: GET methods need cashmanager
  // TODO: pagination
  async findAllPosts() {
    return await this.postsRepo.find({
      select: ['id', 'title', 'content', 'post_image', 'status', 'updated_at'],
    });
  }

  async findPost(postId: number) {
    return await this.postsRepo.findOneBy({ id: postId });
    // TODO?: join해서 user name or nickname 보여주기
  }

  async updatePost(
    userId: number,
    postId: number,
    file: Express.Multer.File,
    updatePostDto: Partial<CreatePostDto>,
  ) {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (userId !== post.user_id) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    const uploadedFile = file && (await this.awsService.uploadImage(file));

    const updatedPost = Object.assign(post, {
      post_image: uploadedFile,
      ...updatePostDto,
    });
    return await this.postsRepo.save(updatedPost);
  }

  async removePost(userId: number, postId: number) {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (userId !== post.user_id) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    return await this.postsRepo.remove(post);
  }
}
