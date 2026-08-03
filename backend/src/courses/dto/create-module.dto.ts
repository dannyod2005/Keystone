import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  videoUrl?: string | null;
}