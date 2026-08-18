import { IsString, MinLength } from 'class-validator';

// #275 — deliberately just IsString, not IsUrl: VideoDurationService.lookup
// already treats anything it can't parse as a URL (or as YouTube) as
// "unsupported", so a stray non-URL string here just resolves to
// { supported: false } rather than a 400 — consistent with the endpoint
// never erroring on a source it doesn't understand.
export class VideoDurationQueryDto {
  @IsString()
  @MinLength(1)
  url: string;
}
