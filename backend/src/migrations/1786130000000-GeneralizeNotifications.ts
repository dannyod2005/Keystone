import { MigrationInterface, QueryRunner } from 'typeorm';

// #257 — v1 (#229) deliberately hardcoded this table to a single
// notification kind (forum reply), per its own entity comment: "if a
// second notification type is ever added, this is the point where it'd
// be worth generalizing." That point is now — this adds `type` plus one
// nullable payload column per new type (badge_key for badge_earned,
// course_id for course_completed), and drops forum_post_id's NOT NULL
// since it's now only required for the forum_reply type. A CHECK
// constraint keeps "type" and "which payload column is set" from ever
// drifting out of sync, the same integrity role
// CHK_enrollments_rating_range plays for a differently-shaped constraint
// on a different table.
export class GeneralizeNotifications1786130000000 implements MigrationInterface {
  name = 'GeneralizeNotifications1786130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "forum_post_id" DROP NOT NULL`,
    );

    // Existing rows are all forum-reply notifications (the only kind that
    // existed before this migration) — the default backfills them, and
    // stays in place afterward since every future insert sets `type`
    // explicitly anyway (see NotificationsService).
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "type" text NOT NULL DEFAULT 'forum_reply'`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" ADD "badge_key" text`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD "course_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "CHK_notifications_type_payload" CHECK (
        ("type" = 'forum_reply' AND "forum_post_id" IS NOT NULL AND "badge_key" IS NULL AND "course_id" IS NULL) OR
        ("type" = 'badge_earned' AND "badge_key" IS NOT NULL AND "forum_post_id" IS NULL AND "course_id" IS NULL) OR
        ("type" = 'course_completed' AND "course_id" IS NOT NULL AND "forum_post_id" IS NULL AND "badge_key" IS NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "CHK_notifications_type_payload"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "badge_key"`,
    );
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);

    // Mirror MakeProfileRoleNullable's down(): clear out any rows the
    // reverted NOT NULL would otherwise reject. Only reachable if a
    // badge_earned/course_completed notification (forum_post_id NULL)
    // was created between up() and this rollback — deleting them (rather
    // than trying to invent a forum post for them) is the only sane
    // option, since the whole point of this migration was that those
    // notifications never had one.
    await queryRunner.query(
      `DELETE FROM "notifications" WHERE "forum_post_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "forum_post_id" SET NOT NULL`,
    );
  }
}
