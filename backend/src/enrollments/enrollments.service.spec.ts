import { PASS_THRESHOLD_PCT } from './enrollments.service';

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
