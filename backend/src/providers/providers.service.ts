import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Provider } from './entities/provider.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { JoinProviderDto } from './dto/join-provider.dto';
import { ProviderDetailDto } from './dto/provider-detail.dto';

// Excludes visually-ambiguous characters (0/O, 1/I/L) — this code gets
// read off a screen and typed back in by a second person.
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 5;

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepo: Repository<Provider>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async create(userId: string, dto: CreateProviderDto): Promise<Provider> {
    const profile = await this.getProfileOrThrow(userId);

    if (profile.providerId) {
      throw new ConflictException(
        'You already belong to a provider — leave it first',
      );
    }

    const inviteCode = await this.generateUniqueInviteCode();

    const provider = await this.providersRepo.save(
      this.providersRepo.create({
        name: dto.name,
        inviteCode,
        ownerId: userId,
      }),
    );

    profile.providerId = provider.id;
    await this.profilesRepo.save(profile);

    return provider;
  }

  // Owner-only, independent of current membership — see AddProviderOwnerId
  // migration for why ownership isn't tied to profiles.provider_id.
  async regenerateInviteCode(userId: string): Promise<Provider> {
    const provider = await this.providersRepo.findOne({
      where: { ownerId: userId },
    });

    if (!provider) {
      throw new ForbiddenException(
        'Only the provider owner can regenerate the invite code',
      );
    }

    provider.inviteCode = await this.generateUniqueInviteCode();
    return this.providersRepo.save(provider);
  }

  async join(userId: string, dto: JoinProviderDto): Promise<Provider> {
    const profile = await this.getProfileOrThrow(userId);

    if (profile.providerId) {
      throw new ConflictException(
        'You already belong to a provider — leave it first',
      );
    }

    const provider = await this.providersRepo.findOne({
      where: { inviteCode: dto.inviteCode },
    });

    if (!provider) {
      throw new NotFoundException('Invalid invite code');
    }

    profile.providerId = provider.id;
    await this.profilesRepo.save(profile);

    return provider;
  }

  // Clears membership only. Ownership (Provider.ownerId) and any courses
  // already scoped to this provider (Course.providerId) are untouched —
  // agreed direction from the #118 design discussion: provider-scoped
  // course access shouldn't silently change out from under a course just
  // because a member's status changed later.
  async leave(userId: string): Promise<void> {
    const profile = await this.getProfileOrThrow(userId);

    if (!profile.providerId) {
      throw new ConflictException('You are not a member of a provider');
    }

    profile.providerId = null;
    await this.profilesRepo.save(profile);
  }

  async getMine(userId: string): Promise<ProviderDetailDto> {
    const profile = await this.getProfileOrThrow(userId);

    if (!profile.providerId) {
      throw new NotFoundException('You are not a member of a provider');
    }

    const provider = await this.providersRepo.findOne({
      where: { id: profile.providerId },
    });

    if (!provider) {
      throw new NotFoundException('You are not a member of a provider');
    }

    const members = await this.profilesRepo.find({
      where: { providerId: provider.id },
    });

    return {
      id: provider.id,
      name: provider.name,
      inviteCode: provider.inviteCode,
      ownerId: provider.ownerId,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        isOwner: member.id === provider.ownerId,
      })),
    };
  }

  private async getProfileOrThrow(userId: string): Promise<Profile> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const code = this.generateInviteCode();
      const existing = await this.providersRepo.findOne({
        where: { inviteCode: code },
      });
      if (!existing) {
        return code;
      }
    }

    throw new InternalServerErrorException(
      'Could not generate a unique invite code',
    );
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      code += INVITE_CODE_CHARS[randomInt(INVITE_CODE_CHARS.length)];
    }
    return code;
  }
}
