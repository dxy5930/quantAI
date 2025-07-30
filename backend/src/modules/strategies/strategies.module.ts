import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StrategiesController } from "./strategies.controller";
import { StrategiesService } from "./strategies.service";
import { Strategy } from "../../shared/entities/strategy.entity";
import { User } from "../../shared/entities/user.entity";
import { StrategyType } from '../../shared/entities/strategy-type.entity';
import { UserFavorite } from "../../shared/entities/user-favorite.entity";
import { UserLike } from "../../shared/entities/user-like.entity";
import { Stock } from "../../shared/entities/stock.entity";
import { StockRecommendation } from "../../shared/entities/stock-recommendation.entity";
import { BacktestStock } from "../../shared/entities/backtest-stock.entity";
import { StrategyChartData } from "../../shared/entities/strategy-chart-data.entity";
import { SectorAnalysis } from "../../shared/entities/sector-analysis.entity";
import { TechnicalAnalysis } from "../../shared/entities/technical-analysis.entity";
import { FundamentalAnalysis } from "../../shared/entities/fundamental-analysis.entity";
import { StockPriceHistory } from "../../shared/entities/stock-price-history.entity";
import { StockInfo } from "../stocks/entities/stock-info.entity";
import { StocksModule } from "../stocks/stocks.module";
import { SharedModule } from "../../shared/shared.module";
import { PythonApiModule } from "../../shared/modules/python-api.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Strategy, 
      User, 
      StrategyType, 
      UserFavorite, 
      UserLike,
      Stock,
      StockRecommendation,
      BacktestStock,
      StrategyChartData,
      SectorAnalysis,
      TechnicalAnalysis,
      FundamentalAnalysis,
      StockPriceHistory,
      StockInfo
    ]),
    StocksModule,
    SharedModule,
    PythonApiModule
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
