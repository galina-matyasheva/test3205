import { beforeEach, describe, expect, it } from 'vitest';

import * as store from '../store.js';

describe('store', () => {
  let jobId: string;

  beforeEach(() => {
    jobId = store.createJob(['https://example.com', 'https://google.com', 'https://example.com']);
  });

  describe('createJob', () => {
    it('creates a job with unique URLs', () => {
      expect(jobId).toBeDefined();
      const job = store.getJob(jobId);
      expect(job?.urls).toHaveLength(2);
      expect(job?.urls[0]?.url).toBe('https://example.com');
      expect(job?.urls[1]?.url).toBe('https://google.com');
    });

    it('sets initial status to pending', () => {
      const job = store.getJob(jobId);
      expect(job?.status).toBe('pending');
      expect(job?.urls.every((u) => u.status === 'pending')).toBe(true);
    });
  });

  describe('getJobRecord / getJob', () => {
    it('getJobRecord returns raw record', () => {
      const record = store.getJobRecord(jobId);
      expect(record?.id).toBe(jobId);
    });

    it('getJob returns job with computed counts', () => {
      const job = store.getJob(jobId);
      expect(job?.processedCount).toBe(0);
      expect(job?.errorCount).toBe(0);
      expect(job?.cancelledCount).toBe(0);
    });

    it('returns undefined for non-existent id', () => {
      expect(store.getJob('non-existent')).toBeUndefined();
    });
  });

  describe('getAllJobs', () => {
    it('returns job summaries in insertion order', () => {
      const all = store.getAllJobs();
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all[all.length - 1]?.id).toBe(jobId);
      expect(all[all.length - 1]?.urlCount).toBe(2);
    });
  });

  describe('setJobStatus', () => {
    it('allows valid transition pending → in_progress', () => {
      store.setJobStatus(jobId, 'in_progress');
      expect(store.getJob(jobId)?.status).toBe('in_progress');
    });

    it('allows valid transition in_progress → success', () => {
      store.setJobStatus(jobId, 'in_progress');
      store.setJobStatus(jobId, 'success');
      expect(store.getJob(jobId)?.status).toBe('success');
    });

    it('allows valid transition in_progress → failed', () => {
      store.setJobStatus(jobId, 'in_progress');
      store.setJobStatus(jobId, 'failed');
      expect(store.getJob(jobId)?.status).toBe('failed');
    });

    it('allows valid transition pending → cancelled', () => {
      store.setJobStatus(jobId, 'cancelled');
      expect(store.getJob(jobId)?.status).toBe('cancelled');
    });

    it('rejects invalid transition pending → success', () => {
      store.setJobStatus(jobId, 'success');
      expect(store.getJob(jobId)?.status).toBe('pending');
    });

    it('rejects invalid transition pending → failed', () => {
      store.setJobStatus(jobId, 'failed');
      expect(store.getJob(jobId)?.status).toBe('pending');
    });

    it('rejects transition from final states', () => {
      store.setJobStatus(jobId, 'cancelled');
      store.setJobStatus(jobId, 'in_progress');
      expect(store.getJob(jobId)?.status).toBe('cancelled');
    });

    it('does nothing for non-existent job', () => {
      store.setJobStatus('non-existent', 'in_progress');
    });
  });

  describe('cancelUrl', () => {
    it('cancels a pending URL', () => {
      const result = store.cancelUrl(jobId, 'https://example.com');
      expect(result).toBe(true);
      const job = store.getJob(jobId);
      expect(job?.urls[0]?.status).toBe('cancelled');
    });

    it('cancels an in_progress URL', () => {
      store.updateUrlStatus(jobId, 'https://example.com', { status: 'in_progress' });
      const result = store.cancelUrl(jobId, 'https://example.com');
      expect(result).toBe(true);
      expect(store.getJob(jobId)?.urls[0]?.status).toBe('cancelled');
    });

    it('rejects cancelling a completed URL', () => {
      store.updateUrlStatus(jobId, 'https://example.com', { status: 'success' });
      const result = store.cancelUrl(jobId, 'https://example.com');
      expect(result).toBe(false);
    });

    it('rejects cancelling an errored URL', () => {
      store.updateUrlStatus(jobId, 'https://example.com', { status: 'error' });
      const result = store.cancelUrl(jobId, 'https://example.com');
      expect(result).toBe(false);
    });

    it('rejects cancelling already cancelled URL', () => {
      store.cancelUrl(jobId, 'https://example.com');
      const result = store.cancelUrl(jobId, 'https://example.com');
      expect(result).toBe(false);
    });

    it('returns false for non-existent URL', () => {
      const result = store.cancelUrl(jobId, 'https://nonexistent.com');
      expect(result).toBe(false);
    });

    it('returns false for non-existent job', () => {
      const result = store.cancelUrl('non-existent', 'https://example.com');
      expect(result).toBe(false);
    });
  });

  describe('updateUrlStatus', () => {
    it('updates individual fields', () => {
      store.updateUrlStatus(jobId, 'https://example.com', {
        status: 'success',
        httpStatus: 200,
        duration: 150,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
      const url = store.getJob(jobId)?.urls[0];
      expect(url?.status).toBe('success');
      expect(url?.httpStatus).toBe(200);
      expect(url?.duration).toBe(150);
    });

    it('does nothing for non-existent job', () => {
      store.updateUrlStatus('non-existent', 'https://example.com', { status: 'success' });
    });
  });

  describe('deleteJob', () => {
    it('deletes a job', () => {
      const result = store.deleteJob(jobId);
      expect(result).toBe(true);
      expect(store.getJob(jobId)).toBeUndefined();
    });

    it('returns false for non-existent job', () => {
      const result = store.deleteJob('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('counts', () => {
    it('computes correct counts when URLs have various statuses', () => {
      store.updateUrlStatus(jobId, 'https://example.com', { status: 'success' });
      store.updateUrlStatus(jobId, 'https://google.com', { status: 'error' });
      const job = store.getJob(jobId);
      expect(job?.processedCount).toBe(2);
      expect(job?.errorCount).toBe(1);
      expect(job?.cancelledCount).toBe(0);
    });

    it('includes cancelled in cancelledCount only', () => {
      store.updateUrlStatus(jobId, 'https://example.com', { status: 'cancelled' });
      const job = store.getJob(jobId);
      expect(job?.processedCount).toBe(0);
      expect(job?.cancelledCount).toBe(1);
    });
  });
});
