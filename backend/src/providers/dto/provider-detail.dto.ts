// Response shape for GET /providers/me — the "Team" tab (#139) needs the
// provider's own fields plus its member list and which member (if any) is
// the owner, so it can show a "you" / "owner" badge without a second round
// trip. Deliberately not just the raw Provider + Profile entities: keeps
// the response to what the tab actually renders.
export class ProviderMemberDto {
  id: string;
  name: string | null;
  isOwner: boolean;
}

export class ProviderDetailDto {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string | null;
  members: ProviderMemberDto[];
}
