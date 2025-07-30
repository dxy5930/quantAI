import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { BacktestService } from "./backtest.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { StrategyConfig } from "../../shared/types";
import { ModuleApiController } from "../../shared/decorators";
import { BadRequestException } from "@nestjs/common";

@ApiTags("回测")
@ModuleApiController("backtest")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BacktestController {
  constructor(private backtestService: BacktestService) {}

  @Post("run")
  @ApiOperation({ summary: "运行回测" })
  @ApiResponse({ status: 200, description: "回测完成" })
  async runBacktest(@Request() req, @Body() requestBody: any) {
    // 验证策略ID
    if (!requestBody.strategy_id) {
      throw new BadRequestException("策略ID不能为空");
    }

    // 验证策略ID格式（UUID格式或特殊标识）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidFormat = uuidRegex.test(requestBody.strategy_id) || 
                         ['default', 'temp', 'standalone_backtest'].includes(requestBody.strategy_id);
    
    if (!isValidFormat) {
      throw new BadRequestException("策略ID格式不正确");
    }

    // 适配前端请求格式到后端StrategyConfig格式
    const config: StrategyConfig = {
      strategyId: requestBody.strategy_id,
      startDate: requestBody.start_date,
      endDate: requestBody.end_date,
      initialCapital: requestBody.initial_capital,
      backtestType: 'portfolio' as const,
      rebalanceFrequency: requestBody.rebalance_frequency || 'monthly',
      parameters: {},
      // 处理股票位置数据
      symbols: requestBody.positions || requestBody.symbols?.map((symbol: string, index: number) => ({
        symbol: symbol,
        name: symbol, // 默认使用symbol作为name
        weight: requestBody.weights?.[index] || (1 / (requestBody.symbols?.length || 1)),
        sector: 'Unknown'
      })) || [],
      // 新增交易规则参数
      tradingRules: requestBody.trading_rules,
      commission: requestBody.commission || 0.001,
      slippage: requestBody.slippage || 0.001,
      minTradeAmount: requestBody.min_trade_amount || 1000,
    };
    
    return this.backtestService.runBacktest(req.user.id, config);
  }

  @Post("history")
  @ApiOperation({ summary: "获取回测历史" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getHistory(
    @Request() req,
    @Body() data: { page?: number; limit?: number } = {},
  ) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    return this.backtestService.getBacktestHistory(req.user.id, page, limit);
  }

  @Post(":id")
  @ApiOperation({ summary: "获取回测结果" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "回测记录不存在" })
  async getResult(@Param("id") id: string, @Request() req) {
    return this.backtestService.getBacktestResult(id, req.user.id);
  }
}
