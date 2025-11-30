import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest, InterestStatus, DatePlanStatus } from '../types';
import MatchingService from '../services/matchingService';

// Get today's matches for current user
export const getDailyMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const matches = await MatchingService.getTodaysMatches(req.user.id);

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error('Get daily matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches',
    });
  }
};

// Express interest in a match (Like)
export const expressInterest = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { matchId } = req.params;
    const { interested } = req.body; // true = like, false = pass

    // Get match details
    const matchResult = await client.query(
      'SELECT * FROM matches WHERE id = $1',
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Match not found' });
      return;
    }

    const match = matchResult.rows[0];

    // Determine from_user and to_user
    const fromUserId = req.user.id;
    let toUserId: number;

    if (match.user_a_id === fromUserId) {
      toUserId = match.user_b_id;
    } else if (match.user_b_id === fromUserId) {
      toUserId = match.user_a_id;
    } else {
      res.status(403).json({ success: false, error: 'Not your match' });
      return;
    }

    // Check if interest already expressed
    const existingInterest = await client.query(
      'SELECT id FROM interests WHERE from_user_id = $1 AND to_user_id = $2',
      [fromUserId, toUserId]
    );

    if (existingInterest.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Interest already expressed' });
      return;
    }

    // Create interest record
    const status = interested ? InterestStatus.ACCEPTED : InterestStatus.REJECTED;

    const interestResult = await client.query(
      `INSERT INTO interests (from_user_id, to_user_id, match_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fromUserId, toUserId, matchId, status]
    );

    // Check if it's a mutual match (both liked each other)
    let isMutualMatch = false;
    if (interested) {
      const reciprocalInterest = await client.query(
        `SELECT id FROM interests
         WHERE from_user_id = $1 AND to_user_id = $2 AND status = $3`,
        [toUserId, fromUserId, InterestStatus.ACCEPTED]
      );

      if (reciprocalInterest.rows.length > 0) {
        isMutualMatch = true;

        // Create date plan record
        await client.query(
          `INSERT INTO date_plans (match_id, status)
           VALUES ($1, $2)`,
          [matchId, DatePlanStatus.PLANNING]
        );
      }
    }

    res.json({
      success: true,
      data: {
        interest: interestResult.rows[0],
        isMutualMatch,
      },
      message: isMutualMatch
        ? '🎉 It\'s a mutual match! Start planning your date.'
        : interested
          ? 'Interest sent! Waiting for their response.'
          : 'Passed on this match.',
    });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to express interest',
    });
  } finally {
    client.release();
  }
};

// Get pending interests (people waiting for your response)
export const getPendingInterests = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await client.query(
      `SELECT
        i.id,
        i.from_user_id,
        i.created_at,
        i.match_id,
        m.ai_compatibility_reasons,
        m.ai_date_suggestions,
        m.shared_activities
       FROM interests i
       JOIN matches m ON i.match_id = m.id
       WHERE i.to_user_id = $1
         AND i.status = $2
         AND NOT EXISTS (
           SELECT 1 FROM interests i2
           WHERE i2.from_user_id = $1 AND i2.to_user_id = i.from_user_id
         )
       ORDER BY i.created_at DESC`,
      [req.user.id, InterestStatus.ACCEPTED]
    );

    const pending = await Promise.all(
      result.rows.map(async row => {
        const profile = await MatchingService.getUserProfile(row.from_user_id);
        return {
          interestId: row.id,
          matchId: row.match_id,
          profile,
          interestSentAt: row.created_at,
          aiInsights: {
            whyMeet: row.ai_compatibility_reasons || [],
            dateIdeas: row.ai_date_suggestions || [],
          },
          sharedActivities: row.shared_activities || [],
        };
      })
    );

    res.json({
      success: true,
      data: pending,
    });
  } catch (error) {
    console.error('Get pending interests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending interests',
    });
  } finally {
    client.release();
  }
};

// Get mutual matches
export const getMutualMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await client.query(
      `SELECT
        m.id as match_id,
        m.user_a_id,
        m.user_b_id,
        m.ai_compatibility_reasons,
        m.ai_date_suggestions,
        m.shared_activities,
        m.created_at as matched_at,
        dp.id as date_plan_id,
        dp.selected_activity_id,
        dp.venue_name,
        dp.date_time,
        dp.status as date_status,
        CASE
          WHEN m.user_a_id = $1 THEN m.user_b_id
          ELSE m.user_a_id
        END as other_user_id,
        (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND from_user_id != $1 AND is_read = false) as unread_count
       FROM matches m
       INNER JOIN interests i1 ON
         ((m.user_a_id = i1.from_user_id AND m.user_b_id = i1.to_user_id) OR
          (m.user_b_id = i1.from_user_id AND m.user_a_id = i1.to_user_id))
         AND i1.status = $2
       INNER JOIN interests i2 ON
         ((m.user_a_id = i2.to_user_id AND m.user_b_id = i2.from_user_id) OR
          (m.user_b_id = i2.to_user_id AND m.user_a_id = i2.from_user_id))
         AND i2.status = $2
       LEFT JOIN date_plans dp ON m.id = dp.match_id
       WHERE m.user_a_id = $1 OR m.user_b_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id, InterestStatus.ACCEPTED]
    );

    const mutualMatches = await Promise.all(
      result.rows.map(async row => {
        const profile = await MatchingService.getUserProfile(row.other_user_id);
        return {
          matchId: row.match_id,
          profile,
          matchedAt: row.matched_at,
          aiInsights: {
            whyMeet: row.ai_compatibility_reasons || [],
            dateIdeas: row.ai_date_suggestions || [],
          },
          sharedActivities: row.shared_activities || [],
          datePlan: row.date_plan_id ? {
            id: row.date_plan_id,
            selectedActivityId: row.selected_activity_id,
            venueName: row.venue_name,
            dateTime: row.date_time,
            status: row.date_status,
          } : null,
          unreadMessages: parseInt(row.unread_count) || 0,
        };
      })
    );

    res.json({
      success: true,
      data: mutualMatches,
    });
  } catch (error) {
    console.error('Get mutual matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mutual matches',
    });
  } finally {
    client.release();
  }
};

// Get dashboard data (all match states)
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // Get all data in parallel
    const [todaysMatches, pendingResponse, mutualMatchesResponse, statsResponse] = await Promise.all([
      MatchingService.getTodaysMatches(req.user.id),
      // Pending (awaiting their response)
      pool.query(
        `SELECT i.from_user_id, i.created_at
         FROM interests i
         WHERE i.from_user_id = $1 AND i.status = $2
           AND NOT EXISTS (
             SELECT 1 FROM interests i2
             WHERE i2.from_user_id = i.to_user_id AND i2.to_user_id = $1
           )`,
        [req.user.id, InterestStatus.ACCEPTED]
      ),
      // Mutual matches count
      pool.query(
        `SELECT COUNT(DISTINCT m.id) as count
         FROM matches m
         WHERE (m.user_a_id = $1 OR m.user_b_id = $1)
           AND EXISTS (
             SELECT 1 FROM interests i1
             WHERE i1.match_id = m.id AND i1.status = $2
           )
           AND EXISTS (
             SELECT 1 FROM interests i2
             WHERE i2.match_id = m.id AND i2.status = $2
               AND i2.from_user_id != (SELECT i1.from_user_id FROM interests i1 WHERE i1.match_id = m.id LIMIT 1)
           )`,
        [req.user.id, InterestStatus.ACCEPTED]
      ),
      // Stats
      pool.query(
        `SELECT
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN dp.id IS NOT NULL THEN dp.id END) as dates_planned,
          COUNT(DISTINCT CASE WHEN dp.status = $2 THEN dp.id END) as dates_completed
         FROM matches m
         LEFT JOIN date_plans dp ON m.id = dp.match_id
         WHERE m.user_a_id = $1 OR m.user_b_id = $1`,
        [req.user.id, DatePlanStatus.COMPLETED]
      ),
    ]);

    const pending = await Promise.all(
      pendingResponse.rows.map(async row => {
        const profile = await MatchingService.getUserProfile(row.from_user_id);
        return {
          profile,
          interestSentAt: row.created_at,
        };
      })
    );

    res.json({
      success: true,
      data: {
        todaysMatches,
        pending,
        stats: {
          totalMatches: parseInt(statsResponse.rows[0].total_matches) || 0,
          mutualMatches: parseInt(mutualMatchesResponse.rows[0].count) || 0,
          datesPlanned: parseInt(statsResponse.rows[0].dates_planned) || 0,
          datesCompleted: parseInt(statsResponse.rows[0].dates_completed) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard',
    });
  }
};

// Admin: Create manual match
export const createManualMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // TODO: Add admin check
    // if (!req.user.isAdmin) { ... }

    const { userAId, userBId } = req.body;

    const match = await MatchingService.createMatch(userAId, userBId);

    res.status(201).json({
      success: true,
      data: match,
      message: 'Match created successfully',
    });
  } catch (error: any) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create match',
    });
  }
};

// Admin: Get potential matches for a user
export const getPotentialMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const potentialMatches = await MatchingService.findPotentialMatches(
      parseInt(userId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: potentialMatches,
    });
  } catch (error: any) {
    console.error('Get potential matches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch potential matches',
    });
  }
};
