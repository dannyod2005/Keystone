# Approved Feature List

Condensed sign-off checklist derived from [L1 — the feature clarification document](./README.md) ([#45](https://github.com/dannyod2005/Keystone/issues/45)), for [#46](https://github.com/dannyod2005/Keystone/issues/46). Purpose: get each feature area explicitly approved for L2, or explicitly deferred with a documented reason — nothing should reach L2 by default silence.

This condenses L1's ~30 individual brief bullets into feature areas. See the README for the bullet-by-bullet detail behind each row.

## How to use this doc

For each row in both tables below, a reviewer marks a decision and, if not a plain approval, records why. Part 3 is where that reviewer signs their name to it.

## Part 1 — Feature areas

| Feature area | L1 status | Decision | Notes |
|---|---|---|---|
| Homepage | Done | ☐ Approved ☐ Needs revisit | |
| Learner Login | Done | ☐ Approved ☐ Needs revisit | Two known gaps carried as deviations in Part 2 (Google sign-in, forgot password). |
| Course Catalogue | Done | ☐ Approved ☐ Needs revisit | |
| Learner Dashboard | Partial | ☐ Approved as-is ☐ Needs revisit | Calendar and Daily Goals ship narrower than the brief describes — see Part 2. |
| Learning Page | Done | ☐ Approved ☐ Needs revisit | Quiz scope changed since L1 was written — see Part 2. |
| Certificates | Done | ☐ Approved ☐ Needs revisit | Real generated PDF, gated to completed courses. |
| Learner engagement (Forum + FAQ) | Done | ☐ Approved ☐ Needs revisit | |

## Part 2 — Deviations requiring explicit sign-off

Each of these was already flagged in L1 as an intentional gap, not an oversight. They still need an explicit decision here: accept as-is for the prototype, or send back for revisit.

| Deviation | Reason | Decision |
|---|---|---|
| Logo is a placeholder mark, not a final design | Deferred per instruction | ☐ Accepted ☐ Needs revisit |
| Quiz is MCQ + auto-graded short-answer, single attempt (no retakes) | Agreed scope — expanded from MCQ-only after [#40](https://github.com/dannyod2005/Keystone/issues/40); L1 was written before that change | ☐ Accepted ☐ Needs revisit |
| Google sign-in disabled ("coming soon") | Needs an OAuth redirect flow not yet built | ☐ Accepted ☐ Needs revisit |
| "Forgot password?" link not wired | Not built yet | ☐ Accepted ☐ Needs revisit |
| Search lives on Course Catalogue, not Homepage | Not built on Homepage | ☐ Accepted ☐ Needs revisit |
| Daily goal is a fixed 30-minute platform constant, not per-learner | Per-user column exists on the profile table but isn't read yet | ☐ Accepted ☐ Needs revisit |
| Dashboard calendar shows the current week only, no month navigation | Prev/next controls are visible but inert | ☐ Accepted ☐ Needs revisit |

## Part 3 — Stakeholder sign-off record

| Reviewer | Role | Decision | Date | Notes |
|---|---|---|---|---|
| | | ☐ Approved ☐ Approved with exceptions ☐ Not approved | | |

*Sign-off pending — to be completed at L2 review.*
