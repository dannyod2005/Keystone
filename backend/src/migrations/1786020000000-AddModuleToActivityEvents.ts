import { MigrationInterface, QueryRunner } from 'typeorm';

// #124 — module_complete previously logged a module's whole estimated
// minute count on the single day "Mark complete" was pressed, even if the
// learner actually spread real work across several earlier days (see the
// issue for the canonical Tuesday/Wednesday example). Fixing that needs
// two things: (1) a lightweight per-day "this module was viewed today"
// signal (ModulesService.logView, called once per module per day from the
// frontend), and (2) at completion time, splitting the module's estimated
// minutes across every distinct day it was actually viewed, each dated to
// the day it happened rather than all landing on the completion day.
//
// This column is what makes (1) queryable: a nullable FK so a 'module_view'
// event (and, going forward, the resulting split 'module_complete' events)
// can be tied back to a specific module. Nullable + ON DELETE SET NULL,
// same reasoning as courses.owner_id — if the module is ever deleted, the
// historical activity row shouldn't be blocked or cascade-deleted, it just
// loses the module link.
export class AddModuleToActivityEvents1786020000000 implements MigrationInterface {
  name = 'AddModuleToActivityEvents1786020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_events" ADD "module_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_events" ADD CONSTRAINT "FK_activity_events_module_id" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_events" DROP CONSTRAINT "FK_activity_events_module_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_events" DROP COLUMN "module_id"`,
    );
  }
}
