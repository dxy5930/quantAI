import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChartDataService } from "./services/chart-data.service";
import { StrategyChartData } from "./entities/strategy-chart-data.entity";
import { Strategy } from "./entities/strategy.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([StrategyChartData, Strategy])
  ],
  providers: [ChartDataService],
  exports: [ChartDataService],
})
export class SharedModule {}