import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Hono } from 'hono';
import { MOCK_PATIENTS, EXERCISE_LIBRARY } from './src/mockData.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`[PHYSIOMOTION] Server starting on port ${port}...`);
console.log(`[PHYSIOMOTION] Environment: ${process.env.NODE_ENV || 'development'}`);

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-demo',
    commit: 'latest',
    features: {
      patients: true,
      assessments: true,
      exercises: true,
      camera: true,
      reporting: true,
      dashboard: true
    }
  });
});

// ============================================================================
// PATIENT ROUTES
// ============================================================================

// Get all patients
app.get('/api/patients', (c) => {
  const patients = MOCK_PATIENTS.map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    email: p.email,
    phone: p.phone,
    created_at: p.created_at,
    medical_history: p.medical_history,
    assessments: p.assessments,
    exercise_sessions: p.exercise_sessions,
    progress_metrics: p.progress_metrics,
    pain_trend: p.progress_metrics?.pain_trend || [],
    latest_assessment: p.assessments?.[p.assessments.length - 1]?.assessment_date || null
  }));
  
  return c.json({ success: true, data: patients });
});

// Get patient by ID
app.get('/api/patients/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  return c.json({ success: true, data: patient });
});

// Create new patient
app.post('/api/patients', async (c) => {
  const body = await c.req.json();
  
  const newPatient = {
    id: MOCK_PATIENTS.length + 1,
    ...body,
    created_at: new Date().toISOString(),
    assessments: [],
    exercise_sessions: [],
    progress_metrics: {
      pain_trend: [],
      functional_score_trend: []
    }
  };
  
  MOCK_PATIENTS.push(newPatient);
  
  return c.json({ success: true, data: newPatient }, 201);
});

// Update patient
app.put('/api/patients/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  const patientIndex = MOCK_PATIENTS.findIndex(p => p.id === id);
  if (patientIndex === -1) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  MOCK_PATIENTS[patientIndex] = { ...MOCK_PATIENTS[patientIndex], ...body };
  
  return c.json({ success: true, data: MOCK_PATIENTS[patientIndex] });
});

// Get patient progress
app.get('/api/patients/:id/progress', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  const progress = {
    pain_trend: patient.progress_metrics?.pain_trend || [],
    functional_trend: patient.progress_metrics?.functional_score_trend || [],
    sessions_completed: patient.exercise_sessions?.length || 0,
    total_exercise_time: patient.exercise_sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0,
    adherence_rate: patient.exercise_sessions?.length > 0 ? 85 : 0,
    latest_pain: patient.assessments?.[patient.assessments.length - 1]?.pain_scale || 0
  };
  
  return c.json({ success: true, data: progress });
});

// ============================================================================
// ASSESSMENT ROUTES
// ============================================================================

// Get all assessments
app.get('/api/assessments', (c) => {
  const allAssessments = MOCK_PATIENTS.flatMap(p => 
    (p.assessments || []).map(a => ({
      ...a,
      patient_id: p.id,
      patient_name: `${p.first_name} ${p.last_name}`
    }))
  );
  
  return c.json({ success: true, data: allAssessments });
});

// Get assessment by ID
app.get('/api/assessments/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  
  for (const patient of MOCK_PATIENTS) {
    const assessment = patient.assessments?.find(a => a.id === id);
    if (assessment) {
      return c.json({ 
        success: true, 
        data: { ...assessment, patient }
      });
    }
  }
  
  return c.json({ success: false, error: 'Assessment not found' }, 404);
});

// Create assessment
app.post('/api/assessments', async (c) => {
  const body = await c.req.json();
  const { patient_id, assessment_type } = body;
  
  const patientIndex = MOCK_PATIENTS.findIndex(p => p.id === patient_id);
  if (patientIndex === -1) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  const newAssessment = {
    id: Date.now(),
    patient_id,
    assessment_type,
    assessment_date: new Date().toISOString(),
    tests: [],
    prescriptions: [],
    pain_scale: body.pain_scale || 0,
    chief_complaint: body.chief_complaint || '',
    goals: body.goals || [],
    clinical_notes: ''
  };
  
  if (!MOCK_PATIENTS[patientIndex].assessments) {
    MOCK_PATIENTS[patientIndex].assessments = [];
  }
  MOCK_PATIENTS[patientIndex].assessments.push(newAssessment);
  
  return c.json({ success: true, data: newAssessment }, 201);
});

// ============================================================================
// EXERCISE ROUTES
// ============================================================================

// Get all exercises
app.get('/api/exercises', (c) => {
  const category = c.req.query('category');
  
  let exercises = EXERCISE_LIBRARY;
  if (category) {
    exercises = exercises.filter(e => e.category === category);
  }
  
  return c.json({ success: true, data: exercises });
});

// ============================================================================
// DASHBOARD / ANALYTICS
// ============================================================================

app.get('/api/dashboard/stats', (c) => {
  const stats = {
    total_patients: MOCK_PATIENTS.length,
    active_patients: MOCK_PATIENTS.filter(p => {
      const latest = p.assessments?.[p.assessments.length - 1];
      if (!latest) return false;
      const daysSince = (Date.now() - new Date(latest.assessment_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 30;
    }).length,
    total_assessments: MOCK_PATIENTS.reduce((acc, p) => acc + (p.assessments?.length || 0), 0),
    total_sessions: MOCK_PATIENTS.reduce((acc, p) => acc + (p.exercise_sessions?.length || 0), 0),
    recent_activity: MOCK_PATIENTS.flatMap(p => 
      (p.exercise_sessions || []).map(s => ({
        patient_name: `${p.first_name} ${p.last_name}`,
        date: s.session_date,
        duration: s.duration_minutes,
        exercises: s.exercises_completed?.length || 0
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  };
  
  return c.json({ success: true, data: stats });
});

// ============================================================================
// AUTH
// ============================================================================

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();
  
  return c.json({
    success: true,
    data: {
      user: {
        id: 1,
        name: 'Dr. Demo Clinician',
        email: body.email || 'demo@physiomotion.com',
        role: 'clinician'
      },
      token: 'demo-token-12345',
      demo_mode: true
    }
  });
});

// ============================================================================
// STATIC FILES & FALLBACK
// ============================================================================

app.get('/', (c) => {
  return c.json({ 
    status: 'PhysioMotion API Server',
    version: '2.0.0-demo',
    endpoints: [
      '/api/health',
      '/api/patients',
      '/api/assessments', 
      '/api/dashboard/stats',
      '/api/exercises'
    ],
    demo_mode: true
  });
});

// Error handling
app.onError((err, c) => {
  console.error('[PHYSIOMOTION] Error:', err);
  return c.json({ success: false, error: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ success: false, error: 'Not found', path: c.req.path }, 404);
});

// Start server
console.log('[PHYSIOMOTION] Routes registered:', app.routes.map(r => `${r.method} ${r.path}`));

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`[PHYSIOMOTION] Server running at http://localhost:${info.port}`);
});

export default app;