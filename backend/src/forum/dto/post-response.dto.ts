export class PostAuthorDto {
  id: string;
  name: string | null;
}

export class PostResponseDto {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthorDto;
}