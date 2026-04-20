// ============================================================================
// Multi-Agent Brain Orchestrator v2.0
// Body-Region Specialist Swarm for Medical-Grade MSK Assessment
// Coordinates specialist agents for PhysioMotion & DealFlow
// ============================================================================

// Body regions that agents can specialize in
type BodyRegion =
  | 'cervical_spine'
  | 'thoracic_lumbar'
  | 'upper_extremity_left'
  | 'upper_extremity_right'
  | 'lower_extremity_left'
  | 'lower_extremity_right'
  | 'full_body'
  | 'none';

// Movement tests and which body regions they activate
const MOVEMENT_REGION_MAP: Record<string, BodyRegion[]> = {
  'deep_squat':        ['thoracic_lumbar', 'lower_extremity_left', 'lower_extremity_right'],
  'overhead_squat':    ['cervical_spine', 'thoracic_lumbar', 'upper_extremity_left', 'upper_extremity_right', 'lower_extremity_left', 'lower_extremity_right'],
  'hurdle_step':       ['thoracic_lumbar', 'lower_extremity_left', 'lower_extremity_right'],
  'inline_lunge':      ['thoracic_lumbar', 'lower_extremity_left', 'lower_extremity_right'],
  'shoulder_mobility': ['cervical_spine', 'upper_extremity_left', 'upper_extremity_right'],
  'active_slr':        ['thoracic_lumbar', 'lower_extremity_left', 'lower_extremity_right'],
  'trunk_pushup':      ['cervical_spine', 'thoracic_lumbar', 'upper_extremity_left', 'upper_extremity_right'],
  'rotary_stability':  ['cervical_spine', 'thoracic_lumbar', 'upper_extremity_left', 'upper_extremity_right', 'lower_extremity_left', 'lower_extremity_right'],
  'gait_analysis':     ['full_body'],
  'single_leg_stance': ['thoracic_lumbar', 'lower_extremity_left', 'lower_extremity_right'],
};

// Normative ROM tables per body region (degrees)
const NORMATIVE_ROM: Record<string, Record<string, [number, number]>> = {
  'cervical_spine': {
    'cervical_flexion': [0, 50], 'cervical_extension': [0, 60],
    'cervical_lateral_flexion': [0, 45], 'cervical_rotation': [0, 80]
  },
  'thoracic_lumbar': {
    'trunk_flexion': [0, 80], 'trunk_extension': [0, 25],
    'trunk_lateral_flexion': [0, 35], 'trunk_rotation': [0, 45],
    'lumbar_lordosis': [20, 45]
  },
  'upper_extremity_left': {
    'shoulder_flexion': [0, 180], 'shoulder_abduction': [0, 180],
    'shoulder_internal_rotation': [0, 70], 'shoulder_external_rotation': [0, 90],
    'elbow_flexion': [0, 150], 'wrist_flexion': [0, 80], 'wrist_extension': [0, 70]
  },
  'upper_extremity_right': {
    'shoulder_flexion': [0, 180], 'shoulder_abduction': [0, 180],
    'shoulder_internal_rotation': [0, 70], 'shoulder_external_rotation': [0, 90],
    'elbow_flexion': [0, 150], 'wrist_flexion': [0, 80], 'wrist_extension': [0, 70]
  },
  'lower_extremity_left': {
    'hip_flexion': [0, 120], 'hip_extension': [0, 30], 'hip_abduction': [0, 45],
    'hip_internal_rotation': [0, 40], 'hip_external_rotation': [0, 45],
    'knee_flexion': [0, 135], 'ankle_dorsiflexion': [0, 20], 'ankle_plantarflexion': [0, 50]
  },
  'lower_extremity_right': {
    'hip_flexion': [0, 120], 'hip_extension': [0, 30], 'hip_abduction': [0, 45],
    'hip_internal_rotation': [0, 40], 'hip_external_rotation': [0, 45],
    'knee_flexion': [0, 135], 'ankle_dorsiflexion': [0, 20], 'ankle_plantarflexion': [0, 50]
  }
};

interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  confidenceThreshold: number;
  priority: number;
  enabled: boolean;
  bodyRegion: BodyRegion;            // NEW: Which body area this agent owns
  normativeROM?: Record<string, [number, number]>;  // NEW: Agent-specific norms
  landmarkKeys?: string[];           // NEW: MediaPipe landmarks this agent reads
}

interface AgentMessage {
  from: string;
  to: string | 'broadcast';
  type: 'task' | 'response' | 'query' | 'debate' | 'consensus';
  payload: any;
  timestamp: number;
  correlationId: string;
  confidence?: number;
}

interface TaskResult {
  agentId: string;
  agentName: string;
  result: any;
  confidence: number;
  reasoning: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

interface ConsensusResult {
  agreed: boolean;
  consensusConfidence: number;
  results: TaskResult[];
  finalAnswer: any;
  dissentingAgents?: string[];
  debateRounds: number;
}

// ============================================================================
// Agent Registry — Body-Region Specialist Swarm
// ============================================================================

const AGENT_REGISTRY: Record<string, Agent> = {

  // ── PhysioMotion: Extremity & Region Specialists ──────────────────────────

  'cervical-spine': {
    id: 'cervical-spine',
    name: 'Cervical Spine Agent',
    role: 'Head/neck posture, cervical ROM, forward head posture detection, upper trapezius tension',
    capabilities: ['cervical_rom', 'head_posture', 'neck_compensation', 'upper_trap_tension'],
    confidenceThreshold: 0.88,
    priority: 1,
    enabled: true,
    bodyRegion: 'cervical_spine',
    normativeROM: NORMATIVE_ROM['cervical_spine'],
    landmarkKeys: ['nose', 'left_ear', 'right_ear', 'left_eye', 'right_eye', 'left_shoulder', 'right_shoulder']
  },

  'thoracic-lumbar': {
    id: 'thoracic-lumbar',
    name: 'Thoracic/Lumbar Spine Agent',
    role: 'Trunk flexion/extension, lateral bending, rotation, core stability assessment, pelvic tilt',
    capabilities: ['trunk_rom', 'core_stability', 'pelvic_tilt', 'spinal_alignment', 'trunk_compensation'],
    confidenceThreshold: 0.85,
    priority: 1,
    enabled: true,
    bodyRegion: 'thoracic_lumbar',
    normativeROM: NORMATIVE_ROM['thoracic_lumbar'],
    landmarkKeys: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']
  },

  'upper-extremity-left': {
    id: 'upper-extremity-left',
    name: 'Left Upper Extremity Agent',
    role: 'Left shoulder ROM, elbow flexion/extension, wrist mobility, overhead reach',
    capabilities: ['shoulder_rom', 'elbow_rom', 'wrist_rom', 'overhead_reach', 'upper_symmetry'],
    confidenceThreshold: 0.86,
    priority: 2,
    enabled: true,
    bodyRegion: 'upper_extremity_left',
    normativeROM: NORMATIVE_ROM['upper_extremity_left'],
    landmarkKeys: ['left_shoulder', 'left_elbow', 'left_wrist', 'left_pinky', 'left_index', 'left_thumb']
  },

  'upper-extremity-right': {
    id: 'upper-extremity-right',
    name: 'Right Upper Extremity Agent',
    role: 'Right shoulder ROM, elbow flexion/extension, wrist mobility, overhead reach',
    capabilities: ['shoulder_rom', 'elbow_rom', 'wrist_rom', 'overhead_reach', 'upper_symmetry'],
    confidenceThreshold: 0.86,
    priority: 2,
    enabled: true,
    bodyRegion: 'upper_extremity_right',
    normativeROM: NORMATIVE_ROM['upper_extremity_right'],
    landmarkKeys: ['right_shoulder', 'right_elbow', 'right_wrist', 'right_pinky', 'right_index', 'right_thumb']
  },

  'lower-extremity-left': {
    id: 'lower-extremity-left',
    name: 'Left Lower Extremity Agent',
    role: 'Left hip ROM, knee flexion/valgus, ankle dorsiflexion, heel lift, weight bearing',
    capabilities: ['hip_rom', 'knee_rom', 'ankle_rom', 'valgus_detection', 'heel_lift', 'lower_symmetry'],
    confidenceThreshold: 0.87,
    priority: 1,
    enabled: true,
    bodyRegion: 'lower_extremity_left',
    normativeROM: NORMATIVE_ROM['lower_extremity_left'],
    landmarkKeys: ['left_hip', 'left_knee', 'left_ankle', 'left_heel', 'left_foot_index']
  },

  'lower-extremity-right': {
    id: 'lower-extremity-right',
    name: 'Right Lower Extremity Agent',
    role: 'Right hip ROM, knee flexion/valgus, ankle dorsiflexion, heel lift, weight bearing',
    capabilities: ['hip_rom', 'knee_rom', 'ankle_rom', 'valgus_detection', 'heel_lift', 'lower_symmetry'],
    confidenceThreshold: 0.87,
    priority: 1,
    enabled: true,
    bodyRegion: 'lower_extremity_right',
    normativeROM: NORMATIVE_ROM['lower_extremity_right'],
    landmarkKeys: ['right_hip', 'right_knee', 'right_ankle', 'right_heel', 'right_foot_index']
  },

  // ── Cross-Cutting PhysioMotion Agents (kept from v1) ──────────────────────

  'balance': {
    id: 'balance',
    name: 'Balance & Stability Agent',
    role: 'Center of pressure, sway ellipse, weight distribution, single-leg stability',
    capabilities: ['posture_analysis', 'sway_detection', 'weight_distribution', 'stability_score'],
    confidenceThreshold: 0.80,
    priority: 3,
    enabled: true,
    bodyRegion: 'full_body'
  },

  'predictor': {
    id: 'predictor',
    name: 'Risk Predictor Agent',
    role: 'Re-injury risk forecasting, progression prediction, recovery timeline',
    capabilities: ['risk_forecast', 'injury_prediction', 'progression_analysis', 'outcome_prediction'],
    confidenceThreshold: 0.75,
    priority: 4,
    enabled: true,
    bodyRegion: 'full_body'
  },

  'comparative': {
    id: 'comparative',
    name: 'Comparative Analysis Agent',
    role: 'Normative comparison, bilateral symmetry scoring, longitudinal trend analysis',
    capabilities: ['norm_comparison', 'history_analysis', 'trend_detection', 'benchmarking', 'symmetry_check'],
    confidenceThreshold: 0.80,
    priority: 5,
    enabled: true,
    bodyRegion: 'full_body'
  },

  'exercise-rx': {
    id: 'exercise-rx',
    name: 'Exercise Prescription Agent',
    role: 'PT protocol generation, exercise selection, progression planning',
    capabilities: ['exercise_selection', 'protocol_generation', 'progression_planning', 'contraindication_check'],
    confidenceThreshold: 0.85,
    priority: 6,
    enabled: true,
    bodyRegion: 'full_body'
  },

  // ── DealFlow Agents ────────────────────────────────────────────────────────

  'legal-research': {
    id: 'legal-research',
    name: 'Legal Research Agent',
    role: 'Case law search, statute analysis, precedent finding',
    capabilities: ['case_law_search', 'statute_analysis', 'precedent_matching', 'circuit_split_detection'],
    confidenceThreshold: 0.90,
    priority: 1,
    enabled: true,
    bodyRegion: 'none'
  },
  'document-parser': {
    id: 'document-parser',
    name: 'Document Parser Agent',
    role: 'Contract analysis, key term extraction, clause identification',
    capabilities: ['contract_analysis', 'term_extraction', 'clause_identification', 'risk_flagging'],
    confidenceThreshold: 0.88,
    priority: 2,
    enabled: true,
    bodyRegion: 'none'
  },
  'strategy': {
    id: 'strategy',
    name: 'Case Strategy Agent',
    role: 'Case theory building, claim recommendation, defense analysis',
    capabilities: ['case_theory', 'claim_recommendation', 'defense_analysis', 'settlement_advice'],
    confidenceThreshold: 0.85,
    priority: 3,
    enabled: true,
    bodyRegion: 'none'
  },
  'outcome-predictor': {
    id: 'outcome-predictor',
    name: 'Outcome Predictor Agent',
    role: 'Win probability, settlement range, litigation analytics',
    capabilities: ['win_probability', 'settlement_range', 'litigation_analytics', 'judge_history'],
    confidenceThreshold: 0.75,
    priority: 4,
    enabled: true,
    bodyRegion: 'none'
  },

  // ── Shared Agents ──────────────────────────────────────────────────────────

  'research': {
    id: 'research',
    name: 'Research Agent',
    role: 'Live web search, literature retrieval, RAG updates',
    capabilities: ['web_search', 'literature_retrieval', 'rag_update', 'fact_check'],
    confidenceThreshold: 0.85,
    priority: 1,
    enabled: true,
    bodyRegion: 'none'
  },
  'critic': {
    id: 'critic',
    name: 'Critic Agent',
    role: 'QA validation, cross-agent conflict resolution, confidence calibration',
    capabilities: ['qa_validation', 'consistency_check', 'error_detection', 'confidence_scoring', 'conflict_resolution'],
    confidenceThreshold: 0.90,
    priority: 10,
    enabled: true,
    bodyRegion: 'none'
  },
  'memory': {
    id: 'memory',
    name: 'Memory Agent',
    role: 'Long-term context, patient history, pattern recall, encrypted embedding retrieval',
    capabilities: ['context_retrieval', 'history_recall', 'pattern_recognition', 'preference_memory', 'encrypted_search'],
    confidenceThreshold: 0.95,
    priority: 0,
    enabled: true,
    bodyRegion: 'none'
  }
};

// ============================================================================
// Brain Orchestrator Class
// ============================================================================

class BrainOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private taskHistory: Map<string, any> = new Map();
  private consensusThreshold: number = 0.80;
  private maxDebateRounds: number = 3;
  
  constructor() {
    this.loadAgents();
  }
  
  private loadAgents() {
    Object.values(AGENT_REGISTRY).forEach(agent => {
      this.agents.set(agent.id, agent);
    });
    console.log(`🧠 Brain loaded ${this.agents.size} agents`);
  }
  
  // Get agents by capability
  findAgentsByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values())
      .filter(a => a.enabled && a.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority);
  }
  
  // Get agents by app context
  getAgentsForApp(app: 'physiomotion' | 'dealflow'): Agent[] {
    const appPrefixes: Record<string, string[]> = {
      'physiomotion': [
        'cervical-spine', 'thoracic-lumbar',
        'upper-extremity-left', 'upper-extremity-right',
        'lower-extremity-left', 'lower-extremity-right',
        'balance', 'predictor', 'comparative', 'exercise-rx'
      ],
      'dealflow': ['legal-research', 'document-parser', 'strategy', 'outcome-predictor']
    };
    
    const shared = ['research', 'critic', 'memory'];
    const specific = appPrefixes[app] || [];
    
    return [...specific, ...shared]
      .map(id => this.agents.get(id))
      .filter((a): a is Agent => a !== undefined && a.enabled);
  }

  // NEW: Get agents relevant to a specific movement test
  getAgentsForMovement(movementTest: string): Agent[] {
    const regions = MOVEMENT_REGION_MAP[movementTest];
    if (!regions) return this.getAgentsForApp('physiomotion');

    // 'full_body' means activate all region agents
    if (regions.includes('full_body')) {
      return Array.from(this.agents.values())
        .filter(a => a.enabled && a.bodyRegion !== 'none');
    }

    // Activate only the region-specific agents + cross-cutting agents
    return Array.from(this.agents.values())
      .filter(a => a.enabled && (
        regions.includes(a.bodyRegion as BodyRegion) ||
        a.bodyRegion === 'full_body' ||
        ['critic', 'memory'].includes(a.id)
      ))
      .sort((a, b) => a.priority - b.priority);
  }
  
  // ============================================================================
  // Main Task Execution
  // ============================================================================
  
  async executeTask(task: {
    app: 'physiomotion' | 'dealflow';
    type: string;
    input: any;
    requiredConfidence?: number;
    enableDebate?: boolean;
  }): Promise<ConsensusResult> {
    const startTime = Date.now();
    const correlationId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n🎯 Brain executing task: ${task.type}`);
    console.log(`   App: ${task.app}`);
    console.log(`   Correlation: ${correlationId}`);
    
    // 1. Retrieve context from Memory Agent
    const context = await this.queryMemoryAgent(task);
    
    // 2. Select relevant agents
    const agents = this.selectAgentsForTask(task);
    console.log(`   Selected ${agents.length} agents: ${agents.map(a => a.name).join(', ')}`);
    
    // 3. Dispatch tasks to agents (parallel)
    const results = await Promise.all(
      agents.map(agent => this.dispatchToAgent(agent, task, context, correlationId))
    );
    
    // 4. Critic Agent validates results
    const validatedResults = await this.criticValidation(results);
    
    // 5. Build consensus
    let consensus = this.buildConsensus(validatedResults);
    
    // 6. Debate if enabled and consensus not reached
    if (task.enableDebate && !consensus.agreed && consensus.debateRounds < this.maxDebateRounds) {
      consensus = await this.runDebate(consensus, task, correlationId);
    }
    
    // 7. Store in memory
    await this.storeInMemory(task, consensus);
    
    console.log(`\n✅ Task complete in ${Date.now() - startTime}ms`);
    console.log(`   Consensus: ${(consensus.consensusConfidence * 100).toFixed(1)}% confidence`);
    console.log(`   Debate rounds: ${consensus.debateRounds}`);
    
    return consensus;
  }
  
  // ============================================================================
  // Agent Selection & Dispatch
  // ============================================================================
  
  private selectAgentsForTask(task: { app: string; type: string; input?: any }): Agent[] {
    // If the task specifies a movement test, use body-region routing
    const movementTest = task.input?.assessmentType || task.input?.movementTest;
    if (task.app === 'physiomotion' && movementTest && MOVEMENT_REGION_MAP[movementTest]) {
      console.log(`   🗺️  Body-region routing for: ${movementTest}`);
      const regionAgents = this.getAgentsForMovement(movementTest);
      console.log(`   📍 Activated regions: ${regionAgents.map(a => a.bodyRegion).filter((v, i, s) => s.indexOf(v) === i).join(', ')}`);
      return regionAgents.slice(0, 8); // Allow up to 8 specialist agents
    }

    // Fallback: capability-based routing
    const capabilityMap: Record<string, string[]> = {
      // PhysioMotion tasks
      'pose_analysis': ['cervical_rom', 'trunk_rom', 'hip_rom', 'knee_rom', 'ankle_rom', 'posture_analysis'],
      'movement_assessment': ['hip_rom', 'knee_rom', 'ankle_rom', 'trunk_rom', 'valgus_detection', 'core_stability'],
      'risk_assessment': ['risk_forecast', 'norm_comparison', 'hip_rom', 'knee_rom'],
      'exercise_prescription': ['exercise_selection', 'hip_rom', 'knee_rom', 'risk_forecast'],
      'progress_review': ['norm_comparison', 'trend_detection', 'exercise_selection'],
      
      // DealFlow tasks
      'document_review': ['contract_analysis', 'case_law_search', 'case_theory'],
      'case_analysis': ['case_theory', 'case_law_search', 'win_probability'],
      'legal_research': ['case_law_search', 'web_search'],
      'litigation_strategy': ['case_theory', 'win_probability', 'case_law_search'],
      'settlement_advice': ['win_probability', 'case_theory'],
      
      // Shared tasks
      'fact_check': ['web_search', 'qa_validation'],
      'general_query': ['web_search', 'context_retrieval']
    };
    
    const capabilities = capabilityMap[task.type] || ['web_search'];
    const selected = new Set<Agent>();
    
    capabilities.forEach(cap => {
      this.findAgentsByCapability(cap).forEach(agent => {
        if (task.app === 'physiomotion' && agent.bodyRegion === 'none' &&
            !['research', 'critic', 'memory'].includes(agent.id)) {
          return; // Skip non-physio agents
        }
        if (task.app === 'dealflow' && agent.bodyRegion !== 'none' &&
            !['research', 'critic', 'memory'].includes(agent.id)) {
          return; // Skip physio agents for legal
        }
        selected.add(agent);
      });
    });
    
    return Array.from(selected).slice(0, 8); // Max 8 agents (scaled for region swarm)
  }
  
  private async dispatchToAgent(
    agent: Agent,
    task: any,
    context: any,
    correlationId: string
  ): Promise<TaskResult> {
    const startTime = Date.now();
    
    console.log(`   🤖 ${agent.name} processing...`);
    
    // Simulate agent processing (replace with actual LLM calls)
    const result = await this.simulateAgentProcessing(agent, task, context);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      result: result.data,
      confidence: result.confidence,
      reasoning: result.reasoning,
      executionTime: Date.now() - startTime,
      metadata: { correlationId, capabilities: agent.capabilities }
    };
  }
  
  // ============================================================================
  // Consensus & Debate
  // ============================================================================
  
  private buildConsensus(results: TaskResult[]): ConsensusResult {
    if (results.length === 0) {
      return {
        agreed: false,
        consensusConfidence: 0,
        results: [],
        finalAnswer: null,
        debateRounds: 0
      };
    }
    
    if (results.length === 1) {
      return {
        agreed: true,
        consensusConfidence: results[0].confidence,
        results,
        finalAnswer: results[0].result,
        debateRounds: 0
      };
    }
    
    // Calculate weighted consensus
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;
    
    // Check if results agree (simplified - would need semantic comparison)
    const agreed = avgConfidence >= this.consensusThreshold;
    
    // Weighted voting for final answer
    const weightedResults = results.map(r => ({
      ...r,
      weight: r.confidence / totalConfidence
    }));
    
    // Select highest confidence result as final
    const bestResult = weightedResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    // Identify dissenting agents
    const dissentingAgents = results
      .filter(r => r.confidence < this.consensusThreshold)
      .map(r => r.agentName);
    
    return {
      agreed,
      consensusConfidence: avgConfidence,
      results,
      finalAnswer: bestResult.result,
      dissentingAgents: dissentingAgents.length > 0 ? dissentingAgents : undefined,
      debateRounds: 0
    };
  }
  
  private async runDebate(
    consensus: ConsensusResult,
    task: any,
    correlationId: string
  ): Promise<ConsensusResult> {
    console.log(`   💬 Starting debate (round ${consensus.debateRounds + 1})...`);
    
    // Get dissenting agents to refine their analysis
    const dissenters = consensus.results.filter(r => 
      consensus.dissentingAgents?.includes(r.agentName)
    );
    
    // Re-run dissenting agents with additional context
    const refinedResults = await Promise.all(
      dissenters.map(async (result) => {
        const agent = this.agents.get(result.agentId);
        if (!agent) return result;
        
        // Add majority opinion as context for re-analysis
        const majorityOpinion = consensus.finalAnswer;
        return this.dispatchToAgent(agent, {
          ...task,
          debateContext: { majorityOpinion, round: consensus.debateRounds + 1 }
        }, {}, correlationId);
      })
    );
    
    // Merge refined results with original agreeing results
    const agreeingResults = consensus.results.filter(r => 
      !consensus.dissentingAgents?.includes(r.agentName)
    );
    
    const newResults = [...agreeingResults, ...refinedResults];
    const newConsensus = this.buildConsensus(newResults);
    
    return {
      ...newConsensus,
      debateRounds: consensus.debateRounds + 1
    };
  }
  
  // ============================================================================
  // Supporting Agents
  // ============================================================================
  
  private async queryMemoryAgent(task: any): Promise<any> {
    // In production: Query vector DB for relevant context
    return {
      patientHistory: null, // Would fetch from DB
      similarCases: [],
      preferences: {},
      lastAssessment: null
    };
  }
  
  private async criticValidation(results: TaskResult[]): Promise<TaskResult[]> {
    console.log(`   🔍 Critic Agent validating ${results.length} results...`);
    
    // In production: Critic Agent checks for:
    // - Logical inconsistencies
    // - Confidence calibration
    // - Safety concerns
    // - Factual accuracy
    
    return results.map(r => {
      // Simulate critic review
      const isCalibrated = r.confidence >= 0.5 && r.confidence <= 1.0;
      const hasReasoning = r.reasoning && r.reasoning.length > 20;
      
      if (!isCalibrated || !hasReasoning) {
        return {
          ...r,
          confidence: r.confidence * 0.9, // Penalize poor quality
          metadata: { 
            ...r.metadata, 
            criticNote: !isCalibrated ? 'confidence_miscalibrated' : 'reasoning_insufficient'
          }
        };
      }
      
      return r;
    });
  }
  
  private async storeInMemory(task: any, consensus: ConsensusResult): Promise<void> {
    // In production: Store in vector DB for future retrieval
    this.taskHistory.set(task.type, {
      task,
      consensus,
      timestamp: Date.now()
    });
  }
  
  // ============================================================================
  // Agent Simulation (Replace with actual LLM calls)
  // ============================================================================
  
  private async simulateAgentProcessing(
    agent: Agent,
    task: any,
    context: any
  ): Promise<{ data: any; confidence: number; reasoning: string }> {
    // In production: Call Gemini/Gemma API with agent-specific prompts
    // Each body-region agent returns ROM findings scoped to its landmarks
    
    const regionResponses: Record<string, Record<string, any>> = {
      // ── Body Region Specialists ──
      'cervical-spine': {
        data: {
          region: 'cervical_spine',
          cervical_flexion: 42, cervical_extension: 55,
          cervical_lateral_flexion_L: 40, cervical_lateral_flexion_R: 38,
          forward_head_posture_offset_cm: 3.2,
          compensations: ['slight forward head posture'],
          rom_status: { cervical_flexion: 'normal', cervical_extension: 'normal' }
        },
        reasoning: 'Analyzed ear-shoulder-nose triangle for cervical alignment. Forward head posture measured at 3.2cm anterior to plumb line.'
      },
      'thoracic-lumbar': {
        data: {
          region: 'thoracic_lumbar',
          trunk_flexion: 72, trunk_extension: 20,
          trunk_lateral_flexion_L: 30, trunk_lateral_flexion_R: 28,
          pelvic_tilt_degrees: 12, lumbar_lordosis: 35,
          core_stability_score: 68,
          compensations: ['excessive forward trunk lean', 'mild anterior pelvic tilt'],
          rom_status: { trunk_flexion: 'normal', trunk_extension: 'limited' }
        },
        reasoning: 'Measured shoulder-hip-knee angles for trunk lean. Pelvic tilt derived from ASIS-PSIS angle estimation via hip landmarks.'
      },
      'upper-extremity-left': {
        data: {
          region: 'upper_extremity_left', side: 'left',
          shoulder_flexion: 165, shoulder_abduction: 170,
          elbow_flexion: 140, wrist_extension: 65,
          compensations: [],
          rom_status: { shoulder_flexion: 'normal', elbow_flexion: 'normal' }
        },
        reasoning: 'Left upper extremity ROM within normal limits. No compensatory patterns detected.'
      },
      'upper-extremity-right': {
        data: {
          region: 'upper_extremity_right', side: 'right',
          shoulder_flexion: 158, shoulder_abduction: 162,
          elbow_flexion: 138, wrist_extension: 62,
          compensations: ['mild shoulder hiking on overhead reach'],
          rom_status: { shoulder_flexion: 'normal', elbow_flexion: 'normal' }
        },
        reasoning: 'Right shoulder flexion 7° less than left. Upper trapezius compensation noted during overhead movement.'
      },
      'lower-extremity-left': {
        data: {
          region: 'lower_extremity_left', side: 'left',
          hip_flexion: 95, hip_abduction: 38,
          knee_flexion: 118, knee_valgus_degrees: 4.1,
          ankle_dorsiflexion: 14, heel_lift: false,
          compensations: ['mild knee valgus'],
          rom_status: { hip_flexion: 'normal', knee_flexion: 'limited', ankle_dorsiflexion: 'limited' }
        },
        reasoning: 'Left knee valgus 4.1° detected via knee-ankle-hip alignment. Ankle dorsiflexion below 20° norm.'
      },
      'lower-extremity-right': {
        data: {
          region: 'lower_extremity_right', side: 'right',
          hip_flexion: 92, hip_abduction: 35,
          knee_flexion: 115, knee_valgus_degrees: 8.2,
          ankle_dorsiflexion: 12, heel_lift: true,
          compensations: ['significant knee valgus', 'heel lifting during squat'],
          rom_status: { hip_flexion: 'limited', knee_flexion: 'limited', ankle_dorsiflexion: 'limited' }
        },
        reasoning: 'Right knee valgus 8.2° — clinically significant. Heel lift confirms ankle dorsiflexion deficit. Hip flexion 3° below left side → bilateral asymmetry.'
      },

      // ── Cross-Cutting Agents ──
      'balance': {
        data: { swayArea: 125, centerOfPressure: { x: 0.02, y: -0.05 }, stabilityScore: 72 },
        reasoning: 'Calculated sway ellipse from 30-second quiet stance. Mild posterior-lateral shift detected.'
      },
      'predictor': {
        data: { reInjuryRisk: 0.68, timeline: '6 months', factors: ['right_knee_valgus', 'bilateral_ankle_deficit', 'core_instability'] },
        reasoning: 'Risk model using regional agent findings: right knee valgus (8.2°) + bilateral ankle dorsiflexion deficit dominates risk score.'
      },
      'comparative': {
        data: { bilateralAsymmetries: { knee_valgus: 4.1, hip_flexion: 3, ankle_dorsiflexion: 2 }, trendDirection: 'improving', sessionsAnalyzed: 5 },
        reasoning: 'Compared current session against 5 prior assessments. Right-side deficits improving but still clinically significant.'
      },

      // ── DealFlow Agents ──
      'legal-research': {
        data: { precedents: 3, relevantStatutes: ['INA § 245(a)'], circuitSplit: false },
        reasoning: 'Searched Westlaw + PACER for similar adjustment of status cases'
      },
      'document-parser': {
        data: { keyTerms: ['priority date', 'adjustment of status'], risks: ['employment gap'] },
        reasoning: 'Parsed I-485 and I-140 for critical terms and inconsistencies'
      },
      'critic': {
        data: { validation: 'passed', concerns: [], conflictsResolved: 0 },
        reasoning: 'Cross-checked regional agent findings. No inter-agent conflicts detected.'
      }
    };
    
    const defaultResponse = {
      data: { status: 'processed', agent: agent.id, region: agent.bodyRegion },
      reasoning: `Executed ${agent.role.toLowerCase()}`
    };
    
    const response = regionResponses[agent.id] || defaultResponse;
    
    // Add slight randomness to confidence for realism
    const baseConfidence = agent.confidenceThreshold;
    const variance = (Math.random() - 0.5) * 0.1;
    
    return {
      data: response.data,
      confidence: Math.min(1, Math.max(0, baseConfidence + variance)),
      reasoning: response.reasoning
    };
  }
  
  // ============================================================================
  // Public API
  // ============================================================================
  
  getAgentStatus(): { id: string; name: string; enabled: boolean; capabilities: string[] }[] {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      enabled: a.enabled,
      capabilities: a.capabilities
    }));
  }
  
  enableAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.enabled = true;
      console.log(`✅ Enabled ${agent.name}`);
    }
  }
  
  disableAgent(agentId: string): void {
    const agent = agentId === 'brain' ? null : this.agents.get(agentId);
    if (agent) {
      agent.enabled = false;
      console.log(`⏸️  Disabled ${agent.name}`);
    }
  }
  
  getTaskHistory(): any[] {
    return Array.from(this.taskHistory.entries()).map(([type, data]) => ({
      type,
      ...data
    }));
  }
}

// ============================================================================
// Export & Singleton
// ============================================================================

export const Brain = new BrainOrchestrator();

// Export types and constants for other modules
export { MOVEMENT_REGION_MAP, NORMATIVE_ROM };
export type { BodyRegion, Agent, TaskResult, ConsensusResult };

// Example usage (for testing)
export async function demoBrain() {
  console.log('\n' + '='.repeat(70));
  console.log('🧠 MULTI-AGENT BRAIN ORCHESTRATOR v2.0 — BODY REGION SWARM');
  console.log('='.repeat(70));
  
  // Demo 1: Deep Squat — activates thoracic-lumbar + both lower-extremity agents
  console.log('\n📊 DEMO 1: Deep Squat Assessment (Region-Routed)');
  const squat = await Brain.executeTask({
    app: 'physiomotion',
    type: 'movement_assessment',
    input: {
      patientId: 'patient-123',
      assessmentType: 'deep_squat',
      landmarks: [],
      videoDuration: 45
    },
    requiredConfidence: 0.80,
    enableDebate: true
  });
  
  console.log('\n   Squat Results:');
  console.log(`   - Consensus: ${(squat.consensusConfidence * 100).toFixed(1)}%`);
  console.log(`   - Agents activated: ${squat.results.length}`);
  console.log(`   - Regions analyzed: ${squat.results.map(r => r.result?.region || r.agentId).join(', ')}`);
  console.log(`   - Right knee valgus: ${squat.results.find(r => r.agentId === 'lower-extremity-right')?.result?.knee_valgus_degrees}°`);
  console.log(`   - Core stability: ${squat.results.find(r => r.agentId === 'thoracic-lumbar')?.result?.core_stability_score}/100`);
  
  // Demo 2: Overhead Squat — activates ALL 6 region agents
  console.log('\n📊 DEMO 2: Overhead Squat (Full Body — 6 Region Agents)');
  const overhead = await Brain.executeTask({
    app: 'physiomotion',
    type: 'movement_assessment',
    input: {
      patientId: 'patient-123',
      assessmentType: 'overhead_squat',
      landmarks: [],
      videoDuration: 60
    },
    requiredConfidence: 0.80,
    enableDebate: false
  });
  
  console.log(`   - Agents activated: ${overhead.results.length}`);
  console.log(`   - All regions: ${overhead.results.map(r => r.result?.region || r.agentId).join(', ')}`);
  
  // Demo 3: Shoulder Mobility — activates cervical-spine + both upper-extremity agents
  console.log('\n📊 DEMO 3: Shoulder Mobility (Upper Body Focus)');
  const shoulder = await Brain.executeTask({
    app: 'physiomotion',
    type: 'movement_assessment',
    input: {
      patientId: 'patient-123',
      assessmentType: 'shoulder_mobility',
      landmarks: [],
      videoDuration: 30
    },
    requiredConfidence: 0.85,
    enableDebate: true
  });
  
  console.log(`   - Agents activated: ${shoulder.results.length}`);
  console.log(`   - Right shoulder flexion: ${shoulder.results.find(r => r.agentId === 'upper-extremity-right')?.result?.shoulder_flexion}°`);
  console.log(`   - Left shoulder flexion: ${shoulder.results.find(r => r.agentId === 'upper-extremity-left')?.result?.shoulder_flexion}°`);
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ DEMO COMPLETE — All body regions analyzed by specialist agents');
  console.log('='.repeat(70));
  
  return { squat, overhead, shoulder };
}
