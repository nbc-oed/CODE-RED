import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

// TODO: apply user guard, userInfo decorator
// TODO: apply S3 interceptor to create, update methods
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(1, createPostDto);
  }

  @Get()
  findAllPosts() {
    return this.postsService.findAllPosts();
  }

  @Get(':postId')
  findPost(@Param('postId') postId: string) {
    return this.postsService.findPost(+postId);
  }

  @Patch(':postId')
  updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: Partial<CreatePostDto>,
  ) {
    return this.postsService.updatePost(1, +postId, updatePostDto);
  }

  @Delete(':postId')
  removePost(@Param('postId') postId: string) {
    return this.postsService.removePost(1, +postId);
  }
}
