import { MigrationInterface, QueryRunner } from "typeorm";

// #137 — course update/delete was gated purely on role ("any trainer can
// edit any course"), not on who actually owns the course. This adds real
// ownership:
//   - courses.owner_id: the trainer who created the course. Nullable
//     rather than NOT NULL, specifically to avoid inventing a fake
//     placeholder owner for the 9 existing seed courses, which have no
//     real historical owner to backfill. A NULL owner_id is treated as
//     "predates ownership tracking" and exempted from the new ownership
//     check (see RequireCourseOwnerGuard) rather than retroactively
//     assigned to anyone. Every course created from this point forward
//     always has one — CoursesService.create stamps it server-side from
//     the authenticated caller, never client-supplied.
//   - courses.provider_id / profiles.provider_id: optional group
//     ownership. When a course has a provider_id, any profile with the
//     same provider_id also gets edit rights, on top of the individual
//     owner — this is the opt-in "team" upgrade so joining a provider is
//     never a mandatory gate to creating a course at all (single, always-
//     required owner_id already covers that).
// All three FKs are ON DELETE SET NULL: deleting a profile or provider
// should not cascade-delete or block-delete courses tied to them.
export class AddCourseAndProfileOwnership1785980000000 implements MigrationInterface {
    name = 'AddCourseAndProfileOwnership1785980000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" ADD "provider_id" uuid`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_provider_id" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "courses" ADD "owner_id" uuid`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_owner_id" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "courses" ADD "provider_id" uuid`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_provider_id" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // Existing courses stay owner_id = NULL / provider_id = NULL —
        // deliberately not backfilled, see class comment above.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_provider_id"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "provider_id"`);

        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_owner_id"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "owner_id"`);

        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_provider_id"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "provider_id"`);
    }

}
