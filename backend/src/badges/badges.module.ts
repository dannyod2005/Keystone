import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { UserBadge } from './entities/user-badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBadge])],
  controllers: [BadgesController],
  providers: [BadgesService],
  // #225 — EnrollmentsModule and ModulesModule both import this to call
  // BadgesService's evaluate* methods from their own trigger points
  // (course completion, quiz submission, forum post creation), same
  // cross-module reuse pattern as ModulesModule's own export (#82/#205).
  exports: [BadgesService],
})
export class BadgesModule {}
