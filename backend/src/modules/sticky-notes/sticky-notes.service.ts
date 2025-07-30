import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
   * @param userId 用户ID
   * @param createStickyNoteDto 创建便利贴数据
   * @returns 创建的便利贴
   */
  async create(userId: number, createStickyNoteDto: CreateStickyNoteDto): Promise<StickyNote> {
    // 检查是否已存在相同的便利贴
    const existingNote = await this.stickyNoteRepository.findOne({
      where: {
        userId,
        noteId: createStickyNoteDto.noteId,
        isDeleted: false,
      },
    });

    if (existingNote) {
      // 如果已存在，则更新
      return this.update(userId, createStickyNoteDto.noteId, createStickyNoteDto);
    }

    // 创建新的便利贴
    const stickyNote = this.stickyNoteRepository.create({
      userId,
      ...createStickyNoteDto,
    });

    return this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 获取用户的所有便利贴
   * @param userId 用户ID
   * @returns 便利贴列表
   */
  async findAllByUser(userId: number): Promise<StickyNote[]> {
    return this.stickyNoteRepository.find({
      where: {
        userId,
        isDeleted: false,
      },
      order: {
        zIndex: 'DESC',
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * 根据ID获取便利贴
   * @param userId 用户ID
   * @param noteId 便利贴ID
   * @returns 便利贴
   */
  async findOne(userId: number, noteId: string): Promise<StickyNote> {
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
   * @param userId 用户ID
   * @param noteId 便利贴ID
   * @param updateStickyNoteDto 更新数据
   * @returns 更新后的便利贴
   */
  async update(userId: number, noteId: string, updateStickyNoteDto: UpdateStickyNoteDto): Promise<StickyNote> {
    const stickyNote = await this.findOne(userId, noteId);

    // 更新便利贴数据
    Object.assign(stickyNote, updateStickyNoteDto);
    
    return this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 删除便利贴（软删除）
   * @param userId 用户ID
   * @param noteId 便利贴ID
   */
  async remove(userId: number, noteId: string): Promise<void> {
    const stickyNote = await this.findOne(userId, noteId);
    
    stickyNote.isDeleted = true;
    await this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 批量更新便利贴的层级
   * @param userId 用户ID
   * @param noteId 要置顶的便利贴ID
   */
  async bringToFront(userId: number, noteId: string): Promise<void> {
    // 获取当前最大的zIndex
    const maxZIndexResult = await this.stickyNoteRepository
      .createQueryBuilder('note')
      .select('MAX(note.zIndex)', 'maxZIndex')
      .where('note.userId = :userId', { userId })
      .andWhere('note.isDeleted = false')
      .getRawOne();

    const maxZIndex = maxZIndexResult?.maxZIndex || 0;

    // 更新指定便利贴的zIndex
    await this.stickyNoteRepository.update(
      { userId, noteId, isDeleted: false },
      { zIndex: maxZIndex + 1 }
    );
  }

  /**
   * 同步便利贴状态（用于前端状态同步）
   * @param userId 用户ID
   * @param noteId 便利贴ID
   * @param syncData 同步数据
   */
  async syncState(userId: number, noteId: string, syncData: Partial<UpdateStickyNoteDto>): Promise<StickyNote> {
    try {
      return await this.update(userId, noteId, syncData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // 如果便利贴不存在，则创建
        return await this.create(userId, {
          noteId,
          ...syncData,
        } as CreateStickyNoteDto);
      }
      throw error;
    }
  }

  /**
   * 保存或更新便利贴（用于前端保存按钮）
   * @param userId 用户ID
   * @param noteId 便利贴ID
   * @param saveData 保存数据
   */
  async saveOrUpdate(userId: number, noteId: string, saveData: Partial<CreateStickyNoteDto>): Promise<StickyNote> {
    // 检查是否已存在相同的便利贴
    const existingNote = await this.stickyNoteRepository.findOne({
      where: {
        userId,
        noteId,
        isDeleted: false,
      },
    });

    if (existingNote) {
      // 如果已存在，则更新
      Object.assign(existingNote, saveData);
      return this.stickyNoteRepository.save(existingNote);
    } else {
      // 如果不存在，则创建
      const stickyNote = this.stickyNoteRepository.create({
        userId,
        noteId,
        ...saveData,
      });
      return this.stickyNoteRepository.save(stickyNote);
    }
  }

  /**
   * 恢复已删除的便利贴
   * @param userId 用户ID
   * @param noteId 便利贴ID
   */
  async restore(userId: number, noteId: string): Promise<StickyNote> {
    const stickyNote = await this.stickyNoteRepository.findOne({
      where: {
        userId,
        noteId,
        isDeleted: true,
      },
    });

    if (!stickyNote) {
      throw new NotFoundException('已删除的便利贴不存在');
    }

    stickyNote.isDeleted = false;
    return this.stickyNoteRepository.save(stickyNote);
  }

  /**
   * 获取用户已删除的便利贴
   * @param userId 用户ID
   * @returns 已删除的便利贴列表
   */
  async findDeletedByUser(userId: number): Promise<StickyNote[]> {
    return this.stickyNoteRepository.find({
      where: {
        userId,
        isDeleted: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }
}