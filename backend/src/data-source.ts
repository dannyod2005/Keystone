import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from './courses/entities/course.entity';
import { CourseModule } from './courses/entities/course-module.entity';
import { CourseCredit } from './courses/entities/course-credit.entity';
import { CourseFaq } from './courses/entities/course-faq.entity';
import { Profile } from './profiles/entities/profile.entity';
import { Provider } from './providers/entities/provider.entity';
import { Enrollment } from './enrollments/entities/enrollment.entity';
import { QuizQuestion } from './quiz/entities/quiz-question.entity';
import { QuizOption } from './quiz/entities/quiz-option.entity';
import { QuizSubmission } from './quiz/entities/quiz-submission.entity';
import { ModuleNote } from './notes/entities/module-note.entity';
import { ForumPost } from './forum/entities/forum-post.entity';
import { ActivityEvent } from './activity/entities/activity-event.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // node-postgres doesn't enable TCP keepalive by default. Long-running
  // scripts that do many sequential round trips (seed-courses.ts,
  // wipe-test-data.ts) are exactly the workload that trips a silent
  // connection drop on a managed/pooled Postgres host — surfaces as
  // "Connection terminated unexpectedly" partway through. Harmless for
  // the running NestJS app too, so applied here rather than only in the
  // scripts.
  extra: {
    keepAlive: true,
  },
  entities: [
    Course,
    CourseModule,
    CourseCredit,
    CourseFaq,
    Profile,
    Provider,
    Enrollment,
    QuizQuestion,
    QuizOption,
    QuizSubmission,
    ModuleNote,
    ForumPost,
    ActivityEvent,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
