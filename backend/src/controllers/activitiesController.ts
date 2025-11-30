import { Request, Response } from 'express';
import pool from '../config/database';
import { Activity } from '../types';

// Get all activities
export const getAllActivities = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { category, country } = req.query;

    let query = 'SELECT * FROM activities WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (country) {
      query += ` AND (country = $${paramCount++} OR country = 'both')`;
      params.push(country);
    }

    query += ' ORDER BY category, name';

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  } finally {
    client.release();
  }
};

// Get activities by category
export const getActivitiesByCategory = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { country } = req.query;

    let query = `
      SELECT category, json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'icon', icon,
          'description', description,
          'country', country
        ) ORDER BY name
      ) as activities
      FROM activities
      WHERE 1=1
    `;

    const params: any[] = [];

    if (country) {
      query += ` AND (country = $1 OR country = 'both')`;
      params.push(country);
    }

    query += ' GROUP BY category ORDER BY category';

    const result = await client.query(query, params);

    // Transform to object with categories as keys
    const categorized = result.rows.reduce((acc, row) => {
      acc[row.category] = row.activities;
      return acc;
    }, {} as Record<string, Activity[]>);

    res.json({
      success: true,
      data: categorized
    });
  } catch (error) {
    console.error('Get activities by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  } finally {
    client.release();
  }
};

// Get single activity
export const getActivity = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT * FROM activities WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  } finally {
    client.release();
  }
};

// Get popular activities (most selected)
export const getPopularActivities = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { limit = 10 } = req.query;

    const result = await client.query(
      `SELECT a.*, COUNT(ua.id) as selection_count
       FROM activities a
       LEFT JOIN user_activities ua ON a.id = ua.activity_id
       GROUP BY a.id
       ORDER BY selection_count DESC, a.name
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get popular activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular activities'
    });
  } finally {
    client.release();
  }
};
