import { IsOptional, IsString } from 'class-validator';

export class UpsertNoteDto {
  @IsOptional()
  @IsString()
  content?: string | null;
}
