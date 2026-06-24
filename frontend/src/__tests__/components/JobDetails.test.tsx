import { configureStore, type Reducer, type UnknownAction } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import JobDetails from '../../components/JobDetails';
import activeJobReducer, { cancelJob, cancelSingleUrl } from '../../store/activeJobSlice';
import jobsReducer from '../../store/jobsSlice';
import type { RootState } from '../../store/store';
import { strings } from '../../strings/jobDetails';

type JobsState = RootState['jobs'];
type ActiveJobState = RootState['activeJob'];

import { getJobDetails } from '../../api/jobs';

const defaultMockResponse = {
  id: 'job-1',
  urls: [
    { url: 'https://example.com', status: 'success' as const, httpStatus: 200, duration: 150 },
    { url: 'https://google.com', status: 'error' as const, error: 'Timeout' },
    { url: 'https://other.com', status: 'pending' as const },
  ],
  status: 'in_progress' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  processedCount: 2,
  errorCount: 1,
  cancelledCount: 0,
};

vi.mock('../../api/jobs', () => ({
  getJobDetails: vi.fn(),
  fetchJobs: vi.fn(),
  cancelJob: vi.fn(),
  cancelUrl: vi.fn(),
  createJob: vi.fn(),
  deleteJob: vi.fn(),
  getJobs: vi.fn(),
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

async function renderWithProviders(ui: React.ReactElement, preloadedState?: Partial<RootState>) {
  const store = createStore(preloadedState);
  const result = render(<Provider store={store}>{ui}</Provider>);
  await act(async () => {});
  return { store, ...result };
}

const mockDetails = {
  id: 'job-1',
  urls: [
    { url: 'https://example.com', status: 'success' as const, httpStatus: 200, duration: 150 },
    { url: 'https://google.com', status: 'error' as const, error: 'Timeout' },
    { url: 'https://other.com', status: 'pending' as const },
  ],
  status: 'in_progress' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  processedCount: 2,
  errorCount: 1,
  cancelledCount: 0,
};

const activeJobBase = {
  jobId: 'job-1',
  details: null,
  isLoading: false,
  error: null,
  cancellingUrls: [],
  urlErrors: {},
  cancelling: false,
  locallyCancelledUrls: [],
};

describe('JobDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJobDetails).mockResolvedValue(defaultMockResponse);
  });

  it('shows empty state when no job selected', async () => {
    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, jobId: null },
    });

    expect(screen.getByText(strings.emptyState)).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    vi.mocked(getJobDetails).mockReturnValue(new Promise(() => {}));
    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, isLoading: true },
    });

    expect(screen.getByText(strings.loading)).toBeInTheDocument();
  });

  it('shows job info and URLs when details loaded', async () => {
    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mockDetails },
    });

    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('2 / 3 URLs')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('https://other.com')).toBeInTheDocument();
    expect(screen.getByText('Error: Timeout')).toBeInTheDocument();
  });

  it('shows per-URL Cancel button for pending/in_progress URLs when >1 URL', async () => {
    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mockDetails },
    });

    expect(screen.getByRole('button', { name: /Cancel https:\/\/other\.com/ })).toBeInTheDocument();
  });

  it('shows Cancel Job button when job is active', async () => {
    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mockDetails },
    });

    expect(screen.getByRole('button', { name: strings.cancelJobAriaLabel })).toBeInTheDocument();
  });

  it('hides Cancel Job button for final statuses', async () => {
    vi.mocked(getJobDetails).mockResolvedValue({
      ...defaultMockResponse,
      status: 'success' as const,
    });
    await renderWithProviders(<JobDetails />, {
      activeJob: {
        ...activeJobBase,
        details: { ...mockDetails, status: 'success' as const },
      },
    });

    expect(
      screen.queryByRole('button', { name: strings.cancelJobAriaLabel }),
    ).not.toBeInTheDocument();
  });

  it('disables Cancel Job button and shows Cancelling... text', async () => {
    const { store } = await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mockDetails },
    });

    act(() => {
      store.dispatch(cancelJob.pending('test', 'job-1'));
    });

    await waitFor(() => {
      const cancelBtn = screen.getByRole('button', { name: strings.cancelJobAriaLabel });
      expect(cancelBtn).toBeDisabled();
      expect(cancelBtn).toHaveTextContent(strings.cancelling);
    });
  });

  it('does not show per-URL Cancel button or status badge when only 1 URL', async () => {
    vi.mocked(getJobDetails).mockResolvedValue({
      ...defaultMockResponse,
      urls: [{ url: 'https://example.com', status: 'pending' as const }],
    });
    const singleUrlDetails = {
      ...mockDetails,
      urls: [{ url: 'https://example.com', status: 'pending' as const }],
    };

    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: singleUrlDetails },
    });

    expect(screen.queryByRole('button', { name: /Cancel https/ })).not.toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('shows success/error/cancelled breakdown', async () => {
    vi.mocked(getJobDetails).mockResolvedValue({
      ...defaultMockResponse,
      urls: [
        { url: 'https://a.com', status: 'success' as const },
        { url: 'https://b.com', status: 'error' as const, error: 'Err' },
        { url: 'https://c.com', status: 'cancelled' as const },
      ],
      processedCount: 2,
      errorCount: 1,
      cancelledCount: 1,
    });
    const mixedDetails = {
      ...mockDetails,
      urls: [
        { url: 'https://a.com', status: 'success' as const },
        { url: 'https://b.com', status: 'error' as const, error: 'Err' },
        { url: 'https://c.com', status: 'cancelled' as const },
      ],
      processedCount: 2,
      errorCount: 1,
      cancelledCount: 1,
    };

    await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mixedDetails },
    });

    expect(screen.getByText(/1 success/)).toBeInTheDocument();
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
    expect(screen.getByText(/1 cancelled/)).toBeInTheDocument();
  });

  it('shows inline cancel error when present', async () => {
    const { store } = await renderWithProviders(<JobDetails />, {
      activeJob: { ...activeJobBase, details: mockDetails },
    });

    act(() => {
      store.dispatch(
        cancelSingleUrl.rejected(
          new Error('Already completed'),
          'test',
          { jobId: 'job-1', url: 'https://example.com' },
          'Already completed',
        ),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel error: Already completed')).toBeInTheDocument();
    });
  });
});
