import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';

import jobsRouter from './routes/jobs';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobsRouter);

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'URL Checker API',
    endpoints: [
      'POST /api/jobs',
      'GET /api/jobs',
      'GET /api/jobs/:id',
      'POST /api/jobs/:id/cancel',
      'DELETE /api/jobs/:id',
      'PATCH /api/jobs/:id/cancel-url',
    ],
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

app
  .listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .on('error', (err: Error) => {
    console.error('Server failed to start:', err.message);
    process.exit(1);
  });
