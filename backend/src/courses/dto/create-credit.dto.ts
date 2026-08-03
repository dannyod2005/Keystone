import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCreditDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  line: string;
}