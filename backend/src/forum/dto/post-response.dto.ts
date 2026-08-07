export class PostAuthorDto {
  id: string;
  name: string | null;
}

export class PostResponseDto {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthorDto;
  // Flat shape — the frontend groups replies under their parent by
  // matching parentPostId to another post's id. Null for a top-level
  // post. See #39 for why flat rather than server-side nesting.
  parentPostId: string | null;
}