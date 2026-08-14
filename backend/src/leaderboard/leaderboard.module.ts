import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { Profile } from '../profiles/entities/profile.entity';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    // #231/#246 — reuses ActivityService.getWeeklyPointsForUsers for the
    // ranking metric, same cross-module export pattern as every other
    // module that consumes ActivityService/BadgesService/etc.
    ActivityModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
