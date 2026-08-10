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
}
