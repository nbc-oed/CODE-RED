import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Render,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/common/decorator/user.decorator';
import { Users } from 'src/common/entities/users.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UserInfo() user: Users,
    @UploadedFile() file: Express.Multer.File,
    @Body() createPostDto: CreatePostDto,
  ) {
    return await this.postsService.createPost(user.id, file, createPostDto);
  }

  @Get('/api')
  async findAllPostsApi(@Query() query: { page: string; search: string }) {
    const posts = await this.postsService.getAllPosts(
      +query.page || 1,
      query.search,
    );

    return posts;
  }

  @Get()
  @Render('posts/post-list')
  async servePostList() {
    const posts = await this.postsService.getAllPosts(1);

    return {
      posts,
    };
  }

  @Get('newpost')
  @Render('posts/create-post')
  servePostPage() {}

  @Get('api/:postId')
  async getPostDetail(@Param('postId') postId: string) {
    return await this.postsService.getPost(+postId);
  }

  @Get(':postId')
  @Render('posts/post-detail')
  async servePost(@Param('postId') postId: string) {
    return await this.postsService.getPostWithUserInfo(+postId);
  }

  @Patch(':postId')
  @UseInterceptors(FileInterceptor('image'))
  updatePost(
    @Param('postId') postId: string,
    @UserInfo() user: Users,
    @UploadedFile() file: Express.Multer.File,
    @Body() updatePostDto: Partial<CreatePostDto>,
  ) {
    return this.postsService.updatePost(user.id, +postId, file, updatePostDto);
  }

  @Delete(':postId')
  removePost(@UserInfo() user: Users, @Param('postId') postId: string) {
    return this.postsService.removePost(user.id, +postId);
  }
}
