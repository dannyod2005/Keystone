import { Controller, Get, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get(':id/quiz')
  getQuiz(@Param('id') id: string): Promise<QuizQuestionResponseDto[]> {
    return this.modulesService.getQuiz(id);
  }
}