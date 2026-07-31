import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCourseTables1785485401938 implements MigrationInterface {
    name = 'CreateCourseTables1785485401938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "course_modules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "title" character varying NOT NULL, "video_url" text, "course_id" uuid NOT NULL, CONSTRAINT "UQ_0379ed4bed32044ccc2a3c4fe61" UNIQUE ("course_id", "position"), CONSTRAINT "PK_4c195db0718e8845a6e09075ebc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "course_credits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "line" text NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "PK_b291e001e49ee873644363a66b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "course_faqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "PK_77a0fade673c2a5f3c16bc917d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "provider" character varying NOT NULL, "category" character varying NOT NULL, "level" character varying NOT NULL, "hours" integer NOT NULL DEFAULT '0', "projects" integer NOT NULL DEFAULT '0', "rating" numeric, "learners" integer NOT NULL DEFAULT '0', "color" character varying NOT NULL, "blurb" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "course_modules" ADD CONSTRAINT "FK_81644557c2401f37fe9e884e884" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_credits" ADD CONSTRAINT "FK_5cd87b59b18a575776a141a2477" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_faqs" ADD CONSTRAINT "FK_f4bd514ca36d04dfa88c0d159bf" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_faqs" DROP CONSTRAINT "FK_f4bd514ca36d04dfa88c0d159bf"`);
        await queryRunner.query(`ALTER TABLE "course_credits" DROP CONSTRAINT "FK_5cd87b59b18a575776a141a2477"`);
        await queryRunner.query(`ALTER TABLE "course_modules" DROP CONSTRAINT "FK_81644557c2401f37fe9e884e884"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TABLE "course_faqs"`);
        await queryRunner.query(`DROP TABLE "course_credits"`);
        await queryRunner.query(`DROP TABLE "course_modules"`);
    }

}
