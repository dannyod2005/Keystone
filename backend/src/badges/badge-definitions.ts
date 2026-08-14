// #225 — a fixed, server-defined set of badges (deliberately NOT
// trainer-authorable, per the issue's explicit scope decision — this
// keeps the feature to "a handful of milestones the backend already
// knows how to detect" rather than a full CMS for badge content).
//
// Adding a new badge means adding an entry here plus a call to
// BadgesService.award(userId, key) at whichever existing event newly
// qualifies for it — see EnrollmentsService.updateProgress and
// ModulesService.submitQuiz/createPost for the current trigger points.
// This list is the single source of truth for label/description; the
// user_badges table only ever stores the key + who/when (see
// UserBadge), never a copy of the display text.
export interface BadgeDefinition {
  key: string;
  label: string;
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'first_course_complete',
    label: 'First Steps',
    description: 'Completed your first course.',
  },
  {
    key: 'five_courses_complete',
    label: 'High Five',
    description: 'Completed 5 courses.',
  },
  {
    key: 'perfect_quiz_score',
    label: 'Perfect Score',
    description: 'Scored 100% on a module quiz.',
  },
  {
    key: 'first_forum_post',
    label: 'Joined the Conversation',
    description: 'Posted your first message in a course forum.',
  },
];

export const BADGE_DEFINITIONS_BY_KEY = new Map(
  BADGE_DEFINITIONS.map((b) => [b.key, b]),
);
