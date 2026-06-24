import '../styles/JobDetails.scss';

import { type FC } from 'react';

import { strings } from '../strings/jobDetails';
import type { UrlCheck } from '../types';
import { formatDuration } from '../utils/formatDuration';

interface UrlItemProps {
  urlCheck: UrlCheck;
  index: number;
  showCancel: boolean;
  cancelling: boolean;
  cancelError?: string;
  onCancel: () => void;
}

const UrlItem: FC<UrlItemProps> = ({
  urlCheck,
  index,
  showCancel,
  cancelling,
  cancelError,
  onCancel,
}) => {
  const isPending = urlCheck.status === 'pending' || urlCheck.status === 'in_progress';
  const statusLabel = urlCheck.status.replace('_', ' ');
  const statusClass = `url-item__status url-item__status--${urlCheck.status}`;
  const cancelButtonText = cancelling ? strings.cancelling : strings.cancel;
  const cancelAriaLabel = `Cancel ${urlCheck.url}`;
  const displayIndex = index + 1;

  const hasHttpStatus = urlCheck.httpStatus != null;
  const hasDuration = urlCheck.duration != null;
  const hasStartTime = !!urlCheck.startTime;
  const hasEndTime = !!urlCheck.endTime;

  const httpStatusLabel = hasHttpStatus ? `${strings.httpPrefix}${urlCheck.httpStatus}` : '';

  const durationLabel = hasDuration
    ? `${strings.durationPrefix}${formatDuration(urlCheck.duration!)}`
    : '';

  const startTimeLabel = hasStartTime
    ? `${strings.startPrefix}${new Date(urlCheck.startTime!).toLocaleTimeString()}`
    : '';

  const endTimeLabel = hasEndTime
    ? `${strings.endPrefix}${new Date(urlCheck.endTime!).toLocaleTimeString()}`
    : '';

  const errorMessage = urlCheck.error ? `${strings.errorPrefix}${urlCheck.error}` : '';
  const cancelErrorMessage = cancelError ? `${strings.cancelErrorPrefix}${cancelError}` : '';

  return (
    <li className="url-item">
      <div className="url-item__header">
        <span className="url-item__url">
          <span className="url-item__index">{displayIndex}.</span>
          {urlCheck.url}
        </span>
        {showCancel &&
          (isPending ? (
            <button
              className="url-item__cancel-btn"
              onClick={onCancel}
              disabled={cancelling}
              aria-label={cancelAriaLabel}
            >
              {cancelButtonText}
            </button>
          ) : (
            <span className={statusClass}>{statusLabel}</span>
          ))}
      </div>

      <div className="url-item__details">
        {hasHttpStatus && <span>{httpStatusLabel}</span>}
        {hasDuration && <span>{durationLabel}</span>}
        {hasStartTime && <span>{startTimeLabel}</span>}
        {hasEndTime && <span>{endTimeLabel}</span>}
      </div>

      {errorMessage && <div className="url-item__error">{errorMessage}</div>}
      {cancelErrorMessage && <div className="url-item__error">{cancelErrorMessage}</div>}
    </li>
  );
};

export default UrlItem;
