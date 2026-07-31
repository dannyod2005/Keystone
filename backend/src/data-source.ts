// src/data-source.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from './courses/entities/course.entity';
import { CourseModule } from './courses/entities/course-module.entity';
import { CourseCredit } from './courses/entities/course-credit.entity';
import { CourseFaq } from './courses/entities/course-faq.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  entities: [Course, CourseModule, CourseCredit, CourseFaq],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});