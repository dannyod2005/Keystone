import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// #274 — exported (were module-private) so CreateModuleDto can reuse the
// exact same shape/validation for quiz questions authored inline during
// course creation, rather than duplicating this class.
export class UpsertOptionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class UpsertQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  question: string;

  // #40 — defaults to 'mcq' server-side (modules.service.ts) if omitted,
  // matching the QuizQuestion entity's column default, so this stays
  // optional rather than a breaking change for any caller still sending
  // the pre-#40 shape.
  @IsOptional()
  @IsIn(['mcq', 'short_answer'])
  type?: 'mcq' | 'short_answer';

  // Required (and validated) only for type: 'mcq'. @ValidateIf runs
  // before the nested validators, so an mcq question still gets the
  // "at least 2 options" / nested-shape checks; a short_answer question
  // skips this block entirely rather than needing a dummy options array.
  @ValidateIf((q: UpsertQuestionDto) => q.type !== 'short_answer')
  @IsArray()
  @ArrayMinSize(2, { message: 'Each question needs at least 2 options' })
  @ValidateNested({ each: true })
  @Type(() => UpsertOptionDto)
  options?: UpsertOptionDto[];

  // Required (and validated) only for type: 'short_answer' — the list of
  // acceptable answers/keywords a learner's free-text response is
  // matched against (case-insensitive, trimmed — see modules.service.ts).
  @ValidateIf((q: UpsertQuestionDto) => q.type === 'short_answer')
  @IsArray()
  @ArrayMinSize(1, {
    message: 'A short-answer question needs at least 1 acceptable answer',
  })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  acceptableAnswers?: string[];
}

export class UpsertQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertQuestionDto)
  questions: UpsertQuestionDto[];
}
