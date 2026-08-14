import { MigrationInterface, QueryRunner } from 'typeorm';

// #228 — extends #106's rating column with an optional written review,
// stored the same way: a nullable column directly on `enrollments`, not a
// separate table. Same reasoning as AddRatingToEnrollments — one row
// already exists per (user, course) pair, so there's nowhere else this
// naturally belongs. Null (not empty string) means "no review text",
// matching how `rating` itself already distinguishes "not rated" from
// any real value.
export class AddReviewTextToEnrollments1786040000000 implements MigrationInterface {
  name = 'AddReviewTextToEnrollments1786040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" ADD "review_text" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "review_text"`,
    );
  }
}
