import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:5173'],
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/datewise',
  },
  messaging: {
    maxMessageLength: 500,
    messageExpiryDays: 7,
    planningReminderDays: 2,
  },
  matching: {
    dailyMatchCount: 3,
    minSharedActivities: 1,
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'ANTHROPIC_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set in environment variables`);
  }
}
