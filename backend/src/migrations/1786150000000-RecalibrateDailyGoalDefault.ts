import { MigrationInterface, QueryRunner } from 'typeorm';

// #296 — the 300-point signup default (and the old 150/300/450/600/900
// SettingsScreen presets it anchored) was calibrated on the flat
// per-action point values (view/quiz/note/post — all 30-50 pts). It never
// accounted for module-completion points, which scale with course.hours
// and average ~1,350-1,578 pts per module across the real course
// catalog — so a brand-new signup's default goal was cleared by finishing
// a single module on almost every course, making the whole "daily goal"
// concept a no-op until a learner happened to raise it themselves. See
// SettingsScreen's DAILY_GOAL_PRESETS comment (now 500/1000/1500/2200/3000)
// for the full recalibration this default is matched to.
//
// Two things to update, same as RenameProfilesDailyGoalMinToPoints did for
// the 30->300 change: the column's real Postgres DEFAULT (for any insert
// path that doesn't explicitly supply the value), and handle_new_user()'s
// hardcoded literal (what every real signup — Google or email/password —
// actually gets, since profile rows are always created through this
// trigger, not by relying on the column default).
export class RecalibrateDailyGoalDefault1786150000000 implements MigrationInterface {
  name = 'RecalibrateDailyGoalDefault1786150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "daily_goal_points" SET DEFAULT 1500;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          name,
          role,
          goal,
          streak,
          daily_goal_points
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          NEW.raw_user_meta_data->>'role',
          NULL,
          0,
          1500
        );

        RETURN NEW;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restores the pre-recalibration (300) definition for symmetry with
    // up() — matches the convention elsewhere in this migration set of
    // down() recreating the exact prior function body, not a "better" one.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          name,
          role,
          goal,
          streak,
          daily_goal_points
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          NEW.raw_user_meta_data->>'role',
          NULL,
          0,
          300
        );

        RETURN NEW;
      END;
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "daily_goal_points" SET DEFAULT 300;
    `);
  }
}
