import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/common/entities/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/auth/guard/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [
    /** */
    // PassportModule.register({defaultStrategy:'jwt'}),
    // JwtModule.register({
    //   secret:'JWT_SECRET_KEY',
    //   signOptions:{expiresIn: '1h'}
    // }),
    /** */
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users]),
    AwsModule,
    NotificationsModule,
  ],
  exports: [UsersService, JwtStrategy],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  /** */
  // exports: [JwtStrategy, PassportModule]
  /** */
})
export class UsersModule {}
