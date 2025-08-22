/**
 * 复盘模块AI服务
 * Review Module AI Service
 */

import { pythonApiClient } from '../../../services/pythonApiClient';
import { 
  StockPosition, 
  ReviewContext, 
  AIAnalysisResult,
  MarketData,
  MarketAnalysisResult,
  MarketSentimentIndicators
} from '../types';

export class ReviewAIService {
  private static instance: ReviewAIService | null = null;

  static getInstance(): ReviewAIService {
    if (!ReviewAIService.instance) {
      ReviewAIService.instance = new ReviewAIService();
    }
    return ReviewAIService.instance;
  }

  /**
   * 生成完整复盘内容
   */
  async generateFullReview(context: ReviewContext): Promise<AIAnalysisResult> {
    try {
      // 获取市场概况
      const marketSummary = await this.generateMarketSummaryForReview(context.date);
      
      let prompt = `请为${context.date}的股票交易复盘生成完整的分析内容，用markdown格式输出。

复盘基本信息：
- 日期：${context.date}
- 标题：${context.title}
${context.personalNotes ? `- 个人备注：${context.personalNotes}` : ''}

市场背景：
${marketSummary}

请基于以上市场背景，生成包含以下部分的复盘内容：

## 市场概况
结合上述市场背景，分析当日市场对个人交易的影响

## 持仓分析
### 盈利股票
- 分析盈利股票的表现原因
- 总结成功的投资逻辑

### 亏损股票  
- 分析亏损股票的失败原因
- 找出决策中的问题

## 交易决策回顾
### 买入决策
1. 回顾买入时机和理由
2. 评估买入价格的合理性

### 卖出决策
1. 分析卖出时机选择
2. 评估止盈止损执行情况

## 经验总结
### 做得好的地方
- 成功的投资策略和执行
- 风险控制措施

### 需要改进的地方
- 发现的问题和不足
- 具体改进方向

## 明日策略
- 基于今日复盘的明日操作计划
- 重点关注的股票和板块

## 风险提示
- 当前市场风险点
- 个人投资组合风险

请生成专业、详细、有指导意义的复盘内容。`;

      if (context.positions && context.positions.length > 0) {
        prompt += `\n\n持仓信息：\n`;
        context.positions.forEach(pos => {
          prompt += `- ${pos.name}(${pos.symbol}): 买入价${pos.buyPrice}元，数量${pos.quantity}股`;
          if (pos.sellPrice) {
            prompt += `，卖出价${pos.sellPrice}元`;
          }
          if (pos.profit !== undefined) {
            prompt += `，${pos.profit >= 0 ? '盈利' : '亏损'}${Math.abs(pos.profit)}元`;
          }
          prompt += '\n';
        });
      }

      const response = await pythonApiClient.sendChatMessage({
        message: prompt,
        conversationId: `review-full-${context.reviewId}-${Date.now()}`,
        context: {
          reviewType: 'full',
          date: context.date,
          positions: context.positions,
          hasMarketData: true
        }
      });

      if (response.success && response.data.message) {
        return {
          content: response.data.message,
          summary: this.extractSummary(response.data.message),
          confidence: 0.9
        };
      }

      throw new Error('AI分析失败');
    } catch (error) {
      console.error('完整复盘生成失败，使用基础版本:', error);
      return this.generateBasicFullReview(context);
    }
  }

  /**
   * 股票表现分析
   */
  async analyzeStockPerformance(positions: StockPosition[]): Promise<AIAnalysisResult> {
    if (!positions || positions.length === 0) {
      throw new Error('没有持仓数据');
    }

    const profitPositions = positions.filter(p => p.profit && p.profit > 0);
    const lossPositions = positions.filter(p => p.profit && p.profit < 0);

    const prompt = `请分析以下股票交易的表现，并给出专业的投资建议：

盈利股票（${profitPositions.length}只）：
${profitPositions.map(p => 
  `- ${p.name}(${p.symbol}): 买入价${p.buyPrice}元，卖出价${p.sellPrice}元，盈利${p.profit}元，收益率${p.profitRate?.toFixed(2)}%`
).join('\n')}

亏损股票（${lossPositions.length}只）：
${lossPositions.map(p => 
  `- ${p.name}(${p.symbol}): 买入价${p.buyPrice}元，卖出价${p.sellPrice || '持有中'}元，亏损${p.profit}元，收益率${p.profitRate?.toFixed(2)}%`
).join('\n')}

请分析：
1. 盈利股票的成功因素
2. 亏损股票的失败原因
3. 整体交易策略的优缺点
4. 风险控制建议
5. 未来投资改进方向

请用markdown格式输出，内容要专业且具有指导意义。`;

    const response = await pythonApiClient.sendChatMessage({
      message: prompt,
      conversationId: `stock-analysis-${Date.now()}`,
      context: {
        analysisType: 'stockPerformance',
        positionCount: positions.length,
        profitCount: profitPositions.length,
        lossCount: lossPositions.length
      }
    });

    if (response.success && response.data.message) {
      return {
        content: response.data.message,
        confidence: 0.9
      };
    }

    throw new Error('股票分析失败');
  }

  /**
   * 市场环境分析
   */
  async analyzeMarketCondition(date: string): Promise<AIAnalysisResult> {
    try {
      // 尝试获取市场数据
      const marketData = await this.getMarketData();
      
      let prompt = `请分析${date}的股票市场整体环境和概况，包括：

1. 主要指数表现（上证指数、深证成指、创业板指等）
2. 市场成交量和活跃度
3. 热点板块和概念股表现
4. 资金流向分析
5. 市场情绪和投资者行为
6. 重要政策或消息面影响
7. 技术面分析（支撑位、阻力位等）

请基于一般的市场分析框架，生成专业的市场概况分析，用markdown格式输出。`;

      if (marketData) {
        prompt += `\n\n参考市场数据：\n`;
        if (marketData.indices.length > 0) {
          prompt += `主要指数：\n`;
          marketData.indices.forEach(index => {
            prompt += `- ${index.name}: ${index.current} (${index.change >= 0 ? '+' : ''}${index.change}, ${index.changePercent >= 0 ? '+' : ''}${index.changePercent}%)\n`;
          });
        }
        
        if (marketData.hotSectors.length > 0) {
          prompt += `\n热点板块：${marketData.hotSectors.join('、')}\n`;
        }
        
        prompt += `\n市场情绪：${this.translateSentiment(marketData.sentiment)}\n`;
      }

      const response = await pythonApiClient.sendChatMessage({
        message: prompt,
        conversationId: `market-analysis-${date}-${Date.now()}`,
        context: {
          analysisType: 'marketCondition',
          date: date,
          marketData: marketData
        }
      });

      if (response.success && response.data.message) {
        return {
          content: response.data.message,
          confidence: 0.85
        };
      }

      throw new Error('市场分析失败');
    } catch (error) {
      console.error('市场数据分析失败，使用备用方案:', error);
      return this.generateBasicMarketAnalysis(date);
    }
  }

  /**
   * 生成字段内容
   */
  async generateFieldContent(params: {
    prompt: string;
    context: any;
    fieldType: string;
  }): Promise<{ content: string; confidence?: number }> {
    try {
      const response = await pythonApiClient.sendChatMessage({
        message: `基于以下信息生成字段内容：
提示词：${params.prompt}
字段类型：${params.fieldType}
上下文数据：${JSON.stringify(params.context, null, 2)}

请生成简洁且相关的内容。`,
        context: {
          type: 'field_generation',
          ...params.context
        }
      });
      
      return {
        content: response.content || response.message || '',
        confidence: 0.8
      };
    } catch (error) {
      console.error('AI字段生成失败:', error);
      throw new Error('字段内容生成失败');
    }
  }

  /**
   * 生成数据库建议
   */
  async generateDatabaseSuggestions(params: {
    database: any;
    analysisType: string;
  }): Promise<any[]> {
    try {
      const response = await pythonApiClient.sendChatMessage({
        message: `请分析以下数据库结构并提供优化建议：
数据库名称：${params.database.name}
字段数量：${params.database.fields?.length || 0}
记录数量：${params.database.records?.length || 0}
分析类型：${params.analysisType}

请提供结构化的建议列表，包括标题、描述和具体操作。`,
        context: {
          type: 'database_analysis',
          database: params.database
        }
      });
      
      // 解析AI返回的建议
      const suggestions = [];
      const content = response.content || response.message || '';
      
      // 这里可以添加更复杂的解析逻辑
      const lines = content.split('\n').filter((line:any) => line.trim());
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('建议') || line.includes('优化')) {
          suggestions.push({
            type: 'optimization',
            title: line,
            description: lines[i + 1] || '',
            confidence: 0.7,
            action: {
              type: 'suggestion',
              data: { suggestion: line }
            }
          });
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('生成数据库建议失败:', error);
      return [];
    }
  }
  async generateInvestmentSuggestions(context: ReviewContext): Promise<AIAnalysisResult> {
    let prompt = `基于以下交易复盘信息，请生成专业的投资改进建议：

复盘日期：${context.date}
${context.personalNotes ? `个人备注：${context.personalNotes}` : ''}
`;

    if (context.positions && context.positions.length > 0) {
      const totalProfit = context.positions.reduce((sum, p) => sum + (p.profit || 0), 0);
      const winRate = context.positions.filter(p => p.profit && p.profit > 0).length / context.positions.length;
      
      prompt += `
交易统计：
- 总盈亏：${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(2)}元
- 胜率：${(winRate * 100).toFixed(1)}%
- 交易次数：${context.positions.length}次
`;
    }

    prompt += `
请从以下维度提供改进建议：

## 投资策略优化
- 选股策略的改进方向
- 买卖时机的把握技巧
- 仓位管理建议

## 风险控制
- 止损策略的完善
- 风险分散的方法
- 心理控制建议

## 学习提升
- 需要加强的投资知识领域
- 推荐的学习资源
- 实践练习建议

## 下一步行动计划
- 明确的改进目标
- 具体的执行步骤
- 效果评估方法

请用markdown格式输出，建议要具体可执行。`;

    const response = await pythonApiClient.sendChatMessage({
      message: prompt,
      conversationId: `suggestions-${context.reviewId}-${Date.now()}`,
      context: {
        analysisType: 'suggestions',
        reviewContext: context
      }
    });

    if (response.success && response.data.message) {
      return {
        content: response.data.message,
        confidence: 0.85,
        suggestions: this.extractActionItems(response.data.message)
      };
    }

    throw new Error('建议生成失败');
  }

  /**
   * 获取市场数据
   */
  private async getMarketData(): Promise<MarketData | null> {
    try {
      const response = await pythonApiClient.getMarketData();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('获取市场数据失败:', error);
      return null;
    }
  }

  /**
   * 生成市场概况（用于复盘）
   */
  private async generateMarketSummaryForReview(date: string): Promise<string> {
    try {
      const analysis = await this.analyzeMarketCondition(date);
      
      const summaryPrompt = `基于以下市场分析，请生成一个适合用于交易复盘的简洁市场概况段落：

${analysis.content}

要求：
1. 控制在200-300字
2. 突出当日市场的关键特征
3. 包含对个人交易的参考价值
4. 用简洁专业的语言描述

请直接输出概况内容，不需要额外格式。`;

      const response = await pythonApiClient.sendChatMessage({
        message: summaryPrompt,
        conversationId: `market-summary-${date}-${Date.now()}`,
        context: {
          analysisType: 'marketSummary',
          date: date
        }
      });

      if (response.success && response.data.message) {
        return response.data.message;
      }

      return this.generateBasicMarketTemplate(date);
    } catch (error) {
      console.error('生成市场概况失败:', error);
      return this.generateBasicMarketTemplate(date);
    }
  }

  /**
   * 基础版本的完整复盘生成
   */
  private async generateBasicFullReview(context: ReviewContext): Promise<AIAnalysisResult> {
    const prompt = `请为${context.date}的股票交易复盘生成完整的分析内容，用markdown格式输出。

复盘基本信息：
- 日期：${context.date}
- 标题：${context.title}
${context.personalNotes ? `- 个人备注：${context.personalNotes}` : ''}

请包含以下部分：
## 市场概况
分析当日市场整体表现、主要指数走势、成交量变化、热点板块等

## 持仓分析
### 盈利股票
- 分析盈利股票的表现原因
- 总结成功的投资逻辑

### 亏损股票  
- 分析亏损股票的失败原因
- 找出决策中的问题

## 交易决策回顾
### 买入决策
1. 回顾买入时机和理由
2. 评估买入价格的合理性

### 卖出决策
1. 分析卖出时机选择
2. 评估止盈止损执行情况

## 经验总结
### 做得好的地方
- 成功的投资策略和执行
- 风险控制措施

### 需要改进的地方
- 发现的问题和不足
- 具体改进方向

## 明日策略
- 基于今日复盘的明日操作计划
- 重点关注的股票和板块

## 风险提示
- 当前市场风险点
- 个人投资组合风险

请生成专业、详细、有指导意义的复盘内容。`;

    const response = await pythonApiClient.sendChatMessage({
      message: prompt,
      conversationId: `review-full-basic-${context.reviewId}-${Date.now()}`,
      context: {
        reviewType: 'full',
        date: context.date,
        positions: context.positions
      }
    });

    if (response.success && response.data.message) {
      return {
        content: response.data.message,
        summary: this.extractSummary(response.data.message),
        confidence: 0.75
      };
    }

    throw new Error('AI分析失败');
  }

  /**
   * 基础市场分析
   */
  private async generateBasicMarketAnalysis(date: string): Promise<AIAnalysisResult> {
    const prompt = `请分析${date}的股票市场整体环境和概况，包括：

1. 主要指数表现（上证指数、深证成指、创业板指等）
2. 市场成交量和活跃度
3. 热点板块和概念股表现
4. 资金流向分析
5. 市场情绪和投资者行为
6. 重要政策或消息面影响
7. 技术面分析（支撑位、阻力位等）

请基于一般的市场分析框架，生成专业的市场概况分析，用markdown格式输出。
注意：请提供分析框架和思路，不要编造具体的数字数据。`;

    const response = await pythonApiClient.sendChatMessage({
      message: prompt,
      conversationId: `market-analysis-basic-${date}-${Date.now()}`,
      context: {
        analysisType: 'marketCondition',
        date: date
      }
    });

    if (response.success && response.data.message) {
      return {
        content: response.data.message,
        confidence: 0.7
      };
    }

    throw new Error('市场分析失败');
  }

  /**
   * 辅助方法
   */
  private extractSummary(content: string): string {
    const lines = content.split('\n').filter((line: string) => {
      return line.trim() && 
             !line.startsWith('#') && 
             !line.startsWith('-') && 
             !line.startsWith('*') &&
             line.length > 20;
    });
    
    if (lines.length > 0) {
      const summary = lines[0].substring(0, 150);
      return summary + (lines[0].length > 150 ? '...' : '');
    }
    
    return '';
  }

  private extractActionItems(content: string): string[] {
    const lines = content.split('\n');
    const actionItems: string[] = [];
    
    for (const line of lines) {
      if (/^\d+\.\s/.test(line.trim()) || /^-\s/.test(line.trim())) {
        const item = line.replace(/^\d+\.\s/, '').replace(/^-\s/, '').trim();
        if (item.length > 10) {
          actionItems.push(item);
        }
      }
    }
    
    return actionItems.slice(0, 5);
  }

  private translateSentiment(sentiment: string): string {
    switch (sentiment) {
      case 'bullish': return '乐观';
      case 'bearish': return '悲观';
      case 'neutral': return '中性';
      default: return '未知';
    }
  }

  private generateBasicMarketTemplate(date: string): string {
    return `${date}市场概况：

今日A股市场呈现震荡走势，主要指数涨跌不一。上证指数、深证成指和创业板指数表现分化，反映出市场结构性机会特征明显。

成交量方面维持相对稳定水平，显示投资者情绪较为谨慎。热点板块轮动较快，科技、消费、金融等板块表现各异。

整体而言，市场处于震荡整理阶段，投资者宜保持谨慎乐观的态度，关注个股基本面变化和政策导向。

*注：具体数据请参考实时行情*`;
  }
}

// 导出单例实例
export const reviewAIService = ReviewAIService.getInstance();