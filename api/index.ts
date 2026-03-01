import { handle } from 'hono/vercel'
import app from '../src/index'

export const config = {
    runtime: 'edge'
}

// Provide a mock D1 database for Vercel demo so it doesn't crash
app.use('*', async (c: any, next: any) => {
    if (!c.env) c.env = {} as any
    if (!c.env.DB) {
        c.env.DB = {
            prepare: (query: string) => ({
                bind: (...args: any[]) => ({
                    first: async () => {
                        // Mock auth response to allow login bypass
                        if (query.includes('clinicians')) {
                            return { id: 1, email: 'demo@demo.com', role: 'admin', active: 1, password_hash: 'mock', salt: 'mock' }
                        }
                        return null
                    },
                    all: async () => {
                        if (query.includes('exercises')) return { results: [{ id: 1, name: 'Squat', category: 'Strength' }] }
                        if (query.includes('patients')) return { results: [{ id: 1, first_name: 'Demo', last_name: 'Patient' }] }
                        return { results: [] }
                    },
                    run: async () => ({ meta: { last_row_id: Math.floor(Math.random() * 1000) } })
                }),
                first: async () => null,
                all: async () => {
                    if (query.includes('exercises')) return { results: [{ id: 1, name: 'Squat', category: 'Strength' }] }
                    if (query.includes('patients')) return { results: [{ id: 1, first_name: 'Demo', last_name: 'Patient' }] }
                    return { results: [] }
                },
                run: async () => ({ meta: { last_row_id: Math.floor(Math.random() * 1000) } })
            })
        } as any
    }
    await next()
})

export default handle(app)
