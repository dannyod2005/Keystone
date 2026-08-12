export class QuizOptionEditResponseDto {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
}

export class QuizQuestionEditResponseDto {
  id: string;
  question: string;
  position: number;
  type: 'mcq' | 'short_answer';
  // #40 — for type: 'short_answer', these are the acceptable-answer rows
  // (isCorrect always true) rather than MCQ choices — see the QuizOption
  // entity comment. Trainer-only view, so exposing them here (unlike
  // QuizQuestionResponseDto) is fine.
  options: QuizOptionEditResponseDto[];
}
