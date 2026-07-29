import { Course } from './entities/course.entity';

// TEMPORARY: stands in for a real database query. Once TypeORM is
// connected to a live Postgres database, CoursesService.findAll() will
// replace this with an actual repository call — this file can then be
// deleted, or kept as a one-off seed script.
export const MOCK_COURSES: Course[] = [
  {
    id: 'c1', title: 'AI Engineering with Claude', provider: 'Anthropic Academy',
    category: 'Technical', level: 'Intermediate', hours: 24, projects: 13,
    rating: 4.9, learners: 2840, color: 'ink',
    blurb: 'Ship real projects with Claude — from prompting fundamentals to agentic tool use.',
    agenda: ['Prompting foundations', 'Tool use & function calling', 'Retrieval & context design', 'Agents & evaluation', 'Capstone project'],
    modules: 5,
    credits: [
      'Curriculum & instruction: Anthropic Academy teaching staff',
      'Case studies adapted from published Anthropic engineering write-ups',
      "Capstone rubric reviewed by Keystone's technical advisory board",
    ],
  },
  {
    id: 'c2', title: 'Python for Everybody', provider: 'Dept. of Data Science',
    category: 'Technical', level: 'Beginner', hours: 32, projects: 5,
    rating: 4.8, learners: 18400, color: 'gold',
    blurb: 'A five-course path from first script to working with databases and APIs.',
    agenda: ['Getting started with Python', 'Data structures', 'Using web APIs', 'Databases', 'Capstone: visualize data'],
    modules: 5,
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Practice datasets: public domain and CC-BY sources, cited per exercise',
      'Auto-graded exercises built on the open-source pytest framework',
    ],
  },
  {
    id: 'c3', title: 'Product Analytics Fundamentals', provider: 'Keystone Business School',
    category: 'Business', level: 'Beginner', hours: 10, projects: 3,
    rating: 4.7, learners: 6210, color: 'success',
    blurb: 'Read a funnel, run an A/B test, and turn dashboards into decisions.',
    agenda: ['Metrics that matter', 'Funnels & retention', 'Running experiments', 'Presenting findings'],
    modules: 4,
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Sample dashboards built with anonymized, synthetic data',
      'Experiment design framework adapted with permission from course advisors',
    ],
  },
  {
    id: 'c4', title: 'Leading High-Performing Teams', provider: 'Keystone Business School',
    category: 'Leadership', level: 'Advanced', hours: 8, projects: 2,
    rating: 4.6, learners: 4120, color: 'coral',
    blurb: 'Practical frameworks for feedback, delegation, and 1:1s that actually work.',
    agenda: ['Setting direction', 'Delegation & trust', 'Feedback that lands', 'Running effective 1:1s'],
    modules: 4,
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Frameworks drawn from published leadership research, cited in-course',
      "Role-play scenarios developed with Keystone's coaching partners",
    ],
  },
  {
    id: 'c5', title: 'Data Visualization with Python', provider: 'Dept. of Data Science',
    category: 'Technical', level: 'Intermediate', hours: 14, projects: 4,
    rating: 4.8, learners: 5390, color: 'gold',
    blurb: 'Matplotlib, seaborn, and the design principles behind charts people trust.',
    agenda: ['Chart fundamentals', 'Matplotlib & seaborn', 'Design & annotation', 'Capstone: a report'],
    modules: 4,
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Built on the open-source Matplotlib and seaborn libraries',
      'Design principles adapted from public data-visualization style guides',
    ],
  },
  {
    id: 'c6', title: 'Negotiation Essentials', provider: 'Keystone Business School',
    category: 'Business', level: 'Beginner', hours: 6, projects: 2,
    rating: 4.5, learners: 3010, color: 'success',
    blurb: 'Prepare, anchor, and close — a short course for everyday negotiations.',
    agenda: ['Preparing your position', 'Anchoring & concessions', 'Closing the deal'],
    modules: 3,
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Negotiation scenarios developed in-house for classroom use',
      'Icon set: Lucide (ISC License)',
    ],
  },
];