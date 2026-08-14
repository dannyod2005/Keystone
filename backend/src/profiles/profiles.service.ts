import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async getMine(userId: string): Promise<Profile> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  // #107 — the one-tap onboarding modal is the only caller today (sets
  // `goal` to one of the three interest categories right after a learner
  // signs up), but this stays general-purpose ("update your own profile")
  // rather than a goal-specific method, matching getMine's reasoning above.
  async updateGoal(userId: string, goal: string): Promise<Profile> {
    const profile = await this.getMine(userId);
    profile.goal = goal;
    return this.profilesRepo.save(profile);
  }

  // #186 — the Google sign-in role-picker's write path. `role` starts NULL
  // for a Google sign-up (no role in its OAuth metadata — see the
  // MakeProfileRoleNullable migration), so this is what turns "picked
  // learner/trainer" into the value RequireTrainerGuard actually checks.
  // Same general-purpose reasoning as updateGoal above.
  async updateRole(userId: string, role: string): Promise<Profile> {
    const profile = await this.getMine(userId);
    profile.role = role;
    return this.profilesRepo.save(profile);
  }

  // #188 — the DB already had a per-learner dailyGoalMin column; nothing
  // ever wrote to it, and ActivityService.getSummary ignored it too (see
  // that fix). This is the write side — DashboardScreen's inline editor
  // calls it directly, no onboarding-modal step needed.
  async updateDailyGoal(
    userId: string,
    dailyGoalMin: number,
  ): Promise<Profile> {
    const profile = await this.getMine(userId);
    profile.dailyGoalMin = dailyGoalMin;
    return this.profilesRepo.save(profile);
  }

  // #231 — a profile settings toggle for the leaderboard. Same
  // general-purpose "update your own profile" shape as updateGoal/
  // updateRole/updateDailyGoal above; LeaderboardService is the only
  // reader of this column, filtering opted-in profiles directly rather
  // than trusting the frontend to hide opted-out learners.
  async updateLeaderboardOptIn(
    userId: string,
    optIn: boolean,
  ): Promise<Profile> {
    const profile = await this.getMine(userId);
    profile.leaderboardOptIn = optIn;
    return this.profilesRepo.save(profile);
  }
}
