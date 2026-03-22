import { Hono } from 'hono'
import type { Bindings } from '../types'

const assessments = new Hono<{ Bindings: Bindings }>()

const mockAssessments = [
  {
    id: 1,
    patient_id: 1,
    patient_name: "John Doe",
    assessment_type: "movement_analysis",
    status: "completed",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    patient_id: 2,
    patient_name: "Jane Smith",
    assessment_type: "posture_evaluation",
    status: "in_progress",
    created_at: new Date().toISOString()
  }
]

assessments.get('/', async (c) => {
  return c.json({ success: true, data: mockAssessments })
})

assessments.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const assessment = mockAssessments.find(a => a.id === id)
  if (!assessment) {
    return c.json({ success: false, error: 'Assessment not found' }, 404)
  }
  return c.json({ success: true, data: assessment })
})

assessments.post('/', async (c) => {
  const body = await c.req.json()
  const newAssessment = {
    id: mockAssessments.length + 1,
    ...body,
    created_at: new Date().toISOString()
  }
  mockAssessments.push(newAssessment)
  return c.json({ success: true, data: newAssessment })
})

export default assessments
