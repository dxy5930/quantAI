import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";
import { PythonApiClient } from "../../shared/clients/python-api.client";
import { User } from "../../shared/entities/user.entity";
import { Strategy } from "../../shared/entities/strategy.entity";
import { BacktestHistory } from "../../shared/entities/backtest-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Strategy, BacktestHistory]),
    HttpModule,
  ],
  controllers: [HomeController],
  providers: [HomeService, PythonApiClient],
  exports: [HomeService],
})
export class HomeModule {}