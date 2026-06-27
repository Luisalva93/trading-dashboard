require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/init');
const tradesRouter = require('./routes/trades');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/trades', tradesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
