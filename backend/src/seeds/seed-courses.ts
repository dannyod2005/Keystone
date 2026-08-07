// src/seeds/seed-courses.ts
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { Course } from '../courses/entities/course.entity';
import { CourseModule } from '../courses/entities/course-module.entity';
import { CourseCredit } from '../courses/entities/course-credit.entity';
import { CourseFaq } from '../courses/entities/course-faq.entity';

interface SeedCourse {
  title: string;
  provider: string;
  category: string;
  level: string;
  hours: number;
  rating: number;
  learners: number;
  color: string;
  blurb: string;
  agenda: string[]; // becomes ordered CourseModule rows
  credits: string[]; // becomes ordered CourseCredit rows
}

// PLACEHOLDER: no real per-course FAQ content exists yet (the original
// prototype only had one generic, hardcoded FAQ shared by every course).
// These are intentionally generic and identical across all six courses —
// replace with real content once trainers/content team provide it.
const PLACEHOLDER_FAQS: { question: string; answer: string }[] = [
  {
    question: 'How much time should I set aside each week?',
    answer:
      'PLACEHOLDER — pacing guidance for this course has not been written yet.',
  },
  {
    question: 'Will I get a certificate when I finish?',
    answer:
      'PLACEHOLDER — certificate details for this course have not been finalized yet.',
  },
];

// Derived from the original prototype's INITIAL_COURSES. video_url is left
// null for every module — no real video data exists yet either.
const SAMPLE_COURSES: SeedCourse[] = [
  {
    title: 'AI Engineering with Claude',
    provider: 'Anthropic Academy',
    category: 'Technical',
    level: 'Intermediate',
    hours: 24,
    rating: 4.9,
    learners: 2840,
    color: 'ink',
    blurb:
      'Ship real projects with Claude — from prompting fundamentals to agentic tool use.',
    agenda: [
      'Prompting foundations',
      'Tool use & function calling',
      'Retrieval & context design',
      'Agents & evaluation',
      'Capstone project',
    ],
    credits: [
      'Curriculum & instruction: Anthropic Academy teaching staff',
      'Case studies adapted from published Anthropic engineering write-ups',
      "Capstone rubric reviewed by Keystone's technical advisory board",
    ],
  },
  {
    title: 'Python for Everybody',
    provider: 'Dept. of Data Science',
    category: 'Technical',
    level: 'Beginner',
    hours: 32,
    rating: 4.8,
    learners: 18400,
    color: 'gold',
    blurb:
      'A five-course path from first script to working with databases and APIs.',
    agenda: [
      'Getting started with Python',
      'Data structures',
      'Using web APIs',
      'Databases',
      'Capstone: visualize data',
    ],
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Practice datasets: public domain and CC-BY sources, cited per exercise',
      'Auto-graded exercises built on the open-source pytest framework',
    ],
  },
  {
    title: 'Product Analytics Fundamentals',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 10,
    rating: 4.7,
    learners: 6210,
    color: 'success',
    blurb: 'Read a funnel, run an A/B test, and turn dashboards into decisions.',
    agenda: [
      'Metrics that matter',
      'Funnels & retention',
      'Running experiments',
      'Presenting findings',
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Sample dashboards built with anonymized, synthetic data',
      'Experiment design framework adapted with permission from course advisors',
    ],
  },
  {
    title: 'Leading High-Performing Teams',
    provider: 'Keystone Business School',
    category: 'Leadership',
    level: 'Advanced',
    hours: 8,
    rating: 4.6,
    learners: 4120,
    color: 'coral',
    blurb:
      'Practical frameworks for feedback, delegation, and 1:1s that actually work.',
    agenda: [
      'Setting direction',
      'Delegation & trust',
      'Feedback that lands',
      'Running effective 1:1s',
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Frameworks drawn from published leadership research, cited in-course',
      "Role-play scenarios developed with Keystone's coaching partners",
    ],
  },
  {
    title: 'Data Visualization with Python',
    provider: 'Dept. of Data Science',
    category: 'Technical',
    level: 'Intermediate',
    hours: 14,
    rating: 4.8,
    learners: 5390,
    color: 'gold',
    blurb:
      'Matplotlib, seaborn, and the design principles behind charts people trust.',
    agenda: [
      'Chart fundamentals',
      'Matplotlib & seaborn',
      'Design & annotation',
      'Capstone: a report',
    ],
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Built on the open-source Matplotlib and seaborn libraries',
      'Design principles adapted from public data-visualization style guides',
    ],
  },
  {
    title: 'Negotiation Essentials',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 6,
    rating: 4.5,
    learners: 3010,
    color: 'success',
    blurb: 'Prepare, anchor, and close — a short course for everyday negotiations.',
    agenda: [
      'Preparing your position',
      'Anchoring & concessions',
      'Closing the deal',
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Negotiation scenarios developed in-house for classroom use',
      'Icon set: Lucide (ISC License)',
    ],
  },
];

async function seed() {
  await AppDataSource.initialize();

  const courseRepo = AppDataSource.getRepository(Course);
  const moduleRepo = AppDataSource.getRepository(CourseModule);
  const creditRepo = AppDataSource.getRepository(CourseCredit);
  const faqRepo = AppDataSource.getRepository(CourseFaq);

  const existingCount = await courseRepo.count();
  if (existingCount > 0) {
    console.log(
      `Skipping seed: ${existingCount} course(s) already exist. This script only seeds an empty table.`,
    );
    await AppDataSource.destroy();
    return;
  }

  for (const sample of SAMPLE_COURSES) {
    const course = await courseRepo.save(
      courseRepo.create({
        title: sample.title,
        provider: sample.provider,
        category: sample.category,
        level: sample.level,
        hours: sample.hours,
        rating: sample.rating,
        learners: sample.learners,
        color: sample.color,
        blurb: sample.blurb,
      }),
    );

    const modules = sample.agenda.map((title, index) =>
      moduleRepo.create({
        course,
        position: index,
        title,
        videoUrl: null,
      }),
    );
    await moduleRepo.save(modules);

    const credits = sample.credits.map((line, index) =>
      creditRepo.create({ course, position: index, line }),
    );
    await creditRepo.save(credits);

    const faqs = PLACEHOLDER_FAQS.map((faq, index) =>
      faqRepo.create({
        course,
        position: index,
        question: faq.question,
        answer: faq.answer,
      }),
    );
    await faqRepo.save(faqs);

    console.log(`Seeded "${sample.title}" with ${modules.length} modules.`);
  }

  console.log(`Done. Seeded ${SAMPLE_COURSES.length} courses.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});