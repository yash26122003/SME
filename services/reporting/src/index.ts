import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';

import reportRoutes from './routes/reports';
import templateRoutes from './routes/templates';
import exportRoutes from './routes/exports';
import scheduleRoutes from './routes/schedules';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeScheduledReports } from './services/scheduledReports';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for report generation
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'reporting',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/reports', reportRoutes);
app.use('/templates', templateRoutes);
app.use('/exports', exportRoutes);
app.use('/schedules', scheduleRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize scheduled reports
initializeScheduledReports();

// Start scheduled report cleanup (runs every hour)
cron.schedule('0 * * * *', async () => {
  logger.info('Running scheduled report cleanup');
  // Add cleanup logic for old reports
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  logger.info(`Reporting Service running on port ${PORT}`);
});

export default app;
