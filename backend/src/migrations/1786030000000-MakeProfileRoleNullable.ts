import { MigrationInterface, QueryRunner } from 'typeorm';

// #186 — Google sign-in has no form step to pick learner vs. trainer before
// the OAuth redirect (unlike email signup's role toggle), so a Google
// sign-up's raw_user_meta_data never carries a `role` key. handle_new_user()
// previously papered over that with COALESCE(..., 'learner'), which would
// have silently made every Google sign-up a learner with no way to tell
// "never chosen" apart from "explicitly chose learner" — the same gap
// `goal` already solves by staying NULL until the onboarding modal (#107)
// sets it. This migration gives `role` the same nullable "unset" sentinel
// so a post-login role-picker modal can key off `role === null` exactly
// the way GoalOnboardingModal keys off `goal === null`.
//
// Email signup is unaffected: AuthModal always sends a `role` in signUp()'s
// metadata, so those accounts get a non-null role from row creation same as
// before. Existing rows all already have 'learner' or 'trainer' from the old
// default, so no backfill is needed — only the column constraint and the
// trigger's fallback behavior change.
//
// RequireTrainerGuard already treats `profile.role !== 'trainer'` as
// unauthorized, which is correct as-is for `role === null` (an account that
// hasn't picked a role yet has no business hitting trainer-only endpoints).
export class MakeProfileRoleNullable1786030000000 implements MigrationInterface {
  name = 'MakeProfileRoleNullable1786030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "role" DROP NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "role" DROP DEFAULT;
    `);

    // Re-point handle_new_user() at the raw metadata value with no
    // fallback — NULL when the signup provider didn't supply a role
    // (Google), same as name/goal already do.
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
          daily_goal_min
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          NEW.raw_user_meta_data->>'role',
          NULL,
          0,
          30
        );

        RETURN NEW;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the old default-to-'learner' trigger behaviour first, so any
    // NULL rows created in the meantime don't violate the NOT NULL we're
    // about to re-add.
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
          daily_goal_min
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'learner'),
          NULL,
          0,
          30
        );

        RETURN NEW;
      END;
      $$;
    `);

    await queryRunner.query(`
      UPDATE "profiles" SET "role" = 'learner' WHERE "role" IS NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "role" SET DEFAULT 'learner';
    `);
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "role" SET NOT NULL;
    `);
  }
}
