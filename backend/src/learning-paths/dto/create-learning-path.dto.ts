import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateLearningPathDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  // #224 — ordered: array index is the sequence position, always
  // re-derived server-side from index rather than trusted from a
  // client-supplied position field — same convention as
  // CreateCourseDto.modules.
  @IsArray()
  @ArrayMinSize(2, { message: 'A learning path needs at least 2 courses' })
  @IsUUID(undefined, { each: true })
  courseIds: string[];
}
