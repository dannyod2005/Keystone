import { MigrationInterface, QueryRunner } from 'typeorm';

// #40 — adds short-answer quiz question support alongside the existing
// MCQ-only schema. Decision made on the issue's explicit blocker
// ("manual grading vs. keyword/exact-match auto-grading — don't start
// building until this is answered"): auto-grading, matched against a
// per-question list of acceptable answers. That decision is why this
// migration does NOT add graded_by/graded_at columns from the issue's
// draft schema — those only make sense for manual grading, which was
// explicitly not chosen.
//
// quiz_questions.type: 'mcq' | 'short_answer', defaulting existing rows
// (and any insert that doesn't specify it, like the seed script's 320
// existing MCQ questions) to 'mcq' so nothing already in the database
// changes behavior.
//
// Acceptable answers for a short-answer question reuse the existing
// quiz_options table rather than a new one — each acceptable
// answer/keyword is stored as a QuizOption row with is_correct = true
// (there are no "incorrect options" to store for a short-answer
// question, since nothing is ever rendered as a choice to the learner).
//
// quiz_submissions restructure, per the issue: point at question_id
// directly instead of only transitively through option_id (this also
// simplifies the "already submitted" check in modules.service.ts, which
// previously had to join through quiz_options to find a user's
// submissions for a module). option_id becomes nullable (MCQ only),
// answer_text is added (short-answer only), and is_correct moves onto
// the submission itself — computed once at submission time for both
// question types, rather than re-derived via a join to quiz_options on
// every read. A CHECK constraint enforces that a submission is always
// exactly one of "picked an option" or "typed an answer", never both,
// never neither.
export class AddQuizShortAnswerSupport1786000000000 implements MigrationInterface {
  name = 'AddQuizShortAnswerSupport1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "quiz_questions"
            ADD "type" text NOT NULL DEFAULT 'mcq'
        `);
    await queryRunner.query(`
            ALTER TABLE "quiz_questions"
            ADD CONSTRAINT "CHK_quiz_questions_type" CHECK ("type" IN ('mcq', 'short_answer'))
        `);

    // question_id: nullable first so the backfill below can run, then
    // locked to NOT NULL once every existing row has one.
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ADD "question_id" uuid`,
    );
    await queryRunner.query(`
            UPDATE "quiz_submissions" qs
            SET "question_id" = qo."question_id"
            FROM "quiz_options" qo
            WHERE qs."option_id" = qo."id"
        `);
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ALTER COLUMN "question_id" SET NOT NULL`,
    );
    await queryRunner.query(`
            ALTER TABLE "quiz_submissions"
            ADD CONSTRAINT "FK_quiz_submissions_question_id" FOREIGN KEY ("question_id")
            REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    // option_id: was NOT NULL (MCQ-only schema) — a short-answer
    // submission has no option to point at.
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ALTER COLUMN "option_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ADD "answer_text" text`,
    );

    // is_correct: backfilled from the existing option-based grading
    // (every current row is an MCQ submission, graded via the option
    // it points at) before being locked to NOT NULL — matches the
    // AddUpdatedAtToForumPosts backfill-then-constrain pattern.
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ADD "is_correct" boolean`,
    );
    await queryRunner.query(`
            UPDATE "quiz_submissions" qs
            SET "is_correct" = qo."is_correct"
            FROM "quiz_options" qo
            WHERE qs."option_id" = qo."id"
        `);
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ALTER COLUMN "is_correct" SET NOT NULL`,
    );

    await queryRunner.query(`
            ALTER TABLE "quiz_submissions"
            ADD CONSTRAINT "CHK_quiz_submissions_exactly_one_answer_shape" CHECK (
                ("option_id" IS NOT NULL AND "answer_text" IS NULL) OR
                ("option_id" IS NULL AND "answer_text" IS NOT NULL)
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP CONSTRAINT "CHK_quiz_submissions_exactly_one_answer_shape"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP COLUMN "is_correct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP COLUMN "answer_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" ALTER COLUMN "option_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP CONSTRAINT "FK_quiz_submissions_question_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submissions" DROP COLUMN "question_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "CHK_quiz_questions_type"`,
    );
    await queryRunner.query(`ALTER TABLE "quiz_questions" DROP COLUMN "type"`);
  }
}
