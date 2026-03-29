-- PhysioMotion Database Schema
-- PostgreSQL 15+ compatible
-- HIPAA-compliant audit logging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLINICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    npi_number VARCHAR(10),
    tax_id VARCHAR(20),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USERS (Clinicians, Admins, Staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'clinician', -- admin, clinician, therapist, staff, patient
    title VARCHAR(50), -- PT, DPT, DC, MD, etc.
    credential VARCHAR(100),
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    npi_number VARCHAR(10),
    phone VARCHAR(20),
    specialty VARCHAR(50), -- physical_therapy, chiropractic, sports_medicine, orthopedics
    avatar_url VARCHAR(500),
    
    -- Account status
    account_status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, pending_verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clinic ON users(clinic_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- PATIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Physical
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_type VARCHAR(5),
    
    -- Insurance
    primary_insurance_provider VARCHAR(100),
    primary_insurance_policy_number VARCHAR(100),
    primary_insurance_group_number VARCHAR(100),
    secondary_insurance_provider VARCHAR(100),
    secondary_insurance_policy_number VARCHAR(100),
    
    -- Clinical
    referring_physician VARCHAR(255),
    primary_diagnosis_code VARCHAR(10), -- ICD-10
    primary_diagnosis_description TEXT,
    
    -- Status
    patient_status VARCHAR(20) DEFAULT 'active', -- active, inactive, discharged, pending
    
    -- Portal access
    portal_enabled BOOLEAN DEFAULT FALSE,
    portal_password_hash VARCHAR(255),
    portal_last_login TIMESTAMP WITH TIME ZONE,
    
    -- Notes (encrypted in application layer)
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_status ON patients(patient_status);

-- ============================================================================
-- MEDICAL HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Surgery
    surgery_type VARCHAR(50) CHECK (surgery_type IN ('pre_surgery', 'post_surgery', 'none', 'athletic_performance')),
    surgery_date DATE,
    surgery_description TEXT,
    surgeon_name VARCHAR(255),
    
    -- Conditions (JSON array)
    conditions JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    
    -- Pain
    current_pain_level INTEGER CHECK (current_pain_level >= 0 AND current_pain_level <= 10),
    pain_location JSONB DEFAULT '[]',
    pain_description TEXT,
    
    -- Previous treatments
    previous_pt_therapy TEXT,
    previous_chiropractic TEXT,
    previous_surgeries TEXT,
    
    -- Lifestyle
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    occupation VARCHAR(100),
    sports_activities JSONB DEFAULT '[]',
    
    -- Goals
    treatment_goals TEXT,
    expected_outcomes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    clinician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Assessment info
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('initial', 'progress', 'discharge', 'athletic_performance')),
    assessment_status VARCHAR(50) DEFAULT 'in_progress' CHECK (assessment_status IN ('in_progress', 'completed', 'cancelled')),
    
    -- Session info
    session_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Medicare 8-minute rule tracking
    billable_time_minutes INTEGER DEFAULT 0,
    eight_minute_rule_met BOOLEAN DEFAULT FALSE,
    
    -- Scores
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    mobility_score INTEGER CHECK (mobility_score >= 0 AND mobility_score <= 100),
    stability_score INTEGER CHECK (stability_score >= 0 AND stability_score <= 100),
    movement_pattern_score INTEGER CHECK (movement_pattern_score >= 0 AND movement_pattern_score <= 100),
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    
    -- SOAP Notes
    subjective_findings TEXT,
    objective_findings TEXT,
    assessment_summary TEXT,
    plan TEXT,
    
    -- Camera integration
    femto_mega_connected BOOLEAN DEFAULT FALSE,
    video_recorded BOOLEAN DEFAULT FALSE,
    video_url VARCHAR(500),
    
    -- Billing
    cpt_code VARCHAR(10),
    billing_status VARCHAR(50) DEFAULT 'pending' CHECK (billing_status IN ('pending', 'billable', 'billed', 'paid', 'denied')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_patient ON assessments(patient_id);
CREATE INDEX idx_assessments_clinician ON assessments(clinician_id);
CREATE INDEX idx_assessments_date ON assessments(session_date);

-- ============================================================================
-- MOVEMENT TESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS movement_tests (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    
    -- Test info
    test_name VARCHAR(100) NOT NULL,
    test_category VARCHAR(50) CHECK (test_category IN ('mobility', 'stability', 'strength', 'balance', 'functional')),
    test_order INTEGER NOT NULL,
    
    -- Instructions
    instructions TEXT NOT NULL,
    demo_video_url VARCHAR(500),
    
    -- Status
    test_status VARCHAR(50) DEFAULT 'pending' CHECK (test_status IN ('pending', 'in_progress', 'completed', 'skipped')),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Camera data
    camera_recording_url VARCHAR(500),
    skeleton_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movement_tests_assessment ON movement_tests(assessment_id);

-- ============================================================================
-- MOVEMENT ANALYSIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS movement_analysis (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES movement_tests(id) ON DELETE CASCADE,
    
    -- Joint angles
    joint_angles JSONB NOT NULL,
    
    -- ROM
    rom_measurements JSONB,
    
    -- Asymmetry
    left_right_asymmetry JSONB,
    
    -- Quality scores
    movement_quality_score INTEGER CHECK (movement_quality_score >= 0 AND movement_quality_score <= 100),
    stability_score INTEGER CHECK (stability_score >= 0 AND stability_score <= 100),
    compensation_detected BOOLEAN DEFAULT FALSE,
    
    -- Deficiencies
    deficiencies JSONB DEFAULT '[]',
    
    -- AI analysis
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_recommendations JSONB DEFAULT '[]',
    ai_analysis_text TEXT,
    
    -- Biomechanical data
    velocity_data JSONB,
    acceleration_data JSONB,
    trajectory_data JSONB,
    
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movement_analysis_test ON movement_analysis(test_id);

-- ============================================================================
-- EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    
    -- Basic info
    exercise_name VARCHAR(255) NOT NULL,
    exercise_category VARCHAR(50) NOT NULL CHECK (exercise_category IN ('strength', 'flexibility', 'balance', 'mobility', 'stability', 'cardio', 'functional', 'neuromuscular')),
    
    -- Body regions
    body_region VARCHAR(50), -- upper_body, lower_body, core, full_body, neck, back
    
    -- Targets
    target_muscles JSONB DEFAULT '[]',
    target_joints JSONB DEFAULT '[]',
    target_movements JSONB DEFAULT '[]',
    
    -- Difficulty
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Instructions
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    setup_instructions TEXT,
    cues TEXT,
    contraindications TEXT,
    
    -- Media
    demo_video_url VARCHAR(500),
    demo_image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- MediaPipe reference
    reference_keypoints JSONB,
    acceptable_deviation DECIMAL(5,2),
    
    -- Metadata
    equipment_needed JSONB DEFAULT '[]',
    estimated_duration_seconds INTEGER,
    sets_default INTEGER DEFAULT 3,
    reps_default INTEGER DEFAULT 10,
    hold_seconds_default INTEGER DEFAULT 30,
    
    -- Tags for search
    tags JSONB DEFAULT '[]',
    
    -- CPT codes
    cpt_codes JSONB DEFAULT '[]',
    
    -- System
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercises_category ON exercises(exercise_category);
CREATE INDEX idx_exercises_region ON exercises(body_region);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_exercises_active ON exercises(is_active);

-- ============================================================================
-- PRESCRIBED EXERCISES (Home Exercise Programs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescribed_exercises (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    prescribed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Prescription details
    sets INTEGER NOT NULL DEFAULT 3,
    repetitions INTEGER NOT NULL DEFAULT 10,
    hold_duration_seconds INTEGER,
    rest_between_sets_seconds INTEGER DEFAULT 60,
    
    -- Frequency
    times_per_week INTEGER NOT NULL DEFAULT 3,
    total_weeks INTEGER DEFAULT 4,
    
    -- Schedule
    start_date DATE,
    end_date DATE,
    
    -- Status
    prescription_status VARCHAR(50) DEFAULT 'active' CHECK (prescription_status IN ('active', 'completed', 'discontinued', 'modified')),
    
    -- Clinical reasoning
    clinical_reason TEXT,
    target_deficiency TEXT,
    
    -- Progress tracking
    compliance_percentage DECIMAL(5,2) DEFAULT 0,
    last_performed_at TIMESTAMP WITH TIME ZONE,
    total_sessions_completed INTEGER DEFAULT 0,
    
    -- Patient notes
    patient_notes TEXT,
    clinician_response TEXT,
    
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescribed_exercises_patient ON prescribed_exercises(patient_id);
CREATE INDEX idx_prescribed_exercises_status ON prescribed_exercises(prescription_status);

-- ============================================================================
-- EXERCISE SESSIONS (Patient completions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    prescribed_exercise_id INTEGER REFERENCES prescribed_exercises(id) ON DELETE SET NULL,
    
    -- Session info
    session_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    
    -- Performance
    sets_completed INTEGER DEFAULT 0,
    reps_completed INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    
    -- Quality
    form_quality_score INTEGER CHECK (form_quality_score >= 0 AND form_quality_score <= 100),
    pose_accuracy_data JSONB,
    
    -- Issues
    form_errors JSONB DEFAULT '[]',
    compensation_patterns JSONB DEFAULT '[]',
    
    -- Patient feedback
    pain_level_during INTEGER CHECK (pain_level_during >= 0 AND pain_level_during <= 10),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    patient_notes TEXT,
    
    -- Media
    recording_url VARCHAR(500),
    
    -- Billing
    billable BOOLEAN DEFAULT FALSE,
    cpt_code VARCHAR(10),
    
    analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercise_sessions_patient ON exercise_sessions(patient_id);
CREATE INDEX idx_exercise_sessions_date ON exercise_sessions(session_date);

-- ============================================================================
-- CPT CODES (Billing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cpt_codes (
    id SERIAL PRIMARY KEY,
    cpt_code VARCHAR(10) UNIQUE NOT NULL,
    code_description TEXT NOT NULL,
    code_category VARCHAR(50) NOT NULL CHECK (code_category IN ('evaluation', 'treatment', 'rpm', 'exercise', 'monitoring', 'manual_therapy', 'modalities')),
    
    -- Requirements
    minimum_duration_minutes INTEGER,
    requires_documentation BOOLEAN DEFAULT TRUE,
    requires_modifier VARCHAR(10),
    
    -- RPM specific
    is_rpm_code BOOLEAN DEFAULT FALSE,
    rpm_time_requirement_minutes INTEGER,
    
    -- Medicare
    medicare_allowed BOOLEAN DEFAULT TRUE,
    typical_reimbursement DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cpt_codes_category ON cpt_codes(code_category);
CREATE INDEX idx_cpt_codes_code ON cpt_codes(cpt_code);

-- ============================================================================
-- BILLABLE EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS billable_events (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    exercise_session_id INTEGER REFERENCES exercise_sessions(id) ON DELETE SET NULL,
    provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Billing info
    cpt_code_id INTEGER REFERENCES cpt_codes(id),
    cpt_code VARCHAR(10),
    service_date DATE NOT NULL,
    duration_minutes INTEGER,
    units DECIMAL(3,1) DEFAULT 1.0, -- For 8-minute rule
    
    -- Documentation
    clinical_note TEXT,
    medical_necessity TEXT,
    
    -- Status
    billing_status VARCHAR(50) DEFAULT 'pending' CHECK (billing_status IN ('pending', 'submitted', 'paid', 'denied', 'appealed')),
    
    -- Claim info
    claim_id VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    amount_billed DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billable_events_patient ON billable_events(patient_id);
CREATE INDEX idx_billable_events_status ON billable_events(billing_status);
CREATE INDEX idx_billable_events_date ON billable_events(service_date);

-- ============================================================================
-- VIDEOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Video info
    video_type VARCHAR(50) NOT NULL CHECK (video_type IN ('assessment', 'exercise_session', 'patient_upload', 'demo')),
    title VARCHAR(255),
    description TEXT,
    
    -- Storage
    storage_provider VARCHAR(50) DEFAULT 'r2', -- r2, s3, etc.
    storage_key VARCHAR(500) NOT NULL,
    storage_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- Metadata
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    resolution VARCHAR(20),
    
    -- Relations
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    exercise_session_id INTEGER REFERENCES exercise_sessions(id) ON DELETE SET NULL,
    
    -- Status
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_patient ON videos(patient_id);
CREATE INDEX idx_videos_type ON videos(video_type);

-- ============================================================================
-- MESSAGES (Patient-Therapist Communication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('clinician', 'patient', 'system')),
    
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Threading
    parent_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_patient ON messages(patient_id);
CREATE INDEX idx_messages_unread ON messages(patient_id, is_read);

-- ============================================================================
-- AUDIT LOGS (HIPAA Compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    
    -- Action info
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    http_method VARCHAR(10),
    http_path VARCHAR(500),
    http_status INTEGER,
    duration_ms INTEGER,
    
    -- Data (encrypted/sanitized)
    request_data JSONB,
    response_data JSONB,
    
    -- Status
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ANALYTICS DASHBOARD CACHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_analytics_clinic ON analytics_cache(clinic_id);
CREATE INDEX idx_analytics_metric ON analytics_cache(metric_name);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescribed_exercises_updated_at BEFORE UPDATE ON prescribed_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8-minute rule calculation function
CREATE OR REPLACE FUNCTION calculate_eight_minute_rule(minutes INTEGER)
RETURNS DECIMAL(3,1) AS $$
BEGIN
    -- Medicare 8-minute rule: 8-22 min = 1 unit, 23-37 min = 2 units, etc.
    IF minutes < 8 THEN
        RETURN 0;
    ELSIF minutes >= 8 AND minutes <= 22 THEN
        RETURN 1;
    ELSIF minutes >= 23 AND minutes <= 37 THEN
        RETURN 2;
    ELSIF minutes >= 38 AND minutes <= 52 THEN
        RETURN 3;
    ELSIF minutes >= 53 AND minutes <= 67 THEN
        RETURN 4;
    ELSE
        RETURN CEIL((minutes - 7)::DECIMAL / 15);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Compliance percentage update function
CREATE OR REPLACE FUNCTION update_compliance_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_sessions INTEGER;
    expected_sessions INTEGER;
BEGIN
    -- Calculate expected sessions based on prescription
    SELECT 
        (pe.times_per_week * pe.total_weeks) INTO expected_sessions
    FROM prescribed_exercises pe 
    WHERE pe.id = NEW.prescribed_exercise_id;
    
    -- Count completed sessions
    SELECT COUNT(*) INTO total_sessions
    FROM exercise_sessions es
    WHERE es.prescribed_exercise_id = NEW.prescribed_exercise_id
    AND es.completed = TRUE;
    
    -- Update compliance percentage
    UPDATE prescribed_exercises 
    SET compliance_percentage = LEAST(100, (total_sessions::DECIMAL / NULLIF(expected_sessions, 0) * 100)),
        total_sessions_completed = total_sessions,
        last_performed_at = NEW.session_date
    WHERE id = NEW.prescribed_exercise_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compliance_after_session
    AFTER INSERT ON exercise_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_percentage();
