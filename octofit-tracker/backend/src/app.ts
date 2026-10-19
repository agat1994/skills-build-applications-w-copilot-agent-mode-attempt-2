import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes/api.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.get('/', (_request, response) => response.json({
    name: 'OctoFit Tracker API',
    endpoints: ['/health', '/api/activities', '/api/teams', '/api/leaderboard', '/api/workouts/suggestions/:userEmail'],
  }));
  app.use('/api', apiRouter);
  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));
  app.use((error: Error & { status?: number }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(error.status ?? 500).json({ error: error.message });
  });
  return app;
}
