import { MigrationInterface, QueryRunner } from 'typeorm';

// #226 — a plain comma-joined text column (TypeORM's `simple-array`
// column type on the Course entity, see that file), not a native
// Postgres array or a separate skills table. Skill tags are short,
// comma-free labels ("Git", "SQL", "Negotiation") entered one at a time
// via the trainer's tag-input UI, so there's no real risk of a skill
// value itself containing a comma and corrupting the split — the
// simplicity of "one text column, no join table" outweighs that
// theoretical edge case for what's a lightweight tagging feature, not a
// normalized taxonomy. NOT NULL DEFAULT '' (rather than nullable) so
// every course — including the 40 pre-existing seeded ones — reads back
// as an empty array rather than null, with no separate null-handling
// needed anywhere downstream.
export class AddSkillsToCourses1786060000000 implements MigrationInterface {
  name = 'AddSkillsToCourses1786060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "skills" text NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "skills"`);
  }
}
