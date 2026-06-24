import { describe, expect, it, vi } from 'vitest';

import { processJob } from '../services/urlChecker.js';
import * as store from '../store.js';

async function tick() {
  vi.advanceTimersByTime(100);
  await Promise.resolve();
  vi.advanceTimersByTime(0);
}

async function advanceTo(urlCount: number) {
  const totalMs = Math.ceil(urlCount / 5) * 500 + 3000;
  const steps = Math.ceil(totalMs / 100);
  for (let i = 0; i < steps; i++) {
    await tick();
  }
}

describe('urlChecker', () => {
  it('processes URLs and sets success status', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }),
    );

    const jobId = store.createJob(['https://example.com', 'https://google.com']);
    const processPromise = processJob(jobId);

    const jobStarting = store.getJob(jobId);
    expect(jobStarting?.status).toBe('in_progress');

    await advanceTo(2);
    await processPromise;

    const job = store.getJob(jobId);
    expect(job?.status).toBe('success');
    expect(job?.urls[0]?.status).toBe('success');
    expect(job?.urls[1]?.status).toBe('success');
    expect(job?.urls[0]?.httpStatus).toBe(200);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  }, 10000);

  it('sets failed status when some URLs error', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new Error('Connection refused')),
    );

    const jobId = store.createJob(['https://example.com', 'https://bad.com']);
    const processPromise = processJob(jobId);

    await advanceTo(2);
    await processPromise;

    const job = store.getJob(jobId);
    expect(job?.status).toBe('failed');
    expect(job?.urls[0]?.status).toBe('success');
    expect(job?.urls[1]?.status).toBe('error');

    vi.useRealTimers();
    vi.unstubAllGlobals();
  }, 10000);

  it('stops when job is cancelled mid-flight', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }),
    );

    const jobId = store.createJob(['https://example.com']);
    const processPromise = processJob(jobId);

    store.setJobStatus(jobId, 'cancelled');

    await advanceTo(1);
    await processPromise;

    const job = store.getJob(jobId);
    expect(job?.status).toBe('cancelled');
    expect(job?.urls[0]?.status).toBe('cancelled');

    vi.useRealTimers();
    vi.unstubAllGlobals();
  }, 10000);
});
