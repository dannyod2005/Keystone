import { IsUUID } from 'class-validator';

export class CreateLearningPathEnrollmentDto {
  @IsUUID()
  pathId: string;
}
