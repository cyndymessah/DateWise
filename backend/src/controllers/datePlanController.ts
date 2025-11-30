import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest, DatePlanStatus } from '../types';

// Get date plan for a match
export const getDatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { matchId } = req.params;

    // Verify user is part of this match
    const matchCheck = await client.query(
      `SELECT m.*, dp.*,
              CASE WHEN m.user_a_id = $2 THEN 'a' ELSE 'b' END as user_role
       FROM matches m
       LEFT JOIN date_plans dp ON m.id = dp.match_id
       WHERE m.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
      [matchId, req.user.id]
    );

    if (matchCheck.rows.length === 0) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const data = matchCheck.rows[0];

    res.json({
      success: true,
      data: data.id ? {
        id: data.id,
        matchId: data.match_id,
        selectedActivityId: data.selected_activity_id,
        venueName: data.venue_name,
        dateTime: data.date_time,
        status: data.status,
        userContact: data.user_role === 'a' ? data.user_a_contact : data.user_b_contact,
        otherUserContact: data.user_role === 'a' ? data.user_b_contact : data.user_a_contact,
        userFeedback: data.user_role === 'a' ? data.user_a_feedback : data.user_b_feedback,
        otherUserFeedback: data.user_role === 'a' ? data.user_b_feedback : data.user_a_feedback,
        createdAt: data.created_at,
        confirmedAt: data.confirmed_at,
        completedAt: data.completed_at,
      } : null,
    });
  } catch (error) {
    console.error('Get date plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch date plan',
    });
  } finally {
    client.release();
  }
};

// Update date plan
export const updateDatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { matchId } = req.params;
    const { selectedActivityId, venueName, dateTime, status, contact } = req.body;

    // Verify user is part of this match
    const matchCheck = await client.query(
      `SELECT m.*, dp.id as date_plan_id,
              CASE WHEN m.user_a_id = $2 THEN 'a' ELSE 'b' END as user_role
       FROM matches m
       LEFT JOIN date_plans dp ON m.id = dp.match_id
       WHERE m.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
      [matchId, req.user.id]
    );

    if (matchCheck.rows.length === 0) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const match = matchCheck.rows[0];

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (selectedActivityId !== undefined) {
      updates.push(`selected_activity_id = $${paramCount++}`);
      values.push(selectedActivityId);
    }

    if (venueName !== undefined) {
      updates.push(`venue_name = $${paramCount++}`);
      values.push(venueName);
    }

    if (dateTime !== undefined) {
      updates.push(`date_time = $${paramCount++}`);
      values.push(dateTime);
    }

    if (contact !== undefined) {
      const contactField = match.user_role === 'a' ? 'user_a_contact' : 'user_b_contact';
      updates.push(`${contactField} = $${paramCount++}`);
      values.push(contact);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      if (status === DatePlanStatus.CONFIRMED) {
        updates.push(`confirmed_at = CURRENT_TIMESTAMP`);
      } else if (status === DatePlanStatus.COMPLETED) {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    values.push(matchId);

    const query = `
      UPDATE date_plans
      SET ${updates.join(', ')}
      WHERE match_id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Date plan updated',
    });
  } catch (error) {
    console.error('Update date plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update date plan',
    });
  } finally {
    client.release();
  }
};

// Submit feedback after date
export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { matchId } = req.params;
    const { feedback } = req.body; // 'good' | 'not_good' | 'no_show'

    if (!['good', 'not_good', 'no_show'].includes(feedback)) {
      res.status(400).json({ success: false, error: 'Invalid feedback value' });
      return;
    }

    // Verify user is part of this match
    const matchCheck = await client.query(
      `SELECT m.*,
              CASE WHEN m.user_a_id = $2 THEN 'a' ELSE 'b' END as user_role
       FROM matches m
       WHERE m.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
      [matchId, req.user.id]
    );

    if (matchCheck.rows.length === 0) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const match = matchCheck.rows[0];
    const feedbackField = match.user_role === 'a' ? 'user_a_feedback' : 'user_b_feedback';

    const result = await client.query(
      `UPDATE date_plans
       SET ${feedbackField} = $1
       WHERE match_id = $2
       RETURNING *`,
      [feedback, matchId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Date plan not found' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Feedback submitted',
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  } finally {
    client.release();
  }
};

// Get past dates
export const getPastDates = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await client.query(
      `SELECT
        dp.*,
        m.user_a_id,
        m.user_b_id,
        m.shared_activities,
        a.name as activity_name,
        a.icon as activity_icon,
        CASE
          WHEN m.user_a_id = $1 THEN m.user_b_id
          ELSE m.user_a_id
        END as other_user_id
       FROM date_plans dp
       JOIN matches m ON dp.match_id = m.id
       LEFT JOIN activities a ON dp.selected_activity_id = a.id
       WHERE (m.user_a_id = $1 OR m.user_b_id = $1)
         AND dp.status IN ($2, $3)
       ORDER BY dp.completed_at DESC NULLS LAST, dp.confirmed_at DESC`,
      [req.user.id, DatePlanStatus.COMPLETED, DatePlanStatus.CANCELLED]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get past dates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch past dates',
    });
  } finally {
    client.release();
  }
};
