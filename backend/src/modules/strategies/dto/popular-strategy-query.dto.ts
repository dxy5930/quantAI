import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { STRATEGY_CONSTANTS } from "../../../shared/constants";

export class PopularStrategyQueryDto {
  @ApiProperty({ description: "返回数量限制", default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(STRATEGY_CONSTANTS.MAX_PAGE_SIZE)
  limit?: number = 10;

  @ApiProperty({
    description: "排序类型",
    enum: ["popularity", "likes", "usageCount", "rating"],
    default: "popularity",
    required: false,
  })
  @IsOptional()
  @IsEnum(["popularity", "likes", "usageCount", "rating"])
  type?: "popularity" | "likes" | "usageCount" | "rating" = "popularity";
} 