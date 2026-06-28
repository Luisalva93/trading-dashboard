const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Drop old table and create new structure
    await client.query(`DROP TABLE IF EXISTS trade_days CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS trades CASCADE;`);

    // Day-level notes only
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Individual trades
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

    console.log('Database initialized (v2 - individual trades)');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
