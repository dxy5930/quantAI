import { IsString, IsInt, IsEnum, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStickyNoteDto {
  @ApiProperty({ description: '便利贴唯一标识符', example: 'global-sticky-note' })
  @IsString()
  noteId: string;

  @ApiProperty({ description: '笔记标题', example: '我的便利贴', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '笔记内容，支持富文本HTML格式', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '便利贴X坐标位置', example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  positionX?: number;

  @ApiProperty({ description: '便利贴Y坐标位置', example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  positionY?: number;

  @ApiProperty({ description: '便利贴宽度', example: 400, required: false })
  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(2000)
  width?: number;

  @ApiProperty({ description: '便利贴高度', example: 300, required: false })
  @IsOptional()
  @IsInt()
  @Min(150)
  @Max(1500)
  height?: number;

  @ApiProperty({ 
    description: '便利贴颜色主题', 
    enum: ['yellow', 'pink', 'blue', 'green', 'orange'],
    example: 'yellow',
    required: false
  })
  @IsOptional()
  @IsEnum(['yellow', 'pink', 'blue', 'green', 'orange'])
  color?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';

  @ApiProperty({ description: '是否最小化', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMinimized?: boolean;

  @ApiProperty({ description: '层级索引', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  zIndex?: number;
}