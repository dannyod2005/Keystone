import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity('course_faqs')
export class CourseFaq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.faqs, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;
}
