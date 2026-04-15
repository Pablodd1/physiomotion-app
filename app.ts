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
    commit: 'working-v2',
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

// Get patient medical history
app.get('/api/patients/:id/medical-history', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  return c.json({ 
    success: true, 
    data: patient.medical_history || {}
  });
});

// Get patient assessments
app.get('/api/patients/:id/assessments', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  return c.json({ 
    success: true, 
    data: patient.assessments || []
  });
});

// Get patient prescriptions
app.get('/api/patients/:id/prescriptions', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  const prescriptions = patient.assessments?.flatMap((a) => 
    a.prescriptions?.map((p) => ({
      ...p,
      assessment_id: a.id,
      assessment_date: a.assessment_date
    })) || []
  ) || [];
  
  return c.json({ success: true, data: prescriptions });
});

// Get patient sessions
app.get('/api/patients/:id/sessions', (c) => {
  const id = parseInt(c.req.param('id'));
  const patient = MOCK_PATIENTS.find(p => p.id === id);
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  return c.json({ 
    success: true, 
    data: patient.exercise_sessions || []
  });
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
  const { patient_id, assessment_type, clinician_id } = body;
  
  const patientIndex = MOCK_PATIENTS.findIndex(p => p.id === patient_id);
  if (patientIndex === -1) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  const newAssessment = {
    id: Date.now(),
    patient_id,
    assessment_type,
    clinician_id,
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

// Add test to assessment
app.post('/api/assessments/:id/tests', async (c) => {
  const assessmentId = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  for (const patient of MOCK_PATIENTS) {
    const assessment = patient.assessments?.find(a => a.id === assessmentId);
    if (assessment) {
      const newTest = {
        id: Date.now(),
        ...body,
        created_at: new Date().toISOString()
      };
      
      if (!assessment.tests) assessment.tests = [];
      assessment.tests.push(newTest);
      
      return c.json({ success: true, data: newTest }, 201);
    }
  }
  
  return c.json({ success: false, error: 'Assessment not found' }, 404);
});

// Generate clinical note
app.post('/api/assessments/:id/generate-note', async (c) => {
  const assessmentId = parseInt(c.req.param('id'));
  
  for (const patient of MOCK_PATIENTS) {
    const assessment = patient.assessments?.find(a => a.id === assessmentId);
    if (assessment) {
      const note = generateClinicalNote(patient, assessment);
      assessment.clinical_notes = note;
      
      return c.json({ success: true, data: { note } });
    }
  }
  
  return c.json({ success: false, error: 'Assessment not found' }, 404);
});

function generateClinicalNote(patient, assessment) {
  const tests = assessment.tests || [];
  const prescriptions = assessment.prescriptions || [];
  
  let note = `CLINICAL NOTE\n`;
  note += `==============\n\n`;
  note += `Patient: ${patient.first_name} ${patient.last_name}\n`;
  note += `DOB: ${patient.date_of_birth}\n`;
  note += `Assessment Date: ${new Date(assessment.assessment_date).toLocaleDateString()}\n`;
  note += `Clinician: ${assessment.clinician || 'Dr. PT Clinician'}\n\n`;
  
  note += `CHIEF COMPLAINT:\n`;
  note += `${assessment.chief_complaint || 'No chief complaint recorded'}\n\n`;
  
  note += `SUBJECTIVE:\n`;
  note += `Pain Level: ${assessment.pain_scale}/10\n`;
  note += `Patient reports ${assessment.functional_status || 'functional limitations as noted above'}.\n\n`;
  
  note += `OBJECTIVE:\n`;
  tests.forEach((test) => {
    note += `- ${test.test_name}:\n`;
    if (test.results) {
      Object.entries(test.results).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          note += `  ${key}: ${value.value || value.result || JSON.stringify(value)}\n`;
        } else {
          note += `  ${key}: ${value}\n`;
        }
      });
    }
  });
  note += `\n`;
  
  note += `ASSESSMENT:\n`;
  note += `${assessment.clinical_notes || 'Functional movement deficits identified. See objective findings above.'}\n\n`;
  
  note += `PLAN:\n`;
  note += `1. Physical therapy ${prescriptions.length > 0 ? 'with prescribed exercises' : 'evaluation and treatment'}\n`;
  note += `2. Home exercise program compliance essential\n`;
  if (assessment.goals && assessment.goals.length > 0) {
    note += `3. Goals: ${assessment.goals.join('; ')}\n`;
  }
  note += `4. Re-evaluate in 2-4 weeks\n\n`;
  
  note += `PRESCRIBED EXERCISES:\n`;
  prescriptions.forEach((p, i) => {
    note += `${i + 1}. ${p.exercise_name}: ${p.sets} sets x ${p.reps} reps, ${p.frequency}\n`;
    if (p.notes) note += `   Notes: ${p.notes}\n`;
  });
  
  return note;
}

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

// Get exercise by ID
app.get('/api/exercises/:id', (c) => {
  const id = c.req.param('id');
  const exercise = EXERCISE_LIBRARY.find(e => e.id === id);
  
  if (!exercise) {
    return c.json({ success: false, error: 'Exercise not found' }, 404);
  }
  
  return c.json({ success: true, data: exercise });
});

// ============================================================================
// PRESCRIPTION ROUTES
// ============================================================================

// Create prescription
app.post('/api/prescriptions', async (c) => {
  const body = await c.req.json();
  const { patient_id, exercise_id, assessment_id, sets, reps, frequency, notes } = body;
  
  const exercise = EXERCISE_LIBRARY.find(e => e.id === exercise_id);
  if (!exercise) {
    return c.json({ success: false, error: 'Exercise not found' }, 404);
  }
  
  const prescription = {
    id: Date.now(),
    exercise_id,
    exercise_name: exercise.name,
    sets,
    reps,
    frequency,
    notes,
    created_at: new Date().toISOString()
  };
  
  // Add to patient's assessment
  if (assessment_id) {
    for (const patient of MOCK_PATIENTS) {
      const assessment = patient.assessments?.find(a => a.id === assessment_id);
      if (assessment) {
        if (!assessment.prescriptions) assessment.prescriptions = [];
        assessment.prescriptions.push(prescription);
        break;
      }
    }
  }
  
  return c.json({ success: true, data: prescription }, 201);
});

// ============================================================================
// SESSION ROUTES
// ============================================================================

// Record exercise session
app.post('/api/exercise-sessions', async (c) => {
  const body = await c.req.json();
  const { patient_id, exercises_completed, duration_minutes, pain_level, notes } = body;
  
  const patientIndex = MOCK_PATIENTS.findIndex(p => p.id === patient_id);
  if (patientIndex === -1) {
    return c.json({ success: false, error: 'Patient not found' }, 404);
  }
  
  const session = {
    id: Date.now(),
    session_date: new Date().toISOString(),
    exercises_completed,
    duration_minutes,
    pain_level,
    notes,
    adherence: pain_level <= 3 ? 'excellent' : pain_level <= 5 ? 'good' : 'fair'
  };
  
  if (!MOCK_PATIENTS[patientIndex].exercise_sessions) {
    MOCK_PATIENTS[patientIndex].exercise_sessions = [];
  }
  MOCK_PATIENTS[patientIndex].exercise_sessions.push(session);
  
  // Update progress metrics
  if (!MOCK_PATIENTS[patientIndex].progress_metrics) {
    MOCK_PATIENTS[patientIndex].progress_metrics = { pain_trend: [] };
  }
  if (!MOCK_PATIENTS[patientIndex].progress_metrics.pain_trend) {
    MOCK_PATIENTS[patientIndex].progress_metrics.pain_trend = [];
  }
  MOCK_PATIENTS[patientIndex].progress_metrics.pain_trend.push(pain_level);
  
  return c.json({ success: true, data: session }, 201);
});

// ============================================================================
// ANALYTICS & REPORTING (DASHBOARD)
// ============================================================================

// Get dashboard stats
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
// AUTH ROUTES (Demo Mode)
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
        role: 'clinician',
        license: 'PT12345'
      },
      token: 'demo-token-12345',
      demo_mode: true
    }
  });
});

app.get('/api/auth/me', (c) => {
  return c.json({
    success: true,
    data: {
      user: {
        id: 1,
        name: 'Dr. Demo Clinician',
        email: 'demo@physiomotion.com',
        role: 'clinician',
        license: 'PT12345'
      },
      demo_mode: true
    }
  });
});

// ============================================================================
// CAMERA / VIDEO API
// ============================================================================

app.get('/api/cameras', (c) => {
  return c.json({
    success: true,
    data: {
      supported: ['webcam', 'femto-mega', 'azure-kinect', 'orbbec'],
      note: 'Camera access requires frontend request'
    }
  });
});

app.post('/api/video/analyze', async (c) => {
  const { landmarks } = await c.req.json();
  
  // Simple mock analysis
  return c.json({
    success: true,
    data: {
      analysis: {
        joints_detected: landmarks?.length || 0,
        range_of_motion: 'normal',
        symmetry_score: 85,
        recommendations: ['Continue current exercise program']
      }
    }
  });
});

// ============================================================================
// STATIC FILES SERVING
// ============================================================================

// Determine the correct static files path
const possiblePaths = [
  path.join(__dirname, 'dist', 'static'),
  path.join(__dirname, 'public', 'static'),
  path.join(__dirname, 'static'),
  path.join(process.cwd(), 'dist', 'static'),
  path.join(process.cwd(), 'public', 'static'),
];

let staticPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log(`[PHYSIOMOTION] Found static files at: ${staticPath}`);
    break;
  }
}

if (!staticPath) {
  console.warn('[PHYSIOMOTION] Static files not found in expected locations');
  staticPath = path.join(__dirname, 'public', 'static');
}

// Serve static files with proper MIME types
app.use('/static/*', async (c, next) => {
  const filePath = c.req.path.replace('/static/', '');
  const fullPath = path.join(staticPath, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(staticPath)) {
    return c.json({ error: 'Invalid path' }, 403);
  }
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(fullPath);
    
    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(content);
  }
  
  await next();
});

// Serve HTML pages helper
const servePage = (pageName) => {
  const possiblePagePaths = [
    path.join(__dirname, 'public', `${pageName}.html`),
    path.join(__dirname, 'dist', `${pageName}.html`),
    path.join(__dirname, `${pageName}.html`),
    path.join(staticPath, `${pageName}.html`),
    path.join(process.cwd(), 'public', `${pageName}.html`),
  ];
  
  for (const pagePath of possiblePagePaths) {
    if (fs.existsSync(pagePath)) {
      return fs.readFileSync(pagePath, 'utf-8');
    }
  }
  return null;
};

// Routes for specific pages
app.get('/login', (c) => {
  const content = servePage('login');
  if (content) return c.html(content);
  return c.redirect('/');
});

app.get('/assessment', (c) => {
  const content = servePage('assessment');
  if (content) return c.html(content);
  return c.json({ error: 'Assessment page not found' }, 404);
});

app.get('/patients', (c) => {
  const content = servePage('patients');
  if (content) return c.html(content);
  return c.json({ error: 'Patients page not found' }, 404);
});

app.get('/dashboard', (c) => {
  const content = servePage('dashboard');
  if (content) return c.html(content);
  return c.json({ error: 'Dashboard page not found' }, 404);
});

app.get('/intake', (c) => {
  const content = servePage('intake');
  if (content) return c.html(content);
  return c.json({ error: 'Intake page not found' }, 404);
});

app.get('/exercises', (c) => {
  const content = servePage('exercises');
  if (content) return c.html(content);
  return c.json({ error: 'Exercises page not found' }, 404);
});

// Root path - serve main app
app.get('/', (c) => {
  const indexPaths = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(staticPath, 'index.html'),
  ];
  
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      return c.html(content);
    }
  }
  
  // Fallback to login
  const loginContent = servePage('login');
  if (loginContent) return c.html(loginContent);
  
  return c.json({ 
    status: 'PhysioMotion API Server',
    message: 'All endpoints working. Demo mode active.',
    endpoints: [
      '/api/health',
      '/api/patients',
      '/api/assessments',
      '/api/dashboard/stats',
      '/api/exercises',
      '/api/auth/login'
    ],
    version: '2.0.0-demo',
    pages: ['/login', '/dashboard', '/patients', '/assessment', '/intake', '/exercises']
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('[PHYSIOMOTION] Error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message
  }, 500);
});

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    path: c.req.path
  }, 404);
});

// ============================================================================
// START SERVER
// ============================================================================

console.log('[PHYSIOMOTION] Registered routes:');
app.routes.forEach((route) => {
  console.log(`  ${route.method} ${route.path}`);
});

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`[PHYSIOMOTION] Server running at http://localhost:${info.port}`);
  console.log(`[PHYSIOMOTION] API available at http://localhost:${info.port}/api`);
  console.log(`[PHYSIOMOTION] Dashboard stats at http://localhost:${info.port}/api/dashboard/stats`);
});

export default app;