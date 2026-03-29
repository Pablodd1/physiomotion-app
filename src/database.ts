// Database Connection Module for PhysioMotion
// Supports both PostgreSQL (production) and in-memory fallback (testing)

import { Pool, PoolClient } from 'pg'
import type { DatabaseAdapter } from '../types'

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
    console.warn('[DB] No DATABASE_URL found, using in-memory fallback')
    throw new Error('Database connection string not configured')
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

// Create PostgreSQL adapter for Hono context
export function createPostgresAdapter(pool: Pool): DatabaseAdapter {
  return {
    prepare: (query: string) => {
      // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
      let pgQuery = query
      let count = 1
      let inString = false
      
      for (let i = 0; i < query.length; i++) {
        const char = query[i]
        if (char === "'") {
          inString = !inString
        } else if (char === '?' && !inString) {
          pgQuery = pgQuery.replace('?', `$${count++}`)
        }
      }

      return {
        bind: (...args: any[]) => ({
          first: async <T = any>(): Promise<T | null> => {
            try {
              const res = await pool.query(pgQuery, args)
              return (res.rows[0] as T) || null
            } catch (error: any) {
              console.error('[DB] Query error:', error.message)
              throw error
            }
          },
          all: async <T = any>(): Promise<{ results: T[]; success: boolean; meta: { last_row_id: number | null } }> => {
            try {
              const res = await pool.query(pgQuery, args)
              return { 
                results: res.rows as T[], 
                success: true, 
                meta: { last_row_id: null } 
              }
            } catch (error: any) {
              console.error('[DB] Query error:', error.message)
              throw error
            }
          },
          run: async () => {
            try {
              const res = await pool.query(pgQuery, args)
              // Try to get the inserted ID from RETURNING clause
              let lastId: number | null = null
              if (res.rows.length > 0 && res.rows[0].id) {
                lastId = res.rows[0].id
              }
              return { success: true, meta: { last_row_id: lastId } }
            } catch (error: any) {
              console.error('[DB] Query error:', error.message)
              throw error
            }
          }
        }),
        first: async <T = any>(): Promise<T | null> => {
          try {
            const res = await pool.query(pgQuery)
            return (res.rows[0] as T) || null
          } catch (error: any) {
            console.error('[DB] Query error:', error.message)
            throw error
          }
        },
        all: async <T = any>(): Promise<{ results: T[]; success: boolean; meta: { last_row_id: number | null } }> => {
          try {
            const res = await pool.query(pgQuery)
            return { 
              results: res.rows as T[], 
              success: true, 
              meta: { last_row_id: null } 
            }
          } catch (error: any) {
            console.error('[DB] Query error:', error.message)
            throw error
          }
        },
        run: async () => {
          try {
            const res = await pool.query(pgQuery)
            let lastId: number | null = null
            if (res.rows.length > 0 && res.rows[0].id) {
              lastId = res.rows[0].id
            }
            return { success: true, meta: { last_row_id: lastId } }
          } catch (error: any) {
            console.error('[DB] Query error:', error.message)
            throw error
          }
        }
      }
    }
  }
}

// Get database adapter for request context
export async function getDatabaseAdapter(): Promise<DatabaseAdapter | null> {
  const pool = getPool()
  if (!pool) return null
  return createPostgresAdapter(pool)
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
