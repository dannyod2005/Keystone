import { IsIn } from 'class-validator';

// #186 — separate DTO/endpoint from UpdateProfileDto's goal rather than
// folding `role` into it: goal is always-optional-in-spirit onboarding
// fluff, role is the value RequireTrainerGuard actually authorizes against,
// so keeping it a distinct, narrowly-scoped write path makes it obvious
// this one has real access-control weight.
const ROLES = ['learner', 'trainer'];

export class UpdateRoleDto {
  @IsIn(ROLES)
  role: string;
}
