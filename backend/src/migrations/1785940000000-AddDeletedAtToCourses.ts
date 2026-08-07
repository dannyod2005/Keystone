import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToCourses1785940000000 implements MigrationInterface {
    name = 'AddDeletedAtToCourses1785940000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Soft delete, not a real column drop — a hard DELETE on courses
        // would cascade onto enrollments (courses.id has ON DELETE CASCADE
        // from CreateEnrollmentsTable) and silently wipe real learners'
        // progress. NULL = active/visible in the catalogue, non-null =
        // deleted. Deliberately NOT a TypeORM @DeleteDateColumn — that
        // would auto-filter deleted_at IS NULL on every query that joins
        // Course (including an enrollment's course relation), which would
        // make an already-enrolled learner's course vanish from their own
        // dashboard the moment a trainer deletes it. Filtering is instead
        // applied explicitly only where it belongs: the public catalogue
        // list/detail endpoints and new-enrollment creation.
        await queryRunner.query(`ALTER TABLE "courses" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "deleted_at"`);
    }

}
