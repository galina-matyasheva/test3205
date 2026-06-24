import cors from 'cors';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import jobsRouter from '../routes/jobs.js';

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/jobs', jobsRouter);
  return app;
}

describe('POST /api/jobs', () => {
  const app = createApp();

  it('creates a job with valid URLs', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com', 'https://google.com'] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('jobId');
  });

  it('rejects empty URLs array', async () => {
    const res = await request(app).post('/api/jobs').send({ urls: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('urls must be a non-empty array');
  });

  it('rejects non-array body', async () => {
    const res = await request(app).post('/api/jobs').send({ urls: 'not-array' });

    expect(res.status).toBe(400);
  });

  it('rejects empty string URL', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ urls: [''] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Each URL must be a non-empty string');
  });

  it('rejects URL without http/https', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ urls: ['ftp://example.com'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('http');
  });
});

describe('GET /api/jobs', () => {
  const app = createApp();

  it('returns list of jobs', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/jobs/:id', () => {
  const app = createApp();

  it('returns 404 for non-existent job', async () => {
    const res = await request(app).get('/api/jobs/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Job not found');
  });

  it('returns job by id', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com'] });

    const res = await request(app).get(`/api/jobs/${createRes.body.jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createRes.body.jobId);
    expect(res.body.urls).toHaveLength(1);
  });
});

describe('POST /api/jobs/:id/cancel', () => {
  const app = createApp();

  it('cancels an active job', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com', 'https://google.com'] });

    const cancelRes = await request(app).post(`/api/jobs/${createRes.body.jobId}/cancel`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    const job = await request(app).get(`/api/jobs/${createRes.body.jobId}`);
    expect(job.body.status).toBe('cancelled');
    expect(job.body.urls.every((u: { status: string }) => u.status === 'cancelled')).toBe(true);
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app).post('/api/jobs/non-existent/cancel');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/jobs/:id', () => {
  const app = createApp();

  it('deletes a job', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com'] });

    const deleteRes = await request(app).delete(`/api/jobs/${createRes.body.jobId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/api/jobs/${createRes.body.jobId}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app).delete('/api/jobs/non-existent');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/jobs/:id/cancel-url', () => {
  const app = createApp();

  it('cancels a specific URL', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com', 'https://google.com'] });

    const cancelRes = await request(app)
      .patch(`/api/jobs/${createRes.body.jobId}/cancel-url`)
      .send({ url: 'https://example.com' });

    expect(cancelRes.status).toBe(200);

    const job = await request(app).get(`/api/jobs/${createRes.body.jobId}`);
    expect(job.body.urls[0]?.status).toBe('cancelled');
    expect(job.body.urls[1]?.status).toBe('pending');
  });

  it('returns 400 without url in body', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ urls: ['https://example.com'] });

    const res = await request(app).patch(`/api/jobs/${createRes.body.jobId}/cancel-url`).send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app)
      .patch('/api/jobs/non-existent/cancel-url')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(404);
  });
});
