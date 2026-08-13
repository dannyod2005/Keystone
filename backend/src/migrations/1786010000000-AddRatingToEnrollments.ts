import { MigrationInterface, QueryRunner } from 'typeorm';

// #106 — clarified with the team: the star rating on course cards / the
// detail modal is meant to represent real learner satisfaction, not
// difficulty. It's currently just a static seed value on `courses`
// (rating + learners columns, set once at seed/creation time — see
// Course entity), with no submission mechanism behind it at all.
//
// This migration adds the submission side: a nullable `rating` column on
// `enrollments` rather than a new table. An enrollment is already unique
// per (user, course) (see CreateEnrollmentsTable), so it's naturally the
// right place to store "this learner's rating for this course" — one
// row already exists per learner/course pair, and re-rating is just an
// UPDATE of that same row (see EnrollmentsService.submitRating).
//
// Deliberately NOT wired into `courses.rating`/`courses.learners` here —
// those stay exactly as the static seed baseline. Blending real
// submitted ratings into the catalogue's displayed average is a
// reasonable follow-up, but it's out of scope for this issue (see the
// PR notes for #106).
export class AddRatingToEnrollments1786010000000 implements MigrationInterface {
  name = 'AddRatingToEnrollments1786010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" ADD "rating" smallint`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "CHK_enrollments_rating_range" CHECK ("rating" IS NULL OR ("rating" BETWEEN 1 AND 5))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "CHK_enrollments_rating_range"`,
    );
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN "rating"`);
  }
}
