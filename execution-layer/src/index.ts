import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";

import { config } from './config/env';

import executeRouter from './routes/execute';
import containerRouter from './routes/container';

import { getHealth } from './controllers/app';

import handleError from './middlewares/errorHandler';

const app = express();
const port = config.PORT;

app.use(helmet());
app.use(cors({ origin: config.ALLOWED_ORIGIN }));
app.use(express.json());

const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: "Too many execution requests from this IP, please try again after a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/execute', executionLimiter, executeRouter);
app.use('/containers', containerRouter);

app.get("/health", getHealth);

app.use(handleError);

const server = app.listen(config.PORT, () => {
  console.log(`Execution layer is running on port ${config.PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});