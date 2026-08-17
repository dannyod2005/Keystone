import { MigrationInterface, QueryRunner } from 'typeorm';

// #224 — three new tables for learning paths:
//   - learning_paths: the parent resource, mirrors courses' ownership shape
//     (owner_id/provider_id, both nullable + ON DELETE SET NULL, same
//     reasoning as AddCourseAndProfileOwnership) and soft-delete (deleted_at
//     as a plain column, not TypeORM's @DeleteDateColumn — see that
//     migration's comment for why).
//   - learning_path_courses: the ordered join to existing courses, modeled
//     directly on course_modules (position int, unique per parent). No
//     owner_id of its own — always accessed through its parent path.
//   - learning_path_enrollments: mirrors enrollments' shape (unique
//     (user_id, learning_path_id), same idempotent-insert pattern) but
//     deliberately carries no progress/status columns — a path's
//     completion is always derived live from the learner's Enrollment rows
//     against the path's constituent courses (see
//     LearningPathEnrollmentsService), not duplicated/cached here.
// Deliberately no RLS policies — RLS was a one-time initiative (#42) never
// extended to any table created since (activity_events, providers,
// user_badges, ...); consistent with that established precedent.
export class CreateLearningPathTables1786070000000 implements MigrationInterface {
  name = 'CreateLearningPathTables1786070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE "learning_paths" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "owner_id" uuid, "provider_id" uuid, CONSTRAINT "PK_learning_paths_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_paths" ADD CONSTRAINT "FK_learning_paths_owner_id" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_paths" ADD CONSTRAINT "FK_learning_paths_provider_id" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "learning_path_courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "learning_path_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "UQ_learning_path_courses_path_position" UNIQUE ("learning_path_id", "position"), CONSTRAINT "PK_learning_path_courses_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" ADD CONSTRAINT "FK_learning_path_courses_learning_path_id" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" ADD CONSTRAINT "FK_learning_path_courses_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "learning_path_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "learning_path_id" uuid NOT NULL, CONSTRAINT "UQ_learning_path_enrollments_user_path" UNIQUE ("user_id", "learning_path_id"), CONSTRAINT "PK_learning_path_enrollments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "FK_learning_path_enrollments_user_id" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "FK_learning_path_enrollments_learning_path_id" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" DROP CONSTRAINT "FK_learning_path_enrollments_learning_path_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_enrollments" DROP CONSTRAINT "FK_learning_path_enrollments_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "learning_path_enrollments"`);

    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" DROP CONSTRAINT "FK_learning_path_courses_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_path_courses" DROP CONSTRAINT "FK_learning_path_courses_learning_path_id"`,
    );
    await queryRunner.query(`DROP TABLE "learning_path_courses"`);

    await queryRunner.query(
      `ALTER TABLE "learning_paths" DROP CONSTRAINT "FK_learning_paths_provider_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_paths" DROP CONSTRAINT "FK_learning_paths_owner_id"`,
    );
    await queryRunner.query(`DROP TABLE "learning_paths"`);
  }
}
