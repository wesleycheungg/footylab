import express from 'express';
import pool from './db/pool.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true });
});

// CI polls this before starting E2E tests, so it reports DB reachability
// rather than just "the process is up".
app.get('/api/health', async (_req, res) => {
  let db = false;
  try {
    await pool.query('SELECT 1');
    db = true;
  } catch {
    db = false;
  }
  res.status(db ? 200 : 503).json({ ok: true, db });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
