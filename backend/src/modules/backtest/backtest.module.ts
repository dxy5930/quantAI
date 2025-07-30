import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BacktestController } from "./backtest.controller";
import { BacktestService } from "./backtest.service";
import { BacktestHistory } from "../../shared/entities/backtest-history.entity";
import { Strategy } from "../../shared/entities/strategy.entity";
import { User } from "../../shared/entities/user.entity";
import { SharedModule } from "../../shared/shared.module";
import { PythonApiModule } from "../../shared/modules/python-api.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([BacktestHistory, Strategy, User]),
    SharedModule,
    PythonApiModule
  ],
  controllers: [BacktestController],
  providers: [BacktestService],
  exports: [BacktestService],
})
export class BacktestModule {}
