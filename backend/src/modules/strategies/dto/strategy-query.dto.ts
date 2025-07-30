import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { STRATEGY_CONSTANTS } from "../../../shared/constants";

export class StrategyQueryDto {
  @ApiProperty({ description: "页码", default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: "每页数量", default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(STRATEGY_CONSTANTS.MAX_PAGE_SIZE)
  limit?: number = 10;

  @ApiProperty({ description: "策略分类", required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: "策略类型",
    enum: [STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION, STRATEGY_CONSTANTS.TYPES.BACKTEST],
    required: false,
  })
  @IsOptional()
  @IsEnum([STRATEGY_CONSTANTS.TYPES.STOCK_SELECTION, STRATEGY_CONSTANTS.TYPES.BACKTEST])
  strategyType?: "stock_selection" | "backtest";

  @ApiProperty({
    description: "难度等级",
    enum: [STRATEGY_CONSTANTS.DIFFICULTIES.EASY, STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM, STRATEGY_CONSTANTS.DIFFICULTIES.HARD],
    required: false,
  })
  @IsOptional()
  @IsEnum([STRATEGY_CONSTANTS.DIFFICULTIES.EASY, STRATEGY_CONSTANTS.DIFFICULTIES.MEDIUM, STRATEGY_CONSTANTS.DIFFICULTIES.HARD])
  difficulty?: "easy" | "medium" | "hard";

  @ApiProperty({ description: "是否公开", required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiProperty({ description: "搜索关键词", required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "排序字段",
    enum: STRATEGY_CONSTANTS.SORT_FIELDS,
    default: STRATEGY_CONSTANTS.DEFAULT_SORT_BY,
    required: false,
  })
  @IsOptional()
  @IsEnum(STRATEGY_CONSTANTS.SORT_FIELDS)
  sortBy?: string = STRATEGY_CONSTANTS.DEFAULT_SORT_BY;

  @ApiProperty({
    description: "排序方向",
    enum: STRATEGY_CONSTANTS.SORT_ORDERS,
    default: STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER,
    required: false,
  })
  @IsOptional()
  @IsEnum(STRATEGY_CONSTANTS.SORT_ORDERS)
  sortOrder?: "ASC" | "DESC" = STRATEGY_CONSTANTS.DEFAULT_SORT_ORDER;
}
