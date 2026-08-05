import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from './courses/entities/course.entity';
import { CourseModule } from './courses/entities/course-module.entity';
import { CourseCredit } from './courses/entities/course-credit.entity';
import { CourseFaq } from './courses/entities/course-faq.entity';
import { Profile } from './profiles/entities/profile.entity';
import { Enrollment } from './enrollments/entities/enrollment.entity';
import { QuizQuestion } from './quiz/entities/quiz-question.entity';
import { QuizOption } from './quiz/entities/quiz-option.entity';
import { QuizSubmission } from './quiz/entities/quiz-submission.entity';
import { ModuleNote } from './notes/entities/module-note.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [
    Course,
    CourseModule,
    CourseCredit,
    CourseFaq,
    Profile,
    Enrollment,
    QuizQuestion,
    QuizOption,
    QuizSubmission,
    ModuleNote,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});