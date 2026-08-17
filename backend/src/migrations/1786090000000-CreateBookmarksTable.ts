import { MigrationInterface, QueryRunner } from 'typeorm';

// #230 — course bookmarking ("save without enrolling"). Both FKs are
// ON DELETE CASCADE, same reasoning as Enrollment: a bookmark is
// meaningless without the user or course it points at, unlike e.g.
// courses.owner_id's SET NULL. Unique(user_id, course_id) mirrors
// Enrollment's own unique constraint — a learner can only bookmark a
// given course once, so create() is naturally idempotent at the DB level.
// Deliberately no RLS policies — RLS was a one-time initiative (#42),
// never extended to any table created since (activity_events, providers,
// user_badges, learning_paths, notifications, ...), consistent with that
// precedent.
export class CreateBookmarksTable1786090000000 implements MigrationInterface {
  name = 'CreateBookmarksTable1786090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "UQ_bookmarks_user_id_course_id" UNIQUE ("user_id", "course_id"), CONSTRAINT "PK_bookmarks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_bookmarks_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_bookmarks_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_bookmarks_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_bookmarks_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "bookmarks"`);
  }
}
