import { Hono } from 'hono'
import type { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/register', async (c) => {
  const body = await c.req.json()
  return c.json({
    success: true,
    data: { id: 1, email: body.email },
    note: "Demo mode - registration simulated"
  })
})

auth.post('/login', async (c) => {
  const { email } = await c.req.json()
  
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'demo-secret'
  
  return c.json({
    success: true,
    data: {
      id: 1,
      email: email,
      first_name: "Demo",
      last_name: "User",
      role: "clinician",
      token: "demo-jwt-token-12345",
      note: "Demo mode - no database"
    }
  })
})

auth.get('/profile/:id', async (c) => {
  return c.json({
    success: true,
    data: {
      id: parseInt(c.req.param('id')),
      email: "demo@example.com",
      first_name: "Demo",
      last_name: "User",
      role: "clinician"
    }
  })
})

export default auth
