import { describe, expect, it } from 'vitest';

import type { ActiveJobState } from '../../store/activeJobSlice';
import reducer, {
  cancelJob,
  cancelSingleUrl,
  clearActiveJobError,
  fetchJobDetails,
  setActiveJobId,
} from '../../store/activeJobSlice';

const initialState: ActiveJobState = {
  jobId: null,
  details: null,
  isLoading: false,
  error: null,
  cancellingUrls: [],
  urlErrors: {},
  cancelling: false,
  locallyCancelledUrls: [],
};

const mockJob = {
  id: 'job-1',
  urls: [
    { url: 'https://example.com', status: 'pending' as const },
    { url: 'https://google.com', status: 'pending' as const },
  ],
  status: 'in_progress' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  processedCount: 0,
  errorCount: 0,
  cancelledCount: 0,
};

describe('activeJobSlice', () => {
  describe('initial state', () => {
    it('returns initial state', () => {
      const state = reducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('setActiveJobId', () => {
    it('sets jobId and resets details', () => {
      const state = reducer(
        { ...initialState, details: mockJob, locallyCancelledUrls: ['https://example.com'] },
        setActiveJobId('job-1'),
      );
      expect(state.jobId).toBe('job-1');
      expect(state.details).toBeNull();
      expect(state.error).toBeNull();
      expect(state.cancelling).toBe(false);
      expect(state.locallyCancelledUrls).toEqual([]);
    });

    it('does nothing if same jobId', () => {
      const state = reducer({ ...initialState, jobId: 'job-1' }, setActiveJobId('job-1'));
      expect(state.jobId).toBe('job-1');
    });
  });

  describe('clearActiveJobError', () => {
    it('clears error', () => {
      const state = reducer({ ...initialState, error: 'some error' }, clearActiveJobError());
      expect(state.error).toBeNull();
    });
  });

  describe('fetchJobDetails', () => {
    it('pending sets loading and resets state', () => {
      const state = reducer(
        { ...initialState, error: 'old', cancellingUrls: ['x'], cancelling: true },
        { type: fetchJobDetails.pending.type },
      );
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.cancellingUrls).toEqual([]);
      expect(state.cancelling).toBe(false);
    });

    it('fulfilled sets details', () => {
      const state = reducer(
        { ...initialState, isLoading: true },
        { type: fetchJobDetails.fulfilled.type, payload: mockJob },
      );
      expect(state.details).toEqual(mockJob);
      expect(state.isLoading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = reducer(
        { ...initialState, isLoading: true },
        { type: fetchJobDetails.rejected.type, payload: 'Failed to fetch' },
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });
  });

  describe('cancelSingleUrl', () => {
    it('pending adds url to cancellingUrls', () => {
      const state = reducer(initialState, {
        type: cancelSingleUrl.pending.type,
        meta: { arg: { jobId: 'job-1', url: 'https://example.com' } },
      });
      expect(state.cancellingUrls).toEqual(['https://example.com']);
    });

    it('pending removes previous urlError', () => {
      const state = reducer(
        { ...initialState, urlErrors: { 'https://example.com': 'old error' } },
        {
          type: cancelSingleUrl.pending.type,
          meta: { arg: { jobId: 'job-1', url: 'https://example.com' } },
        },
      );
      expect(state.urlErrors['https://example.com']).toBeUndefined();
    });

    it('pending does not duplicate url', () => {
      const state = reducer(
        { ...initialState, cancellingUrls: ['https://example.com'] },
        {
          type: cancelSingleUrl.pending.type,
          meta: { arg: { jobId: 'job-1', url: 'https://example.com' } },
        },
      );
      expect(state.cancellingUrls).toEqual(['https://example.com']);
    });

    it('fulfilled removes url, sets cancelled in details, and tracks locally cancelled', () => {
      const state = reducer(
        { ...initialState, cancellingUrls: ['https://example.com'], details: mockJob },
        { type: cancelSingleUrl.fulfilled.type, payload: { url: 'https://example.com' } },
      );
      expect(state.cancellingUrls).not.toContain('https://example.com');
      expect(state.details?.urls[0]?.status).toBe('cancelled');
      expect(state.locallyCancelledUrls).toContain('https://example.com');
    });

    it('fulfilled does not duplicate locallyCancelledUrls', () => {
      const state = reducer(
        {
          ...initialState,
          cancellingUrls: ['https://example.com'],
          locallyCancelledUrls: ['https://example.com'],
          details: mockJob,
        },
        { type: cancelSingleUrl.fulfilled.type, payload: { url: 'https://example.com' } },
      );
      expect(state.locallyCancelledUrls).toEqual(['https://example.com']);
    });

    it('rejected removes url and sets urlError', () => {
      const state = reducer(
        { ...initialState, cancellingUrls: ['https://example.com'] },
        {
          type: cancelSingleUrl.rejected.type,
          meta: { arg: { jobId: 'job-1', url: 'https://example.com' } },
          payload: 'Cancel failed',
        },
      );
      expect(state.cancellingUrls).not.toContain('https://example.com');
      expect(state.urlErrors['https://example.com']).toBe('Cancel failed');
    });
  });

  describe('fetchJobDetails.fulfilled preserves locally cancelled URLs', () => {
    it('restores cancelled status for locally cancelled URLs from server response', () => {
      const serverResponse = {
        ...mockJob,
        urls: [
          { url: 'https://example.com', status: 'pending' as const },
          { url: 'https://google.com', status: 'success' as const },
        ],
      };
      const state = reducer(
        {
          ...initialState,
          locallyCancelledUrls: ['https://example.com'],
          isLoading: true,
        },
        { type: fetchJobDetails.fulfilled.type, payload: serverResponse },
      );
      expect(state.details?.urls[0]?.status).toBe('cancelled');
      expect(state.details?.urls[1]?.status).toBe('success');
    });
  });

  describe('cancelJob', () => {
    it('pending sets cancelling', () => {
      const state = reducer(initialState, { type: cancelJob.pending.type });
      expect(state.cancelling).toBe(true);
    });

    it('fulfilled cancels all non-final URLs', () => {
      const modifiedJob = {
        ...mockJob,
        urls: [
          { url: 'https://a.com', status: 'pending' as const },
          { url: 'https://b.com', status: 'in_progress' as const },
          { url: 'https://c.com', status: 'success' as const },
          { url: 'https://d.com', status: 'error' as const },
        ],
      };
      const state = reducer(
        { ...initialState, details: modifiedJob, cancelling: true },
        { type: cancelJob.fulfilled.type },
      );
      expect(state.cancelling).toBe(false);
      expect(state.details?.status).toBe('cancelled');
      expect(state.details?.urls[0]?.status).toBe('cancelled');
      expect(state.details?.urls[1]?.status).toBe('cancelled');
      expect(state.details?.urls[2]?.status).toBe('success');
      expect(state.details?.urls[3]?.status).toBe('error');
      expect(state.locallyCancelledUrls).toEqual(['https://a.com', 'https://b.com']);
    });

    it('rejected clears cancelling and sets error', () => {
      const state = reducer(
        { ...initialState, cancelling: true },
        { type: cancelJob.rejected.type, payload: 'Cancel failed' },
      );
      expect(state.cancelling).toBe(false);
      expect(state.error).toBe('Cancel failed');
    });
  });
});
