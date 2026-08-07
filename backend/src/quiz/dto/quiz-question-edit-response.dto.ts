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
  options: QuizOptionEditResponseDto[];
}