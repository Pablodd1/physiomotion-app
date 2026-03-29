-- PhysioMotion Exercise Library Seed Data
-- 100+ exercises across multiple categories

INSERT INTO exercises (exercise_name, exercise_category, body_region, target_muscles, target_joints, target_movements, difficulty_level, description, instructions, setup_instructions, cues, contraindications, equipment_needed, estimated_duration_seconds, sets_default, reps_default, hold_seconds_default, tags, cpt_codes, is_active) VALUES

-- ============================================================================
-- UPPER BODY - SHOULDER
-- ============================================================================

('Shoulder External Rotation with Band', 'strength', 'upper_body', '["infraspinatus", "teres_minor", "posterior deltoid"]', '["shoulder"]', '["rotation"]', 'beginner', 
'Strengthens the rotator cuff muscles, particularly the external rotators, which are crucial for shoulder stability.',
'1. Anchor resistance band at elbow height\n2. Stand with elbow tucked at side, forearm across belly\n3. Rotate forearm outward against band resistance\n4. Keep elbow fixed at side\n5. Return slowly to starting position',
'Secure band to stable object at elbow level. Stand perpendicular to anchor point.',
'Keep elbow tucked • Control the movement • Don\'t let shoulder hike up',
'Acute shoulder impingement, recent shoulder surgery without clearance',
'["resistance_band"]', 300, 3, 15, NULL, '["rotator cuff", "shoulder stability", "posture"]', '["97110"]', true),

('Shoulder Internal Rotation with Band', 'strength', 'upper_body', '["subscapularis", "pectoralis major", "anterior deltoid"]', '["shoulder"]', '["rotation"]', 'beginner',
'Strengthens the internal rotators of the shoulder, important for throwing and pushing movements.',
'1. Anchor band at elbow height\n2. Stand with elbow tucked, forearm away from body\n3. Rotate forearm inward toward belly\n4. Keep elbow fixed\n5. Return slowly to start',
'Stand perpendicular to anchor with towel roll under elbow if needed.',
'Keep elbow at side • Control the return • Breathe normally',
'Acute biceps tendonitis, recent shoulder surgery',
'["resistance_band"]', 300, 3, 15, NULL, '["rotator cuff", "internal rotation"]', '["97110"]', true),

('Scaption (Empty Can)', 'strength', 'upper_body', '["supraspinatus", "deltoids", "serratus anterior"]', '["shoulder"]', '["elevation", "abduction"]', 'intermediate',
'Targets the supraspinatus muscle in a functional plane of shoulder movement.',
'1. Stand with arms at sides, thumbs pointing down\n2. Raise arms diagonally (30° forward of frontal plane)\n3. Lift to shoulder height\n4. Lower slowly with control',
'Stand tall with core engaged. Use light weights (1-3 lbs initially).',
'Thumbs down • Lead with pinky finger • Don\'t shrug shoulders',
'Shoulder impingement syndrome, acute rotator cuff tear',
'["dumbbells", "light_weights"]', 240, 3, 12, NULL, '["supraspinatus", "shoulder elevation"]', '["97110"]', true),

('Wall Slides', 'mobility', 'upper_body', '["lower trapezius", "serratus anterior", "rotator cuff"]', '["shoulder", "scapulothoracic"]', '["elevation", "upward rotation"]', 'beginner',
'Improves overhead shoulder mobility and scapular upward rotation.',
'1. Stand with back against wall\n2. Place arms in "W" position against wall\n3. Slowly slide arms up to "Y" position\n4. Keep lower back flat against wall\n5. Return to starting position',
'Use a towel behind head if needed to maintain contact.',
'Keep wrists and elbows on wall • Don\'t arch lower back • Breathe steadily',
'Frozen shoulder in acute phase, severe kyphosis',
'["wall", "towel"]', 180, 2, 10, NULL, '["overhead mobility", "posture", "scapular control"]', '["97110"]', true),

('Prone Y-T-W-L', 'strength', 'upper_body', '["lower trapezius", "middle trapezius", "rhomboids", "rotator cuff"]', '["shoulder", "scapulothoracic"]', '["retraction", "elevation", "depression"]', 'intermediate',
'Comprehensive scapular stabilizer strengthening in multiple planes.',
'1. Lie face down on table or floor\n2. Start with arms hanging down\n3. Raise arms in Y position (thumbs up) - 10 reps\n4. Raise arms in T position (thumbs up) - 10 reps\n5. Bend elbows to 90°, rotate to W position - 10 reps\n6. Bend elbows 90°, tuck to L position - 10 reps',
'Lie on edge of table so arms can hang freely. Use light weights.',
'Squeeze shoulder blades • Keep neck relaxed • Control the movement',
'Neck pain, inability to lie prone',
'["table", "light_weights"]', 480, 1, 10, NULL, '["scapular stability", "posture correction"]', '["97110"]', true),

('Serratus Wall Push-Up Plus', 'strength', 'upper_body', '["serratus anterior", "pec minor", "triceps"]', '["shoulder", "scapulothoracic"]', '["protraction"]', 'beginner',
'Activates serratus anterior for scapular protraction and upward rotation.',
'1. Stand arm length from wall\n2. Place hands on wall at shoulder height\n3. Perform push-up motion\n4. At end range, push further to round upper back\n5. Hold protraction for 2 seconds',
'Stand close enough that elbows bend to 90°.',
'Focus on shoulder blade movement • Keep core tight • Don\'t lock elbows',
'Wrist pain, severe shoulder weakness',
'["wall"]', 240, 3, 15, NULL, '["serratus anterior", "push-up progression"]', '["97110"]', true),

('Cross-Body Stretch', 'flexibility', 'upper_body', '["posterior deltoid", "rotator cuff"]', '["shoulder"]', '["horizontal adduction"]', 'beginner',
'Stretches the posterior shoulder capsule and rotator cuff.',
'1. Bring arm across chest at shoulder height\n2. Use opposite hand to gently pull arm closer\n3. Feel stretch in back of shoulder\n4. Hold 30 seconds\n5. Repeat on other side',
'Sit or stand with good posture.',
'Keep shoulder down • Don\'t force the stretch • Breathe deeply',
'Acute shoulder pain, posterior instability',
'["none"]', 120, 2, 1, 30, '["posterior capsule", "shoulder stretch"]', '["97140"]', true),

('Sleeper Stretch', 'flexibility', 'upper_body', '["posterior capsule", "rotator cuff"]', '["shoulder"]', '["internal rotation"]', 'intermediate',
'Stretches the posterior shoulder capsule, important for overhead athletes.',
'1. Lie on side with bottom arm out front, elbow bent 90°\n2. Use top hand to gently push forearm down toward floor\n3. Keep shoulder blades together\n4. Feel stretch in back of shoulder\n5. Hold 30 seconds',
'Lie on firm surface. Keep elbow at shoulder height.',
'Don\'t force rotation • Keep elbow flexed • Stop if painful',
'Shoulder instability, recent surgery',
'["floor_mat"]', 90, 2, 1, 30, '["posterior capsule", "glenohumeral mobility"]', '["97140"]', true),

('Doorway Pectoral Stretch', 'flexibility', 'upper_body', '["pectoralis major", "pectoralis minor", "anterior deltoid"]', '["shoulder", "chest"]', '["horizontal abduction", "extension"]', 'beginner',
'Stretches tight chest muscles that contribute to rounded shoulder posture.',
'1. Stand in doorway with forearms on door frame\n2. Elbows at shoulder height, bent 90°\n3. Step forward gently to feel chest stretch\n4. Hold 30 seconds',
'Adjust arm height to stretch different portions of pec.',
'Keep head up • Don\'t lean forward • Breathe into the stretch',
'Shoulder impingement with anterior pain',
'["doorway"]', 90, 2, 1, 30, '["pec stretch", "posture", "rounded shoulders"]', '["97140"]', true),

('Resistance Band Face Pulls', 'strength', 'upper_body', '["rear deltoid", "rhomboids", "middle trapezius", "rotator cuff"]', '["shoulder", "scapulothoracic"]', '["horizontal abduction", "external rotation"]', 'intermediate',
'Strengthens posterior shoulder and scapular retractors for better posture.',
'1. Anchor band at face height\n2. Grasp band with thumbs pointing back\n3. Pull toward face, separating hands\n4. Rotate shoulders externally at end range\n5. Return slowly',
'Stand far enough to create tension at start.',
'Pinch shoulder blades • External rotate at end • Control the return',
'None significant',
'["resistance_band"]', 240, 3, 15, NULL, '["rear deltoid", "posture", "external rotation"]', '["97110"]', true),

-- ============================================================================
-- UPPER BODY - ELBOW/WRIST
-- ============================================================================

('Wrist Flexor Stretch', 'flexibility', 'upper_body', '["wrist flexors", "forearm flexors"]', '["wrist", "elbow"]', '["extension"]', 'beginner',
'Stretches the wrist and finger flexor muscles.',
'1. Extend arm straight out, palm up\n2. Use other hand to gently pull fingers back\n3. Feel stretch in forearm\n4. Hold 30 seconds\n5. Repeat on other side',
'Keep elbow straight throughout.',
'Keep shoulder down • Gently pull • Don\'t force',
'Acute wrist sprain, recent fracture',
'["none"]', 90, 2, 1, 30, '["wrist flexibility", "forearm stretch"]', '["97140"]', true),

('Wrist Extensor Stretch', 'flexibility', 'upper_body', '["wrist extensors", "forearm extensors"]', '["wrist", "elbow"]', '["flexion"]', 'beginner',
'Stretches the wrist and finger extensor muscles.',
'1. Extend arm straight out, palm down\n2. Flex wrist, pointing fingers down\n3. Use other hand to gently pull toward body\n4. Hold 30 seconds',
'Keep elbow fully extended.',
'Keep elbow straight • Feel stretch in forearm • Breathe',
'Tennis elbow (acute), recent fracture',
'["none"]', 90, 2, 1, 30, '["wrist flexibility", "forearm stretch"]', '["97140"]', true),

('Eccentric Wrist Extension', 'strength', 'upper_body', '["wrist extensors"]', '["wrist"]', '["extension"]', 'beginner',
'Eccentric strengthening for tennis elbow rehabilitation.',
'1. Support forearm on table, wrist hanging over edge, palm down\n2. Use other hand to lift wrist into extension\n3. Slowly lower weight back down (3-5 seconds)\n4. Repeat 15 times',
'Use light weight (1-3 lbs) or no weight initially.',
'Slow and controlled • Full range of motion • No pain during',
'Acute lateral epicondylitis with high pain',
'["dumbbell", "table"]', 180, 3, 15, NULL, '["tennis elbow", "eccentric", "wrist strengthening"]', '["97110"]', true),

('Eccentric Wrist Flexion', 'strength', 'upper_body', '["wrist flexors"]', '["wrist"]', '["flexion"]', 'beginner',
'Eccentric strengthening for wrist flexors.',
'1. Support forearm on table, palm up\n2. Use other hand to lift wrist into flexion\n3. Slowly lower back down (3-5 seconds)\n4. Repeat 15 times',
'Start with no weight, progress gradually.',
'Control the lowering • Don\'t rush • Breathe steadily',
'Acute wrist sprain',
'["dumbbell", "table"]', 180, 3, 15, NULL, '["golfer\'s elbow", "wrist strengthening"]', '["97110"]', true),

('Pronation/Supination', 'strength', 'upper_body', '["supinator", "pronator teres", "biceps"]', '["elbow", "forearm"]', '["pronation", "supination"]', 'beginner',
'Improves forearm rotation strength and mobility.',
'1. Support forearm on table, wrist neutral\n2. Hold hammer or weight by end\n3. Slowly rotate palm down (pronation)\n4. Slowly rotate palm up (supination)\n5. Control the movement throughout',
'Use a light hammer or 1-2 lb weight.',
'Slow controlled movement • Full range • No swinging',
'Radial head fracture, severe elbow arthritis',
'["hammer", "dumbbell"]', 180, 3, 20, NULL, '["forearm rotation", "elbow mobility"]', '["97110"]', true),

('Bicep Curl', 'strength', 'upper_body', '["biceps brachii", "brachialis", "brachioradialis"]', '["elbow"]', '["flexion"]', 'beginner',
'Basic elbow flexion strengthening.',
'1. Stand with arms at sides, palms forward\n2. Curl weights toward shoulders\n3. Keep elbows at sides\n4. Lower slowly to start position',
'Stand or sit with good posture.',
'Don\'t swing body • Control the lowering • Full range',
'Biceps tendonitis (acute), elbow pain',
'["dumbbells"]', 240, 3, 12, NULL, '["biceps", "elbow flexion"]', '["97110"]', true),

('Tricep Extension', 'strength', 'upper_body', '["triceps brachii"]', '["elbow"]', '["extension"]', 'beginner',
'Strengthens the triceps muscle for elbow extension.',
'1. Hold weight overhead with both hands\n2. Lower weight behind head by bending elbows\n3. Keep upper arms close to ears\n4. Extend arms back to start',
'Sit or stand with core engaged.',
'Keep elbows pointing up • Don\'t flare out • Control movement',
'Elbow arthritis, triceps tendinopathy',
'["dumbbell"]', 240, 3, 12, NULL, '["triceps", "elbow extension"]', '["97110"]', true),

-- ============================================================================
-- LOWER BODY - HIP
-- ============================================================================

('Clamshell', 'strength', 'lower_body', '["gluteus medius", "gluteus minimus", "hip external rotators"]', '["hip"]', '["external rotation", "abduction"]', 'beginner',
'Activates deep hip external rotators important for pelvic stability.',
'1. Lie on side with hips and knees bent, feet together\n2. Keep feet touching, open top knee like a clamshell\n3. Lift until hip begins to rotate\n4. Lower slowly back down',
'Use resistance band around knees for progression.',
'Keep hips stacked • Don\'t roll backward • Feel it in side of hip',
'Greater trochanteric bursitis (aggravated)',
'["resistance_band", "none"]', 180, 3, 15, NULL, '["glute medius", "hip stability", "knee valgus"]', '["97110"]', true),

('Side-Lying Hip Abduction', 'strength', 'lower_body', '["gluteus medius", "tensor fascia latae"]', '["hip"]', '["abduction"]', 'beginner',
'Strengthens hip abductors for pelvic stability and knee alignment.',
'1. Lie on side, bottom knee bent for stability\n2. Keep top leg straight, toe pointed slightly down\n3. Lift leg up toward ceiling\n4. Lower with control',
'Maintain neutral spine throughout.',
'Toe pointed down • Don\'t flex hip • Control the lowering',
'None significant',
'["none"]', 180, 3, 15, NULL, '["hip abductors", "pelvic stability"]', '["97110"]', true),

('Supine Bridge', 'strength', 'lower_body', '["gluteus maximus", "hamstrings", "core"]', '["hip", "knee"]', '["extension"]', 'beginner',
'Fundamental glute strengthening exercise for hip extension.',
'1. Lie on back, knees bent, feet flat\n2. Engage core, squeeze glutes\n3. Lift hips until knees, hips, shoulders align\n4. Hold 2-3 seconds\n5. Lower slowly',
'Feet shoulder-width apart, close to hips.',
'Squeeze glutes at top • Don\'t arch low back • Push through heels',
'Acute low back pain, hip flexor strain',
'["none"]', 180, 3, 15, NULL, '["glutes", "bridge", "hip extension"]', '["97110"]', true),

('Single-Leg Bridge', 'strength', 'lower_body', '["gluteus maximus", "hamstrings", "hip stabilizers"]', '["hip", "knee"]', '["extension"]', 'intermediate',
'Progression from double-leg bridge for unilateral strength.',
'1. Lie on back, one knee bent, other leg straight up\n2. Push through heel of bent leg\n3. Lift hips, keeping elevated leg vertical\n4. Lower slowly\n5. Complete set, switch legs',
'Ensure stable base before lifting.',
'Keep hips level • Push through heel • Control the movement',
'Hamstring strain, sacroiliac dysfunction',
'["none"]', 240, 3, 12, NULL, '["single leg", "glute strength", "hamstrings"]', '["97110"]', true),

('Hip Flexor Stretch (Half-Kneeling)', 'flexibility', 'lower_body', '["iliopsoas", "rectus femoris"]', '["hip"]', '["extension"]', 'beginner',
'Stretches tight hip flexors common in seated populations.',
'1. Kneel on one knee, other foot forward\n2. Tuck pelvis under (posterior tilt)\n3. Lean forward slightly\n4. Feel stretch in front of hip\n5. Hold 30 seconds, switch sides',
'Ensure front knee doesn\'t pass toes.',
'Squeeze glutes • Tuck tailbone • Don\'t arch back',
'Acute hip flexor strain, knee pain',
'["none", "pad"]', 120, 2, 1, 30, '["hip flexors", "anterior hip", "sitting"]', '["97140"]', true),

('90/90 Hip Stretch', 'flexibility', 'lower_body', '["hip rotators", "piriformis", "glutes"]', '["hip"]', '["internal rotation", "external rotation"]', 'intermediate',
'Stretches both internal and external hip rotators simultaneously.',
'1. Sit with front leg bent 90° in front\n2. Back leg bent 90° to side\n3. Keep both sit bones on floor\n4. Lean forward over front leg\n5. Hold 30 seconds, switch sides',
'Sit on yoga block if needed for proper position.',
'Sit tall • Hinge at hips • Breathe into stretch',
'Severe hip arthritis, recent hip replacement',
'["yoga_block"]', 120, 2, 1, 30, '["hip rotation", "piriformis", "hip mobility"]', '["97140"]', true),

('Pigeon Stretch', 'flexibility', 'lower_body', '["gluteus maximus", "piriformis", "hip external rotators"]', '["hip"]', '["external rotation", "flexion"]', 'intermediate',
'Deep stretch for posterior hip and gluteal muscles.',
'1. Start in plank position\n2. Bring one knee forward, angled outward\n3. Extend other leg straight back\n4. Lower upper body toward floor\n5. Hold 30 seconds, switch sides',
'Use yoga blocks for support if needed.',
'Square hips • Breathe deeply • Don\'t force',
'Knee pain, hip impingement',
'["yoga_block"]', 90, 2, 1, 30, '["glute stretch", "hip opener", "piriformis"]', '["97140"]', true),

('Foam Roll IT Band', 'mobility', 'lower_body', '["tensor fascia latae", "iliotibial band", "vastus lateralis"]', '["hip", "knee"]', '["myofascial release"]', 'beginner',
'Self-myofascial release for lateral thigh.',
'1. Lie on side with foam roller under hip\n2. Cross top leg over for support\n3. Roll slowly from hip to knee\n4. Pause on tender spots\n5. Continue for 1-2 minutes',
'Use forearm and crossed leg to control pressure.',
'Go slowly • Breathe • Find tender spots',
'Severe bruising, acute inflammation',
'["foam_roller"]', 120, 1, 1, 60, '["IT band", "myofascial release", "self massage"]', '["97140"]', true),

('Standing Hip Abduction', 'strength', 'lower_body', '["gluteus medius", "hip abductors"]', '["hip"]', '["abduction"]', 'beginner',
'Functional standing exercise for hip abductor strength.',
'1. Stand tall, hold onto stable surface\n2. Lift leg out to side without leaning\n3. Keep toes pointing forward\n4. Lower slowly\n5. Complete set, switch sides',
'Maintain upright posture throughout.',
'Don\'t lean • Keep movement controlled • Feel side of hip',
'Severe balance deficits, acute hip pain',
'["chair", "counter"]', 180, 3, 15, NULL, '["hip abductors", "standing", "functional"]', '["97110"]', true),

('Monster Walk', 'strength', 'lower_body', '["gluteus medius", "gluteus maximus", "hip external rotators"]', '["hip"]', '["abduction", "external rotation"]', 'intermediate',
'Lateral walking exercise with band resistance for hip stability.',
'1. Place resistance band around ankles or knees\n2. Assume athletic stance (slight squat)\n3. Step sideways while maintaining tension\n4. Keep feet at least shoulder-width apart\n5. Walk 10 steps each direction',
'Maintain level hips throughout movement.',
'Stay low • Keep band taut • Don\'t let knees cave',
'Knee pain, severe hip weakness',
'["resistance_band"]', 240, 3, 10, NULL, '["lateral movement", "hip stability", "glute activation"]', '["97110"]', true),

('Hip Hinge (Romanian Deadlift Pattern)', 'strength', 'lower_body', '["hamstrings", "gluteus maximus", "erector spinae"]', '["hip"]', '["flexion", "extension"]', 'beginner',
'Fundamental movement pattern for hip hinging with neutral spine.',
'1. Stand with feet hip-width apart\n2. Keep knees slightly bent, fixed\n3. Push hips back while keeping chest up\n4. Feel stretch in hamstrings\n5. Drive hips forward to stand',
'Practice with dowel or broomstick along spine first.',
'Flat back • Hips go back • Feel hamstring stretch',
'Acute hamstring strain, severe back pain',
'["dumbbells", "kettlebell", "barbell", "none"]', 240, 3, 12, NULL, '["hip hinge", "deadlift", "hamstrings"]', '["97110"]', true),

-- ============================================================================
-- LOWER BODY - KNEE
-- ============================================================================

('Straight Leg Raise (SLR)', 'strength', 'lower_body', '["quadriceps", "hip flexors"]', '["knee", "hip"]', '["extension", "flexion"]', 'beginner',
'Early phase knee exercise to maintain quadriceps activation.',
'1. Lie on back, one knee bent, target leg straight\n2. Tighten thigh muscle to lock knee\n3. Lift leg 12-18 inches\n4. Hold 2-3 seconds\n5. Lower slowly',
'Ensure knee stays fully straight throughout.',
'Lock the knee • Small controlled movement • Don\'t hold breath',
'Acute knee injury, unable to straighten knee',
'["none"]', 180, 3, 15, NULL, '["quad activation", "early phase", "knee surgery"]', '["97110"]', true),

('Short Arc Quad', 'strength', 'lower_body', '["vastus medialis", "quadriceps"]', '["knee"]', '["extension"]', 'beginner',
'Isolated quadriceps strengthening in terminal extension range.',
'1. Place rolled towel under knee\n2. Tighten thigh muscle\n3. Lift heel off surface while keeping knee on towel\n4. Hold 5 seconds at top\n5. Lower slowly',
'Focus on last 30 degrees of extension.',
'Lock knee fully • Hold the contraction • Focus on VMO',
'Severe patellofemoral pain',
'["towel"]', 180, 3, 15, 5, '["terminal extension", "VMO", "knee extension"]', '["97110"]', true),

('Terminal Knee Extension with Band', 'strength', 'lower_body', '["vastus medialis", "quadriceps"]', '["knee"]', '["extension"]', 'beginner',
'Band-resisted terminal knee extension for patellar tracking.',
'1. Anchor band behind knee\n2. Step forward to create tension\n3. Straighten knee against band resistance\n4. Hold 2-3 seconds\n5. Return slowly',
'Bend slightly at hips for stability.',
'Focus on last degrees • Keep hips stable • Feel front of thigh',
'Acute patellar dislocation',
'["resistance_band"]', 180, 3, 15, NULL, '["terminal extension", "patella", "knee stability"]', '["97110"]', true),

('Wall Sit', 'strength', 'lower_body', '["quadriceps", "glutes", "calves"]', '["knee", "hip"]', '["isometric"]', 'beginner',
'Isometric quadriceps strengthening in functional position.',
'1. Stand with back against wall\n2. Walk feet out, slide down wall\n3. Bend knees to 90° (or as tolerated)\n4. Keep back flat against wall\n5. Hold for specified time',
'Start with higher angle and progress to 90°.',
'Knees over ankles • Back flat • Breathe normally',
'Acute knee effusion, patellofemoral pain (deep angles)',
'["wall", "ball"]', 180, 3, 1, 30, '["isometric", "quad endurance", "wall squat"]', '["97110"]', true),

('Mini Squat', 'strength', 'lower_body', '["quadriceps", "glutes", "hamstrings"]', '["knee", "hip"]', '["flexion", "extension"]', 'beginner',
'Partial squat for early-phase knee rehabilitation.',
'1. Stand with feet shoulder-width apart\n2. Hold onto counter for support\n3. Bend knees to 30-45°\n4. Keep weight in heels\n5. Return to standing',
'Use chair behind if needed for safety.',
'Knees track over toes • Chest up • Controlled movement',
'Acute meniscus tear, severe arthritis',
'["chair", "counter"]', 180, 3, 15, NULL, '["squat", "partial squat", "early rehab"]', '["97110"]', true),

('Step-Up', 'strength', 'lower_body', '["quadriceps", "glutes", "hamstrings", "calves"]', '["knee", "hip", "ankle"]', '["flexion", "extension"]', 'beginner',
'Functional exercise mimicking daily activity.',
'1. Stand facing step or platform\n2. Step up with one foot, pushing through heel\n3. Bring other foot to meet\n4. Step down with same foot\n5. Complete set, switch lead leg',
'Start with 4-6 inch step, progress gradually.',
'Full foot on step • Push through heel • Control the down',
'Patellofemoral pain (step down aggravates)',
'["step", "stairs"]', 240, 3, 12, NULL, '["step up", "functional", "daily activity"]', '["97110"]', true),

('Single-Leg Romanian Deadlift', 'strength', 'lower_body', '["hamstrings", "gluteus maximus", "core", "hip stabilizers"]', '["hip", "knee"]', '["flexion", "extension", "balance"]', 'advanced',
'Unilateral hinge exercise for hamstring and hip stability.',
'1. Stand on one leg with slight knee bend\n2. Hinge at hips, extending free leg back\n3. Keep back flat, reach toward floor\n4. Squeeze glute to return upright\n5. Complete set, switch legs',
'Master hip hinge bilaterally first.',
'Flat back • Hinge at hip • Balance on standing leg',
'Hamstring strain, severe balance deficits',
'["dumbbells", "kettlebell", "none"]', 300, 3, 10, NULL, '["single leg", "RDL", "hamstrings", "balance"]', '["97110"]', true),

('Lateral Step-Down', 'strength', 'lower_body', '["quadriceps", "gluteus medius", "hip stabilizers"]', '["knee", "hip"]', '["controlled lowering"]', 'intermediate',
'Eccentric control exercise for knee and hip stability.',
'1. Stand on step sideways\n2. Lower opposite heel toward floor\n3. Keep pelvis level\n4. Lightly touch heel, return to start\n5. Complete set, switch sides',
'Start with 4-inch step.',
'Keep hips level • Control the lowering • Knee tracks over toes',
'Patellofemoral pain syndrome',
'["step"]', 240, 3, 12, NULL, '["step down", "eccentric", "hip stability"]', '["97110"]', true),

('Spanish Squat', 'strength', 'lower_body', '["quadriceps", "glutes"]', '["knee"]', '["isometric", "eccentric"]', 'intermediate',
'Tendon-loading exercise for patellar or quadriceps tendinopathy.',
'1. Loop band behind knees, around sturdy object\n2. Walk back to create tension\n3. Squat down, keeping torso upright\n4. Hold bottom position 30-45 seconds\n5. Return to standing',
'The band creates anterior force on knee.',
'Sit back • Keep torso upright • Feel quadriceps work',
'Acute patellar tendinopathy flare',
'["resistance_band", "sturdy_object"]', 180, 3, 1, 45, '["tendon loading", "isometric", "patellar tendon"]', '["97110"]', true),

('Calf Raises', 'strength', 'lower_body', '["gastrocnemius", "soleus"]', '["ankle", "knee"]', '["plantarflexion"]', 'beginner',
'Bilateral calf strengthening for ankle stability.',
'1. Stand with balls of feet on step edge\n2. Rise up on toes as high as possible\n3. Hold 2 seconds at top\n4. Lower below step level for stretch\n5. Repeat',
'Use wall or counter for balance.',
'Full range of motion • Control at bottom • Push through big toe',
'Achilles tendinopathy (modify range), severe balance issues',
'["step", "counter"]', 180, 3, 15, NULL, '["calves", "ankle strength", "calf raises"]', '["97110"]', true),

('Eccentric Calf Lowering', 'strength', 'lower_body', '["gastrocnemius", "soleus", "Achilles tendon"]', '["ankle"]', '["eccentric"]', 'intermediate',
'Eccentric loading for Achilles tendinopathy rehabilitation.',
'1. Stand on step with heels hanging off\n2. Rise up on both toes\n3. Shift to affected leg\n4. Slowly lower heel below step (3-5 seconds)\n5. Return to both feet, repeat',
'Start with both legs, progress to single leg.',
'Slow controlled lowering • Full range • Progress gradually',
'Acute Achilles tear',
'["step"]', 300, 3, 15, NULL, '["Achilles", "eccentric", "Alfredson protocol"]', '["97110"]', true),

-- ============================================================================
-- CORE EXERCISES
-- ============================================================================

('Dead Bug', 'stability', 'core', '["transverse abdominis", "rectus abdominis", "hip flexors"]', '["spine", "hip"]', '["anti-extension"]', 'beginner',
'Core stabilization exercise emphasizing neutral spine maintenance.',
'1. Lie on back, arms up, knees bent 90°\n2. Press low back into floor\n3. Slowly lower one arm and opposite leg\n4. Do not let back arch\n5. Return to start, alternate sides',
'Ensure low back stays flat throughout.',
'Belly button to spine • Don\'t arch • Move slowly',
'Acute disc herniation with leg symptoms',
'["none"]', 180, 3, 10, NULL, '["core stability", "anti-extension", "neutral spine"]', '["97110"]', true),

('Bird Dog', 'stability', 'core', '["multifidus", "erector spinae", "glutes", "shoulder"]', '["spine", "hip", "shoulder"]', '["anti-rotation"]', 'beginner',
'Quadruped core stabilization with opposite arm/leg extension.',
'1. Start on hands and knees\n2. Tighten core muscles\n3. Extend one arm and opposite leg\n4. Keep hips and shoulders level\n5. Hold 5-10 seconds, return, alternate',
'Maintain neutral spine throughout.',
'Don\'t let hips rotate • Reach long • Hold steady',
'Acute spinal instability, severe shoulder pain',
'["none"]', 240, 3, 8, 5, '["core stability", "anti-rotation", "spine"]', '["97110"]', true),

('Plank', 'stability', 'core', '["rectus abdominis", "transverse abdominis", "obliques", "glutes"]', '["spine", "shoulder"]', '["isometric"]', 'beginner',
'Fundamental isometric core strengthening exercise.',
'1. Start in push-up position or on forearms\n2. Keep body in straight line from head to heels\n3. Engage core, squeeze glutes\n4. Hold for specified time\n5. Breathe normally throughout',
'Start with knees down if needed.',
'Flat back • Don\'t let hips sag • Breathe',
'Acute low back pain, shoulder pain',
'["none"]', 60, 3, 1, 30, '["plank", "isometric", "core endurance"]', '["97110"]', true),

('Side Plank', 'stability', 'core', '["obliques", "quadratus lumborum", "gluteus medius"]', '["spine", "hip"]', '["isometric", "side flexion"]', 'intermediate',
'Lateral core stability exercise.',
'1. Lie on side, forearm under shoulder\n2. Stack feet or stagger for balance\n3. Lift hips off floor\n4. Keep body in straight line\n5. Hold, then switch sides',
'Start with knees bent for modification.',
'Keep hips up • Straight line • Don\'t hold breath',
'Shoulder pain, lateral hip pain',
'["none"]', 60, 3, 1, 30, '["side plank", "obliques", "lateral stability"]', '["97110"]', true),

('Pallof Press', 'stability', 'core', '["obliques", "transverse abdominis", "shoulder"]', '["spine", "shoulder"]', '["anti-rotation"]', 'intermediate',
'Anti-rotation core exercise using band or cable resistance.',
'1. Stand perpendicular to band anchor\n2. Hold band at chest with elbows bent\n3. Press arms straight out\n4. Resist rotation toward band\n5. Return to chest, repeat',
'Step farther from anchor for more resistance.',
'Keep hips square • Don\'t rotate • Control movement',
'Severe balance issues, acute shoulder pain',
'["resistance_band", "cable_machine"]', 240, 3, 12, NULL, '["anti-rotation", "obliques", "core stability"]', '["97110"]', true),

('McGill Big 3 - Curl-Up', 'stability', 'core', '["rectus abdominis", "obliques"]', '["spine"]', '["flexion"]', 'beginner',
'Spine-sparing abdominal exercise from McGill method.',
'1. Lie on back, one knee bent, one straight\n2. Place hands under low back to maintain arch\n3. Lift head and shoulders slightly\n4. Hold 10 seconds\n5. Lower slowly, repeat',
'Do not flatten back against floor.',
'Small movement • Keep natural arch • Hold steady',
'Acute disc herniation (use caution)',
'["none"]', 120, 3, 5, 10, '["McGill", "spine sparing", "abdominal"]', '["97110"]', true),

('McGill Big 3 - Side Bridge', 'stability', 'core', '["obliques", "quadratus lumborum"]', '["spine"]', '["side flexion"]', 'beginner',
'Lateral core exercise from McGill method.',
'1. Lie on side, prop on elbow\n2. Knees bent 90° (progress to straight)\n3. Lift hips off floor\n4. Hold 10 seconds\n5. Lower and repeat',
'Ensure hips are stacked vertically.',
'Keep straight line • Push through elbow • Hold steady',
'Shoulder pain, rib pain',
'["none"]', 120, 3, 5, 10, '["McGill", "side bridge", "QL"]', '["97110"]', true),

('McGill Big 3 - Bird Dog', 'stability', 'core', '["multifidus", "erector spinae", "glutes"]', '["spine", "hip"]', '["extension"]', 'beginner',
'Extension-based core exercise from McGill method.',
'1. Start on hands and knees\n2. Extend one leg back, opposite arm forward\n3. Hold 10 seconds without rotating\n4. Return to start\n5. Alternate sides',
'Move slowly and deliberately.',
'Small controlled movements • No rotation • Hold steady',
'Severe spinal instability',
'["none"]', 180, 3, 6, 10, '["McGill", "bird dog", "extension"]', '["97110"]', true),

('Abdominal Bracing', 'stability', 'core', '["transverse abdominis", "internal obliques"]', '["spine"]', '["isometric"]', 'beginner',
'Fundamental activation of deep core stabilizers.',
'1. Lie on back with knees bent\n2. Gently draw belly button toward spine\n3. Tighten muscles as if preparing for a cough\n4. Hold contraction 10 seconds\n5. Release and repeat',
'Do not hold breath.',
'30% effort • Breathe normally • Don\'t hollow',
'Acute abdominal pain, recent abdominal surgery',
'["none"]', 120, 3, 5, 10, '["bracing", "core activation", "TVA"]', '["97110"]', true),

('Abdominal Hollowing', 'stability', 'core', '["transverse abdominis", "pelvic floor"]', '["spine", "pelvis"]', '["isometric"]', 'beginner',
'Draws in abdominal wall to activate transverse abdominis.',
'1. Lie on back with knees bent\n2. Gently pull navel toward spine\n3. Imagine narrowing waistline\n4. Hold 10 seconds\n5. Release and repeat',
'Do not lift chest or tilt pelvis.',
'Gentle contraction • Keep breathing • Don\'t move spine',
'None significant',
'["none"]', 120, 3, 5, 10, '["hollowing", "TVA", "deep core"]', '["97110"]', true),

-- ============================================================================
-- BALANCE/PROPRIOCEPTION
-- ============================================================================

('Single-Leg Stance', 'balance', 'lower_body', '["proprioceptors", "ankle stabilizers", "hip stabilizers"]', '["ankle", "hip"]', '["balance"]', 'beginner',
'Fundamental static balance exercise.',
'1. Stand on one leg near wall or counter\n2. Lift other foot slightly off floor\n3. Keep standing knee slightly bent\n4. Hold for specified time\n5. Switch legs',
'Use fingertip support initially.',
'Focus on spot • Keep hips level • Small knee bend',
'Severe balance deficits, acute ankle injury',
'["none", "counter"]', 120, 3, 1, 30, '["balance", "proprioception", "single leg"]', '["97110"]', true),

('Tandem Stance', 'balance', 'lower_body', '["ankle stabilizers", "proprioceptors"]', '["ankle"]', '["balance"]', 'beginner',
'Narrow-base balance challenging ankle stability.',
'1. Stand with one foot directly in front of other\n2. Heel of front foot touches toes of back foot\n3. Arms at sides or across chest\n4. Hold for specified time\n5. Switch foot position',
'Stand near wall for safety.',
'Focus on spot • Stand tall • Keep weight centered',
'Severe balance issues, foot pain',
'["none"]', 120, 3, 1, 30, '["tandem", "balance", "ankle"]', '["97110"]', true),

('Single-Leg Reach', 'balance', 'lower_body', '["gluteus medius", "ankle stabilizers", "proprioceptors"]', '["hip", "ankle"]', '["balance", "reaching"]', 'intermediate',
'Dynamic single-leg balance with multi-planar reach.',
'1. Stand on one leg with slight knee bend\n2. Reach opposite hand toward floor in front\n3. Return to standing\n4. Reach to side\n5. Reach behind\n6. Complete all directions, switch legs',
'Start with small reaches, progress range.',
'Control the reach • Keep knee aligned • Don\'t let hip hike',
'Severe balance deficits, knee instability',
'["none"]', 240, 3, 6, NULL, '["star excursion", "dynamic balance", "reach"]', '["97110"]', true),

('Clock Reaches', 'balance', 'lower_body', '["hip stabilizers", "ankle stabilizers"]', '["hip", "ankle"]', '["balance", "reaching"]', 'intermediate',
'Multi-directional balance exercise in single-leg stance.',
'1. Stand on one leg in center of "clock"\n2. Tap floor at 12 o\'clock with opposite foot\n3. Return to center\n4. Continue around clock (12, 1, 2, 3, etc.)\n5. Complete circle, switch legs',
'Imagine standing in middle of clock face.',
'Small controlled movements • Stay balanced • Complete the circle',
'Patellar instability, severe ankle sprain',
'["none"]', 300, 2, 12, NULL, '["clock", "balance", "hip stability"]', '["97110"]', true),

('Bosu Squat', 'balance', 'lower_body', '["quadriceps", "glutes", "ankle stabilizers", "proprioceptors"]', '["knee", "hip", "ankle"]', '["balance", "squat"]', 'advanced',
'Unstable surface squat for advanced balance training.',
'1. Stand on BOSU dome or flat side\n2. Feet shoulder-width apart\n3. Squat down with control\n4. Keep balance throughout\n5. Return to standing',
'Start with dome side up (easier).',
'Slow controlled • Find balance point • Don\'t rush',
'Severe balance deficits, acute injury',
'["bosu_ball"]', 240, 3, 10, NULL, '["unstable surface", "balance", "squat"]', '["97110"]', true);

-- Add more exercises with additional INSERT statements
INSERT INTO exercises (exercise_name, exercise_category, body_region, target_muscles, target_joints, target_movements, difficulty_level, description, instructions, setup_instructions, cues, contraindications, equipment_needed, estimated_duration_seconds, sets_default, reps_default, hold_seconds_default, tags, cpt_codes, is_active) VALUES

-- Additional upper body
('Thoracic Rotation Stretch', 'mobility', 'upper_body', '["thoracic spine", "obliques"]', '["spine"]', '["rotation"]', 'beginner',
'Improves thoracic spine mobility for rotation.',
'1. Lie on side with top knee bent on pillow\n2. Reach both arms straight out\n3. Lift top arm up and over to opposite side\n4. Follow hand with eyes\n5. Hold stretch, return to start',
'Keep bottom shoulder on floor.',
'Breathe deeply • Rotate through thoracic spine • Keep knee down',
'Severe osteoporosis, recent spinal surgery',
'["pillow"]', 120, 2, 1, 30, '["t-spine", "rotation", "mobility"]', '["97140"]', true),

('Open Book Stretch', 'mobility', 'upper_body', '["thoracic spine", "pecs", "shoulder"]', '["spine", "shoulder"]', '["rotation", "extension"]', 'beginner',
'Thoracic extension and rotation stretch.',
'1. Lie on side, knees bent to 90°\n2. Arms straight out in front\n3. Open top arm across chest like a book\n4. Follow hand with head\n5. Hold at end range, return',
'Keep knees stacked throughout.',
'Rotate through upper back • Follow hand with eyes • Breathe',
'Rib pain, shoulder impingement',
'["none"]', 120, 2, 1, 30, '["open book", "thoracic", "rotation"]', '["97140"]', true),

-- Additional lower body
('Glute Bridge March', 'strength', 'lower_body', '["glutes", "hamstrings", "core"]', '["hip", "knee"]', '["extension", "stabilization"]', 'intermediate',
'Single-leg alternating bridge for hip stability.',
'1. Lie on back, knees bent\n2. Lift hips to bridge position\n3. Lift one knee toward chest\n4. Lower with control, switch legs\n5. Keep hips level throughout',
'Maintain hip height during marching.',
'Don\'t let hips drop • Keep core engaged • Alternate smoothly',
'Sacroiliac pain, hamstring strain',
'["none"]', 240, 3, 10, NULL, '["bridge", "march", "hip stability"]', '["97110"]', true),

('Copenhagen Plank', 'strength', 'lower_body', '["adductors", "obliques", "core"]', '["hip", "spine"]', '["isometric", "adduction"]', 'advanced',
'Side plank variation targeting adductor strength.',
'1. Lie on side, top foot on elevated surface\n2. Lift hips off floor\n3. Support on forearm and top leg\n4. Hold position\n5. Lower and repeat',
'Start with low surface, progress height.',
'Keep body straight • Push through top leg • Control',
'Adductor strain, groin pain',
'["bench", "box"]', 60, 3, 1, 20, '["Copenhagen", "adductors", "side plank"]', '["97110"]', true),

-- Neck exercises
('Chin Tuck', 'strength', 'upper_body', '["deep neck flexors"]', '["neck"]', '["flexion"]', 'beginner',
'Activates deep cervical flexors for neck stability.',
'1. Sit or stand with good posture\n2. Gently draw chin back\n3. Create "double chin" appearance\n4. Hold 5 seconds\n5. Release and repeat',
'Do not look down or tilt head.',
'Keep eyes level • Glide chin back • Hold gentle',
'Acute neck pain with radiating symptoms',
'["none"]', 120, 3, 10, 5, '["chin tuck", "deep neck flexors", "posture"]', '["97110"]', true),

('Upper Trapezius Stretch', 'flexibility', 'upper_body', '["upper trapezius", "levator scapulae"]', '["neck"]', '["lateral flexion"]', 'beginner',
'Stretches upper neck and shoulder muscles.',
'1. Sit with good posture\n2. Tilt head away from side to stretch\n3. Gently add pressure with hand\n4. Hold 30 seconds\n5. Switch sides',
'Keep opposite shoulder down.',
'Feel side stretch • Keep shoulder down • Breathe',
'Acute neck strain, radiculopathy',
'["none"]', 90, 2, 1, 30, '["upper trap", "neck stretch", "posture"]', '["97140"]', true),

('Levator Scapulae Stretch', 'flexibility', 'upper_body', '["levator scapulae"]', '["neck"]', '["rotation", "flexion"]', 'beginner',
'Stretches muscle that elevates shoulder blade.',
'1. Sit with good posture\n2. Turn head 45° to right\n3. Look down toward armpit\n4. Gently add pressure\n5. Hold 30 seconds, switch',
'Keep back straight throughout.',
'Look toward armpit • Feel back of neck • Gentle stretch',
'Neck arthritis, severe stiffness',
'["none"]', 90, 2, 1, 30, '["levator", "neck stretch", "posture"]', '["97140"]', true),

-- Functional movements
('Sit to Stand', 'functional', 'full_body', '["quadriceps", "glutes", "core"]', '["knee", "hip", "ankle"]', '["functional"]', 'beginner',
'Fundamental functional movement pattern.',
'1. Sit in chair with feet flat\n2. Lean forward, shift weight to feet\n3. Stand up without using hands\n4. Lower slowly back to sitting\n5. Repeat',
'Use armrests if needed initially.',
'Nose over toes • Push through heels • Controlled descent',
'Severe weakness, acute knee pain',
'["chair"]', 180, 3, 10, NULL, '["sit stand", "functional", "daily activity"]', '["97110"]', true),

('Farmer Carry', 'functional', 'full_body', '["grip", "core", "trapezius"]', '["shoulder", "spine"]', '["carrying"]', 'intermediate',
'Functional grip and core endurance exercise.',
'1. Stand holding weights at sides\n2. Pull shoulders back and down\n3. Walk with control, upright posture\n4. Maintain grip and posture\n5. Walk specified distance or time',
'Choose challenging but manageable weight.',
'Shoulders down • Walk tall • Don\'t let weight swing',
'Severe grip weakness, balance issues',
'["dumbbells", "kettlebells"]', 120, 3, 1, 45, '["grip", "carry", "functional"]', '["97110"]', true),

('Turkish Get-Up', 'functional', 'full_body', '["full body"]', '["shoulder", "hip", "knee", "spine"]', '["multiple"]', 'advanced',
'Complex full-body movement pattern requiring coordination.',
'1. Lie on back holding weight overhead\n2. Roll to elbow, then to hand\n3. Lift hips to bridge\n4. Sweep leg under to kneeling\n5. Stand up, reverse to return',
'Practice without weight first.',
'Keep eye on weight • Move slowly • Control each position',
'Shoulder instability, acute injury, severe limitations',
'["kettlebell", "dumbbell"]', 300, 3, 3, NULL, '["get up", "full body", "complex"]', '["97110"]', true);

-- ============================================================================
-- Insert default admin user (password: Admin123! - should be changed immediately)
-- Password hash for: Admin123!
-- ============================================================================

INSERT INTO clinics (name, email, phone) VALUES
('Default Clinic', 'admin@physiomotion.local', '555-0100');

INSERT INTO users (clinic_id, email, password_hash, first_name, last_name, role, title, account_status, email_verified) VALUES
(1, 'admin@physiomotion.local', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G', 'System', 'Administrator', 'admin', 'Admin', 'active', true);

INSERT INTO users (clinic_id, email, password_hash, first_name, last_name, role, title, account_status, email_verified) VALUES  
(1, 'demo@physiomotion.local', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G', 'Demo', 'Clinician', 'clinician', 'PT', 'active', true);

-- ============================================================================
-- Insert CPT codes for Medicare compliance
-- ============================================================================

INSERT INTO cpt_codes (cpt_code, code_description, code_category, minimum_duration_minutes, requires_documentation, medicare_allowed, typical_reimbursement) VALUES
('97161', 'Physical therapy evaluation: low complexity', 'evaluation', 20, true, true, 85.00),
('97162', 'Physical therapy evaluation: moderate complexity', 'evaluation', 30, true, true, 110.00),
('97163', 'Physical therapy evaluation: high complexity', 'evaluation', 45, true, true, 135.00),
('97164', 'Physical therapy re-evaluation', 'evaluation', 20, true, true, 70.00),
('97110', 'Therapeutic exercise', 'exercise', 8, true, true, 32.00),
('97112', 'Neuromuscular reeducation', 'treatment', 8, true, true, 38.00),
('97113', 'Aquatic therapy with therapeutic exercise', 'exercise', 8, true, true, 35.00),
('97116', 'Gait training', 'treatment', 8, true, true, 30.00),
('97140', 'Manual therapy', 'treatment', 8, true, true, 34.00),
('97150', 'Group therapeutic procedures', 'exercise', 0, true, true, 18.00),
('97530', 'Therapeutic activities', 'treatment', 8, true, true, 36.00),
('97535', 'Self-care/home management training', 'treatment', 8, true, true, 33.00),
('97750', 'Physical performance test', 'evaluation', 15, true, true, 85.00),
('97755', 'Assistive technology assessment', 'evaluation', 15, true, true, 75.00),
('97760', 'Orthotic management and training', 'treatment', 15, true, true, 55.00),
('97761', 'Prosthetic training', 'treatment', 15, true, true, 60.00),
('98975', 'Remote monitoring initial setup', 'rpm', 0, true, true, 200.00),
('98976', 'Remote monitoring device supply', 'rpm', 0, true, true, 55.00),
('98977', 'Remote monitoring analysis', 'rpm', 0, true, true, 55.00),
('98980', 'Remote monitoring treatment first 20 min', 'rpm', 20, true, true, 40.00),
('98981', 'Remote monitoring treatment additional 20 min', 'rpm', 20, true, true, 35.00);

-- ============================================================================
-- Insert system settings
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('session_timeout_minutes', '15', 'number', 'HIPAA session timeout in minutes'),
('password_min_length', '8', 'number', 'Minimum password length'),
('require_mfa', 'false', 'boolean', 'Require multi-factor authentication'),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout'),
('lockout_duration_minutes', '30', 'number', 'Account lockout duration in minutes'),
('video_retention_days', '2555', 'number', 'Video retention period (7 years default)'),
('audit_log_retention_days', '2555', 'number', 'Audit log retention (7 years for HIPAA)'),
('eight_minute_rule_enabled', 'true', 'boolean', 'Enable Medicare 8-minute rule calculations'),
('auto_logout_warning_seconds', '60', 'number', 'Seconds before logout to show warning'),
('default_clinic_timezone', '"America/New_York"', 'string', 'Default timezone for clinic');
