import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

class UpsertOptionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

class UpsertQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  question: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Each question needs at least 2 options' })
  @ValidateNested({ each: true })
  @Type(() => UpsertOptionDto)
  options: UpsertOptionDto[];
}

export class UpsertQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertQuestionDto)
  questions: UpsertQuestionDto[];
}