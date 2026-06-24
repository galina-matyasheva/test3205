import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CreateJobForm from '../../components/CreateJobForm';
import activeJobReducer from '../../store/activeJobSlice';
import jobsReducer from '../../store/jobsSlice';
import { strings } from '../../strings/createJobForm';

vi.mock('../../api/jobs', () => ({
  createJob: vi.fn().mockResolvedValue({ jobId: 'new-job' }),
  getJobs: vi.fn(),
  getJobDetails: vi.fn(),
  cancelJob: vi.fn(),
  cancelUrl: vi.fn(),
  deleteJob: vi.fn(),
}));

function createStore() {
  return configureStore({
    reducer: {
      jobs: jobsReducer,
      activeJob: activeJobReducer,
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const store = createStore();
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

describe('CreateJobForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with textarea and submit button', () => {
    renderWithProviders(<CreateJobForm />);

    expect(screen.getByPlaceholderText(/Enter URLs/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: strings.submitButton })).toBeInTheDocument();
  });

  it('submit button is disabled when textarea is empty', () => {
    renderWithProviders(<CreateJobForm />);

    expect(screen.getByRole('button', { name: strings.submitButton })).toBeDisabled();
  });

  it('submit button is enabled when textarea has text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateJobForm />);

    const textarea = screen.getByPlaceholderText(/Enter URLs/);
    await user.type(textarea, 'https://example.com');

    expect(screen.getByRole('button', { name: strings.submitButton })).toBeEnabled();
  });

  it('shows validation errors for invalid URLs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateJobForm />);

    const textarea = screen.getByPlaceholderText(/Enter URLs/);
    await user.type(textarea, 'not-a-url');
    await user.click(screen.getByRole('button', { name: strings.submitButton }));

    expect(screen.getByText(/valid URL/)).toBeInTheDocument();
  });
});
