import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import executeRouter from './routes/execute';
import containerRouter from './routes/container';

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.use('/execute', executeRouter);
app.use('/containers', containerRouter);

app.listen(port, () => {
  console.log(`Runner Service listening on http://localhost:${port}`);
});