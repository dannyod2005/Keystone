import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ModulesModule } from './modules/modules.module';
import { ActivityModule } from './activity/activity.module';
import { ProvidersModule } from './providers/providers.module';
import { ProfilesModule } from './profiles/profiles.module';
import { BadgesModule } from './badges/badges.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // #261 — global, per-IP request throttling. There's no login/signup
    // brute-force surface of our own to defend (Supabase Auth owns that
    // entirely, off this backend), but every guarded request forces
    // SupabaseAuthGuard (see backend/src/auth/supabase-auth.guard.ts) to
    // make a live call to Supabase's Auth API before anything else runs,
    // and every route in this app is otherwise completely unthrottled.
    // 100 requests/minute per IP is generous enough not to bother a real
    // user clicking around the app, while still bounding how much load
    // an abusive client can put on both this backend and Supabase's API
    // through it.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: false,
        logging: ['query', 'error'],
      }),
    }),
    CoursesModule,
    EnrollmentsModule,
    ModulesModule,
    ActivityModule,
    ProvidersModule,
    ProfilesModule,
    BadgesModule,
    LearningPathsModule,
    NotificationsModule,
    BookmarksModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SupabaseAuthGuard,
    // #261 — applied globally (every route, guarded or not) via APP_GUARD
    // rather than per-controller opt-in, so a new controller/route added
    // later is throttled by default instead of silently falling outside
    // coverage the way SupabaseAuthGuard itself does today (that one is
    // still opt-in per controller, unchanged by this issue).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
