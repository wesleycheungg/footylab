import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.warn(
    'DATABASE_URL is not set — API routes will fail. Copy .env.example to .env.'
  );
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
