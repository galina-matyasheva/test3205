import './styles/App.scss';

import { type FC, useCallback, useEffect } from 'react';

import CreateJobForm from './components/CreateJobForm';
import JobDetails from './components/JobDetails';
import JobsList from './components/JobsList';
import { clearActiveJobError } from './store/activeJobSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { clearError, fetchJobs } from './store/jobsSlice';
import { strings } from './strings/app';

const App: FC = () => {
  const dispatch = useAppDispatch();
  const { error: jobsError } = useAppSelector((state) => state.jobs);
  const { error: activeJobError } = useAppSelector((state) => state.activeJob);

  const error = jobsError || activeJobError;

  const handleDismissError = useCallback(() => {
    dispatch(clearError());
    dispatch(clearActiveJobError());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchJobs());

    const interval = setInterval(() => {
      dispatch(fetchJobs());
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>{strings.title}</h1>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={handleDismissError}>
            Dismiss
          </button>
        </div>
      )}

      <main className="app__main">
        <div className="left-panel">
          <CreateJobForm />
          <JobsList />
        </div>
        <div className="right-panel">
          <JobDetails />
        </div>
      </main>
    </div>
  );
};

export default App;
