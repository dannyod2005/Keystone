// Shared helpers for deriving a display name and avatar initials from the
// real logged-in Supabase user, instead of the static LEARNER mock (#96).
//
// Not every account is guaranteed to have `user_metadata.name` — accounts
// created before the signup form captured a name, or created directly in
// the Supabase dashboard, may have it blank. Fall back gracefully rather
// than rendering "undefined" or an empty avatar.

export function getDisplayName(user) {
  const metaName = user?.user_metadata?.name?.trim();
  if (metaName) return metaName;

  const email = user?.email;
  if (email) return email.split("@")[0];

  return "there";
}

export function getInitials(name) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// #172 — common Vietnamese gender-indicating middle names. In a
// family-name-first full name (Family + Middle + Given, e.g. "Nguyễn Thị
// Lan Anh"), the 2nd word being one of these is a reliable signal that
// everything after it is the given name — which can itself be 1 or 2
// words ("Minh" vs "Lan Anh"). Deliberately just these two rather than a
// longer list: every name in seed-accounts.ts parses correctly with just
// "Thị"/"Văn", and a guessed-at longer list risks being wrong more often
// than it helps. Expand here if a real name doesn't parse correctly.
const VIETNAMESE_MIDDLE_NAME_MARKERS = ["Thị", "Văn"];

// #172 — pulls the given/first name out of a full name for greetings
// ("Good morning, {firstName}"), instead of naively taking the first
// word (which is the *family* name for family-name-first cultures like
// Vietnamese). Two words is treated as a plain Western "First Last"
// name (first word is already the first name — nothing to disambiguate).
// Three or more words is treated as family-name-first: if the 2nd word
// is a recognised middle-name marker, the given name is everything after
// it; otherwise there's no reliable signal from the string alone, so this
// falls back to just the last word, per the issue's own suggested heuristic.
export function getFirstName(fullName) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts[0] ?? "";

  if (VIETNAMESE_MIDDLE_NAME_MARKERS.includes(parts[1])) {
    return parts.slice(2).join(" ");
  }
  return parts[parts.length - 1];
}
