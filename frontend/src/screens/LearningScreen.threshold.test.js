import { PASS_THRESHOLD_PCT } from "./LearningScreen";

// #254 — this value is intentionally duplicated in backend's
// enrollments.service.ts (PASS_THRESHOLD_PCT, same name) rather than
// imported from a shared module, since this CRA frontend and the
// NestJS backend have no shared build tooling between them (see the
// comment above the constant in LearningScreen.jsx). This test exists
// so that changing the value here — without changing it in the backend
// too — is caught by a test failure rather than silently drifting.
describe("LearningScreen PASS_THRESHOLD_PCT", () => {
  it("is 70, matching backend enrollments.service.ts PASS_THRESHOLD_PCT", () => {
    expect(PASS_THRESHOLD_PCT).toBe(70);
  });
});
