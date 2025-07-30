import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsUrl,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsEmail,
  ValidateIf,
} from "class-validator";
import { UserLevel } from "../../../shared/types";
import { USER_CONSTANTS } from "../../../shared/constants";

export class UpdateUserProfileDto {
  @ApiProperty({
    description: "显示名称",
    example: "量化交易专家",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(USER_CONSTANTS.DISPLAY_NAME_MAX_LENGTH)
  displayName?: string;

  @ApiProperty({
    description: "交易经验",
    enum: ["beginner", "intermediate", "advanced", "expert"],
    example: "intermediate",
    required: false,
  })
  @IsOptional()
  @IsEnum(["beginner", "intermediate", "advanced", "expert"])
  tradingExperience?: "beginner" | "intermediate" | "advanced" | "expert";

  @ApiProperty({
    description: "风险承受能力",
    enum: ["low", "medium", "high"],
    example: "medium",
    required: false,
  })
  @IsOptional()
  @IsEnum(["low", "medium", "high"])
  riskTolerance?: "low" | "medium" | "high";

  @ApiProperty({
    description: "头像URL或base64数据",
    example: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.avatar && !o.avatar.startsWith('data:image/'))
  @IsUrl()
  @MaxLength(USER_CONSTANTS.AVATAR_URL_MAX_LENGTH)
  avatar?: string;

  @ApiProperty({
    description: "邮箱地址",
    example: "user@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(USER_CONSTANTS.EMAIL_MAX_LENGTH)
  email?: string;

  @ApiProperty({
    description: "用户等级（仅管理员可修改）",
    enum: [UserLevel.NORMAL, UserLevel.PREMIUM, UserLevel.SUPER],
    example: UserLevel.NORMAL,
    required: false,
    enumName: 'UserLevel',
  })
  @IsOptional()
  @IsInt()
  @Min(UserLevel.NORMAL)
  @Max(UserLevel.SUPER)
  level?: UserLevel;
}
