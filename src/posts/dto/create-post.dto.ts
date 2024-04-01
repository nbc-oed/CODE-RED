import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostStatus } from 'src/common/types/post-status.type';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status: string = PostStatus.Available;
}
