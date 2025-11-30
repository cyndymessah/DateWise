import { Response } from 'express';
import { body } from 'express-validator';
import pool from '../config/database';
import { AuthRequest, UserProfile } from '../types';

// Validation rules
export const updateProfileValidation = [
  body('occupation').optional().trim(),
  body('interests').optional().trim().isLength({ max: 1000 }),
  body('values').optional().trim().isLength({ max: 1000 }),
  body('lifestyle').optional().trim().isLength({ max: 1000 }),
  body('relationship_goals').optional().trim().isLength({ max: 1000 }),
  body('deal_breakers').optional().trim().isLength({ max: 1000 }),
  body('personality').optional().trim().isLength({ max: 1000 }),
  body('age_preference_min').optional().isInt({ min: 18, max: 100 }),
  body('age_preference_max').optional().isInt({ min: 18, max: 100 }),
  body('location_preference').optional().trim(),
];

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // Get user profile
    const userResult = await client.query(
      `SELECT id, email, name, age, location, occupation, interests, values,
              lifestyle, relationship_goals, deal_breakers, personality, photos,
              age_preference_min, age_preference_max, location_preference,
              profile_completed, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Get user's selected activities
    const activitiesResult = await client.query(
      `SELECT ua.id, ua.activity_id, ua.specific_venue, ua.location_area,
              ua.preferred_time, ua.notes, ua.created_at,
              a.name as activity_name, a.category, a.icon, a.description
       FROM user_activities ua
       JOIN activities a ON ua.activity_id = a.id
       WHERE ua.user_id = $1
       ORDER BY a.category, a.name`,
      [req.user.id]
    );

    const profile: UserProfile = {
      ...user,
      activities: activitiesResult.rows.map(row => ({
        id: row.id,
        user_id: req.user!.id,
        activity_id: row.activity_id,
        activity: {
          id: row.activity_id,
          name: row.activity_name,
          category: row.category,
          icon: row.icon,
          description: row.description,
          country: 'both'
        },
        specific_venue: row.specific_venue,
        location_area: row.location_area,
        preferred_time: row.preferred_time,
        notes: row.notes,
        created_at: row.created_at
      }))
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  } finally {
    client.release();
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const {
      occupation,
      interests,
      values: userValues,
      lifestyle,
      relationship_goals,
      deal_breakers,
      personality,
      age_preference_min,
      age_preference_max,
      location_preference
    } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (occupation !== undefined) {
      updates.push(`occupation = $${paramCount++}`);
      values.push(occupation);
    }
    if (interests !== undefined) {
      updates.push(`interests = $${paramCount++}`);
      values.push(interests);
    }
    if (userValues !== undefined) {
      updates.push(`values = $${paramCount++}`);
      values.push(userValues);
    }
    if (lifestyle !== undefined) {
      updates.push(`lifestyle = $${paramCount++}`);
      values.push(lifestyle);
    }
    if (relationship_goals !== undefined) {
      updates.push(`relationship_goals = $${paramCount++}`);
      values.push(relationship_goals);
    }
    if (deal_breakers !== undefined) {
      updates.push(`deal_breakers = $${paramCount++}`);
      values.push(deal_breakers);
    }
    if (personality !== undefined) {
      updates.push(`personality = $${paramCount++}`);
      values.push(personality);
    }
    if (age_preference_min !== undefined) {
      updates.push(`age_preference_min = $${paramCount++}`);
      values.push(age_preference_min);
    }
    if (age_preference_max !== undefined) {
      updates.push(`age_preference_max = $${paramCount++}`);
      values.push(age_preference_max);
    }
    if (location_preference !== undefined) {
      updates.push(`location_preference = $${paramCount++}`);
      values.push(location_preference);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    // Check if profile is complete
    const checkComplete = await client.query(
      `SELECT interests, values, lifestyle, relationship_goals,
              (SELECT COUNT(*) FROM user_activities WHERE user_id = $1) as activity_count
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const current = checkComplete.rows[0];
    const willBeComplete =
      (interests || current.interests) &&
      (values || current.values) &&
      (lifestyle || current.lifestyle) &&
      (relationship_goals || current.relationship_goals) &&
      (current.activity_count > 0);

    if (willBeComplete) {
      updates.push(`profile_completed = true`);
    }

    // Add user ID as last parameter
    values.push(req.user.id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, age, location, occupation, interests, values,
                lifestyle, relationship_goals, deal_breakers, personality,
                age_preference_min, age_preference_max, location_preference,
                profile_completed
    `;

    const result = await client.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  } finally {
    client.release();
  }
};

// Add activity preference
export const addActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { activity_id, specific_venue, location_area, preferred_time, notes } = req.body;

    // Validate activity exists
    const activityCheck = await client.query(
      'SELECT id FROM activities WHERE id = $1',
      [activity_id]
    );

    if (activityCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Activity not found' });
      return;
    }

    // Check if user already added this activity
    const existingCheck = await client.query(
      'SELECT id FROM user_activities WHERE user_id = $1 AND activity_id = $2',
      [req.user.id, activity_id]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Activity already added' });
      return;
    }

    // Add activity
    const result = await client.query(
      `INSERT INTO user_activities
       (user_id, activity_id, specific_venue, location_area, preferred_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, activity_id, specific_venue, location_area, preferred_time, notes]
    );

    // Update profile completion status
    await client.query(
      `UPDATE users
       SET profile_completed = (
         SELECT COUNT(*) > 0
         FROM user_activities
         WHERE user_id = $1
       )
       WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to add activity' });
  } finally {
    client.release();
  }
};

// Remove activity preference
export const removeActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const result = await client.query(
      'DELETE FROM user_activities WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Activity not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Activity removed successfully'
    });
  } catch (error) {
    console.error('Remove activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove activity' });
  } finally {
    client.release();
  }
};

// Update activity preference
export const updateActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { specific_venue, location_area, preferred_time, notes } = req.body;

    const result = await client.query(
      `UPDATE user_activities
       SET specific_venue = COALESCE($1, specific_venue),
           location_area = COALESCE($2, location_area),
           preferred_time = COALESCE($3, preferred_time),
           notes = COALESCE($4, notes)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [specific_venue, location_area, preferred_time, notes, id, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Activity not found' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to update activity' });
  } finally {
    client.release();
  }
};
