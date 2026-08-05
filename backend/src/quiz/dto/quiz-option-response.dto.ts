export class QuizOptionResponseDto {
  id: string;
  optionText: string;
  position: number;
  // Deliberately no isCorrect — this DTO is what gets sent to the
  // client, and the whole point of #25 is that answers can't be
  // inspected before submitting.
}