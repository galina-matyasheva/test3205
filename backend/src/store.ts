import { randomUUID } from 'node:crypto';

import type { Job, JobRecord, JobStatus, JobSummary, UrlCheck, UrlCheckStatus } from './types';

const jobs = new Map<string, JobRecord>();

export function createJob(urls: string[]): string {
  const id = randomUUID();
  const now = new Date().toISOString();

  const uniqueUrls = [...new Set(urls)];
  const record: JobRecord = {
    id,
    urls: uniqueUrls.map((url) => ({ url, status: 'pending' as UrlCheckStatus })),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(id, record);
  return id;
}

export function getJobRecord(id: string): JobRecord | undefined {
  return jobs.get(id);
}

export function getJob(id: string): Job | undefined {
  const record = jobs.get(id);
  if (!record) return;
  return toJob(record);
}

export function getAllJobs(): JobSummary[] {
  return Array.from(jobs.values()).map(toJobSummary);
}

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['success', 'failed', 'cancelled'],
  success: [],
  cancelled: [],
  failed: [],
};

export function setJobStatus(id: string, status: JobStatus): void {
  const record = jobs.get(id);
  if (!record) return;
  if (!VALID_TRANSITIONS[record.status].includes(status)) return;
  record.status = status;
  record.updatedAt = new Date().toISOString();
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}

export function cancelUrl(jobId: string, url: string): boolean {
  const record = jobs.get(jobId);
  if (!record) return false;
  const target = record.urls.find((u) => u.url === url);
  if (!target) return false;
  if (target.status !== 'pending' && target.status !== 'in_progress') return false;
  target.status = 'cancelled';
  record.updatedAt = new Date().toISOString();
  return true;
}

export function updateUrlStatus(id: string, url: string, data: Partial<UrlCheck>): void {
  const record = jobs.get(id);
  if (!record) return;
  const target = record.urls.find((u) => u.url === url);
  if (!target) return;
  Object.assign(target, data);
  record.updatedAt = new Date().toISOString();
}

function getCounts(urls: UrlCheck[]): {
  processedCount: number;
  errorCount: number;
  cancelledCount: number;
} {
  return {
    processedCount: urls.filter((u) => ['success', 'error'].includes(u.status)).length,
    errorCount: urls.filter((u) => u.status === 'error').length,
    cancelledCount: urls.filter((u) => u.status === 'cancelled').length,
  };
}

function toJobSummary(record: JobRecord): JobSummary {
  const { processedCount, errorCount, cancelledCount } = getCounts(record.urls);

  return {
    id: record.id,
    createdAt: record.createdAt,
    status: record.status,
    urlCount: record.urls.length,
    processedCount,
    errorCount,
    cancelledCount,
  };
}

function toJob(record: JobRecord): Job {
  const { processedCount, errorCount, cancelledCount } = getCounts(record.urls);

  return {
    id: record.id,
    urls: record.urls.map((u) => ({ ...u })),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    processedCount,
    errorCount,
    cancelledCount,
  };
}
