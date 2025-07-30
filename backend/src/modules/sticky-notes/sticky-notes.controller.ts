import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StickyNotesService } from './sticky-notes.service';
import { CreateStickyNoteDto } from './dto/create-sticky-note.dto';
import { UpdateStickyNoteDto } from './dto/update-sticky-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// 请求DTO
class GetStickyNoteDto {
  noteId: string;
}

class DeleteStickyNoteDto {
  noteId: string;
}

class BringToFrontDto {
  noteId: string;
}

class SyncStateDto extends UpdateStickyNoteDto {
  noteId: string;
}

class SaveStickyNoteDto extends CreateStickyNoteDto {
  noteId: string;
}

class RestoreStickyNoteDto {
  noteId: string;
}

@ApiTags('便利贴管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sticky-notes')
export class StickyNotesController {
  constructor(private readonly stickyNotesService: StickyNotesService) {}

  @Post('create')
  @ApiOperation({ summary: '创建便利贴' })
  @ApiResponse({ status: 201, description: '便利贴创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Request() req, @Body() createStickyNoteDto: CreateStickyNoteDto) {
    return this.stickyNotesService.create(req.user.id, createStickyNoteDto);
  }

  @Post('list')
  @ApiOperation({ summary: '获取用户的所有便利贴' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Request() req) {
    return this.stickyNotesService.findAllByUser(req.user.id);
  }

  @Post('get')
  @ApiOperation({ summary: '根据ID获取便利贴' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Request() req, @Body() { noteId }: GetStickyNoteDto) {
    return this.stickyNotesService.findOne(req.user.id, noteId);
  }

  @Post('update')
  @ApiOperation({ summary: '更新便利贴' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async update(@Request() req, @Body() { noteId, ...updateData }: SyncStateDto) {
    return this.stickyNotesService.update(req.user.id, noteId, updateData);
  }

  @Post('delete')
  @ApiOperation({ summary: '软删除便利贴' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Request() req, @Body() { noteId }: DeleteStickyNoteDto) {
    await this.stickyNotesService.remove(req.user.id, noteId);
    return { message: '便利贴删除成功' };
  }

  @Post('bring-to-front')
  @ApiOperation({ summary: '将便利贴置顶' })
  @ApiResponse({ status: 200, description: '置顶成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async bringToFront(@Request() req, @Body() { noteId }: BringToFrontDto) {
    await this.stickyNotesService.bringToFront(req.user.id, noteId);
    return { message: '便利贴置顶成功' };
  }

  @Post('sync')
  @ApiOperation({ summary: '同步便利贴状态' })
  @ApiResponse({ status: 200, description: '同步成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async syncState(@Request() req, @Body() { noteId, ...syncData }: SyncStateDto) {
    return this.stickyNotesService.syncState(req.user.id, noteId, syncData);
  }

  @Post('save')
  @ApiOperation({ summary: '保存便利贴到数据库（创建或更新）' })
  @ApiResponse({ status: 200, description: '保存成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async save(@Request() req, @Body() { noteId, ...saveData }: SaveStickyNoteDto) {
    return this.stickyNotesService.saveOrUpdate(req.user.id, noteId, saveData);
  }

  @Post('restore')
  @ApiOperation({ summary: '恢复已删除的便利贴' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '便利贴不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async restore(@Request() req, @Body() { noteId }: RestoreStickyNoteDto) {
    return this.stickyNotesService.restore(req.user.id, noteId);
  }

  @Post('deleted')
  @ApiOperation({ summary: '获取已删除的便利贴列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getDeleted(@Request() req) {
    return this.stickyNotesService.findDeletedByUser(req.user.id);
  }
}