// One entry per module in a course, for the "Grades" overview (#82) —
// distinct from QuizResultDto (which is the per-question breakdown for a
// single module's quiz page). hasQuiz/taken are separate flags rather than
// inferring from total === 0, so a module with a genuinely empty quiz can
// never be misread as "answered".
export class ModuleQuizResultDto {
  moduleId: string;
  moduleTitle: string;
  hasQuiz: boolean;
  taken: boolean;
  score: number | null;
  total: number;
}
