import pool from '../config/database';
import { config } from '../config';
import MatchingService from './matchingService';

export class DailyMatchGenerator {
  /**
   * Generate daily matches for all active users
   * Can be triggered by:
   * 1. External cron service (free tier compatible)
   * 2. Manual API call
   * 3. On user login (lazy generation)
   */
  static async generateDailyMatchesForAllUsers(): Promise<{
    usersProcessed: number;
    matchesCreated: number;
    errors: Array<{ userId: number; error: string }>;
  }> {
    const client = await pool.connect();
    const startTime = Date.now();

    try {
      console.log('🎯 Starting daily match generation...');

      // Get all active users who need matches today
      const usersResult = await client.query(
        `SELECT u.id, u.name, u.last_active
         FROM users u
         WHERE u.profile_completed = true
           AND u.last_active > NOW() - INTERVAL '30 days'
           -- Only generate for users who don't have matches for today yet
           AND NOT EXISTS (
             SELECT 1 FROM matches m
             WHERE (m.user_a_id = u.id OR m.user_b_id = u.id)
               AND m.shown_date = CURRENT_DATE
           )
         ORDER BY u.last_active DESC`
      );

      const users = usersResult.rows;
      console.log(`📊 Found ${users.length} users needing matches`);

      let matchesCreated = 0;
      const errors: Array<{ userId: number; error: string }> = [];
      const processedPairs = new Set<string>(); // Track created pairs to avoid duplicates

      for (const user of users) {
        try {
          // Find potential matches for this user
          const potentialMatches = await MatchingService.findPotentialMatches(
            user.id,
            config.matching.dailyMatchCount // Default: 3 matches per day
          );

          console.log(`  👤 ${user.name}: Found ${potentialMatches.length} potential matches`);

          // Create matches with top candidates
          for (const potential of potentialMatches) {
            try {
              // Create a unique pair identifier (sorted to avoid duplicates)
              const pairKey = [user.id, potential.user.id].sort().join('-');

              // Skip if we already created this pair today
              if (processedPairs.has(pairKey)) {
                continue;
              }

              // Create the match
              await MatchingService.createMatch(user.id, potential.user.id);

              matchesCreated++;
              processedPairs.add(pairKey);

              console.log(`    ✅ Matched ${user.name} with ${potential.user.name} (score: ${potential.score})`);
            } catch (matchError: any) {
              // Log but don't stop if individual match creation fails
              console.error(`    ⚠️  Failed to match ${user.name} with ${potential.user.name}:`, matchError.message);
            }
          }

          // Prevent rate limiting on AI API
          if (potentialMatches.length > 0) {
            await this.sleep(1000); // 1 second delay between users
          }
        } catch (userError: any) {
          console.error(`  ❌ Error processing user ${user.name}:`, userError.message);
          errors.push({
            userId: user.id,
            error: userError.message,
          });
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`🎉 Daily match generation completed in ${duration}s`);
      console.log(`   Users processed: ${users.length}`);
      console.log(`   Matches created: ${matchesCreated}`);
      console.log(`   Errors: ${errors.length}`);

      return {
        usersProcessed: users.length,
        matchesCreated,
        errors,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate matches for a specific user (lazy generation on login)
   */
  static async generateMatchesForUser(userId: number): Promise<number> {
    const client = await pool.connect();

    try {
      // Check if user already has matches for today
      const existingMatches = await client.query(
        `SELECT COUNT(*) as count
         FROM matches
         WHERE (user_a_id = $1 OR user_b_id = $1)
           AND shown_date = CURRENT_DATE`,
        [userId]
      );

      const currentMatchCount = parseInt(existingMatches.rows[0].count);

      // If user already has enough matches, skip
      if (currentMatchCount >= config.matching.dailyMatchCount) {
        console.log(`User ${userId} already has ${currentMatchCount} matches today`);
        return 0;
      }

      // Generate matches for this user
      const neededMatches = config.matching.dailyMatchCount - currentMatchCount;
      const potentialMatches = await MatchingService.findPotentialMatches(userId, neededMatches);

      let created = 0;
      for (const potential of potentialMatches) {
        try {
          await MatchingService.createMatch(userId, potential.user.id);
          created++;
        } catch (error) {
          console.error(`Failed to create match for user ${userId}:`, error);
        }
      }

      console.log(`✅ Generated ${created} new matches for user ${userId}`);
      return created;
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old matches (optional maintenance task)
   */
  static async cleanupOldMatches(): Promise<number> {
    const client = await pool.connect();

    try {
      // Delete matches older than 30 days that were never acted upon
      const result = await client.query(
        `DELETE FROM matches
         WHERE shown_date < CURRENT_DATE - INTERVAL '30 days'
           AND NOT EXISTS (
             SELECT 1 FROM interests i WHERE i.match_id = matches.id
           )
         RETURNING id`
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old unviewed matches`);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get generation statistics
   */
  static async getGenerationStats(): Promise<{
    todayMatches: number;
    usersWithMatches: number;
    averageMatchesPerUser: number;
    pendingUsers: number;
  }> {
    const client = await pool.connect();

    try {
      const stats = await client.query(
        `SELECT
          COUNT(DISTINCT m.id) as today_matches,
          COUNT(DISTINCT CASE WHEN m.user_a_id IS NOT NULL THEN m.user_a_id END) +
          COUNT(DISTINCT CASE WHEN m.user_b_id IS NOT NULL THEN m.user_b_id END) as users_with_matches,
          (SELECT COUNT(*) FROM users WHERE profile_completed = true
           AND NOT EXISTS (
             SELECT 1 FROM matches WHERE
               (user_a_id = users.id OR user_b_id = users.id)
               AND shown_date = CURRENT_DATE
           )) as pending_users
         FROM matches m
         WHERE m.shown_date = CURRENT_DATE`
      );

      const row = stats.rows[0];
      const todayMatches = parseInt(row.today_matches) || 0;
      const usersWithMatches = parseInt(row.users_with_matches) || 0;
      const pendingUsers = parseInt(row.pending_users) || 0;

      return {
        todayMatches,
        usersWithMatches,
        averageMatchesPerUser: usersWithMatches > 0 ? todayMatches / usersWithMatches : 0,
        pendingUsers,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Utility: Sleep for milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DailyMatchGenerator;
