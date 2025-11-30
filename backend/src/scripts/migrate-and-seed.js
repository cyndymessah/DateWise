#!/usr/bin/env node
/**
 * Production-safe migration and seeding script
 * Runs migrations and seeds database on first deployment
 * Safe to run multiple times (idempotent)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Starting database setup...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Run migration
    console.log('📦 Running migrations...');
    await client.query(migrationSQL);
    console.log('✅ Migrations completed successfully');

    // Check if activities already exist
    const result = await client.query('SELECT COUNT(*) FROM activities');
    const activityCount = parseInt(result.rows[0].count);

    if (activityCount === 0) {
      console.log('🌱 Seeding database with activities...');

      // Seed activities
      const activities = [
        // Coffee & Casual
        { name: 'Coffee at a cozy café', category: 'coffee_casual', icon: '☕', country: 'both' },
        { name: 'Dessert tasting', category: 'coffee_casual', icon: '🍰', country: 'both' },
        { name: 'Ice cream walk', category: 'coffee_casual', icon: '🍦', country: 'both' },
        { name: 'Bubble tea exploration', category: 'coffee_casual', icon: '🧋', country: 'both' },

        // Food & Dining
        { name: 'Hawker center food tour', category: 'food_dining', icon: '🍜', country: 'singapore' },
        { name: 'Street food adventure', category: 'food_dining', icon: '🌮', country: 'indonesia' },
        { name: 'Brunch spot hopping', category: 'food_dining', icon: '🥞', country: 'both' },
        { name: 'Sushi dinner', category: 'food_dining', icon: '🍣', country: 'both' },
        { name: 'Nasi Padang feast', category: 'food_dining', icon: '🍛', country: 'indonesia' },

        // Outdoor & Active
        { name: 'Beach walk at sunset', category: 'outdoor_active', icon: '🏖️', country: 'both' },
        { name: 'Botanical gardens stroll', category: 'outdoor_active', icon: '🌺', country: 'singapore' },
        { name: 'Cycling at East Coast Park', category: 'outdoor_active', icon: '🚴', country: 'singapore' },
        { name: 'Hiking Mount Faber', category: 'outdoor_active', icon: '⛰️', country: 'singapore' },
        { name: 'Surfing lesson in Bali', category: 'outdoor_active', icon: '🏄', country: 'indonesia' },

        // Arts & Culture
        { name: 'Art gallery visit', category: 'arts_culture', icon: '🎨', country: 'both' },
        { name: 'Museum exploration', category: 'arts_culture', icon: '🏛️', country: 'both' },
        { name: 'Local theater show', category: 'arts_culture', icon: '🎭', country: 'both' },
        { name: 'Photography walk', category: 'arts_culture', icon: '📷', country: 'both' },
        { name: 'Batik workshop', category: 'arts_culture', icon: '🎨', country: 'indonesia' },

        // Entertainment
        { name: 'Movie night', category: 'entertainment', icon: '🎬', country: 'both' },
        { name: 'Karaoke session', category: 'entertainment', icon: '🎤', country: 'both' },
        { name: 'Live music venue', category: 'entertainment', icon: '🎵', country: 'both' },
        { name: 'Comedy show', category: 'entertainment', icon: '😄', country: 'both' },

        // Sports & Fitness
        { name: 'Rock climbing', category: 'sports_fitness', icon: '🧗', country: 'both' },
        { name: 'Badminton game', category: 'sports_fitness', icon: '🏸', country: 'both' },
        { name: 'Yoga in the park', category: 'sports_fitness', icon: '🧘', country: 'both' },
        { name: 'Swimming', category: 'sports_fitness', icon: '🏊', country: 'both' },

        // Markets & Shopping
        { name: 'Flea market browsing', category: 'markets_shopping', icon: '🛍️', country: 'both' },
        { name: 'Night market exploration', category: 'markets_shopping', icon: '🌙', country: 'both' },
        { name: 'Vintage store hunting', category: 'markets_shopping', icon: '👕', country: 'both' },

        // Nature & Animals
        { name: 'Zoo visit', category: 'nature_animals', icon: '🦁', country: 'singapore' },
        { name: 'Bird park exploration', category: 'nature_animals', icon: '🦜', country: 'singapore' },
        { name: 'Aquarium date', category: 'nature_animals', icon: '🐠', country: 'both' },
        { name: 'Monkey forest visit', category: 'nature_animals', icon: '🐵', country: 'indonesia' }
      ];

      for (const activity of activities) {
        await client.query(
          `INSERT INTO activities (name, category, icon, country)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [activity.name, activity.category, activity.icon, activity.country]
        );
      }

      console.log(`✅ Seeded ${activities.length} activities`);
    } else {
      console.log(`ℹ️  Database already has ${activityCount} activities, skipping seed`);
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
