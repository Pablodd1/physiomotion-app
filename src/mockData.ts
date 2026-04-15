// ============================================================================
// PHYSIOMOTION - Complete Mock Data for Demo
// 5 Full Patients with Medical History, Assessments, and Sessions
// ============================================================================

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policy_number: string;
    group_number: string;
  };
  created_at: string;
  medical_history: {
    conditions: Array<{
      condition: string;
      diagnosed_date: string;
      status: string;
    }>;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      reason: string;
    }>;
    allergies: string[];
    surgeries: Array<{
      procedure: string;
      date: string;
      outcome: string;
    }>;
    family_history?: string[];
    occupation?: string;
    activities?: string[];
    goals?: string;
    precautions?: string[];
  };
  assessments: Array<{
    id: number;
    assessment_type: string;
    assessment_date: string;
    clinician: string;
    chief_complaint: string;
    tests?: Array<{
      test_name: string;
      results: any;
    }>;
    pain_scale: number;
    functional_status?: string;
    goals?: string[];
    clinical_notes?: string;
    prescriptions?: Array<{
      exercise_id: string;
      exercise_name: string;
      sets: number;
      reps: number | string;
      frequency: string;
      notes?: string;
    }>;
    precautions?: string[];
    clearance_status?: string;
  }>;
  exercise_sessions: Array<{
    id: number;
    session_date: string;
    duration_minutes: number;
    exercises_completed: string[];
    pain_level: number;
    adherence: string;
    notes: string;
  }>;
  progress_metrics: {
    pain_trend: number[];
    functional_score_trend?: number[];
    rom_flexion_trend?: number[];
    rom_abduction_trend?: number[];
    lsi_quad_trend?: number[];
    berg_balance_trend?: number[];
  };
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 1,
    first_name: "John",
    last_name: "Smith",
    date_of_birth: "1979-05-15",
    gender: "male",
    email: "john.smith@email.com",
    phone: "(305) 555-0123",
    emergency_contact: {
      name: "Mary Smith",
      relationship: "Spouse",
      phone: "(305) 555-0124"
    },
    insurance: {
      provider: "BlueCross BlueShield",
      policy_number: "BC123456789",
      group_number: "GRP001"
    },
    created_at: "2025-01-15T10:30:00Z",
    medical_history: {
      conditions: [
        { condition: "Chronic Lower Back Pain", diagnosed_date: "2019-03-10", status: "active" },
        { condition: "Hypertension", diagnosed_date: "2018-07-22", status: "managed" }
      ],
      medications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Daily", reason: "Blood pressure" },
        { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", reason: "Pain" }
      ],
      allergies: ["Penicillin", "Sulfa drugs"],
      surgeries: [
        { procedure: "Lumbar Microdiscectomy L4-L5", date: "2020-11-15", outcome: "Improved" }
      ],
      family_history: ["Heart disease (father)", "Diabetes (mother)"]
    },
    assessments: [
      {
        id: 101,
        assessment_type: "Initial Evaluation",
        assessment_date: "2025-01-15T10:30:00Z",
        clinician: "Dr. Sarah Johnson, PT",
        chief_complaint: "Lower back pain radiating to right leg, pain level 7/10",
        tests: [
          {
            test_name: "Lumbar Range of Motion",
            results: {
              flexion: { value: 45, normal: 60, unit: "degrees", status: "limited" },
              extension: { value: 15, normal: 25, unit: "degrees", status: "limited" },
              lateral_flexion: { value: 20, normal: 30, unit: "degrees", status: "limited" },
              rotation: { value: 25, normal: 45, unit: "degrees", status: "limited" }
            }
          },
          {
            test_name: "Straight Leg Raise",
            results: {
              left: { value: 75, normal: 80, unit: "degrees", status: "normal" },
              right: { value: 45, normal: 80, unit: "degrees", status: "limited" }
            }
          },
          {
            test_name: "Functional Movement Screen",
            results: {
              deep_squat: { score: 1, max: 3, notes: "Pain with lumbar flexion" },
              hurdle_step: { score: 2, max: 3, notes: "Compensation noted" },
              inline_lunge: { score: 1, max: 3, notes: "Balance deficit" }
            }
          }
        ],
        pain_scale: 7,
        functional_status: "Limited household ambulation, difficulty with prolonged sitting",
        goals: [
          "Reduce pain to 3/10 or less",
          "Return to work (desk job) full time",
          "Resume walking 30 minutes daily"
        ],
        clinical_notes: "Patient presents with chronic LBP with radicular symptoms. Post-surgical changes noted. Core weakness and hip mobility deficits identified.",
        prescriptions: [
          {
            exercise_id: "core_stabilization_01",
            exercise_name: "Dead Bug",
            sets: 3,
            reps: 10,
            frequency: "Daily",
            notes: "Focus on maintaining neutral spine"
          },
          {
            exercise_id: "hip_mobility_01",
            exercise_name: "90/90 Hip Stretch",
            sets: 2,
            reps: 30,
            frequency: "Daily",
            notes: "Hold stretch, breathe deeply"
          },
          {
            exercise_id: "glute_strength_01",
            exercise_name: "Glute Bridge",
            sets: 3,
            reps: 12,
            frequency: "Daily",
            notes: "Squeeze glutes at top"
          }
        ]
      },
      {
        id: 102,
        assessment_type: "Progress Note",
        assessment_date: "2025-02-01T14:00:00Z",
        clinician: "Dr. Sarah Johnson, PT",
        chief_complaint: "Improved, pain now 4/10",
        tests: [
          {
            test_name: "Lumbar Range of Motion",
            results: {
              flexion: { value: 50, normal: 60, unit: "degrees", status: "improved" },
              extension: { value: 20, normal: 25, unit: "degrees", status: "improved" }
            }
          }
        ],
        pain_scale: 4,
        functional_status: "Able to sit for 45 minutes, walking 15 minutes",
        clinical_notes: "Significant improvement noted. Patient compliant with HEP. Progressing to phase 2 exercises."
      }
    ],
    exercise_sessions: [
      {
        id: 1001,
        session_date: "2025-01-16T09:00:00Z",
        duration_minutes: 15,
        exercises_completed: ["Dead Bug", "Glute Bridge"],
        pain_level: 6,
        adherence: "good",
        notes: "Completed all exercises, some discomfort with bridging"
      },
      {
        id: 1002,
        session_date: "2025-01-18T09:00:00Z",
        duration_minutes: 18,
        exercises_completed: ["Dead Bug", "90/90 Stretch", "Glute Bridge"],
        pain_level: 5,
        adherence: "excellent",
        notes: "Good form on all exercises"
      }
    ],
    progress_metrics: {
      pain_trend: [7, 6, 6, 5, 5, 4, 4],
      rom_flexion_trend: [45, 48, 50, 50, 52, 55, 55],
      functional_score_trend: [45, 52, 58, 62, 68, 72, 75]
    }
  },
  
  {
    id: 2,
    first_name: "Maria",
    last_name: "Garcia",
    date_of_birth: "1963-08-22",
    gender: "female",
    email: "maria.garcia@email.com",
    phone: "(305) 555-0234",
    emergency_contact: {
      name: "Carlos Garcia",
      relationship: "Son",
      phone: "(305) 555-0235"
    },
    insurance: {
      provider: "Medicare",
      policy_number: "MC987654321",
      group_number: "GRP002"
    },
    created_at: "2025-02-20T11:00:00Z",
    medical_history: {
      conditions: [
        { condition: "Total Knee Replacement (Right)", diagnosed_date: "2024-12-10", status: "post_op" },
        { condition: "Osteoarthritis (Left Knee)", diagnosed_date: "2020-01-15", status: "active" },
        { condition: "Type 2 Diabetes", diagnosed_date: "2015-06-20", status: "managed" }
      ],
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily", reason: "Diabetes" },
        { name: "Acetaminophen", dosage: "500mg", frequency: "As needed", reason: "Pain" },
        { name: "Aspirin", dosage: "81mg", frequency: "Daily", reason: "Blood thinner" }
      ],
      allergies: ["Codeine"],
      surgeries: [
        { procedure: "Total Knee Arthroplasty (Right)", date: "2024-12-10", outcome: "Recovering" }
      ],
      family_history: ["Diabetes (mother, brother)"]
    },
    assessments: [
      {
        id: 201,
        assessment_type: "Post-Op Evaluation",
        assessment_date: "2025-02-20T11:00:00Z",
        clinician: "Dr. Michael Chen, PT",
        chief_complaint: "Post TKA rehabilitation, 10 weeks post-op",
        tests: [
          {
            test_name: "Knee Range of Motion",
            results: {
              right_flexion: { value: 105, normal: 135, unit: "degrees", status: "limited" },
              right_extension: { value: -5, normal: 0, unit: "degrees", status: "limited" },
              left_flexion: { value: 120, normal: 135, unit: "degrees", status: "mild_limitation" },
              left_extension: { value: 0, normal: 0, unit: "degrees", status: "normal" }
            }
          },
          {
            test_name: "Timed Up and Go",
            results: {
              time_seconds: 12.5,
              normal: 10,
              status: "mild_impairment",
              assistive_device: "Single point cane"
            }
          },
          {
            test_name: "Five Times Sit to Stand",
            results: {
              time_seconds: 18.2,
              normal: 11,
              status: "impaired",
              notes: "Uses upper extremity support"
            }
          }
        ],
        pain_scale: 4,
        functional_status: "Ambulating with cane, independent with ADLs, stairs with rail",
        goals: [
          "Achieve 120° knee flexion",
          "Ambulate without assistive device",
          "Independent with stairs",
          "Return to social activities"
        ],
        clinical_notes: "10 weeks post-op TKA. Incision well-healed. Quadriceps weakness noted (3/5 MMT). Gait abnormality with antalgic pattern. Good compliance with previous PT.",
        prescriptions: [
          {
            exercise_id: "knee_flexion_01",
            exercise_name: "Heel Slides",
            sets: 3,
            reps: 15,
            frequency: "3x daily",
            notes: "Progress range of motion"
          },
          {
            exercise_id: "quad_strength_01",
            exercise_name: "Quad Sets",
            sets: 3,
            reps: 15,
            frequency: "3x daily",
            notes: "Hold contraction 5 seconds"
          },
          {
            exercise_id: "functional_01",
            exercise_name: "Sit to Stand",
            sets: 2,
            reps: 10,
            frequency: "Daily",
            notes: "Controlled movement, use hands if needed"
          },
          {
            exercise_id: "gait_01",
            exercise_name: "Step Ups",
            sets: 2,
            reps: 10,
            frequency: "Daily",
            notes: "4-inch step, leading with operated leg"
          }
        ]
      }
    ],
    exercise_sessions: [
      {
        id: 2001,
        session_date: "2025-02-21T10:00:00Z",
        duration_minutes: 20,
        exercises_completed: ["Heel Slides", "Quad Sets", "Ankle Pumps"],
        pain_level: 3,
        adherence: "excellent",
        notes: "Doing well with home program"
      }
    ],
    progress_metrics: {
      pain_trend: [5, 5, 4, 4, 4],
      rom_flexion_trend: [95, 100, 102, 105, 105],
      functional_score_trend: [35, 42, 48, 52, 55]
    }
  },
  
  {
    id: 3,
    first_name: "David",
    last_name: "Chen",
    date_of_birth: "1987-03-10",
    gender: "male",
    email: "david.chen@email.com",
    phone: "(305) 555-0345",
    emergency_contact: {
      name: "Jennifer Chen",
      relationship: "Spouse",
      phone: "(305) 555-0346"
    },
    insurance: {
      provider: "Aetna",
      policy_number: "AE456789123",
      group_number: "GRP003"
    },
    created_at: "2025-03-05T09:30:00Z",
    medical_history: {
      conditions: [
        { condition: "Shoulder Impingement Syndrome", diagnosed_date: "2025-01-20", status: "active" },
        { condition: "Rotator Cuff Tendinopathy", diagnosed_date: "2025-01-20", status: "active" }
      ],
      medications: [
        { name: "Meloxicam", dosage: "15mg", frequency: "Daily", reason: "Anti-inflammatory" }
      ],
      allergies: [],
      surgeries: [],
      occupation: "Software Engineer - heavy computer use",
      activities: ["Weight lifting", "Swimming", "Tennis"]
    },
    assessments: [
      {
        id: 301,
        assessment_type: "Initial Evaluation",
        assessment_date: "2025-03-05T09:30:00Z",
        clinician: "Dr. Lisa Wong, PT",
        chief_complaint: "Right shoulder pain, worse with overhead activity, pain level 5/10",
        tests: [
          {
            test_name: "Shoulder Range of Motion",
            results: {
              right_flexion: { value: 150, normal: 180, unit: "degrees", status: "limited" },
              right_abduction: { value: 120, normal: 180, unit: "degrees", status: "limited" },
              right_external_rotation: { value: 45, normal: 90, unit: "degrees", status: "limited" },
              right_internal_rotation: { value: 60, normal: 70, unit: "degrees", status: "mild_limitation" }
            }
          },
          {
            test_name: "Special Tests",
            results: {
              neer_test: { result: "positive", notes: "Pain with impingement" },
              hawkins_kennedy: { result: "positive", notes: "Pain with impingement" },
              empty_can: { result: "negative", notes: "No significant weakness" },
              drop_arm: { result: "negative", notes: "No tear suspected" }
            }
          },
          {
            test_name: "Manual Muscle Testing",
            results: {
              supraspinatus: { grade: "4/5", status: "weakness" },
              infraspinatus: { grade: "4+/5", status: "mild_weakness" },
              subscapularis: { grade: "5/5", status: "normal" },
              deltoid: { grade: "4/5", status: "weakness" }
            }
          }
        ],
        pain_scale: 5,
        functional_status: "Unable to lift overhead, difficulty with swimming and tennis, sleep disrupted",
        goals: [
          "Return to full overhead ROM",
          "Resume swimming and tennis",
          "Sleep without pain",
          "Improve posture at work station"
        ],
        clinical_notes: "Classic impingement presentation. Postural dysfunction with forward head and rounded shoulders noted. Scapular dyskinesis observed during arm elevation. Desk job with poor ergonomics contributing factor.",
        prescriptions: [
          {
            exercise_id: "shoulder_mobility_01",
            exercise_name: "Sleeper Stretch",
            sets: 2,
            reps: 30,
            frequency: "Daily",
            notes: "For posterior capsule tightness"
          },
          {
            exercise_id: "scapular_01",
            exercise_name: "Scapular Retraction",
            sets: 3,
            reps: 15,
            frequency: "Daily",
            notes: "Squeeze shoulder blades together"
          },
          {
            exercise_id: "rotator_cuff_01",
            exercise_name: "External Rotation with Band",
            sets: 3,
            reps: 12,
            frequency: "Daily",
            notes: "Elbow at side, rotate outward"
          },
          {
            exercise_id: "posture_01",
            exercise_name: "Thoracic Extension over Foam Roller",
            sets: 2,
            reps: 10,
            frequency: "Daily",
            notes: "Support head, extend over roller"
          }
        ]
      }
    ],
    exercise_sessions: [],
    progress_metrics: {
      pain_trend: [5],
      rom_abduction_trend: [120],
      functional_score_trend: [60]
    }
  },
  
  {
    id: 4,
    first_name: "Sarah",
    last_name: "Johnson",
    date_of_birth: "1997-11-28",
    gender: "female",
    email: "sarah.johnson@email.com",
    phone: "(305) 555-0456",
    emergency_contact: {
      name: "Michael Johnson",
      relationship: "Father",
      phone: "(305) 555-0457"
    },
    insurance: {
      provider: "UnitedHealthcare",
      policy_number: "UH789123456",
      group_number: "GRP004"
    },
    created_at: "2025-01-10T14:00:00Z",
    medical_history: {
      conditions: [
        { condition: "ACL Reconstruction (Left)", diagnosed_date: "2024-09-15", status: "post_op" },
        { condition: "Meniscus Repair (Left)", diagnosed_date: "2024-09-15", status: "post_op" }
      ],
      medications: [
        { name: "Vitamin D", dosage: "2000 IU", frequency: "Daily", reason: "Supplement" }
      ],
      allergies: [],
      surgeries: [
        { procedure: "ACL Reconstruction with Hamstring Graft", date: "2024-09-15", outcome: "Recovering" },
        { procedure: "Medial Meniscus Repair", date: "2024-09-15", outcome: "Recovering" }
      ],
      activities: ["Soccer", "Running", "Hiking"],
      goals: "Return to competitive soccer"
    },
    assessments: [
      {
        id: 401,
        assessment_type: "Return to Sport Evaluation",
        assessment_date: "2025-01-10T14:00:00Z",
        clinician: "Dr. James Miller, PT, DPT, SCS",
        chief_complaint: "5 months post-op ACL reconstruction, ready for return to sport testing",
        tests: [
          {
            test_name: "Knee Range of Motion",
            results: {
              left_flexion: { value: 140, normal: 140, unit: "degrees", status: "normal" },
              left_extension: { value: 0, normal: 0, unit: "degrees", status: "normal" }
            }
          },
          {
            test_name: "Limb Symmetry Index",
            results: {
              quad_strength: { involved: 92, uninvolved: 100, lsi: 92, status: "good" },
              hamstring_strength: { involved: 95, uninvolved: 100, lsi: 95, status: "excellent" },
              single_leg_hop: { involved: 95, uninvolved: 100, lsi: 95, status: "excellent" },
              triple_hop: { involved: 93, uninvolved: 100, lsi: 93, status: "good" },
              crossover_hop: { involved: 91, uninvolved: 100, lsi: 91, status: "borderline" },
              timed_hop: { involved: 94, uninvolved: 100, lsi: 94, status: "good" }
            }
          },
          {
            test_name: "Y Balance Test",
            results: {
              anterior_left: { value: 72, normal: 75, unit: "cm", status: "slight_deficit" },
              posteromedial_left: { value: 88, normal: 90, unit: "cm", status: "normal" },
              posterolateral_left: { value: 85, normal: 88, unit: "cm", status: "slight_deficit" },
              composite_score: { value: 97, normal: 100, unit: "%", status: "good" }
            }
          },
          {
            test_name: "Drop Jump Test",
            results: {
              landing_error: { score: 4, max: 6, notes: "Good landing mechanics" },
              knee_valgus: { left: "minimal", right: "minimal" }
            }
          }
        ],
        pain_scale: 1,
        functional_status: "Running 3 miles without pain, plyometric training initiated, cutting drills tolerated",
        goals: [
          "Pass all return to sport criteria",
          "Return to competitive soccer",
          "Achieve 95% limb symmetry",
          "Prevent re-injury"
        ],
        clinical_notes: "5 months post-op ACLR with meniscal repair. Excellent progress. ROM full. Strength near symmetrical. Needs to improve crossover hop LSI and Y-balance anterior reach. On track for RTS in 2-4 weeks with continued progression.",
        prescriptions: [
          {
            exercise_id: "plyometric_01",
            exercise_name: "Single Leg Drop Jump",
            sets: 3,
            reps: 5,
            frequency: "3x/week",
            notes: "Focus on soft landing, knee over toe"
          },
          {
            exercise_id: "agility_01",
            exercise_name: "Lateral Shuffle with Cut",
            sets: 3,
            reps: 10,
            frequency: "3x/week",
            notes: "Plant and cut, maintain form"
          },
          {
            exercise_id: "strength_01",
            exercise_name: "Single Leg RDL",
            sets: 3,
            reps: 8,
            frequency: "3x/week",
            notes: "Add weight as tolerated"
          },
          {
            exercise_id: "balance_01",
            exercise_name: "Single Leg Balance on Foam",
            sets: 3,
            reps: 30,
            frequency: "Daily",
            notes: "Eyes open, progress to eyes closed"
          }
        ],
        clearance_status: "Not yet cleared for full return to sport. Continue current program. Re-evaluate in 3 weeks."
      }
    ],
    exercise_sessions: [
      {
        id: 4001,
        session_date: "2025-01-08T16:00:00Z",
        duration_minutes: 45,
        exercises_completed: ["Single Leg Press", "Bulgarian Split Squat", "Nordic Hamstring"],
        pain_level: 0,
        adherence: "excellent",
        notes: "Strong workout, no pain"
      }
    ],
    progress_metrics: {
      pain_trend: [3, 2, 2, 1, 1, 1, 1],
      lsi_quad_trend: [75, 82, 86, 89, 92, 92, 92],
      functional_score_trend: [40, 55, 68, 78, 85, 90, 92]
    }
  },
  
  {
    id: 5,
    first_name: "Robert",
    last_name: "Wilson",
    date_of_birth: "1954-02-14",
    gender: "male",
    email: "robert.wilson@email.com",
    phone: "(305) 555-0567",
    emergency_contact: {
      name: "Patricia Wilson",
      relationship: "Daughter",
      phone: "(305) 555-0568"
    },
    insurance: {
      provider: "Medicare + AARP Supplement",
      policy_number: "MC111222333",
      group_number: "GRP005"
    },
    created_at: "2025-02-01T10:00:00Z",
    medical_history: {
      conditions: [
        { condition: "Total Hip Replacement (Left)", diagnosed_date: "2024-11-20", status: "post_op" },
        { condition: "Osteoarthritis (Bilateral Knees)", diagnosed_date: "2018-05-10", status: "active" },
        { condition: "Hypertension", diagnosed_date: "2010-03-15", status: "managed" },
        { condition: "Osteoporosis", diagnosed_date: "2020-08-20", status: "managed" }
      ],
      medications: [
        { name: "Amlodipine", dosage: "5mg", frequency: "Daily", reason: "Blood pressure" },
        { name: "Alendronate", dosage: "70mg", frequency: "Weekly", reason: "Osteoporosis" },
        { name: "Vitamin D + Calcium", dosage: "1 tablet", frequency: "Daily", reason: "Bone health" },
        { name: "Tylenol", dosage: "500mg", frequency: "As needed", reason: "Pain" }
      ],
      allergies: ["Shellfish"],
      surgeries: [
        { procedure: "Total Hip Arthroplasty (Left)", date: "2024-11-20", outcome: "Recovering" }
      ],
      precautions: ["Posterior hip precautions"]
    },
    assessments: [
      {
        id: 501,
        assessment_type: "Post-Op Evaluation",
        assessment_date: "2025-02-01T10:00:00Z",
        clinician: "Dr. Susan Park, PT",
        chief_complaint: "10 weeks post-op left THA, progressing with therapy",
        tests: [
          {
            test_name: "Hip Range of Motion",
            results: {
              left_flexion: { value: 95, normal: 120, unit: "degrees", status: "limited" },
              left_abduction: { value: 25, normal: 45, unit: "degrees", status: "limited" },
              left_extension: { value: 10, normal: 30, unit: "degrees", status: "limited" },
              left_internal_rotation: { value: 15, normal: 35, unit: "degrees", status: "limited" },
              left_external_rotation: { value: 30, normal: 45, unit: "degrees", status: "mild_limitation" }
            }
          },
          {
            test_name: "Functional Mobility",
            results: {
              ambulation: { status: "modified_independent", device: "Standard cane" },
              stairs: { status: "supervised", notes: "Goes up with good leg, down with operated leg" },
              transfers: { status: "independent", notes: "Bed, chair, toilet" }
            }
          },
          {
            test_name: "Balance",
            results: {
              single_leg_stance: { left: "5 seconds", right: "15 seconds", status: "significant_impairment" },
              tandem_stance: { status: "held 10 seconds", notes: "Supervised" },
              berg_balance: { score: 42, max: 56, status: "moderate_impairment" }
            }
          }
        ],
        pain_scale: 3,
        functional_status: "Ambulating with cane 200+ feet, independent ADLs, requires supervision for stairs",
        goals: [
          "Ambulate without assistive device",
          "Achieve 110° hip flexion",
          "Independent with stairs",
          "Return to driving",
          "Resume golf (modified)"
        ],
        clinical_notes: "10 weeks post-op left THA. Following posterior precautions. Incision healed. Hip flexor weakness noted. Balance deficits secondary to deconditioning and surgical leg weakness. Cognitively intact, motivated. Daughter very supportive.",
        precautions: [
          "No hip flexion > 90°",
          "No hip adduction past midline",
          "No hip internal rotation"
        ],
        prescriptions: [
          {
            exercise_id: "hip_flexion_01",
            exercise_name: "Supine Heel Slides",
            sets: 3,
            reps: 15,
            frequency: "3x daily",
            notes: "Stay within 90° flexion limit"
          },
          {
            exercise_id: "hip_abduction_01",
            exercise_name: "Side-lying Hip Abduction",
            sets: 3,
            reps: 12,
            frequency: "Daily",
            notes: "Do not cross midline"
          },
          {
            exercise_id: "bridge_01",
            exercise_name: "Glute Bridge",
            sets: 3,
            reps: 10,
            frequency: "Daily",
            notes: "Squeeze glutes, neutral spine"
          },
          {
            exercise_id: "balance_01",
            exercise_name: "Standing Weight Shifts",
            sets: 3,
            reps: 10,
            frequency: "Daily",
            notes: "Hold counter, shift side to side"
          }
        ]
      }
    ],
    exercise_sessions: [
      {
        id: 5001,
        session_date: "2025-02-02T09:00:00Z",
        duration_minutes: 25,
        exercises_completed: ["Heel Slides", "Ankle Pumps", "Glute Sets"],
        pain_level: 2,
        adherence: "good",
        notes: "Doing well, daughter helps with exercises"
      }
    ],
    progress_metrics: {
      pain_trend: [5, 4, 4, 3, 3, 3],
      rom_flexion_trend: [75, 82, 88, 92, 95, 95],
      berg_balance_trend: [35, 38, 40, 42, 42]
    }
  }
];

// ============================================================================
// EXERCISE LIBRARY (50+ Evidence-Based Exercises)
// ============================================================================

export const EXERCISE_LIBRARY = [
  {
    id: "core_stabilization_01",
    name: "Dead Bug",
    category: "core",
    difficulty: "beginner",
    target_muscles: ["Transverse Abdominis", "Pelvic Floor", "Multifidus"],
    contraindications: ["Severe osteoporosis", "Acute disc herniation"],
    instructions: [
      "Lie on back with knees bent at 90°, arms reaching up",
      "Maintain neutral spine (small gap under lower back)",
      "Slowly lower opposite arm and leg while keeping back flat",
      "Return to starting position and repeat"
    ],
    progression: "Add resistance bands or perform on foam roller",
    regression: "Keep feet on floor, march in place",
    video_url: "/videos/dead_bug.mp4",
    thumbnail: "/images/dead_bug.jpg"
  },
  {
    id: "glute_strength_01",
    name: "Glute Bridge",
    category: "hip",
    difficulty: "beginner",
    target_muscles: ["Gluteus Maximus", "Hamstrings", "Core"],
    contraindications: ["Recent hip replacement (follow precautions)"],
    instructions: [
      "Lie on back with knees bent, feet flat on floor",
      "Engage core and squeeze glutes",
      "Lift hips off floor until shoulders, hips, and knees align",
      "Hold 2-3 seconds, lower slowly"
    ],
    progression: "Single leg bridge, add weight across hips",
    regression: "Bridge with feet elevated on step",
    video_url: "/videos/glute_bridge.mp4",
    thumbnail: "/images/glute_bridge.jpg"
  },
  {
    id: "quad_strength_01",
    name: "Quad Sets",
    category: "knee",
    difficulty: "beginner",
    target_muscles: ["Quadriceps"],
    contraindications: [],
    instructions: [
      "Sit or lie with leg straight",
      "Tighten thigh muscle, pressing knee down",
      "Hold contraction for 5 seconds",
      "Relax and repeat"
    ],
    progression: "Add ankle weights",
    regression: "Perform seated with back support",
    video_url: "/videos/quad_sets.mp4",
    thumbnail: "/images/quad_sets.jpg"
  },
  {
    id: "shoulder_mobility_01",
    name: "Sleeper Stretch",
    category: "shoulder",
    difficulty: "intermediate",
    target_muscles: ["Posterior Capsule", "Rotator Cuff"],
    contraindications: ["Shoulder instability", "Recent shoulder surgery"],
    instructions: [
      "Lie on side with affected shoulder down",
      "Bend elbow 90°, keep elbow at shoulder height",
      "Use top hand to gently push forearm down toward floor",
      "Hold stretch 30 seconds"
    ],
    progression: "Increase stretch pressure",
    regression: "Perform standing doorway stretch instead",
    video_url: "/videos/sleeper_stretch.mp4",
    thumbnail: "/images/sleeper_stretch.jpg"
  },
  {
    id: "scapular_01",
    name: "Scapular Retraction",
    category: "shoulder",
    difficulty: "beginner",
    target_muscles: ["Rhomboids", "Middle Trapezius", "Lower Trapezius"],
    contraindications: [],
    instructions: [
      "Sit or stand with good posture",
      "Gently squeeze shoulder blades together and down",
      "Hold 3-5 seconds",
      "Release slowly"
    ],
    progression: "Add resistance band",
    regression: "Perform lying down",
    video_url: "/videos/scapular_retraction.mp4",
    thumbnail: "/images/scapular_retraction.jpg"
  },
  {
    id: "hip_mobility_01",
    name: "90/90 Hip Stretch",
    category: "hip",
    difficulty: "intermediate",
    target_muscles: ["Hip External Rotators", "Glutes"],
    contraindications: ["Hip impingement", "Recent hip replacement"],
    instructions: [
      "Sit with front leg bent 90° in front, back leg bent 90° to side",
      "Keep chest upright",
      "Lean forward over front leg to feel stretch",
      "Hold 30-45 seconds, switch sides"
    ],
    progression: "Rotate torso away from front leg",
    regression: "Perform figure-4 stretch lying on back",
    video_url: "/videos/90_90_stretch.mp4",
    thumbnail: "/images/90_90_stretch.jpg"
  },
  {
    id: "balance_01",
    name: "Single Leg Balance",
    category: "balance",
    difficulty: "beginner",
    target_muscles: ["Ankle Stabilizers", "Hip Abductors", "Core"],
    contraindications: ["Severe balance deficits (fall risk)"],
    instructions: [
      "Stand near wall or counter for safety",
      "Lift one foot off ground",
      "Maintain balance without holding on",
      "Hold 30 seconds, repeat 3 times"
    ],
    progression: "Close eyes, stand on foam, add head turns",
    regression: "Hold finger on wall, reduce hold time",
    video_url: "/videos/single_leg_balance.mp4",
    thumbnail: "/images/single_leg_balance.jpg"
  },
  {
    id: "knee_flexion_01",
    name: "Heel Slides",
    category: "knee",
    difficulty: "beginner",
    target_muscles: ["Hamstrings", "Knee Flexors"],
    contraindications: [],
    instructions: [
      "Lie on back with leg straight",
      "Slowly bend knee, sliding heel toward buttock",
      "Return to starting position",
      "Keep heel in contact with surface"
    ],
    progression: "Add resistance band",
    regression: "Use towel under heel to reduce friction",
    video_url: "/videos/heel_slides.mp4",
    thumbnail: "/images/heel_slides.jpg"
  },
  {
    id: "rotator_cuff_01",
    name: "External Rotation with Band",
    category: "shoulder",
    difficulty: "beginner",
    target_muscles: ["Infraspinatus", "Teres Minor"],
    contraindications: ["Shoulder impingement (painful arc)"],
    instructions: [
      "Anchor band at elbow height",
      "Stand with elbow at side, bent 90°",
      "Rotate forearm outward against band",
      "Control return to start"
    ],
    progression: "Increase band resistance",
    regression: "Perform without band",
    video_url: "/videos/external_rotation.mp4",
    thumbnail: "/images/external_rotation.jpg"
  },
  {
    id: "plyometric_01",
    name: "Single Leg Drop Jump",
    category: "plyometric",
    difficulty: "advanced",
    target_muscles: ["Quadriceps", "Glutes", "Calves"],
    contraindications: ["Recent ACL reconstruction (<5 months)", "Patellar tendinopathy"],
    instructions: [
      "Stand on 6-12 inch box on one leg",
      "Drop off box, land on same leg",
      "Land softly with knee slightly bent",
      "Hold landing 2 seconds"
    ],
    progression: "Increase box height, add lateral movement",
    regression: "Two-leg landing, lower box",
    video_url: "/videos/drop_jump.mp4",
    thumbnail: "/images/drop_jump.jpg"
  }
  // Additional 40+ exercises would be here...
];

export default { MOCK_PATIENTS, EXERCISE_LIBRARY };
