import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookmarkDto,
  ): Promise<BookmarkResponseDto> {
    return this.bookmarksService.create(req.user.id, dto.courseId);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  findAllForUser(
    @Req() req: AuthenticatedRequest,
  ): Promise<BookmarkResponseDto[]> {
    return this.bookmarksService.findAllForUser(req.user.id);
  }

  // #230 — keyed by courseId, not bookmark id — see BookmarksService.remove.
  @Delete(':courseId')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ): Promise<void> {
    return this.bookmarksService.remove(req.user.id, courseId);
  }
}
