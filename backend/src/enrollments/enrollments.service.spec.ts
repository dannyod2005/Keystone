import { computeCourseGrade, PASS_THRESHOLD_PCT } from './enrollments.service';
import { ModuleQuizResultDto } from '../quiz/dto/module-quiz-result.dto';

// #254 — this value is intentionally duplicated in frontend's
// LearningScreen.jsx (PASS_THRESHOLD_PCT, same name) rather than
// imported from a shared module, since this NestJS backend and the CRA
// frontend have no shared build tooling between them (see the comment
// above the constant in enrollments.service.ts). This test exists so
// that changing the value here — without changing it in the frontend
// too — is caught by a test failure rather than silently drifting.
describe('EnrollmentsService PASS_THRESHOLD_PCT', () => {
  it('is 70, matching frontend LearningScreen.jsx PASS_THRESHOLD_PCT', () => {
    expect(PASS_THRESHOLD_PCT).toBe(70);
  });
});

// #260 — direct coverage for the certificate pass/fail calculation
// (extracted from generateCertificate specifically so it's testable
// without going through real PDF generation — see the comment above
// computeCourseGrade in enrollments.service.ts). A silent bug here means
// a learner gets handed the wrong certificate tier, or a pass/fail
// determination that doesn't match what LearningScreen already showed
// them (#240).
describe('computeCourseGrade', () => {
  function moduleResult(
    overrides: Partial<ModuleQuizResultDto>,
  ): ModuleQuizResultDto {
    return {
      moduleId: 'm',
      moduleTitle: 'Module',
      hasQuiz: true,
      taken: true,
      score: 0,
      total: 0,
      ...overrides,
    };
  }

  it('returns a null grade and not-passed when there are no modules at all', () => {
    expect(computeCourseGrade([])).toEqual({
      courseGradePct: null,
      passed: false,
    });
  });

  it('returns a null grade when no module has a quiz', () => {
    const results = [
      moduleResult({ hasQuiz: false, taken: false, score: null, total: 0 }),
      moduleResult({ hasQuiz: false, taken: false, score: null, total: 0 }),
    ];

    expect(computeCourseGrade(results)).toEqual({
      courseGradePct: null,
      passed: false,
    });
  });

  it('excludes a module whose quiz exists but was never taken', () => {
    const results = [
      moduleResult({ hasQuiz: true, taken: false, score: null, total: 5 }),
    ];

    expect(computeCourseGrade(results)).toEqual({
      courseGradePct: null,
      passed: false,
    });
  });

  it('passes at exactly the threshold (70%)', () => {
    const results = [moduleResult({ score: 7, total: 10 })];

    const grade = computeCourseGrade(results);

    expect(grade.courseGradePct).toBe(70);
    expect(grade.passed).toBe(true);
  });

  it('does not pass one point below the threshold', () => {
    const results = [moduleResult({ score: 68, total: 100 })];

    const grade = computeCourseGrade(results);

    expect(grade.courseGradePct).toBe(68);
    expect(grade.passed).toBe(false);
  });

  it("pools score/total across modules rather than averaging each module's percentage", () => {
    // Module A: 1/1 (100%). Module B: 1/9 (~11%). A naive average of the
    // two percentages would be 55.5% (a pass); pooling raw counts first
    // — (1+1)/(1+9) = 20% — is the intended, and correctly failing,
    // behavior (matches CourseAnalyticsService's per-learner quiz
    // average and the frontend's #240 course grade, both pooled too).
    const results = [
      moduleResult({ score: 1, total: 1 }),
      moduleResult({ score: 1, total: 9 }),
    ];

    const grade = computeCourseGrade(results);

    expect(grade.courseGradePct).toBe(20);
    expect(grade.passed).toBe(false);
  });

  it('rounds a fractional percentage to the nearest whole number', () => {
    // 2/3 = 66.66...% -> rounds up to 67.
    const results = [moduleResult({ score: 2, total: 3 })];

    expect(computeCourseGrade(results).courseGradePct).toBe(67);
  });

  it('only pools taken-and-quizzed modules, ignoring untaken and quiz-less ones mixed in', () => {
    const results = [
      moduleResult({ score: 9, total: 10 }), // counted: 90%
      moduleResult({ hasQuiz: false, taken: false, score: null, total: 0 }), // ignored
      moduleResult({ hasQuiz: true, taken: false, score: null, total: 5 }), // ignored
    ];

    const grade = computeCourseGrade(results);

    expect(grade.courseGradePct).toBe(90);
    expect(grade.passed).toBe(true);
  });
});
