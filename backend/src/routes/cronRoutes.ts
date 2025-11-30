import { Router, Request, Response } from 'express';
import DailyMatchGenerator from '../services/dailyMatchGenerator';

const router = Router();

/**
 * Cron endpoint authentication
 * Can be triggered by:
 * 1. Secret token in header (for external cron services)
 * 2. Later: Admin authentication
 */
const validateCronAuth = (req: Request, res: Response, next: Function) => {
  const cronSecret = process.env.CRON_SECRET || 'change-this-in-production';
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;

  if (providedSecret !== cronSecret) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid cron secret',
    });
    return;
  }

  next();
};

/**
 * POST /api/cron/generate-matches
 * Trigger daily match generation for all users
 *
 * Usage with external cron service (cron-job.org, etc):
 * POST https://your-backend.onrender.com/api/cron/generate-matches
 * Header: X-Cron-Secret: your-secret-token
 *
 * Or with query param:
 * POST https://your-backend.onrender.com/api/cron/generate-matches?secret=your-secret
 */
router.post('/generate-matches', validateCronAuth, async (_req: Request, res: Response) => {
  try {
    console.log('📞 Match generation triggered via cron endpoint');

    const result = await DailyMatchGenerator.generateDailyMatchesForAllUsers();

    res.json({
      success: true,
      data: result,
      message: `Generated ${result.matchesCreated} matches for ${result.usersProcessed} users`,
    });
  } catch (error: any) {
    console.error('❌ Cron match generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Match generation failed',
    });
  }
});

/**
 * GET /api/cron/stats
 * Get daily match generation statistics
 */
router.get('/stats', validateCronAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await DailyMatchGenerator.getGenerationStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Failed to get cron stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stats',
    });
  }
});

/**
 * POST /api/cron/cleanup
 * Clean up old unviewed matches (optional maintenance)
 */
router.post('/cleanup', validateCronAuth, async (_req: Request, res: Response) => {
  try {
    const deletedCount = await DailyMatchGenerator.cleanupOldMatches();

    res.json({
      success: true,
      data: { deletedCount },
      message: `Cleaned up ${deletedCount} old matches`,
    });
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Cleanup failed',
    });
  }
});

export default router;
