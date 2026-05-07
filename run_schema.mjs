import pg from 'pg';
import fs from 'fs/promises';

const connectionString = 'postgresql://postgres:InkerPro2026@[2406:da1a:82a:9d01:f35a:f31e:9dcb:e438]:5432/postgres';

async function run() {
  const client = new pg.Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres!');
    
    const sql = await fs.readFile('supabase_schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

run();
