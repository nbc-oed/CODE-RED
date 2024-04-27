import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/common/entities/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AwsModule } from 'src/aws/aws.module';
import { Clients } from 'src/common/entities/clients.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MaydayModule } from 'src/mayday/mayday.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users, Clients]),
    AwsModule,
    forwardRef(() => NotificationsModule),
    UtilsModule,
    ScheduleModule,
    MaydayModule,
  ],
  exports: [UsersService, JwtStrategy],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
})
export class UsersModule {}
