import { Controller, Get, Post, Put, Delete, Body, Request, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StickyNotesService } from './sticky-notes.service';
import { CreateStickyNoteDto } from './dto/create-sticky-note.dto';
import { UpdateStickyNoteDto } from './dto/update-sticky-note.dto';

@ApiTags('便利贴管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sticky-notes')
export class StickyNotesController {
  constructor(private readonly stickyNotesService: StickyNotesService) {}

  @Post()
  @ApiOperation({ summary: '创建便利贴' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Request() req, @Body() createStickyNoteDto: CreateStickyNoteDto) {
    return this.stickyNotesService.create(req.user.id, createStickyNoteDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户所有便利贴' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Request() req) {
    return this.stickyNotesService.findAll(req.user.id);
  }

  @Put(':noteId')
  @ApiOperation({ summary: '更新便利贴' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  async update(@Request() req, @Param('noteId') noteId: string, @Body() updateStickyNoteDto: UpdateStickyNoteDto) {
    return this.stickyNotesService.update(req.user.id, noteId, updateStickyNoteDto);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: '删除便利贴' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  async remove(@Request() req, @Param('noteId') noteId: string) {
    return this.stickyNotesService.remove(req.user.id, noteId);
  }
}