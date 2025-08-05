import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChartDataService } from "./services/chart-data.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([])
  ],
  providers: [ChartDataService],
  exports: [ChartDataService],
})
export class SharedModule {}