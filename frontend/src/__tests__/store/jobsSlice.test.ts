import { describe, expect, it } from 'vitest';

import reducer, { clearError, createJob, deleteJob, fetchJobs } from '../../store/jobsSlice';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const mockJobs = [
  {
    id: 'job-1',
    status: 'pending' as const,
    urlCount: 2,
    processedCount: 0,
    errorCount: 0,
    cancelledCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-2',
    status: 'success' as const,
    urlCount: 3,
    processedCount: 3,
    errorCount: 1,
    cancelledCount: 0,
    createdAt: new Date().toISOString(),
  },
];

describe('jobsSlice', () => {
  describe('initial state', () => {
    it('returns initial state', () => {
      const state = reducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('clearError', () => {
    it('clears error', () => {
      const state = reducer({ ...initialState, error: 'some error' }, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('fetchJobs', () => {
    it('pending sets loading', () => {
      const state = reducer(initialState, { type: fetchJobs.pending.type });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('fulfilled sets items', () => {
      const state = reducer(
        { ...initialState, isLoading: true },
        { type: fetchJobs.fulfilled.type, payload: mockJobs },
      );
      expect(state.items).toEqual(mockJobs);
      expect(state.isLoading).toBe(false);
    });

    it('rejected sets error', () => {
      const state = reducer(
        { ...initialState, isLoading: true },
        { type: fetchJobs.rejected.type, payload: 'Fetch failed' },
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Fetch failed');
    });
  });

  describe('deleteJob', () => {
    it('fulfilled removes job from list', () => {
      const state = reducer(
        { ...initialState, items: mockJobs },
        { type: deleteJob.fulfilled.type, payload: 'job-1' },
      );
      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.id).toBe('job-2');
    });

    it('rejected sets error', () => {
      const state = reducer(initialState, {
        type: deleteJob.rejected.type,
        payload: 'Delete failed',
      });
      expect(state.error).toBe('Delete failed');
    });
  });

  describe('createJob', () => {
    it('pending clears error', () => {
      const state = reducer(
        { ...initialState, error: 'old error' },
        { type: createJob.pending.type },
      );
      expect(state.error).toBeNull();
    });

    it('rejected sets error', () => {
      const state = reducer(initialState, {
        type: createJob.rejected.type,
        payload: 'Create failed',
      });
      expect(state.error).toBe('Create failed');
    });
  });
});
