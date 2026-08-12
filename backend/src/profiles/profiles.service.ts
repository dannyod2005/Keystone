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
}
