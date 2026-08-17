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
  // True once a post has been edited (updatedAt no longer matches
  // createdAt) — lets the frontend show an "(edited)" marker without
  // exposing raw timestamp-comparison logic to the client.
  edited: boolean;
}
