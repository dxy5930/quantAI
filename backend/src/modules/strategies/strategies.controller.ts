import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

import { StrategiesService } from "./strategies.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { StrategyQueryDto, CreateStrategyDto, UpdateStrategyDto } from './dto';
import { PopularStrategyQueryDto } from './dto/popular-strategy-query.dto';

@ApiTags("strategies")
@Controller("strategies")
export class StrategiesController {
  constructor(private strategiesService: StrategiesService) {}

  @Post("list")
  @ApiOperation({ summary: "获取策略列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async findAll(@Body() query: StrategyQueryDto) {
    const result = await this.strategiesService.findAll(query);
    return {
      success: true,
      data: result,
      message: '获取策略列表成功'
    };
  }

  @Post("popular")
  @ApiOperation({ summary: "获取热门策略" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPopular(@Body() query: PopularStrategyQueryDto) {
    const result = await this.strategiesService.getPopularStrategies(query);
    return {
      success: true,
      data: result,
      message: '获取热门策略成功'
    };
  }

  @Post("recent")
  @ApiOperation({ summary: "获取最新策略" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRecent(@Body() body: { limit?: number }) {
    const limit = body.limit || 10;
    const result = await this.strategiesService.getRecentStrategies(limit);
    return {
      success: true,
      data: result,
      message: '获取最新策略成功'
    };
  }

  @Post("ranking")
  @ApiOperation({ summary: "获取策略排行榜" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRanking(@Body() body: { limit?: number; sortBy?: string }) {
    const limit = body.limit || 10;
    const sortBy = body.sortBy || 'popularity';
    const data = await this.strategiesService.getStrategyRanking(limit, sortBy);
    return {
      success: true,
      data,
    };
  }

  @Post("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取我的策略" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMyStrategies(@Request() req, @Body() query: StrategyQueryDto) {
    return this.strategiesService.findByUser(req.user.id, query);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "创建新策略" })
  @ApiResponse({ status: 201, description: "创建成功" })
  async createStrategy(@Request() req, @Body() createStrategyDto: CreateStrategyDto) {
    const result = await this.strategiesService.createStrategy(req.user.id, createStrategyDto);
    return {
      success: true,
      data: result,
      message: "策略创建成功"
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "创建策略（兼容旧接口）" })
  @ApiResponse({ status: 201, description: "创建成功" })
  async create(@Request() req, @Body() createStrategyDto: CreateStrategyDto) {
    const result = await this.strategiesService.createStrategy(req.user.id, createStrategyDto);
    return {
      success: true,
      data: { id: result.id },
      message: "策略创建成功"
    };
  }

  @Post('meta')
  @ApiOperation({ summary: '获取策略类型和分类元数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMeta() {
    return this.strategiesService.getMeta();
  }

  @Post('statistics')
  @ApiOperation({ summary: '获取策略广场统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics() {
    const data = await this.strategiesService.getStatistics();
    return {
      success: true,
      data,
    };
  }

  @Post(":id")
  @ApiOperation({ summary: "获取策略详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "策略不存在" })
  async findOne(@Param("id") id: string) {
    return this.strategiesService.findOne(id);
  }

  @Post(":id/detail")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "获取策略完整详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "策略不存在" })
  async getStrategyDetail(@Param("id") id: string, @Request() req, @Body() body?: { includeUserEngagement?: boolean }) {
    // 使用可选JWT认证守卫，req.user在用户已登录时会被设置，未登录时为null
    const userId = req.user?.id;
    
    const result = await this.strategiesService.getStrategyDetail(id, userId);
    return {
      success: true,
      data: result,
      message: '获取策略详情成功'
    };
  }

  @Post(":id/charts")
  @ApiOperation({ summary: "获取策略图表数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "策略不存在" })
  async getStrategyCharts(@Param("id") id: string, @Body() data: { period?: string } = {}) {
    const period = data.period || '1y';
    const result = await this.strategiesService.getStrategyCharts(id, period);
    return {
      success: true,
      data: result,
      message: '获取策略图表数据成功'
    };
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新策略" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "策略不存在" })
  async update(
    @Param("id") id: string,
    @Request() req,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ) {
    return this.strategiesService.update(id, req.user.id, updateStrategyDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除策略" })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "策略不存在" })
  async remove(@Param("id") id: string, @Request() req) {
    await this.strategiesService.remove(id, req.user.id);
    return { message: "策略删除成功" };
  }

  @Post(":id/share")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "分享策略" })
  @ApiResponse({ status: 200, description: "分享成功" })
  async share(@Param("id") id: string, @Request() req) {
    return this.strategiesService.shareStrategy(id, req.user.id);
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "切换点赞状态" })
  @ApiResponse({ status: 200, description: "操作成功" })
  async like(@Param("id") id: string, @Request() req) {
    const result = await this.strategiesService.likeStrategy(id, req.user.id);
    return {
      success: true,
      data: result,
      message: result ? '点赞成功' : '取消点赞成功'
    };
  }

  @Post(":id/favorite")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "切换收藏状态" })
  @ApiResponse({ status: 200, description: "操作成功" })
  async favorite(@Param("id") id: string, @Request() req) {
    const result = await this.strategiesService.favoriteStrategy(id, req.user.id);
    return {
      success: true,
      data: result,
      message: result ? '收藏成功' : '取消收藏成功'
    };
  }

  @Post("my/favorites")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取我的收藏策略" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMyFavorites(@Body() query: StrategyQueryDto, @Request() req) {
    return this.strategiesService.getUserFavorites(req.user.id, query);
  }

  @Post("my/all-strategies")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取我的所有相关策略（包括创建、点赞、收藏的）" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMyAllStrategies(@Body() query: StrategyQueryDto, @Request() req) {
    const result = await this.strategiesService.getUserMyStrategies(req.user.id, query);
    return {
      success: true,
      data: result,
      message: '获取我的策略成功'
    };
  }

  // 新增API端点

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "保存策略配置" })
  @ApiResponse({ status: 200, description: "保存成功" })
  async saveStrategy(
    @Param("id") id: string,
    @Request() req,
    @Body() configData: any
  ) {
    const result = await this.strategiesService.saveStrategyConfig(
      id,
      req.user.id,
      configData
    );
    return {
      success: true,
      data: result,
      message: "策略配置保存成功"
    };
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "发布策略到广场" })
  @ApiResponse({ status: 200, description: "发布成功" })
  async publishStrategy(@Param("id") id: string, @Request() req) {
    const result = await this.strategiesService.publishStrategy(id, req.user.id);
    return {
      success: true,
      data: result,
      message: "策略发布成功"
    };
  }

  @Post(":id/generate-share-link")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "生成策略分享链接" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async generateShareLink(@Param("id") id: string, @Request() req) {
    const result = await this.strategiesService.generateShareLink(id, req.user.id);
    return {
      success: true,
      data: result,
      message: "分享链接生成成功"
    };
  }

  @Post("ai/extract-keywords")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "AI提取投资关键词" })
  @ApiResponse({ status: 200, description: "提取成功" })
  async extractKeywords(
    @Body() body: { input: string },
    @Request() req
  ) {
    const result = await this.strategiesService.extractKeywords(body.input);
    return {
      success: true,
      data: result,
      message: "关键词提取成功"
    };
  }

  @Post("ai/recommend-stocks")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "AI推荐股票" })
  @ApiResponse({ status: 200, description: "推荐成功" })
  async recommendStocks(
    @Body() body: { keywords: Array<{ text: string; confidence: number }> },
    @Request() req
  ) {
    const result = await this.strategiesService.recommendStocks(body.keywords);
    return {
      success: true,
      data: result,
      message: "股票推荐生成成功"
    };
  }

  @Post("ai/analyze-strategy")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "AI分析策略描述并推荐股票" })
  @ApiResponse({ status: 200, description: "分析成功" })
  async analyzeStrategy(
    @Body() body: { input: string; strategyId?: string },
    @Request() req
  ) {
    const result = await this.strategiesService.analyzeStrategy(body.input, body.strategyId);
    return {
      success: true,
      data: result,
      message: "策略分析完成"
    };
  }

  @Post("ai/analyze-portfolio")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "AI分析股票组合" })
  @ApiResponse({ status: 200, description: "分析成功" })
  async analyzePortfolio(
    @Body() body: { stocks: string[] },
    @Request() req
  ) {
    const result = await this.strategiesService.analyzePortfolio(body.stocks);
    return {
      success: true,
      data: result,
      message: "组合分析完成"
    };
  }

  @Post(":id/config")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取策略配置数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStrategyConfig(@Param("id") id: string, @Request() req) {
    const result = await this.strategiesService.getStrategyConfig(id, req.user.id);
    return {
      success: true,
      data: result,
      message: "获取策略配置成功"
    };
  }

  @Post(":id/copy")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "复制策略" })
  @ApiResponse({ status: 201, description: "复制成功" })
  async copyStrategy(
    @Param("id") id: string,
    @Request() req,
    @Body() body?: { 
      name?: string; 
      description?: string; 
      category?: string; 
    }
  ) {
    const result = await this.strategiesService.copyStrategy(id, req.user.id, body);
    return {
      success: true,
      data: { id: result.id, name: result.name },
      message: "策略复制成功"
    };
  }
}
