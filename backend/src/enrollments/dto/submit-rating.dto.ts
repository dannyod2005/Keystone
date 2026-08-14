import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  // #228 — optional written review, submitted in the same call as the
  // star rating. Omitted/empty is valid (pure star submissions keep
  // working exactly as before #228) — see EnrollmentsService.submitRating
  // for how an empty string gets normalized to null rather than stored
  // as-is.
  @IsOptional()
  @IsString()
  reviewText?: string;
}
