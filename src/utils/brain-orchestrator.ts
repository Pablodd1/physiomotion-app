// ============================================================================
// Multi-Agent Brain Orchestrator
// Coordinates specialist agents for PhysioMotion & DealFlow
// ============================================================================

interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  confidenceThreshold: number;
  priority: number;
  enabled: boolean;
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

// Agent Registry - Specialist Definitions
const AGENT_REGISTRY: Record<string, Agent> = {
  // PhysioMotion Agents
  'biomechanics': {
    id: 'biomechanics',
    name: 'Biomechanics Agent',
    role: 'Joint angle analysis, ROM calculations, mesoskeleton modeling',
    capabilities: ['pose_analysis', 'joint_angles', 'rom_calculation', 'symmetry_check'],
    confidenceThreshold: 0.85,
    priority: 1,
    enabled: true
  },
  'balance': {
    id: 'balance',
    name: 'Balance Agent',
    role: 'Posture analysis, sway detection, stability metrics',
    capabilities: ['posture_analysis', 'sway_detection', 'weight_distribution', 'stability_score'],
    confidenceThreshold: 0.80,
    priority: 2,
    enabled: true
  },
  'predictor': {
    id: 'predictor',
    name: 'Risk Predictor Agent',
    role: 'Re-injury risk forecasting, progression prediction',
    capabilities: ['risk_forecast', 'injury_prediction', 'progression_analysis', 'outcome_prediction'],
    confidenceThreshold: 0.75,
    priority: 3,
    enabled: true
  },
  'comparative': {
    id: 'comparative',
    name: 'Comparative Analysis Agent',
    role: 'Norm comparison, history tracking, trend analysis',
    capabilities: ['norm_comparison', 'history_analysis', 'trend_detection', 'benchmarking'],
    confidenceThreshold: 0.80,
    priority: 4,
    enabled: true
  },
  'exercise-rx': {
    id: 'exercise-rx',
    name: 'Exercise Prescription Agent',
    role: 'PT protocol generation, exercise selection, progression planning',
    capabilities: ['exercise_selection', 'protocol_generation', 'progression_planning', 'contraindication_check'],
    confidenceThreshold: 0.85,
    priority: 5,
    enabled: true
  },
  
  // DealFlow Agents
  'legal-research': {
    id: 'legal-research',
    name: 'Legal Research Agent',
    role: 'Case law search, statute analysis, precedent finding',
    capabilities: ['case_law_search', 'statute_analysis', 'precedent_matching', 'circuit_split_detection'],
    confidenceThreshold: 0.90,
    priority: 1,
    enabled: true
  },
  'document-parser': {
    id: 'document-parser',
    name: 'Document Parser Agent',
    role: 'Contract analysis, key term extraction, clause identification',
    capabilities: ['contract_analysis', 'term_extraction', 'clause_identification', 'risk_flagging'],
    confidenceThreshold: 0.88,
    priority: 2,
    enabled: true
  },
  'strategy': {
    id: 'strategy',
    name: 'Case Strategy Agent',
    role: 'Case theory building, claim recommendation, defense analysis',
    capabilities: ['case_theory', 'claim_recommendation', 'defense_analysis', 'settlement_advice'],
    confidenceThreshold: 0.85,
    priority: 3,
    enabled: true
  },
  'outcome-predictor': {
    id: 'outcome-predictor',
    name: 'Outcome Predictor Agent',
    role: 'Win probability, settlement range, litigation analytics',
    capabilities: ['win_probability', 'settlement_range', 'litigation_analytics', 'judge_history'],
    confidenceThreshold: 0.75,
    priority: 4,
    enabled: true
  },
  
  // Shared Agents
  'research': {
    id: 'research',
    name: 'Research Agent',
    role: 'Live web search, literature retrieval, RAG updates',
    capabilities: ['web_search', 'literature_retrieval', 'rag_update', 'fact_check'],
    confidenceThreshold: 0.85,
    priority: 1,
    enabled: true
  },
  'critic': {
    id: 'critic',
    name: 'Critic Agent',
    role: 'QA validation, consistency checking, error detection',
    capabilities: ['qa_validation', 'consistency_check', 'error_detection', 'confidence_scoring'],
    confidenceThreshold: 0.90,
    priority: 10,
    enabled: true
  },
  'memory': {
    id: 'memory',
    name: 'Memory Agent',
    role: 'Long-term context, patient/client history, pattern recall',
    capabilities: ['context_retrieval', 'history_recall', 'pattern_recognition', 'preference_memory'],
    confidenceThreshold: 0.95,
    priority: 0,
    enabled: true
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
      'physiomotion': ['biomechanics', 'balance', 'predictor', 'comparative', 'exercise-rx'],
      'dealflow': ['legal-research', 'document-parser', 'strategy', 'outcome-predictor']
    };
    
    const shared = ['research', 'critic', 'memory'];
    const specific = appPrefixes[app] || [];
    
    return [...specific, ...shared]
      .map(id => this.agents.get(id))
      .filter((a): a is Agent => a !== undefined && a.enabled);
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
  
  private selectAgentsForTask(task: { app: string; type: string }): Agent[] {
    const capabilityMap: Record<string, string[]> = {
      // PhysioMotion tasks
      'pose_analysis': ['biomechanics', 'balance', 'comparative'],
      'movement_assessment': ['biomechanics', 'predictor', 'comparative'],
      'risk_assessment': ['predictor', 'comparative', 'biomechanics'],
      'exercise_prescription': ['exercise-rx', 'biomechanics', 'predictor'],
      'progress_review': ['comparative', 'predictor', 'exercise-rx'],
      
      // DealFlow tasks
      'document_review': ['document-parser', 'legal-research', 'strategy'],
      'case_analysis': ['strategy', 'legal-research', 'outcome-predictor'],
      'legal_research': ['legal-research', 'research'],
      'litigation_strategy': ['strategy', 'outcome-predictor', 'legal-research'],
      'settlement_advice': ['outcome-predictor', 'strategy'],
      
      // Shared tasks
      'fact_check': ['research', 'critic'],
      'general_query': ['research', 'memory']
    };
    
    const capabilities = capabilityMap[task.type] || ['research'];
    const selected = new Set<Agent>();
    
    capabilities.forEach(cap => {
      this.findAgentsByCapability(cap).forEach(agent => {
        if (task.app === 'physiomotion' && 
            ['legal-research', 'document-parser', 'strategy', 'outcome-predictor'].includes(agent.id)) {
          return; // Skip legal agents for physio
        }
        if (task.app === 'dealflow' && 
            ['biomechanics', 'balance', 'predictor', 'comparative', 'exercise-rx'].includes(agent.id)) {
          return; // Skip physio agents for legal
        }
        selected.add(agent);
      });
    });
    
    return Array.from(selected).slice(0, 5); // Max 5 agents
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
    
    const appSpecificResponses: Record<string, Record<string, any>> = {
      'biomechanics': {
        data: { kneeValgus: 8.2, hipFlexion: 95, ankleDorsiflexion: 12 },
        reasoning: 'Analyzed pose landmarks against normative data for ACLR patients'
      },
      'balance': {
        data: { swayArea: 125, centerOfPressure: { x: 0.02, y: -0.05 } },
        reasoning: 'Calculated sway ellipse from 30-second quiet stance'
      },
      'predictor': {
        data: { reInjuryRisk: 0.68, timeline: '6 months', factors: ['valgus', 'asymmetry'] },
        reasoning: 'Regression model using 5 biomechanical factors + patient history'
      },
      'legal-research': {
        data: { precedents: 3, relevantStatutes: ['INA § 245(a)'], circuitSplit: false },
        reasoning: 'Searched Westlaw + PACER for similar adjustment of status cases'
      },
      'document-parser': {
        data: { keyTerms: ['priority date', 'adjustment of status'], risks: ['employment gap'] },
        reasoning: 'Parsed I-485 and I-140 for critical terms and inconsistencies'
      },
      'critic': {
        data: { validation: 'passed', concerns: [] },
        reasoning: 'Cross-checked findings against source material'
      }
    };
    
    const defaultResponse = {
      data: { status: 'processed', agent: agent.id },
      reasoning: `Executed ${agent.role.toLowerCase()}`
    };
    
    const response = appSpecificResponses[agent.id] || defaultResponse;
    
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

// Example usage (for testing)
export async function demoBrain() {
  console.log('\n' + '='.repeat(60));
  console.log('🧠 MULTI-AGENT BRAIN ORCHESTRATOR DEMO');
  console.log('='.repeat(60));
  
  // Demo 1: PhysioMotion - Movement Assessment
  console.log('\n📊 DEMO 1: PhysioMotion Movement Assessment');
  const physioResult = await Brain.executeTask({
    app: 'physiomotion',
    type: 'movement_assessment',
    input: {
      patientId: 'patient-123',
      assessmentType: 'squat',
      landmarks: [], // Would be actual MediaPipe data
      videoDuration: 45
    },
    requiredConfidence: 0.80,
    enableDebate: true
  });
  
  console.log('\n   Final Result:');
  console.log(`   - Consensus: ${(physioResult.consensusConfidence * 100).toFixed(1)}%`);
  console.log(`   - Agents agreed: ${physioResult.agreed}`);
  console.log(`   - Debate rounds: ${physioResult.debateRounds}`);
  console.log(`   - Key finding: Knee valgus ${physioResult.finalAnswer?.kneeValgus}°`);
  
  // Demo 2: DealFlow - Document Review
  console.log('\n⚖️  DEMO 2: DealFlow Document Review');
  const legalResult = await Brain.executeTask({
    app: 'dealflow',
    type: 'document_review',
    input: {
      clientId: 'client-456',
      documentType: 'I-485',
      content: 'Adjustment of status application...'
    },
    requiredConfidence: 0.85,
    enableDebate: true
  });
  
  console.log('\n   Final Result:');
  console.log(`   - Consensus: ${(legalResult.consensusConfidence * 100).toFixed(1)}%`);
  console.log(`   - Agents agreed: ${legalResult.agreed}`);
  console.log(`   - Key risks: ${legalResult.finalAnswer?.risks?.join(', ') || 'None flagged'}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ DEMO COMPLETE');
  console.log('='.repeat(60));
  
  return { physioResult, legalResult };
}

// Run demo if executed directly
if (require.main === module) {
  demoBrain().catch(console.error);
}
