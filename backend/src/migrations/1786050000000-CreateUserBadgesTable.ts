import { MigrationInterface, QueryRunner } from 'typeorm';

// #225 — same shape/conventions as CreateModuleNotesTable: uuid pk via
// uuid-ossp, FK to profiles with ON DELETE CASCADE (a deleted account
// shouldn't leave orphaned badge rows), and a UNIQUE constraint that's
// what makes BadgesService.award idempotent (see that file's comment).
// Deliberately no RLS policies here — RLS was a one-time initiative
// (#42) covering the tables that existed at that point, and hasn't been
// extended to any table added since (activity_events, providers, etc.),
// so this follows that same established precedent rather than being the
// one new table to add it.
export class CreateUserBadgesTable1786050000000 implements MigrationInterface {
  name = 'CreateUserBadgesTable1786050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "user_badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "badge_key" text NOT NULL, "earned_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "UQ_user_badges_user_id_badge_key" UNIQUE ("user_id", "badge_key"), CONSTRAINT "PK_user_badges_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_user_badges_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_user_badges_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "user_badges"`);
  }
}
