import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('首页')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('data')
  @ApiOperation({ summary: '获取首页综合数据' })
  async getHomePageData() {
    return this.homeService.getHomePageData();
  }

  @Get('market-analysis')
  @ApiOperation({ summary: '获取AI市场分析' })
  async getMarketAnalysis() {
    return this.homeService.getMarketAnalysis();
  }

  @Post('analyze-stock')
  @ApiOperation({ summary: 'AI股票分析' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: '股票代码' }
      },
      required: ['symbol']
    }
  })
  async analyzeStock(@Body() body: { symbol: string }) {
    return this.homeService.analyzeStock(body.symbol);
  }

  @Get('top-strategies')
  @ApiOperation({ summary: '获取策略收益排行' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量限制' })
  async getTopStrategies(@Query('limit') limitParam?: string) {
    const limit = limitParam ? parseInt(limitParam, 10) : 3;
    return this.homeService.getTopStrategies(limit);
  }

  @Get('market-sentiment')
  @ApiOperation({ summary: '获取市场情绪指数' })
  async getMarketSentiment() {
    return this.homeService.getMarketSentiment();
  }

  @Get('analysis-states')
  @ApiOperation({ summary: '获取实时分析状态列表' })
  async getAnalysisStates() {
    return this.homeService.getAnalysisStates();
  }
}