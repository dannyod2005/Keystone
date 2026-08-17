import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileCreationTrigger1785815653079 implements MigrationInterface {
  name = 'AddProfileCreationTrigger1785815653079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Profiles should use the auth.users UUID instead of generating their own.
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "id" DROP DEFAULT;
    `);

    // Function that creates a matching profile whenever a new auth user signs up.
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

    // Trigger runs automatically after a Supabase Auth user is created.
    await queryRunner.query(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    // Remove function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `);

    // Restore previous behaviour
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ALTER COLUMN "id"
      SET DEFAULT uuid_generate_v4();
    `);
  }
}
