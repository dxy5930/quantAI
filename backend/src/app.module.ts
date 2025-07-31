import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StrategiesModule } from "./modules/strategies/strategies.module";
import { BacktestModule } from "./modules/backtest/backtest.module";
import { StocksModule } from "./modules/stocks/stocks.module";
import { SystemModule } from "./modules/system/system.module";
import { AIWorkflowModule } from "./modules/ai-workflow/ai-workflow.module";
import { HomeModule } from "./modules/home/home.module";
import { StickyNotesModule } from "./modules/sticky-notes/sticky-notes.module";
import { SharedModule } from "./shared/shared.module";
import { ApiPrefixModule } from "./shared/modules/api-prefix.module";
import { CACHE_CONSTANTS, THROTTLE_CONSTANTS } from "./shared/constants";

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_HOST", "localhost"),
        port: configService.get("DB_PORT", 3306),
        username: configService.get("DB_USERNAME", "root"),
        password: configService.get("DB_PASSWORD", ""),
        database: configService.get("DB_DATABASE", "chaogu"),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>("DB_SYNCHRONIZE", false),
        logging: configService.get<boolean>("DB_LOGGING", false),
        dropSchema: configService.get<boolean>("DB_DROP_SCHEMA", false),
        timezone: "+08:00",
        charset: "utf8mb4",
      }),
      inject: [ConfigService],
    }),

    // 限流模块
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get(
          "THROTTLE_TTL",
          THROTTLE_CONSTANTS.GLOBAL_TTL_SECONDS
        ),
        limit: configService.get(
          "THROTTLE_LIMIT",
          THROTTLE_CONSTANTS.GLOBAL_LIMIT
        ),
      }),
      inject: [ConfigService],
    }),

    // 缓存模块
    CacheModule.register({
      isGlobal: true,
      ttl: CACHE_CONSTANTS.USER_CACHE_TTL,
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // API前缀模块
    ApiPrefixModule.forRoot(),

    // 共享模块
    SharedModule,

    // 业务模块
    AuthModule,
    UsersModule,
    StrategiesModule,
    BacktestModule,
    StocksModule,
    SystemModule,
    AIWorkflowModule,
    HomeModule,
    StickyNotesModule,
  ],
})
export class AppModule {}
