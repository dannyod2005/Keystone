import { MigrationInterface, QueryRunner } from 'typeorm';

// #246 — companion to RenameActivityEventsMinutesToPoints: a learner's
// daily goal is compared directly against ActivityService.getSummary's
// points totals (see buildWeek's goalHit check), so it has to move to the
// same unit and scale. Existing values are rescaled by the same x10
// factor; the column default follows (30 -> 300) so a profile created
// after this migration but before ever touching its goal still gets the
// same relative target a pre-migration default would have implied.
export class RenameProfilesDailyGoalMinToPoints1786120000000 implements MigrationInterface {
  name = 'RenameProfilesDailyGoalMinToPoints1786120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" RENAME COLUMN "daily_goal_min" TO "daily_goal_points"`,
    );
    await queryRunner.query(
      `UPDATE "profiles" SET "daily_goal_points" = "daily_goal_points" * 10`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "daily_goal_points" SET DEFAULT 300`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "daily_goal_points" SET DEFAULT 30`,
    );
    await queryRunner.query(
      `UPDATE "profiles" SET "daily_goal_points" = "daily_goal_points" / 10`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" RENAME COLUMN "daily_goal_points" TO "daily_goal_min"`,
    );
  }
}
