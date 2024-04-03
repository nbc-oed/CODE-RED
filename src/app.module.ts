import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CommonModule } from './common/common.module';
import { Users } from './common/entities/users.entity';
import { Posts } from './common/entities/posts.entity';
import { Follows } from './common/entities/follows.entity';
import { Scores } from './common/entities/scores.entity';
import { MaydayRecords } from './common/entities/mayday-records.entity';
import { Shelters } from './common/entities/shelters.entity';
import { EmergencyData } from './common/entities/emergency-data.entity';
import { DisasterData } from './common/entities/disaster-data.entity';
import { NotificationMessages } from './common/entities/notification-messages.entity';
import { AwsModule } from './aws/aws.module';
import { UtilsModule } from './utils/utils.module';
import { validationSchema } from './common/config/env.config';
import { NewsModule } from './news/news.module';
import { News } from './news/entities/news.entity';
import { RealTimeInfomationModule } from './real-time-infomation/real-time-infomation.module';

const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    namingStrategy: new SnakeNamingStrategy(), //TypeORM에서 사용되는 네이밍 전략 중 하나, 데이터베이스 테이블과 컬럼의 이름을 스네이크 케이스(snake_case)로 변환하는 전략
    type: 'postgres',
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    database: configService.get('DB_NAME'),
    synchronize: configService.get('DB_SYNC'), // 데이터베이스 스키마와 애플리케이션의 엔티티 클래스 간의 동기화를 제어, 일반적으로 false로 설정하여 동기화를 방지
    entities: [
      Users,
      Posts,
      Follows,
      Scores,
      MaydayRecords,
      Shelters,
      EmergencyData,
      DisasterData,
      NotificationMessages,
      News,
    ],
    logging: true, // 데이터베이스 쿼리를 로깅할지 여부를 제어, 이 옵션을 true로 설정하면 TypeORM이 실행된 쿼리를 콘솔에 로그로 출력
  }),
  inject: [ConfigService], // 여기서 먼저 주입을 해주어야 useFactory에서 주입된 ConfigService를 사용할수 있음.
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    CommonModule,
    AwsModule,
    UtilsModule,
    NewsModule,
    RealTimeInfomationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
