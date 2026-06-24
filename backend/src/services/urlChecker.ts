import * as store from '../store';

const CONCURRENCY_LIMIT = 5;
const PROCESSING_DELAY = 2000;
const REQUEST_TIMEOUT = 10_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function staggerDelay(index: number): number {
  const batchIndex = Math.floor(index / CONCURRENCY_LIMIT);
  const withinBatch = index % CONCURRENCY_LIMIT;
  return batchIndex * 500 + withinBatch * 200;
}

function isUrlCancelled(jobId: string, url: string): boolean {
  const job = store.getJobRecord(jobId);
  if (!job || job.status === 'cancelled') return true;
  const urlInJob = job.urls.find((u) => u.url === url);
  return urlInJob?.status === 'cancelled';
}

function cancelUrlIfNeeded(jobId: string, url: string): boolean {
  if (isUrlCancelled(jobId, url)) {
    store.updateUrlStatus(jobId, url, { status: 'cancelled' });
    return true;
  }
  return false;
}

async function processUrl(jobId: string, url: string): Promise<void> {
  if (cancelUrlIfNeeded(jobId, url)) return;

  store.updateUrlStatus(jobId, url, {
    status: 'in_progress',
    startTime: new Date().toISOString(),
  });

  await delay(PROCESSING_DELAY);

  if (cancelUrlIfNeeded(jobId, url)) return;

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'URL-Checker/1.0' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    await new Promise<void>((resolve) => setImmediate(resolve));

    if (cancelUrlIfNeeded(jobId, url)) return;

    const duration = Math.round(performance.now() - startTime);

    store.updateUrlStatus(jobId, url, {
      status: response.ok ? 'success' : 'error',
      httpStatus: response.status,
      endTime: new Date().toISOString(),
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    });
  } catch (err) {
    await new Promise<void>((resolve) => setImmediate(resolve));

    if (cancelUrlIfNeeded(jobId, url)) return;

    const duration = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : 'Unknown error';

    store.updateUrlStatus(jobId, url, {
      status: 'error',
      error: message,
      endTime: new Date().toISOString(),
      duration,
    });
  }
}

class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private limit: number) {}

  acquire(): Promise<void> {
    if (this.current < this.limit) {
      this.current++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.current--;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

export async function processJob(jobId: string): Promise<void> {
  const record = store.getJobRecord(jobId);
  if (!record) return;

  store.setJobStatus(jobId, 'in_progress');

  const semaphore = new Semaphore(CONCURRENCY_LIMIT);

  const tasks = record.urls.map((urlRecord, i) =>
    delay(staggerDelay(i)).then(() => semaphore.run(() => processUrl(jobId, urlRecord.url))),
  );

  await Promise.allSettled(tasks);
  await new Promise<void>((resolve) => setImmediate(resolve));

  const finalRecord = store.getJobRecord(jobId);
  if (!finalRecord || finalRecord.status === 'cancelled') return;

  const errorCount = finalRecord.urls.filter((u) => u.status === 'error').length;
  const cancelledCount = finalRecord.urls.filter((u) => u.status === 'cancelled').length;

  if (errorCount > 0) {
    store.setJobStatus(jobId, 'failed');
  } else if (cancelledCount > 0) {
    store.setJobStatus(jobId, 'cancelled');
  } else {
    store.setJobStatus(jobId, 'success');
  }
}
