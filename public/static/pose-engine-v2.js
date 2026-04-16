// ============================================================================
// PhysioMotion - Medical-Grade Pose Engine v2
// Uses: MediaPipe Tasks Vision PoseLandmarker (latest, maintained API)
// Replaces: Legacy @mediapipe/pose (deprecated)
// Features: Temporal smoothing, multi-frame ROM, confidence weighting
// ============================================================================

const MedicalPoseEngine = {
    poseLandmarker: null,
    isInitialized: false,
    isRunning: false,
    videoElement: null,
    canvasElement: null,
    onResultsCallback: null,

    // Clinical configuration
    config: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
        wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
        outputSegmentationMasks: false,
        runningMode: 'VIDEO'
    },

    // Temporal smoothing buffer for medical-grade stability
    smoothing: {
        enabled: true,
        bufferSize: 5,        // frames to average
        buffer: [],
        weightDecay: 0.85     // exponential weight for newer frames
    },

    // Clinical ROM tracking across a recording session
    romTracker: {
        enabled: true,
        jointHistory: {},     // { jointName: [angle1, angle2, ...] }
        maxHistory: 900,      // 30 seconds at 30fps
        
        record(jointName, angle) {
            if (!this.jointHistory[jointName]) {
                this.jointHistory[jointName] = [];
            }
            this.jointHistory[jointName].push(angle);
            if (this.jointHistory[jointName].length > this.maxHistory) {
                this.jointHistory[jointName].shift();
            }
        },
        
        getROM(jointName) {
            const history = this.jointHistory[jointName];
            if (!history || history.length < 10) return null;
            return {
                min: Math.round(Math.min(...history)),
                max: Math.round(Math.max(...history)),
                range: Math.round(Math.max(...history) - Math.min(...history)),
                current: Math.round(history[history.length - 1]),
                avg: Math.round(history.reduce((a, b) => a + b, 0) / history.length)
            };
        },
        
        getAllROMs() {
            const roms = {};
            for (const joint of Object.keys(this.jointHistory)) {
                const rom = this.getROM(joint);
                if (rom) roms[joint] = rom;
            }
            return roms;
        },
        
        reset() {
            this.jointHistory = {};
        }
    },

    // Performance metrics
    perf: {
        fps: 0,
        frameCount: 0,
        lastFpsTime: performance.now(),
        inferenceTimeMs: 0,
        
        tick() {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastFpsTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsTime = now;
            }
        }
    },

    // Initialize the PoseLandmarker
    async initialize(videoElement, canvasElement, onResults) {
        console.log('🦴 [MedicalPoseEngine] Initializing PoseLandmarker v2...');
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.onResultsCallback = onResults;

        try {
            // Load the Tasks Vision module
            const vision = await this._loadVisionModule();
            
            // Create PoseLandmarker
            this.poseLandmarker = await vision.PoseLandmarker.createFromOptions(
                await vision.FilesetResolver.forVisionTasks(this.config.wasmPath),
                {
                    baseOptions: {
                        modelAssetPath: this.config.modelAssetPath,
                        delegate: 'GPU'  // Use GPU acceleration when available
                    },
                    runningMode: this.config.runningMode,
                    numPoses: this.config.numPoses,
                    minPoseDetectionConfidence: this.config.minPoseDetectionConfidence,
                    minPosePresenceConfidence: this.config.minPosePresenceConfidence,
                    minTrackingConfidence: this.config.minTrackingConfidence,
                    outputSegmentationMasks: this.config.outputSegmentationMasks
                }
            );

            this.isInitialized = true;
            console.log('✅ [MedicalPoseEngine] PoseLandmarker ready (Heavy model, GPU delegate)');
            return true;

        } catch (error) {
            console.error('❌ [MedicalPoseEngine] Initialization failed:', error);
            // Fallback: try CPU delegate
            try {
                console.log('🔄 [MedicalPoseEngine] Retrying with CPU delegate...');
                const vision = await this._loadVisionModule();
                this.poseLandmarker = await vision.PoseLandmarker.createFromOptions(
                    await vision.FilesetResolver.forVisionTasks(this.config.wasmPath),
                    {
                        baseOptions: {
                            modelAssetPath: this.config.modelAssetPath,
                            delegate: 'CPU'
                        },
                        runningMode: this.config.runningMode,
                        numPoses: this.config.numPoses,
                        minPoseDetectionConfidence: this.config.minPoseDetectionConfidence,
                        minPosePresenceConfidence: this.config.minPosePresenceConfidence,
                        minTrackingConfidence: this.config.minTrackingConfidence
                    }
                );
                this.isInitialized = true;
                console.log('✅ [MedicalPoseEngine] PoseLandmarker ready (Heavy model, CPU fallback)');
                return true;
            } catch (fallbackError) {
                console.error('❌ [MedicalPoseEngine] CPU fallback also failed:', fallbackError);
                throw fallbackError;
            }
        }
    },

    // Load the vision module dynamically
    async _loadVisionModule() {
        if (window._mediapipeVision) return window._mediapipeVision;
        
        // Load via script tag for CDN compatibility
        await new Promise((resolve, reject) => {
            if (document.querySelector('script[data-mp-tasks-vision]')) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';
            script.type = 'module';
            script.setAttribute('data-mp-tasks-vision', 'true');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // Since ESM modules need import(), we use the global
        // The CDN bundle exposes it on globalThis
        if (!window._mediapipeVision) {
            // Dynamic import as fallback
            const module = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
            window._mediapipeVision = module;
        }
        
        return window._mediapipeVision;
    },

    // Start the detection loop
    start() {
        if (!this.isInitialized) {
            console.error('[MedicalPoseEngine] Not initialized');
            return;
        }
        this.isRunning = true;
        this.romTracker.reset();
        this.smoothing.buffer = [];
        console.log('🎬 [MedicalPoseEngine] Tracking started');
        this._processFrame();
    },

    // Stop the detection loop
    stop() {
        this.isRunning = false;
        console.log('⏹ [MedicalPoseEngine] Tracking stopped');
    },

    // Main processing loop
    async _processFrame() {
        if (!this.isRunning || !this.poseLandmarker || !this.videoElement) return;

        if (this.videoElement.readyState >= 2) {
            const startTime = performance.now();

            try {
                const results = this.poseLandmarker.detectForVideo(
                    this.videoElement, 
                    performance.now()
                );

                this.perf.inferenceTimeMs = performance.now() - startTime;
                this.perf.tick();

                // Process results
                if (results.landmarks && results.landmarks.length > 0) {
                    const rawLandmarks = results.landmarks[0];
                    const worldLandmarks = results.worldLandmarks?.[0] || null;

                    // Apply temporal smoothing for medical-grade stability
                    const smoothedLandmarks = this.smoothing.enabled 
                        ? this._applySmoothing(rawLandmarks) 
                        : rawLandmarks;

                    // Calculate clinical biomechanics
                    const angles = ClinicalBiomechanics.calculateAllAngles(smoothedLandmarks);
                    
                    // Track ROM over time
                    for (const [name, data] of Object.entries(angles)) {
                        if (data.angle !== null) {
                            this.romTracker.record(name, data.angle);
                        }
                    }

                    // Calculate quality metrics
                    const quality = this._assessTrackingQuality(smoothedLandmarks);

                    // Emit results
                    if (this.onResultsCallback) {
                        this.onResultsCallback({
                            landmarks: smoothedLandmarks,
                            worldLandmarks,
                            angles,
                            quality,
                            roms: this.romTracker.getAllROMs(),
                            fps: this.perf.fps,
                            inferenceMs: Math.round(this.perf.inferenceTimeMs)
                        });
                    }
                } else {
                    // No detection
                    if (this.onResultsCallback) {
                        this.onResultsCallback({
                            landmarks: null,
                            worldLandmarks: null,
                            angles: {},
                            quality: { overall: 0, keyJoints: 0, isGood: false },
                            roms: {},
                            fps: this.perf.fps,
                            inferenceMs: Math.round(this.perf.inferenceTimeMs)
                        });
                    }
                }
            } catch (error) {
                // Silently skip frame errors (common during camera transitions)
            }
        }

        requestAnimationFrame(() => this._processFrame());
    },

    // Temporal smoothing using exponentially weighted moving average
    _applySmoothing(landmarks) {
        this.smoothing.buffer.push(landmarks.map(l => ({ ...l })));
        if (this.smoothing.buffer.length > this.smoothing.bufferSize) {
            this.smoothing.buffer.shift();
        }

        if (this.smoothing.buffer.length < 2) return landmarks;

        const smoothed = landmarks.map((lm, idx) => {
            let totalWeight = 0;
            let sx = 0, sy = 0, sz = 0, sv = 0;

            for (let i = 0; i < this.smoothing.buffer.length; i++) {
                const weight = Math.pow(this.smoothing.weightDecay, this.smoothing.buffer.length - 1 - i);
                const frame = this.smoothing.buffer[i][idx];
                sx += frame.x * weight;
                sy += frame.y * weight;
                sz += frame.z * weight;
                sv += (frame.visibility || 0) * weight;
                totalWeight += weight;
            }

            return {
                x: sx / totalWeight,
                y: sy / totalWeight,
                z: sz / totalWeight,
                visibility: sv / totalWeight
            };
        });

        return smoothed;
    },

    // Assess tracking quality for clinical confidence
    _assessTrackingQuality(landmarks) {
        if (!landmarks || landmarks.length === 0) {
            return { overall: 0, keyJoints: 0, isGood: false, grade: 'F' };
        }

        const avgVisibility = landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / landmarks.length;

        // Key clinical joints: shoulders, hips, knees, ankles
        const keyIndices = [11, 12, 23, 24, 25, 26, 27, 28];
        const keyJointVisibility = keyIndices.reduce((sum, idx) => 
            sum + (landmarks[idx]?.visibility || 0), 0) / keyIndices.length;

        // Extended joints: elbows, wrists, feet
        const extendedIndices = [13, 14, 15, 16, 29, 30, 31, 32];
        const extendedVisibility = extendedIndices.reduce((sum, idx) => 
            sum + (landmarks[idx]?.visibility || 0), 0) / extendedIndices.length;

        const overall = Math.round(avgVisibility * 100);
        const keyJoints = Math.round(keyJointVisibility * 100);

        let grade = 'F';
        if (keyJoints >= 90) grade = 'A';
        else if (keyJoints >= 75) grade = 'B';
        else if (keyJoints >= 60) grade = 'C';
        else if (keyJoints >= 40) grade = 'D';

        return {
            overall,
            keyJoints,
            extended: Math.round(extendedVisibility * 100),
            isGood: keyJoints >= 70,
            isClinical: keyJoints >= 80,  // Threshold for "medical grade" confidence
            grade
        };
    },

    // Get session summary for clinical documentation
    getSessionSummary() {
        return {
            roms: this.romTracker.getAllROMs(),
            totalFrames: Object.values(this.romTracker.jointHistory)[0]?.length || 0,
            durationEstimate: Math.round((Object.values(this.romTracker.jointHistory)[0]?.length || 0) / 30)
        };
    }
};


// ============================================================================
// Clinical Biomechanics Calculator
// Medical-grade joint angle calculations with 3D vector math
// ============================================================================

const ClinicalBiomechanics = {

    // MediaPipe PoseLandmarker landmark indices
    LANDMARKS: {
        NOSE: 0,
        LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
        RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
        LEFT_EAR: 7, RIGHT_EAR: 8,
        MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
        LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
        LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
        LEFT_WRIST: 15, RIGHT_WRIST: 16,
        LEFT_PINKY: 17, RIGHT_PINKY: 18,
        LEFT_INDEX: 19, RIGHT_INDEX: 20,
        LEFT_THUMB: 21, RIGHT_THUMB: 22,
        LEFT_HIP: 23, RIGHT_HIP: 24,
        LEFT_KNEE: 25, RIGHT_KNEE: 26,
        LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
        LEFT_HEEL: 29, RIGHT_HEEL: 30,
        LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
    },

    // Clinical joint definitions with normal ROM ranges
    JOINT_CONFIGS: [
        { name: 'Left Shoulder',  points: [23, 11, 13], normMin: 0, normMax: 180, category: 'upper' },
        { name: 'Right Shoulder', points: [24, 12, 14], normMin: 0, normMax: 180, category: 'upper' },
        { name: 'Left Elbow',     points: [11, 13, 15], normMin: 0, normMax: 150, category: 'upper' },
        { name: 'Right Elbow',    points: [12, 14, 16], normMin: 0, normMax: 150, category: 'upper' },
        { name: 'Left Hip',       points: [11, 23, 25], normMin: 0, normMax: 125, category: 'lower' },
        { name: 'Right Hip',      points: [12, 24, 26], normMin: 0, normMax: 125, category: 'lower' },
        { name: 'Left Knee',      points: [23, 25, 27], normMin: 0, normMax: 140, category: 'lower' },
        { name: 'Right Knee',     points: [24, 26, 28], normMin: 0, normMax: 140, category: 'lower' },
        { name: 'Left Ankle',     points: [25, 27, 31], normMin: 70, normMax: 120, category: 'lower' },
        { name: 'Right Ankle',    points: [26, 28, 32], normMin: 70, normMax: 120, category: 'lower' },
        { name: 'Trunk Flexion',  points: [12, 24, 26], normMin: 150, normMax: 180, category: 'core' },
    ],

    // 3D angle calculation using dot product
    calculateAngle3D(a, b, c) {
        const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
        const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };

        const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
        const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
        const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

        if (magBA === 0 || magBC === 0) return null;

        const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
        return Math.round(Math.acos(cosAngle) * (180 / Math.PI) * 10) / 10;
    },

    // Calculate all joint angles with clinical status
    calculateAllAngles(landmarks) {
        const angles = {};

        for (const config of this.JOINT_CONFIGS) {
            const [aIdx, bIdx, cIdx] = config.points;
            const a = landmarks[aIdx];
            const b = landmarks[bIdx];
            const c = landmarks[cIdx];

            // Minimum visibility threshold for clinical measurement
            const minVis = 0.5;
            if (!a || !b || !c) continue;
            if ((a.visibility || 0) < minVis || (b.visibility || 0) < minVis || (c.visibility || 0) < minVis) {
                angles[config.name] = { angle: null, status: 'occluded', confidence: 0 };
                continue;
            }

            const angle = this.calculateAngle3D(a, b, c);
            const confidence = Math.min(a.visibility || 0, b.visibility || 0, c.visibility || 0);

            let status = 'normal';
            if (angle < config.normMin) status = 'limited';
            else if (angle > config.normMax) status = 'excessive';

            angles[config.name] = {
                angle,
                status,
                confidence: Math.round(confidence * 100),
                normMin: config.normMin,
                normMax: config.normMax,
                category: config.category
            };
        }

        // Calculate bilateral asymmetry
        const pairs = [
            ['Left Shoulder', 'Right Shoulder'],
            ['Left Elbow', 'Right Elbow'],
            ['Left Hip', 'Right Hip'],
            ['Left Knee', 'Right Knee'],
            ['Left Ankle', 'Right Ankle']
        ];

        for (const [left, right] of pairs) {
            if (angles[left]?.angle != null && angles[right]?.angle != null) {
                const diff = Math.abs(angles[left].angle - angles[right].angle);
                const pairName = left.replace('Left ', '') + ' Asymmetry';
                angles[pairName] = {
                    angle: Math.round(diff * 10) / 10,
                    status: diff > 15 ? 'significant' : diff > 8 ? 'moderate' : 'symmetric',
                    confidence: Math.min(angles[left].confidence, angles[right].confidence),
                    category: 'asymmetry'
                };
            }
        }

        return angles;
    },

    // Detect clinical compensation patterns
    detectCompensations(landmarks, angles) {
        const compensations = [];
        const L = this.LANDMARKS;

        try {
            // 1. Knee Valgus Detection
            const lKnee = landmarks[L.LEFT_KNEE];
            const lAnkle = landmarks[L.LEFT_ANKLE];
            const rKnee = landmarks[L.RIGHT_KNEE];
            const rAnkle = landmarks[L.RIGHT_ANKLE];

            if (lKnee && lAnkle && lKnee.visibility > 0.5 && lAnkle.visibility > 0.5) {
                if (lKnee.x > lAnkle.x + 0.04) {
                    compensations.push({
                        type: 'knee_valgus',
                        side: 'left',
                        severity: 'moderate',
                        description: 'Left knee valgus – knee tracking medially relative to ankle'
                    });
                }
            }
            if (rKnee && rAnkle && rKnee.visibility > 0.5 && rAnkle.visibility > 0.5) {
                if (rKnee.x < rAnkle.x - 0.04) {
                    compensations.push({
                        type: 'knee_valgus',
                        side: 'right',
                        severity: 'moderate',
                        description: 'Right knee valgus – knee tracking medially relative to ankle'
                    });
                }
            }

            // 2. Forward Trunk Lean
            const lShoulder = landmarks[L.LEFT_SHOULDER];
            const lHip = landmarks[L.LEFT_HIP];
            if (lShoulder && lHip && lShoulder.visibility > 0.5 && lHip.visibility > 0.5) {
                const dx = lShoulder.x - lHip.x;
                const dy = lShoulder.y - lHip.y;
                const trunkAngle = Math.atan2(Math.abs(dx), Math.abs(dy)) * (180 / Math.PI);
                if (trunkAngle > 25) {
                    compensations.push({
                        type: 'forward_lean',
                        side: 'bilateral',
                        severity: trunkAngle > 40 ? 'severe' : 'moderate',
                        description: `Excessive forward trunk lean (${Math.round(trunkAngle)}°) – possible core weakness or hip mobility limitation`
                    });
                }
            }

            // 3. Shoulder Height Asymmetry
            const rShoulder = landmarks[L.RIGHT_SHOULDER];
            if (lShoulder && rShoulder && lShoulder.visibility > 0.5 && rShoulder.visibility > 0.5) {
                const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y);
                if (shoulderDiff > 0.06) {
                    compensations.push({
                        type: 'shoulder_asymmetry',
                        side: lShoulder.y < rShoulder.y ? 'left_elevated' : 'right_elevated',
                        severity: shoulderDiff > 0.12 ? 'severe' : 'moderate',
                        description: 'Shoulder height asymmetry – possible lateral trunk lean or upper trap dominance'
                    });
                }
            }

            // 4. Pelvic Obliquity
            const rHip = landmarks[L.RIGHT_HIP];
            if (lHip && rHip && lHip.visibility > 0.5 && rHip.visibility > 0.5) {
                const hipDiff = Math.abs(lHip.y - rHip.y);
                if (hipDiff > 0.06) {
                    compensations.push({
                        type: 'pelvic_obliquity',
                        side: lHip.y < rHip.y ? 'left_elevated' : 'right_elevated',
                        severity: hipDiff > 0.12 ? 'severe' : 'moderate',
                        description: 'Pelvic obliquity detected – uneven hip heights'
                    });
                }
            }

            // 5. Head Forward Posture
            const nose = landmarks[L.NOSE];
            if (nose && lShoulder && rShoulder) {
                const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
                const headForward = nose.x - midShoulderX;
                if (Math.abs(headForward) > 0.08) {
                    compensations.push({
                        type: 'head_forward',
                        side: 'bilateral',
                        severity: 'mild',
                        description: 'Forward head posture detected – cervical spine may be in flexion'
                    });
                }
            }

        } catch (e) {
            // Silently handle missing landmarks
        }

        return compensations;
    }
};


// ============================================================================
// Enhanced Skeleton Renderer with Clinical Overlays
// ============================================================================

const ClinicalRenderer = {

    // Color palette for clinical visualization
    COLORS: {
        bone: '#00e5ff',
        boneGood: '#00e676',
        boneFair: '#ffab00',
        bonePoor: '#ff1744',
        joint: '#ffffff',
        jointKey: '#00e5ff',
        angleText: '#ffffff',
        angleBg: 'rgba(0,0,0,0.75)',
        asymmetryWarning: '#ff6d00',
        compensationAlert: '#ff1744',
        romBar: '#00e5ff',
        romBarBg: 'rgba(255,255,255,0.1)'
    },

    // MediaPipe pose connections for skeleton drawing
    CONNECTIONS: [
        [11, 12],           // shoulders
        [11, 13], [13, 15], // left arm
        [12, 14], [14, 16], // right arm
        [11, 23], [12, 24], // torso
        [23, 24],           // hips
        [23, 25], [25, 27], // left leg
        [24, 26], [26, 28], // right leg
        [27, 29], [29, 31], // left foot
        [28, 30], [30, 32], // right foot
    ],

    draw(ctx, canvas, data, options = {}) {
        const { landmarks, angles, quality, roms, fps, inferenceMs, compensations } = data;
        const { showAngles = true, showROM = true, showCompensations = true } = options;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks) {
            this._drawNoDetection(ctx, canvas);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;

        // Draw connections (bones)
        this._drawBones(ctx, landmarks, quality, w, h);

        // Draw joints
        this._drawJoints(ctx, landmarks, w, h);

        // Draw angle labels on key joints
        if (showAngles && angles) {
            this._drawAngleLabels(ctx, landmarks, angles, w, h);
        }

        // Draw quality HUD
        this._drawHUD(ctx, canvas, quality, fps, inferenceMs);

        // Draw ROM bars
        if (showROM && roms && Object.keys(roms).length > 0) {
            this._drawROMPanel(ctx, canvas, roms);
        }

        // Draw compensation alerts
        if (showCompensations && compensations && compensations.length > 0) {
            this._drawCompensationAlerts(ctx, canvas, compensations);
        }
    },

    _drawBones(ctx, landmarks, quality, w, h) {
        for (const [start, end] of this.CONNECTIONS) {
            const a = landmarks[start];
            const b = landmarks[end];
            if (!a || !b) continue;
            if ((a.visibility || 0) < 0.4 || (b.visibility || 0) < 0.4) continue;

            const conf = Math.min(a.visibility || 0, b.visibility || 0);
            const color = conf > 0.8 ? this.COLORS.boneGood :
                          conf > 0.6 ? this.COLORS.boneFair : this.COLORS.bonePoor;

            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.strokeStyle = color;
            ctx.lineWidth = conf > 0.8 ? 4 : 3;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    },

    _drawJoints(ctx, landmarks, w, h) {
        const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

        landmarks.forEach((lm, idx) => {
            if ((lm.visibility || 0) < 0.4) return;
            const x = lm.x * w;
            const y = lm.y * h;
            const isKey = keyJoints.includes(idx);
            const radius = isKey ? 6 : 3;

            // Outer glow for key joints
            if (isKey) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = isKey ? this.COLORS.jointKey : this.COLORS.joint;
            ctx.fill();
        });
    },

    _drawAngleLabels(ctx, landmarks, angles, w, h) {
        // Map joint names to their vertex landmark index for label placement
        const labelMap = {
            'Left Shoulder': 11, 'Right Shoulder': 12,
            'Left Elbow': 13, 'Right Elbow': 14,
            'Left Hip': 23, 'Right Hip': 24,
            'Left Knee': 25, 'Right Knee': 26,
            'Left Ankle': 27, 'Right Ankle': 28,
        };

        ctx.font = 'bold 11px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';

        for (const [name, idx] of Object.entries(labelMap)) {
            const data = angles[name];
            if (!data || data.angle === null) continue;

            const lm = landmarks[idx];
            if (!lm || (lm.visibility || 0) < 0.5) continue;

            const x = lm.x * w;
            const y = lm.y * h - 18;
            const text = `${data.angle}°`;

            // Background pill
            const textWidth = ctx.measureText(text).width + 10;
            ctx.fillStyle = data.status === 'normal' ? 'rgba(0,230,118,0.85)' :
                           data.status === 'limited' ? 'rgba(255,171,0,0.85)' :
                           'rgba(255,23,68,0.85)';
            ctx.beginPath();
            ctx.roundRect(x - textWidth / 2, y - 9, textWidth, 18, 9);
            ctx.fill();

            // Text
            ctx.fillStyle = '#fff';
            ctx.fillText(text, x, y + 4);
        }
    },

    _drawHUD(ctx, canvas, quality, fps, inferenceMs) {
        const x = 12;
        const y = 12;
        const w = 170;
        const h = 72;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();

        // Grade badge
        const gradeColors = { A: '#00e676', B: '#69f0ae', C: '#ffab00', D: '#ff6d00', F: '#ff1744' };
        const gradeColor = gradeColors[quality.grade] || '#ff1744';
        ctx.fillStyle = gradeColor;
        ctx.font = 'bold 22px Inter, Arial, sans-serif';
        ctx.fillText(quality.grade, x + 16, y + 30);

        // Stats
        ctx.fillStyle = '#b0bec5';
        ctx.font = '11px Inter, Arial, sans-serif';
        ctx.fillText(`Quality: ${quality.keyJoints}%`, x + 44, y + 24);
        ctx.fillText(`FPS: ${fps}  |  ${inferenceMs}ms`, x + 44, y + 40);
        ctx.fillText(quality.isClinical ? '● Clinical Grade' : '○ Below Clinical',
            x + 16, y + 60);
        ctx.fillStyle = quality.isClinical ? '#00e676' : '#ff6d00';
        ctx.fillText(quality.isClinical ? '●' : '○', x + 16, y + 60);
    },

    _drawROMPanel(ctx, canvas, roms) {
        const panelX = canvas.width - 200;
        const panelY = 12;
        const barWidth = 130;
        const barHeight = 8;
        const lineHeight = 22;

        // Only show key joints
        const display = ['Left Knee', 'Right Knee', 'Left Hip', 'Right Hip', 'Left Shoulder', 'Right Shoulder'];
        const filtered = display.filter(name => roms[name]);

        if (filtered.length === 0) return;

        const totalHeight = filtered.length * lineHeight + 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 185, totalHeight, 8);
        ctx.fill();

        ctx.font = 'bold 10px Inter, Arial, sans-serif';
        ctx.fillStyle = '#b0bec5';
        ctx.fillText('LIVE ROM', panelX + 8, panelY + 14);

        filtered.forEach((name, i) => {
            const rom = roms[name];
            const y = panelY + 24 + i * lineHeight;

            // Label
            ctx.fillStyle = '#eceff1';
            ctx.font = '10px Inter, Arial, sans-serif';
            ctx.fillText(name.replace('Left ', 'L ').replace('Right ', 'R '), panelX + 8, y + 4);

            // ROM bar background
            ctx.fillStyle = this.COLORS.romBarBg;
            ctx.fillRect(panelX + 60, y - 4, barWidth, barHeight);

            // ROM bar fill (normalized to 180°)
            const fillWidth = (rom.range / 180) * barWidth;
            ctx.fillStyle = rom.range > 100 ? '#00e676' : rom.range > 60 ? '#ffab00' : '#ff1744';
            ctx.fillRect(panelX + 60, y - 4, fillWidth, barHeight);

            // Value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Inter, Arial, sans-serif';
            ctx.fillText(`${rom.range}°`, panelX + 60 + barWidth + 4, y + 4);
        });
    },

    _drawCompensationAlerts(ctx, canvas, compensations) {
        const x = 12;
        let y = canvas.height - 12 - compensations.length * 28;

        compensations.forEach((comp) => {
            const color = comp.severity === 'severe' ? 'rgba(255,23,68,0.85)' :
                         comp.severity === 'moderate' ? 'rgba(255,109,0,0.85)' :
                         'rgba(255,171,0,0.85)';

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, y, Math.min(canvas.width - 24, 420), 24, 6);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '11px Inter, Arial, sans-serif';
            ctx.fillText(`⚠ ${comp.description}`, x + 8, y + 16);
            y += 28;
        });
    },

    _drawNoDetection(ctx, canvas) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff6d00';
        ctx.font = 'bold 18px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No person detected', canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = '#b0bec5';
        ctx.font = '14px Inter, Arial, sans-serif';
        ctx.fillText('Step into frame – ensure full body is visible', canvas.width / 2, canvas.height / 2 + 16);
        ctx.textAlign = 'left';
    }
};


// ============================================================================
// Export to global scope
// ============================================================================
window.MedicalPoseEngine = MedicalPoseEngine;
window.ClinicalBiomechanics = ClinicalBiomechanics;
window.ClinicalRenderer = ClinicalRenderer;

console.log('✅ PhysioMotion Medical-Grade Pose Engine v2 loaded');
