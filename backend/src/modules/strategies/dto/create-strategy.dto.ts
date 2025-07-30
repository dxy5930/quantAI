import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { STRATEGY_CONSTANTS } from "../../../shared/constants";

class ParameterDto {
  @ApiProperty({ description: "参数键" })
  @IsString()
  key: string;

  @ApiProperty({ description: "参数标签" })
  @IsString()
  label: string;

  @ApiProperty({
    description: "参数类型",
    enum: ["number", "select", "boolean"],
  })
  @IsEnum(["number", "select", "boolean"])
  type: "number" | "select" | "boolean";

  @ApiProperty({ description: "默认值" })
  default: any;

  @ApiProperty({ description: "最小值", required: false })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiProperty({ description: "最大值", required: false })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiProperty({ description: "步长", required: false })
  @IsOptional()
  @IsNumber()
  step?: number;

  @ApiProperty({ description: "选项列表", required: false })
  @IsOptional()
  @IsArray()
  options?: { label: string; value: any }[];
}

export class CreateStrategyDto {
  @ApiProperty({ description: "策略名称" })
  @IsString()
  name: string;

  @ApiProperty({ description: "策略描述" })
  @IsString()
  description: string;

  @ApiProperty({ description: "策略图标", required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: "策略分类" })
  @IsString()
  category: string;

  @ApiProperty({
    description: "策略类型",
    enum: [STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION, STRATEGY_CONSTANTS.TYPES.BACKTEST],
  })
  @IsEnum([STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION, STRATEGY_CONSTANTS.TYPES.BACKTEST])
  strategyType: "stock_selection" | "backtest";

  @ApiProperty({ description: "难度等级", enum: [STRATEGY_CONSTANTS.DIFFICULTIES.EASY, STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM, STRATEGY_CONSTANTS.DIFFICULTIES.HARD], required: false })
  @IsOptional()
  @IsEnum([STRATEGY_CONSTANTS.DIFFICULTIES.EASY, STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM, STRATEGY_CONSTANTS.DIFFICULTIES.HARD])
  difficulty?: "easy" | "medium" | "hard";

  @ApiProperty({ description: "策略参数", type: [ParameterDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterDto)
  parameters?: ParameterDto[];

  @ApiProperty({ description: "标签", required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: "是否公开", default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  // ================== 选股策略专用字段 ==================

  @ApiProperty({ description: "原始查询语句", required: false })
  @IsOptional()
  @IsString()
  originalQuery?: string;

  @ApiProperty({ description: "提取的关键词", required: false })
  @IsOptional()
  @IsArray()
  keywords?: any[];

  @ApiProperty({ description: "选中的股票列表", required: false })
  @IsOptional()
  @IsArray()
  selectedStocks?: any[];

  @ApiProperty({ description: "股票推荐结果", required: false })
  @IsOptional()
  @IsArray()
  stockRecommendations?: any[];

  // ================== 回测策略专用字段 ==================

  @ApiProperty({ description: "回测结果数据", required: false })
  @IsOptional()
  @IsObject()
  backtestResults?: any;

  @ApiProperty({ description: "回测时间区间设置", required: false })
  @IsOptional()
  @IsObject()
  backtestPeriod?: any;

  @ApiProperty({ description: "回测股票集数据", required: false })
  @IsOptional()
  @IsArray()
  backtestStocks?: any[];

  @ApiProperty({ description: "股票仓位配置（用于创建时）", required: false })
  @IsOptional()
  @IsArray()
  positions?: any[];

  @ApiProperty({ description: "默认交易规则配置", required: false })
  @IsOptional()
  @IsObject()
  defaultTradingRules?: any;
}
