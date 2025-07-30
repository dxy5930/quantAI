/**
 * 图表数据生成工具类
 * 用于为策略生成各种类型的图表数据
 */
export class ChartDataGenerator {
  
  /**
   * 生成回测策略的净值曲线数据
   */
  static generateEquityData(days: number = 252): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let strategyValue = 100; // 策略初始净值
    let benchmarkValue = 100; // 基准初始净值
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // 策略收益率 (年化8-15%)
      const strategyReturn = (Math.random() - 0.45) * 0.002 + 0.0003;
      // 基准收益率 (年化6-10%)
      const benchmarkReturn = (Math.random() - 0.45) * 0.0015 + 0.0002;
      
      strategyValue *= (1 + strategyReturn);
      benchmarkValue *= (1 + benchmarkReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          strategyEquity: Number(strategyValue.toFixed(4)),
          benchmarkEquity: Number(benchmarkValue.toFixed(4)),
          outperformance: Number(((strategyValue - benchmarkValue) / benchmarkValue * 100).toFixed(2))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成回测策略的回撤数据
   */
  static generateDrawdownData(days: number = 252): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let equity = 100;
    let maxEquity = 100;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // 随机收益率
      const dailyReturn = (Math.random() - 0.45) * 0.002 + 0.0003;
      equity *= (1 + dailyReturn);
      
      if (equity > maxEquity) {
        maxEquity = equity;
      }
      
      const drawdown = (equity - maxEquity) / maxEquity * 100;
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          drawdown: Number(drawdown.toFixed(2)),
          equity: Number(equity.toFixed(4)),
          maxEquity: Number(maxEquity.toFixed(4))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成回测策略的收益率分布数据
   */
  static generateReturnsData(days: number = 252): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dailyReturn = (Math.random() - 0.45) * 0.002 + 0.0003;
      const cumulativeReturn = Math.random() * 0.3 + 0.05; // 5%-35%
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          dailyReturn: Number((dailyReturn * 100).toFixed(3)),
          cumulativeReturn: Number((cumulativeReturn * 100).toFixed(2)),
          volatility: Number(((Math.random() * 0.15 + 0.05) * 100).toFixed(2))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成回测策略的绩效指标数据
   */
  static generatePerformanceData(months: number = 12): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          sharpeRatio: Number((Math.random() * 2 + 0.5).toFixed(2)),
          winRate: Number((Math.random() * 0.3 + 0.5).toFixed(2)),
          profitFactor: Number((Math.random() * 1.5 + 1).toFixed(2)),
          maxDrawdown: Number((Math.random() * 0.15 + 0.05).toFixed(3)),
          alpha: Number((Math.random() * 0.05).toFixed(3)),
          beta: Number((Math.random() * 0.4 + 0.8).toFixed(2))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成选股策略的股票表现数据
   */
  static generateStockPerformanceData(days: number = 252): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const stockPerformances = stocks.map(symbol => ({
        symbol,
        return: Number(((Math.random() - 0.4) * 0.05).toFixed(3)),
        score: Number((Math.random() * 40 + 60).toFixed(1))
      }));
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          stocks: stockPerformances,
          avgReturn: Number((stockPerformances.reduce((sum, s) => sum + s.return, 0) / stocks.length).toFixed(3)),
          avgScore: Number((stockPerformances.reduce((sum, s) => sum + s.score, 0) / stocks.length).toFixed(1))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成选股策略的行业分析数据
   */
  static generateSectorAnalysisData(): Array<{
    date: string;
    dataValue: any;
  }> {
    const sectors = [
      { name: '科技', weight: 35 },
      { name: '金融', weight: 20 },
      { name: '医疗', weight: 15 },
      { name: '消费', weight: 12 },
      { name: '工业', weight: 10 },
      { name: '能源', weight: 8 }
    ];
    
    const date = new Date().toISOString().split('T')[0];
    
    return [{
      date,
      dataValue: {
        sectors: sectors.map(sector => ({
          ...sector,
          return: Number(((Math.random() - 0.4) * 0.2).toFixed(2)),
          stockCount: Math.floor(Math.random() * 20 + 5)
        })),
        diversificationScore: Number((Math.random() * 0.3 + 0.7).toFixed(2))
      }
    }];
  }

  /**
   * 生成选股策略的风险指标数据
   */
  static generateRiskMetricsData(weeks: number = 52): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    
    for (let i = 0; i < weeks; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 7);
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          volatility: Number((Math.random() * 0.1 + 0.1).toFixed(3)),
          var95: Number((Math.random() * 0.05 + 0.02).toFixed(3)),
          beta: Number((Math.random() * 0.4 + 0.8).toFixed(2)),
          trackingError: Number((Math.random() * 0.03 + 0.01).toFixed(3)),
          informationRatio: Number((Math.random() * 1 + 0.2).toFixed(2))
        }
      });
    }
    
    return data;
  }

  /**
   * 生成选股策略的选股历史数据
   */
  static generateSelectionHistoryData(days: number = 252): Array<{
    date: string;
    dataValue: any;
  }> {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i += 7) { // 每周数据
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const selectedCount = Math.floor(Math.random() * 10 + 5);
      const successCount = Math.floor(selectedCount * (Math.random() * 0.4 + 0.5));
      
      data.push({
        date: date.toISOString().split('T')[0],
        dataValue: {
          selectedStocks: selectedCount,
          successfulPicks: successCount,
          successRate: Number((successCount / selectedCount).toFixed(2)),
          avgScore: Number((Math.random() * 30 + 70).toFixed(1)),
          portfolioValue: Number((10000 * (1 + Math.random() * 0.5)).toFixed(2))
        }
      });
    }
    
    return data;
  }

  /**
   * 为策略生成完整的图表数据
   */
  static generateChartDataForStrategy(
    strategyId: string,
    strategyType: 'backtest' | 'stock_selection',
    period: string = '1y'
  ): Array<{
    strategyId: string;
    chartType: string;
    period: string;
    dataDate: Date;
    dataValue: any;
  }> {
    const chartDataEntries = [];
    const days = period === '1y' ? 252 : period === '6m' ? 126 : period === '3m' ? 63 : 30;
    
    if (strategyType === 'backtest') {
      // 回测策略图表
      const chartTypes = [
        { type: 'equity', data: this.generateEquityData(days) },
        { type: 'drawdown', data: this.generateDrawdownData(days) },
        { type: 'returns', data: this.generateReturnsData(days) },
        { type: 'performance', data: this.generatePerformanceData(12) }
      ];

      for (const chart of chartTypes) {
        for (const item of chart.data) {
          chartDataEntries.push({
            strategyId,
            chartType: chart.type,
            period,
            dataDate: new Date(item.date),
            dataValue: item.dataValue
          });
        }
      }
    } else {
      // 选股策略图表
      const chartTypes = [
        { type: 'stock_performance', data: this.generateStockPerformanceData(days) },
        { type: 'sector_analysis', data: this.generateSectorAnalysisData() },
        { type: 'risk_metrics', data: this.generateRiskMetricsData(52) },
        { type: 'selection_history', data: this.generateSelectionHistoryData(days) }
      ];

      for (const chart of chartTypes) {
        for (const item of chart.data) {
          chartDataEntries.push({
            strategyId,
            chartType: chart.type,
            period,
            dataDate: new Date(item.date),
            dataValue: item.dataValue
          });
        }
      }
    }
    
    return chartDataEntries;
  }
} 