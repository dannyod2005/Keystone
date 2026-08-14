import { MigrationInterface, QueryRunner } from 'typeorm';

// #231 — opt-in flag for the global weekly-minutes leaderboard. NOT NULL
// DEFAULT false so every existing account — and every new one — starts
// opted OUT, matching the issue's explicit acceptance criterion ("the
// feature defaults to opted-out for existing accounts") without needing a
// separate backfill step; the column default handles both cases at once.
export class AddLeaderboardOptInToProfiles1786100000000 implements MigrationInterface {
  name = 'AddLeaderboardOptInToProfiles1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "leaderboard_opt_in" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP COLUMN "leaderboard_opt_in"`,
    );
  }
}
