import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  create(userId: number, createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }

  findAllPosts() {
    return `This action returns all posts`;
  }

  findPost(postId: number) {
    return `This action returns a #${postId} post`;
  }

  updatePost(
    userId: number,
    postId: number,
    updatePostDto: Partial<CreatePostDto>,
  ) {
    return `This action updates a #${postId} post`;
  }

  removePost(userId: number, postId: number) {
    return `This action removes a #${postId} post`;
  }
}
