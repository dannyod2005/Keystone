import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ModulesService } from './modules.service';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';
import { SubmitQuizDto } from '../quiz/dto/submit-quiz.dto';
import { QuizResultDto } from '../quiz/dto/quiz-result.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

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

  @Post(':id/quiz/submit')
  @UseGuards(SupabaseAuthGuard)
  submitQuiz(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    return this.modulesService.submitQuiz(req.user.id, id, dto);
  }
}