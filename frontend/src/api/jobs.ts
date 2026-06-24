import type { CreateJobResponse, Job, JobSummary } from '../types';

const API_BASE = '/api';
const REQUEST_TIMEOUT = 15_000;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    let msg = 'Request failed';
    try {
      const body = await response.json();
      msg = body.error || msg;
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(msg);
  }

  return response.json();
}

export function createJob(urls: string[]): Promise<CreateJobResponse> {
  return request(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
}

export function getJobs(): Promise<JobSummary[]> {
  return request(`${API_BASE}/jobs`);
}

export function getJobDetails(jobId: string): Promise<Job> {
  return request(`${API_BASE}/jobs/${jobId}`);
}

export async function cancelJob(jobId: string): Promise<void> {
  await request(`${API_BASE}/jobs/${jobId}/cancel`, { method: 'POST' });
}

export async function cancelUrl(jobId: string, url: string): Promise<void> {
  await request(`${API_BASE}/jobs/${jobId}/cancel-url`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await request(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
}
