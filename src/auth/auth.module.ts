import { Module } from '@nestjs/common';
import { AuthService, KakaoLogin } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/common/entities/users.entity';
import { AwsModule } from 'src/aws/aws.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './guard/client-custom.guard';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    TypeOrmModule.forFeature([Users]),
    AwsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoLogin, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
