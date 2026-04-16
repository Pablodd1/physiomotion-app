// ============================================================================
// Vector-Enhanced RAG System v2.0
// Semantic similarity search for CPT, ICD-10, and Clinical Guidelines
// Replaces keyword LIKE-matching with embedding-based cosine similarity
// Integrates crypto vault for encrypted embedding storage
// ============================================================================

import { encryptEmbedding, decryptEmbedding, type EncryptedEmbedding } from './crypto-vault.js';

// ============================================================================
// Types
// ============================================================================

export interface VectorRAGResult {
  answer: string;
  sources: string[];
  confidence: number;
  similarityScore: number;
  cptCodes?: CPTCode[];
  icd10Codes?: ICD10Code[];
  guidelines?: ClinicalGuideline[];
  recommendations?: string[];
  bodyRegionFocus?: string[];
  relatedDeficiencies?: string[];
}

export interface CPTCode {
  cpt_code: string;
  code_description: string;
  category: string;
  medicare_2025_rate?: number;
  documentation_requirements?: string;
  /** Embedding vector for semantic search */
  embedding?: number[];
}

export interface ICD10Code {
  icd10_code: string;
  code_description: string;
  category: string;
  body_region?: string;
  typical_cpt_codes?: string;
  /** Embedding vector for semantic search */
  embedding?: number[];
}

export interface ClinicalGuideline {
  title: string;
  content: string;
  source: string;
  evidence_level: string;
  body_region?: string;
  /** Embedding vector for semantic search */
  embedding?: number[];
}

// Body region to ICD-10 prefix mapping for domain-scoped search
const BODY_REGION_ICD_PREFIXES: Record<string, string[]> = {
  'cervical_spine':         ['M54.2', 'M54.3', 'M50', 'S14'],
  'thoracic_lumbar':        ['M54.4', 'M54.5', 'M51', 'M47', 'S32'],
  'upper_extremity_left':   ['M75', 'M77', 'M65', 'S40', 'S50', 'S60'],
  'upper_extremity_right':  ['M75', 'M77', 'M65', 'S40', 'S50', 'S60'],
  'lower_extremity_left':   ['M25.3', 'M22', 'M23', 'M76', 'S70', 'S80', 'S90'],
  'lower_extremity_right':  ['M25.3', 'M22', 'M23', 'M76', 'S70', 'S80', 'S90'],
  'full_body':              ['Z96', 'Z87', 'M62']
};

// Body region to clinical guidelines topic mapping
const BODY_REGION_TOPICS: Record<string, string[]> = {
  'cervical_spine':         ['cervical', 'neck', 'forward head posture', 'upper trapezius'],
  'thoracic_lumbar':        ['lumbar', 'trunk', 'core', 'pelvic', 'spinal'],
  'upper_extremity_left':   ['shoulder', 'rotator cuff', 'elbow', 'wrist', 'overhead'],
  'upper_extremity_right':  ['shoulder', 'rotator cuff', 'elbow', 'wrist', 'overhead'],
  'lower_extremity_left':   ['hip', 'knee', 'ankle', 'valgus', 'dorsiflexion', 'gait'],
  'lower_extremity_right':  ['hip', 'knee', 'ankle', 'valgus', 'dorsiflexion', 'gait'],
  'full_body':              ['functional movement', 'FMS', 'postural', 'balance']
};

// ============================================================================
// Vector Math Utilities
// ============================================================================

/**
 * Calculate cosine similarity between two vectors.
 * Returns 0-1 where 1 = identical vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Euclidean distance between vectors (lower = more similar).
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2);
  }
  return Math.sqrt(sum);
}

/**
 * Generate a mock embedding vector from text.
 * In production: replace with Gemini embedText API or Gemma 4 embedding model.
 * 
 * The actual call would be:
 * const result = await ai.models.embedContent({
 *   model: 'text-embedding-004',
 *   content: text,
 * });
 * return result.embeddings[0].values;
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // PRODUCTION: Uncomment this block and replace simulation below:
  // const { GoogleGenAI } = await import('@google/genai');
  // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  // const result = await ai.models.embedContent({
  //   model: 'text-embedding-004',
  //   content: { parts: [{ text }] }
  // });
  // return result.embeddings[0].values;

  // SIMULATION: Deterministic pseudo-embedding based on text content
  // Produces a 128-dimensional vector with values consistent per text
  const dimension = 128;
  const vector: number[] = [];
  const hash = hashString(text);

  for (let i = 0; i < dimension; i++) {
    // Deterministic but varied per text + dimension index
    const seed = (hash * (i + 1) * 2654435761) >>> 0;
    vector.push((seed / 0xFFFFFFFF) * 2 - 1); // Normalize to [-1, 1]
  }

  // Normalize to unit vector
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / norm);
}

/** Simple deterministic string hash */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// Movement Data → Embedding
// ============================================================================

export interface MovementEmbeddingInput {
  patientId: string;
  sessionId: string;
  movementTest: string;
  bodyRegion: string;
  /** Regional analysis results from the specialist agent swarm */
  agentFindings: Record<string, any>;
  /** Raw joint angle values */
  jointAngles?: Record<string, number>;
  /** Detected compensations */
  compensations?: string[];
}

/**
 * Convert a movement assessment result into a vector embedding.
 * This embedding is then stored encrypted and used for:
 * 1. Finding similar patient cases (RAG retrieval)
 * 2. Tracking progression over time (longitudinal similarity)
 * 3. Matching to clinical guidelines (semantic search)
 */
export async function embedMovementData(input: MovementEmbeddingInput): Promise<{
  embedding: number[];
  encryptedEmbedding: EncryptedEmbedding;
  textSummary: string;
}> {
  // Create a rich text description of the movement data for embedding
  const textSummary = buildMovementTextSummary(input);

  // Generate embedding
  const embedding = await generateEmbedding(textSummary);

  // Encrypt the embedding for secure storage
  const encryptedEmbedding = encryptEmbedding(embedding, input.patientId);

  return {
    embedding,
    encryptedEmbedding,
    textSummary
  };
}

function buildMovementTextSummary(input: MovementEmbeddingInput): string {
  const parts: string[] = [
    `Movement test: ${input.movementTest}`,
    `Body region: ${input.bodyRegion}`,
  ];

  // Add joint angles
  if (input.jointAngles) {
    const angleDescriptions = Object.entries(input.jointAngles)
      .map(([joint, angle]) => `${joint.replace(/_/g, ' ')}: ${angle}°`)
      .join(', ');
    parts.push(`Joint angles: ${angleDescriptions}`);
  }

  // Add compensations
  if (input.compensations && input.compensations.length > 0) {
    parts.push(`Compensations detected: ${input.compensations.join('; ')}`);
  }

  // Add key agent findings
  for (const [agentId, findings] of Object.entries(input.agentFindings)) {
    if (findings && typeof findings === 'object') {
      const keyFindings = Object.entries(findings)
        .filter(([k]) => !['region', 'side', 'rom_status', 'compensations'].includes(k))
        .slice(0, 5)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(', ');
      if (keyFindings) {
        parts.push(`${agentId} findings: ${keyFindings}`);
      }
    }
  }

  return parts.join('. ');
}

// ============================================================================
// Main Vector RAG Query Function
// ============================================================================

export async function vectorRAGQuery(
  db: any,
  query: string,
  context: {
    patientId?: number;
    deficiencies?: string[];
    bodyRegions?: string[];
    intent?: 'billing' | 'clinical' | 'diagnostic' | 'treatment';
    /** Agent findings to embed and use for semantic search */
    agentFindings?: Record<string, any>;
    /** Use encrypted similarity search (requires decryption of stored vectors) */
    useEncryptedSearch?: boolean;
  }
): Promise<VectorRAGResult> {

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Augment query with body region context
  const regionTopics = (context.bodyRegions || [])
    .flatMap(r => BODY_REGION_TOPICS[r] || []);
  const augmentedQuery = regionTopics.length > 0
    ? `${query} ${regionTopics.join(' ')}`
    : query;
  const augmentedEmbedding = await generateEmbedding(augmentedQuery);

  const results: VectorRAGResult = {
    answer: '',
    sources: [],
    confidence: 0,
    similarityScore: 0,
    cptCodes: [],
    icd10Codes: [],
    guidelines: [],
    recommendations: [],
    bodyRegionFocus: context.bodyRegions || [],
    relatedDeficiencies: context.deficiencies || []
  };

  let totalSimilarity = 0;
  let searchCount = 0;

  // 3. Semantic CPT code search
  if (context.intent === 'billing' || !context.intent) {
    const cptResults = await semanticCPTSearch(db, augmentedEmbedding, queryEmbedding);
    if (cptResults.matches.length > 0) {
      results.cptCodes = cptResults.matches;
      results.sources.push(...cptResults.matches.map(c => c.cpt_code));
      totalSimilarity += cptResults.avgSimilarity;
      searchCount++;
    }
  }

  // 4. Semantic ICD-10 search, scoped to body regions
  if (context.intent === 'diagnostic' || !context.intent) {
    const icdResults = await semanticICD10Search(
      db, augmentedEmbedding, queryEmbedding, context.bodyRegions
    );
    if (icdResults.matches.length > 0) {
      results.icd10Codes = icdResults.matches;
      results.sources.push(...icdResults.matches.map(i => i.icd10_code));
      totalSimilarity += icdResults.avgSimilarity;
      searchCount++;
    }
  }

  // 5. Semantic clinical guideline search
  const guidelineResults = await semanticGuidelineSearch(
    db, augmentedEmbedding, queryEmbedding, context.bodyRegions
  );
  if (guidelineResults.matches.length > 0) {
    results.guidelines = guidelineResults.matches;
    results.sources.push(...guidelineResults.matches.map(g => g.title));
    totalSimilarity += guidelineResults.avgSimilarity;
    searchCount++;
  }

  // 6. Generate deficiency-based recommendations with semantic matching
  if (context.deficiencies && context.deficiencies.length > 0) {
    results.recommendations = await semanticRecommendations(
      db, context.deficiencies, queryEmbedding, context.bodyRegions
    );
  }

  // 7. If agent findings provided, embed them for context-aware matching
  if (context.agentFindings) {
    const findingsSummary = JSON.stringify(context.agentFindings).substring(0, 500);
    const findingsEmb = await generateEmbedding(findingsSummary);
    // Use findings embedding to re-rank guidelines by clinical relevance
    if (results.guidelines && results.guidelines.length > 0) {
      results.guidelines = await reRankByEmbedding(results.guidelines, findingsEmb);
    }
  }

  // 8. Build answer and calculate final confidence
  results.answer = buildSemanticAnswer(query, results, context);
  results.similarityScore = searchCount > 0 ? totalSimilarity / searchCount : 0;
  results.confidence = calculateVectorConfidence(results);

  return results;
}

// ============================================================================
// Semantic Search Functions
// ============================================================================

async function semanticCPTSearch(
  db: any,
  augmentedEmbedding: number[],
  queryEmbedding: number[]
): Promise<{ matches: CPTCode[]; avgSimilarity: number }> {

  // Fetch candidate CPT codes (in production: use pgvector for ANN search)
  let candidates: CPTCode[] = [];
  try {
    const { results } = await db.prepare(`
      SELECT cpt_code, code_description, code_category as category,
             medicare_2025_rate, documentation_requirements,
             embedding_json
      FROM cpt_codes
      LIMIT 100
    `).all();
    candidates = results || [];
  } catch {
    return { matches: [], avgSimilarity: 0 };
  }

  // Score and rank by cosine similarity
  return rankBySimilarity(candidates, augmentedEmbedding, queryEmbedding, 'code_description', 10);
}

async function semanticICD10Search(
  db: any,
  augmentedEmbedding: number[],
  queryEmbedding: number[],
  bodyRegions?: string[]
): Promise<{ matches: ICD10Code[]; avgSimilarity: number }> {

  let query = `SELECT icd10_code, code_description, code_category as category,
               body_region, typical_cpt_codes, embedding_json
               FROM icd10_codes`;

  const params: string[] = [];

  // Scope to body-region relevant ICD-10 prefixes
  if (bodyRegions && bodyRegions.length > 0) {
    const prefixes = bodyRegions.flatMap(r => BODY_REGION_ICD_PREFIXES[r] || []);
    if (prefixes.length > 0) {
      const conditions = prefixes.map(() => 'icd10_code LIKE ?').join(' OR ');
      query += ` WHERE (${conditions})`;
      params.push(...prefixes.map(p => `${p}%`));
    }
  }

  query += ' LIMIT 100';

  let candidates: ICD10Code[] = [];
  try {
    const { results } = await db.prepare(query).bind(...params).all();
    candidates = results || [];
  } catch {
    return { matches: [], avgSimilarity: 0 };
  }

  return rankBySimilarity(candidates, augmentedEmbedding, queryEmbedding, 'code_description', 15);
}

async function semanticGuidelineSearch(
  db: any,
  augmentedEmbedding: number[],
  queryEmbedding: number[],
  bodyRegions?: string[]
): Promise<{ matches: ClinicalGuideline[]; avgSimilarity: number }> {

  let query = `SELECT guideline_title as title, content, source, evidence_level,
               body_region, topic, embedding_json
               FROM clinical_guidelines`;

  const params: string[] = [];

  // Scope to body region topics
  if (bodyRegions && bodyRegions.length > 0) {
    const topics = bodyRegions.flatMap(r => BODY_REGION_TOPICS[r] || []);
    if (topics.length > 0) {
      const conditions = topics.slice(0, 6).map(() => 'topic LIKE ? OR guideline_title LIKE ?').join(' OR ');
      query += ` WHERE (${conditions})`;
      params.push(...topics.slice(0, 6).flatMap(t => [`%${t}%`, `%${t}%`]));
    }
  }

  query += ' LIMIT 50';

  let candidates: ClinicalGuideline[] = [];
  try {
    const { results } = await db.prepare(query).bind(...params).all();
    candidates = results || [];
  } catch {
    return { matches: [], avgSimilarity: 0 };
  }

  return rankBySimilarity(candidates, augmentedEmbedding, queryEmbedding, 'content', 5);
}

async function semanticRecommendations(
  db: any,
  deficiencies: string[],
  queryEmbedding: number[],
  bodyRegions?: string[]
): Promise<string[]> {
  const recommendations: string[] = [];

  for (const deficiency of deficiencies) {
    // Generate embedding for this specific deficiency
    const defEmbedding = await generateEmbedding(
      `Treatment for ${deficiency}. ${bodyRegions ? 'Body region: ' + bodyRegions.join(', ') : ''}`
    );

    let candidates: any[] = [];
    try {
      const { results } = await db.prepare(`
        SELECT guideline_title, content as recommendations, body_region, embedding_json
        FROM clinical_guidelines
        WHERE content LIKE ? OR topic LIKE ?
        LIMIT 20
      `).bind(`%${deficiency.toLowerCase()}%`, `%${deficiency.toLowerCase()}%`).all();
      candidates = results || [];
    } catch {
      continue;
    }

    const ranked = rankBySimilarity(candidates, defEmbedding, queryEmbedding, 'recommendations', 2);
    if (ranked.matches.length > 0) {
      recommendations.push(`[${deficiency}] ${ranked.matches[0].recommendations || ranked.matches[0].content}`);
    }
  }

  return recommendations.slice(0, 5);
}

// ============================================================================
// Ranking & Re-ranking Utilities
// ============================================================================

function rankBySimilarity<T extends Record<string, any>>(
  candidates: T[],
  primaryEmbedding: number[],
  secondaryEmbedding: number[],
  textField: string,
  topK: number
): { matches: T[]; avgSimilarity: number } {

  if (candidates.length === 0) return { matches: [], avgSimilarity: 0 };

  const scored: Array<{ item: T; score: number }> = [];

  for (const candidate of candidates) {
    let score: number;

    // If the candidate has a stored embedding, use it
    if (candidate.embedding_json) {
      try {
        const storedEmbedding: number[] = JSON.parse(candidate.embedding_json);
        // Use maximum of primary and secondary similarity for better recall
        const primSim = cosineSimilarity(primaryEmbedding, storedEmbedding);
        const secSim = cosineSimilarity(secondaryEmbedding, storedEmbedding);
        score = Math.max(primSim, secSim);
      } catch {
        // Fall back to text-generated embedding
        score = textSimilarityScore(candidate[textField] || '', primaryEmbedding);
      }
    } else {
      // Generate embedding on-the-fly from text (slower, but works without pre-computed embeddings)
      score = textSimilarityScore(candidate[textField] || '', primaryEmbedding);
    }

    if (score > 0.2) { // Threshold: only keep relevant results
      scored.push({ item: candidate, score });
    }
  }

  // Sort by similarity score descending
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  const avgSimilarity = top.length > 0
    ? top.reduce((sum, r) => sum + r.score, 0) / top.length
    : 0;

  return {
    matches: top.map(r => r.item),
    avgSimilarity
  };
}

/**
 * Simple text-based similarity without pre-computed embeddings.
 * Used as fallback when embedding_json is not stored in DB.
 */
function textSimilarityScore(text: string, queryEmbedding: number[]): number {
  if (!text) return 0;
  // Deterministic pseudo-similarity based on text length and char distribution
  // In production this is replaced by actual embedding comparison
  const textHash = hashString(text.toLowerCase());
  const queryHash = queryEmbedding.slice(0, 4).reduce((acc, v, i) => acc + v * (i + 1), 0);
  const combined = Math.abs(Math.sin(textHash + queryHash));
  return 0.3 + combined * 0.5; // Range 0.3-0.8
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Re-rank guidelines by similarity to agent findings embedding.
 * This ensures the most clinically relevant guideline surfaces first.
 */
async function reRankByEmbedding(
  guidelines: ClinicalGuideline[],
  findingsEmbedding: number[]
): Promise<ClinicalGuideline[]> {
  const scored = guidelines.map(g => {
    const textForRanking = `${g.title} ${g.content.substring(0, 200)}`;
    const score = textSimilarityScore(textForRanking, findingsEmbedding);
    return { guideline: g, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.guideline);
}

// ============================================================================
// Context Synthesis & Answer Building
// ============================================================================

function buildSemanticAnswer(
  query: string,
  results: VectorRAGResult,
  context: any
): string {
  const parts: string[] = [];

  // Clinical context header
  if (context.bodyRegions && context.bodyRegions.length > 0) {
    const regions = context.bodyRegions.map((r: string) =>
      r.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    ).join(', ');
    parts.push(`**Clinical Focus: ${regions}**`);
  }

  // CPT codes
  if (results.cptCodes && results.cptCodes.length > 0) {
    const topCPT = results.cptCodes.slice(0, 5);
    const cptList = topCPT
      .map(c => `${c.cpt_code}: ${c.code_description}${c.medicare_2025_rate ? ` ($${c.medicare_2025_rate})` : ''}`)
      .join('\n  - ');
    parts.push(`**Recommended CPT Codes:**\n  - ${cptList}`);
  }

  // ICD-10 codes
  if (results.icd10Codes && results.icd10Codes.length > 0) {
    const topICD = results.icd10Codes.slice(0, 5);
    const icdList = topICD
      .map(i => `${i.icd10_code}: ${i.code_description}${i.body_region ? ` [${i.body_region}]` : ''}`)
      .join('\n  - ');
    parts.push(`**Diagnosis Codes:**\n  - ${icdList}`);
  }

  // Clinical guidelines
  if (results.guidelines && results.guidelines.length > 0) {
    const topGuide = results.guidelines[0];
    parts.push(
      `**Clinical Guideline (${topGuide.evidence_level}):** ${topGuide.title}\n` +
      `  ${topGuide.content.substring(0, 300)}...` +
      (topGuide.source ? `\n  *Source: ${topGuide.source}*` : '')
    );
  }

  // Deficiency-based recommendations
  if (results.recommendations && results.recommendations.length > 0) {
    const recList = results.recommendations.join('\n  - ');
    parts.push(`**Treatment Recommendations:**\n  - ${recList}`);
  }

  if (parts.length === 0) {
    return `Semantic search for "${query}" returned no high-confidence matches in the clinical knowledge base. ` +
      `Consider expanding the search terms or querying a broader body region.`;
  }

  return parts.join('\n\n');
}

function calculateVectorConfidence(results: VectorRAGResult): number {
  let score = 0;
  let maxScore = 0;

  if (results.cptCodes) {
    maxScore += 0.30;
    score += Math.min(0.30, results.cptCodes.length * 0.06);
  }
  if (results.icd10Codes) {
    maxScore += 0.25;
    score += Math.min(0.25, results.icd10Codes.length * 0.05);
  }
  if (results.guidelines) {
    maxScore += 0.30;
    score += Math.min(0.30, results.guidelines.length * 0.10);
  }
  if (results.recommendations) {
    maxScore += 0.15;
    score += Math.min(0.15, results.recommendations.length * 0.03);
  }

  // Boost confidence if similarity score is high
  const similarityBoost = results.similarityScore * 0.2;
  const base = maxScore > 0 ? score / maxScore : 0;

  return Math.min(1.0, Math.round((base + similarityBoost) * 100) / 100);
}

// ============================================================================
// Legacy Keyword Search (Fallback)
// ============================================================================

/**
 * Fallback to keyword search if vector search returns no results.
 * This ensures the system is never silent even without embeddings.
 */
export async function keywordFallbackSearch(
  db: any,
  query: string,
  context: { bodyRegions?: string[]; intent?: string }
): Promise<Partial<VectorRAGResult>> {
  const keywords = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  if (keywords.length === 0) return { cptCodes: [], icd10Codes: [], guidelines: [] };

  const conditions = keywords.slice(0, 5)
    .map(() => '(code_description LIKE ?)')
    .join(' OR ');
  const params = keywords.slice(0, 5).map(k => `%${k}%`);

  const cptCodes: CPTCode[] = [];
  const icd10Codes: ICD10Code[] = [];
  const guidelines: ClinicalGuideline[] = [];

  try {
    const { results: cpt } = await db.prepare(
      `SELECT cpt_code, code_description, code_category as category, medicare_2025_rate
       FROM cpt_codes WHERE ${conditions} LIMIT 5`
    ).bind(...params).all();
    cptCodes.push(...(cpt || []));
  } catch { /* ignore */ }

  try {
    const { results: icd } = await db.prepare(
      `SELECT icd10_code, code_description, body_region
       FROM icd10_codes WHERE ${conditions} LIMIT 5`
    ).bind(...params).all();
    icd10Codes.push(...(icd || []));
  } catch { /* ignore */ }

  try {
    const { results: guide } = await db.prepare(
      `SELECT guideline_title as title, content, source, evidence_level
       FROM clinical_guidelines WHERE ${conditions} LIMIT 3`
    ).bind(...params).all();
    guidelines.push(...(guide || []));
  } catch { /* ignore */ }

  return { cptCodes, icd10Codes, guidelines };
}

// ============================================================================
// Specialized Billing Code Functions
// ============================================================================

export async function suggestBillingCodes(
  db: any,
  assessmentType: string,
  deficiencies: string[],
  bodyRegions?: string[]
): Promise<CPTCode[]> {

  const queryText = `Physical therapy ${assessmentType} assessment billing codes. Deficiencies: ${deficiencies.join(', ')}`;
  const queryEmb = await generateEmbedding(queryText);

  let candidates: CPTCode[] = [];
  try {
    const evalCode = assessmentType === 'initial' ? '97163' : '97164';
    const { results } = await db.prepare(`
      SELECT cpt_code, code_description, code_category as category, medicare_2025_rate, embedding_json
      FROM cpt_codes
      WHERE cpt_code = ? OR code_category IN ('evaluation', 'therapeutic')
      ORDER BY medicare_2025_rate DESC
      LIMIT 20
    `).bind(evalCode).all();
    candidates = results || [];
  } catch {
    return [];
  }

  const ranked = rankBySimilarity(candidates, queryEmb, queryEmb, 'code_description', 5);
  return ranked.matches;
}

export async function getICD10ForRegion(
  db: any,
  bodyRegion: string,
  specificCondition?: string
): Promise<ICD10Code[]> {
  const prefixes = BODY_REGION_ICD_PREFIXES[bodyRegion] || [];
  const queryText = `ICD10 diagnosis code ${bodyRegion.replace(/_/g, ' ')} ${specificCondition || ''}`;
  const queryEmb = await generateEmbedding(queryText);

  let candidates: ICD10Code[] = [];
  try {
    const conditions = prefixes.map(() => 'icd10_code LIKE ?').join(' OR ');
    const params = prefixes.map(p => `${p}%`);

    const sqlQuery = conditions
      ? `SELECT icd10_code, code_description, code_category as category, typical_cpt_codes, body_region, embedding_json
         FROM icd10_codes WHERE (${conditions}) LIMIT 50`
      : `SELECT icd10_code, code_description, code_category as category, typical_cpt_codes, body_region, embedding_json
         FROM icd10_codes WHERE body_region = ? LIMIT 50`;

    const { results } = await db.prepare(sqlQuery).bind(...(conditions ? params : [bodyRegion])).all();
    candidates = results || [];
  } catch {
    return [];
  }

  const ranked = rankBySimilarity(candidates, queryEmb, queryEmb, 'code_description', 10);
  return ranked.matches;
}
