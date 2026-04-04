# Multi-Agent Brain Architecture

**Version:** 1.0.0  
**Purpose:** Coordinate specialist AI agents for PhysioMotion & DealFlow  
**Architecture:** Brain Orchestrator + ACP (Agent Communication Protocol)

---

## Overview

Instead of single AI responses, this system deploys **swarms of specialist agents** that:
- Work in parallel on different aspects of a task
- Debate and refine their findings
- Build consensus with confidence scoring
- Store learnings in memory for future tasks

---

## Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        BRAIN ORCHESTRATOR                        │
│                   (Coordination & Synthesis)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  ACP    │  │  Agent  │  │  Memory │
    │   Bus   │  │Registry │  │  Store  │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┴────────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   ┌────────┐  ┌────────┐  ┌────────┐
   │Physio  │  │DealFlow│  │ Shared │
   │ Agents  │  │ Agents │  │ Agents │
   └────────┘  └────────┘  └────────┘
```

---

## Agent Registry

### PhysioMotion Agents (Medical/MSK)

| Agent | ID | Capabilities | Confidence |
|-------|-----|--------------|------------|
| **Biomechanics** | `biomechanics` | Pose analysis, joint angles, ROM | 85% |
| **Balance** | `balance` | Posture, sway detection, stability | 80% |
| **Predictor** | `predictor` | Re-injury risk, progression forecast | 75% |
| **Comparative** | `comparative` | Norm comparison, history, trends | 80% |
| **Exercise Rx** | `exercise-rx` | PT protocols, exercise selection | 85% |

### DealFlow Agents (Legal)

| Agent | ID | Capabilities | Confidence |
|-------|-----|--------------|------------|
| **Legal Research** | `legal-research` | Case law, statutes, precedents | 90% |
| **Document Parser** | `document-parser` | Contract analysis, term extraction | 88% |
| **Strategy** | `strategy` | Case theory, claims, defense | 85% |
| **Outcome Predictor** | `outcome-predictor` | Win probability, settlement | 75% |

### Shared Agents

| Agent | ID | Purpose |
|-------|-----|---------|
| **Research** | `research` | Live web search, RAG updates |
| **Critic** | `critic` | QA validation, error detection |
| **Memory** | `memory` | Long-term context, history |

---

## Usage

### Basic Task Execution

```typescript
import { Brain } from './utils/brain-orchestrator';

// Run a PhysioMotion assessment
const result = await Brain.executeTask({
  app: 'physiomotion',
  type: 'movement_assessment',
  input: {
    patientId: 'patient-123',
    assessmentType: 'squat',
    landmarks: mediaPipeData,
    videoDuration: 45
  },
  requiredConfidence: 0.80,
  enableDebate: true
});

console.log(result.consensusConfidence); // 0.87
console.log(result.agreed); // true
console.log(result.finalAnswer);
```

### App-Specific Integration

```typescript
import { runPhysioMotionAssessment, analyzeDealFlowDocument } from './utils/agent-integration';

// PhysioMotion
const physioResult = await runPhysioMotionAssessment({
  patientId: 'p-123',
  assessmentType: 'squat',
  landmarks: poseData,
  videoDuration: 45
});

// DealFlow
const legalResult = await analyzeDealFlowDocument({
  clientId: 'c-456',
  documentType: 'I-485',
  content: documentText,
  caseType: 'EB-2 NIW'
});
```

---

## How It Works

### 1. Task Dispatch
```
User Request → Brain selects relevant agents by capability
```

### 2. Parallel Processing
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Agent A    │     │  Agent B    │     │  Agent C    │
│ Processing  │     │ Processing  │     │ Processing  │
│   45ms      │     │   52ms      │     │   38ms      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ↓
                    Critic validates
```

### 3. Consensus Building
```
Agent Results → Weighted voting → Confidence score
      ↓
If confidence < threshold → Debate round
      ↓
Refined results → Final consensus
```

### 4. Debate Mechanism
```
Round 1: Agents submit initial findings
         ↓
Critic flags inconsistencies
         ↓
Dissenting agents re-analyze with majority context
         ↓
Round 2: Refined submissions
         ↓
New consensus calculated
```

---

## Agent Communication Protocol (ACP)

Messages flow through a central bus with types:

| Type | Purpose |
|------|---------|
| `TASK_REQUEST` | Dispatch work to agents |
| `TASK_RESPONSE` | Agent completion |
| `QUERY` | Request specific info |
| `DEBATE_INIT` | Start debate round |
| `CONSENSUS_PROPOSE` | Propose final answer |

### Message Structure
```typescript
interface ACPMessage {
  id: string;
  sender: string;
  recipients: string[] | 'broadcast';
  type: ACPMessageType;
  payload: any;
  priority: number;
  metadata: {
    correlationId: string;
    app: 'physiomotion' | 'dealflow';
  };
}
```

---

## Confidence Scoring

Each agent outputs:
- **Result** (structured data)
- **Confidence** (0-1)
- **Reasoning** (explanation)

Consensus confidence = weighted average of participating agents

| Threshold | Meaning |
|-----------|---------|
| ≥ 0.90 | High confidence, proceed |
| 0.80-0.89 | Good confidence, flag for review |
| 0.70-0.79 | Moderate, trigger debate |
| < 0.70 | Low confidence, human review required |

---

## Configuration

### Enable/Disable Agents
```typescript
import { Brain } from './utils/brain-orchestrator';

Brain.enableAgent('predictor');
Brain.disableAgent('outcome-predictor');

// Check status
const status = Brain.getAgentStatus();
```

### Adjust Consensus Threshold
```typescript
// In brain-orchestrator.ts
this.consensusThreshold = 0.85; // Default: 0.80
this.maxDebateRounds = 5;       // Default: 3
```

---

## Files

| File | Purpose |
|------|---------|
| `brain-orchestrator.ts` | Main coordination logic |
| `agent-communication-protocol.ts` | Message bus + base agent class |
| `agent-integration.ts` | App-specific integration layer |

---

## Future Enhancements

1. **Gemma 4 Integration** - On-device inference for privacy
2. **Vector Memory** - Persistent agent memory with embeddings
3. **Real-time Collaboration** - WebSocket for live agent updates
4. **Custom Agent Builder** - UI for creating new specialist agents
5. **Agent Training** - Fine-tune agents on domain data

---

*Architecture by: Senior AI Systems Developer*  
*Date: April 4, 2026*
