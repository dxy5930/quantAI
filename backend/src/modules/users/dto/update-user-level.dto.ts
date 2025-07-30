import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, Max, IsNotEmpty } from "class-validator";
import { UserLevel } from "../../../shared/types";

/**
 * 更新用户等级DTO
 * 用于管理员更新用户的等级权限
 */
export class UpdateUserLevelDto {
  @ApiProperty({
    description: "用户等级",
    enum: [UserLevel.NORMAL, UserLevel.PREMIUM, UserLevel.SUPER],
    example: UserLevel.PREMIUM,
    enumName: 'UserLevel',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(UserLevel.NORMAL)
  @Max(UserLevel.SUPER)
  level: UserLevel;
}

/**
 * 批量更新用户等级DTO
 * 用于管理员批量更新多个用户的等级
 */
export class BatchUpdateUserLevelDto {
  @ApiProperty({
    description: "用户ID列表",
    example: ["uuid1", "uuid2", "uuid3"],
    type: [String],
  })
  @IsNotEmpty()
  userIds: string[];

  @ApiProperty({
    description: "目标用户等级",
    enum: [UserLevel.NORMAL, UserLevel.PREMIUM, UserLevel.SUPER],
    example: UserLevel.PREMIUM,
    enumName: 'UserLevel',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(UserLevel.NORMAL)
  @Max(UserLevel.SUPER)
  level: UserLevel;
} 