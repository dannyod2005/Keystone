import { MigrationInterface, QueryRunner } from 'typeorm';

// #246 — switches activity_events' unit from raw minutes to points.
// Existing rows are rescaled by the same POINTS_PER_MINUTE factor
// (ActivityService.ts) that every newly-logged event now goes through, so
// a learner's historical totals (streaks, weekly sums, leaderboard
// standing) stay proportionally consistent across the cutover rather than
// jumping to a smaller number the moment this ships.
export class RenameActivityEventsMinutesToPoints1786110000000 implements MigrationInterface {
  name = 'RenameActivityEventsMinutesToPoints1786110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_events" RENAME COLUMN "minutes" TO "points"`,
    );
    await queryRunner.query(
      `UPDATE "activity_events" SET "points" = "points" * 10`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "activity_events" SET "points" = "points" / 10`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_events" RENAME COLUMN "points" TO "minutes"`,
    );
  }
}
