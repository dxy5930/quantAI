import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StickyNote } from './entities/sticky-note.entity';
import { CreateStickyNoteDto } from './dto/create-sticky-note.dto';
import { UpdateStickyNoteDto } from './dto/update-sticky-note.dto';

@Injectable()
export class StickyNotesService {
  constructor(
    @InjectRepository(StickyNote)
    private readonly stickyNoteRepository: Repository<StickyNote>,
  ) {}

  /**
   * 创建便利贴
   */
  async create(userId: string, createStickyNoteDto: CreateStickyNoteDto): Promise<StickyNote> {
    // 生成唯一的noteId
    const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 为位置和大小字段提供默认值
    const noteData = {
      ...createStickyNoteDto,
      positionX: createStickyNoteDto.positionX ?? 100,
      positionY: createStickyNoteDto.positionY ?? 100,
      width: createStickyNoteDto.width ?? 400,
      height: createStickyNoteDto.height ?? 400,
      isMinimized: createStickyNoteDto.isMinimized ?? false,
      zIndex: createStickyNoteDto.zIndex ?? 1000,
    };
    
    const stickyNote = this.stickyNoteRepository.create({
      userId,
      noteId,
      ...noteData,
    });

    return this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 获取用户的所有便利贴
   */
  async findAll(userId: string): Promise<StickyNote[]> {
    return this.stickyNoteRepository.find({
      where: {
        userId,
        isDeleted: false,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * 根据noteId获取便利贴
   */
  async findOne(userId: string, noteId: string): Promise<StickyNote> {
    const stickyNote = await this.stickyNoteRepository.findOne({
      where: {
        userId,
        noteId,
        isDeleted: false,
      },
    });

    if (!stickyNote) {
      throw new NotFoundException('便利贴不存在');
    }

    return stickyNote;
  }

  /**
   * 更新便利贴
   */
  async update(userId: string, noteId: string, updateStickyNoteDto: UpdateStickyNoteDto): Promise<StickyNote> {
    const stickyNote = await this.findOne(userId, noteId);
    
    Object.assign(stickyNote, updateStickyNoteDto);
    
    return this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 删除便利贴（软删除）
   */
  async remove(userId: string, noteId: string): Promise<{ message: string }> {
    const stickyNote = await this.findOne(userId, noteId);
    
    stickyNote.isDeleted = true;
    await this.stickyNoteRepository.save(stickyNote);
    
    return { message: '便利贴删除成功' };
  }
}