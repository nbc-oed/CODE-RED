import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsModule } from 'src/aws/aws.module';
import { Posts } from 'src/common/entities/posts.entity';
import { Users } from 'src/common/entities/users.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Posts, Users]),
    AwsModule,
    NotificationsModule,
    UtilsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
