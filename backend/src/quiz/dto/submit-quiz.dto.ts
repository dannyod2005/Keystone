import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

class QuizAnswerDto {
  @IsUUID()
  questionId: string;

  // #40 — exactly one of optionId/answerText is required depending on
  // the question's type, but that's cross-field (needs the real
  // QuizQuestion to know which), so it can't be expressed as a
  // decorator here — modules.service.ts validates the right one is
  // present per question before grading or saving anything.
  @IsOptional()
  @IsUUID()
  optionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  answerText?: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
