import { QuizOptionResponseDto } from './quiz-option-response.dto';

export class QuizQuestionResponseDto {
  id: string;
  question: string;
  position: number;
  type: 'mcq' | 'short_answer';
  // #40 — always [] for a short_answer question: for that type,
  // quiz_options holds the acceptable answers, and sending those to a
  // learner would hand them the answer key. LearningScreen renders a
  // text input instead of option buttons when type === 'short_answer',
  // so it never needs this array for that case anyway.
  options: QuizOptionResponseDto[];
}
