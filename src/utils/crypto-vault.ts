// ============================================================================
// Crypto Vault — Medical-Grade Data Integrity & Encrypted Embeddings
// HMAC signatures for movement data, AES-256 encryption for RAG vectors
// ============================================================================

import { createHmac, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

interface CryptoVaultConfig {
  /** Secret key for HMAC signing (should come from ENV in production) */
  hmacSecret: string;
  /** Password for AES-256 encryption of vector embeddings */
  encryptionPassword: string;
  /** Salt for key derivation (stored alongside config, NOT in DB) */
  salt?: Buffer;
}

const DEFAULT_CONFIG: CryptoVaultConfig = {
  hmacSecret: process.env.HMAC_SECRET || 'physiomotion-medical-integrity-key-2026',
  encryptionPassword: process.env.ENCRYPTION_PASSWORD || 'physiomotion-vault-aes256-key-2026',
  salt: undefined
};

// ============================================================================
// HMAC Signatures for Movement Landmark Data
// ============================================================================

export interface SignedMovementFrame {
  /** Original landmark data */
  landmarks: Record<string, { x: number; y: number; z: number; visibility?: number }>;
  /** Timestamp of the frame */
  timestamp: number;
  /** HMAC-SHA256 signature of the serialized landmarks */
  signature: string;
  /** Patient ID for audit trail */
  patientId: string;
  /** Session/assessment ID */
  sessionId: string;
}

/**
 * Sign a single frame of movement landmark data.
 * Creates an HMAC-SHA256 digest that proves the data has not been tampered with.
 * 
 * Clinical rationale: In medical-grade assessment, pose data must be verifiable.
 * If a single coordinate is altered (e.g., to fake improved ROM), the signature
 * will fail verification, protecting clinical integrity.
 */
export function signMovementData(
  landmarks: Record<string, { x: number; y: number; z: number; visibility?: number }>,
  patientId: string,
  sessionId: string,
  config: Partial<CryptoVaultConfig> = {}
): SignedMovementFrame {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const timestamp = Date.now();

  // Deterministic serialization: sort keys to ensure consistent hashing
  const payload = JSON.stringify({
    landmarks: sortObjectKeys(landmarks),
    timestamp,
    patientId,
    sessionId
  });

  const hmac = createHmac('sha256', cfg.hmacSecret);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return {
    landmarks,
    timestamp,
    signature,
    patientId,
    sessionId
  };
}

/**
 * Sign an entire movement session (array of frames).
 * Each frame gets its own signature, plus a session-level chain signature
 * that links all frames together (tamper-evident chain).
 */
export function signMovementSession(
  frames: Array<{
    landmarks: Record<string, { x: number; y: number; z: number; visibility?: number }>;
    timestamp: number;
  }>,
  patientId: string,
  sessionId: string,
  config: Partial<CryptoVaultConfig> = {}
): {
  signedFrames: SignedMovementFrame[];
  sessionSignature: string;
  frameCount: number;
} {
  const signedFrames: SignedMovementFrame[] = [];
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Sign each individual frame
  for (const frame of frames) {
    const signed = signMovementData(frame.landmarks, patientId, sessionId, cfg);
    signed.timestamp = frame.timestamp; // Preserve original timestamp
    signedFrames.push(signed);
  }

  // Create a chain signature linking all frame signatures together
  const chainPayload = signedFrames.map(f => f.signature).join(':');
  const chainHmac = createHmac('sha256', cfg.hmacSecret);
  chainHmac.update(chainPayload);
  const sessionSignature = chainHmac.digest('hex');

  return {
    signedFrames,
    sessionSignature,
    frameCount: frames.length
  };
}

/**
 * Verify that a signed movement frame has not been tampered with.
 * Returns true if the HMAC signature matches the current data.
 */
export function verifyMovementData(
  signedFrame: SignedMovementFrame,
  config: Partial<CryptoVaultConfig> = {}
): { valid: boolean; reason?: string } {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const payload = JSON.stringify({
    landmarks: sortObjectKeys(signedFrame.landmarks),
    timestamp: signedFrame.timestamp,
    patientId: signedFrame.patientId,
    sessionId: signedFrame.sessionId
  });

  const hmac = createHmac('sha256', cfg.hmacSecret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  if (expectedSignature !== signedFrame.signature) {
    return {
      valid: false,
      reason: 'HMAC signature mismatch — data may have been tampered with'
    };
  }

  return { valid: true };
}

/**
 * Verify an entire movement session chain.
 * Checks each individual frame AND the session-level chain signature.
 */
export function verifyMovementSession(
  signedSession: {
    signedFrames: SignedMovementFrame[];
    sessionSignature: string;
    frameCount: number;
  },
  config: Partial<CryptoVaultConfig> = {}
): {
  valid: boolean;
  invalidFrames: number[];
  chainValid: boolean;
  reason?: string;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const invalidFrames: number[] = [];

  // Verify each frame
  for (let i = 0; i < signedSession.signedFrames.length; i++) {
    const result = verifyMovementData(signedSession.signedFrames[i], cfg);
    if (!result.valid) {
      invalidFrames.push(i);
    }
  }

  // Verify chain signature
  const chainPayload = signedSession.signedFrames.map(f => f.signature).join(':');
  const chainHmac = createHmac('sha256', cfg.hmacSecret);
  chainHmac.update(chainPayload);
  const expectedChainSig = chainHmac.digest('hex');
  const chainValid = expectedChainSig === signedSession.sessionSignature;

  // Verify frame count
  if (signedSession.signedFrames.length !== signedSession.frameCount) {
    return {
      valid: false,
      invalidFrames,
      chainValid: false,
      reason: `Frame count mismatch: expected ${signedSession.frameCount}, got ${signedSession.signedFrames.length}. Frames may have been added or removed.`
    };
  }

  return {
    valid: invalidFrames.length === 0 && chainValid,
    invalidFrames,
    chainValid,
    reason: invalidFrames.length > 0
      ? `${invalidFrames.length} frames failed signature verification`
      : chainValid
        ? undefined
        : 'Session chain signature invalid — frame order may have been altered'
  };
}

// ============================================================================
// AES-256-GCM Encryption for Vector Embeddings
// ============================================================================

export interface EncryptedEmbedding {
  /** AES-256-GCM encrypted vector data */
  ciphertext: string;
  /** Initialization vector (stored alongside ciphertext) */
  iv: string;
  /** GCM authentication tag */
  authTag: string;
  /** Key derivation salt */
  salt: string;
  /** Original vector dimension (for validation after decryption) */
  dimension: number;
  /** Patient ID for key scoping */
  patientId: string;
  /** Timestamp of encryption */
  encryptedAt: string;
}

/**
 * Encrypt a RAG vector embedding using AES-256-GCM.
 * 
 * Clinical rationale: Movement embeddings encode the patient's biomechanical
 * "signature" — their unique joint angles, compensations, and ROM patterns.
 * If stored in plaintext, an attacker could reconstruct approximate poses.
 * Encryption ensures embeddings are useless without the clinical key.
 */
export function encryptEmbedding(
  vector: number[],
  patientId: string,
  config: Partial<CryptoVaultConfig> = {}
): EncryptedEmbedding {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Generate a unique salt for this embedding
  const salt = cfg.salt || randomBytes(16);

  // Derive a key from the password + salt using scrypt
  const key = scryptSync(cfg.encryptionPassword, salt, 32);

  // Generate a random IV for AES-256-GCM
  const iv = randomBytes(12); // 96-bit IV for GCM

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  // Serialize the vector to a buffer
  const vectorBuffer = Buffer.from(JSON.stringify(vector));

  // Encrypt
  let encrypted = cipher.update(vectorBuffer, undefined, 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    dimension: vector.length,
    patientId,
    encryptedAt: new Date().toISOString()
  };
}

/**
 * Decrypt a RAG vector embedding back to its original float array.
 */
export function decryptEmbedding(
  encrypted: EncryptedEmbedding,
  config: Partial<CryptoVaultConfig> = {}
): { vector: number[]; valid: boolean; reason?: string } {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  try {
    const salt = Buffer.from(encrypted.salt, 'hex');
    const key = scryptSync(cfg.encryptionPassword, salt, 32);
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const vector: number[] = JSON.parse(decrypted);

    // Validate dimension
    if (vector.length !== encrypted.dimension) {
      return {
        vector: [],
        valid: false,
        reason: `Dimension mismatch: expected ${encrypted.dimension}, got ${vector.length}`
      };
    }

    return { vector, valid: true };
  } catch (err: any) {
    return {
      vector: [],
      valid: false,
      reason: `Decryption failed: ${err.message}. Key may be incorrect or data corrupted.`
    };
  }
}

// ============================================================================
// Hono Middleware — Verify Data Integrity on Incoming Requests
// ============================================================================

/**
 * Hono middleware that verifies HMAC signatures on incoming movement data.
 * Rejects requests where the signature does not match, preventing tampered
 * data from reaching the clinical analysis pipeline.
 */
export function verifyDataIntegrity(config: Partial<CryptoVaultConfig> = {}) {
  return async (c: any, next: any) => {
    const path = c.req.path;

    // Only verify on routes that accept movement/landmark data
    const protectedPaths = [
      '/api/assessments',
      '/api/movement-data',
      '/api/pose-analysis'
    ];

    const isProtected = protectedPaths.some(p => path.startsWith(p));
    if (!isProtected) {
      return next();
    }

    // Only verify POST/PUT requests with body data
    if (!['POST', 'PUT'].includes(c.req.method)) {
      return next();
    }

    try {
      const body = await c.req.json();

      // Check if the body contains signed movement data
      if (body.signedFrames || body.signedFrame) {
        const frames = body.signedFrames || [body.signedFrame];

        for (let i = 0; i < frames.length; i++) {
          const result = verifyMovementData(frames[i], config);
          if (!result.valid) {
            console.error(`🔒 INTEGRITY VIOLATION: Frame ${i} failed verification — ${result.reason}`);
            return c.json({
              success: false,
              error: 'Data integrity verification failed',
              detail: result.reason,
              frame: i
            }, 403);
          }
        }

        // If session-level signature exists, verify the chain
        if (body.sessionSignature) {
          const sessionResult = verifyMovementSession({
            signedFrames: frames,
            sessionSignature: body.sessionSignature,
            frameCount: body.frameCount || frames.length
          }, config);

          if (!sessionResult.valid) {
            console.error(`🔒 SESSION INTEGRITY VIOLATION: ${sessionResult.reason}`);
            return c.json({
              success: false,
              error: 'Session integrity verification failed',
              detail: sessionResult.reason,
              invalidFrames: sessionResult.invalidFrames
            }, 403);
          }
        }

        console.log(`✅ Integrity verified: ${frames.length} frames, all signatures valid`);
      }

      await next();
    } catch {
      // If body parsing fails, continue (non-movement request)
      await next();
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sort object keys recursively for deterministic serialization.
 * This ensures the same landmarks always produce the same HMAC.
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);

  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

/**
 * Generate a secure random key for HMAC signing.
 * Use this to generate a production-grade key, then store it in ENV.
 */
export function generateSecureKey(lengthBytes: number = 32): string {
  return randomBytes(lengthBytes).toString('hex');
}

// ============================================================================
// Export Types
// ============================================================================

export type { CryptoVaultConfig };
