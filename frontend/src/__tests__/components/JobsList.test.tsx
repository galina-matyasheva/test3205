import { configureStore, type Reducer, type UnknownAction } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import JobsList from '../../components/JobsList';
import activeJobReducer from '../../store/activeJobSlice';
import jobsReducer from '../../store/jobsSlice';
import type { RootState } from '../../store/store';
import { strings } from '../../strings/jobsList';

type JobsState = RootState['jobs'];
type ActiveJobState = RootState['activeJob'];
import type { JobSummary } from '../../types';

vi.mock('../../api/jobs', () => ({
  deleteJob: vi.fn().mockResolvedValue(undefined),
  getJobs: vi.fn(),
  getJobDetails: vi.fn(),
  createJob: vi.fn(),
  cancelJob: vi.fn(),
  cancelUrl: vi.fn(),
}));

function createStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      jobs: jobsReducer as Reducer<JobsState, UnknownAction, JobsState | undefined>,
      activeJob: activeJobReducer as Reducer<
        ActiveJobState,
        UnknownAction,
        ActiveJobState | undefined
      >,
    },
    preloadedState,
  });
}

function renderWithProviders(ui: React.ReactElement, preloadedState?: Partial<RootState>) {
  const store = createStore(preloadedState);
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

const mockJobs: JobSummary[] = [
  {
    id: 'job-111111',
    status: 'pending',
    urlCount: 2,
    processedCount: 0,
    errorCount: 0,
    cancelledCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-222222',
    status: 'success',
    urlCount: 3,
    processedCount: 3,
    errorCount: 1,
    cancelledCount: 0,
    createdAt: new Date().toISOString(),
  },
];

describe('JobsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no jobs', () => {
    renderWithProviders(<JobsList />, {
      jobs: { items: [], isLoading: false, error: null },
    });

    expect(screen.getByText(strings.emptyState)).toBeInTheDocument();
  });

  it('renders job list with correct data', () => {
    renderWithProviders(<JobsList />, {
      jobs: { items: mockJobs, isLoading: false, error: null },
    });

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('0/2 URLs')).toBeInTheDocument();
    expect(screen.getByText('3/3 URLs')).toBeInTheDocument();
  });

  it('shows loading when fetching and no jobs', () => {
    renderWithProviders(<JobsList />, {
      jobs: { items: [], isLoading: true, error: null },
    });

    expect(screen.getByText(strings.loading)).toBeInTheDocument();
  });

  it('dispatches setActiveJobId on click', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<JobsList />, {
      jobs: { items: mockJobs, isLoading: false, error: null },
    });

    await user.click(screen.getByText('job-1111...'));

    expect(store.getState().activeJob.jobId).toBe('job-111111');
  });

  it('highlights active job', () => {
    renderWithProviders(<JobsList />, {
      jobs: { items: mockJobs, isLoading: false, error: null },
      activeJob: {
        jobId: 'job-111111',
        details: null,
        isLoading: false,
        error: null,
        cancellingUrls: [],
        urlErrors: {},
        cancelling: false,
        locallyCancelledUrls: [],
      },
    });

    const items = screen.getAllByRole('button');
    const activeItem = items.find((item) => item.classList.contains('job-item--active'));
    expect(activeItem).toBeTruthy();
  });

  it('shows error count and cancelled count when present', () => {
    const jobsWithCancelled: JobSummary[] = [
      {
        id: 'job-3',
        status: 'cancelled',
        urlCount: 5,
        processedCount: 2,
        errorCount: 1,
        cancelledCount: 2,
        createdAt: new Date().toISOString(),
      },
    ];

    renderWithProviders(<JobsList />, {
      jobs: { items: jobsWithCancelled, isLoading: false, error: null },
    });

    expect(screen.getByText(/1 error/)).toBeInTheDocument();
    expect(screen.getByText(/2 cancelled/)).toBeInTheDocument();
  });
});
