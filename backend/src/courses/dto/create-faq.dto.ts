import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateFaqDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  question: string;

  @IsString()
  @MinLength(1)
  answer: string;
}
