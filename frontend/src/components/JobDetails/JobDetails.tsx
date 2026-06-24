import '../../styles/JobDetails.scss';

import { type FC } from 'react';

import { useJobPolling } from '../../hooks/useJobPolling';
import { cancelJob, cancelSingleUrl, fetchJobDetails } from '../../store/activeJobSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobs } from '../../store/jobsSlice';
import { strings } from '../../strings/jobDetails';
import StateView from '../common/StateView';
import JobDetailsContent from './JobDetailsContent';

const JobDetails: FC = () => {
  const dispatch = useAppDispatch();
  const { jobId, details, isLoading, error, cancellingUrls, urlErrors, cancelling } =
    useAppSelector((state) => state.activeJob);
  const { stopPolling } = useJobPolling(jobId);

  const handleCancel = () => {
    if (!jobId) return;
    stopPolling();
    dispatch(cancelJob(jobId))
      .then(() => {
        dispatch(fetchJobDetails(jobId));
        dispatch(fetchJobs());
      })
      .catch(() => {});
  };

  const handleCancelUrl = (url: string) => {
    if (!jobId) return;
    dispatch(cancelSingleUrl({ jobId, url }));
  };

  const state =
    !jobId
      ? { kind: 'empty' as const, message: strings.emptyState }
      : isLoading && !details
        ? { kind: 'loading' as const, message: strings.loading }
        : !details
          ? { kind: 'error' as const, message: strings.failedToLoad }
          : { kind: 'data' as const, details };

  return state.kind === 'data' ? (
    <JobDetailsContent
      details={state.details}
      error={error}
      cancelling={cancelling}
      cancellingUrls={cancellingUrls}
      urlErrors={urlErrors}
      onCancel={handleCancel}
      onCancelUrl={handleCancelUrl}
    />
  ) : (
    <StateView
      variant={state.kind}
      rootClass="job-details"
      title={strings.title}
      message={state.message}
    />
  );
};

export default JobDetails;
