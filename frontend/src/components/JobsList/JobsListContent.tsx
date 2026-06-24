import { type FC, type MouseEvent } from 'react';

import { strings } from '../../strings/jobsList';
import type { JobSummary } from '../../types';
import JobItem from './JobItem';

interface JobsListContentProps {
  jobs: JobSummary[];
  activeJobId: string | null;
  onSelect: (id: string) => void;
  onDelete: (e: MouseEvent, id: string) => void;
}

const JobsListContent: FC<JobsListContentProps> = ({ jobs, activeJobId, onSelect, onDelete }) => {
  const title = `${strings.title} (${jobs.length})`;

  return (
    <div className="jobs-list">
      <h2 className="jobs-list__title">{title}</h2>
      <ul className="jobs-list__list">
        {jobs.map((job) => (
          <JobItem
            key={job.id}
            job={job}
            isActive={job.id === activeJobId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
};

export default JobsListContent;
