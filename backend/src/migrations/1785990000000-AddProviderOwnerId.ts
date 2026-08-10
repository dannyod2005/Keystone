import { MigrationInterface, QueryRunner } from 'typeorm';

// #138 — the create/regenerate/join/leave flow needs a concept of "who
// administers this provider" for the owner-only regenerate-invite-code
// endpoint. #137 deliberately didn't define this (membership via
// profiles.provider_id only tracks "belongs to", not "administers").
// Simplest option that doesn't need revisiting later: the creator is the
// permanent owner, stored as its own column rather than inferred from
// membership — so the owner stays the owner even if they later leave the
// provider (profiles.provider_id cleared) or membership changes around
// them. Nullable + ON DELETE SET NULL, same reasoning as
// courses.owner_id: if the owning profile is ever deleted, the provider
// row shouldn't be blocked or cascade-deleted, it just becomes ownerless
// (regenerate becomes unavailable to anyone — acceptable for v1, no
// ownership-transfer flow exists yet).
export class AddProviderOwnerId1785990000000 implements MigrationInterface {
  name = 'AddProviderOwnerId1785990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "providers" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "providers" ADD CONSTRAINT "FK_providers_owner_id" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "providers" DROP CONSTRAINT "FK_providers_owner_id"`,
    );
    await queryRunner.query(`ALTER TABLE "providers" DROP COLUMN "owner_id"`);
  }
}
