import { QuizOptionResponseDto } from './quiz-option-response.dto';

export class QuizQuestionResponseDto {
  id: string;
  question: string;
  position: number;
  options: QuizOptionResponseDto[];
}