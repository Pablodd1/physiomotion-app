// Database Connection Module for PhysioMotion
// Supports both PostgreSQL (production) and in-memory fallback (testing)

import { Pool, PoolClient } from 'pg'

// Global pool instance
let pgPool: Pool | null = null

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production'

// Initialize PostgreSQL connection
export function initializeDatabase(): Pool {
  if (pgPool) {
    return pgPool
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!connectionString) {
    console.warn('[DB] No DATABASE_URL found, using in-memory fallback (mock mode)')
    return null as any
  }

  pgPool = new Pool({
    connectionString,
    ssl: isDevelopment ? false : { rejectUnauthorized: false },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  // Handle pool errors
  pgPool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err)
  })

  console.log('[DB] PostgreSQL pool initialized')
  return pgPool
}

// Get pool instance
export function getPool(): Pool | null {
  if (!pgPool) {
    try {
      return initializeDatabase()
    } catch (e) {
      return null
    }
  }
  return pgPool
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool()
    if (!pool) return false
    
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    
    console.log('[DB] Connection test successful:', result.rows[0].now)
    return true
  } catch (error: any) {
    console.error('[DB] Connection test failed:', error.message)
    return false
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  if (!pool) throw new Error('Database not available')
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Migration helper
export async function runMigration(sql: string): Promise<void> {
  const pool = getPool()
  if (!pool) throw new Error('Database not available')
  
  await pool.query(sql)
}

// Initialize database on module load
if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  try {
    initializeDatabase()
  } catch (e) {
    console.warn('[DB] Failed to initialize:', e)
  }
}
