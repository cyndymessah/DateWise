import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import pool from './config/database';
import routes from './routes';

const app = express();

// Trust proxy - required for Render/Railway/Heroku and other platforms behind reverse proxy
// This allows express-rate-limit to correctly identify users by IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Log CORS configuration on startup
console.log('🔒 CORS enabled for origins:', config.allowedOrigins);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'DateWise API',
    version: '1.0.0',
    description: 'Activity-first dating app API',
    status: 'running',
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection verified');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   💚 DateWise API Server                          ║
║                                                   ║
║   Environment: ${config.nodeEnv.padEnd(32)}       ║
║   Port: ${PORT.toString().padEnd(39)}       ║
║   URL: http://localhost:${PORT.toString().padEnd(22)}       ║
║                                                   ║
║   Status: ✅ Running                              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

export default app;
