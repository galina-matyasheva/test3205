import { type Request, type Response, Router } from 'express';

import { processJob } from '../services/urlChecker';
import * as store from '../store';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: 'urls must be a non-empty array' });
    return;
  }

  for (const url of urls) {
    if (typeof url !== 'string' || url.trim().length === 0) {
      res.status(400).json({ error: 'Each URL must be a non-empty string' });
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      res.status(400).json({ error: 'Each URL must start with http:// or https://' });
      return;
    }
  }

  const sanitizedUrls = urls.map((u: string) => u.trim());
  const jobId = store.createJob(sanitizedUrls);

  processJob(jobId).catch((err) => console.error('Job processing failed:', err));

  res.status(201).json({ jobId });
});

router.get('/', (_req: Request, res: Response) => {
  const jobs = store.getAllJobs();
  res.json(jobs);
});

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const job = store.getJob(id);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json(job);
});

router.post('/:id/cancel', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const record = store.getJobRecord(id);

  if (!record) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (record.status === 'pending' || record.status === 'in_progress') {
    store.setJobStatus(id, 'cancelled');
    for (const url of record.urls) {
      if (url.status !== 'success' && url.status !== 'error' && url.status !== 'cancelled') {
        store.updateUrlStatus(id, url.url, { status: 'cancelled' });
      }
    }
  }

  res.json({ success: true });
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const record = store.getJobRecord(id);

  if (!record) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  store.deleteJob(id);

  res.status(204).send();
});

router.patch('/:id/cancel-url', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url must be a non-empty string' });
    return;
  }

  const ok = store.cancelUrl(id, url);
  if (!ok) {
    res.status(404).json({ error: 'Job or URL not found, or already in final state' });
    return;
  }

  res.json({ success: true });
});

export default router;
