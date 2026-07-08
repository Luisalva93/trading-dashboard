const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    // NEVER DROP TABLES - only create if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        pnl NUMERIC(10, 2) NOT NULL DEFAULT 0,
        instrument VARCHAR(20) DEFAULT 'NQ',
        setup VARCHAR(50),
        entry_time VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Database ready (v2 - safe init)');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
