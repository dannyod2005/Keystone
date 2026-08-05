import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateModuleNotesTable1785911446877 implements MigrationInterface {
    name = 'CreateModuleNotesTable1785911446877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "module_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "module_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_0cb35a0d659ef300efd4b259bc0" UNIQUE ("module_id", "user_id"), CONSTRAINT "PK_a017bf8e4073994c2508e96e220" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "module_notes" ADD CONSTRAINT "FK_d8ac4c7563480788d1470c5b6fa" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "module_notes" ADD CONSTRAINT "FK_305a2357e0be0464484e77ea449" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "module_notes" DROP CONSTRAINT "FK_305a2357e0be0464484e77ea449"`);
        await queryRunner.query(`ALTER TABLE "module_notes" DROP CONSTRAINT "FK_d8ac4c7563480788d1470c5b6fa"`);
        await queryRunner.query(`DROP TABLE "module_notes"`);
    }

}
