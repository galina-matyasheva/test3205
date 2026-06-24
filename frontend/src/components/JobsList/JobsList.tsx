import '../../styles/JobsList.scss';

import { type FC, type MouseEvent, useCallback } from 'react';

import { setActiveJobId } from '../../store/activeJobSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteJob } from '../../store/jobsSlice';
import { strings } from '../../strings/jobsList';
import StateView from '../common/StateView';
import JobsListContent from './JobsListContent';

const JobsList: FC = () => {
  const dispatch = useAppDispatch();
  const { items: jobs, isLoading } = useAppSelector((state) => state.jobs);
  const activeJobId = useAppSelector((state) => state.activeJob.jobId);

  const stateView =
    isLoading && jobs.length === 0
      ? { variant: 'loading' as const, message: strings.loading, title: strings.title }
      : jobs.length === 0
        ? { variant: 'empty' as const, message: strings.emptyState, title: `${strings.title} (0)` }
        : null;

  const handleDelete = useCallback(
    (e: MouseEvent, id: string) => {
      e.stopPropagation();
      if (id === activeJobId) dispatch(setActiveJobId(null));
      dispatch(deleteJob(id));
    },
    [dispatch, activeJobId],
  );

  const handleSelect = useCallback((id: string) => dispatch(setActiveJobId(id)), [dispatch]);

  return stateView ? (
    <StateView
      variant={stateView.variant}
      rootClass="jobs-list"
      title={stateView.title}
      message={stateView.message}
    />
  ) : (
    <JobsListContent
      jobs={jobs}
      activeJobId={activeJobId}
      onSelect={handleSelect}
      onDelete={handleDelete}
    />
  );
};

export default JobsList;
