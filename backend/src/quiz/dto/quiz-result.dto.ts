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
  // #239 — true when this submission replaced a prior one (a retake),
  // false for a genuine first attempt. Every submitQuiz response is a
  // freshly-graded result now — this field used to mean "this is stale,
  // previously-graded data being replayed back," but that code path no
  // longer exists (see modules.service.ts).
  alreadySubmitted: boolean;
  results: QuizResultItemDto[];
}
