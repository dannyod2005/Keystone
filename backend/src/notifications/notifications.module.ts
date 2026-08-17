import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ForumPost } from '../forum/entities/forum-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Profile, ForumPost])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // #229 — ModulesModule imports this to call createForReply from
  // ModulesService.createPost, same cross-module reuse pattern as
  // ActivityModule/BadgesModule (both exporting their service for exactly
  // this reason).
  exports: [NotificationsService],
})
export class NotificationsModule {}
