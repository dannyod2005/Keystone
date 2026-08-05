export class EnrollmentResponseDto {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  lastAccessed: Date | null;
  createdAt: Date;
}