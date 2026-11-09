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
  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('✓ Tables created');

    // Insert products
    console.log('Seeding products...');
    for (const product of products) {
      await pool.query(
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
    console.log(`✓ Seeded ${products.length} products`);

    // Verify
    const result = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`✓ Database now has ${result.rows[0].count} products`);

    await pool.end();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
