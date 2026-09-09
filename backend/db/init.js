const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trade_days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        session VARCHAR(20) DEFAULT 'NY',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        session VARCHAR(20) DEFAULT 'NY',
        pnl NUMERIC(10, 2) NOT NULL DEFAULT 0,
        instrument VARCHAR(20) DEFAULT 'MNQ',
        setup VARCHAR(50),
        entry_time VARCHAR(10),
        notes TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const migrations = [
      `ALTER TABLE trades ADD COLUMN IF NOT EXISTS session VARCHAR(20) DEFAULT 'NY'`,
      `ALTER TABLE trades ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE trades ADD COLUMN IF NOT EXISTS image_url TEXT`,
      `ALTER TABLE trade_days ADD COLUMN IF NOT EXISTS session VARCHAR(20) DEFAULT 'NY'`,
      `UPDATE trades SET session = 'NY' WHERE session IS NULL`,
      `UPDATE trade_days SET session = 'NY' WHERE session IS NULL`,
    ];
    for (const sql of migrations) { await client.query(sql).catch(() => {}); }
    await client.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trade_days_date_key') THEN ALTER TABLE trade_days DROP CONSTRAINT trade_days_date_key; END IF; END $$;`).catch(() => {});
    await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trade_days_date_session_key') THEN ALTER TABLE trade_days ADD CONSTRAINT trade_days_date_session_key UNIQUE (date, session); END IF; END $$;`).catch(() => {});
    console.log('Database ready v10 - notes and images per trade');
  } finally { client.release(); }
}

module.exports = { pool, initDB };
