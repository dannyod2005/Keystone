import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityEventsTable1785920000000 implements MigrationInterface {
  name = 'CreateActivityEventsTable1785920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "activity_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" text NOT NULL, "minutes" integer NOT NULL, "occurred_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "PK_activity_events_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_events_user_occurred" ON "activity_events" ("user_id", "occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_activity_events_user_occurred"`);
    await queryRunner.query(
      `ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "activity_events"`);
  }
}
