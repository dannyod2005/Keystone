import { MigrationInterface, QueryRunner } from 'typeorm';

// #229 — forum-reply notifications. All three FKs are ON DELETE CASCADE:
// a notification only makes sense in the context of its recipient, actor,
// and the reply post it's about — if any of those is gone, the
// notification is meaningless too (unlike, say, courses.owner_id's SET
// NULL, where the course itself should still exist without its owner).
// Deliberately no RLS policies — RLS was a one-time initiative (#42),
// never extended to any table created since (activity_events, providers,
// user_badges, learning_paths, ...), consistent with that precedent.
export class CreateNotificationsTable1786080000000 implements MigrationInterface {
  name = 'CreateNotificationsTable1786080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "recipient_id" uuid NOT NULL, "actor_id" uuid NOT NULL, "forum_post_id" uuid NOT NULL, CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_recipient_id" FOREIGN KEY ("recipient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_actor_id" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_forum_post_id" FOREIGN KEY ("forum_post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // #229 — the topbar's unread count/list is looked up by recipient,
    // filtered/sorted by read + created_at on every page load — an index
    // covering that exact query shape keeps it cheap as the table grows,
    // rather than a full scan filtered by recipient_id alone.
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_read_created" ON "notifications" ("recipient_id", "read", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_notifications_recipient_read_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_forum_post_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_actor_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_recipient_id"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
