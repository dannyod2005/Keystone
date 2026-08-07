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
