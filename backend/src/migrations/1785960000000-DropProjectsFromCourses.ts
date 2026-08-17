import { MigrationInterface, QueryRunner } from 'typeorm';

// #102 — "projects" wasn't editable anywhere in Trainer Studio (no input
// field existed for it), had no meaning derived from real course data, and
// duplicated the module list already shown in the same CourseDetailModal.
// Removed rather than renamed/derived — there was nothing coherent to
// rename or derive it into.
export class DropProjectsFromCourses1785960000000 implements MigrationInterface {
  name = 'DropProjectsFromCourses1785960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "projects"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "projects" integer NOT NULL DEFAULT '0'`,
    );
  }
}
