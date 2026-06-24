import { type FC, type KeyboardEvent, type MouseEvent, useCallback } from 'react';

import { CloseIcon } from '../../icons/closeIcon';
import { strings } from '../../strings/jobsList';
import type { JobSummary } from '../../types';

interface JobItemProps {
  job: JobSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (e: MouseEvent, id: string) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

const JobItem: FC<JobItemProps> = ({ job, isActive, onSelect, onDelete }) => {
  const successCount = job.processedCount - job.errorCount;
  const hasSuccess = successCount > 0;
  const hasErrors = job.errorCount > 0;
  const hasCancelled = job.cancelledCount > 0;
  const hasOtherStatuses = hasErrors || hasCancelled;
  const shortId = job.id.substring(0, 8);
  const statusLabel = job.status.replace('_', ' ');
  const itemClass = `job-item ${isActive ? 'job-item--active' : ''}`;
  const statusClass = `job-item__status job-item__status--${job.status}`;
  const formattedDate = formatDate(job.createdAt);

  const successPercent = job.urlCount > 0 ? (successCount / job.urlCount) * 100 : 0;
  const errorPercent = job.urlCount > 0 ? (job.errorCount / job.urlCount) * 100 : 0;
  const cancelledPercent = job.urlCount > 0 ? (job.cancelledCount / job.urlCount) * 100 : 0;

  const progressLabel = `${job.processedCount}/${job.urlCount} ${strings.urlsLabel}`;
  const errorLabel = `(${job.errorCount} error${job.errorCount !== 1 ? 's' : ''})`;

  const handleClick = useCallback(() => onSelect(job.id), [onSelect, job.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLLIElement>) => {
      if (e.key === 'Enter' || e.key === ' ') onSelect(job.id);
    },
    [onSelect, job.id],
  );

  const handleDelete = useCallback(
    (e: MouseEvent<Element>) => {
      e.stopPropagation();
      onDelete(e, job.id);
    },
    [onDelete, job.id],
  );

  return (
    <li
      className={itemClass}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="job-item__header">
        <span className="job-item__id">{shortId}...</span>
        <span className="job-item__date">{formattedDate}</span>
      </div>
      <div>
        <span className={statusClass}>{statusLabel}</span>
      </div>
      <div className="job-item__progress">
        <span>{progressLabel}</span>
        {hasSuccess && hasOtherStatuses && (
          <span className="job-item__success-count">({successCount} success)</span>
        )}
        {hasErrors && <span className="job-item__error-count">{errorLabel}</span>}
        {hasCancelled && (
          <span className="job-item__cancelled-count">({job.cancelledCount} cancelled)</span>
        )}
      </div>
      <div className="job-item__progress-bar">
        {successPercent > 0 && (
          <div
            className="job-item__progress-bar-segment job-item__progress-bar-segment--success"
            style={{ width: `${successPercent}%` }}
          />
        )}
        {errorPercent > 0 && (
          <div
            className="job-item__progress-bar-segment job-item__progress-bar-segment--error"
            style={{ width: `${errorPercent}%` }}
          />
        )}
        {cancelledPercent > 0 && (
          <div
            className="job-item__progress-bar-segment job-item__progress-bar-segment--cancelled"
            style={{ width: `${cancelledPercent}%` }}
          />
        )}
      </div>
      <button
        className="job-item__delete-btn"
        onClick={handleDelete}
        title={strings.deleteJob}
        aria-label={strings.deleteJob}
      >
        <CloseIcon size={14} />
      </button>
    </li>
  );
};

export default JobItem;
