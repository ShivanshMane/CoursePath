import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import route handlers
import programsRouter from './routes/programs';
import coursesRouter from './routes/courses';
import scraperRouter from './routes/scraper';
import plansRouter from './routes/plans';

// Import database
import { testConnection } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/programs', programsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/scraper', scraperRouter);
app.use('/api/plans', plansRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection (optional - app works with JSON files)
    const dbConnected = await testConnection();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 CoursePath Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      if (dbConnected) {
        console.log(`🗄️  Database: PostgreSQL connected`);
      } else {
        console.log(`⚠️  Database: Not connected (using JSON files)`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
