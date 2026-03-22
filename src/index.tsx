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
import { errorHandler } from './middleware/error'

const app = new Hono<{ Bindings: Bindings }>()

console.log('[INIT] Starting PhysioMotion API server...')

// Global Error Handler
app.use('*', errorHandler)

const corsOptions = {
  origin: (origin: string) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const isAllowed = allowedOrigins.length === 0 || allowedOrigins.some(o => o.trim() === origin || o.trim() === '*')
    return isAllowed ? origin : null
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
})

// API Routes
console.log('[INIT] Mounting routes...')
app.route('/api/auth', authRoutes)
console.log('[INIT] Mounted /api/auth')
app.route('/api/patients', patientRoutes)
console.log('[INIT] Mounted /api/patients')
app.route('/api/assessments', assessmentRoutes)
console.log('[INIT] Mounted /api/assessments')
app.route('/api', exerciseRoutes)
console.log('[INIT] Mounted /api (exercises)')
app.route('/api/billing', billingRoutes)
console.log('[INIT] Mounted /api/billing')

// Debug endpoint
app.get('/api/debug', (c) => {
  const routes = app.routes.map(r => `${r.method} ${r.path}`)
  return c.json({ 
    status: 'debug', 
    totalRoutes: routes.length,
    routes: routes.slice(0, 50)
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

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'PhysioMotion' })
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
