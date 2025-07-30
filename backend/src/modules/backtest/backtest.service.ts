import { Injectable, ForbiddenException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThan, In, Between } from "typeorm";
import { PythonApiClient } from "../../shared/clients/python-api.client";

import { BacktestHistory } from "../../shared/entities/backtest-history.entity";
import { Strategy } from "../../shared/entities/strategy.entity";
import { User } from "../../shared/entities/user.entity";
import { StrategyConfig, BacktestResult } from "../../shared/types";
import { UserLevel, USER_LEVEL_PERMISSIONS } from "../../shared/types";
import { ChartDataService } from "../../shared/services/chart-data.service";
import { NotFoundException } from "@nestjs/common";


@Injectable()
export class BacktestService {
  constructor(
    @InjectRepository(BacktestHistory)
    private backtestHistoryRepository: Repository<BacktestHistory>,
    @InjectRepository(Strategy)
    private strategyRepository: Repository<Strategy>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private chartDataService: ChartDataService,
    private pythonApiClient: PythonApiClient,
  ) {}

  async runBacktest(
    userId: string,
    config: StrategyConfig,
  ): Promise<any> {
    // 检查用户等级权限 - 每日回测次数限制
    await this.checkBacktestPermission(userId);

    let actualStrategyId = config.strategyId;
    let shouldCreateHistory = true;

    // 处理不同类型的回测
    if (config.strategyId === 'standalone_backtest') {
      // 独立回测：不创建策略记录，也不创建历史记录
      shouldCreateHistory = false;
      console.log('执行独立回测，不创建策略和历史记录');
    } else if (!config.strategyId || ['default', 'temp'].includes(config.strategyId)) {
      // 临时策略：创建临时策略记录
      const tempStrategy = this.strategyRepository.create({
        name: `临时回测策略_${new Date().getTime()}`,
        description: '系统自动创建的临时回测策略',
        icon: 'BarChart3',
        category: '临时策略',
        strategyType: 'backtest',
        difficulty: 'medium',
        popularity: 0,
        parameters: [],
        isPublic: false,
        authorId: userId,
        backtestPeriod: {
          startDate: config.startDate,
          endDate: config.endDate,
          initialCapital: config.initialCapital,
          rebalanceFrequency: config.rebalanceFrequency
        }
      });

      const savedTempStrategy = await this.strategyRepository.save(tempStrategy);
      actualStrategyId = savedTempStrategy.id;
      
      console.log(`创建临时策略: ${actualStrategyId}`);
    } else {
      // 验证已存在的策略
      const strategy = await this.strategyRepository.findOne({
        where: { id: config.strategyId }
      });

      if (!strategy) {
        throw new NotFoundException(`策略不存在：${config.strategyId}`);
      }
    }

    let backtestHistory = null;

    // 只有非独立回测才创建历史记录
    if (shouldCreateHistory) {
      backtestHistory = this.backtestHistoryRepository.create({
        userId,
        strategyId: actualStrategyId,
        config,
        status: "running",
        results: null,
        // 保存新的交易规则字段
        tradingRules: config.tradingRules,
        slippage: config.slippage || 0.001,
        minTradeAmount: config.minTradeAmount || 1000,
      });

      await this.backtestHistoryRepository.save(backtestHistory);
    }

    try {
      // 执行回测计算
      const result = await this.performBacktest(config);

      // 更新历史记录（如果存在）
      if (backtestHistory) {
        backtestHistory.results = result;
        backtestHistory.status = "completed";
        backtestHistory.duration = 2;
        await this.backtestHistoryRepository.save(backtestHistory);

        // 生成并保存图表数据
        try {
          console.log(`回测完成，开始为策略 ${actualStrategyId} 生成图表数据...`);
          await this.chartDataService.generateAndSaveChartData(actualStrategyId, '1y');
          console.log(`策略 ${actualStrategyId} 图表数据生成完成`);
        } catch (error) {
          console.error(`策略 ${actualStrategyId} 图表数据生成失败:`, error);
        }
      }

      return result;
    } catch (error) {
      // 更新失败状态（如果有历史记录）
      if (backtestHistory) {
        backtestHistory.status = "failed";
        backtestHistory.errorMessage = error.message;
        await this.backtestHistoryRepository.save(backtestHistory);
      }

      throw error;
    }
  }

  private async performBacktest(
    config: StrategyConfig,
  ): Promise<any> {
    try {
      // 准备传递给Python服务的数据
      const symbols = config.symbols?.map(pos => pos.symbol) || [];
      const weights = config.symbols?.map(pos => pos.weight) || [];
      
      console.log(`开始调用Python回测服务，策略ID: ${config.strategyId}`);
      console.log(`股票列表: ${symbols.join(', ')}`);
      console.log(`权重: ${weights.join(', ')}`);
      
      // 调用Python分析服务进行回测
      const response = await this.pythonApiClient.runBacktest({
        strategy_id: config.strategyId,
        start_date: config.startDate,
        end_date: config.endDate,
        initial_capital: config.initialCapital,
        symbols: symbols,
        weights: weights, // 传递权重数据
        rebalance_frequency: config.rebalanceFrequency || 'monthly',
        commission: config.commission || 0.001, // 手续费
        backtest_type: config.backtestType || 'portfolio',
        parameters: config.parameters || {},
        
        // 新增交易规则参数
        trading_rules: config.tradingRules,
        slippage: config.slippage || 0.001, // 默认滑点
        min_trade_amount: config.minTradeAmount || 1000, // 默认最小交易金额1000元
      });

      console.log('Python服务响应状态:', response?.status || 'N/A');
      console.log('Python服务响应数据:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('回测分析完成，开始转换结果格式');
        return this.transformPythonResult(response.data);
      } else {
        const errorDetails = response.message || '未知错误';
        console.error('Python服务返回错误:', errorDetails);
        throw new Error(`Python服务返回错误: ${errorDetails}`);
      }
    } catch (error) {
      console.error('调用Python回测服务失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response?.data
      });
      
      // 直接抛出错误，不使用降级方案
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Python分析服务连接失败 - 服务未启动或无法访问`);
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        throw new Error(`Python分析服务响应超时 - 请检查服务状态`);
      } else if (error.response?.status === 500) {
        throw new Error(`Python分析服务内部错误：${error.response.data?.message || '服务端处理失败'}`);
      } else if (error.response?.status === 400) {
        throw new Error(`回测参数验证失败：${error.response.data?.message || '参数格式错误'}`);
      } else if (error.response?.status) {
        throw new Error(`Python分析服务返回错误 (HTTP ${error.response.status}): ${error.response.data?.message || error.message}`);
      } else {
        throw new Error(`回测服务调用失败: ${error.message || '未知错误'}`);
      }
    }
  }



  /**
   * 转换Python服务返回的结果格式
   */
  private transformPythonResult(pythonResult: any): any {
    // 生成唯一ID和时间戳
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const created_at = new Date().toISOString();

    // 转换交易记录格式
    const trades = (pythonResult.trades || []).map((trade: any, index: number) => ({
      id: `trade_${id}_${index}`,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      timestamp: trade.timestamp,
      pnl: trade.pnl
    }));

    // 转换资金曲线格式
    const equity_curve = (pythonResult.equity_curve || []).map((point: any) => ({
      date: point.date,
      value: point.value
    }));

    // 构建符合API期望的返回格式
    return {
      id: id,
      strategy_id: pythonResult.strategy_id || 'unknown',
      performance: {
        total_return: pythonResult.total_return || 0,
        annual_return: pythonResult.annual_return || pythonResult.annualized_return || 0,
        max_drawdown: pythonResult.max_drawdown || 0,
        sharpe_ratio: pythonResult.sharpe_ratio || 0,
        win_rate: pythonResult.win_rate || 0,
        profit_factor: pythonResult.profit_factor || 1
      },
      trades: trades,
      equity_curve: equity_curve,
      created_at: created_at,
      // AI分析结果
      ai_analysis: pythonResult.ai_analysis,
      // 保留其他可选字段以供扩展使用
      volatility: pythonResult.volatility || 0,
      beta: pythonResult.beta,
      alpha: pythonResult.alpha,
      diversificationRatio: pythonResult.diversification_ratio,
      portfolioComposition: pythonResult.portfolio_composition,
      individualResults: pythonResult.individual_results
    };
  }



  async getBacktestHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const [data, total] = await this.backtestHistoryRepository.findAndCount({
      where: { userId },
      relations: ["strategy"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBacktestResult(
    id: string,
    userId: string,
  ): Promise<BacktestHistory> {
    const backtest = await this.backtestHistoryRepository.findOne({
      where: { id, userId },
      relations: ["strategy"],
    });

    if (!backtest) {
      throw new NotFoundException("回测记录不存在");
    }

    return backtest;
  }

  // ================== 用户等级权限检查方法 ==================

  /**
   * 检查用户是否可以执行回测
   * @param userId 用户ID
   */
  private async checkBacktestPermission(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions = USER_LEVEL_PERMISSIONS[user.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    const maxBacktestPerDay = permissions.maxBacktestPerDay;

    // 如果没有限制，直接通过
    if (maxBacktestPerDay === -1) {
      return;
    }

    // 检查今日回测次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBacktestCount = await this.backtestHistoryRepository.count({
      where: {
        userId,
        createdAt: Between(today, tomorrow),
      },
    });

    if (todayBacktestCount >= maxBacktestPerDay) {
      throw new ForbiddenException(
        `您的用户等级每日最多只能执行 ${maxBacktestPerDay} 次回测，今日已达到限制。请升级用户等级以获得更多回测次数。`
      );
    }
  }

  /**
   * 获取用户今日回测统计信息
   * @param userId 用户ID
   */
  async getUserBacktestStats(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions = USER_LEVEL_PERMISSIONS[user.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    const maxBacktestPerDay = permissions.maxBacktestPerDay;

    // 获取今日回测次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBacktestCount = await this.backtestHistoryRepository.count({
      where: {
        userId,
        createdAt: Between(today, tomorrow),
      },
    });

    // 获取总回测次数
    const totalBacktestCount = await this.backtestHistoryRepository.count({
      where: { userId },
    });

    // 获取成功回测次数
    const successfulBacktestCount = await this.backtestHistoryRepository.count({
      where: { userId, status: "completed" },
    });

    return {
      todayCount: todayBacktestCount,
      maxPerDay: maxBacktestPerDay,
      canRunMore: maxBacktestPerDay === -1 || todayBacktestCount < maxBacktestPerDay,
      remainingToday: maxBacktestPerDay === -1 ? -1 : Math.max(0, maxBacktestPerDay - todayBacktestCount),
      totalCount: totalBacktestCount,
      successfulCount: successfulBacktestCount,
      successRate: totalBacktestCount > 0 ? (successfulBacktestCount / totalBacktestCount * 100).toFixed(2) : '0',
      userLevel: user.level,
      levelName: user.level === UserLevel.NORMAL ? '普通用户' : 
                 user.level === UserLevel.PREMIUM ? '高级用户' : '超级用户',
      permissions,
    };
  }

  /**
   * 导出回测数据（需要高级用户权限）
   * @param userId 用户ID
   * @param backtestIds 回测ID列表
   */
  async exportBacktestData(userId: string, backtestIds: string[]) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions = USER_LEVEL_PERMISSIONS[user.level] || USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    if (!permissions.canExportData) {
      throw new ForbiddenException("数据导出功能仅限高级用户使用，请升级您的用户等级");
    }

    // 获取回测数据
    const backtests = await this.backtestHistoryRepository.find({
      where: {
        id: In(backtestIds),
        userId,
      },
      relations: ["strategy"],
    });

    // 这里可以实现具体的数据导出逻辑
    // 例如生成CSV、Excel等格式的文件
    return {
      message: "数据导出成功",
      data: backtests,
      exportTime: new Date().toISOString(),
    };
  }
}
