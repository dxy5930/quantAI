import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";
import { USER_CONSTANTS } from "../../../shared/constants";

export class RegisterDto {
  @ApiProperty({
    description: "用户名",
    example: "newuser",
    minLength: 3,
    maxLength: USER_CONSTANTS.USERNAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(USER_CONSTANTS.USERNAME_MAX_LENGTH)
  username: string;

  @ApiProperty({
    description: "邮箱地址",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "密码",
    example: "password123",
    minLength: USER_CONSTANTS.PASSWORD_MIN_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.PASSWORD_MIN_LENGTH, { 
    message: "密码长度至少8位" 
  })
  password: string;

  @ApiProperty({
    description: "确认密码",
    example: "password123",
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
