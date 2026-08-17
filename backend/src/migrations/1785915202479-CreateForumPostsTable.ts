import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateForumPostsTable1785915202479 implements MigrationInterface {
  name = 'CreateForumPostsTable1785915202479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "forum_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "module_id" uuid NOT NULL, "user_id" uuid NOT NULL, "parent_post_id" uuid, CONSTRAINT "PK_3e9c301114a0fd42c998681b04e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_b10a20b4bb7521ef877a4597ce9" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_28e52f36bde02d737dba6911f37" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_927df00bfdb6dfe958f75c20196" FOREIGN KEY ("parent_post_id") REFERENCES "forum_posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_927df00bfdb6dfe958f75c20196"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_28e52f36bde02d737dba6911f37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_b10a20b4bb7521ef877a4597ce9"`,
    );
    await queryRunner.query(`DROP TABLE "forum_posts"`);
  }
}
