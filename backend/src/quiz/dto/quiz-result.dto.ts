export class QuizResultItemDto {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
}

export class QuizResultDto {
  score: number;
  total: number;
  alreadySubmitted: boolean;
  results: QuizResultItemDto[];
}