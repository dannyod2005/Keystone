// src/seeds/seed-courses.ts
//
// #109 — expanded from the original 6-course prototype set to ~40 courses
// spread across the three catalogue categories, so filtering/browsing
// feels realistic for a demo. Scope decisions, spelled out since they
// shape what #100 still needs to do:
//   - Every module gets a real, verified-embeddable YouTube video URL
//     (see VIDEO POOLS below) — video playback is one of the "core UX"
//     pillars #109 explicitly gates on, so every module needed a working
//     player, not just a placeholder icon. Topic accuracy wasn't required
//     (per the issue), so these are a curated pool of long-standing public
//     talks/tutorials reused across modules, loosely matched by category
//     (tutorial content for Technical, talks for Business/Leadership).
//   - Only the FIRST module of every course gets a quiz here (2 questions
//     each) — enough to satisfy "most/all courses have quiz questions" at
//     the course level and prove the feature works across the whole
//     catalogue, but NOT full per-module coverage. Populating every
//     remaining module's quiz is deliberately left to #100, which was
//     scoped as the dedicated follow-up for exactly that.
//   - FAQs moved from one generic PLACEHOLDER pair (shared by literally
//     every course) to three category-specific pairs, reused within each
//     category. Still reused rather than fully unique per course — real,
//     non-generic copy, just not bespoke per course, which felt like the
//     right effort/benefit line for 40 courses.
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { Course } from '../courses/entities/course.entity';
import { CourseModule } from '../courses/entities/course-module.entity';
import { CourseCredit } from '../courses/entities/course-credit.entity';
import { CourseFaq } from '../courses/entities/course-faq.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizOption } from '../quiz/entities/quiz-option.entity';

type Category = 'Technical' | 'Business' | 'Leadership';
type Level = 'Beginner' | 'Intermediate' | 'Advanced';
type Color = 'ink' | 'gold' | 'success' | 'coral';

interface SeedQuizQuestion {
  question: string;
  options: { text: string; correct: boolean }[];
}

interface SeedModule {
  title: string;
  videoUrl: string;
  quiz?: SeedQuizQuestion[];
}

interface SeedCourse {
  title: string;
  provider: string;
  category: Category;
  level: Level;
  hours: number;
  rating: number;
  learners: number;
  color: Color;
  blurb: string;
  modules: SeedModule[];
  credits: string[];
}

function embed(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

// Verified via YouTube's oEmbed API (public, not deleted, not
// embed-restricted) — see #109 for the check. Reused across modules;
// picking specific videos per module was deliberately not attempted (the
// issue explicitly doesn't require topic accuracy for video content).
const TECH = {
  python: embed('rfscVS0vtbw'), // freeCodeCamp — Learn Python
  js1: embed('PkZNo7MFNFg'), // freeCodeCamp — Learn JavaScript
  js2: embed('W6NZfCO5SIk'), // Programming with Mosh — JavaScript Course
  html: embed('P0EGYTb1cBs'), // Dave Gray — Introduction to HTML
  js3: embed('hdI2bqOjy3c'), // Traversy Media — JavaScript Crash Course
};

const TALK = {
  creativity: embed('iG9CE55wbtY'), // TED — Sir Ken Robinson
  jobs: embed('UF8uR6Z6KLc'), // Stanford — Steve Jobs commencement address
  listen: embed('eIho2S0ZahI'), // TED — Julian Treasure
  stress1: embed('RcGyVTAoXEU'), // TED — Kelly McGonigal
  howToSpeak: embed('Unzc731iCUY'), // MIT OCW — Patrick Winston, "How to Speak"
  soundSmart: embed('8S0FDjFBj8o'), // TEDx — Will Stephen
  stress2: embed('8jPQjjsBbIc'), // TED — Daniel Levitin
  sinek: embed('qp0HIF3SfI4'), // TED — Simon Sinek
  bodyLanguage: embed('Ks-_Mh1QhMc'), // TED — Amy Cuddy
  vulnerability: embed('X4Qm9cGRub0'), // TEDx — Brené Brown
};

const CATEGORY_FAQS: Record<Category, { question: string; answer: string }[]> =
  {
    Technical: [
      {
        question: 'Do I need prior coding experience?',
        answer:
          'Check the course level (Beginner/Intermediate/Advanced) in the catalogue before enrolling — Beginner courses assume no prior experience.',
      },
      {
        question: 'Will I get a certificate when I finish?',
        answer:
          'Yes — completing every module and its quiz unlocks a downloadable certificate from your dashboard.',
      },
      {
        question: 'How much time should I set aside each week?',
        answer:
          "Budget roughly the course's listed hours spread across 2–4 weeks, depending on how deep you want to go with the exercises.",
      },
    ],
    Business: [
      {
        question: "Is this relevant if I'm not in a management role yet?",
        answer:
          'Yes — these frameworks are useful for anyone who wants to think more clearly about business decisions, not just people managers.',
      },
      {
        question: 'Will I get a certificate when I finish?',
        answer:
          'Yes — completing every module and its quiz unlocks a downloadable certificate from your dashboard.',
      },
      {
        question: 'How much time should I set aside each week?',
        answer:
          "Budget roughly the course's listed hours spread across 2–4 weeks, depending on how deep you want to go with the exercises.",
      },
    ],
    Leadership: [
      {
        question: 'Do I need to be a manager to take this course?',
        answer:
          'No — skills like feedback, communication, and conflict resolution are useful long before you have direct reports.',
      },
      {
        question: 'Will I get a certificate when I finish?',
        answer:
          'Yes — completing every module and its quiz unlocks a downloadable certificate from your dashboard.',
      },
      {
        question: 'How much time should I set aside each week?',
        answer:
          "Budget roughly the course's listed hours spread across 2–4 weeks, depending on how deep you want to go with the exercises.",
      },
    ],
  };

// Two reusable credit lines per provider — real attribution pattern (who
// teaches it, where content/tooling comes from), just not bespoke prose
// per course. The original 6 courses keep their existing hand-written
// 3-line credits below instead of this lookup.
const PROVIDER_CREDITS: Record<string, string[]> = {
  'Anthropic Academy': [
    'Curriculum & instruction: Anthropic Academy teaching staff',
    'Case studies adapted from published Anthropic engineering write-ups',
  ],
  'Dept. of Data Science': [
    'Curriculum & instruction: Dept. of Data Science faculty',
    'Practice datasets: public domain and CC-BY sources, cited per exercise',
  ],
  'Keystone Business School': [
    'Curriculum & instruction: Keystone Business School faculty',
    'Frameworks and case studies developed in-house for classroom use',
  ],
  'Keystone Web Guild': [
    'Curriculum & instruction: Keystone Web Guild engineering staff',
    'Built on current open-source tooling and official framework documentation',
  ],
  'Keystone DevOps Guild': [
    'Curriculum & instruction: Keystone DevOps Guild engineering staff',
    'Labs built on open-source and free-tier cloud tooling',
  ],
  'Keystone Security Lab': [
    'Curriculum & instruction: Keystone Security Lab staff',
    'Scenarios adapted from publicly documented security incidents and OWASP guidance',
  ],
  'Keystone Growth Academy': [
    'Curriculum & instruction: Keystone Growth Academy staff',
    'Campaign examples anonymized and adapted from industry case studies',
  ],
  'Global Leadership Institute': [
    'Curriculum & instruction: Global Leadership Institute faculty',
    'Frameworks drawn from published leadership and organizational psychology research, cited in-course',
  ],
};

function q(question: string, options: [string, boolean][]): SeedQuizQuestion {
  return {
    question,
    options: options.map(([text, correct]) => ({ text, correct })),
  };
}

const SAMPLE_COURSES: SeedCourse[] = [
  // ---------------- TECHNICAL (14) ----------------
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
    modules: [
      {
        title: 'Prompting foundations',
        videoUrl: TECH.python,
        quiz: [
          q('What is a "system prompt" typically used for?', [
            ['Setting persistent context or behavior for the model', true],
            ['Formatting the final output as JSON', false],
            ['Rate-limiting API requests', false],
            ['Compressing the conversation history', false],
          ]),
          q(
            'Which technique reduces hallucination by grounding answers in real documents?',
            [
              ['Retrieval-augmented generation', true],
              ['Temperature scaling', false],
              ['Token truncation', false],
              ['Batch inference', false],
            ],
          ),
        ],
      },
      { title: 'Tool use & function calling', videoUrl: TECH.js1 },
      { title: 'Retrieval & context design', videoUrl: TECH.js2 },
      { title: 'Agents & evaluation', videoUrl: TECH.html },
      { title: 'Capstone project', videoUrl: TECH.js3 },
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
    modules: [
      {
        title: 'Getting started with Python',
        videoUrl: TECH.js3,
        quiz: [
          q('Which of these is a valid Python variable name?', [
            ['_total', true],
            ['2total', false],
            ['total-1', false],
            ['total value', false],
          ]),
          q('What does the print() function do?', [
            ['Outputs text to the console', true],
            ['Deletes a variable', false],
            ['Imports a module', false],
            ['Starts a loop', false],
          ]),
        ],
      },
      { title: 'Data structures', videoUrl: TECH.python },
      { title: 'Using web APIs', videoUrl: TECH.js1 },
      { title: 'Databases', videoUrl: TECH.js2 },
      { title: 'Capstone: visualize data', videoUrl: TECH.html },
    ],
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Practice datasets: public domain and CC-BY sources, cited per exercise',
      'Auto-graded exercises built on the open-source pytest framework',
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
    modules: [
      {
        title: 'Chart fundamentals',
        videoUrl: TECH.html,
        quiz: [
          q('Which chart type is best for showing a trend over time?', [
            ['Line chart', true],
            ['Pie chart', false],
            ['Scatter plot', false],
            ['Box plot', false],
          ]),
          q("What's a common mistake when choosing chart colors?", [
            ['Using non-colorblind-safe palettes', true],
            ['Using too few data points', false],
            ['Labeling the axes', false],
            ['Adding a title', false],
          ]),
        ],
      },
      { title: 'Matplotlib & seaborn', videoUrl: TECH.js3 },
      { title: 'Design & annotation', videoUrl: TECH.python },
      { title: 'Capstone: a report', videoUrl: TECH.js1 },
    ],
    credits: [
      'Curriculum & instruction: Dept. of Data Science faculty',
      'Built on the open-source Matplotlib and seaborn libraries',
      'Design principles adapted from public data-visualization style guides',
    ],
  },
  {
    title: 'JavaScript Fundamentals',
    provider: 'Keystone Web Guild',
    category: 'Technical',
    level: 'Beginner',
    hours: 12,
    rating: 4.6,
    learners: 8700,
    color: 'ink',
    blurb:
      'Variables, functions, and the DOM — a solid foundation before frameworks.',
    modules: [
      {
        title: 'Variables, types & operators',
        videoUrl: TECH.js2,
        quiz: [
          q(
            'Which keyword declares a block-scoped variable in modern JavaScript?',
            [
              ['let', true],
              ['var', false],
              ['def', false],
              ['dim', false],
            ],
          ),
          q('What does "===" check in JavaScript?', [
            ['Value and type equality', true],
            ['Value equality only', false],
            ['Reference equality only', false],
            ['Assignment', false],
          ]),
        ],
      },
      { title: 'Functions & scope', videoUrl: TECH.html },
      { title: 'Arrays & objects', videoUrl: TECH.js3 },
      { title: 'DOM basics', videoUrl: TECH.python },
    ],
    credits: PROVIDER_CREDITS['Keystone Web Guild'],
  },
  {
    title: 'Modern Web Development with React',
    provider: 'Keystone Web Guild',
    category: 'Technical',
    level: 'Intermediate',
    hours: 18,
    rating: 4.7,
    learners: 6120,
    color: 'gold',
    blurb:
      'Components, hooks, and data fetching — build a real single-page app.',
    modules: [
      {
        title: 'Components & JSX',
        videoUrl: TECH.js1,
        quiz: [
          q('What does JSX compile down to?', [
            ['JavaScript function calls (e.g. React.createElement)', true],
            ['HTML templates', false],
            ['CSS-in-JS', false],
            ['WebAssembly', false],
          ]),
          q('How do you pass data from a parent to a child component?', [
            ['Props', true],
            ['State', false],
            ['Context only', false],
            ['Refs', false],
          ]),
        ],
      },
      { title: 'State & props', videoUrl: TECH.js2 },
      { title: 'Hooks in practice', videoUrl: TECH.html },
      { title: 'Routing & data fetching', videoUrl: TECH.js3 },
    ],
    credits: PROVIDER_CREDITS['Keystone Web Guild'],
  },
  {
    title: 'Introduction to SQL & Databases',
    provider: 'Dept. of Data Science',
    category: 'Technical',
    level: 'Beginner',
    hours: 10,
    rating: 4.7,
    learners: 9040,
    color: 'ink',
    blurb: 'Query, filter, and join relational data with confidence.',
    modules: [
      {
        title: 'Querying with SELECT',
        videoUrl: TECH.python,
        quiz: [
          q('Which clause filters rows before grouping?', [
            ['WHERE', true],
            ['HAVING', false],
            ['GROUP BY', false],
            ['ORDER BY', false],
          ]),
          q('What does SELECT * do?', [
            ['Returns all columns', true],
            ['Returns all tables', false],
            ['Deletes all rows', false],
            ['Counts all rows', false],
          ]),
        ],
      },
      { title: 'Filtering & sorting', videoUrl: TECH.js1 },
      { title: 'Joins', videoUrl: TECH.js2 },
      { title: 'Aggregation & grouping', videoUrl: TECH.html },
    ],
    credits: PROVIDER_CREDITS['Dept. of Data Science'],
  },
  {
    title: 'Cloud Computing Foundations (AWS)',
    provider: 'Keystone DevOps Guild',
    category: 'Technical',
    level: 'Beginner',
    hours: 16,
    rating: 4.5,
    learners: 4310,
    color: 'gold',
    blurb:
      'Core cloud concepts and hands-on basics with compute, storage, and networking.',
    modules: [
      {
        title: 'Cloud concepts',
        videoUrl: TECH.js3,
        quiz: [
          q('What does "elasticity" mean in cloud computing?', [
            ['Automatically scaling resources up or down with demand', true],
            ['Physically moving servers', false],
            ['Encrypting all data at rest', false],
            ['Load testing an app', false],
          ]),
          q(
            'Which is a core benefit of cloud over on-premise infrastructure?',
            [
              ['Pay only for what you use', true],
              ['Zero cost', false],
              ['No internet required', false],
              ['Unlimited free storage', false],
            ],
          ),
        ],
      },
      { title: 'Compute & storage basics', videoUrl: TECH.python },
      { title: 'Networking essentials', videoUrl: TECH.js1 },
      { title: 'Cost & security basics', videoUrl: TECH.js2 },
    ],
    credits: PROVIDER_CREDITS['Keystone DevOps Guild'],
  },
  {
    title: 'DevOps & CI/CD Pipelines',
    provider: 'Keystone DevOps Guild',
    category: 'Technical',
    level: 'Intermediate',
    hours: 14,
    rating: 4.6,
    learners: 3980,
    color: 'ink',
    blurb:
      'Automate builds, tests, and deployments so releases stop being scary.',
    modules: [
      {
        title: 'CI/CD concepts',
        videoUrl: TECH.html,
        quiz: [
          q('What does "CI" stand for?', [
            ['Continuous Integration', true],
            ['Continuous Installation', false],
            ['Code Inspection', false],
            ['Cloud Infrastructure', false],
          ]),
          q("What's the main benefit of automating deployments?", [
            ['Fewer manual errors and faster releases', true],
            ['Lower code quality', false],
            ['No need for testing', false],
            ['Slower feedback loops', false],
          ]),
        ],
      },
      { title: 'Building a pipeline', videoUrl: TECH.js3 },
      { title: 'Automated testing in CI', videoUrl: TECH.python },
      { title: 'Deployment strategies', videoUrl: TECH.js1 },
    ],
    credits: PROVIDER_CREDITS['Keystone DevOps Guild'],
  },
  {
    title: 'Machine Learning Foundations',
    provider: 'Dept. of Data Science',
    category: 'Technical',
    level: 'Intermediate',
    hours: 20,
    rating: 4.8,
    learners: 7210,
    color: 'gold',
    blurb:
      'Regression, classification, and evaluation — the fundamentals before deep learning.',
    modules: [
      {
        title: 'Supervised vs unsupervised learning',
        videoUrl: TECH.js2,
        quiz: [
          q('In supervised learning, the training data includes:', [
            ['Labeled examples', true],
            ['Only raw features', false],
            ['Random noise', false],
            ['Unlabeled clusters', false],
          ]),
          q('Which is an example of an unsupervised learning task?', [
            ['Clustering customers by behavior', true],
            ['Predicting house prices', false],
            ['Classifying spam emails', false],
            ['Forecasting sales', false],
          ]),
        ],
      },
      { title: 'Regression & classification', videoUrl: TECH.html },
      { title: 'Model evaluation', videoUrl: TECH.js3 },
      { title: 'Overfitting & regularization', videoUrl: TECH.python },
    ],
    credits: PROVIDER_CREDITS['Dept. of Data Science'],
  },
  {
    title: 'Cybersecurity Essentials',
    provider: 'Keystone Security Lab',
    category: 'Technical',
    level: 'Beginner',
    hours: 12,
    rating: 4.6,
    learners: 5540,
    color: 'ink',
    blurb:
      'Common threats, access control, and the basics of securing a web app.',
    modules: [
      {
        title: 'Threats & attack vectors',
        videoUrl: TECH.js1,
        quiz: [
          q('What is "phishing"?', [
            ['Tricking someone into revealing sensitive information', true],
            ['A type of firewall', false],
            ['A password hashing algorithm', false],
            ['A network protocol', false],
          ]),
          q('What does "least privilege" mean?', [
            ['Giving users only the access they need', true],
            ['Giving everyone admin rights', false],
            ['Disabling all logging', false],
            ['Using the weakest password policy', false],
          ]),
        ],
      },
      { title: 'Authentication & access control', videoUrl: TECH.js2 },
      { title: 'Securing web applications', videoUrl: TECH.html },
      { title: 'Incident response basics', videoUrl: TECH.js3 },
    ],
    credits: PROVIDER_CREDITS['Keystone Security Lab'],
  },
  {
    title: 'Git & Version Control for Teams',
    provider: 'Keystone DevOps Guild',
    category: 'Technical',
    level: 'Beginner',
    hours: 6,
    rating: 4.7,
    learners: 11200,
    color: 'gold',
    blurb:
      'Branching, pull requests, and resolving conflicts without the panic.',
    modules: [
      {
        title: 'Git basics',
        videoUrl: TECH.python,
        quiz: [
          q('What does "git commit" do?', [
            ['Saves a snapshot of staged changes', true],
            ['Uploads code to a website', false],
            ['Deletes the working directory', false],
            ['Creates a new repository', false],
          ]),
          q('What is a "branch" in Git?', [
            ['An independent line of development', true],
            ['A backup of the whole repo', false],
            ['A type of merge conflict', false],
            ['A remote server', false],
          ]),
        ],
      },
      { title: 'Branching & merging', videoUrl: TECH.js1 },
      { title: 'Pull requests & code review', videoUrl: TECH.js2 },
      { title: 'Resolving conflicts', videoUrl: TECH.html },
    ],
    credits: PROVIDER_CREDITS['Keystone DevOps Guild'],
  },
  {
    title: 'Backend Engineering with Node.js',
    provider: 'Keystone Web Guild',
    category: 'Technical',
    level: 'Intermediate',
    hours: 16,
    rating: 4.6,
    learners: 4890,
    color: 'ink',
    blurb:
      'Build REST APIs with Express, talk to a database, and add authentication.',
    modules: [
      {
        title: 'Node.js & npm basics',
        videoUrl: TECH.js3,
        quiz: [
          q('What is npm primarily used for?', [
            ['Managing JavaScript packages and dependencies', true],
            ['Compiling CSS', false],
            ['Hosting websites', false],
            ['Running unit tests only', false],
          ]),
          q('Node.js runs JavaScript:', [
            ['Outside the browser, on a server', true],
            ['Only inside Chrome', false],
            ['Only on mobile devices', false],
            ['Only at compile time', false],
          ]),
        ],
      },
      { title: 'Building REST APIs with Express', videoUrl: TECH.python },
      { title: 'Working with databases', videoUrl: TECH.js1 },
      { title: 'Authentication & middleware', videoUrl: TECH.js2 },
    ],
    credits: PROVIDER_CREDITS['Keystone Web Guild'],
  },
  {
    title: 'Mobile App Development with Flutter',
    provider: 'Keystone Web Guild',
    category: 'Technical',
    level: 'Intermediate',
    hours: 18,
    rating: 4.5,
    learners: 3210,
    color: 'gold',
    blurb:
      'Build a real cross-platform app with Dart, widgets, and state management.',
    modules: [
      {
        title: 'Dart & Flutter basics',
        videoUrl: TECH.html,
        quiz: [
          q('Flutter apps are primarily written in:', [
            ['Dart', true],
            ['Swift', false],
            ['Kotlin', false],
            ['Python', false],
          ]),
          q('What is a "widget" in Flutter?', [
            ['A building block of the UI', true],
            ['A backend service', false],
            ['A database table', false],
            ['A build tool', false],
          ]),
        ],
      },
      { title: 'Widgets & layout', videoUrl: TECH.js3 },
      { title: 'State management', videoUrl: TECH.python },
      { title: 'Publishing your app', videoUrl: TECH.js1 },
    ],
    credits: PROVIDER_CREDITS['Keystone Web Guild'],
  },
  {
    title: 'API Design & REST Fundamentals',
    provider: 'Keystone Web Guild',
    category: 'Technical',
    level: 'Beginner',
    hours: 8,
    rating: 4.5,
    learners: 2980,
    color: 'ink',
    blurb:
      'Resources, verbs, status codes, and versioning — designing APIs people enjoy using.',
    modules: [
      {
        title: 'REST principles',
        videoUrl: TECH.js2,
        quiz: [
          q('REST APIs are typically:', [
            ['Stateless between requests', true],
            ['Always stateful', false],
            ['Only usable over FTP', false],
            ['Limited to XML payloads', false],
          ]),
          q(
            'Which HTTP verb is conventionally used to update an existing resource?',
            [
              ['PUT or PATCH', true],
              ['GET', false],
              ['OPTIONS', false],
              ['HEAD', false],
            ],
          ),
        ],
      },
      { title: 'Resources & HTTP verbs', videoUrl: TECH.html },
      { title: 'Status codes & error handling', videoUrl: TECH.js3 },
      { title: 'Versioning & documentation', videoUrl: TECH.python },
    ],
    credits: PROVIDER_CREDITS['Keystone Web Guild'],
  },

  // ---------------- BUSINESS (13) ----------------
  {
    title: 'Product Analytics Fundamentals',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 10,
    rating: 4.7,
    learners: 6210,
    color: 'success',
    blurb:
      'Read a funnel, run an A/B test, and turn dashboards into decisions.',
    modules: [
      {
        title: 'Metrics that matter',
        videoUrl: TALK.creativity,
        quiz: [
          q('A "vanity metric" is one that:', [
            ["Looks good but doesn't drive decisions", true],
            ['Directly measures revenue', false],
            ['Is always misleading', false],
            ['Only applies to marketing', false],
          ]),
          q('What does "retention rate" measure?', [
            ['The share of users who come back over time', true],
            ['Total signups', false],
            ['Page load speed', false],
            ['Ad click-through rate', false],
          ]),
        ],
      },
      { title: 'Funnels & retention', videoUrl: TALK.jobs },
      { title: 'Running experiments', videoUrl: TALK.listen },
      { title: 'Presenting findings', videoUrl: TALK.stress1 },
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Sample dashboards built with anonymized, synthetic data',
      'Experiment design framework adapted with permission from course advisors',
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
    blurb:
      'Prepare, anchor, and close — a short course for everyday negotiations.',
    modules: [
      {
        title: 'Preparing your position',
        videoUrl: TALK.howToSpeak,
        quiz: [
          q('What is a BATNA?', [
            ['Your Best Alternative To a Negotiated Agreement', true],
            ['A type of contract clause', false],
            ['A pricing model', false],
            ['A negotiation tactic banned in most countries', false],
          ]),
          q('Why is "anchoring" effective in negotiation?', [
            [
              'The first number mentioned strongly influences the outcome',
              true,
            ],
            ['It ends the negotiation immediately', false],
            ['It guarantees a fair deal', false],
            ["It's illegal so opponents concede faster", false],
          ]),
        ],
      },
      { title: 'Anchoring & concessions', videoUrl: TALK.soundSmart },
      { title: 'Closing the deal', videoUrl: TALK.stress2 },
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Negotiation scenarios developed in-house for classroom use',
      'Icon set: Lucide (ISC License)',
    ],
  },
  {
    title: 'Financial Literacy for Managers',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 8,
    rating: 4.6,
    learners: 5420,
    color: 'success',
    blurb:
      'Read a P&L, build a budget, and make the business case with confidence.',
    modules: [
      {
        title: 'Reading a P&L statement',
        videoUrl: TALK.sinek,
        quiz: [
          q('What does "P&L" stand for?', [
            ['Profit and Loss', true],
            ['Payroll and Liabilities', false],
            ['Price and Leverage', false],
            ['Planning and Logistics', false],
          ]),
          q('Gross margin is calculated as:', [
            ['(Revenue − Cost of Goods Sold) ÷ Revenue', true],
            ['Revenue ÷ Total Costs', false],
            ['Net Income ÷ Revenue', false],
            ['Total Assets − Total Liabilities', false],
          ]),
        ],
      },
      { title: 'Budgeting basics', videoUrl: TALK.bodyLanguage },
      { title: 'Understanding cash flow', videoUrl: TALK.vulnerability },
      { title: 'Making the business case', videoUrl: TALK.creativity },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Marketing Strategy Foundations',
    provider: 'Keystone Growth Academy',
    category: 'Business',
    level: 'Beginner',
    hours: 10,
    rating: 4.5,
    learners: 4870,
    color: 'success',
    blurb:
      'Positioning, messaging, and channel strategy — the fundamentals before campaigns.',
    modules: [
      {
        title: 'Understanding your market',
        videoUrl: TALK.jobs,
        quiz: [
          q('A "target market" is:', [
            ['The specific group of customers a product is designed for', true],
            ['Every possible customer', false],
            ['Only existing customers', false],
            ["A competitor's customer base", false],
          ]),
          q('What is market segmentation used for?', [
            ['Grouping customers by shared characteristics', true],
            ['Increasing prices', false],
            ['Reducing product features', false],
            ['Hiding a product from competitors', false],
          ]),
        ],
      },
      { title: 'Positioning & messaging', videoUrl: TALK.listen },
      { title: 'Channel strategy', videoUrl: TALK.stress1 },
      { title: 'Measuring what matters', videoUrl: TALK.howToSpeak },
    ],
    credits: PROVIDER_CREDITS['Keystone Growth Academy'],
  },
  {
    title: 'Agile Project Management',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Intermediate',
    hours: 12,
    rating: 4.6,
    learners: 6740,
    color: 'success',
    blurb:
      'Scrum roles, sprint planning, and retrospectives that actually improve the team.',
    modules: [
      {
        title: 'Agile principles',
        videoUrl: TALK.soundSmart,
        quiz: [
          q('Agile favors:', [
            ['Responding to change over following a rigid plan', true],
            ['Long fixed release cycles', false],
            ['No customer feedback until launch', false],
            ['Detailed upfront specs with no changes allowed', false],
          ]),
          q('A "sprint" in Scrum is:', [
            ['A fixed, short time-boxed period of work', true],
            ['An unlimited work period', false],
            ['A single meeting', false],
            ['A type of bug', false],
          ]),
        ],
      },
      { title: 'Scrum roles & ceremonies', videoUrl: TALK.stress2 },
      { title: 'Backlogs & sprint planning', videoUrl: TALK.sinek },
      {
        title: 'Retrospectives & continuous improvement',
        videoUrl: TALK.bodyLanguage,
      },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Business Writing That Gets Results',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 5,
    rating: 4.4,
    learners: 3890,
    color: 'success',
    blurb: 'Write emails and memos people actually read — and act on.',
    modules: [
      {
        title: 'Writing with clarity',
        videoUrl: TALK.vulnerability,
        quiz: [
          q('Which of these best improves clarity in business writing?', [
            ['Leading with the key point', true],
            ['Using more jargon', false],
            ['Longer sentences', false],
            ['Passive voice throughout', false],
          ]),
          q("What's a good rule of thumb for email length?", [
            ['As short as it can be while still being clear', true],
            ['Always over 500 words', false],
            ['Never more than one sentence', false],
            ["Match the recipient's word count", false],
          ]),
        ],
      },
      { title: 'Structuring emails & memos', videoUrl: TALK.creativity },
      { title: 'Persuasive writing basics', videoUrl: TALK.jobs },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Introduction to Digital Marketing',
    provider: 'Keystone Growth Academy',
    category: 'Business',
    level: 'Beginner',
    hours: 9,
    rating: 4.5,
    learners: 5980,
    color: 'success',
    blurb:
      'SEO, paid ads, and email — a practical tour of the core digital channels.',
    modules: [
      {
        title: 'Digital channels overview',
        videoUrl: TALK.listen,
        quiz: [
          q('What does "organic traffic" mean?', [
            ['Visitors who arrive without paid advertising', true],
            ['Traffic only from social media', false],
            ['Bot traffic', false],
            ['Traffic from paid ads only', false],
          ]),
          q('What is a "conversion" in digital marketing?', [
            ['A visitor completing a desired action', true],
            ['A page view', false],
            ['A blocked ad', false],
            ['A bounced session', false],
          ]),
        ],
      },
      { title: 'SEO basics', videoUrl: TALK.stress1 },
      { title: 'Paid advertising fundamentals', videoUrl: TALK.howToSpeak },
      { title: 'Email & lifecycle marketing', videoUrl: TALK.soundSmart },
    ],
    credits: PROVIDER_CREDITS['Keystone Growth Academy'],
  },
  {
    title: 'Sales Fundamentals',
    provider: 'Keystone Growth Academy',
    category: 'Business',
    level: 'Beginner',
    hours: 8,
    rating: 4.4,
    learners: 4210,
    color: 'success',
    blurb:
      'Discovery, objection handling, and closing — the basics of a real sales conversation.',
    modules: [
      {
        title: 'Understanding the buyer',
        videoUrl: TALK.stress2,
        quiz: [
          q('What is "qualifying" a lead?', [
            ["Assessing whether they're a good fit and ready to buy", true],
            ['Giving them a discount', false],
            ['Sending a contract immediately', false],
            ['Ending the conversation', false],
          ]),
          q('An "objection" in a sales conversation is:', [
            ['A concern the buyer raises before deciding', true],
            ['Always a rejection', false],
            ['A legal requirement', false],
            ['The final step of a sale', false],
          ]),
        ],
      },
      { title: 'Discovery & qualifying', videoUrl: TALK.sinek },
      { title: 'Handling objections', videoUrl: TALK.bodyLanguage },
      { title: 'Closing techniques', videoUrl: TALK.vulnerability },
    ],
    credits: PROVIDER_CREDITS['Keystone Growth Academy'],
  },
  {
    title: 'Customer Success Strategy',
    provider: 'Keystone Growth Academy',
    category: 'Business',
    level: 'Intermediate',
    hours: 10,
    rating: 4.5,
    learners: 2870,
    color: 'success',
    blurb:
      'Onboarding, health scores, and renewals — keeping customers past the first sale.',
    modules: [
      {
        title: 'Onboarding for retention',
        videoUrl: TALK.creativity,
        quiz: [
          q('"Time to value" refers to:', [
            ['How quickly a customer gets real benefit from a product', true],
            ['The length of a sales cycle', false],
            ['The cost of onboarding', false],
            ['The number of support tickets', false],
          ]),
          q('A "health score" in customer success typically combines:', [
            ['Usage, engagement, and support signals', true],
            ['Only revenue', false],
            ['Only NPS', false],
            ['Only contract length', false],
          ]),
        ],
      },
      { title: 'Measuring customer health', videoUrl: TALK.jobs },
      { title: 'Managing renewals & expansion', videoUrl: TALK.listen },
      { title: 'Reducing churn', videoUrl: TALK.stress1 },
    ],
    credits: PROVIDER_CREDITS['Keystone Growth Academy'],
  },
  {
    title: 'Business Model Design',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Intermediate',
    hours: 10,
    rating: 4.5,
    learners: 3120,
    color: 'success',
    blurb: 'Value propositions, revenue models, and the business model canvas.',
    modules: [
      {
        title: 'Value propositions',
        videoUrl: TALK.howToSpeak,
        quiz: [
          q('A strong value proposition clearly states:', [
            ['The specific problem you solve and for whom', true],
            ['Every feature of the product', false],
            ["The company's founding date", false],
            ['Internal org structure', false],
          ]),
          q('Which is an example of a subscription revenue model?', [
            ['Monthly recurring fee for access', true],
            ['One-time purchase', false],
            ['Bartering goods', false],
            ['Government grant', false],
          ]),
        ],
      },
      { title: 'Revenue models', videoUrl: TALK.soundSmart },
      { title: 'Cost structures', videoUrl: TALK.stress2 },
      { title: 'Mapping the business model canvas', videoUrl: TALK.sinek },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Data-Driven Decision Making',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Intermediate',
    hours: 9,
    rating: 4.6,
    learners: 3560,
    color: 'success',
    blurb:
      'Ask the right question, pick the right metric, and avoid common statistical traps.',
    modules: [
      {
        title: 'Framing the right question',
        videoUrl: TALK.bodyLanguage,
        quiz: [
          q('Correlation between two metrics means:', [
            [
              "They move together, but one doesn't necessarily cause the other",
              true,
            ],
            ['One definitely causes the other', false],
            ['They are unrelated', false],
            ['The data is invalid', false],
          ]),
          q('Why is sample size important in an experiment?', [
            ['Small samples can produce unreliable, noisy results', true],
            ['It has no effect on results', false],
            ['Larger samples are always wrong', false],
            ['It only matters for surveys', false],
          ]),
        ],
      },
      { title: 'Choosing the right metric', videoUrl: TALK.vulnerability },
      { title: 'Avoiding common statistical traps', videoUrl: TALK.creativity },
      { title: 'Communicating data to stakeholders', videoUrl: TALK.jobs },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Supply Chain Fundamentals',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 8,
    rating: 4.3,
    learners: 2140,
    color: 'success',
    blurb:
      'From raw materials to the customer — inventory, logistics, and supplier relationships.',
    modules: [
      {
        title: 'Supply chain basics',
        videoUrl: TALK.listen,
        quiz: [
          q('A supply chain includes:', [
            ['Every step from raw materials to the final customer', true],
            ['Only shipping', false],
            ['Only manufacturing', false],
            ['Only retail', false],
          ]),
          q('"Just-in-time" inventory aims to:', [
            ['Minimize stock by receiving goods only as needed', true],
            ['Maximize warehouse stock', false],
            ['Eliminate suppliers', false],
            ['Increase lead times', false],
          ]),
        ],
      },
      { title: 'Inventory management', videoUrl: TALK.stress1 },
      { title: 'Logistics & distribution', videoUrl: TALK.howToSpeak },
      { title: 'Managing supplier relationships', videoUrl: TALK.soundSmart },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Entrepreneurship Essentials',
    provider: 'Keystone Business School',
    category: 'Business',
    level: 'Beginner',
    hours: 12,
    rating: 4.6,
    learners: 5340,
    color: 'success',
    blurb: 'Validate an idea, build an MVP, and find product-market fit.',
    modules: [
      {
        title: 'Validating an idea',
        videoUrl: TALK.stress2,
        quiz: [
          q('An MVP is:', [
            [
              'The smallest version of a product that tests a core hypothesis',
              true,
            ],
            ['The final polished product', false],
            ['A legal document', false],
            ['A marketing slogan', false],
          ]),
          q('Why talk to potential customers before building a product?', [
            ['To validate whether the problem is real and worth solving', true],
            ["It's legally required", false],
            ['To finalize pricing', false],
            ['To hire your first employee', false],
          ]),
        ],
      },
      { title: 'Building a minimum viable product', videoUrl: TALK.sinek },
      { title: 'Fundraising basics', videoUrl: TALK.bodyLanguage },
      { title: 'Finding product-market fit', videoUrl: TALK.vulnerability },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },

  // ---------------- LEADERSHIP (13) ----------------
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
    modules: [
      {
        title: 'Setting direction',
        videoUrl: TALK.creativity,
        quiz: [
          q('A clear team goal should be:', [
            ['Specific and measurable', true],
            ['Vague enough to allow any outcome', false],
            ['Set only by senior leadership', false],
            ['Reviewed once a year', false],
          ]),
          q('Why does delegation matter for a leader?', [
            [
              'It builds team capability and frees the leader for higher-leverage work',
              true,
            ],
            ["It reduces the leader's accountability", false],
            ['Only needed for large teams', false],
            ['It replaces the need for feedback', false],
          ]),
        ],
      },
      { title: 'Delegation & trust', videoUrl: TALK.jobs },
      { title: 'Feedback that lands', videoUrl: TALK.listen },
      { title: 'Running effective 1:1s', videoUrl: TALK.stress1 },
    ],
    credits: [
      'Curriculum & instruction: Keystone Business School faculty',
      'Frameworks drawn from published leadership research, cited in-course',
      "Role-play scenarios developed with Keystone's coaching partners",
    ],
  },
  {
    title: 'Coaching & Mentoring Skills',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 8,
    rating: 4.6,
    learners: 3210,
    color: 'coral',
    blurb:
      'Ask better questions, listen actively, and help others find their own answers.',
    modules: [
      {
        title: 'Coaching vs mentoring',
        videoUrl: TALK.howToSpeak,
        quiz: [
          q('Coaching typically focuses on:', [
            ['Helping someone find their own answers', true],
            ['Giving direct instructions only', false],
            ['Evaluating performance for a raise', false],
            ['Assigning tasks', false],
          ]),
          q('A "powerful question" in coaching is usually:', [
            ['Open-ended and thought-provoking', true],
            ['A yes/no question', false],
            ['Rhetorical', false],
            ["About the coach's own experience", false],
          ]),
        ],
      },
      { title: 'Asking powerful questions', videoUrl: TALK.soundSmart },
      { title: 'Active listening', videoUrl: TALK.stress2 },
      { title: 'Setting growth goals', videoUrl: TALK.sinek },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Conflict Resolution at Work',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 6,
    rating: 4.5,
    learners: 2890,
    color: 'coral',
    blurb:
      'De-escalate tension and facilitate conversations that actually resolve things.',
    modules: [
      {
        title: 'Understanding conflict styles',
        videoUrl: TALK.bodyLanguage,
        quiz: [
          q('Avoiding conflict entirely tends to:', [
            ['Let issues fester and resurface later', true],
            ['Always resolve the issue quietly', false],
            ['Improve trust immediately', false],
            ['Have no long-term effect', false],
          ]),
          q('A "win-win" approach to conflict aims to:', [
            [
              "Find a solution that addresses both parties' underlying needs",
              true,
            ],
            ['Ensure one side loses less', false],
            ['Avoid discussing the issue', false],
            ['Let a manager decide unilaterally', false],
          ]),
        ],
      },
      { title: 'De-escalating tension', videoUrl: TALK.vulnerability },
      {
        title: 'Facilitating a resolution conversation',
        videoUrl: TALK.creativity,
      },
      { title: 'Following up after conflict', videoUrl: TALK.jobs },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Strategic Thinking for Leaders',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Advanced',
    hours: 9,
    rating: 4.6,
    learners: 2430,
    color: 'coral',
    blurb:
      'Systems thinking, prioritization, and anticipating second-order effects.',
    modules: [
      {
        title: 'Thinking in systems',
        videoUrl: TALK.listen,
        quiz: [
          q('Systems thinking encourages leaders to:', [
            ['Consider how parts of an organization affect each other', true],
            ['Focus only on isolated tasks', false],
            ['Ignore feedback loops', false],
            ['Make decisions without context', false],
          ]),
          q('A "second-order effect" is:', [
            [
              'An indirect consequence that follows from an initial decision',
              true,
            ],
            ['The very first outcome of a decision', false],
            ['Something with no real impact', false],
            ['A type of financial metric', false],
          ]),
        ],
      },
      { title: 'Prioritization frameworks', videoUrl: TALK.stress1 },
      { title: 'Anticipating second-order effects', videoUrl: TALK.howToSpeak },
      { title: 'Communicating strategy', videoUrl: TALK.soundSmart },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Emotional Intelligence at Work',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Beginner',
    hours: 7,
    rating: 4.7,
    learners: 5210,
    color: 'coral',
    blurb:
      'Self-awareness, empathy, and managing your reactions under pressure.',
    modules: [
      {
        title: 'Self-awareness',
        videoUrl: TALK.stress2,
        quiz: [
          q('Self-awareness at work involves:', [
            ['Recognizing your own emotions and how they affect others', true],
            ['Ignoring your emotions entirely', false],
            ["Only tracking others' emotions", false],
            ['Suppressing all feedback', false],
          ]),
          q('Emotional intelligence is generally considered:', [
            ['A skill that can be developed with practice', true],
            ["A fixed trait you're born with", false],
            ['Irrelevant to leadership', false],
            ['Only useful in customer service roles', false],
          ]),
        ],
      },
      { title: 'Managing your reactions', videoUrl: TALK.sinek },
      { title: 'Reading the room', videoUrl: TALK.bodyLanguage },
      { title: 'Building empathy', videoUrl: TALK.vulnerability },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Change Management Essentials',
    provider: 'Keystone Business School',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 8,
    rating: 4.5,
    learners: 3020,
    color: 'coral',
    blurb:
      'Why change efforts fail, and how to build one that actually sticks.',
    modules: [
      {
        title: 'Why change efforts fail',
        videoUrl: TALK.creativity,
        quiz: [
          q('A common reason change initiatives fail is:', [
            ['Lack of clear, consistent communication about the "why"', true],
            ['Too much communication', false],
            ['Moving too slowly', false],
            ['Involving employees too early', false],
          ]),
          q('Resistance to change is usually best handled by:', [
            ['Understanding and addressing the underlying concern', true],
            ['Ignoring it until it goes away', false],
            ['Mandating compliance with no explanation', false],
            ['Punishing dissent', false],
          ]),
        ],
      },
      { title: 'Building a change narrative', videoUrl: TALK.jobs },
      { title: 'Managing resistance', videoUrl: TALK.listen },
      { title: 'Sustaining new behaviors', videoUrl: TALK.stress1 },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Building Inclusive Teams',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 7,
    rating: 4.7,
    learners: 3980,
    color: 'coral',
    blurb: 'Understand bias, hire inclusively, and build psychological safety.',
    modules: [
      {
        title: 'Understanding bias',
        videoUrl: TALK.howToSpeak,
        quiz: [
          q('"Unconscious bias" refers to:', [
            [
              'Automatic judgments formed outside our conscious awareness',
              true,
            ],
            ['Deliberate discrimination', false],
            ['A formal HR policy', false],
            ['A type of performance review', false],
          ]),
          q('Psychological safety on a team means:', [
            ['People feel safe to speak up without fear of punishment', true],
            ['Everyone always agrees', false],
            ['No feedback is ever given', false],
            ['Conflict is avoided entirely', false],
          ]),
        ],
      },
      { title: 'Inclusive hiring practices', videoUrl: TALK.soundSmart },
      { title: 'Creating psychological safety', videoUrl: TALK.stress2 },
      { title: 'Equitable recognition & growth', videoUrl: TALK.sinek },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Public Speaking & Executive Presence',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 6,
    rating: 4.6,
    learners: 4670,
    color: 'coral',
    blurb:
      'Structure a message, manage nerves, and handle Q&A with confidence.',
    modules: [
      {
        title: 'Structuring a message',
        videoUrl: TALK.bodyLanguage,
        quiz: [
          q('A strong presentation opening should:', [
            ['Grab attention and state the core message early', true],
            ['Start with a long list of credentials', false],
            ["Apologize for taking people's time", false],
            ['Bury the main point until the end', false],
          ]),
          q("What's a reliable way to reduce speaking nerves?", [
            ['Thorough preparation and practice', true],
            ['Avoiding eye contact', false],
            ['Speaking as fast as possible', false],
            ['Memorizing word-for-word with no flexibility', false],
          ]),
        ],
      },
      { title: 'Managing nerves', videoUrl: TALK.vulnerability },
      { title: 'Body language & delivery', videoUrl: TALK.creativity },
      { title: 'Handling Q&A', videoUrl: TALK.jobs },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Time Management for Leaders',
    provider: 'Keystone Business School',
    category: 'Leadership',
    level: 'Beginner',
    hours: 5,
    rating: 4.4,
    learners: 4390,
    color: 'coral',
    blurb: 'Prioritize what matters and protect focus time on a busy calendar.',
    modules: [
      {
        title: 'Prioritization frameworks',
        videoUrl: TALK.listen,
        quiz: [
          q('The Eisenhower Matrix sorts tasks by:', [
            ['Urgency and importance', true],
            ['Alphabetical order', false],
            ['Who assigned them', false],
            ['How long they take', false],
          ]),
          q('"Deep work" generally refers to:', [
            [
              'Focused, uninterrupted work on cognitively demanding tasks',
              true,
            ],
            ['Multitasking across many small tasks', false],
            ['Any work done after hours', false],
            ['Only physical labor', false],
          ]),
        ],
      },
      { title: 'Protecting focus time', videoUrl: TALK.stress1 },
      { title: 'Delegation as a time tool', videoUrl: TALK.howToSpeak },
      { title: 'Managing your calendar', videoUrl: TALK.soundSmart },
    ],
    credits: PROVIDER_CREDITS['Keystone Business School'],
  },
  {
    title: 'Giving and Receiving Feedback',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Beginner',
    hours: 5,
    rating: 4.6,
    learners: 4980,
    color: 'coral',
    blurb:
      "Structure feedback that's specific and kind — and take it well yourself.",
    modules: [
      {
        title: 'Why feedback is hard',
        videoUrl: TALK.stress2,
        quiz: [
          q("Feedback is most effective when it's:", [
            ['Specific, timely, and focused on behavior', true],
            ['Vague and delivered months later', false],
            ['Focused on personality traits', false],
            ['Given only during annual reviews', false],
          ]),
          q('A good way to receive feedback is to:', [
            ['Listen fully before responding or defending', true],
            ['Interrupt to explain immediately', false],
            ['Dismiss feedback you disagree with', false],
            ['Avoid asking clarifying questions', false],
          ]),
        ],
      },
      { title: 'Structuring constructive feedback', videoUrl: TALK.sinek },
      { title: 'Receiving feedback well', videoUrl: TALK.bodyLanguage },
      { title: 'Building a feedback habit', videoUrl: TALK.vulnerability },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Leading Remote & Hybrid Teams',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Intermediate',
    hours: 7,
    rating: 4.5,
    learners: 3650,
    color: 'coral',
    blurb:
      'Communication norms, trust, and measuring outcomes instead of hours online.',
    modules: [
      {
        title: 'Remote communication norms',
        videoUrl: TALK.creativity,
        quiz: [
          q('Clear async communication norms help remote teams by:', [
            ['Reducing ambiguity about response times and expectations', true],
            ['Eliminating the need for meetings entirely', false],
            ['Requiring everyone to be online 24/7', false],
            ['Replacing all writing with video calls', false],
          ]),
          q(
            "For distributed teams, it's generally better to measure performance by:",
            [
              ['Outcomes and results', true],
              ['Hours spent logged in', false],
              ['Number of messages sent', false],
              ['Time zone overlap', false],
            ],
          ),
        ],
      },
      { title: 'Building trust without proximity', videoUrl: TALK.jobs },
      { title: 'Running effective virtual meetings', videoUrl: TALK.listen },
      { title: 'Measuring outcomes, not hours', videoUrl: TALK.stress1 },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Decision-Making Under Uncertainty',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Advanced',
    hours: 8,
    rating: 4.6,
    learners: 2760,
    color: 'coral',
    blurb:
      'Frame decisions, weigh incomplete information, and avoid common biases.',
    modules: [
      {
        title: 'Framing decisions under uncertainty',
        videoUrl: TALK.howToSpeak,
        quiz: [
          q('A "reversible" decision is generally best made:', [
            ['Quickly, since mistakes are cheap to correct', true],
            ['Only after months of analysis', false],
            ['Never, without full certainty', false],
            ['By committee only', false],
          ]),
          q('Confirmation bias leads decision-makers to:', [
            ['Favor information that supports what they already believe', true],
            ['Weigh all evidence equally', false],
            ['Always choose the riskiest option', false],
            ['Ignore their own opinions', false],
          ]),
        ],
      },
      { title: 'Weighing incomplete information', videoUrl: TALK.soundSmart },
      { title: 'Avoiding common biases', videoUrl: TALK.stress2 },
      { title: 'Deciding and committing', videoUrl: TALK.sinek },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
  {
    title: 'Building a Coaching Culture',
    provider: 'Global Leadership Institute',
    category: 'Leadership',
    level: 'Advanced',
    hours: 9,
    rating: 4.7,
    learners: 2340,
    color: 'coral',
    blurb:
      'Train managers to coach, and embed it into how the team actually works.',
    modules: [
      {
        title: 'What a coaching culture looks like',
        videoUrl: TALK.bodyLanguage,
        quiz: [
          q('In a coaching culture, managers primarily:', [
            [
              'Ask questions that help others grow, rather than just giving answers',
              true,
            ],
            ['Make every decision for their team', false],
            ['Avoid all feedback conversations', false],
            ['Focus only on quarterly reviews', false],
          ]),
          q('A key sign of a strong coaching culture is:', [
            ['Employees regularly seek and act on feedback', true],
            ['No one ever disagrees', false],
            ['Managers are rarely available', false],
            ['Coaching happens once a year', false],
          ]),
        ],
      },
      { title: 'Training managers to coach', videoUrl: TALK.vulnerability },
      { title: 'Embedding coaching in routines', videoUrl: TALK.creativity },
      { title: 'Measuring culture change', videoUrl: TALK.jobs },
    ],
    credits: PROVIDER_CREDITS['Global Leadership Institute'],
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Each course is its own transaction (rather than one giant 40-course
// transaction, or the original one-auto-commit-per-.save() behavior).
// This fixes a real failure seen while seeding: a dropped connection
// ("Connection terminated unexpectedly" — cloud Postgres closing an idle
// connection mid-script, see the keepAlive fix in data-source.ts) partway
// through a course used to leave that course half-written (e.g. the
// course + modules rows committed, but its quiz/credits/faqs missing) —
// worse, the "skip if any courses exist" guard below then blocked any
// retry from fixing it without a full wipe. Per-course transactions make
// a mid-course failure atomic (that course rolls back cleanly), and the
// retry wrapper absorbs a transient drop without losing everything
// already seeded.
async function seedCourseWithRetry(
  sample: SeedCourse,
  attempt = 1,
): Promise<void> {
  try {
    await AppDataSource.transaction(async (manager) => {
      const course = await manager.save(
        manager.create(Course, {
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

      const modules = await manager.save(
        sample.modules.map((m, index) =>
          manager.create(CourseModule, {
            course,
            position: index,
            title: m.title,
            videoUrl: m.videoUrl,
          }),
        ),
      );

      let quizCount = 0;
      for (let i = 0; i < sample.modules.length; i++) {
        const quiz = sample.modules[i].quiz;
        if (!quiz) continue;

        for (let qi = 0; qi < quiz.length; qi++) {
          const question = await manager.save(
            manager.create(QuizQuestion, {
              module: modules[i],
              question: quiz[qi].question,
              position: qi,
            }),
          );

          await manager.save(
            quiz[qi].options.map((opt, oi) =>
              manager.create(QuizOption, {
                question,
                optionText: opt.text,
                isCorrect: opt.correct,
                position: oi,
              }),
            ),
          );
        }
        quizCount++;
      }

      const credits = sample.credits.map((line, index) =>
        manager.create(CourseCredit, { course, position: index, line }),
      );
      await manager.save(credits);

      const faqs = CATEGORY_FAQS[sample.category].map((faq, index) =>
        manager.create(CourseFaq, {
          course,
          position: index,
          question: faq.question,
          answer: faq.answer,
        }),
      );
      await manager.save(faqs);

      console.log(
        `Seeded "${sample.title}" — ${modules.length} modules, ${quizCount} with quizzes.`,
      );
    });
  } catch (err) {
    if (attempt >= 3) throw err;
    console.warn(
      `  "${sample.title}" failed (attempt ${attempt}/3) — ${(err as Error).message}. Retrying...`,
    );
    await sleep(1000 * attempt);
    await seedCourseWithRetry(sample, attempt + 1);
  }
}

async function seed() {
  await AppDataSource.initialize();

  const courseRepo = AppDataSource.getRepository(Course);

  const existingCount = await courseRepo.count();
  if (existingCount > 0) {
    console.log(
      `Skipping seed: ${existingCount} course(s) already exist. This script only seeds an empty table — run the #144 wipe script first if you want to reseed.`,
    );
    await AppDataSource.destroy();
    return;
  }

  for (const sample of SAMPLE_COURSES) {
    await seedCourseWithRetry(sample);
  }

  console.log(`Done. Seeded ${SAMPLE_COURSES.length} courses.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
