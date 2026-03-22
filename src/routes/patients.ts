import { Hono } from 'hono'
import type { Bindings } from '../types'

const patients = new Hono<{ Bindings: Bindings }>()

// Mock data for demo mode
const mockPatients = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    date_of_birth: "1985-03-15",
    gender: "male",
    email: "john.doe@example.com",
    phone: "555-0123",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    date_of_birth: "1990-07-22",
    gender: "female",
    email: "jane.smith@example.com",
    phone: "555-0456",
    created_at: new Date().toISOString()
  }
]

patients.get('/', async (c) => {
  return c.json({ 
    success: true, 
    data: mockPatients,
    note: "Demo mode - database not connected"
  })
})

patients.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const patient = mockPatients.find(p => p.id === id)
  
  if (!patient) {
    return c.json({ success: false, error: 'Patient not found' }, 404)
  }

  return c.json({ success: true, data: patient })
})

patients.post('/', async (c) => {
  const body = await c.req.json()
  const newPatient = {
    id: mockPatients.length + 1,
    ...body,
    created_at: new Date().toISOString()
  }
  mockPatients.push(newPatient)
  return c.json({ success: true, data: newPatient })
})

patients.put('/:id', async (c) => {
  return c.json({ success: true, note: "Demo mode - update simulated" })
})

patients.delete('/:id', async (c) => {
  return c.json({ success: true, note: "Demo mode - delete simulated" })
})

export default patients
