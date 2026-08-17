import { IsString, MaxLength } from 'class-validator';

// #255 — Account Settings screen writes here. Non-empty-after-trim is
// enforced in ProfilesService.updateName rather than a class-validator
// decorator here (@Length(1, 80) would reject "" but not " ", since
// class-validator checks the raw string, not a trimmed one) — same
// trim-then-validate split used for reviewText in SubmitRatingDto.
export class UpdateNameDto {
  @IsString()
  @MaxLength(80)
  name: string;
}
