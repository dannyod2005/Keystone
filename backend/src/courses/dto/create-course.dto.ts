import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateModuleDto } from './create-module.dto';
import { CreateCreditDto } from './create-credit.dto';
import { CreateFaqDto } from './create-faq.dto';

const CATEGORIES = ['Technical', 'Business', 'Leadership'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COLORS = ['ink', 'gold', 'success', 'coral'];

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(1)
  provider: string;

  @IsIn(CATEGORIES)
  category: string;

  @IsIn(LEVELS)
  level: string;

  // #297 — was @IsInt(); the Trainer Studio editor now offers 15-minute
  // (0.25h) increments so a short course isn't forced to round up to a
  // full hour. maxDecimalPlaces: 2 is a loose backstop against float
  // noise (e.g. 1.2500000000000002 from repeated /4 * 4 arithmetic) —
  // not an attempt to enforce the quarter-hour step server-side, which
  // stays a frontend UX nicety a trainer could still bypass by typing a
  // value directly.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hours: number;

  @IsIn(COLORS)
  color: string;

  @IsOptional()
  @IsString()
  blurb?: string;

  // #226 — optional: a course can be created/edited without any skill
  // tags, same as blurb/credits/faqs above. Defaulted to [] in
  // CoursesService rather than here, matching how those other optional
  // array fields are handled.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one module is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateModuleDto)
  modules: CreateModuleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCreditDto)
  credits?: CreateCreditDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFaqDto)
  faqs?: CreateFaqDto[];
}
