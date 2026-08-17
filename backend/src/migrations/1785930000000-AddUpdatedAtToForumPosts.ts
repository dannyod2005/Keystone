import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToForumPosts1785930000000 implements MigrationInterface {
  name = 'AddUpdatedAtToForumPosts1785930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nullable first so existing rows don't blow up the NOT NULL
    // constraint, backfilled to match created_at (so pre-existing
    // posts don't look "edited" the moment this migration runs), then
    // locked down to NOT NULL with a DB-level default for any
    // insert path that bypasses TypeORM's @UpdateDateColumn.
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD "updated_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `UPDATE "forum_posts" SET "updated_at" = "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "forum_posts" DROP COLUMN "updated_at"`,
    );
  }
}
