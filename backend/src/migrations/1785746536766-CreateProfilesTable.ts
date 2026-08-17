import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilesTable1785746536766 implements MigrationInterface {
  name = 'CreateProfilesTable1785746536766';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text, "role" text NOT NULL DEFAULT 'learner', "goal" text, "streak" integer NOT NULL DEFAULT '0', "daily_goal_min" integer NOT NULL DEFAULT '30', CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "profiles"`);
  }
}
