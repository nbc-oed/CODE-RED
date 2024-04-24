import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import _ from 'lodash';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AwsService } from 'src/aws/aws.service';

import { CreatePostDto } from './dto/create-post.dto';
import { Posts } from 'src/common/entities/posts.entity';
import { Users } from 'src/common/entities/users.entity';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts) private readonly postsRepo: Repository<Posts>,
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    private readonly awsService: AwsService,
    private readonly utilsService: UtilsService,
  ) {}

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

  async getAllPosts(page: number, search?: string) {
    const queryBuilder = this.postsRepo
      .createQueryBuilder('posts')
      .select([
        'posts.id',
        'posts.title',
        'posts.post_image',
        'posts.status',
        'posts.updated_at',
      ])
      .orderBy('updated_at', 'DESC')
      .skip((page - 1) * 6)
      .take(6);

    if (search && search !== '') {
      queryBuilder.andWhere('posts.title LIKE :search', {
        search: `%${search}%`,
      });
    }

    const posts = (await queryBuilder.getMany()).map((post) => ({
      ...post,
      title:
        post.title.length > 20 ? post.title.slice(0, 20) + '...' : post.title,
      post_image: post.post_image || '/img/no-image.png',
      updated_at: this.utilsService.getPastTime(new Date(post.updated_at)),
    }));

    return posts;
  }

  async getPostWithUserInfo(postId: number) {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (_.isNil(post)) throw new NotFoundException();

    const user = await this.usersRepo.findOneBy({ id: post.user_id });

    const isUpdated = !_.isEqual(post.created_at, post.updated_at);

    return {
      ...post,
      isUpdated,
      created_at: new Date(post.created_at).toLocaleString(),
      updated_at: new Date(post.updated_at).toLocaleString(),
      user: { ...user },
    };
  }

  async getPost(postId: number) {
    return await this.postsRepo.findOneBy({ id: postId });
  }

  async updatePost(
    userId: number,
    postId: number,
    file: Express.Multer.File,
    updatePostDto: Partial<CreatePostDto>,
  ) {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (userId !== post.user_id) throw new UnauthorizedException();
    if (_.isNil(post)) throw new NotFoundException();

    const uploadedFile = file && (await this.awsService.uploadImage(file));

    const updatedPost = Object.assign(post, {
      post_image: uploadedFile,
      ...updatePostDto,
    });

    return await this.postsRepo.save(updatedPost);
  }

  async removePost(userId: number, postId: number) {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (userId !== post.user_id) throw new UnauthorizedException();

    return await this.postsRepo.remove(post);
  }
}
