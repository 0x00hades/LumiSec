import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import express, { json, urlencoded } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { dbConnection } from './database/connection.js';
import dotenv from 'dotenv';
dotenv.config();

// ✅ إصلاح __dirname في ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure sent_emails directory exists
const sentEmailsDir = join(__dirname, 'sent_emails');
if (!existsSync(sentEmailsDir)) {
  mkdirSync(sentEmailsDir, { recursive: true });
}

const app = express();

// Security middleware
app.use(helmet());

// Basic rate limiting (adjust in production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ extended: true }));

// MongoDB Connection
dbConnection();

// ✅ Routes
import { apiRouter } from './src/modules/index.js';
app.use('/', apiRouter);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
