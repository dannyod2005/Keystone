import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from '../courses/entities/course-module.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(CourseModule)
    private readonly modulesRepo: Repository<CourseModule>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionsRepo: Repository<QuizQuestion>,
  ) {}

  async getQuiz(moduleId: string): Promise<QuizQuestionResponseDto[]> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    const questions = await this.quizQuestionsRepo.find({
      where: { module: { id: moduleId } },
      relations: { options: true },
      order: {
        position: 'ASC',
        options: { position: 'ASC' },
      },
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      position: q.position,
      options: q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        position: o.position,
        // isCorrect intentionally omitted
      })),
    }));
  }
}