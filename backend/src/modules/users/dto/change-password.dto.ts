import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'oldPassword123',
  })
  @IsString({ message: '当前密码必须是字符串' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  currentPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
  })
  @IsString({ message: '新密码必须是字符串' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newPassword123',
  })
  @IsString({ message: '确认密码必须是字符串' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  confirmPassword: string;
}