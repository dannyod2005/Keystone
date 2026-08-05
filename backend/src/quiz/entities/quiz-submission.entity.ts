import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('quiz_submissions')
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  // Deliberately no direct relation to QuizQuestion — the question is
  // implied transitively via option.question, matching the documented
  // schema exactly. #26 will need to join through this when checking
  // "has this user already answered this question."
  @ManyToOne(() => QuizOption, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'option_id' })
  option: QuizOption;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}