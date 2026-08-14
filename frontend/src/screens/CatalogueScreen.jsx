import { useState } from "react";
import { Search, Milestone, Bookmark } from "lucide-react";

import { Stars, CategoryDot, PageHeader } from "../components/common/Primitives";
import { MarketingHeader } from "../components/layout/MarketingHeader";

// #190 — a curated row, not a dumping ground for every course in the
// learner's goal category: some categories have far more than this many
// courses, and showing all of them here would just duplicate a big chunk
// of the grid immediately below it. Sorted by rating (nulls last) before
// slicing, so what makes the cut is at least a reasonable proxy for
// "good," not just catalogue order.
const RECOMMENDED_LIMIT = 6;

export function CatalogueScreen({
  loggedIn,
  onGo,
  onOpenCourse,
  onAuth,
  enrolledIds,
  courses,
  loading = false,
  goal = null,
  learningPaths = [],
  onOpenPath,
  enrolledPathIds = [],
  pathsLoading = false,
  bookmarkedIds = [],
  onToggleBookmark,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const cats = ["All", "Technical", "Business", "Leadership"];

  const byCategory = filter === "All" ? courses : courses.filter((c) => c.category === filter);
  const query = search.trim().toLowerCase();
  const filtered = query
    ? byCategory.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.provider.toLowerCase().includes(query) ||
          (c.skills ?? []).some((s) => s.toLowerCase().includes(query)),
      )
    : byCategory;

  // #184 — the subheading used to always show the unfiltered
  // courses.length, even once a search or category chip narrowed the
  // grid down. Reflect whatever's actually showing instead, only
  // falling back to the generic "N courses across..." blurb when
  // nothing's filtered.
  const hasActiveFilter = filter !== "All" || query.length > 0;
  const filteredSubheading = (() => {
    const n = filtered.length;
    const trackLabel = filter === "All" ? "course" : `${filter} course`;
    const base = `${n} ${trackLabel}${n === 1 ? "" : "s"}`;
    return query ? `${base} matching "${search.trim()}".` : `${base}.`;
  })();

  // #190 — goal-category match, the "simplest, no new data needed" signal
  // from the issue. Deliberately doesn't touch `filtered`/the main grid at
  // all: this is an additive "Recommended for you" strip above the
  // unchanged full list, not a reorder — the issue calls that out as the
  // safer option, and it's what keeps search/filter's existing behavior
  // (and the acceptance criteria's "current behavior, unchanged" fallback
  // for no-goal learners) completely untouched below it. Only shown when
  // nothing's actively filtered: search/filter fully overriding
  // personalization, rather than blending with it, is what the acceptance
  // criteria's "when no search/filter is active" means in practice.
  const recommended = (!goal || hasActiveFilter)
    ? []
    : courses
        .filter((c) => c.category === goal)
        .slice()
        .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
        .slice(0, RECOMMENDED_LIMIT);

  // #190 — shared by the Recommended strip and the main grid so the two
  // don't drift out of sync visually; a course can legitimately appear in
  // both (this is a "for you" callout layered on top of the full list,
  // not a filter removing it from below).
  function renderCourseCard(c) {
    const isEnrolled = enrolledIds.includes(c.id);
    // #230 — a learner "saving" a course without enrolling. Only rendered
    // when the caller actually wired up bookmarking (loggedIn learner with
    // onToggleBookmark passed in) — logged-out/marketing view of this same
    // card renders exactly as it did before this feature.
    const isBookmarked = bookmarkedIds.includes(c.id);
    return (
      <div key={c.id} className="ks-card" onClick={() => onOpenCourse(c)} style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CategoryDot color={c.color} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.category}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isEnrolled && <span className="ks-badge" style={{ background: "var(--success-tint)", color: "var(--success)" }}>Enrolled</span>}
            {onToggleBookmark && (
              <Bookmark
                size={16}
                color={isBookmarked ? "var(--gold-dark)" : "var(--slate-light)"}
                fill={isBookmarked ? "var(--gold-dark)" : "none"}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  // Doesn't bubble to the card's own onClick — toggling a
                  // bookmark should never also open the course detail modal.
                  e.stopPropagation();
                  onToggleBookmark(c, isBookmarked);
                }}
              />
            )}
          </div>
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{c.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 10 }}>{c.provider}</div>
        <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{c.blurb}</div>
        <hr className="ks-hairline" style={{ margin: "0 0 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stars rating={c.rating} />
          <span style={{ fontSize: 12, color: "var(--slate-light)", fontFamily: "var(--font-mono)" }}>{c.hours}h · {c.level}</span>
        </div>
      </div>
    );
  }

  // #224 — a slimmer card than renderCourseCard: no rating/hours/level
  // line since a path doesn't carry any of its own (those are per-course),
  // just how many courses it bundles plus whatever description the
  // trainer wrote.
  function renderPathCard(p) {
    const isEnrolled = enrolledPathIds.includes(p.id);
    return (
      <div key={p.id} className="ks-card" onClick={() => onOpenPath(p)} style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Milestone size={13} color="var(--gold-dark)" />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{p.courses.length} courses</span>
          </div>
          {isEnrolled && <span className="ks-badge" style={{ background: "var(--success-tint)", color: "var(--success)" }}>Enrolled</span>}
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, flex: 1 }}>{p.description}</div>
      </div>
    );
  }

  return (
    <div className="ks-page-enter">
      {!loggedIn && <MarketingHeader onGo={onGo} onAuth={onAuth} />}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 60px" }}>
        {/* #213 — was an inline h1/p; now the shared PageHeader primitive
            (same 30px/font-display/600 title, same subtitle styling) so
            Dashboard/Discover can match this scale exactly instead of
            each hand-rolling their own heading size. */}
        <PageHeader
          title="Course catalogue"
          subtitle={
            loading
              ? "Loading courses…"
              : hasActiveFilter
                ? filteredSubheading
                : `${courses.length} courses across technical, business, and leadership tracks.`
          }
        />

        {loading ? (
          <div className="ks-card" style={{ padding: 40, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
            Loading catalogue…
          </div>
        ) : (
          <>
            {/* #224 — "Learning paths": its own section, entirely separate
                from the course search/category filter below (a path isn't
                a course, so it doesn't belong in that grid or its filter
                predicate). Hidden while paths are still loading or there
                simply aren't any yet. */}
            {!pathsLoading && learningPaths.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Learning paths</div>
                <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 14 }}>
                  Guided, multi-course sequences curated by trainers.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 18 }}>
                  {learningPaths.map(renderPathCard)}
                </div>
                <hr className="ks-hairline" style={{ margin: "28px 0 0" }} />
              </div>
            )}

            {/* #190 — "Recommended for you": additive, above the untouched
                full grid below. Hidden entirely once search/filter narrows
                the view, or for any learner/trainer with no goal set. */}
            {recommended.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Recommended for you</div>
                <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 14 }}>
                  Based on your {goal} goal.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 18 }}>
                  {recommended.map(renderCourseCard)}
                </div>
                <hr className="ks-hairline" style={{ margin: "28px 0 0" }} />
              </div>
            )}

            {/* #104 — stacked on mobile, side-by-side from md up; flex-direction
                is the only breakpoint-dependent property here, so it's the
                only thing on Tailwind classes. */}
            <div className="flex flex-col items-stretch md:flex-row md:items-center" style={{ gap: 18, marginBottom: 24 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
                <input
                  className="ks-input"
                  placeholder="Search by title or provider"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cats.map((c) => (
                  <span key={c} onClick={() => setFilter(c)}
                    style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                      background: filter === c ? "var(--ink)" : "var(--paper-2)", color: filter === c ? "var(--paper)" : "var(--slate)",
                      border: "1px solid var(--line)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="ks-card" style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
                No courses match "{search}".
              </div>
            ) : (
              // #104 — column count is the only breakpoint-dependent property
              // (1 up to sm, 2 from sm, 3 from md), so it's the only thing on
              // Tailwind classes; gap stays inline like everywhere else.
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: 18 }}>
                {filtered.map(renderCourseCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}