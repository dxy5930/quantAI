import { Controller, Post, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIWorkflowService } from './ai-workflow.service';
import { Request } from 'express';

// 定义返回类型接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
  result?: any;
  startTime?: string;
  endTime?: string;
}

interface WorkflowResponse {
  workflowId: string;
  status: string;
  message: string;
  agents?: AgentStatus[];
  results?: Record<string, any>;
}

@Controller('ai-workflow')
export class AIWorkflowController {
  constructor(
    private readonly aiWorkflowService: AIWorkflowService
  ) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startWorkflow(@Body() body: any, @Req() req: Request): Promise<ApiResponse<WorkflowResponse>> {
    const { query, context } = body;
    const userId = req.user?.['id'];
    
    return this.aiWorkflowService.startWorkflow({
      query,
      userId,
      context
    });
  }

  @Get('status/:workflowId')
  async getWorkflowStatus(@Param('workflowId') workflowId: string): Promise<ApiResponse<WorkflowResponse>> {
    return this.aiWorkflowService.getWorkflowStatus(workflowId);
  }

  @Post('stop/:workflowId')
  async stopWorkflow(@Param('workflowId') workflowId: string): Promise<ApiResponse<{ message: string }>> {
    return this.aiWorkflowService.stopWorkflow(workflowId);
  }

  @Get('results/:workflowId')
  async getWorkflowResults(@Param('workflowId') workflowId: string): Promise<ApiResponse<any>> {
    return this.aiWorkflowService.getWorkflowResults(workflowId);
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async sendChatMessage(@Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const { message, conversationId, context } = body;
    const userId = req.user?.['id'];
    
    return this.aiWorkflowService.sendChatMessage({
      message,
      conversationId,
      userId,
      context
    });
  }

  @Get('chat/history/:conversationId')
  @UseGuards(JwtAuthGuard)
  async getChatHistory(@Param('conversationId') conversationId: string): Promise<ApiResponse<any[]>> {
    return this.aiWorkflowService.getChatHistory(conversationId);
  }

  @Get('agents')
  async getAgents(): Promise<ApiResponse<AgentStatus[]>> {
    try {
      console.log('AI工作流控制器: 获取智能体配置');
      const result = await this.aiWorkflowService.getAgents();
      console.log('AI工作流控制器: 返回结果', result);
      return result;
    } catch (error) {
      console.error('AI工作流控制器: 获取智能体配置失败', error);
      throw error;
    }
  }

  @Get('test')
  async test(): Promise<{ success: boolean; message: string; timestamp: string }> {
    return {
      success: true,
      message: 'AI工作流API正常工作',
      timestamp: new Date().toISOString()
    };
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  async getWorkflowHistory(@Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const userId = req.user?.['id'];
    const { status, workflowType, startDate, endDate } = body;
    
    return this.aiWorkflowService.getWorkflowHistory(userId, {
      status,
      workflowType,
      startDate,
      endDate
    });
  }

  @Post('analyze/stock')
  async analyzeStock(@Body() body: any): Promise<ApiResponse<any>> {
    const { symbol } = body;
    return this.aiWorkflowService.analyzeStock(symbol);
  }

  @Post('generate/strategy')
  @UseGuards(JwtAuthGuard)
  async generateStrategy(@Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const userId = req.user?.['id'];
    return this.aiWorkflowService.generateStrategy({ ...body, userId });
  }

  @Get('insights')
  async getMarketInsights(): Promise<ApiResponse<any>> {
    return this.aiWorkflowService.getMarketInsights();
  }

  // 新增工作流画布相关接口
  @Post('workflow/create')
  @UseGuards(JwtAuthGuard)
  async createWorkflow(@Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const { workflow } = body;
    const userId = req.user?.['id'];
    
    return this.aiWorkflowService.createWorkflowDefinition({
      workflow,
      userId
    });
  }

  @Put('workflow/:workflowId')
  @UseGuards(JwtAuthGuard)
  async updateWorkflow(@Param('workflowId') workflowId: string, @Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const { workflow } = body;
    const userId = req.user?.['id'];
    
    return this.aiWorkflowService.updateWorkflowDefinition({
      workflowId,
      workflow,
      userId
    });
  }

  @Post('workflow/run')
  @UseGuards(JwtAuthGuard)
  async runWorkflow(@Body() body: any, @Req() req: Request): Promise<ApiResponse<any>> {
    const { workflowDefinition } = body;
    const userId = req.user?.['id'];
    
    return this.aiWorkflowService.runWorkflowDefinition({
      workflowDefinition,
      userId,
      context: body.context
    });
  }

  @Get('workflow/:workflowId')
  @UseGuards(JwtAuthGuard)
  async getWorkflow(@Param('workflowId') workflowId: string): Promise<ApiResponse<any>> {
    return this.aiWorkflowService.getWorkflowDefinition(workflowId);
  }

  @Get('workflow/templates/list')
  async getWorkflowTemplates(): Promise<ApiResponse<any>> {
    return this.aiWorkflowService.getWorkflowTemplates();
  }

  @Post('workflow/validate')
  async validateWorkflow(@Body() body: any): Promise<ApiResponse<any>> {
    const { workflow } = body;
    return this.aiWorkflowService.validateWorkflowDefinition(workflow);
  }

  @Get('execution/status/:executionId')
  async getWorkflowExecutionStatus(@Param('executionId') executionId: string): Promise<ApiResponse<any>> {
    return this.aiWorkflowService.getWorkflowExecutionStatus(executionId);
  }
}