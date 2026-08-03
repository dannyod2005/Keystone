import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
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

  @IsInt()
  @Min(0)
  hours: number;

  @IsInt()
  @Min(0)
  projects: number;

  @IsIn(COLORS)
  color: string;

  @IsOptional()
  @IsString()
  blurb?: string;

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