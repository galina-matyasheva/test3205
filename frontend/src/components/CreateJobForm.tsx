import '../styles/CreateJobForm.scss';

import {
  type FC,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

import { urlsFormSchema } from '../schema/validation';
import { setActiveJobId } from '../store/activeJobSlice';
import { useAppDispatch } from '../store/hooks';
import { createJob, fetchJobs } from '../store/jobsSlice';
import { strings } from '../strings/createJobForm';

const CreateJobForm: FC = () => {
  const [urlsText, setUrlsText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitDisabled = !urlsText.trim() || isSubmitting;
  const hasValidationErrors = validationErrors.length > 0;

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrlsText(e.target.value);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = useCallback(
    async (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      const urls = urlsText
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const result = urlsFormSchema.safeParse(urls);

      if (!result.success) {
        setValidationErrors(result.error.issues.map((i) => i.message));
        return;
      }

      setValidationErrors([]);
      setIsSubmitting(true);

      try {
        const res = await dispatch(createJob(result.data)).unwrap();
        dispatch(fetchJobs());
        dispatch(setActiveJobId(res.jobId));
        setUrlsText('');
      } catch (err) {
        console.error(strings.errorLog, err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, urlsText],
  );

  return (
    <div className="create-job-form">
      <h2 className="create-job-form__title">{strings.title}</h2>
      <form className="create-job-form__form" onSubmit={handleSubmit} ref={formRef}>
        <textarea
          className="create-job-form__textarea"
          value={urlsText}
          onChange={handleChange}
          placeholder={strings.placeholder}
          rows={6}
          onKeyDown={handleKeyDown}
        />
        {hasValidationErrors && (
          <div className="create-job-form__errors">
            {validationErrors.map((msg, i) => (
              <div key={i} className="create-job-form__error">
                {msg}
              </div>
            ))}
          </div>
        )}
        <button className="create-job-form__button" type="submit" disabled={isSubmitDisabled}>
          {strings.submitButton}
        </button>
      </form>
    </div>
  );
};

export default CreateJobForm;
