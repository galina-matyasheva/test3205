import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cancelJob, cancelUrl, createJob, deleteJob, getJobDetails, getJobs } from '../../api/jobs';

const API_BASE = '/api';

describe('api/jobs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('createJob', () => {
    it('POSTs URLs and returns jobId', async () => {
      const fetchMock = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ jobId: 'job-1' }),
      } as Response);

      const result = await createJob(['https://example.com']);

      expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: ['https://example.com'] }),
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual({ jobId: 'job-1' });
    });

    it('throws on error response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid URLs' }),
      } as Response);

      await expect(createJob(['bad'])).rejects.toThrow('Invalid URLs');
    });
  });

  describe('getJobs', () => {
    it('GETs jobs list', async () => {
      const jobs = [{ id: 'job-1', status: 'pending', urlCount: 2 }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(jobs),
      } as Response);

      const result = await getJobs();
      expect(result).toEqual(jobs);
    });
  });

  describe('getJobDetails', () => {
    it('GETs job by id', async () => {
      const job = { id: 'job-1', urls: [], status: 'pending' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(job),
      } as Response);

      const result = await getJobDetails('job-1');
      expect(result).toEqual(job);
    });
  });

  describe('cancelJob', () => {
    it('POSTs to cancel endpoint', async () => {
      const fetchMock = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await cancelJob('job-1');

      expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/jobs/job-1/cancel`, {
        method: 'POST',
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('cancelUrl', () => {
    it('PATCHes with url in body', async () => {
      const fetchMock = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await cancelUrl('job-1', 'https://example.com');

      expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/jobs/job-1/cancel-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('deleteJob', () => {
    it('DELETEs job', async () => {
      const fetchMock = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve(undefined),
      } as Response);

      await deleteJob('job-1');

      expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/jobs/job-1`, {
        method: 'DELETE',
        signal: expect.any(AbortSignal),
      });
    });
  });

  it('throws generic error when response body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as Response);

    await expect(deleteJob('job-1')).rejects.toThrow('Request failed');
  });
});
