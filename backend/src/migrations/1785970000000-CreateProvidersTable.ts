import { MigrationInterface, QueryRunner } from "typeorm";

// #137 — the real entity behind "a group of trainers who share course edit
// access", as opposed to reusing the free-text courses.provider string
// (client-editable, not unique, no auth value). Deliberately minimal: no
// membership/invite columns beyond a single regenerable code, since the
// create/join flow itself is a separate follow-up issue.
export class CreateProvidersTable1785970000000 implements MigrationInterface {
    name = 'CreateProvidersTable1785970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "invite_code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_providers_invite_code" UNIQUE ("invite_code"), CONSTRAINT "PK_providers_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "providers"`);
    }

}
