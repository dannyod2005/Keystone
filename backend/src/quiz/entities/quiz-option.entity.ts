import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

// #40 — for a question.type === 'mcq', this table holds the MCQ choices
// exactly as before (some correct, some not). For question.type ===
// 'short_answer', this table instead holds the acceptable-answer
// keywords/phrases for that question — every row is is_correct: true
// (there's no "wrong option" to store; submitQuiz matches the learner's
// free-text answer against these). Reused rather than adding a new
// table since the shape (question -> list of text values) is identical
// either way. QuizOptionResponseDto never exposes isCorrect, so this
// dual use doesn't leak short-answer answer keys to learners any more
// than it already avoids leaking MCQ correct answers — see getQuiz()'s
// options: [] short-circuit for short_answer questions specifically,
// though, since optionText itself *is* the answer for that type.
@Entity('quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ name: 'option_text', type: 'text' })
  optionText: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'int' })
  position: number;
}
