import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, MoreThanOrEqual, LessThanOrEqual, Between } from "typeorm";
import { PythonApiClient } from "../../shared/clients/python-api.client";

import { SelectionCriteria, StockRecommendation } from "../../shared/types";
import { StockInfo } from "./entities/stock-info.entity";

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(StockInfo)
    private stockInfoRepository: Repository<StockInfo>,
    private pythonApiClient: PythonApiClient,
  ) {}

  /**
   * 获取股票列表
   */
  async getStockList(query: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    industry?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
  }) {
    const {
      page = 1,
      limit = 50,
      search,
      sector,
      industry,
      minMarketCap,
      maxMarketCap
    } = query;

    const queryBuilder = this.stockInfoRepository.createQueryBuilder('stock')
      .where('stock.isActive = :isActive', { isActive: true });

    // 搜索股票代码或名称
    if (search) {
      queryBuilder.andWhere(
        '(stock.symbol LIKE :search OR stock.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 按板块筛选
    if (sector) {
      queryBuilder.andWhere('stock.sector = :sector', { sector });
    }

    // 按行业筛选
    if (industry) {
      queryBuilder.andWhere('stock.industry = :industry', { industry });
    }

    // 按市值筛选
    if (minMarketCap) {
      queryBuilder.andWhere('stock.marketCap >= :minMarketCap', { minMarketCap });
    }

    if (maxMarketCap) {
      queryBuilder.andWhere('stock.marketCap <= :maxMarketCap', { maxMarketCap });
    }

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // 按市值排序
    queryBuilder.orderBy('stock.marketCap', 'DESC');

    const [stocks, total] = await queryBuilder.getManyAndCount();

    // 转换为前端需要的格式
    const stockOptions = stocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      marketCap: Number(stock.marketCap),
      market: stock.market,
      peRatio: Number(stock.peRatio),
      pbRatio: Number(stock.pbRatio)
    }));

    return {
      data: stockOptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 获取股票推荐 - 调用Python分析服务
   */
  async getRecommendations(
    criteria?: SelectionCriteria,
  ): Promise<StockRecommendation[]> {
    try {
      // 构建查询文本
      let query = "推荐一些优质股票";
      
      if (criteria) {
        const queryParts = [];
        
        if (criteria.sectors && criteria.sectors.length > 0) {
          queryParts.push(`${criteria.sectors.join('、')}行业`);
        }
        
        if (criteria.minMarketCap) {
          queryParts.push(`市值大于${criteria.minMarketCap / 100000000}亿`);
        }
        
        if (criteria.maxMarketCap) {
          queryParts.push(`市值小于${criteria.maxMarketCap / 100000000}亿`);
        }
        
        if (criteria.minScore) {
          queryParts.push(`评分大于${criteria.minScore}`);
        }
        
        if (criteria.maxRisk) {
          const riskMap = { low: '低风险', medium: '中等风险', high: '高风险' };
          queryParts.push(`风险等级为${riskMap[criteria.maxRisk]}以下`);
        }
        
        if (queryParts.length > 0) {
          query = `推荐一些${queryParts.join('且')}的股票`;
        }
      }

      console.log(`调用Python服务获取股票推荐: ${query}`);
      
      // 调用Python分析服务
      const response = await this.pythonApiClient.recommendStocks({
        query: query,
        limit: 20,
        min_market_cap: criteria?.minMarketCap ? criteria.minMarketCap / 100000000 : undefined,
        min_roe: criteria?.minScore ? criteria.minScore / 10 : undefined
      });

      if (response.success && response.data && response.data.recommendations) {
        // 转换Python服务返回的数据格式为前端期望的格式
        const recommendations = response.data.recommendations.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name,
          score: Math.round(stock.match_score),
          reason: stock.match_reasons?.join('；') || '基于AI分析推荐',
          targetPrice: stock.latest_price || 0,
          riskLevel: stock.risk_level || 'medium',
          sector: stock.sector,
          marketCap: stock.market_cap || 0,
          updatedAt: new Date().toISOString(),
          // 添加技术分析数据
          technicalAnalysis: stock.technical_analysis ? {
            rsi: stock.technical_analysis.technical_indicators?.rsi || 50,
            macd: {
              macd: stock.technical_analysis.technical_indicators?.macd || 0,
              signal: stock.technical_analysis.technical_indicators?.macd_signal || 0,
              histogram: stock.technical_analysis.technical_indicators?.macd_histogram || 0,
            },
            movingAverages: {
              ma5: stock.technical_analysis.technical_indicators?.ma5 || 0,
              ma10: stock.technical_analysis.technical_indicators?.ma10 || 0,
              ma20: stock.technical_analysis.technical_indicators?.ma20 || 0,
              ma50: stock.technical_analysis.technical_indicators?.ma50 || 0,
            },
            support: stock.technical_analysis.price_data?.support_level || 0,
            resistance: stock.technical_analysis.price_data?.resistance_level || 0,
            trend: stock.technical_analysis.technical_indicators?.trend || 'neutral',
            strength: stock.technical_analysis.technical_indicators?.strength || 'moderate'
          } : undefined,
          // 添加基本面分析数据
          fundamentalAnalysis: stock.financial_data ? {
            peRatio: stock.financial_data.financial_ratios?.pe_ratio || 0,
            pbRatio: stock.financial_data.financial_ratios?.pb_ratio || 0,
            roe: stock.financial_data.financial_ratios?.roe || 0,
            roa: stock.financial_data.financial_ratios?.roa || 0,
            debtToEquity: stock.financial_data.financial_ratios?.debt_to_equity || 0,
            currentRatio: stock.financial_data.financial_ratios?.current_ratio || 0,
            quickRatio: stock.financial_data.financial_ratios?.quick_ratio || 0,
            grossMargin: stock.financial_data.financial_ratios?.gross_margin || 0,
            operatingMargin: stock.financial_data.financial_ratios?.operating_margin || 0,
            netMargin: stock.financial_data.financial_ratios?.net_margin || 0,
          } : undefined,
          // 添加推荐信息
          recommendation: {
            rating: stock.investment_highlights?.length > 0 ? 'BUY' : 'HOLD',
            score: Math.round(stock.match_score),
            reasons: stock.investment_highlights || []
          }
        }));

        console.log(`Python服务返回${recommendations.length}个推荐`);
        return recommendations;
      }
      
      // 如果Python服务调用失败，抛出错误
      throw new Error('Python股票推荐服务返回数据格式错误');
      
    } catch (error) {
      console.error('调用Python推荐服务失败:', error.message);
      throw new Error(`Python股票推荐服务调用失败: ${error.message}`);
    }
  }



  async searchStocks(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const queryBuilder = this.stockInfoRepository.createQueryBuilder('stock')
        .where('stock.isActive = :isActive', { isActive: true })
        .andWhere(
          '(stock.symbol LIKE :search OR stock.name LIKE :search)',
          { search: `%${query.trim()}%` }
        )
        .orderBy('stock.marketCap', 'DESC');

      const stocks = await queryBuilder.getMany();

      // 转换为前端需要的格式
      return stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        industry: stock.industry,
        marketCap: Number(stock.marketCap),
        market: stock.market,
        peRatio: Number(stock.peRatio),
        pbRatio: Number(stock.pbRatio)
      }));
    } catch (error) {
      console.error('搜索股票时出错:', error);
      // 如果数据库查询失败，返回空数组
      return [];
    }
  }

  async getStockData(symbol: string): Promise<any> {
    // 模拟获取股票数据
    return {
      symbol,
      name: "股票名称",
      price: 150.0,
      change: 2.5,
      changePercent: 1.69,
      volume: 1000000,
      marketCap: 3000000000000,
      pe: 25.5,
      eps: 5.88,
      dividend: 0.88,
      dividendYield: 0.59,
      sector: "科技",
      industry: "消费电子",
      updatedAt: new Date().toISOString(),
    };
  }

  async getStockAnalysis(symbol: string, strategyId?: string): Promise<any> {
    try {
      console.log(`调用Python服务获取股票分析: ${symbol}`);
      
      // 调用Python分析服务获取股票详细分析
      const response = await this.pythonApiClient.getStockDetail(symbol);

      if (response.data.success && response.data.data) {
        const stockData = response.data.data;
        
        // 转换为前端期望的格式
        return {
          symbol,
          strategyId,
          technicalAnalysis: stockData.technical_analysis ? {
            rsi: stockData.technical_analysis.technical_indicators?.rsi || 45.2,
            macd: {
              macd: stockData.technical_analysis.technical_indicators?.macd || 1.23,
              signal: stockData.technical_analysis.technical_indicators?.macd_signal || 0.98,
              histogram: stockData.technical_analysis.technical_indicators?.macd_histogram || 0.25,
            },
            movingAverages: {
              ma5: stockData.technical_analysis.technical_indicators?.ma5 || 148.5,
              ma10: stockData.technical_analysis.technical_indicators?.ma10 || 147.2,
              ma20: stockData.technical_analysis.technical_indicators?.ma20 || 145.8,
              ma50: stockData.technical_analysis.technical_indicators?.ma50 || 142.1,
            },
            support: stockData.technical_analysis.price_data?.support_level || 140.0,
            resistance: stockData.technical_analysis.price_data?.resistance_level || 160.0,
            trend: stockData.technical_analysis.technical_indicators?.trend || 'bullish',
            strength: stockData.technical_analysis.technical_indicators?.strength || 'moderate'
          } : {
            rsi: 45.2,
            macd: { macd: 1.23, signal: 0.98, histogram: 0.25 },
            movingAverages: { ma5: 148.5, ma10: 147.2, ma20: 145.8, ma50: 142.1 },
            support: 140.0,
            resistance: 160.0,
            trend: 'bullish',
            strength: 'moderate'
          },
          fundamentalAnalysis: stockData.financial_data ? {
            peRatio: stockData.financial_data.financial_ratios?.pe_ratio || 25.5,
            pbRatio: stockData.financial_data.financial_ratios?.pb_ratio || 3.2,
            roe: stockData.financial_data.financial_ratios?.roe || 18.5,
            roa: stockData.financial_data.financial_ratios?.roa || 12.3,
            debtToEquity: stockData.financial_data.financial_ratios?.debt_to_equity || 0.45,
            currentRatio: stockData.financial_data.financial_ratios?.current_ratio || 1.8,
            quickRatio: stockData.financial_data.financial_ratios?.quick_ratio || 1.2,
            grossMargin: stockData.financial_data.financial_ratios?.gross_margin || 0.38,
            operatingMargin: stockData.financial_data.financial_ratios?.operating_margin || 0.25,
            netMargin: stockData.financial_data.financial_ratios?.net_margin || 0.21,
          } : {
            peRatio: 25.5,
            pbRatio: 3.2,
            roe: 18.5,
            roa: 12.3,
            debtToEquity: 0.45,
            currentRatio: 1.8,
            quickRatio: 1.2,
            grossMargin: 0.38,
            operatingMargin: 0.25,
            netMargin: 0.21
          },
          recommendation: {
            rating: stockData.ai_sentiment_analysis?.overall_sentiment === 'bullish' ? 'BUY' : 
                   stockData.ai_sentiment_analysis?.overall_sentiment === 'bearish' ? 'SELL' : 'HOLD',
            score: stockData.ai_sentiment_analysis?.confidence ? Math.round(stockData.ai_sentiment_analysis.confidence * 100) : 85,
            reasons: stockData.analysis_summary ? [stockData.analysis_summary] : [
              '技术指标显示上升趋势',
              '基本面数据良好',
              '行业前景看好'
            ]
          },
          updatedAt: new Date().toISOString()
        };
      }
      
      // 如果Python服务调用失败，抛出错误
      throw new Error('Python股票分析服务返回数据格式错误');
      
    } catch (error) {
      console.error('调用Python股票分析服务失败:', error.message);
      throw new Error(`Python股票分析服务调用失败: ${error.message}`);
    }
  }



  async getStockTrend(symbol: string): Promise<any> {
    // 模拟股票趋势数据
    const trends = [];
    const basePrice = 150;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const price = basePrice + (Math.random() - 0.5) * 20 + i * 0.5;
      trends.push({
        date: date.toISOString().split('T')[0],
        price: price,
        volume: Math.floor(Math.random() * 2000000) + 500000,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      });
    }

    return {
      symbol,
      period: '30d',
      trends,
      summary: {
        trend: 'upward',
        volatility: 'medium',
        momentum: 'positive',
        avgVolume: 1200000,
        priceChange: trends[trends.length - 1].price - trends[0].price,
        priceChangePercent: ((trends[trends.length - 1].price - trends[0].price) / trends[0].price * 100).toFixed(2)
      },
      updatedAt: new Date().toISOString()
    };
  }

  async getBatchStockTrends(symbols: string[], period: string = '30d'): Promise<any[]> {
    // 并行获取所有股票的基本趋势信息（不包含详细图表数据）
    const promises = symbols.map(async (symbol) => {
      // 生成基本价格数据用于计算汇总信息
      const basePrice = 150;
      const currentPrice = basePrice + (Math.random() - 0.5) * 20 + 15;
      const startPrice = basePrice + (Math.random() - 0.5) * 10;
      
      return {
        symbol,
        period,
        summary: {
          trend: 'upward',
          volatility: 'medium',
          momentum: 'positive',
          avgVolume: 1200000,
          priceChange: currentPrice - startPrice,
          priceChangePercent: ((currentPrice - startPrice) / startPrice * 100).toFixed(2)
        },
        updatedAt: new Date().toISOString()
      };
    });
    
    const results = await Promise.all(promises);
    
    return results;
  }

  async getStockCharts(symbol: string, period: string = '1y'): Promise<any> {
    // 模拟股票图表数据
    const days = period === '1y' ? 252 : period === '6m' ? 126 : period === '3m' ? 63 : 30;
    const candlestickData = [];
    const basePrice = 150;
    let currentPrice = basePrice;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const dailyChange = (Math.random() - 0.5) * 0.1;
      const open = currentPrice;
      const close = open * (1 + dailyChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.05);
      const low = Math.min(open, close) * (1 - Math.random() * 0.05);
      const volume = Math.floor(Math.random() * 2000000) + 500000;
      
      candlestickData.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume
      });
      
      currentPrice = close;
    }

    // 生成技术指标数据
    const technicalIndicators = {
      sma: candlestickData.map((item, index) => {
        if (index < 19) return null;
        const sum = candlestickData.slice(index - 19, index + 1).reduce((acc, curr) => acc + curr.close, 0);
        return {
          date: item.date,
          value: parseFloat((sum / 20).toFixed(2))
        };
      }).filter(item => item !== null),
      
      ema: candlestickData.map((item, index) => {
        if (index === 0) return { date: item.date, value: item.close };
        const multiplier = 2 / (12 + 1);
        const prevEma = candlestickData[index - 1].close;
        const ema = (item.close - prevEma) * multiplier + prevEma;
        return {
          date: item.date,
          value: parseFloat(ema.toFixed(2))
        };
      }),
      
      volume: candlestickData.map(item => ({
        date: item.date,
        value: item.volume
      }))
    };

    return {
      symbol,
      period,
      candlestickData,
      technicalIndicators,
      summary: {
        currentPrice: currentPrice.toFixed(2),
        priceChange: (currentPrice - basePrice).toFixed(2),
        priceChangePercent: ((currentPrice - basePrice) / basePrice * 100).toFixed(2),
        high52Week: Math.max(...candlestickData.map(d => d.high)).toFixed(2),
        low52Week: Math.min(...candlestickData.map(d => d.low)).toFixed(2),
        avgVolume: Math.floor(candlestickData.reduce((sum, d) => sum + d.volume, 0) / candlestickData.length)
      },
      updatedAt: new Date().toISOString()
    };
  }

  async getStockHistory(symbol: string, params: { 
    start_date?: string; 
    end_date?: string; 
    interval?: string 
  } = {}): Promise<any[]> {
    // 模拟股票历史数据
    const { start_date, end_date, interval = '1d' } = params;
    const history = [];
    const basePrice = 150;
    let currentPrice = basePrice;
    const days = 30; // 默认30天历史数据

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const dailyChange = (Math.random() - 0.5) * 0.1;
      const open = currentPrice;
      const close = open * (1 + dailyChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.05);
      const low = Math.min(open, close) * (1 - Math.random() * 0.05);
      const volume = Math.floor(Math.random() * 2000000) + 500000;
      
      history.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume,
        symbol: symbol
      });
      
      currentPrice = close;
    }

    return history;
  }

  async getStockRealtime(symbols: string[]): Promise<any[]> {
    // 模拟股票实时数据
    return symbols.map(symbol => ({
      symbol,
      name: `${symbol}公司`,
      price: parseFloat((150 + (Math.random() - 0.5) * 20).toFixed(2)),
      change: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      volume: Math.floor(Math.random() * 2000000) + 500000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 500000000000,
      lastUpdate: new Date().toISOString()
    }));
  }
}
