import { IsString, IsNumber, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStickyNoteDto {
  @ApiProperty({ description: '便利贴标题', example: '我的便利贴' })
  @IsString()
  title: string;

  @ApiProperty({ description: '便利贴内容（HTML格式）', example: '<p>这是便利贴内容</p>' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'X坐标位置', example: 100, required: false })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiProperty({ description: 'Y坐标位置', example: 100, required: false })
  @IsOptional()
  @IsNumber()
  positionY?: number;

  @ApiProperty({ description: '宽度', example: 400, required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ description: '高度', example: 300, required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: '颜色主题', enum: ['yellow', 'pink', 'blue', 'green', 'orange'], example: 'yellow' })
  @IsIn(['yellow', 'pink', 'blue', 'green', 'orange'])
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';

  @ApiProperty({ description: '是否最小化', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isMinimized?: boolean;

  @ApiProperty({ description: '层级索引', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  zIndex?: number;
}