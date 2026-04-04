import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import type { Bindings } from './types'
import { performBiomechanicalAnalysis } from './utils/biomechanics'
import { queryExerciseKnowledge } from './utils/rag'
import { medicalAI } from './utils/gemini'
import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import assessmentRoutes from './routes/assessments'
import exerciseRoutes from './routes/exercises'
import billingRoutes from './routes/billing'
import videoRoutes from './routes/videos'
import adminRoutes from './routes/admin'
import portalRoutes from './routes/portal'
import testRoutes from './routes/tests'
import { errorHandler } from './middleware/error'
import { getPool, testConnection } from './database'

const app = new Hono<{ Bindings: Bindings }>()

console.log('[INIT] Starting PhysioMotion API server...')

// Test database connection on startup
testConnection().then(connected => {
  if (connected) {
    console.log('[INIT] Database connection established')
  } else {
    console.warn('[INIT] Database connection failed - running in limited mode')
  }
})

// Global Error Handler
app.use('*', errorHandler)

// CORS configuration - SECURITY FIX: Explicit origin whitelist only
const corsOptions = {
  origin: (origin: string) => {
    // Production origins - EXPLICITLY defined, no wildcards
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
      'https://physiomotion-api-production.up.railway.app',
      'https://physiomotion.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ]
    
    // Only allow if origin is in explicit whitelist
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*')
    
    // Log rejected origins for security monitoring
    if (!isAllowed && process.env.NODE_ENV === 'production') {
      console.warn(`[SECURITY] CORS rejected origin: ${origin}`)
    }
    
    return isAllowed ? origin : null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}

app.use('/api/*', cors(corsOptions))

// Security headers
app.use('*', async (c, next) => {
  await next()
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
  c.res.headers.set('X-Frame-Options', 'DENY')
  c.res.headers.set('X-XSS-Protection', '1; mode=block')
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self)')
})

// API Routes
console.log('[INIT] Mounting routes...')
app.route('/api/auth', authRoutes)
console.log('[INIT] Mounted /api/auth')
app.route('/api/patients', patientRoutes)
console.log('[INIT] Mounted /api/patients')
app.route('/api/assessments', assessmentRoutes)
console.log('[INIT] Mounted /api/assessments')
app.route('/api/tests', testRoutes)
console.log('[INIT] Mounted /api/tests')
app.route('/api', exerciseRoutes)
console.log('[INIT] Mounted /api (exercises)')
app.route('/api/billing', billingRoutes)
console.log('[INIT] Mounted /api/billing')
app.route('/api/videos', videoRoutes)
console.log('[INIT] Mounted /api/videos')
app.route('/api/admin', adminRoutes)
console.log('[INIT] Mounted /api/admin')
app.route('/api/portal', portalRoutes)
console.log('[INIT] Mounted /api/portal')

// Debug endpoint
app.get('/api/debug', (c) => {
  const routes = app.routes.map(r => `${r.method} ${r.path}`)
  return c.json({ 
    status: 'debug', 
    totalRoutes: routes.length,
    routes: routes.slice(0, 50)
  })
})

// Health check
app.get('/api/health', async (c) => {
  const pool = getPool()
  let dbStatus = 'disconnected'
  
  if (pool) {
    try {
      await pool.query('SELECT 1')
      dbStatus = 'connected'
    } catch (e) {
      dbStatus = 'error'
    }
  }

  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    app: 'PhysioMotion',
    version: '2.0.0',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Real-time joint tracking API
app.post('/api/video/analyze', async (c) => {
  try {
    const { landmarks, patientId } = await c.req.json()
    const analysis = performBiomechanicalAnalysis(landmarks)
    
    // If Gemini API key exists, get AI analysis
    if (process.env.GEMINI_API_KEY && medicalAI.instance) {
      const aiInsights = await medicalAI.instance.analyzeBiomechanics(analysis, { patientId })
      return c.json({ success: true, data: { analysis, aiInsights } })
    }
    
    return c.json({ success: true, data: analysis })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/analyze-movement', async (c) => {
  try {
    const { skeletonData } = await c.req.json()
    const analysis = await performBiomechanicalAnalysis(skeletonData)
    return c.json({ success: true, data: analysis })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/rag/query', async (c) => {
  try {
    const { query, patientId } = await c.req.json()
    const results = await queryExerciseKnowledge(query, patientId)
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Camera/device detection API
app.get('/api/cameras', async (c) => {
  try {
    return c.json({ 
      success: true, 
      data: {
        supported: ['webcam', 'femto-mega', 'azure-kinect', 'orbbec'],
        note: 'Camera access requires frontend request'
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Static files and SPA fallback (must be LAST)
app.use('/assets/*', serveStatic({ root: './dist' }))
app.use('/favicon.png', serveStatic({ path: './dist/favicon.png' }))
app.use('*', serveStatic({ root: './dist', index: 'index.html' }))

console.log(`[INIT] Total routes registered: ${app.routes.length}`)

export default app
