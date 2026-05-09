import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'http://localhost:4000',
  EXEC_MEMORY_MB: parseInt(process.env.EXEC_MEMORY_MB || '128', 10),
  EXEC_CPUS: parseFloat(process.env.EXEC_CPUS || '0.5'),
  EXEC_TIMEOUT_MS: parseInt(process.env.EXEC_TIMEOUT_MS || '10000', 10),
};