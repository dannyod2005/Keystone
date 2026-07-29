/* ---------- sample data ---------- */

// ASSUMPTION: renamed COURSES -> INITIAL_COURSES because course data now
// lives in root-level React state (see KeystonePrototype) instead of this
// module-level constant, so trainer-authored adds/edits can trigger a
// re-render and show up immediately in learner-facing screens. This array
// is only the seed/default value passed to useState.
//
// ASSUMPTION: the existing course shape didn't have anywhere to store a
// per-module video or a per-course FAQ (the learner Learning screen just
// showed a static placeholder icon, and the FAQ in the detail modal was
// hardcoded, identical for every course). Two new OPTIONAL fields are
// added below so trainers have something to write to:
//   - videoUrls: string[] — same length/order as `agenda`, one embed URL
//     (YouTube/Vimeo/etc.) per module. Empty string = no video set yet.
//   - faq: { q: string, a: string }[] — optional; CourseDetailModal falls
//     back to the old static FAQ copy if a course doesn't have one, so
//     existing seed courses below don't need to be touched.
// Every other field (title, provider, category, level, hours, projects,
// rating, learners, color, blurb, agenda, modules, credits) is unchanged
// and reused as-is by the new trainer forms — no parallel schema.

export const INITIAL_COURSES = [
  {
    id: "c1", title: "AI Engineering with Claude", provider: "Anthropic Academy",
    category: "Technical", level: "Intermediate", hours: 24, projects: 13,
    rating: 4.9, learners: 2840, color: "ink",
    blurb: "Ship real projects with Claude — from prompting fundamentals to agentic tool use.",
    agenda: ["Prompting foundations", "Tool use & function calling", "Retrieval & context design", "Agents & evaluation", "Capstone project"],
    modules: 5,
    credits: [
      "Curriculum & instruction: Anthropic Academy teaching staff",
      "Case studies adapted from published Anthropic engineering write-ups",
      "Capstone rubric reviewed by Keystone's technical advisory board",
    ],
  },
  {
    id: "c2", title: "Python for Everybody", provider: "Dept. of Data Science",
    category: "Technical", level: "Beginner", hours: 32, projects: 5,
    rating: 4.8, learners: 18400, color: "gold",
    blurb: "A five-course path from first script to working with databases and APIs.",
    agenda: ["Getting started with Python", "Data structures", "Using web APIs", "Databases", "Capstone: visualize data"],
    modules: 5,
    credits: [
      "Curriculum & instruction: Dept. of Data Science faculty",
      "Practice datasets: public domain and CC-BY sources, cited per exercise",
      "Auto-graded exercises built on the open-source pytest framework",
    ],
  },
  {
    id: "c3", title: "Product Analytics Fundamentals", provider: "Keystone Business School",
    category: "Business", level: "Beginner", hours: 10, projects: 3,
    rating: 4.7, learners: 6210, color: "success",
    blurb: "Read a funnel, run an A/B test, and turn dashboards into decisions.",
    agenda: ["Metrics that matter", "Funnels & retention", "Running experiments", "Presenting findings"],
    modules: 4,
    credits: [
      "Curriculum & instruction: Keystone Business School faculty",
      "Sample dashboards built with anonymized, synthetic data",
      "Experiment design framework adapted with permission from course advisors",
    ],
  },
  {
    id: "c4", title: "Leading High-Performing Teams", provider: "Keystone Business School",
    category: "Leadership", level: "Advanced", hours: 8, projects: 2,
    rating: 4.6, learners: 4120, color: "coral",
    blurb: "Practical frameworks for feedback, delegation, and 1:1s that actually work.",
    agenda: ["Setting direction", "Delegation & trust", "Feedback that lands", "Running effective 1:1s"],
    modules: 4,
    credits: [
      "Curriculum & instruction: Keystone Business School faculty",
      "Frameworks drawn from published leadership research, cited in-course",
      "Role-play scenarios developed with Keystone's coaching partners",
    ],
  },
  {
    id: "c5", title: "Data Visualization with Python", provider: "Dept. of Data Science",
    category: "Technical", level: "Intermediate", hours: 14, projects: 4,
    rating: 4.8, learners: 5390, color: "gold",
    blurb: "Matplotlib, seaborn, and the design principles behind charts people trust.",
    agenda: ["Chart fundamentals", "Matplotlib & seaborn", "Design & annotation", "Capstone: a report"],
    modules: 4,
    credits: [
      "Curriculum & instruction: Dept. of Data Science faculty",
      "Built on the open-source Matplotlib and seaborn libraries",
      "Design principles adapted from public data-visualization style guides",
    ],
  },
  {
    id: "c6", title: "Negotiation Essentials", provider: "Keystone Business School",
    category: "Business", level: "Beginner", hours: 6, projects: 2,
    rating: 4.5, learners: 3010, color: "success",
    blurb: "Prepare, anchor, and close — a short course for everyday negotiations.",
    agenda: ["Preparing your position", "Anchoring & concessions", "Closing the deal"],
    modules: 3,
    credits: [
      "Curriculum & instruction: Keystone Business School faculty",
      "Negotiation scenarios developed in-house for classroom use",
      "Icon set: Lucide (ISC License)",
    ],
  },
];

export const ENROLLED_DEFAULT = [
  { courseId: "c1", progress: 0.62, status: "in-progress", lastAccessed: "Yesterday" },
  { courseId: "c3", progress: 1, status: "complete", lastAccessed: "3 days ago" },
  { courseId: "c5", progress: 0.2, status: "in-progress", lastAccessed: "Today" },
  { courseId: "c6", progress: 1, status: "complete", lastAccessed: "1 week ago" },
];

export const TESTIMONIALS = [
  { name: "Priya N.", role: "Product Manager", quote: "Finished the AI Engineering path in six weeks and shipped an internal tool the same month.", rating: 5 },
  { name: "Marcus T.", role: "Data Analyst", quote: "The Python path finally made data structures click. Clear pacing, real practice.", rating: 5 },
  { name: "Elena R.", role: "Team Lead", quote: "Short enough to finish between meetings, deep enough to actually change how I run 1:1s.", rating: 4 },
];

export const LEARNER = { name: "Alex Chen", goal: "AI Product Leadership", streak: 4, minutesThisWeek: 186, dailyGoalMin: 30, goalHitDays: 4 };
