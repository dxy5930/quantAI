import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StocksController } from "./stocks.controller";
import { StocksService } from "./stocks.service";
import { StockData } from "./entities/stock-data.entity";
import { StockInfo } from "./entities/stock-info.entity";
import { StockF10 } from "./entities/stock-f10.entity";
import { StockFinancial } from "./entities/stock-financial.entity";
import { StockDividend } from "./entities/stock-dividend.entity";
import { StockPerformance } from "./entities/stock-performance.entity";
import { AkshareService } from "./services/akshare.service";
import { StockSchedulerService } from "./services/stock-scheduler.service";
import { PythonApiModule } from "../../shared/modules/python-api.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockData, 
      StockInfo, 
      StockF10, 
      StockFinancial, 
      StockDividend,
      StockPerformance
    ]),
    PythonApiModule
  ],
  controllers: [StocksController],
  providers: [
    StocksService, 
    AkshareService, 
    StockSchedulerService
  ],
  exports: [
    StocksService, 
    AkshareService, 
    StockSchedulerService
  ],
})
export class StocksModule {}
