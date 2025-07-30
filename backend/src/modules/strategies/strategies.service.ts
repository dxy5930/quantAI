import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { PythonApiClient } from "../../shared/clients/python-api.client";

import { Strategy } from "../../shared/entities/strategy.entity";
import { User } from "../../shared/entities/user.entity";
import { UserFavorite } from "../../shared/entities/user-favorite.entity";
import { UserLike } from "../../shared/entities/user-like.entity";
import { StockRecommendation } from "../../shared/entities/stock-recommendation.entity";
import { BacktestStock } from "../../shared/entities/backtest-stock.entity";
import { StrategyChartData } from "../../shared/entities/strategy-chart-data.entity";
import { SectorAnalysis } from "../../shared/entities/sector-analysis.entity";
import { Stock } from "../../shared/entities/stock.entity";
import { TechnicalAnalysis } from "../../shared/entities/technical-analysis.entity";
import { FundamentalAnalysis } from "../../shared/entities/fundamental-analysis.entity";
import { StockPriceHistory } from "../../shared/entities/stock-price-history.entity";
import { StockInfo } from "../stocks/entities/stock-info.entity";
import { CreateStrategyDto, UpdateStrategyDto, StrategyQueryDto } from "./dto";
import { PaginatedResult } from "../../shared/types";
import { UserLevel, USER_LEVEL_PERMISSIONS } from "../../shared/types";
import { STRATEGY_CONSTANTS } from "../../shared/constants";
import { StrategyType } from "../../shared/entities/strategy-type.entity";
import { ChartDataGenerator } from "../../shared/utils/chart-data-generator.util";
import { ChartDataService } from "../../shared/services/chart-data.service";
import { environmentService } from "../../shared/config/environment.config";

@Injectable()
export class StrategiesService {
  private lastStructuredConditions: any[] = []; // 存储最后一次分析的结构化条件

  constructor(
    @InjectRepository(Strategy)
    private strategyRepository: Repository<Strategy>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StrategyType)
    private strategyTypeRepository: Repository<StrategyType>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(UserLike)
    private userLikeRepository: Repository<UserLike>,
    @InjectRepository(StockRecommendation)
    private stockRecommendationRepository: Repository<StockRecommendation>,
    @InjectRepository(BacktestStock)
    private backtestStockRepository: Repository<BacktestStock>,
    @InjectRepository(StrategyChartData)
    private strategyChartDataRepository: Repository<StrategyChartData>,
    @InjectRepository(SectorAnalysis)
    private sectorAnalysisRepository: Repository<SectorAnalysis>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(TechnicalAnalysis)
    private technicalAnalysisRepository: Repository<TechnicalAnalysis>,
    @InjectRepository(FundamentalAnalysis)
    private fundamentalAnalysisRepository: Repository<FundamentalAnalysis>,
    @InjectRepository(StockPriceHistory)
    private stockPriceHistoryRepository: Repository<StockPriceHistory>,
    @InjectRepository(StockInfo)
    private stockInfoRepository: Repository<StockInfo>,
    private chartDataService: ChartDataService,
    private pythonApiClient: PythonApiClient
  ) {}

  // 创建新策略（返回完整策略信息）
  async createStrategy(
    userId: string,
    createStrategyDto: CreateStrategyDto
  ): Promise<Strategy> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 检查用户等级权限 - 策略数量限制
    await this.checkStrategyCreationPermission(user);

    // 调试：检查交易规则数据
    if (createStrategyDto.defaultTradingRules) {
      console.log('📋 创建策略时的交易规则数据:', {
        type: typeof createStrategyDto.defaultTradingRules,
        data: createStrategyDto.defaultTradingRules,
        stringified: JSON.stringify(createStrategyDto.defaultTradingRules)
      });
    }

    // 为字段设置默认值
    const strategyData = {
      ...createStrategyDto,
      authorId: userId,
      icon: createStrategyDto.icon || "📈", // 默认图标
      difficulty: createStrategyDto.difficulty || "medium", // 默认难度
      parameters: createStrategyDto.parameters || [], // 默认空参数数组
      tags: createStrategyDto.tags || [], // 默认空标签数组
      isPublic: createStrategyDto.isPublic || false, // 默认不公开
    };

    const strategy = this.strategyRepository.create(strategyData);
    const savedStrategy = await this.strategyRepository.save(strategy);

    // 如果是回测策略且包含positions数据，创建关联的回测股票记录
    if (
      createStrategyDto.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST &&
      createStrategyDto.positions &&
      createStrategyDto.positions.length > 0
    ) {
      await this.createBacktestStocks(savedStrategy.id, createStrategyDto.positions);
    }

    // 如果是选股策略且包含selectedStocks数据，创建关联的股票推荐记录
    if (
      createStrategyDto.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION &&
      createStrategyDto.selectedStocks &&
      createStrategyDto.selectedStocks.length > 0
    ) {
      await this.createStockRecommendations(savedStrategy.id, createStrategyDto.selectedStocks);
    }

    console.log(`✅ 策略创建成功: ${savedStrategy.name} (ID: ${savedStrategy.id})`);
    return savedStrategy;
  }

  // 创建回测股票记录的辅助方法
  private async createBacktestStocks(strategyId: string, positions: any[]): Promise<void> {
    const backtestStocks = [];
    for (const position of positions) {
      // 查找或创建股票记录
      let stock = await this.stockRepository.findOne({
        where: { symbol: position.symbol },
      });

      if (!stock) {
        // 如果股票不存在，创建新记录
        let marketCap = null;
        if (position.marketCap !== undefined && position.marketCap !== null) {
          if (typeof position.marketCap === "string") {
            const numStr = position.marketCap.replace(/[^\d.]/g, "");
            const num = parseFloat(numStr);
            if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
              marketCap = Math.floor(num);
            }
          } else if (typeof position.marketCap === "number") {
            if (position.marketCap > 0 && position.marketCap <= 9223372036854775807) {
              marketCap = Math.floor(position.marketCap);
            }
          }
        }

        stock = this.stockRepository.create({
          symbol: position.symbol,
          name: position.name,
          sector: position.sector,
          marketCap: marketCap,
          isActive: true,
          currency: "USD",
        });
        stock = await this.stockRepository.save(stock);
      }

      // 创建回测股票记录
      backtestStocks.push({
        strategyId: strategyId,
        stockId: stock.id,
        symbol: position.symbol,
        weight: position.weight,
      });
    }

    await this.backtestStockRepository.save(backtestStocks);
  }

  // 创建股票推荐记录的辅助方法
  private async createStockRecommendations(strategyId: string, selectedStocks: any[]): Promise<void> {
    const stockRecommendations = [];
    for (const selectedStock of selectedStocks) {
      // 查找或创建股票记录
      let stock = await this.stockRepository.findOne({
        where: { symbol: selectedStock.symbol },
      });

      if (!stock) {
        // 如果股票不存在，创建新记录
        let marketCap = null;
        if (selectedStock.marketCap !== undefined && selectedStock.marketCap !== null) {
          if (typeof selectedStock.marketCap === "string") {
            const numStr = selectedStock.marketCap.replace(/[^\d.]/g, "");
            const num = parseFloat(numStr);
            if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
              marketCap = Math.floor(num);
            }
          } else if (typeof selectedStock.marketCap === "number") {
            if (selectedStock.marketCap > 0 && selectedStock.marketCap <= 9223372036854775807) {
              marketCap = Math.floor(selectedStock.marketCap);
            }
          }
        }

        stock = this.stockRepository.create({
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          sector: selectedStock.sector,
          marketCap: marketCap,
          isActive: true,
          currency: "USD",
        });
        stock = await this.stockRepository.save(stock);
      }

      // 创建股票推荐记录
      stockRecommendations.push({
        strategyId: strategyId,
        stockId: stock.id,
        symbol: selectedStock.symbol,
        score: 80, // 默认评分
        reason: "用户选择",
        riskLevel: "medium" as const,
        recommendationType: "BUY" as const,
        confidence: 0.8,
      });
    }

    await this.stockRecommendationRepository.save(stockRecommendations);
  }

  // 兼容旧接口的创建方法
  async create(
    userId: string,
    createStrategyDto: CreateStrategyDto
  ): Promise<Strategy> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 检查用户等级权限 - 策略数量限制
    await this.checkStrategyCreationPermission(user);

    // 调试：检查交易规则数据
    if (createStrategyDto.defaultTradingRules) {
      console.log('📋 保存策略时的交易规则数据:', {
        type: typeof createStrategyDto.defaultTradingRules,
        data: createStrategyDto.defaultTradingRules,
        stringified: JSON.stringify(createStrategyDto.defaultTradingRules)
      });
    }

    // 为字段设置默认值
    const strategyData = {
      ...createStrategyDto,
      authorId: userId,
      icon: createStrategyDto.icon || "📈", // 默认图标
      difficulty: createStrategyDto.difficulty || "medium", // 默认难度
      parameters: createStrategyDto.parameters || [], // 默认空参数数组
      tags: createStrategyDto.tags || [], // 默认空标签数组
      isPublic: createStrategyDto.isPublic || false, // 默认不公开
    };

    const strategy = this.strategyRepository.create(strategyData);
    const savedStrategy = await this.strategyRepository.save(strategy);

    // 如果是回测策略且包含positions数据，创建关联的回测股票记录
    if (
      createStrategyDto.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST &&
      createStrategyDto.positions &&
      createStrategyDto.positions.length > 0
    ) {
      const backtestStocks = [];
      for (const position of createStrategyDto.positions) {
        // 查找或创建股票记录
        let stock = await this.stockRepository.findOne({
          where: { symbol: position.symbol },
        });

        if (!stock) {
          // 如果股票不存在，创建新记录
          // 处理marketCap字段，确保是有效的数字并在合理范围内
          let marketCap = null;
          if (position.marketCap !== undefined && position.marketCap !== null) {
            if (typeof position.marketCap === "string") {
              // 如果是字符串，提取数字部分
              const numStr = position.marketCap.replace(/[^\d.]/g, "");
              const num = parseFloat(numStr);
              if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
                // BIGINT最大值
                marketCap = Math.floor(num);
              }
            } else if (typeof position.marketCap === "number") {
              // 如果是数字，确保在合理范围内
              if (
                position.marketCap > 0 &&
                position.marketCap <= 9223372036854775807
              ) {
                marketCap = Math.floor(position.marketCap);
              }
            }
          }

          stock = this.stockRepository.create({
            symbol: position.symbol,
            name: position.name,
            sector: position.sector,
            marketCap: marketCap,
            isActive: true,
            currency: "USD",
          });
          stock = await this.stockRepository.save(stock);
        }

        // 创建回测股票记录
        backtestStocks.push({
          strategyId: savedStrategy.id,
          stockId: stock.id,
          symbol: position.symbol,
          weight: position.weight,
        });
      }

      await this.backtestStockRepository.save(backtestStocks);
    }

    // 如果是选股策略且包含selectedStocks数据，创建关联的股票推荐记录
    const selectedStocks = createStrategyDto.selectedStocks;
    if (
      createStrategyDto.strategyType ===
        STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION &&
      selectedStocks &&
      selectedStocks.length > 0
    ) {
      const stockRecommendations = [];
      for (const selectedStock of selectedStocks) {
        // 查找或创建股票记录
        let stock = await this.stockRepository.findOne({
          where: { symbol: selectedStock.symbol },
        });

        if (!stock) {
          // 如果股票不存在，创建新记录
          // 处理marketCap字段，确保是有效的数字并在合理范围内
          let marketCap = null;
          if (
            selectedStock.marketCap !== undefined &&
            selectedStock.marketCap !== null
          ) {
            if (typeof selectedStock.marketCap === "string") {
              // 如果是字符串，提取数字部分
              const numStr = selectedStock.marketCap.replace(/[^\d.]/g, "");
              const num = parseFloat(numStr);
              if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
                // BIGINT最大值
                marketCap = Math.floor(num);
              }
            } else if (typeof selectedStock.marketCap === "number") {
              // 如果是数字，确保在合理范围内
              if (
                selectedStock.marketCap > 0 &&
                selectedStock.marketCap <= 9223372036854775807
              ) {
                marketCap = Math.floor(selectedStock.marketCap);
              }
            }
          }

          stock = this.stockRepository.create({
            symbol: selectedStock.symbol,
            name: selectedStock.name,
            sector: selectedStock.sector,
            marketCap: marketCap,
            isActive: true,
            currency: "USD",
          });
          stock = await this.stockRepository.save(stock);
        }

        // 创建股票推荐记录
        stockRecommendations.push({
          strategyId: savedStrategy.id,
          stockId: stock.id,
          symbol: selectedStock.symbol,
          score: 80, // 默认评分
          reason: "用户选择",
          riskLevel: "medium" as const,
          recommendationType: "BUY" as const,
          confidence: 0.8,
        });
      }

      await this.stockRecommendationRepository.save(stockRecommendations);
    }

    return savedStrategy;
  }

  async findAll(query: StrategyQueryDto): Promise<PaginatedResult<Strategy>> {
    const {
      page = 1,
      limit = 10,
      category,
      strategyType,
      difficulty,
      isPublic,
      search,
      sortBy = STRATEGY_CONSTANTS.DEFAULT_SORT_BY,
      sortOrder = STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER,
    } = query;

    // 添加调试日志
    console.log("策略搜索参数:", {
      search,
      category,
      strategyType,
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    });

    const queryBuilder = this.strategyRepository
      .createQueryBuilder("strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.likes",
        "strategy.favorites",
        "strategy.usageCount",
        "strategy.rating",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
      ]);

    if (category) {
      queryBuilder.andWhere("strategy.category = :category", { category });
    }

    if (strategyType) {
      queryBuilder.andWhere("strategy.strategyType = :strategyType", {
        strategyType,
      });
    }

    if (difficulty) {
      queryBuilder.andWhere("strategy.difficulty = :difficulty", {
        difficulty,
      });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere("strategy.isPublic = :isPublic", { isPublic });
    }

    if (search) {
      console.log("添加搜索条件:", search);
      this.addFuzzySearchConditions(queryBuilder, search);
    }

    const validSortFields = STRATEGY_CONSTANTS.SORT_FIELDS;
    const sortField = validSortFields.includes(sortBy as any)
      ? sortBy
      : STRATEGY_CONSTANTS.DEFAULT_SORT_BY;

    queryBuilder.orderBy(`strategy.${sortField}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log("查询结果:", {
      total,
      strategiesCount: data.length,
      searchTerm: search,
    });
    if (search && data.length > 0) {
      console.log(
        "找到的策略:",
        data.map((s) => ({ name: s.name, author: s.author?.username }))
      );
    }

    // 为策略列表分配随机股票数据
    const strategiesWithStocks = await this.assignStocksToStrategies(data);

    return {
      data: strategiesWithStocks,
      total,
      page,
      limit,
      // totalPages: Math.ceil(total / limit),
      total_pages: Math.ceil(total / limit), // 添加前端期望的字段名
    };
  }

  async findOne(id: string): Promise<Strategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id },
      relations: ["author"],
    });

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    return strategy;
  }

  async getStrategyDetail(
    id: string,
    userId?: string
  ): Promise<
    Strategy & { userEngagement?: { isLiked: boolean; isFavorited: boolean } }
  > {
    // 使用查询构建器获取完整的策略详情，包括作者信息和统计数据
    const strategy = await this.strategyRepository
      .createQueryBuilder("strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .leftJoinAndSelect("strategy.backtestHistory", "backtestHistory")
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.parameters",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.isShared",
        "strategy.shareId",
        "strategy.sharedAt",
        "strategy.likes", // 确保包含点赞数
        "strategy.favorites", // 确保包含收藏数
        "strategy.usageCount", // 确保包含使用次数
        "strategy.rating", // 确保包含评分
        "strategy.stockRecommendations",
        "strategy.selectionCriteria",
        "strategy.lastScreeningDate",
        "strategy.totalStocksScreened",
        "strategy.recommendedStocksCount",
        "strategy.backtestResults",
        "strategy.backtestPeriod",
        "strategy.backtestStocks",
        "strategy.lastBacktestDate",
        "strategy.defaultTradingRules",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
        "backtestHistory",
      ])
      .where("strategy.id = :id", { id })
      .getOne();

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    // 从关联表中获取真实数据
    if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION) {
      // 获取股票推荐数据
      const stockRecommendations = await this.stockRecommendationRepository
        .createQueryBuilder("rec")
        .leftJoinAndSelect("rec.stock", "stock")
        .leftJoinAndSelect("stock.technicalAnalysis", "tech")
        .leftJoinAndSelect("stock.fundamentalAnalysis", "fund")
        .where("rec.strategyId = :strategyId", { strategyId: id })
        .orderBy("rec.score", "DESC")
        .getMany();

      // 转换为前端期望的格式
      strategy.stockRecommendations = await Promise.all(
        stockRecommendations.map(async (rec) => ({
          symbol: rec.symbol,
          name: rec.stock.name,
          score: rec.score,
          reason: rec.reason,
          targetPrice: rec.targetPrice,
          riskLevel: rec.riskLevel,
          sector: rec.stock.sector,
          marketCap: rec.stock.marketCap,
          updatedAt: rec.updatedAt.toISOString(),

          // 技术分析数据
          technicalAnalysis: rec.stock.technicalAnalysis?.[0]
            ? {
                rsi: rec.stock.technicalAnalysis[0].rsi,
                macd: {
                  macd: rec.stock.technicalAnalysis[0].macd,
                  signal: rec.stock.technicalAnalysis[0].macdSignal,
                  histogram: rec.stock.technicalAnalysis[0].macdHistogram,
                },
                movingAverages: {
                  ma5: rec.stock.technicalAnalysis[0].ma5,
                  ma10: rec.stock.technicalAnalysis[0].ma10,
                  ma20: rec.stock.technicalAnalysis[0].ma20,
                  ma50: rec.stock.technicalAnalysis[0].ma50,
                },
                support: rec.stock.technicalAnalysis[0].supportLevel,
                resistance: rec.stock.technicalAnalysis[0].resistanceLevel,
                trend: rec.stock.technicalAnalysis[0].trend,
                strength: rec.stock.technicalAnalysis[0].strength,
              }
            : undefined,

          // 基本面分析数据
          fundamentalAnalysis: rec.stock.fundamentalAnalysis?.[0]
            ? {
                peRatio: rec.stock.fundamentalAnalysis[0].peRatio,
                pbRatio: rec.stock.fundamentalAnalysis[0].pbRatio,
                roe: rec.stock.fundamentalAnalysis[0].roe,
                roa: rec.stock.fundamentalAnalysis[0].roa,
                debtToEquity: rec.stock.fundamentalAnalysis[0].debtToEquity,
                currentRatio: rec.stock.fundamentalAnalysis[0].currentRatio,
                quickRatio: rec.stock.fundamentalAnalysis[0].quickRatio,
                grossMargin: rec.stock.fundamentalAnalysis[0].grossMargin,
                operatingMargin:
                  rec.stock.fundamentalAnalysis[0].operatingMargin,
                netMargin: rec.stock.fundamentalAnalysis[0].netMargin,
              }
            : undefined,

          // 趋势数据 - 从价格历史计算
          trendData: await this.calculateTrendData(rec.symbol),

          // 推荐详情
          recommendation: {
            rating: rec.recommendationType,
            score: rec.score,
            reasons: rec.reason ? [rec.reason] : [],
          },
        }))
      );
    }

    if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
      // 获取回测股票数据
      const backtestStocks = await this.backtestStockRepository
        .createQueryBuilder("bt")
        .leftJoinAndSelect("bt.stock", "stock")
        .where("bt.strategyId = :strategyId", { strategyId: id })
        .orderBy("bt.weight", "DESC")
        .getMany();

      // 转换为前端期望的格式
      strategy.backtestStocks = backtestStocks.map((bt) => ({
        symbol: bt.symbol,
        name: bt.stock.name,
        weight: bt.weight,
        sector: bt.stock.sector,
        performance: bt.performance,
        contribution: bt.contribution,
        trades: bt.tradesCount,
        avgPrice: bt.avgPrice,
      }));
    }

    // 如果策略没有股票数据，检查并补充数据
    if (
      strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION &&
      (!strategy.stockRecommendations ||
        strategy.stockRecommendations.length === 0)
    ) {
      // 检查数据库中是否有股票推荐数据
      const dbRecommendations = await this.stockRecommendationRepository.count({
        where: { strategyId: id },
      });

      if (dbRecommendations === 0) {
        // 如果数据库中没有数据，返回空数组
        (strategy as any).stockRecommendations = [];
      }
    } else if (
      strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST &&
      (!strategy.backtestStocks || strategy.backtestStocks.length === 0)
    ) {
      // 检查数据库中是否有回测股票数据
      const dbBacktestStocks = await this.backtestStockRepository.count({
        where: { strategyId: id },
      });

      if (dbBacktestStocks === 0) {
        // 如果数据库中没有数据，返回空数组
        (strategy as any).backtestStocks = [];
      }
    }

    // 如果提供了userId，获取用户的点赞和收藏状态
    let userEngagement = undefined;
    if (userId) {
      const [like, favorite] = await Promise.all([
        this.userLikeRepository.findOne({ where: { userId, strategyId: id } }),
        this.userFavoriteRepository.findOne({
          where: { userId, strategyId: id },
        }),
      ]);

      userEngagement = {
        isLiked: !!like,
        isFavorited: !!favorite,
      };
    }

    return {
      ...strategy,
      ...(userEngagement && { userEngagement }),
    };
  }

  async getStrategyCharts(id: string, period: string = "1y"): Promise<any> {
    console.log(`=== 获取策略图表数据 ===`);
    console.log(`策略ID: ${id}, 时间周期: ${period}`);

    const strategy = await this.strategyRepository.findOne({
      where: { id },
      relations: ["author"],
    });

    if (!strategy) {
      console.log(`策略 ${id} 不存在`);
      throw new NotFoundException("策略不存在");
    }

    console.log(`找到策略: ${strategy.name}, 类型: ${strategy.strategyType}`);

    // 从数据库获取图表数据
    let chartData = [];
    try {
      chartData = await this.strategyChartDataRepository.find({
        where: { strategyId: id, period },
        order: { dataDate: "ASC" },
      });
      console.log(`从数据库获取到 ${chartData.length} 条图表数据`);
    } catch (error) {
      console.error("从数据库获取图表数据失败:", error.message);
      throw new Error("获取图表数据失败");
    }

    // 如果没有图表数据，自动生成并保存到数据库
    if (chartData.length === 0) {
      console.log(
        `策略 ${strategy.name} (${id}) 在 ${period} 时间段内暂无图表数据，开始自动生成...`
      );

      try {
        await this.chartDataService.generateAndSaveChartData(id, period);
        console.log(`图表数据生成完成，重新获取数据...`);

        // 重新获取保存的数据
        chartData = await this.strategyChartDataRepository.find({
          where: { strategyId: id, period },
          order: { dataDate: "ASC" },
        });
        console.log(`重新获取到 ${chartData.length} 条图表数据`);
      } catch (error) {
        console.error("自动生成图表数据失败:", error);
        // 如果生成失败，继续使用原有的空数据逻辑
      }
    }

    // 如果仍然没有图表数据（生成失败的情况），返回空结构
    if (chartData.length === 0) {
      console.log(`策略 ${strategy.name} (${id}) 图表数据生成失败，返回空结构`);

      // 生成基础摘要数据
      let summary = {};
      if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
        const backtestStocks = await this.backtestStockRepository.find({
          where: { strategyId: id },
        });

        summary = {
          totalReturn: strategy.backtestResults?.totalReturn
            ? `${(strategy.backtestResults.totalReturn * 100).toFixed(1)}%`
            : "0%",
          annualReturn: strategy.backtestResults?.annualReturn
            ? `${(strategy.backtestResults.annualReturn * 100).toFixed(1)}%`
            : "0%",
          maxDrawdown: strategy.backtestResults?.maxDrawdown
            ? `${Math.abs(strategy.backtestResults.maxDrawdown * 100).toFixed(1)}%`
            : "0%",
          sharpeRatio:
            strategy.backtestResults?.sharpeRatio?.toFixed(2) || "0.00",
          winRate: strategy.backtestResults?.winRate
            ? `${(strategy.backtestResults.winRate * 100).toFixed(0)}%`
            : "0%",
          totalTrades: strategy.backtestResults?.totalTrades || 0,
          stockCount: backtestStocks.length,
        };
      } else {
        // 选股策略摘要
        const stockRecommendations =
          await this.stockRecommendationRepository.find({
            where: { strategyId: id },
          });

        const avgScore =
          stockRecommendations.length > 0
            ? stockRecommendations.reduce(
                (sum, rec) => sum + Number(rec.score),
                0
              ) / stockRecommendations.length
            : 0;

        summary = {
          totalStocks: stockRecommendations.length,
          avgScore: avgScore.toFixed(1),
          buyRecommendations: stockRecommendations.filter(
            (rec) => rec.recommendationType === "BUY"
          ).length,
          holdRecommendations: stockRecommendations.filter(
            (rec) => rec.recommendationType === "HOLD"
          ).length,
          sellRecommendations: stockRecommendations.filter(
            (rec) => rec.recommendationType === "SELL"
          ).length,
          riskLevel: "中等",
        };
      }

      return {
        strategyId: strategy.id,
        strategyType: strategy.strategyType,
        period: period,
        charts: {},
        summary,
        updatedAt: new Date().toISOString(),
      };
    }

    // 按图表类型组织数据
    const charts: any = {};
    chartData.forEach((data) => {
      if (!charts[data.chartType]) {
        charts[data.chartType] = [];
      }

      // 确保 dataDate 是 Date 对象，如果是字符串则转换
      const dateValue =
        data.dataDate instanceof Date ? data.dataDate : new Date(data.dataDate);

      charts[data.chartType].push({
        date: dateValue.toISOString().split("T")[0],
        ...data.dataValue,
      });
    });

    console.log(`图表数据组织完成:`);
    console.log(`- 图表类型数量: ${Object.keys(charts).length}`);
    Object.keys(charts).forEach((chartType) => {
      console.log(`- ${chartType}: ${charts[chartType].length} 个数据点`);
    });

    // 生成摘要数据
    let summary = {};
    if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
      // 回测策略摘要
      const backtestStocks = await this.backtestStockRepository.find({
        where: { strategyId: id },
      });

      summary = {
        totalReturn: strategy.backtestResults?.totalReturn
          ? `${(strategy.backtestResults.totalReturn * 100).toFixed(1)}%`
          : "0%",
        annualReturn: strategy.backtestResults?.annualReturn
          ? `${(strategy.backtestResults.annualReturn * 100).toFixed(1)}%`
          : "0%",
        maxDrawdown: strategy.backtestResults?.maxDrawdown
          ? `${Math.abs(strategy.backtestResults.maxDrawdown * 100).toFixed(1)}%`
          : "0%",
        sharpeRatio:
          strategy.backtestResults?.sharpeRatio?.toFixed(2) || "0.00",
        winRate: strategy.backtestResults?.winRate
          ? `${(strategy.backtestResults.winRate * 100).toFixed(0)}%`
          : "0%",
        totalTrades: strategy.backtestResults?.totalTrades || 0,
        stockCount: backtestStocks.length,
      };
    } else {
      // 选股策略摘要
      const stockRecommendations =
        await this.stockRecommendationRepository.find({
          where: { strategyId: id },
        });

      const avgScore =
        stockRecommendations.length > 0
          ? stockRecommendations.reduce(
              (sum, rec) => sum + Number(rec.score),
              0
            ) / stockRecommendations.length
          : 0;

      const buyRecommendations = stockRecommendations.filter(
        (rec) => rec.recommendationType === "BUY"
      ).length;

      summary = {
        totalStocks: stockRecommendations.length,
        avgScore: avgScore.toFixed(1),
        buyRecommendations,
        holdRecommendations: stockRecommendations.filter(
          (rec) => rec.recommendationType === "HOLD"
        ).length,
        sellRecommendations: stockRecommendations.filter(
          (rec) => rec.recommendationType === "SELL"
        ).length,
        riskLevel: "中等",
      };
    }

    const result = {
      strategyId: strategy.id,
      strategyType: strategy.strategyType,
      period: period,
      charts,
      summary,
      updatedAt: new Date().toISOString(),
    };

    console.log(`=== 返回图表数据 ===`);
    console.log(`策略ID: ${result.strategyId}`);
    console.log(`策略类型: ${result.strategyType}`);
    console.log(`时间周期: ${result.period}`);
    console.log(`图表数量: ${Object.keys(result.charts).length}`);
    console.log(`摘要字段数量: ${Object.keys(result.summary).length}`);
    console.log(`===================`);

    return result;
  }

  async findByUser(
    userId: string,
    query: StrategyQueryDto
  ): Promise<PaginatedResult<Strategy>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "updatedAt",
      sortOrder = STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER,
    } = query;

    const [data, total] = await this.strategyRepository.findAndCount({
      where: { authorId: userId },
      relations: ["author"],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 为用户策略分配随机股票数据
    const strategiesWithStocks = await this.assignStocksToStrategies(data);

    return {
      data: strategiesWithStocks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total_pages: Math.ceil(total / limit), // 添加前端期望的字段名
    };
  }

  async update(
    id: string,
    userId: string,
    updateStrategyDto: UpdateStrategyDto
  ): Promise<Strategy> {
    const strategy = await this.findOne(id);

    // if (strategy.authorId !== userId) {
    //   throw new ForbiddenException("无权限修改此策略");
    // }

    Object.assign(strategy, updateStrategyDto);
    return this.strategyRepository.save(strategy);
  }

  async remove(id: string, userId: string): Promise<void> {
    const strategy = await this.findOne(id);

    if (strategy.authorId !== userId) {
      throw new ForbiddenException("无权限删除此策略");
    }

    await this.strategyRepository.remove(strategy);
  }

  async shareStrategy(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.findOne(id);

    // if (strategy.authorId !== userId) {
    //   throw new ForbiddenException("无权限分享此策略");
    // }

    // 检查用户等级权限 - 分享权限
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions =
      USER_LEVEL_PERMISSIONS[user.level] ||
      USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    if (!permissions.canShareStrategy) {
      throw new ForbiddenException(
        "您的用户等级不支持分享策略功能，请升级到高级用户"
      );
    }

    strategy.isShared = true;
    strategy.shareId = uuidv4();
    strategy.sharedAt = new Date();

    return this.strategyRepository.save(strategy);
  }

  /**
   * 点赞策略（切换模式）
   */
  async likeStrategy(id: string, userId: string): Promise<boolean> {
    const strategy = await this.findOne(id);

    // 检查用户是否已经点赞
    const existingLike = await this.userLikeRepository.findOne({
      where: { userId, strategyId: id },
    });

    if (existingLike) {
      // 如果已经点赞，则取消点赞
      await this.userLikeRepository.remove(existingLike);
      strategy.likes = Math.max(0, strategy.likes - 1);
      await this.strategyRepository.save(strategy);
      return false; // 返回false表示取消点赞
    } else {
      // 如果没有点赞，则添加点赞
      const userLike = this.userLikeRepository.create({
        userId,
        strategyId: id,
      });
      await this.userLikeRepository.save(userLike);
      strategy.likes += 1;
      await this.strategyRepository.save(strategy);
      return true; // 返回true表示点赞成功
    }
  }

  /**
   * 收藏策略（切换模式）
   */
  async favoriteStrategy(id: string, userId: string): Promise<boolean> {
    const strategy = await this.findOne(id);

    // 检查用户是否已经收藏
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { userId, strategyId: id },
    });

    if (existingFavorite) {
      // 如果已经收藏，则取消收藏
      await this.userFavoriteRepository.remove(existingFavorite);
      strategy.favorites = Math.max(0, strategy.favorites - 1);
      await this.strategyRepository.save(strategy);
      return false; // 返回false表示取消收藏
    } else {
      // 如果没有收藏，则添加收藏
      const userFavorite = this.userFavoriteRepository.create({
        userId,
        strategyId: id,
      });
      await this.userFavoriteRepository.save(userFavorite);
      strategy.favorites += 1;
      await this.strategyRepository.save(strategy);
      return true; // 返回true表示收藏成功
    }
  }

  /**
   * 获取用户收藏的策略列表
   */
  async getUserFavorites(
    userId: string,
    query: StrategyQueryDto
  ): Promise<PaginatedResult<Strategy>> {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const queryBuilder = this.userFavoriteRepository
      .createQueryBuilder("favorite")
      .leftJoinAndSelect("favorite.strategy", "strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .where("favorite.userId = :userId", { userId })
      .orderBy("favorite.createdAt", "DESC")
      .skip(offset)
      .take(limit);

    const [favorites, total] = await queryBuilder.getManyAndCount();
    const strategies = favorites.map((fav) => fav.strategy);

    return {
      data: strategies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total_pages: Math.ceil(total / limit), // 添加前端期望的字段名
    };
  }

  /**
   * 获取用户的所有相关策略（我的策略）
   * 包括：创建的、点赞的、收藏的、编辑保存过的策略
   */
  async getUserMyStrategies(
    userId: string,
    query: StrategyQueryDto
  ): Promise<PaginatedResult<Strategy>> {
    const {
      sortBy = "updatedAt",
      sortOrder = "DESC",
      search,
      category,
      strategyType,
    } = query;

    // 获取用户创建的策略
    let createdStrategiesQuery = this.strategyRepository
      .createQueryBuilder("strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .where("strategy.authorId = :userId", { userId })
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.likes",
        "strategy.favorites",
        "strategy.usageCount",
        "strategy.rating",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
      ]);

    // 添加搜索条件
    if (search) {
      this.addFuzzySearchConditions(createdStrategiesQuery, search);
    }

    // 添加分类条件
    if (category) {
      createdStrategiesQuery.andWhere("strategy.category = :category", {
        category,
      });
    }

    // 添加策略类型条件
    if (strategyType) {
      createdStrategiesQuery.andWhere("strategy.strategyType = :strategyType", {
        strategyType,
      });
    }

    // 获取用户点赞的策略
    const likedStrategiesQuery = this.userLikeRepository
      .createQueryBuilder("like")
      .leftJoinAndSelect("like.strategy", "strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .where("like.userId = :userId", { userId })
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.likes",
        "strategy.favorites",
        "strategy.usageCount",
        "strategy.rating",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
        "like.createdAt",
      ]);

    // 获取用户收藏的策略
    const favoritedStrategiesQuery = this.userFavoriteRepository
      .createQueryBuilder("favorite")
      .leftJoinAndSelect("favorite.strategy", "strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .where("favorite.userId = :userId", { userId })
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.likes",
        "strategy.favorites",
        "strategy.usageCount",
        "strategy.rating",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
        "favorite.createdAt",
      ]);

    // 执行查询
    const [createdStrategies, likedStrategies, favoritedStrategies] =
      await Promise.all([
        createdStrategiesQuery.getMany(),
        likedStrategiesQuery.getMany(),
        favoritedStrategiesQuery.getMany(),
      ]);

    // 合并策略并去重
    const strategyMap = new Map<
      string,
      Strategy & { interactionType: string; interactionDate: Date }
    >();

    // 添加创建的策略
    createdStrategies.forEach((strategy) => {
      strategyMap.set(strategy.id, {
        ...strategy,
        interactionType: "created",
        interactionDate: strategy.createdAt,
      });
    });

    // 添加点赞的策略
    likedStrategies.forEach((like) => {
      const strategy = like.strategy;
      if (!strategyMap.has(strategy.id)) {
        strategyMap.set(strategy.id, {
          ...strategy,
          interactionType: "liked",
          interactionDate: like.createdAt,
        });
      } else {
        // 如果已存在，更新交互类型为组合类型
        const existing = strategyMap.get(strategy.id)!;
        existing.interactionType = existing.interactionType + ",liked";
      }
    });

    // 添加收藏的策略
    favoritedStrategies.forEach((favorite) => {
      const strategy = favorite.strategy;
      if (!strategyMap.has(strategy.id)) {
        strategyMap.set(strategy.id, {
          ...strategy,
          interactionType: "favorited",
          interactionDate: favorite.createdAt,
        });
      } else {
        // 如果已存在，更新交互类型为组合类型
        const existing = strategyMap.get(strategy.id)!;
        existing.interactionType = existing.interactionType + ",favorited";
      }
    });

    // 转换为数组并排序
    let allStrategies = Array.from(strategyMap.values());

    // 根据排序参数排序
    allStrategies.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "interactionDate":
          aValue = a.interactionDate;
          bValue = b.interactionDate;
          break;
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "popularity":
          aValue = a.popularity;
          bValue = b.popularity;
          break;
        case "likes":
          aValue = a.likes;
          bValue = b.likes;
          break;
        case "createdAt":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (sortOrder === "ASC") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 为策略分配股票数据
    const strategiesWithStocks =
      await this.assignStocksToStrategies(allStrategies);

    return {
      data: strategiesWithStocks,
      total: allStrategies.length,
      page: 1,
      limit: allStrategies.length,
      totalPages: 1,
    };
  }

  async incrementUsage(id: string): Promise<void> {
    await this.strategyRepository.increment({ id }, "usageCount", 1);
  }

  async getPopularStrategies(
    params: {
      limit?: number;
      type?: "popularity" | "likes" | "usageCount" | "rating";
    } = {}
  ): Promise<Strategy[]> {
    const { limit = 10, type = "popularity" } = params;

    const queryBuilder = this.strategyRepository
      .createQueryBuilder("strategy")
      .leftJoinAndSelect("strategy.author", "author")
      .where("strategy.isPublic = :isPublic", { isPublic: true })
      .select([
        "strategy.id",
        "strategy.name",
        "strategy.description",
        "strategy.icon",
        "strategy.category",
        "strategy.strategyType",
        "strategy.difficulty",
        "strategy.popularity",
        "strategy.tags",
        "strategy.isPublic",
        "strategy.likes",
        "strategy.favorites",
        "strategy.usageCount",
        "strategy.rating",
        "strategy.createdAt",
        "strategy.updatedAt",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatar",
      ]);

    const strategies = await queryBuilder
      .orderBy(`strategy.${type}`, STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER)
      .take(limit)
      .getMany();

    return this.assignStocksToStrategies(strategies);
  }

  async getRecentStrategies(limit: number = 10): Promise<Strategy[]> {
    const strategies = await this.strategyRepository.find({
      where: { isPublic: true },
      relations: ["author"],
      order: { createdAt: STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER },
      take: limit,
    });

    return this.assignStocksToStrategies(strategies);
  }

  /**
   * 获取策略排行榜
   * @param limit 返回数量限制
   * @param sortBy 排序字段 (popularity, likes, usageCount, rating)
   */
  async getStrategyRanking(
    limit: number = 10,
    sortBy: string = "popularity"
  ): Promise<Strategy[]> {
    const validSortFields = ["popularity", "likes", "usageCount", "rating"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "popularity";

    const strategies = await this.strategyRepository.find({
      where: { isPublic: true },
      relations: ["author"],
      order: { [sortField]: STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        strategyType: true,
        difficulty: true,
        popularity: true,
        likes: true,
        usageCount: true,
        rating: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    });

    return this.assignStocksToStrategies(strategies);
  }

  async getMeta() {
    // 策略类型从数据库查
    const typesRaw = await this.strategyTypeRepository.find({
      order: { order: "ASC" },
    });
    const types = [
      { value: "all", label: "全部类型" },
      ...typesRaw.map((t) => ({
        value: t.value,
        label: t.label,
        description: t.description,
      })),
    ];

    // 分类动态查询
    const categoriesRaw = await this.strategyRepository
      .createQueryBuilder("strategy")
      .select("DISTINCT strategy.category", "category")
      .getRawMany();
    const categoriesData = categoriesRaw
      .map((item) => item.category)
      .filter(Boolean);
    const categories = [
      { value: "all", label: "全部分类" },
      ...categoriesData.map((cat) => ({ value: cat, label: cat })),
    ];

    // 排序选项
    const sortOptions = STRATEGY_CONSTANTS.SORT_OPTIONS;

    return {
      success: true,
      data: {
        types,
        categories,
        sortOptions,
      },
    };
  }

  /**
   * 获取策略广场统计数据（不受筛选影响）
   */
  async getStatistics() {
    const queryBuilder = this.strategyRepository
      .createQueryBuilder("strategy")
      .where("strategy.isPublic = :isPublic", { isPublic: true });

    // 获取总策略数
    const totalStrategies = await queryBuilder.getCount();

    // 获取总使用次数
    const usageCountResult = await queryBuilder
      .select("SUM(strategy.usageCount)", "totalUsageCount")
      .getRawOne();
    const totalUsageCount = parseInt(usageCountResult.totalUsageCount) || 0;

    // 获取总点赞数
    const likesResult = await queryBuilder
      .select("SUM(strategy.likes)", "totalLikes")
      .getRawOne();
    const totalLikes = parseInt(likesResult.totalLikes) || 0;

    // 获取平均评分
    const ratingResult = await queryBuilder
      .select("AVG(strategy.rating)", "avgRating")
      .getRawOne();
    const avgRating = parseFloat(ratingResult.avgRating) || 0;

    return {
      totalStrategies,
      totalUsageCount,
      totalLikes,
      avgRating: avgRating.toFixed(1),
    };
  }

  // ================== 用户等级权限检查方法 ==================

  /**
   * 检查用户是否可以创建策略
   * @param user 用户实体
   */
  private async checkStrategyCreationPermission(user: User): Promise<void> {
    const permissions =
      USER_LEVEL_PERMISSIONS[user.level] ||
      USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    const currentStrategyCount = user.strategies.length;
    const maxStrategies = permissions.maxStrategies;

    if (maxStrategies !== -1 && currentStrategyCount >= maxStrategies) {
      throw new ForbiddenException(
        `您的用户等级最多只能创建 ${maxStrategies} 个策略，当前已有 ${currentStrategyCount} 个。请升级用户等级以创建更多策略。`
      );
    }
  }

  /**
   * 检查用户是否可以访问高级功能
   * @param userId 用户ID
   */
  async checkPremiumFeatureAccess(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions =
      USER_LEVEL_PERMISSIONS[user.level] ||
      USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    if (!permissions.canAccessPremiumFeatures) {
      throw new ForbiddenException(
        "此功能仅限高级用户使用，请升级您的用户等级"
      );
    }
  }

  /**
   * 检查用户是否可以导出数据
   * @param userId 用户ID
   */
  async checkDataExportPermission(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions =
      USER_LEVEL_PERMISSIONS[user.level] ||
      USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    if (!permissions.canExportData) {
      throw new ForbiddenException(
        "数据导出功能仅限高级用户使用，请升级您的用户等级"
      );
    }
  }

  /**
   * 获取用户策略统计信息（包含等级限制信息）
   * @param userId 用户ID
   */
  async getUserStrategyStats(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    const permissions =
      USER_LEVEL_PERMISSIONS[user.level] ||
      USER_LEVEL_PERMISSIONS[UserLevel.NORMAL];
    const currentCount = user.strategies.length;
    const maxStrategies = permissions.maxStrategies;

    return {
      currentCount,
      maxStrategies,
      canCreateMore: maxStrategies === -1 || currentCount < maxStrategies,
      remainingSlots:
        maxStrategies === -1 ? -1 : Math.max(0, maxStrategies - currentCount),
      userLevel: user.level,
      levelName:
        user.level === UserLevel.NORMAL
          ? "普通用户"
          : user.level === UserLevel.PREMIUM
            ? "高级用户"
            : "超级用户",
      permissions,
    };
  }

  /**
   * 添加模糊搜索条件
   * 支持多种搜索模式：
   * 1. 多词搜索：空格分隔的词语
   * 2. 精确匹配：引号包围的短语
   * 3. 排除搜索：减号开头的词语
   * 4. 字段指定：field:value格式
   */
  private addFuzzySearchConditions(queryBuilder: any, search: string) {
    const searchTerms = this.parseSearchTerms(search);
    console.log("解析的搜索词:", searchTerms);
    const searchConditions: string[] = [];
    const searchParams: Record<string, string> = {};

    searchTerms.forEach((term, index) => {
      const paramKey = `search${index}`;

      if (term.exclude) {
        // 排除搜索：-term
        searchParams[paramKey] = `%${term.value}%`;
        searchConditions.push(`NOT (
          strategy.name LIKE :${paramKey} OR 
          strategy.description LIKE :${paramKey} OR 
          strategy.tags LIKE :${paramKey} OR 
          author.username LIKE :${paramKey} OR 
          (author.displayName IS NOT NULL AND author.displayName LIKE :${paramKey})
        )`);
      } else if (term.field) {
        // 字段指定搜索：field:value
        searchParams[paramKey] = `%${term.value}%`;
        switch (term.field) {
          case "name":
          case "title":
            searchConditions.push(`strategy.name LIKE :${paramKey}`);
            break;
          case "description":
          case "desc":
            searchConditions.push(`strategy.description LIKE :${paramKey}`);
            break;
          case "author":
          case "user":
            searchConditions.push(
              `(author.username LIKE :${paramKey} OR (author.displayName IS NOT NULL AND author.displayName LIKE :${paramKey}))`
            );
            break;
          case "tag":
          case "tags":
            searchConditions.push(`strategy.tags LIKE :${paramKey}`);
            break;
          case "category":
            searchConditions.push(`strategy.category LIKE :${paramKey}`);
            break;
          default:
            // 未知字段，回退到全字段搜索
            searchConditions.push(`(
              strategy.name LIKE :${paramKey} OR 
              strategy.description LIKE :${paramKey} OR 
              strategy.tags LIKE :${paramKey} OR 
              author.username LIKE :${paramKey} OR 
              (author.displayName IS NOT NULL AND author.displayName LIKE :${paramKey})
            )`);
        }
      } else {
        // 普通搜索
        searchParams[paramKey] = `%${term.value}%`;
        searchConditions.push(`(
          strategy.name LIKE :${paramKey} OR 
          strategy.description LIKE :${paramKey} OR 
          strategy.tags LIKE :${paramKey} OR 
          author.username LIKE :${paramKey} OR 
          (author.displayName IS NOT NULL AND author.displayName LIKE :${paramKey})
        )`);
      }
    });

    // 使用AND连接所有搜索条件
    if (searchConditions.length > 0) {
      const finalCondition = searchConditions.join(" AND ");
      console.log("最终搜索条件:", finalCondition);
      console.log("搜索参数:", searchParams);
      queryBuilder.andWhere(finalCondition, searchParams);
    }
  }

  /**
   * 解析搜索词
   * 支持的格式：
   * - 普通词语：word
   * - 精确匹配：'exact phrase'
   * - 排除搜索：-word
   * - 字段搜索：field:value
   */
  private parseSearchTerms(search: string): Array<{
    value: string;
    exclude?: boolean;
    field?: string;
    exact?: boolean;
  }> {
    const terms: Array<{
      value: string;
      exclude?: boolean;
      field?: string;
      exact?: boolean;
    }> = [];

    // 处理引号包围的精确匹配
    const exactMatches = search.match(/(["'])((?:(?!\1)[^\\]|\\.)*)?\1/g) || [];
    let processedSearch = search;

    exactMatches.forEach((match, index) => {
      const placeholder = `__EXACT_${index}__`;
      processedSearch = processedSearch.replace(match, placeholder);
      const value = match.slice(1, -1); // 去掉引号
      terms.push({ value, exact: true });
    });

    // 处理剩余的搜索词
    const remainingTerms = processedSearch
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    remainingTerms.forEach((term) => {
      if (term.startsWith("__EXACT_")) {
        // 跳过精确匹配的占位符
        return;
      }

      if (term.startsWith("-")) {
        // 排除搜索
        const value = term.slice(1);
        if (value.length > 0) {
          terms.push({ value, exclude: true });
        }
      } else if (term.includes(":")) {
        // 字段搜索
        const [field, value] = term.split(":", 2);
        if (field && value) {
          terms.push({ field, value });
        }
      } else {
        // 普通搜索
        terms.push({ value: term });
      }
    });

    return terms;
  }

  // ================== 新增功能方法 ==================

  /**
   * 发布策略到广场
   */
  async publishStrategy(strategyId: string, userId: string): Promise<Strategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    strategy.isPublic = true;
    strategy.publishedAt = new Date();
    strategy.updatedAt = new Date();

    return this.strategyRepository.save(strategy);
  }

  /**
   * AI提取投资关键词 - 调用Python分析服务
   */
  async extractKeywords(
    input: string
  ): Promise<{
    keywords: Array<{ id: string; text: string; confidence: number }>;
    structured_conditions: Array<{
      field: string;
      operator: string;
      value: any;
      period?: string;
    }>;
  }> {
    try {
      console.log(`调用Python服务提取关键词: ${input}`);

      // 调用Python分析服务
      const response = await this.pythonApiClient.extractKeywords({
        query: input,
        max_keywords: 10,
      });

      console.log('Python服务响应结构:', JSON.stringify(response, null, 2));
      console.log('条件检查 - response.success:', response.success);
      console.log('条件检查 - response.data:', response.data);
      console.log('条件检查 - 两个条件都为真:', response.success && response.data);

      if (response.success && response.data) {
        const data = response.data;
        
        // 转换Python服务返回的数据格式
        const keywords = (data.extracted_keywords || []).map(
          (keyword: any) => ({
            id: uuidv4(),
            text: typeof keyword === 'string' ? keyword : (keyword.text || keyword.keyword || keyword),
            confidence: typeof keyword === 'string' ? 0.8 : (keyword.confidence || 0.8),
          })
        );

        // 保存结构化条件到实例变量中，供analyzeStrategy使用
        this.lastStructuredConditions = data.structured_conditions || [];

        console.log(`Python服务返回${keywords.length}个关键词`);
        console.log(`Python服务返回${this.lastStructuredConditions.length}个结构化条件`);
        
        return {
          keywords: keywords.slice(0, 6), // 最多返回6个关键词
          structured_conditions: this.lastStructuredConditions, // 返回结构化条件
        };
      }

      // Python服务调用失败，抛出错误
      throw new Error("Python关键词提取服务返回数据格式错误");
    } catch (error) {
      console.error("调用Python关键词提取服务失败:", error.message);
      throw new Error(`Python关键词提取服务调用失败: ${error.message}`);
    }
  }



  /**
   * AI推荐股票 - 调用Python分析服务
   */
  async recommendStocks(
    keywords: Array<{ text: string; confidence: number }>
  ): Promise<
    Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      matchScore: number;
      matchReasons: string[];
      sector: string;
      marketCap: string;
      pe: number;
      volume: number;
    }>
  > {
    try {
      // 根据是否有结构化条件调整日志输出
      if (this.lastStructuredConditions && this.lastStructuredConditions.length > 0) {
        console.log("调用Python服务推荐股票，基于结构化条件:", this.lastStructuredConditions.map(c => `${c.field} ${c.operator} ${c.value}`));
      } else {
        console.log("调用Python服务推荐股票，基于关键词:", keywords.map((k) => k.text));
      }

      // 构建查询文本
      const query = keywords.map((k) => k.text).join("、") + "相关的优质股票";

      // 调用Python分析服务，传递结构化条件
      const response = await this.pythonApiClient.recommendStocks({
        query: query,
        limit: 10,
        structured_conditions: this.lastStructuredConditions, // 传递结构化条件
      });

      console.log('Python股票推荐服务响应结构:', JSON.stringify(response, null, 2));

      if (response.success && response.data && response.data.recommendations) {
        // 转换Python服务返回的新数据格式
        const recommendations = response.data.recommendations.map(
          (stock: any) => ({
            symbol: stock.symbol,
            name: stock.name,
            matchScore: Math.round((stock.match_score || 0) * 100),
            matchReasons: stock.match_reasons || ["基于AI分析推荐"],
            riskLevel: stock.risk_level || "medium",
            investmentHighlights: stock.investment_highlights || [],
            riskWarnings: stock.risk_warnings || [],
            // 使用key-value格式的详细信息
            details: stock.details || {},
            // 为了兼容性，保留一些基本字段
            price: this.extractPriceFromDetails(stock.details),
            change: this.extractChangeFromDetails(stock.details),
            changePercent: this.extractChangePercentFromDetails(stock.details),
            sector: this.extractValueFromDetails(stock.details, "行业"),
            marketCap: this.extractValueFromDetails(stock.details, "市值"),
            pe: this.extractValueFromDetails(stock.details, "市盈率"),
            volume: this.extractValueFromDetails(stock.details, "成交量"),
          })
        );

        console.log(`Python服务返回${recommendations.length}个推荐`);
        return recommendations;
      }

      // Python服务调用失败，抛出错误
      throw new Error("Python股票推荐服务返回数据格式错误");
    } catch (error) {
      console.error("调用Python股票推荐服务失败:", error.message);
      throw new Error(`Python股票推荐服务调用失败: ${error.message}`);
    }
  }



  /**
   * 处理股票推荐数据
   */
  private processStockRecommendations(
    stocks: any[],
    keywords: Array<{ text: string; confidence: number }>
  ): Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    matchScore: number;
    matchReasons: string[];
    sector: string;
    marketCap: string;
    pe: number;
    volume: number;
  }> {
    console.log(`开始处理 ${stocks.length} 只股票的推荐数据`);

    const processedStocks = stocks.slice(0, 8).map((stock, index) => {
      console.log(
        `处理股票: ${stock.symbol} - ${stock.name} (${stock.sector})`
      );

      // 根据关键词匹配度计算推荐评分
      const baseScore = 60 + Math.random() * 30; // 60-90分基础分
      let matchScore = baseScore;
      const matchReasons = [];

      // 根据关键词匹配情况调整评分和理由
      for (const keyword of keywords) {
        const isMatch = this.isStockMatchKeyword(stock, keyword.text);
        console.log(`  关键词匹配 "${keyword.text}": ${isMatch}`);

        if (isMatch) {
          const bonus = keyword.confidence * 10;
          matchScore += bonus;
          matchReasons.push(this.getMatchReason(keyword.text, stock));
          console.log(`    添加评分: +${bonus.toFixed(1)}`);
        }
      }

      // 确保评分在合理范围内
      matchScore = Math.min(Math.max(Math.round(matchScore), 60), 98);

      // 生成模拟的价格数据 - 基于股票市值调整价格范围
      const marketCapValue = Number(stock.marketCap) || 0;
      let basePrice = 50 + Math.random() * 200;

      if (marketCapValue > 500000000000) {
        // 大于5000亿
        basePrice = 100 + Math.random() * 300; // 100-400元
      } else if (marketCapValue > 100000000000) {
        // 大于1000亿
        basePrice = 50 + Math.random() * 150; // 50-200元
      } else {
        basePrice = 10 + Math.random() * 100; // 10-110元
      }

      const changePercent = (Math.random() - 0.5) * 8; // -4% 到 4%
      const change = basePrice * (changePercent / 100);

      const recommendation = {
        symbol: stock.symbol,
        name: stock.name,
        price: Number(basePrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        matchScore,
        matchReasons:
          matchReasons.length > 0 ? matchReasons : ["基本面良好", "业绩稳定"],
        sector: stock.sector || "其他",
        marketCap: this.formatMarketCap(stock.marketCap),
        pe: Number(stock.peRatio) || 20 + Math.random() * 20,
        volume: Math.floor(Math.random() * 50000000) + 1000000,
      };

      console.log(
        `  最终评分: ${matchScore}, 理由: ${recommendation.matchReasons.join(", ")}`
      );
      return recommendation;
    });

    const sortedStocks = processedStocks.sort(
      (a, b) => b.matchScore - a.matchScore
    ); // 按匹配度排序
    console.log(`股票推荐处理完成，返回 ${sortedStocks.length} 只股票`);

    return sortedStocks;
  }

  /**
   * 判断股票是否匹配关键词
   */
  private isStockMatchKeyword(stock: any, keyword: string): boolean {
    const sector = stock.sector?.toLowerCase() || "";
    const industry = stock.industry?.toLowerCase() || "";
    const name = stock.name?.toLowerCase() || "";

    switch (keyword) {
      case "科技股":
        return (
          sector.includes("科技") ||
          sector.includes("软件") ||
          sector.includes("技术") ||
          industry.includes("科技") ||
          industry.includes("软件") ||
          industry.includes("互联网")
        );
      case "金融股":
        return (
          sector.includes("金融") ||
          sector.includes("银行") ||
          sector.includes("保险") ||
          industry.includes("金融") ||
          industry.includes("银行") ||
          industry.includes("保险")
        );
      case "医药股":
        return (
          sector.includes("医疗") ||
          sector.includes("医药") ||
          sector.includes("生物") ||
          industry.includes("医疗") ||
          industry.includes("医药") ||
          industry.includes("制药")
        );
      case "消费股":
        return (
          sector.includes("消费") ||
          sector.includes("零售") ||
          sector.includes("食品") ||
          industry.includes("消费") ||
          industry.includes("零售") ||
          industry.includes("食品")
        );
      case "能源股":
        return (
          sector.includes("能源") ||
          sector.includes("石油") ||
          sector.includes("电力") ||
          industry.includes("能源") ||
          industry.includes("石油") ||
          industry.includes("电力")
        );
      case "大盘股":
        return stock.marketCap > 100000000000; // 市值超过1000亿
      case "高成长":
        return (
          name.includes("科技") ||
          name.includes("新") ||
          sector.includes("科技")
        );
      case "人工智能":
        return (
          name.includes("智能") ||
          name.includes("AI") ||
          name.includes("科技") ||
          sector.includes("科技") ||
          industry.includes("人工智能")
        );
      default:
        return Math.random() > 0.5; // 默认50%概率匹配
    }
  }

  /**
   * 获取匹配理由
   */
  private getMatchReason(keyword: string, stock: any): string {
    const reasonMap = {
      科技股: "科技行业领先企业",
      金融股: "金融行业核心标的",
      医药股: "医药健康龙头",
      消费股: "消费品牌价值突出",
      能源股: "能源行业稳定收益",
      大盘股: "大市值蓝筹标的",
      高成长: "业务快速增长",
      低估值: "估值相对合理",
      高股息: "分红收益稳定",
      人工智能: "AI技术应用前景",
      新技术: "新技术发展潜力",
      新能源汽车: "新能源产业链",
    };

    return reasonMap[keyword] || "投资价值突出";
  }

  /**
   * 格式化市值显示
   */
  private formatMarketCap(marketCap: number): string {
    if (!marketCap) return "未知";

    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(0)}B`;
    } else if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(0)}M`;
    } else {
      return `${marketCap}`;
    }
  }

  /**
   * 从details中提取指定key的值
   */
  private extractValueFromDetails(details: any, key: string): any {
    return details?.[key] || null;
  }

  /**
   * 从details中提取价格信息
   */
  private extractPriceFromDetails(details: any): number {
    const priceStr = details?.["最新价格"];
    if (priceStr) {
      const price = parseFloat(priceStr);
      return isNaN(price) ? 100 + Math.random() * 200 : price;
    }
    return 100 + Math.random() * 200;
  }

  /**
   * 从details中提取价格变化信息
   */
  private extractChangeFromDetails(details: any): number {
    const changePercentStr = details?.["涨跌幅"];
    if (changePercentStr) {
      const changePercent = parseFloat(changePercentStr.replace('%', ''));
      if (!isNaN(changePercent)) {
        // 假设一个合理的价格基数来计算绝对变化值
        const price = this.extractPriceFromDetails(details);
        return (price * changePercent) / 100;
      }
    }
    return (Math.random() - 0.5) * 10;
  }

  /**
   * 从details中提取涨跌幅信息
   */
  private extractChangePercentFromDetails(details: any): number {
    const changePercentStr = details?.["涨跌幅"];
    if (changePercentStr) {
      const changePercent = parseFloat(changePercentStr.replace('%', ''));
      return isNaN(changePercent) ? (Math.random() - 0.5) * 5 : changePercent;
    }
    return (Math.random() - 0.5) * 5;
  }

  /**
   * AI分析策略描述并推荐股票
   * 将关键词提取和股票推荐合并为一个接口
   */
  async analyzeStrategy(
    input: string,
    strategyId?: string
  ): Promise<{
    keywords: Array<{ id: string; text: string; confidence: number }>;
    recommendations: Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      matchScore: number;
      matchReasons: string[];
      sector: string;
      marketCap: string;
      pe: number;
      volume: number;
    }>;
    structured_conditions: Array<{
      field: string;
      operator: string;
      value: any;
      period?: string;
    }>;
  }> {
    console.log(`=== 开始分析策略 ===`);
    console.log(`输入文本: ${input}`);
    console.log(`策略ID: ${strategyId || "无"}`);

    try {
      // 1. 先提取关键词和结构化条件
      console.log("步骤1: 提取关键词和结构化条件...");
      const extractResult = await this.extractKeywords(input);
      const keywords = extractResult.keywords;
      const structuredConditions = extractResult.structured_conditions;
      
      console.log(
        "提取的关键词:",
        keywords.map((k) => `${k.text}(${k.confidence})`)
      );
      console.log(
        "提取的结构化条件:",
        structuredConditions.map((c) => `${c.field} ${c.operator} ${c.value}${c.period ? ` (${c.period})` : ''}`)
      );

      // 2. 基于关键词推荐股票
      console.log("步骤2: 推荐股票...");
      const recommendations = await this.recommendStocks(
        keywords.map((k) => ({ text: k.text, confidence: k.confidence }))
      );
      console.log(`推荐股票数量: ${recommendations.length}`);

      // 3. 如果提供了策略ID，生成并保存图表数据
      if (strategyId) {
        try {
          console.log(`步骤3: 为策略 ${strategyId} 生成图表数据...`);
          await this.chartDataService.generateAndSaveChartData(
            strategyId,
            "1y"
          );
          console.log(`策略 ${strategyId} 图表数据生成完成`);
        } catch (error) {
          console.error(`策略 ${strategyId} 图表数据生成失败:`, error);
          // 图表数据生成失败不影响分析结果返回
        }
      }

      console.log(`=== 策略分析完成 ===`);
      return {
        keywords,
        recommendations,
        structured_conditions: structuredConditions, // 使用从extractKeywords获取的结构化条件
      };
    } catch (error) {
      console.error("策略分析过程中发生错误:", error);
      throw new Error(`策略分析失败: ${error.message || '未知错误'}`);
    }
  }

  /**
   * AI分析股票组合
   */
  async analyzePortfolio(stocks: string[]): Promise<{
    riskLevel: string;
    expectedReturn: number;
    diversification: number;
    sectorDistribution: Record<string, number>;
    recommendations: string[];
  }> {
    // 模拟AI组合分析
    // 在实际应用中，这里会调用Python AI服务
    const analysis = {
      riskLevel: "中等风险",
      expectedReturn: 12.5,
      diversification: 0.75,
      sectorDistribution: {
        科技: 70,
        金融: 20,
        医疗: 10,
      },
      recommendations: [
        "建议增加金融板块配置以提高多样化",
        "科技股占比较高，注意风险控制",
        "整体组合具有良好的成长潜力",
      ],
    };

    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return analysis;
  }

  /**
   * 保存策略配置
   */
  async saveStrategyConfig(
    strategyId: string,
    userId: string,
    configData: any
  ): Promise<Strategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
      relations: ["author"],
    });

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    // 更新策略配置数据
    if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION) {
      // 选股策略配置 - 简化为只使用根级字段
      strategy.selectionCriteria = {
        originalQuery: configData.originalQuery,
        keywords: configData.keywords,
        selectedStocks: configData.selectedStocks,
      };

      // 更新股票推荐配置
      const selectedStocks = configData.selectedStocks;
      if (selectedStocks && selectedStocks.length > 0) {
        // 删除现有的股票推荐配置
        await this.stockRecommendationRepository.delete({ strategyId });

        // 为每个选中的股票创建或查找股票记录
        const stockRecommendations = [];
        for (const selectedStock of selectedStocks) {
          // 查找或创建股票记录
          let stock = await this.stockRepository.findOne({
            where: { symbol: selectedStock.symbol },
          });

          if (!stock) {
            // 如果股票不存在，创建新记录
            // 处理marketCap字段，确保是有效的数字并在合理范围内
            let marketCap = null;
            if (
              selectedStock.marketCap !== undefined &&
              selectedStock.marketCap !== null
            ) {
              if (typeof selectedStock.marketCap === "string") {
                // 如果是字符串，提取数字部分
                const numStr = selectedStock.marketCap.replace(/[^\d.]/g, "");
                const num = parseFloat(numStr);
                if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
                  // BIGINT最大值
                  marketCap = Math.floor(num);
                }
              } else if (typeof selectedStock.marketCap === "number") {
                // 如果是数字，确保在合理范围内
                if (
                  selectedStock.marketCap > 0 &&
                  selectedStock.marketCap <= 9223372036854775807
                ) {
                  marketCap = Math.floor(selectedStock.marketCap);
                }
              }
            }

            stock = this.stockRepository.create({
              symbol: selectedStock.symbol,
              name: selectedStock.name,
              sector: selectedStock.sector,
              marketCap: marketCap,
              isActive: true,
              currency: "USD",
            });
            stock = await this.stockRepository.save(stock);
          }

          // 创建股票推荐记录
          stockRecommendations.push({
            strategyId,
            stockId: stock.id,
            symbol: selectedStock.symbol,
            score: 80, // 默认评分
            reason: "用户选择",
            riskLevel: "medium" as const,
            recommendationType: "BUY" as const,
            confidence: 0.8,
          });
        }

        await this.stockRecommendationRepository.save(stockRecommendations);
      }
    } else if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
      // 回测策略配置
      strategy.backtestPeriod = {
        startDate: configData.startDate,
        endDate: configData.endDate,
        initialCapital: configData.initialCapital,
        rebalanceFrequency: configData.rebalanceFrequency,
        commission: configData.commission,
      };

      // 更新回测股票配置
      if (configData.positions && configData.positions.length > 0) {
        // 删除现有的回测股票配置
        await this.backtestStockRepository.delete({ strategyId });

        // 为每个股票位置创建或查找股票记录
        const backtestStocks = [];
        for (const position of configData.positions) {
          // 查找或创建股票记录
          let stock = await this.stockRepository.findOne({
            where: { symbol: position.symbol },
          });

          if (!stock) {
            // 如果股票不存在，创建新记录
            // 处理marketCap字段，确保是有效的数字并在合理范围内
            let marketCap = null;
            if (
              position.marketCap !== undefined &&
              position.marketCap !== null
            ) {
              if (typeof position.marketCap === "string") {
                // 如果是字符串，提取数字部分
                const numStr = position.marketCap.replace(/[^\d.]/g, "");
                const num = parseFloat(numStr);
                if (!isNaN(num) && num > 0 && num <= 9223372036854775807) {
                  // BIGINT最大值
                  marketCap = Math.floor(num);
                }
              } else if (typeof position.marketCap === "number") {
                // 如果是数字，确保在合理范围内
                if (
                  position.marketCap > 0 &&
                  position.marketCap <= 9223372036854775807
                ) {
                  marketCap = Math.floor(position.marketCap);
                }
              }
            }

            stock = this.stockRepository.create({
              symbol: position.symbol,
              name: position.name,
              sector: position.sector,
              marketCap: marketCap,
              isActive: true,
              currency: "USD",
            });
            stock = await this.stockRepository.save(stock);
          }

          // 创建回测股票记录
          backtestStocks.push({
            strategyId,
            stockId: stock.id,
            symbol: position.symbol,
            weight: position.weight,
          });
        }

        await this.backtestStockRepository.save(backtestStocks);
      }
    }

    strategy.updatedAt = new Date();
    return await this.strategyRepository.save(strategy);
  }

  /**
   * 获取策略配置数据（用于回显）
   */
  async getStrategyConfig(strategyId: string, userId: string): Promise<any> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
      relations: ["author"],
    });

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION) {
      // 选股策略配置数据
      const stockRecommendations =
        await this.stockRecommendationRepository.find({
          where: { strategyId },
          relations: ["stock"],
        });

      // 如果数据库中没有股票推荐记录，尝试从策略的selectionCriteria中获取
      let selectedStocks = stockRecommendations.map((rec) => ({
        symbol: rec.symbol,
        name: rec.stock.name,
        sector: rec.stock.sector,
        marketCap: rec.stock.marketCap,
      }));

      // 如果数据库中没有记录，但策略配置中有selectedStocks，则使用配置中的数据
      if (
        selectedStocks.length === 0 &&
        strategy.selectionCriteria?.selectedStocks
      ) {
        selectedStocks = strategy.selectionCriteria.selectedStocks;
      }

      return {
        strategyType: "stock_selection",
        originalQuery: strategy.selectionCriteria?.originalQuery || "",
        keywords: strategy.selectionCriteria?.keywords || [],
        selectedStocks: selectedStocks,
      };
    } else if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
      // 回测策略配置数据
      const backtestStocks = await this.backtestStockRepository.find({
        where: { strategyId },
        relations: ["stock"],
      });

      return {
        strategyType: STRATEGY_CONSTANTS.TYPES.BACKTEST,
        startDate: strategy.backtestPeriod?.startDate || "2023-01-01",
        endDate: strategy.backtestPeriod?.endDate || "2024-01-01",
        initialCapital: strategy.backtestPeriod?.initialCapital || 100000,
        rebalanceFrequency:
          strategy.backtestPeriod?.rebalanceFrequency || "monthly",
        commission: strategy.backtestPeriod?.commission || 0.001,
        positions: backtestStocks.map((bt) => ({
          symbol: bt.symbol,
          name: bt.stock?.name || bt.symbol,
          weight: Number(bt.weight),
          sector: bt.stock?.sector || null,
        })),
        backtestResult: strategy.backtestResults,
      };
    }

    return {};
  }

  /**
   * 生成策略分享链接
   */
  async generateShareLink(
    strategyId: string,
    userId: string
  ): Promise<{ shareUrl: string; shareId: string }> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
      relations: ["author"],
    });

    if (!strategy) {
      throw new NotFoundException("策略不存在");
    }

    // 生成分享ID（如果还没有）
    if (!strategy.shareId) {
      strategy.shareId = uuidv4();
      strategy.isShared = true;
      strategy.sharedAt = new Date();
      await this.strategyRepository.save(strategy);
    }

    const shareUrl = environmentService.generateShareUrl(
      `/strategy-square/${strategyId}`
    );

    return {
      shareUrl,
      shareId: strategy.shareId,
    };
  }

  /**
   * 为策略补充缺失的股票数据
   */
  private async ensureStrategyStockData(strategy: Strategy): Promise<Strategy> {
    try {
      if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION) {
        // 检查是否已有股票推荐数据
        const existingRecommendations =
          await this.stockRecommendationRepository.count({
            where: { strategyId: strategy.id },
          });

        if (existingRecommendations === 0) {
          // 如果没有数据，返回空数组
          strategy.stockRecommendations = [];
        }
      } else if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
        // 检查是否已有回测股票数据
        const existingBacktestStocks = await this.backtestStockRepository.count(
          {
            where: { strategyId: strategy.id },
          }
        );

        if (existingBacktestStocks === 0) {
          // 如果没有数据，返回空数组
          strategy.backtestStocks = [];
        }
      }

      return strategy;
    } catch (error) {
      console.error("检查股票数据失败:", error);
      // 失败时返回空数组
      if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION) {
        strategy.stockRecommendations = [];
      } else if (strategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST) {
        strategy.backtestStocks = [];
      }
      return strategy;
    }
  }



  /**
   * 为策略列表批量补充股票数据
   */
  async assignStocksToStrategies(strategies: Strategy[]): Promise<Strategy[]> {
    const promises = strategies.map((strategy) =>
      this.ensureStrategyStockData(strategy)
    );
    return Promise.all(promises);
  }

  /**
   * 复制策略（基于现有策略创建新策略）
   */
  async copyStrategy(
    originalStrategyId: string,
    userId: string,
    copyData?: {
      name?: string;
      description?: string;
      category?: string;
    }
  ): Promise<Strategy> {
    // 获取原策略的完整信息
    const originalStrategy = await this.strategyRepository.findOne({
      where: { id: originalStrategyId },
      relations: ["author"],
    });

    if (!originalStrategy) {
      throw new NotFoundException("原策略不存在");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["strategies"],
    });
    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    // 检查用户等级权限 - 策略数量限制
    await this.checkStrategyCreationPermission(user);

    // 创建新策略的数据
    const newStrategyData = {
      name: copyData?.name || `${originalStrategy.name} - 副本`,
      description: copyData?.description || originalStrategy.description,
      category: copyData?.category || originalStrategy.category,
      strategyType: originalStrategy.strategyType,
      difficulty: originalStrategy.difficulty,
      parameters: originalStrategy.parameters || [],
      tags: originalStrategy.tags || [],
      icon: originalStrategy.icon || "📈",
      isPublic: false, // 复制的策略默认不公开
      authorId: userId, // 设置为当前用户
      // 复制配置数据
      selectionCriteria: originalStrategy.selectionCriteria,
      backtestPeriod: originalStrategy.backtestPeriod,
      backtestResults: null, // 不复制回测结果，需要重新运行
    };

    // 创建新策略
    const newStrategy = this.strategyRepository.create(newStrategyData);
    const savedStrategy = await this.strategyRepository.save(newStrategy);

    // 复制关联的股票数据
    if (
      originalStrategy.strategyType === STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION
    ) {
      // 复制股票推荐数据
      const originalRecommendations =
        await this.stockRecommendationRepository.find({
          where: { strategyId: originalStrategyId },
          relations: ["stock"],
        });

      if (originalRecommendations.length > 0) {
        const newRecommendations = originalRecommendations.map((rec) => ({
          strategyId: savedStrategy.id,
          stockId: rec.stockId,
          symbol: rec.symbol,
          score: rec.score,
          reason: rec.reason,
          riskLevel: rec.riskLevel,
          recommendationType: rec.recommendationType,
          confidence: rec.confidence,
          targetPrice: rec.targetPrice,
        }));

        await this.stockRecommendationRepository.save(newRecommendations);
      }
    } else if (
      originalStrategy.strategyType === STRATEGY_CONSTANTS.TYPES.BACKTEST
    ) {
      // 复制回测股票数据
      const originalBacktestStocks = await this.backtestStockRepository.find({
        where: { strategyId: originalStrategyId },
        relations: ["stock"],
      });

      if (originalBacktestStocks.length > 0) {
        const newBacktestStocks = originalBacktestStocks.map((bt) => ({
          strategyId: savedStrategy.id,
          stockId: bt.stockId,
          symbol: bt.symbol,
          weight: bt.weight,
          // 不复制性能数据，需要重新回测
          performance: null,
          contribution: null,
          tradesCount: null,
          avgPrice: null,
        }));

        await this.backtestStockRepository.save(newBacktestStocks);
      }
    }

    console.log(
      `策略复制完成: ${originalStrategy.name} -> ${savedStrategy.name} (${savedStrategy.id})`
    );
    return savedStrategy;
  }

  /**
   * 计算股票趋势数据
   * 从股票价格历史数据中计算趋势指标
   */
  private async calculateTrendData(symbol: string): Promise<any> {
    try {
      // 获取最近30天的价格数据
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const priceHistory = await this.stockPriceHistoryRepository
        .createQueryBuilder("price")
        .where("price.symbol = :symbol", { symbol })
        .andWhere("price.date >= :startDate", {
          startDate: startDate.toISOString().split("T")[0],
        })
        .andWhere("price.date <= :endDate", {
          endDate: endDate.toISOString().split("T")[0],
        })
        .orderBy("price.date", "ASC")
        .getMany();

      if (priceHistory.length < 2) {
        // 如果没有足够的历史数据，返回默认趋势数据
        return this.getDefaultTrendData();
      }

      // 计算价格变化
      const firstPrice = Number(priceHistory[0].closePrice);
      const lastPrice = Number(
        priceHistory[priceHistory.length - 1].closePrice
      );
      const priceChange = lastPrice - firstPrice;
      const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);

      // 计算平均成交量
      const avgVolume =
        priceHistory.reduce((sum, item) => sum + Number(item.volume || 0), 0) /
        priceHistory.length;

      // 计算波动性 (标准差)
      const prices = priceHistory.map((item) => Number(item.closePrice));
      const avgPrice =
        prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance =
        prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) /
        prices.length;
      const volatility = Math.sqrt(variance) / avgPrice;

      // 确定趋势方向
      let trend = "neutral";
      if (priceChange > 0 && Math.abs(Number(priceChangePercent)) > 2) {
        trend = "upward";
      } else if (priceChange < 0 && Math.abs(Number(priceChangePercent)) > 2) {
        trend = "downward";
      }

      // 确定波动性级别
      let volatilityLevel = "medium";
      if (volatility > 0.15) {
        volatilityLevel = "high";
      } else if (volatility < 0.05) {
        volatilityLevel = "low";
      }

      // 确定动量
      const recentDays = 5;
      if (priceHistory.length >= recentDays) {
        const recentPrices = priceHistory.slice(-recentDays);
        const earlierPrices = priceHistory.slice(
          -(recentDays * 2),
          -recentDays
        );

        if (earlierPrices.length > 0) {
          const recentAvg =
            recentPrices.reduce(
              (sum, item) => sum + Number(item.closePrice),
              0
            ) / recentPrices.length;
          const earlierAvg =
            earlierPrices.reduce(
              (sum, item) => sum + Number(item.closePrice),
              0
            ) / earlierPrices.length;

          let momentum = "neutral";
          const momentumChange = (recentAvg - earlierAvg) / earlierAvg;
          if (momentumChange > 0.01) {
            momentum = "positive";
          } else if (momentumChange < -0.01) {
            momentum = "negative";
          }

          return {
            period: "30d",
            summary: {
              trend,
              volatility: volatilityLevel,
              momentum,
              avgVolume: Math.round(avgVolume),
              priceChange: Number(priceChange.toFixed(2)),
              priceChangePercent: `${priceChangePercent}%`,
            },
          };
        }
      }

      return {
        period: "30d",
        summary: {
          trend,
          volatility: volatilityLevel,
          momentum: "neutral",
          avgVolume: Math.round(avgVolume),
          priceChange: Number(priceChange.toFixed(2)),
          priceChangePercent: `${priceChangePercent}%`,
        },
      };
    } catch (error) {
      console.error(`计算股票 ${symbol} 趋势数据失败:`, error);
      return this.getDefaultTrendData();
    }
  }

  /**
   * 获取默认趋势数据
   */
  private getDefaultTrendData(): any {
    return {
      period: "30d",
      summary: {
        trend: "neutral",
        volatility: "medium",
        momentum: "neutral",
        avgVolume: 1000000,
        priceChange: 0,
        priceChangePercent: "0.00%",
      },
    };
  }

  /**
   * 生成模拟趋势数据
   */
  private generateMockTrendData(): any {
    const trends = ["upward", "downward", "neutral"];
    const volatilities = ["low", "medium", "high"];
    const momentums = ["positive", "negative", "neutral"];

    const priceChange = (Math.random() - 0.5) * 10; // -5% 到 5%
    const priceChangePercent = `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`;

    const trend =
      priceChange > 2 ? "upward" : priceChange < -2 ? "downward" : "neutral";
    const avgVolume = Math.floor(Math.random() * 50000000) + 1000000; // 100万到5100万

    return {
      period: "30d",
      summary: {
        trend,
        volatility:
          volatilities[Math.floor(Math.random() * volatilities.length)],
        momentum: momentums[Math.floor(Math.random() * momentums.length)],
        avgVolume,
        priceChange: Number(priceChange.toFixed(2)),
        priceChangePercent,
      },
    };
  }
}
