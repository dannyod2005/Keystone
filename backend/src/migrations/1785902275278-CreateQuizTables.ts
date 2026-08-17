import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuizTables1785902275278 implements MigrationInterface {
  name = 'CreateQuizTables1785902275278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "quiz_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "position" integer NOT NULL, "module_id" uuid NOT NULL, CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "option_text" text NOT NULL, "is_correct" boolean NOT NULL DEFAULT false, "position" integer NOT NULL, "question_id" uuid NOT NULL, CONSTRAINT "PK_9c59607f100085ab17f0f138926" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submitted_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "option_id" uuid NOT NULL, CONSTRAINT "PK_e3fd96789b070c28b7aeeb2c32c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_98086a36045d151124f6ad8978b" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_options" ADD CONSTRAINT "FK_2aa44934a4602aef1ede068f4a7" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ADD CONSTRAINT "FK_07cde8aa4503492169b12267cff" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ADD CONSTRAINT "FK_cf8916479e63d6f83eabff54965" FOREIGN KEY ("option_id") REFERENCES "quiz_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP CONSTRAINT "FK_cf8916479e63d6f83eabff54965"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP CONSTRAINT "FK_07cde8aa4503492169b12267cff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_options" DROP CONSTRAINT "FK_2aa44934a4602aef1ede068f4a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_98086a36045d151124f6ad8978b"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_submissions"`);
    await queryRunner.query(`DROP TABLE "quiz_options"`);
    await queryRunner.query(`DROP TABLE "quiz_questions"`);
  }
}
