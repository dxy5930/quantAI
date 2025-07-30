import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    description: "重置密码令牌",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString({ message: "令牌必须是字符串" })
  @IsNotEmpty({ message: "令牌不能为空" })
  token: string;

  @ApiProperty({
    description: "新密码",
    example: "newPassword123",
  })
  @IsString({ message: "密码必须是字符串" })
  @IsNotEmpty({ message: "密码不能为空" })
  @MinLength(8, { message: "密码长度至少8位" })
  password: string;

  @ApiProperty({
    description: "确认新密码",
    example: "newPassword123",
  })
  @IsString({ message: "确认密码必须是字符串" })
  @IsNotEmpty({ message: "确认密码不能为空" })
  @MinLength(8, { message: "确认密码长度至少8位" })
  confirmPassword: string;
} 