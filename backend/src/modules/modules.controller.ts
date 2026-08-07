import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ModulesService } from './modules.service';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';
import { SubmitQuizDto } from '../quiz/dto/submit-quiz.dto';
import { QuizResultDto } from '../quiz/dto/quiz-result.dto';
import { UpsertNoteDto } from '../notes/dto/upsert-note.dto';
import { NoteResponseDto } from '../notes/dto/note-response.dto';
import { CreatePostDto } from '../forum/dto/create-post.dto';
import { UpdatePostDto } from '../forum/dto/update-post.dto';
import { PostResponseDto } from '../forum/dto/post-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { UpsertQuizDto } from '../quiz/dto/upsert-quiz.dto';
import { QuizQuestionEditResponseDto } from '../quiz/dto/quiz-question-edit-response.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get(':id/quiz')
  getQuiz(@Param('id') id: string): Promise<QuizQuestionResponseDto[]> {
    return this.modulesService.getQuiz(id);
  }

  @Get(':id/quiz/edit')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  getQuizForEdit(@Param('id') id: string): Promise<QuizQuestionEditResponseDto[]> {
    return this.modulesService.getQuizForEdit(id);
  }

  @Post(':id/quiz/submit')
  @UseGuards(SupabaseAuthGuard)
  submitQuiz(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    return this.modulesService.submitQuiz(req.user.id, id, dto);
  }

  @Get(':id/notes')
  @UseGuards(SupabaseAuthGuard)
  getNote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<NoteResponseDto> {
    return this.modulesService.getNote(req.user.id, id);
  }

  @Put(':id/notes')
  @UseGuards(SupabaseAuthGuard)
  saveNote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertNoteDto,
  ): Promise<NoteResponseDto> {
    return this.modulesService.saveNote(req.user.id, id, dto);
  }

  @Get(':id/forum')
  listPosts(@Param('id') id: string): Promise<PostResponseDto[]> {
    return this.modulesService.listPosts(id);
  }

  @Post(':id/forum')
  @UseGuards(SupabaseAuthGuard)
  createPost(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.modulesService.createPost(req.user.id, id, dto);
  }

  @Patch(':id/forum/:postId')
  @UseGuards(SupabaseAuthGuard)
  editPost(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.modulesService.editPost(req.user.id, id, postId, dto);
  }

  @Put(':id/quiz')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  upsertQuiz(
    @Param('id') id: string,
    @Body() dto: UpsertQuizDto,
  ): Promise<QuizQuestionResponseDto[]> {
    return this.modulesService.upsertQuiz(id, dto);
  }
}