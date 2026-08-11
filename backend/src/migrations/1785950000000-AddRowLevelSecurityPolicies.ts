import { MigrationInterface, QueryRunner } from "typeorm";

// #42 — RLS on the tables that hold per-user data. This is defense-in-depth
// against our own NestJS API (it connects with a direct Postgres role that
// owns these tables, and table owners bypass RLS by default — so none of
// this changes what the backend itself can do), but it's the *only* thing
// standing between the public anon key shipped in the frontend bundle and
// unrestricted reads/writes on this data via Supabase's REST API. Assumes
// the standard Supabase project default of anon/authenticated already
// having table-level grants on the public schema — RLS policies are the
// gate on top of that, not a replacement for it.
export class AddRowLevelSecurityPolicies1785950000000 implements MigrationInterface {
    name = 'AddRowLevelSecurityPolicies1785950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ---- profiles: read/update own row only. No insert policy — rows
        // are created exclusively by the SECURITY DEFINER handle_new_user()
        // trigger (AddProfileCreationTrigger), which runs as the function's
        // owner and so isn't subject to RLS regardless.
        await queryRunner.query(`ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "profiles_select_own" ON "profiles"
            FOR SELECT TO authenticated
            USING (auth.uid() = id)
        `);
        await queryRunner.query(`
            CREATE POLICY "profiles_update_own" ON "profiles"
            FOR UPDATE TO authenticated
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id)
        `);

        // ---- enrollments: read/insert own rows only. No update/delete
        // policy — progress updates currently only ever happen through the
        // backend (which bypasses RLS), so there's nothing to allow here yet.
        await queryRunner.query(`ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "enrollments_select_own" ON "enrollments"
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "enrollments_insert_own" ON "enrollments"
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id)
        `);

        // ---- module_notes: private notes, full read/insert/update by owner.
        await queryRunner.query(`ALTER TABLE "module_notes" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "module_notes_select_own" ON "module_notes"
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "module_notes_insert_own" ON "module_notes"
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "module_notes_update_own" ON "module_notes"
            FOR UPDATE TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
        `);

        // ---- forum_posts: any authenticated user reads; only the author
        // writes/edits/removes their own post. Insert policy isn't listed
        // in the issue text but is added here anyway — without one, RLS
        // would block even the author from creating a post via a direct
        // Supabase call, which defeats the point of getting ahead of #42's
        // "frontend queries Supabase directly later" scenario.
        await queryRunner.query(`ALTER TABLE "forum_posts" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "forum_posts_select_authenticated" ON "forum_posts"
            FOR SELECT TO authenticated
            USING (true)
        `);
        await queryRunner.query(`
            CREATE POLICY "forum_posts_insert_own" ON "forum_posts"
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "forum_posts_update_own" ON "forum_posts"
            FOR UPDATE TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "forum_posts_delete_own" ON "forum_posts"
            FOR DELETE TO authenticated
            USING (auth.uid() = user_id)
        `);

        // ---- quiz_submissions: read/insert own only. Deliberately no
        // update/delete policy at all — under the current schema, MCQ
        // submissions are graded synchronously at insert time (there's no
        // separate "grade later" step yet, see #40's backlog'd short-answer
        // work), so "no update after grading" cashes out to "no update,
        // ever" today. RLS default-denies anything without a matching
        // policy, so this is enforced with no extra statements needed.
        await queryRunner.query(`ALTER TABLE "quiz_submissions" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "quiz_submissions_select_own" ON "quiz_submissions"
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id)
        `);
        await queryRunner.query(`
            CREATE POLICY "quiz_submissions_insert_own" ON "quiz_submissions"
            FOR INSERT TO authenticated
            WITH CHECK (auth.uid() = user_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS "quiz_submissions_insert_own" ON "quiz_submissions"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "quiz_submissions_select_own" ON "quiz_submissions"`);
        await queryRunner.query(`ALTER TABLE "quiz_submissions" DISABLE ROW LEVEL SECURITY`);

        await queryRunner.query(`DROP POLICY IF EXISTS "forum_posts_delete_own" ON "forum_posts"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "forum_posts_update_own" ON "forum_posts"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "forum_posts_insert_own" ON "forum_posts"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "forum_posts_select_authenticated" ON "forum_posts"`);
        await queryRunner.query(`ALTER TABLE "forum_posts" DISABLE ROW LEVEL SECURITY`);

        await queryRunner.query(`DROP POLICY IF EXISTS "module_notes_update_own" ON "module_notes"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "module_notes_insert_own" ON "module_notes"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "module_notes_select_own" ON "module_notes"`);
        await queryRunner.query(`ALTER TABLE "module_notes" DISABLE ROW LEVEL SECURITY`);

        await queryRunner.query(`DROP POLICY IF EXISTS "enrollments_insert_own" ON "enrollments"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "enrollments_select_own" ON "enrollments"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DISABLE ROW LEVEL SECURITY`);

        await queryRunner.query(`DROP POLICY IF EXISTS "profiles_update_own" ON "profiles"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "profiles_select_own" ON "profiles"`);
        await queryRunner.query(`ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY`);
    }

}
