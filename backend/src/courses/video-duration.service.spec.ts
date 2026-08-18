import { VideoDurationService } from './video-duration.service';

describe('VideoDurationService', () => {
  let service: VideoDurationService;
  const originalEnv = process.env.YOUTUBE_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new VideoDurationService();
  });

  afterEach(() => {
    process.env.YOUTUBE_API_KEY = originalEnv;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reports unsupported for a non-YouTube URL without calling fetch', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key';
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const result = await service.lookup('https://vimeo.com/12345');

    expect(result).toEqual({ supported: false, seconds: null });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports unsupported for a YouTube URL when no API key is configured', async () => {
    delete process.env.YOUTUBE_API_KEY;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const result = await service.lookup(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );

    expect(result).toEqual({ supported: false, seconds: null });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])(
    'resolves duration for a recognized YouTube URL shape: %s',
    async (url, expectedId) => {
      process.env.YOUTUBE_API_KEY = 'test-key';
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [{ contentDetails: { duration: 'PT1H2M10S' } }],
          }),
      });
      global.fetch = fetchSpy;

      const result = await service.lookup(url);

      expect(result).toEqual({ supported: true, seconds: 3730 });
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`id=${expectedId}`),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('key=test-key'),
      );
    },
  );

  it('falls back gracefully when the YouTube API responds with a non-OK status', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    const result = await service.lookup(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );

    expect(result).toEqual({ supported: false, seconds: null });
  });

  it('falls back gracefully when the video is not found in the API response', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    const result = await service.lookup(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );

    expect(result).toEqual({ supported: false, seconds: null });
  });

  it('falls back gracefully instead of throwing when fetch itself rejects', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key';
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await service.lookup(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );

    expect(result).toEqual({ supported: false, seconds: null });
  });

  it('treats a malformed pasted URL as unsupported rather than throwing', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key';
    const result = await service.lookup('not a url at all');
    expect(result).toEqual({ supported: false, seconds: null });
  });
});
