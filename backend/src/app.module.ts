import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseAuthGuard],
})
export class AppModule {}
