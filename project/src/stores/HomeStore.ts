import { makeAutoObservable, runInAction, observable } from 'mobx';
import { homeApi, AIMarketAnalysis, AIStockAnalysis, StrategyPerformanceData, MarketSentiment } from '../services/api';
import { HttpError } from '../utils/httpClient';
import { formatAnalysisText } from '../utils/analysisHelpers';

export class HomeStore {
  // 市场分析数据
  marketAnalysis: AIMarketAnalysis | null = null;
  marketAnalysisLoading: boolean = false;
  marketAnalysisError: string | null = null;

  // 股票分析数据
  stockAnalysis: AIStockAnalysis | null = null;
  stockAnalysisLoading: boolean = false;
  stockAnalysisError: string | null = null;

  // 策略收益数据
  topStrategies: StrategyPerformanceData[] = [];
  strategiesLoading: boolean = false;
  strategiesError: string | null = null;

  // 市场情绪数据
  marketSentiment: MarketSentiment | null = null;
  sentimentLoading: boolean = false;
  sentimentError: string | null = null;

  // 分析状态列表
  analysisStates: string[] = [
    "正在分析市场情绪...",
    "检测热点板块轮动...",
    "计算资金流向指标...",
    "生成投资建议...",
  ];
  currentAnalysisIndex: number = 0;

  constructor() {
    makeAutoObservable(this, {
      // 显式标记哪些属性是observable
      marketAnalysis: observable,
      stockAnalysis: observable,
      topStrategies: observable,
      marketSentiment: observable,
      analysisStates: observable,
    }, { autoBind: true });
  }

  /**
   * 加载市场分析数据
   */
  async loadMarketAnalysis() {
    runInAction(() => {
      this.marketAnalysisLoading = true;
      this.marketAnalysisError = null;
    });

    try {
      const response = await homeApi.getMarketAnalysis();
      runInAction(() => {
        this.marketAnalysis = response.data;
        this.marketAnalysisLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.marketAnalysisLoading = false;
        if (error instanceof HttpError) {
          this.marketAnalysisError = error.message;
        } else {
          this.marketAnalysisError = '加载市场分析失败';
        }
      });
      console.error('加载市场分析失败:', error);
    }
  }

  /**
   * 分析股票
   */
  async analyzeStock(symbol: string) {
    if (!symbol.trim()) return;

    runInAction(() => {
      this.stockAnalysisLoading = true;
      this.stockAnalysisError = null;
      this.stockAnalysis = null;
    });

    try {
      const response = await homeApi.analyzeStock(symbol);
      
      // 验证并安全地处理返回的数据
      if (response.success && response.data && typeof response.data === 'object') {
        const rawData = response.data as any;
        
        // 后端已经统一了字段格式，直接使用
        const safeData = observable.object({
          symbol: rawData.symbol || symbol,
          name: rawData.name || `股票${symbol}`,
          analysis: formatAnalysisText(rawData.analysis, 5000),
          rating: rawData.rating || 'C',
          technical_score: rawData.technical_score || 0,
          fundamental_score: rawData.fundamental_score || 0,
          recommendation: rawData.recommendation || 'hold',
          target_price: rawData.target_price || undefined,
          risk_level: rawData.risk_level || 'medium',
          key_points: Array.isArray(rawData.key_points) ? rawData.key_points : [],
          warnings: Array.isArray(rawData.warnings) ? rawData.warnings : [],
          generatedAt: rawData.generatedAt || new Date().toISOString(),
        } as AIStockAnalysis);
        
        runInAction(() => {
          this.stockAnalysis = safeData;
          this.stockAnalysisLoading = false;
        });
      } else {
        throw new Error('API返回的数据格式不正确');
      }
    } catch (error) {
      runInAction(() => {
        this.stockAnalysisLoading = false;
        if (error instanceof HttpError) {
          this.stockAnalysisError = error.message;
        } else {
          this.stockAnalysisError = 'AI分析失败，请稍后重试';
        }
      });
      console.error('股票分析失败:', error);
    }
  }

  /**
   * 加载顶级策略数据
   */
  async loadTopStrategies() {
    runInAction(() => {
      this.strategiesLoading = true;
      this.strategiesError = null;
    });

    try {
      const response = await homeApi.getTopStrategies(3);
      runInAction(() => {
        this.topStrategies = response.data;
        this.strategiesLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.strategiesLoading = false;
        if (error instanceof HttpError) {
          this.strategiesError = error.message;
        } else {
          this.strategiesError = '加载策略数据失败';
        }
      });
      console.error('加载策略数据失败:', error);
    }
  }

  /**
   * 加载市场情绪数据
   */
  async loadMarketSentiment() {
    runInAction(() => {
      this.sentimentLoading = true;
      this.sentimentError = null;
    });

    try {
      const response = await homeApi.getMarketSentiment();
      runInAction(() => {
        this.marketSentiment = response.data;
        this.sentimentLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.sentimentLoading = false;
        if (error instanceof HttpError) {
          this.sentimentError = error.message;
        } else {
          this.sentimentError = '加载市场情绪失败';
        }
      });
      console.error('加载市场情绪失败:', error);
    }
  }

  /**
   * 加载分析状态列表
   */
  async loadAnalysisStates() {
    try {
      const response = await homeApi.getAnalysisStates();
      runInAction(() => {
        if (response.data && response.data.length > 0) {
          this.analysisStates = response.data;
        }
      });
    } catch (error) {
      console.error('加载分析状态失败:', error);
      // 使用默认状态，不显示错误
    }
  }

  /**
   * 切换分析状态
   */
  nextAnalysisState() {
    runInAction(() => {
      this.currentAnalysisIndex = (this.currentAnalysisIndex + 1) % this.analysisStates.length;
    });
  }

  /**
   * 加载所有首页数据
   */
  async loadAllData() {
    await Promise.all([
      this.loadMarketAnalysis(),
      this.loadTopStrategies(),
      this.loadMarketSentiment(),
      this.loadAnalysisStates(),
    ]);
  }

  /**
   * 清理错误状态
   */
  clearErrors() {
    runInAction(() => {
      this.marketAnalysisError = null;
      this.stockAnalysisError = null;
      this.strategiesError = null;
      this.sentimentError = null;
    });
  }

  /**
   * 重置股票分析
   */
  resetStockAnalysis() {
    runInAction(() => {
      this.stockAnalysis = null;
      this.stockAnalysisError = null;
    });
  }

  // 计算属性
  get currentAnalysisState() {
    return this.analysisStates[this.currentAnalysisIndex] || "正在分析市场情绪...";
  }

  get hasMarketData() {
    return !!this.marketAnalysis && !!this.marketSentiment;
  }

  get isLoading() {
    return this.marketAnalysisLoading || this.strategiesLoading || this.sentimentLoading;
  }

  get hasError() {
    return !!(this.marketAnalysisError || this.strategiesError || this.sentimentError);
  }
}

export const homeStore = new HomeStore();