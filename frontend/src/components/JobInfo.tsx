import '../styles/JobDetails.scss';

import { type FC } from 'react';

import { strings } from '../strings/jobDetails';
import type { Job } from '../types';

interface JobInfoProps {
  details: Job;
  isJobActive: boolean;
  processedCount: number;
  successCount: number;
  errorCount: number;
  cancelledCount: number;
  cancelling: boolean;
  onCancel: () => void;
}

const JobInfo: FC<JobInfoProps> = ({
  details,
  isJobActive,
  processedCount,
  successCount,
  errorCount,
  cancelledCount,
  cancelling,
  onCancel,
}) => {
  const statusLabel = details.status.replace('_', ' ');
  const progressLabel = `${processedCount} / ${details.urls.length} ${strings.urlsLabel}`;
  const errorLabel = `(${errorCount} error${errorCount !== 1 ? 's' : ''})`;

  const hasSuccess = successCount > 0;
  const hasErrors = errorCount > 0;
  const hasCancelled = cancelledCount > 0;
  const showSuccessBadge = hasSuccess && (hasErrors || hasCancelled);

  const createdAt = new Date(details.createdAt).toLocaleString();
  const updatedAt = new Date(details.updatedAt).toLocaleString();
  const cancelButtonText = cancelling ? strings.cancelling : strings.cancelJob;

  return (
    <div className="job-info">
      <div className="job-info__container">
        <div className="job-info__item">
          <span className="job-info__item-label">{strings.statusLabel}</span>
          <span className={`job-info__status job-info__status--${details.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="job-info__item">
          <span className="job-info__item-label">{strings.progressLabel}</span>
          <span className="job-info__item-value">
            {progressLabel}
            {showSuccessBadge && (
              <span className="job-info__success"> ({successCount} success)</span>
            )}
            {hasErrors && <span className="job-info__error">{errorLabel}</span>}
            {hasCancelled && (
              <span className="job-info__cancelled"> ({cancelledCount} cancelled)</span>
            )}
          </span>
        </div>

        <div className="job-info__item">
          <span className="job-info__item-label">{strings.createdLabel}</span>
          <span className="job-info__item-value">{createdAt}</span>
        </div>

        <div className="job-info__item">
          <span className="job-info__item-label">{strings.lastUpdatedLabel}</span>
          <span className="job-info__item-value">{updatedAt}</span>
        </div>
      </div>

      {isJobActive && (
        <button
          className="job-info__cancel-btn"
          onClick={onCancel}
          disabled={cancelling}
          aria-label={strings.cancelJobAriaLabel}
        >
          {cancelButtonText}
        </button>
      )}
    </div>
  );
};

export default JobInfo;
