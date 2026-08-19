import { MigrationInterface, QueryRunner } from 'typeorm';

// #297 — courses.hours was a whole-hour integer, so the Trainer Studio
// course editor could only ever suggest/store whole-hour values. That's
// too coarse for shorter courses (a 5-module course of ~20min video each
// is ~1h40m, not 1h or 2h) and made the #275 auto-suggested estimate
// noticeably inaccurate once rounded to the nearest hour. The editor now
// offers 15-minute (0.25h) increments — see CreateCourseDto's IsNumber
// swap and TrainerCourseEditor's suggestedHours calc — which this
// migration widens the column to actually store.
//
// `real` (Postgres float4), not `numeric`/`decimal`: TypeORM returns
// numeric/decimal columns as strings by default (protecting against
// float-precision loss on values that need it), but every consumer of
// this column — EnrollmentsService's module-completion points calc,
// CourseAnalyticsService's pace calc — does plain arithmetic on it and
// expects a JS number. `real` maps straight to one, and quarter-hour
// values have no meaningful precision to lose.
export class AllowFractionalCourseHours1786160000000 implements MigrationInterface {
  name = 'AllowFractionalCourseHours1786160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "hours" TYPE real USING "hours"::real,
      ALTER COLUMN "hours" SET DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Any fractional hours picked up since up() ran get rounded to the
    // nearest whole hour on the way back down — the old column type
    // can't represent them, and this is a revert, not a data-preserving
    // operation.
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "hours" TYPE integer USING round("hours"::numeric)::integer,
      ALTER COLUMN "hours" SET DEFAULT 0;
    `);
  }
}
