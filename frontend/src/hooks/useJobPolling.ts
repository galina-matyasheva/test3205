import { useCallback, useEffect, useRef } from 'react';

import { fetchJobDetails } from '../store/activeJobSlice';
import { useAppDispatch } from '../store/hooks';
import { fetchJobs } from '../store/jobsSlice';

const FINAL_STATUSES = ['success', 'cancelled', 'failed'] as const;

export const useJobPolling = (jobId: string | null) => {
  const dispatch = useAppDispatch();
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    dispatch(fetchJobDetails(jobId));

    const interval = window.setInterval(() => {
      dispatch(fetchJobDetails(jobId)).then((action) => {
        if (cancelled) return;
        if (fetchJobDetails.fulfilled.match(action)) {
          if (FINAL_STATUSES.includes(action.payload.status as (typeof FINAL_STATUSES)[number])) {
            stopPolling();
            dispatch(fetchJobs());
          }
        }
      });
    }, 2000);

    pollingRef.current = interval;

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [jobId, dispatch, stopPolling]);

  return { stopPolling };
};
