import { Injectable, Logger } from '@nestjs/common';

// #275 — matches YouTube's ISO-8601 duration format from the Data API
// (contentDetails.duration), e.g. "PT1H2M10S", "PT4M13S", "PT45S". Every
// component is optional, which is why each capture group below is
// individually optional too.
const ISO8601_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

function parseIso8601DurationSeconds(duration: string): number | null {
  const match = ISO8601_DURATION.exec(duration);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// #275 — recognizes every common way a trainer might paste a YouTube
// link: the embed form the module player actually uses
// (youtube.com/embed/ID), the standard watch link (?v=ID), the short
// youtu.be/ID form, and youtube.com/shorts/ID. Returns null for
// anything else — that's the "unsupported source" case the caller
// falls back on, not an error.
function parseYoutubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id || null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      return parsed.searchParams.get('v');
    }
    const embedMatch = /^\/(embed|shorts)\/([^/]+)/.exec(parsed.pathname);
    if (embedMatch) return embedMatch[2];
  }

  return null;
}

export interface VideoDurationLookup {
  // #275 — true only when the URL was recognized as YouTube AND the
  // duration was actually resolved. False covers both "not YouTube"
  // and "YouTube, but lookup failed/no API key configured" — the
  // caller (and the trainer-facing UI) doesn't need to distinguish
  // those; either way it falls back to manual entry, per the issue's
  // "graceful fallback" acceptance criterion.
  supported: boolean;
  seconds: number | null;
}

@Injectable()
export class VideoDurationService {
  private readonly logger = new Logger(VideoDurationService.name);

  async lookup(url: string): Promise<VideoDurationLookup> {
    const videoId = parseYoutubeVideoId(url);
    if (!videoId) {
      return { supported: false, seconds: null };
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      // #275 — no key configured yet is an expected, silent state (see
      // .env.example), not an error: every module just falls back to
      // manual entry until one is added.
      return { supported: false, seconds: null };
    }

    try {
      const params = new URLSearchParams({
        part: 'contentDetails',
        id: videoId,
        key: apiKey,
      });
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      );

      if (!response.ok) {
        this.logger.warn(
          `YouTube duration lookup failed for ${videoId}: HTTP ${response.status}`,
        );
        return { supported: false, seconds: null };
      }

      const body = (await response.json()) as {
        items?: { contentDetails?: { duration?: string } }[];
      };
      const duration = body.items?.[0]?.contentDetails?.duration;
      if (!duration) {
        return { supported: false, seconds: null };
      }

      const seconds = parseIso8601DurationSeconds(duration);
      if (seconds === null) {
        return { supported: false, seconds: null };
      }

      return { supported: true, seconds };
    } catch (err) {
      // Network error, malformed response, etc. — never let a video-time
      // estimate take down course creation/editing.
      this.logger.warn(
        `YouTube duration lookup errored for ${videoId}: ${(err as Error).message}`,
      );
      return { supported: false, seconds: null };
    }
  }
}
