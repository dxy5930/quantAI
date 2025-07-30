import { api, BacktestRequest, BacktestResult, PaginationParams, ListResponse } from './api';

// 回测服务类
class BacktestService {
  // 运行回测
  async runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    try {
      console.log('=== BacktestService.runBacktest ===');
      console.log('请求参数:', request);
      console.log('调用 api.backtest.runBacktest...');
      
      const response = await api.backtest.runBacktest(request);
      
      console.log('API响应:', response);
      
      if (response.success && response.data) {
        console.log('回测成功，返回数据:', response.data);
        return response.data;
      }
      
      console.error('回测失败 - API返回错误:', response.message);
      throw new Error(response.message || '回测失败');
    } catch (error: any) {
      console.error('=== BacktestService错误 ===');
      console.error('错误类型:', error.constructor?.name);
      console.error('错误信息:', error.message);
      console.error('完整错误:', error);
      throw error;
    }
  }

  // 获取回测历史
  async getBacktestHistory(params?: PaginationParams & {
    strategy_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ListResponse<BacktestResult>> {
    try {
      const response = await api.backtest.getBacktestHistory(params);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || '获取回测历史失败');
    } catch (error: any) {
      console.error('Get backtest history error:', error);
      throw error;
    }
  }

  // 获取回测结果
  async getBacktestResult(id: string): Promise<BacktestResult> {
    try {
      const response = await api.backtest.getBacktestResult(id);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || '获取回测结果失败');
    } catch (error: any) {
      console.error('Get backtest result error:', error);
      throw error;
    }
  }

  // 删除回测结果
  async deleteBacktestResult(id: string): Promise<void> {
    try {
      const response = await api.backtest.deleteBacktestResult(id);
      
      if (!response.success) {
        throw new Error(response.message || '删除回测结果失败');
      }
    } catch (error: any) {
      console.error('Delete backtest result error:', error);
      throw error;
    }
  }

  // 导出回测结果
  async exportBacktestResult(id: string, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    try {
      await api.backtest.exportBacktestResult(id, format);
    } catch (error: any) {
      console.error('Export backtest result error:', error);
      throw error;
    }
  }

  // 批量删除回测结果
  async batchDeleteBacktestResults(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteBacktestResult(id));
      await Promise.all(promises);
    } catch (error: any) {
      console.error('Batch delete backtest results error:', error);
      throw error;
    }
  }

  // 获取回测统计信息
  async getBacktestStats(strategyId?: string): Promise<any> {
    try {
      const params = strategyId ? { strategy_id: strategyId } : undefined;
      const response = await api.backtest.getBacktestHistory(params);
      
      if (response.success && response.data) {
        const results = response.data.data;
        
        // 计算统计信息
        const stats = this.calculateStats(results);
        return stats;
      }
      
      throw new Error(response.message || '获取回测统计失败');
    } catch (error: any) {
      console.error('Get backtest stats error:', error);
      throw error;
    }
  }

  // 计算回测统计信息
  private calculateStats(results: BacktestResult[]): any {
    if (results.length === 0) {
      return {
        total_count: 0,
        avg_total_return: 0,
        avg_annual_return: 0,
        avg_max_drawdown: 0,
        avg_sharpe_ratio: 0,
        avg_win_rate: 0,
        best_performance: null,
        worst_performance: null,
      };
    }

    const performances = results.map(r => r.performance);
    
    const totalCount = results.length;
    const avgTotalReturn = performances.reduce((sum, p) => sum + p.total_return, 0) / totalCount;
    const avgAnnualReturn = performances.reduce((sum, p) => sum + p.annual_return, 0) / totalCount;
    const avgMaxDrawdown = performances.reduce((sum, p) => sum + p.max_drawdown, 0) / totalCount;
    const avgSharpeRatio = performances.reduce((sum, p) => sum + p.sharpe_ratio, 0) / totalCount;
    const avgWinRate = performances.reduce((sum, p) => sum + p.win_rate, 0) / totalCount;

    // 找出最佳和最差表现
    const bestPerformance = performances.reduce((best, current) => 
      current.total_return > best.total_return ? current : best
    );
    
    const worstPerformance = performances.reduce((worst, current) => 
      current.total_return < worst.total_return ? current : worst
    );

    return {
      total_count: totalCount,
      avg_total_return: avgTotalReturn,
      avg_annual_return: avgAnnualReturn,
      avg_max_drawdown: avgMaxDrawdown,
      avg_sharpe_ratio: avgSharpeRatio,
      avg_win_rate: avgWinRate,
      best_performance: bestPerformance,
      worst_performance: worstPerformance,
    };
  }

  // 比较多个回测结果
  async compareBacktestResults(ids: string[]): Promise<BacktestResult[]> {
    try {
      const promises = ids.map(id => this.getBacktestResult(id));
      const results = await Promise.all(promises);
      return results;
    } catch (error: any) {
      console.error('Compare backtest results error:', error);
      throw error;
    }
  }

  // 获取回测结果摘要
  async getBacktestSummary(id: string): Promise<any> {
    try {
      const result = await this.getBacktestResult(id);
      
      return {
        id: result.id,
        strategy_id: result.strategy_id,
        created_at: result.created_at,
        performance: result.performance,
        total_trades: result.trades.length,
        winning_trades: result.trades.filter(t => t.pnl > 0).length,
        losing_trades: result.trades.filter(t => t.pnl < 0).length,
        largest_win: Math.max(...result.trades.map(t => t.pnl)),
        largest_loss: Math.min(...result.trades.map(t => t.pnl)),
        total_pnl: result.trades.reduce((sum, t) => sum + t.pnl, 0),
      };
    } catch (error: any) {
      console.error('Get backtest summary error:', error);
      throw error;
    }
  }

  // 获取回测结果的权益曲线数据
  async getEquityCurveData(id: string): Promise<any[]> {
    try {
      const result = await this.getBacktestResult(id);
      return result.equity_curve;
    } catch (error: any) {
      console.error('Get equity curve data error:', error);
      throw error;
    }
  }

  // 获取回测结果的交易记录
  async getTradeHistory(id: string, params?: {
    symbol?: string;
    side?: 'buy' | 'sell';
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    try {
      const result = await this.getBacktestResult(id);
      let trades = result.trades;

      // 应用过滤器
      if (params?.symbol) {
        trades = trades.filter(t => t.symbol === params.symbol);
      }
      if (params?.side) {
        trades = trades.filter(t => t.side === params.side);
      }
      if (params?.start_date) {
        trades = trades.filter(t => t.timestamp >= params.start_date!);
      }
      if (params?.end_date) {
        trades = trades.filter(t => t.timestamp <= params.end_date!);
      }

      return trades;
    } catch (error: any) {
      console.error('Get trade history error:', error);
      throw error;
    }
  }
}

// 创建回测服务实例
export const backtestService = new BacktestService();

// 默认导出
export default backtestService;