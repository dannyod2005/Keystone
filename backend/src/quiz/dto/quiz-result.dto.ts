export class QuizResultItemDto {
  questionId: string;
  type: 'mcq' | 'short_answer';
  isCorrect: boolean;

  // mcq only
  selectedOptionId?: string;
  correctOptionId?: string;

  // #40 — short_answer only. acceptableAnswers is only revealed here,
  // after submitting — same principle as correctOptionId already being
  // revealed post-submission for mcq, not before.
  submittedText?: string;
  acceptableAnswers?: string[];
}

export class QuizResultDto {
  score: number;
  total: number;
  alreadySubmitted: boolean;
  results: QuizResultItemDto[];
}
