const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Create tables if not exist (NEVER DROP)
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        session VARCHAR(20) NOT NULL DEFAULT 'NY',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(date, session)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        session VARCHAR(20) NOT NULL DEFAULT 'NY',
        pnl NUMERIC(10, 2) NOT NULL DEFAULT 0,
        instrument VARCHAR(20) DEFAULT 'MNQ',
        setup VARCHAR(50),
        entry_time VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Safe migration: add session column if it doesn't exist
    await client.query(`
      ALTER TABLE trades ADD COLUMN IF NOT EXISTS session VARCHAR(20) NOT NULL DEFAULT 'NY';
    `);
    await client.query(`
      ALTER TABLE trade_days ADD COLUMN IF NOT EXISTS session VARCHAR(20) NOT NULL DEFAULT 'NY';
    `);

    // Fix unique constraint on trade_days if old one exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'trade_days_date_key'
        ) THEN
          ALTER TABLE trade_days DROP CONSTRAINT trade_days_date_key;
          ALTER TABLE trade_days ADD CONSTRAINT trade_days_date_session_key UNIQUE (date, session);
        END IF;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);

    console.log('Database ready (v3 - sessions support)');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
