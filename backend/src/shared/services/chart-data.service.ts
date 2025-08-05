import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChartDataGenerator } from "../utils/chart-data-generator.util";
import { STRATEGY_CONSTANTS } from "../constants";

/**
 * 图表数据服务
 * 负责生成和管理策略图表数据
 */
@Injectable()
export class ChartDataService {
  constructor(
    private strategyChartDataRepository: Repository<any>,
    private strategyRepository: Repository<any>,
  ) {}

  /**
   * 为策略生成图表数据并保存到数据库
   */
  async generateAndSaveChartData(strategyId: string, period: string = "1y"): Promise<void> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });

    if (!strategy) {
      console.error(`策略 ${strategyId} 不存在，无法生成图表数据`);
      return;
    }

    console.log(`开始为策略 ${strategy.name} (${strategyId}) 生成图表数据...`);
    
    try {
      // 先删除现有的图表数据（如果存在）
      await this.strategyChartDataRepository.delete({
        strategyId,
        period
      });

      // 根据策略类型生成图表数据
      const strategyType = strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST ? 'backtest' : 'stock_selection';
      const generatedChartData = ChartDataGenerator.generateChartDataForStrategy(strategyId, strategyType, period);
      
      // 创建数据库实体并保存
      const chartDataEntities = generatedChartData.map(data => 
        this.strategyChartDataRepository.create({
          strategyId: data.strategyId,
          chartType: data.chartType as any, // 强制类型转换以匹配枚举
          period: data.period,
          dataDate: data.dataDate,
          dataValue: data.dataValue
        })
      );
      
      await this.strategyChartDataRepository.save(chartDataEntities);
      console.log(`成功为策略 ${strategy.name} 生成并保存了 ${chartDataEntities.length} 条图表数据`);
    } catch (error) {
      console.error("生成图表数据失败:", error);
      throw new Error("生成图表数据失败");
    }
  }

  /**
   * 获取策略图表数据
   */
  async getStrategyChartData(strategyId: string, period: string = "1y"): Promise<any[]> {
    return this.strategyChartDataRepository.find({
      where: { strategyId, period },
      order: { dataDate: "ASC" },
    });
  }

  /**
   * 检查策略是否有图表数据
   */
  async hasChartData(strategyId: string, period: string = "1y"): Promise<boolean> {
    const count = await this.strategyChartDataRepository.count({
      where: { strategyId, period },
    });
    return count > 0;
  }
}