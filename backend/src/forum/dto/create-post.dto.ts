import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  content: string;

  // Reply target. Omitted/null for a top-level post.
  @IsOptional()
  @IsUUID()
  parentPostId?: string;
}
