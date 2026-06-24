export type JobStatus = 'pending' | 'in_progress' | 'success' | 'cancelled' | 'failed';
export type UrlCheckStatus = 'pending' | 'in_progress' | 'success' | 'error' | 'cancelled';

export interface UrlCheck {
  url: string;
  status: UrlCheckStatus;
  httpStatus?: number;
  error?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface Job {
  id: string;
  urls: UrlCheck[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  processedCount: number;
  errorCount: number;
  cancelledCount: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  urlCount: number;
  processedCount: number;
  errorCount: number;
  cancelledCount: number;
}

export interface CreateJobResponse {
  jobId: string;
}

export interface JobRecord {
  id: string;
  urls: UrlCheck[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}
