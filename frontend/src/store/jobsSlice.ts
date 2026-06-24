import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as api from '../api/jobs';
import type { JobSummary } from '../types';
import { getErrorMessage } from './utils';

interface JobsState {
  items: JobSummary[];
  isLoading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (_, { rejectWithValue }) => {
  try {
    return await api.getJobs();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await api.deleteJob(jobId);
      return jobId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (urls: string[], { rejectWithValue }) => {
    try {
      return await api.createJob(urls);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<JobSummary[]>) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch jobs';
      })
      .addCase(createJob.pending, (state) => {
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to create job';
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter((j) => j.id !== action.payload);
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to delete job';
      });
  },
});

export const { clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
