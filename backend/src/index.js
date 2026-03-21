import cors from 'cors';
import express from 'express';
import { mockSchedule } from './mockSchedule.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'room-tablet-backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/schedule/mock', (_req, res) => {
  res.status(200).json({
    room: 'A-204',
    source: 'mock',
    generatedAt: new Date().toISOString(),
    items: mockSchedule
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port}`);
});
