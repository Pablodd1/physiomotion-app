// Database utilities for Cloudflare Workers & Railway
// Supports both D1 (Cloudflare) and PostgreSQL (Railway/Neon)

// Type definitions for query results
export interface QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta: {
    last_row_id: number | null;
  };
}

export interface QueryFirst<T = any> {
  first: () => Promise<T | null>;
  all: () => Promise<QueryResult<T>>;
  run: () => Promise<{ success: boolean; meta: { last_row_id: number | null } }>;
}

// Cloudflare D1 Adapter (for dev)
export function createD1Adapter(db: any) {
  return {
    prepare: (query: string) => {
      return {
        bind: (...args: any[]): QueryFirst => {
          return {
            first: async <T = any>(): Promise<T | null> => {
              const result = await db.prepare(query).bind(...args).first();
              return result as T | null;
            },
            all: async <T = any>(): Promise<QueryResult<T>> => {
              const result = await db.prepare(query).bind(...args).all();
              return result as QueryResult<T>;
            },
            run: async () => {
              return await db.prepare(query).bind(...args).run();
            }
          };
        },
        first: async <T = any>(): Promise<T | null> => {
          return await db.prepare(query).first() as T | null;
        },
        all: async <T = any>(): Promise<QueryResult<T>> => {
          return await db.prepare(query).all() as QueryResult<T>;
        },
        run: async () => {
          return await db.prepare(query).run();
        }
      };
    }
  };
}

// Railway/PostgreSQL Adapter
export function createPostgresAdapter(pool: any) {
  return {
    prepare: (query: string) => {
      // Convert ? placeholders to $1, $2, etc.
      let pgQuery = query;
      let count = 1;
      let inString = false;
      
      for (let i = 0; i < query.length; i++) {
        const char = query[i];
        if (char === "'") {
          inString = !inString;
        } else if (char === '?' && !inString) {
          pgQuery = pgQuery.replace('?', `$${count++}`);
        }
      }

      return {
        bind: (...args: any[]): QueryFirst => {
          return {
            first: async <T = any>(): Promise<T | null> => {
              const res = await pool.query(pgQuery, args);
              return (res.rows[0] as T) || null;
            },
            all: async <T = any>(): Promise<QueryResult<T>> => {
              const res = await pool.query(pgQuery, args);
              return { results: res.rows as T[], success: true, meta: { last_row_id: null } };
            },
            run: async () => {
              const res = await pool.query(pgQuery, args);
              let lastId: number | null = null;
              if (res.rows.length > 0) {
                lastId = res.rows[0].id;
              }
              return { success: true, meta: { last_row_id: lastId } };
            }
          };
        },
        first: async <T = any>(): Promise<T | null> => {
          const res = await pool.query(pgQuery);
          return (res.rows[0] as T) || null;
        },
        all: async <T = any>(): Promise<QueryResult<T>> => {
          const res = await pool.query(pgQuery);
          return { results: res.rows as T[], success: true, meta: { last_row_id: null } };
        },
        run: async () => {
          const res = await pool.query(pgQuery);
          return { success: true, meta: { last_row_id: res.rows[0]?.id ?? null } };
        }
      };
    }
  };
}
