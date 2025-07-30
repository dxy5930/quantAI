import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickyNotesService } from './sticky-notes.service';
import { StickyNotesController } from './sticky-notes.controller';
import { StickyNote } from './entities/sticky-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StickyNote])],
  controllers: [StickyNotesController],
  providers: [StickyNotesService],
  exports: [StickyNotesService],
})
export class StickyNotesModule {}