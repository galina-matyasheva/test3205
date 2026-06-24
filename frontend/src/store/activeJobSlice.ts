import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as api from '../api/jobs';
import type { Job } from '../types';
import { getErrorMessage } from './utils';

export interface ActiveJobState {
  jobId: string | null;
  details: Job | null;
  isLoading: boolean;
  error: string | null;
  cancellingUrls: string[];
  urlErrors: Record<string, string>;
  cancelling: boolean;
  locallyCancelledUrls: string[];
}

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

export const fetchJobDetails = createAsyncThunk(
  'activeJob/fetchJobDetails',
  async (jobId: string, { rejectWithValue }) => {
    try {
      return await api.getJobDetails(jobId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const cancelSingleUrl = createAsyncThunk(
  'activeJob/cancelSingleUrl',
  async ({ jobId, url }: { jobId: string; url: string }, { rejectWithValue }) => {
    try {
      await api.cancelUrl(jobId, url);
      return { url };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const cancelJob = createAsyncThunk(
  'activeJob/cancelJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await api.cancelJob(jobId);
      return jobId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const activeJobSlice = createSlice({
  name: 'activeJob',
  initialState,
  reducers: {
    setActiveJobId(state, action: PayloadAction<string | null>) {
      if (state.jobId === action.payload) return;
      state.jobId = action.payload;
      state.details = null;
      state.error = null;
      state.cancellingUrls = [];
      state.urlErrors = {};
      state.cancelling = false;
      state.locallyCancelledUrls = [];
    },
    clearActiveJobError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.cancellingUrls = [];
        state.urlErrors = {};
        state.cancelling = false;
      })
      .addCase(fetchJobDetails.fulfilled, (state, action: PayloadAction<Job>) => {
        state.details = action.payload;
        state.isLoading = false;
        for (const cancelledUrl of state.locallyCancelledUrls) {
          const target = state.details.urls.find((u) => u.url === cancelledUrl);
          if (target) target.status = 'cancelled';
        }
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch job details';
      })
      .addCase(cancelSingleUrl.pending, (state, action) => {
        if (!state.cancellingUrls.includes(action.meta.arg.url)) {
          state.cancellingUrls.push(action.meta.arg.url);
        }
        delete state.urlErrors[action.meta.arg.url];
      })
      .addCase(cancelSingleUrl.fulfilled, (state, action) => {
        state.cancellingUrls = state.cancellingUrls.filter((u) => u !== action.payload.url);
        if (!state.locallyCancelledUrls.includes(action.payload.url)) {
          state.locallyCancelledUrls.push(action.payload.url);
        }
        if (state.details) {
          const target = state.details.urls.find((u) => u.url === action.payload.url);
          if (target) target.status = 'cancelled';
        }
      })
      .addCase(cancelSingleUrl.rejected, (state, action) => {
        state.cancellingUrls = state.cancellingUrls.filter((u) => u !== action.meta.arg.url);
        state.urlErrors[action.meta.arg.url] = (action.payload as string) || 'Failed to cancel URL';
      })
      .addCase(cancelJob.pending, (state) => {
        state.cancelling = true;
      })
      .addCase(cancelJob.fulfilled, (state) => {
        state.cancelling = false;
        if (state.details) {
          state.details.status = 'cancelled';
          state.details.urls.forEach((u) => {
            if (u.status !== 'success' && u.status !== 'error' && u.status !== 'cancelled') {
              u.status = 'cancelled';
              if (!state.locallyCancelledUrls.includes(u.url)) {
                state.locallyCancelledUrls.push(u.url);
              }
            }
          });
        }
      })
      .addCase(cancelJob.rejected, (state, action) => {
        state.cancelling = false;
        state.error = (action.payload as string) || 'Failed to cancel job';
      });
  },
});

export const { setActiveJobId, clearActiveJobError } = activeJobSlice.actions;
export default activeJobSlice.reducer;
