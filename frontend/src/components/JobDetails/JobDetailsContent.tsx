import { type FC } from 'react';

import { strings } from '../../strings/jobDetails';
import type { Job } from '../../types';
import JobInfo from '../JobInfo';
import UrlList from '../UrlList';

const FINAL_STATUSES = ['success', 'cancelled', 'failed'] as const;

interface JobDetailsContentProps {
  details: Job;
  error: string | null;
  cancelling: boolean;
  cancellingUrls: string[];
  urlErrors: Record<string, string>;
  onCancel: () => void;
  onCancelUrl: (url: string) => void;
}

const JobDetailsContent: FC<JobDetailsContentProps> = ({
  details,
  error,
  cancelling,
  cancellingUrls,
  urlErrors,
  onCancel,
  onCancelUrl,
}) => {
  const isJobActive = !FINAL_STATUSES.includes(details.status as (typeof FINAL_STATUSES)[number]);
  const successCount = details.processedCount - details.errorCount;
  const errorCount = details.urls.filter((u) => u.status === 'error').length;
  const cancelledCount = details.urls.filter((u) => u.status === 'cancelled').length;

  return (
    <div className="job-details">
      <h2 className="job-details__title">{strings.title}</h2>

      {error && <div className="job-details__error">{error}</div>}

      <JobInfo
        details={details}
        isJobActive={isJobActive}
        processedCount={successCount + errorCount}
        successCount={successCount}
        errorCount={errorCount}
        cancelledCount={cancelledCount}
        cancelling={cancelling}
        onCancel={onCancel}
      />

      <UrlList
        urls={details.urls}
        cancellingUrls={cancellingUrls}
        urlErrors={urlErrors}
        onCancelUrl={onCancelUrl}
      />
    </div>
  );
};

export default JobDetailsContent;
