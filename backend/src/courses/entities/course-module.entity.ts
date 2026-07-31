import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_modules')
@Unique(['course', 'position'])
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl: string | null;
}