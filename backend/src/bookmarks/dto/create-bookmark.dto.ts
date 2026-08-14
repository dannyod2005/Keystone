import { IsUUID } from 'class-validator';

export class CreateBookmarkDto {
  @IsUUID()
  courseId: string;
}
