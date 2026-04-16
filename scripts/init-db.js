import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSqlFile(fileName) {
  console.log(`Executing ${fileName}...`);
  const filePath = path.join(__dirname, '..', 'database', fileName);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`Successfully executed ${fileName}`);
  } catch (error) {
    console.error(`Error executing ${fileName}:`, error.message);
    if (error.detail) console.error('Detail:', error.detail);
  }
}

async function main() {
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('Connected successfully!');

    await runSqlFile('schema.sql');
    await runSqlFile('seed.sql');

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Critical initialization error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
