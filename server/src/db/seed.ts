import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const products = [
  { name: 'Arsenal Home', team: 'Arsenal', league: 'Premier League', kit_type: 'Home', price_cents: 9000, primary_color: '#DC0000', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Arsenal Away', team: 'Arsenal', league: 'Premier League', kit_type: 'Away', price_cents: 9000, primary_color: '#FFFFFF', trim_color: '#1D2C46', sold_out_sizes: '' },
  { name: 'Manchester City Home', team: 'Manchester City', league: 'Premier League', kit_type: 'Home', price_cents: 9500, primary_color: '#6CABDA', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Manchester City Away', team: 'Manchester City', league: 'Premier League', kit_type: 'Away', price_cents: 9500, primary_color: '#000000', trim_color: '#6CABDA', sold_out_sizes: 'S' },
  { name: 'Liverpool Home', team: 'Liverpool', league: 'Premier League', kit_type: 'Home', price_cents: 9000, primary_color: '#C8102E', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Liverpool Away', team: 'Liverpool', league: 'Premier League', kit_type: 'Away', price_cents: 9000, primary_color: '#FFFFFF', trim_color: '#2D8659', sold_out_sizes: '' },
  { name: 'Real Madrid Home', team: 'Real Madrid', league: 'La Liga', kit_type: 'Home', price_cents: 10000, primary_color: '#FFFFFF', trim_color: '#000000', sold_out_sizes: '' },
  { name: 'Real Madrid Away', team: 'Real Madrid', league: 'La Liga', kit_type: 'Away', price_cents: 10000, primary_color: '#1D1D2E', trim_color: '#FFFFFF', sold_out_sizes: 'L' },
  { name: 'Barcelona Home', team: 'Barcelona', league: 'La Liga', kit_type: 'Home', price_cents: 10000, primary_color: '#004687', trim_color: '#FFC52F', sold_out_sizes: '' },
  { name: 'Barcelona Away', team: 'Barcelona', league: 'La Liga', kit_type: 'Away', price_cents: 10000, primary_color: '#FFCC00', trim_color: '#004687', sold_out_sizes: '' },
  { name: 'Inter Milan Home', team: 'Inter Milan', league: 'Serie A', kit_type: 'Home', price_cents: 9500, primary_color: '#000000', trim_color: '#1B3A8E', sold_out_sizes: '' },
  { name: 'AC Milan Home', team: 'AC Milan', league: 'Serie A', kit_type: 'Home', price_cents: 9500, primary_color: '#DC143C', trim_color: '#000000', sold_out_sizes: 'M' },
  { name: 'Bayern Munich Home', team: 'Bayern Munich', league: 'Bundesliga', kit_type: 'Home', price_cents: 9500, primary_color: '#DC0000', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Bayern Munich Away', team: 'Bayern Munich', league: 'Bundesliga', kit_type: 'Away', price_cents: 9500, primary_color: '#FFFFFF', trim_color: '#DC0000', sold_out_sizes: '' },
  { name: 'Argentina Home', team: 'Argentina', league: 'International', kit_type: 'Home', price_cents: 8500, primary_color: '#87CEEB', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Brazil Home', team: 'Brazil', league: 'International', kit_type: 'Home', price_cents: 8500, primary_color: '#FFD700', trim_color: '#008000', sold_out_sizes: '' },
  { name: 'France Home', team: 'France', league: 'International', kit_type: 'Home', price_cents: 8500, primary_color: '#002395', trim_color: '#FFFFFF', sold_out_sizes: '' },
  { name: 'Manchester United 1999', team: 'Manchester United', league: 'Premier League', kit_type: 'Retro', price_cents: 12000, primary_color: '#DA291C', trim_color: '#FFFFFF', sold_out_sizes: 'S,L' },
  { name: 'England Home', team: 'England', league: 'International', kit_type: 'Home', price_cents: 8500, primary_color: '#FFFFFF', trim_color: '#DA291C', sold_out_sizes: '' },
  { name: 'USA Home', team: 'USA', league: 'International', kit_type: 'Home', price_cents: 8500, primary_color: '#002868', trim_color: '#FFFFFF', sold_out_sizes: '' },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    console.error(
      'Could not connect to Postgres. Is it running? Try: docker compose up -d'
    );
    console.error(error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  }

  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('Creating tables...');
    await client.query(schema);
    console.log('✓ Tables created');

    // Reseeding is idempotent: running db:setup twice must still leave 20
    // products, and product IDs must stay stable because the UI and the
    // E2E tests reference /products/1.
    //
    // Everything referencing products goes too, so we don't leave orders
    // pointing at order_items that CASCADE removed. `users` is deliberately
    // untouched — accounts come from signup, not from the seed.
    await client.query('BEGIN');
    await client.query(
      'TRUNCATE products, cart_items, order_items, orders RESTART IDENTITY CASCADE'
    );

    console.log('Seeding products...');
    for (const product of products) {
      await client.query(
        `INSERT INTO products (name, team, league, kit_type, price_cents, primary_color, trim_color, sold_out_sizes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          product.name,
          product.team,
          product.league,
          product.kit_type,
          product.price_cents,
          product.primary_color,
          product.trim_color,
          product.sold_out_sizes,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`✓ Seeded ${products.length} products`);

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM products');
    console.log(`✓ Database now has ${result.rows[0].count} products`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
