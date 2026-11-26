/* 12-week program content. Edit here to change the plan; app.js holds no program details.
   Roles: power, main, sec, uni, iso, core. p1/p2 = [sets, repsLow, repsHigh] for weeks 3-6 and 8-11.
   r1/r2 = reps in reserve [early sets, last set] for weeks 3-6 and 8-11 (null = not an RIR lift).
   day: H = heavy day for that muscle group, M = moderate day (light daily undulating periodization).
   uni: logged Left then Right. unit: lb | kg | bw. dist: reps are metres. invert: lower weight = harder.
   care: shoulder pain rule applies. pt: boxing-prep or shoulder-durability work to check with the PT. */
var PROGRAM = (function () {
  var S = function (o) { o.alts = o.alts || []; o.unit = o.unit || 'lb'; o.step = o.step || 5; o.inc = (o.inc === undefined ? o.step : o.inc); return o; };

  var SESSIONS = [
    { key: 'LA', name: 'Lower A', focus: 'Heavy squat, moderate hinge', day: 0, mins: '75–85 min', lower: true, ex: [
      S({ n: 'Box jump (low box)', role: 'power', p1: [3, 3, 3], p2: [4, 3, 3], rest: 75, restTxt: '60–90 s', unit: 'bw', cue: 'Low box (12–18 in). Jump up, land soft and quiet, stand tall, step down. Reset each rep. Stop the set if a jump gets slower.', alts: ['Speed step-up', 'Squat jump onto mat'] }),
      S({ n: 'Med-ball rotational scoop toss', role: 'power', uni: true, care: true, pt: true, p1: [2, 4, 4], p2: [3, 3, 3], rest: 60, restTxt: '45–60 s', unit: 'kg', step: 1, inc: 0, startW: 4, wLabel: 'Ball (kg)', cue: 'Side-on to a wall, load the back hip, throw from the hips, not the arms. 4–6 kg. Both sides, left first.', alts: ['Cable woodchop, fast'] }),
      S({ n: 'Hack squat', role: 'main', day: 'H', test: true, p1: [4, 4, 6], p2: [4, 4, 6], r1: [3, 2], r2: [2, 1], rest: 165, restTxt: '2.5–3 min', step: 5, inc: 10, startW: 90, wLabel: 'Plates (lb, not counting the sled)', cue: 'Shoulders under the pads, hands on the handles, feet shoulder-width mid-platform. Sit deep under control, drive through mid-foot, don’t lock the knees.', alts: ['Belt squat', 'Leg press', 'Goblet squat'] }),
      S({ n: 'Romanian deadlift', role: 'sec', day: 'M', p1: [3, 8, 10], p2: [3, 8, 10], r1: [3, 2], r2: [2, 2], rest: 120, restTxt: '2 min', step: 5, startW: 95, cue: 'Soft knees, push hips back, bar close to legs, stop when hamstrings limit. Moderate day for the hinge.', alts: ['DB Romanian deadlift', '45-degree back extension'] }),
      S({ n: 'Bulgarian split squat', role: 'uni', day: 'H', uni: true, sideTest: true, p1: [3, 6, 8], p2: [3, 6, 8], r1: [2, 2], r2: [2, 1], rest: 90, restTxt: '75–90 s per side', step: 5, startW: 30, wLabel: 'Weight (lb, both DBs)', cue: 'Rear foot on bench, torso slightly forward, front knee over mid-foot. Left side first, match reps on the right.', alts: ['Split squat (rear foot on floor)', 'Reverse lunge'] }),
      S({ n: 'Lying leg curl', role: 'iso', p1: [3, 10, 12], p2: [3, 10, 12], r1: [2, 1], r2: [1, 1], rest: 75, restTxt: '60–90 s', step: 5, startW: 50, cue: 'Hips down, 1 s squeeze, 2–3 s lower.', alts: ['Seated leg curl'] }),
      S({ n: 'Standing calf raise', role: 'iso', p1: [3, 10, 15], p2: [3, 10, 15], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 10, startW: 90, cue: 'Full stretch with 2 s pause at bottom, full rise.', alts: ['Leg-press calf raise'] }),
      S({ n: 'Pallof press', role: 'core', uni: true, p1: [3, 10, 10], p2: [3, 10, 10], rest: 45, restTxt: '45 s', step: 5, startW: 20, cue: 'Anti-rotation for boxing. Stand side-on to the cable, press out, resist the twist 2 s, return.', alts: ['Band Pallof press'] })
    ] },
    { key: 'UA', name: 'Upper A', focus: 'Heavy press and row', day: 1, mins: '75–85 min', ex: [
      S({ n: 'Med-ball chest pass', role: 'power', care: true, pt: true, p1: [3, 5, 5], p2: [4, 4, 4], rest: 60, restTxt: '45–60 s', unit: 'kg', step: 1, inc: 0, startW: 3, wLabel: 'Ball (kg)', cue: '3–4 kg. Throw hard to the wall from the chest, catch soft. Only if shoulder pain is 0–3.', alts: ['Med-ball rotational scoop toss'] }),
      S({ n: 'Kettlebell swing', role: 'power', p1: [2, 8, 8], p2: [3, 6, 6], rest: 60, restTxt: '60 s', step: 5, inc: 0, startW: 35, wLabel: 'Bell (lb)', cue: 'Hinge, hike the bell back, snap the hips; arms just guide. Bell to chest height, no higher.', alts: ['Hip thrust (fast)', 'Broad jump'] }),
      S({ n: 'Neutral-grip DB bench press', role: 'main', day: 'H', test: true, care: true, p1: [4, 4, 6], p2: [4, 4, 6], r1: [3, 2], r2: [2, 2], rest: 150, restTxt: '2–3 min', step: 10, startW: 60, wLabel: 'Weight (lb, both DBs)', cue: 'Palms facing, elbows ~45°, stop 1–2 in. above chest, shoulder blades back. Care lift: never closer than 2 reps from failure.', alts: ['Hammer Strength chest press', 'Floor press'] }),
      S({ n: 'Chest-supported row', role: 'main', day: 'H', test: true, p1: [4, 4, 6], p2: [4, 4, 6], r1: [3, 2], r2: [2, 1], rest: 120, restTxt: '2 min', step: 5, startW: 70, cue: 'Chest on pad, pull elbows to hips, pause, full stretch.', alts: ['Hammer Strength row', 'Seated cable row'] }),
      S({ n: 'Lat pulldown (neutral grip)', role: 'sec', day: 'H', p1: [3, 6, 8], p2: [3, 6, 8], r1: [2, 2], r2: [2, 1], rest: 105, restTxt: '90–120 s', step: 5, startW: 90, cue: 'Lean back slightly, pull to upper chest, elbows down and in. Heavy day for the lats.', alts: ['Machine pulldown'] }),
      S({ n: 'Half-kneeling landmine press', role: 'uni', day: 'H', uni: true, care: true, sideTest: true, p1: [3, 6, 8], p2: [3, 6, 8], r1: [3, 2], r2: [2, 2], rest: 75, restTxt: '60–90 s', step: 5, startW: 25, wLabel: 'Plates on the bar (lb)', cue: 'Barbell end wedged in a corner (towel under it). Kneel on same-side knee, press up and slightly forward, ribs down. Left side first.', alts: ['Single-arm cable press', 'Hammer Strength shoulder press (if PT OK)'] }),
      S({ n: 'Cable lateral raise', role: 'iso', care: true, p1: [3, 12, 15], p2: [3, 12, 15], r1: [2, 1], r2: [2, 1], rest: 60, restTxt: '60 s', step: 2.5, startW: 10, cue: 'Cable from low, arm slightly forward of body, raise to shoulder height only, slow lower.', alts: ['DB lateral raise (light)', 'Machine lateral raise'] }),
      S({ n: 'EZ-bar curl', role: 'iso', day: 'H', p1: [3, 6, 8], p2: [3, 6, 8], r1: [2, 1], r2: [2, 1], rest: 60, restTxt: '60 s', step: 5, startW: 45, cue: 'Elbows still, full range, 2 s lower. Superset with pushdown.', alts: ['Cable curl'] }),
      S({ n: 'Rope triceps pushdown', role: 'iso', day: 'H', p1: [3, 8, 10], p2: [3, 8, 10], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 5, startW: 35, cue: 'Elbows pinned, spread rope at the bottom.', alts: ['Bar pushdown'] }),
      S({ n: 'Face pull', role: 'iso', p1: [2, 15, 15], p2: [2, 15, 15], r1: [3, 2], r2: [3, 2], rest: 45, restTxt: '45 s', step: 5, startW: 25, cue: 'Rope to forehead, elbows high, rotate hands back. Superset with external rotation.', alts: ['Band pull-apart'] }),
      S({ n: 'Cable external rotation', role: 'iso', uni: true, care: true, pt: true, p1: [2, 12, 15], p2: [2, 12, 15], r1: [3, 3], r2: [3, 3], rest: 45, restTxt: '45 s', step: 2.5, inc: 2.5, startW: 5, cue: 'Rotator cuff. Elbow at your side on a rolled towel, rotate the forearm out slowly, 2 s back. Light; no pain. Use your PT’s version if it differs.', alts: ['Band external rotation', 'Side-lying DB external rotation'] })
    ] },
    { key: 'LB', name: 'Lower B', focus: 'Heavy hinge, moderate quads', day: 3, mins: '70–80 min', lower: true, ex: [
      S({ n: 'Kettlebell swing', role: 'power', p1: [3, 8, 8], p2: [4, 6, 6], rest: 75, restTxt: '60–90 s', step: 5, inc: 0, startW: 35, wLabel: 'Bell (lb)', cue: 'Hinge, hike the bell back, snap the hips; arms just guide. Bell to chest height. Phase 2: heavier bell.', alts: ['Hip thrust (fast)', 'Broad jump'] }),
      S({ n: 'Speed step-up', role: 'power', uni: true, p1: [3, 4, 4], p2: [3, 4, 4], rest: 60, restTxt: '45–60 s', unit: 'bw', repsLabel: 'Reps (this leg)', cue: 'Knee-height box. Drive up fast through the whole foot, stand tall, step down under control. Left first.', alts: ['Box jump (low box)', 'Lateral bound (small)'] }),
      S({ n: 'Barbell deadlift', role: 'main', day: 'H', test: true, p1: [3, 4, 6], p2: [4, 4, 6], r1: [3, 2], r2: [2, 2], rest: 165, restTxt: '2.5–3 min', step: 10, inc: 10, startW: 135, cue: 'Bar over mid-foot, shins to bar, double-overhand grip (straps on top sets, no mixed grip), brace, push the floor away. Reset each rep. Never closer than 2 reps from failure.', alts: ['Block pull (bar on 2–4 in. plates)', 'Sumo deadlift'] }),
      S({ n: 'Single-leg leg press', role: 'uni', day: 'M', uni: true, sideTest: true, p1: [3, 10, 12], p2: [3, 10, 12], r1: [2, 2], r2: [2, 1], rest: 60, restTxt: '60 s per side', step: 10, startW: 90, cue: 'Foot mid-plate, controlled depth, no knee lockout. Left first. Moderate day for the quads.', alts: ['Step-up'] }),
      S({ n: 'Leg extension', role: 'iso', day: 'M', p1: [2, 12, 15], p2: [2, 12, 15], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 5, startW: 50, cue: '1 s squeeze at top, 2–3 s lower.', alts: ['Sissy squat (assisted)'] }),
      S({ n: 'Seated leg curl', role: 'iso', p1: [3, 10, 12], p2: [3, 10, 12], r1: [2, 1], r2: [1, 1], rest: 75, restTxt: '60–90 s', step: 5, startW: 50, cue: 'Lean forward slightly for more stretch.', alts: ['Lying leg curl'] }),
      S({ n: 'Seated calf raise', role: 'iso', p1: [3, 12, 15], p2: [3, 12, 15], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 10, startW: 45, cue: 'Pause at bottom, full rise.', alts: ['Standing calf raise'] }),
      S({ n: 'Dead bug', role: 'core', p1: [3, 8, 8], p2: [3, 8, 8], rest: 45, restTxt: '45 s', unit: 'bw', repsLabel: 'Reps (each side)', cue: 'Low back pressed down, extend opposite arm and leg slowly.', alts: ['Bird dog'] }),
      S({ n: 'Suitcase carry', role: 'core', uni: true, dist: true, p1: [3, 30, 30], p2: [3, 30, 30], rest: 60, restTxt: '60 s', step: 5, startW: 40, wLabel: 'DB or bell (lb)', cue: 'One heavy DB or bell, walk tall without leaning, 30 m per hand. Note if one side is harder.', alts: ['Farmer carry'] })
    ] },
    { key: 'UB', name: 'Upper B', focus: 'Moderate: lats, side delts, arms', day: 4, mins: '75–85 min', ex: [
      S({ n: 'Med-ball rotational scoop toss', role: 'power', uni: true, care: true, pt: true, p1: [3, 4, 4], p2: [4, 3, 3], rest: 60, restTxt: '45–60 s', unit: 'kg', step: 1, inc: 0, startW: 4, wLabel: 'Ball (kg)', cue: 'Side-on to a wall, load the back hip, throw from the hips, not the arms. 4–6 kg. Both sides, left first.', alts: ['Cable woodchop, fast'] }),
      S({ n: 'Speed step-up', role: 'power', uni: true, p1: [2, 4, 4], p2: [3, 4, 4], rest: 60, restTxt: '45–60 s', unit: 'bw', repsLabel: 'Reps (this leg)', cue: 'Knee-height box. Drive up fast through the whole foot, stand tall, step down under control. Left first.', alts: ['Box jump (low box)', 'Lateral bound (small)'] }),
      S({ n: 'Assisted pull-up', role: 'main', day: 'M', care: true, invert: true, p1: [3, 10, 12], p2: [3, 8, 10], r1: [3, 2], r2: [2, 2], rest: 105, restTxt: '90–120 s', step: 5, startW: 70, wLabel: 'Assistance (lb, less is harder)', cue: 'Neutral or shoulder-width grip, full hang to chin over bar, no kipping. Moderate day for the lats.', alts: ['Wide neutral-grip pulldown'] }),
      S({ n: 'Single-arm DB row', role: 'uni', day: 'M', uni: true, sideTest: true, p1: [3, 10, 12], p2: [3, 8, 10], r1: [2, 2], r2: [2, 1], rest: 60, restTxt: '60 s per side', step: 5, startW: 40, wLabel: 'Dumbbell (lb)', cue: 'Hand and knee on bench, pull DB to hip, full stretch. Left first.', alts: ['Single-arm cable row'] }),
      S({ n: 'Low-incline DB press', role: 'sec', day: 'M', care: true, p1: [3, 10, 12], p2: [3, 8, 10], r1: [3, 2], r2: [2, 2], rest: 90, restTxt: '90 s', step: 10, startW: 45, wLabel: 'Weight (lb, both DBs)', cue: '15–30° bench, neutral or slight-angle grip, shortened bottom. Moderate day for pressing.', alts: ['Incline Hammer Strength press'] }),
      S({ n: 'Cable lateral raise', role: 'iso', care: true, p1: [4, 12, 15], p2: [4, 12, 15], r1: [2, 1], r2: [2, 1], rest: 60, restTxt: '60 s', step: 2.5, startW: 10, cue: 'Cable from low, arm slightly forward of body, raise to shoulder height only, slow lower.', alts: ['DB lateral raise (light)', 'Machine lateral raise'] }),
      S({ n: 'Straight-arm cable pulldown', role: 'iso', care: true, p1: [2, 12, 15], p2: [2, 12, 15], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 5, startW: 30, cue: 'Slight hinge, arms nearly straight, sweep bar to thighs.', alts: ['DB pullover (light)'] }),
      S({ n: 'Reverse cable fly', role: 'iso', p1: [3, 12, 15], p2: [3, 12, 15], r1: [2, 1], r2: [2, 1], rest: 45, restTxt: '45 s', step: 2.5, startW: 10, cue: 'Cross cables, arms slightly bent, pull wide, squeeze.', alts: ['Rear delt machine'] }),
      S({ n: 'Incline DB curl', role: 'iso', day: 'M', care: true, p1: [3, 10, 12], p2: [3, 10, 12], r1: [2, 1], r2: [1, 1], rest: 60, restTxt: '60 s', step: 5, startW: 25, wLabel: 'Weight (lb, both DBs)', cue: 'Bench ~60°, arms hang, curl without swinging. Stop if the front of the shoulder hurts.', alts: ['Cable curl'] }),
      S({ n: 'Single-arm cable pushdown', role: 'iso', day: 'M', uni: true, p1: [3, 12, 15], p2: [3, 12, 15], r1: [2, 1], r2: [1, 1], rest: 45, restTxt: '45 s', step: 2.5, startW: 15, cue: 'Elbow pinned, full lockout. Left first.', alts: ['Rope pushdown'] }),
      S({ n: 'Half-kneeling cable chop', role: 'core', uni: true, care: true, pt: true, p1: [3, 8, 8], p2: [3, 8, 8], rest: 45, restTxt: '45 s', step: 5, startW: 20, cue: 'Rotational core for boxing. High to low across the body, rotate through the upper back, hips square.', alts: ['Med-ball rotational scoop toss'] }),
      S({ n: 'Scap push-up', role: 'iso', pt: true, care: true, p1: [2, 10, 12], p2: [2, 10, 12], rest: 45, restTxt: '45 s', unit: 'bw', cue: 'Scapular control. Hands on a bench (incline), arms straight: let the shoulder blades come together, then push the bench away to spread them. Slow, no pain.', alts: ['Serratus wall slide (foam roller)', 'Band Y raise (light)'] })
    ] }
  ];

  var PHASES = ['', 'Re-entry', 'Re-entry', 'Phase 1', 'Phase 1', 'Phase 1', 'Phase 1', 'Deload', 'Phase 2', 'Phase 2', 'Phase 2', 'Phase 2', 'Deload + retest'];
  var PHASE_LONG = ['', 'Re-entry and baseline', 'Re-entry and baseline', 'Build', 'Build', 'Build', 'Build', 'Deload and partial retest', 'Strength and power', 'Strength and power', 'Strength and power', 'Strength and power', 'Deload and full retest'];

  /* Effort text for reps-in-reserve targets: rir = [early sets, last set]. */
  function rirTxt(sets, rir) {
    if (!rir) return '';
    if (rir[0] === rir[1] || sets < 2) return 'RIR ' + rir[1] + ' every set';
    return 'RIR ' + rir[0] + ', last set RIR ' + rir[1];
  }
  /* Target reps in reserve for set number n (1-based) of an exercise in a week, or null. */
  function rirFor(r, n) { if (!r.rir) return null; return n >= r.sets ? r.rir[1] : r.rir[0]; }

  /* Prescription for one exercise in one week. Returns sets, rep range, effort text, RIR targets, note, and whether loads may rise. */
  function rx(ex, wk, sessKey) {
    var p1 = ex.p1, p2 = ex.p2, r;
    var mainish = ex.role === 'main' || ex.role === 'sec';
    var liftRir = ex.role !== 'power' && ex.role !== 'core' && ex.r1;
    if (wk <= 2) {
      if (mainish) r = { sets: 3, lo: 8, hi: 8, rir: [4, 3] };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Learn the drill, easy speed' };
      else r = { sets: Math.max(2, p1[0] - 1), lo: p1[1], hi: p1[2], rir: liftRir ? [3, 3] : null };
      r.prog = true;
      if (wk === 2 && ex.test) r.note = 'Baseline test: after your sets, work up to a weight you can lift for 5 with 2 reps left (RIR 2). Log it as an extra set.';
      if (wk === 2 && ex.sideTest) r.note = 'Single-side test: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    } else if (wk <= 6) {
      r = { sets: p1[0], lo: p1[1], hi: p1[2], rir: liftRir ? ex.r1 : null, prog: true };
    } else if (wk === 7) {
      if (ex.role === 'main') r = { sets: 2, lo: 5, hi: 5, rir: [4, 4], eff: 'RIR 4 at week-6 load' };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Easy speed' };
      else r = { sets: Math.ceil(p1[0] / 2), lo: p1[1], hi: p1[2], rir: liftRir ? [3, 3] : null };
      r.prog = false; r.deload = true;
      if (ex.sideTest) r.note = 'Single-side retest: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    } else if (wk <= 11) {
      r = { sets: p2[0], lo: p2[1], hi: p2[2], rir: liftRir ? ex.r2 : null, prog: true };
    } else {
      var retestDay = sessKey === 'LA' || sessKey === 'UA' || sessKey === 'LB';
      if (ex.test && retestDay) r = { sets: 1, lo: 5, hi: 5, rir: [2, 2], eff: 'Retest: 5 reps, RIR 2', note: 'Full retest: warm up, then work up to a weight you can lift for 5 with 2 reps left.' };
      else if (ex.role === 'main') r = { sets: 2, lo: 5, hi: 5, rir: [4, 4] };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Easy speed' };
      else r = { sets: Math.ceil(p1[0] / 2), lo: p1[1], hi: p1[2], rir: liftRir ? [3, 3] : null };
      r.prog = false; r.deload = true;
      if (ex.sideTest) r.note = 'Single-side retest: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    }
    if (!r.eff) r.eff = r.rir ? rirTxt(r.sets, r.rir) : (ex.role === 'power' ? 'Max speed, stop if reps slow' : 'Controlled');
    return r;
  }

  var CALENDAR_DAY = [
    'Lower A',
    'Upper A',
    'Zone 2 walk or incline treadmill 40–45 min + 10 min mobility',
    'Lower B',
    'Upper B',
    'Boxing conditioning: 10 min footwork, then intervals (week 3 on) and a zone 2 walk',
    'Off. Optional easy zone 2 walk 30–45 min. Weekly review and export.'
  ];
  var INTERVALS = ['', '', '', '6 × 30 s', '6 × 30 s', '7 × 30 s', '7 × 30 s', '', '6 × 30 s', '7 × 30 s', '8 × 30 s', '8 × 30 s', ''];
  /* Friday plan by week. */
  var FRIDAY = ['', '10 min footwork (easy) + 30 min zone 2 walk', '10 min footwork (easy) + 30 min zone 2 walk',
    '10 min footwork + intervals 6 × 30 s + 15 min zone 2 walk', '10 min footwork + intervals 6 × 30 s + 15 min zone 2 walk',
    '10 min footwork + intervals 7 × 30 s + 15 min zone 2 walk', '10 min footwork + intervals 7 × 30 s + 15 min zone 2 walk',
    '10 min footwork (easy) + 30 min zone 2 walk',
    '12 min footwork + intervals 6 × 30 s + 15 min zone 2 walk', '12 min footwork + intervals 7 × 30 s + 15 min zone 2 walk',
    '12 min footwork + intervals 8 × 30 s + 15 min zone 2 walk', '12 min footwork + intervals 8 × 30 s + 15 min zone 2 walk',
    '10 min footwork (easy) + 30 min zone 2 walk'];

  var GUIDE = [
    { id: 'use', title: 'Using this app', lines: [
      'Today shows your daily basics (weight trend and protein) and your next session. Tap a card to log it.',
      'Weight and protein come first: log body weight each morning in Check-in, and add protein through the day with the + buttons on Today.',
      'Weight and reps start at the suggestion or your last set. Adjust with + and −, or tap the number to type it, then tap Log set.',
      'Each set shows a reps-in-reserve (RIR) target. After the set, tap how many reps you had left. The app uses it to suggest the next weight.',
      'The rest timer starts after each set, and the phone buzzes when rest is over. Tap +30 s for more time, or Skip.',
      'Single-arm and single-leg lifts: log left first, then right. A gap over 10% is flagged.',
      'Your data stays on this phone. Export every Saturday (Settings, Export) and save the files to OneDrive.'
    ] },
    { id: 'phases', title: 'The 12 weeks', lines: [
      'Each muscle group gets one heavy day and one moderate day a week. Lower A: heavy squat, moderate hinge. Lower B: heavy hinge, moderate quads. Upper A: heavy press, row and pulldown. Upper B: moderate pull-up, row and press.',
      'Weeks 1–2: re-entry and baseline. Main lifts 3 × 8 with 3–4 reps in reserve; one set fewer on the rest.',
      'Weeks 3–6: build. Heavy lifts 4 × 4–6, RIR 3 then 2 on the last set. Moderate lifts 3 × 10–12, RIR 2–3.',
      'Week 7: deload and partial retest. Main lifts 2 × 5 with 4 in reserve; half the sets elsewhere.',
      'Weeks 8–11: strength and power. Heavy lifts 4 × 4–6, RIR 2 then 1 (Care lifts and deadlift stay at RIR 2). Moderate lifts 3 × 8–10, RIR 2.',
      'Week 12: deload and full retest.',
      'Working weights, weekly volume and deload timing get checked at the Dec 12 review against your first two weeks of data.'
    ] },
    { id: 'week', title: 'Weekly schedule', lines: [
      'Sun: Lower A, 75–85 min.',
      'Mon: Upper A, 75–85 min.',
      'Tue: zone 2 walk or incline treadmill 40–45 min + 10 min mobility.',
      'Wed: Lower B, 70–80 min.',
      'Thu: Upper B, 75–85 min.',
      'Fri: boxing conditioning. 10–12 min footwork, then intervals on bike or rower from week 3, then a 15 min zone 2 walk. Weeks 1–2 and deloads: footwork + 30 min zone 2 walk.',
      'Sat: off. Optional easy zone 2 walk 30–45 min. Weekly review and export.',
      'Every lifting day starts with the warm-up, then the power drills, while you are fresh.',
      'Every day: PT exercises first, plus 5–10 min mobility. Upper days stay 72 hours apart (Mon and Thu) for the left shoulder.'
    ] },
    { id: 'prog', title: 'When to add weight (autoregulation)', lines: [
      'Double progression: when you hit the top of the rep range on every set at the target RIR, the app suggests more weight next time.',
      'RIR means reps in reserve: how many more good reps you could have done. RIR 2 = you could have done 2 more. Most sets stop 1–3 reps short of failure.',
      'If your last set had 2 or more reps in reserve beyond the target, the app suggests a step up even before you reach the top of the range.',
      'If you miss the bottom of the range, the app suggests about 5% lighter.',
      'Hack squat and deadlift: +10 lb. Presses and rows: +5 to 10 lb. Dumbbells and cables: smallest step.',
      'Left/right gap over 10% at a retest: add one extra set for the weaker side.'
    ] },
    { id: 'adjust', title: 'Adjusting on the day', lines: [
      'The suggested weight and reps are a starting point. Adjust from how the set felt.',
      'Feeling good: work at the target RIR, and let the reps rise. Don’t go below RIR 1 on anything, or below RIR 2 on deadlift and Care lifts.',
      'Feeling flat (readiness 1–2, poor sleep, or resting HR 5+ above baseline): swap a heavy day for the moderate version (fewer reps, 10% lighter) or do one set fewer.',
      'Shoulder pain 4+: follow the pain rule. No increases on Care lifts while pain is above 3.',
      'Change one thing at a time, weight or reps, on working sets only.',
      'In re-entry and deload weeks, keep at least the stated reps in reserve even when it feels easy.'
    ] },
    { id: 'power', title: 'Power drills', lines: [
      'Done first, right after the warm-up, because power fades fastest with age and needs fresh legs.',
      'Every rep fast and crisp. Stop the set if a rep slows down; these are never grinders.',
      'Box jump: low box only (12–18 in.), step down. Speed step-up: knee-height box, drive up fast.',
      'Kettlebell swing: hip snap, bell to chest height. Med-ball throws: 3–6 kg, from the hips.',
      'Med-ball drills are marked Check with PT. Skip any throw that hurts the left shoulder (pain above 3).'
    ] },
    { id: 'boxing', title: 'Boxing prep (check with your PT)', lines: [
      'Show your PT the items tagged CHECK WITH PT before week 1: cable external rotation, scap push-up, med-ball throws and cable chop.',
      'Shoulder durability: cable external rotation (Upper A) and scap push-ups (Upper B), light and pain-free. Use your PT’s versions if they differ.',
      'Rotational core: med-ball rotational toss, Pallof press and cable chop. Rotate from the hips and upper back, not the low back.',
      'Footwork (Fridays, 10–12 min): boxer’s stance, step-drag forward and back, lateral shuffles, pivots, and in-and-out steps on a line. Light on the feet; stay low-impact for the first 6 weeks.',
      'Conditioning intervals (Fridays from week 3): 30 s hard, 90 s easy on bike or rower. Later in the year these can move to bag rounds.',
      'No shadowboxing with snapping punches or bag work until your PT clears the shoulder.'
    ] },
    { id: 'zone2', title: 'Zone 2 cardio', lines: [
      'Zone 2 is a steady, purposeful pace where you can still talk in full sentences but would rather not sing.',
      'As a guide at 60, about 100–120 bpm. The talk test wins if your heart rate and the guide disagree, or if you take medication that affects heart rate.',
      'Tuesday 40–45 min, Friday 15–30 min after footwork, Saturday optional 30–45 min. Weeks 1–2 can start at 30–35 min.',
      'Brisk walking, incline treadmill or easy bike all count. Log it under Log cardio.'
    ] },
    { id: 'travel', title: 'Missed weeks and swaps', lines: [
      'The app tracks your next session, not the calendar. Missed days never skip you ahead.',
      'Missed 1 week: pick up where you left off at the same loads.',
      'Missed 2–3 weeks: repeat the last week you finished, loads down about 10% and one set fewer. The app offers this when you come back.',
      'Missed 4 weeks or more: redo the two re-entry weeks.',
      'Swap an exercise: tap Swap exercise and pick an alternative of the same purpose. The swap stays until you switch back.',
      'A swap is logged under its own name, with its own history and loads, so the original lift keeps its progress.',
      'Keep the main lifts the same in the 2 weeks before a retest so the results compare.'
    ] },
    { id: 'pain', title: 'Shoulder pain rule (0–10)', lines: [
      'Rate it during the lift and again the next morning.',
      '0–3: carry on.',
      '4–5: hold the load, cut sets by a third, or use the alternative exercise.',
      '6 or more, or sharp or night pain: stop the movement and tell your PT.',
      'Avoid until PT clears: back squat, behind-the-neck work, upright rows, dips, deep-stretch flyes, barbell overhead press, front raises, wide-grip barbell bench, bag work.'
    ] },
    { id: 'warm', title: 'Warm-up (8–10 min)', lines: [
      'Bike 5 min.',
      'Band pull-aparts 2 × 15; band external rotation 2 × 12 each (or PT version); wall slides 1 × 10.',
      'Lower days add bodyweight squats, glute bridges, leg swings.',
      'Then the power drills, then 2–3 ramp-up sets before the first main lift.'
    ] },
    { id: 'deload', title: 'When to back off early', lines: [
      'Deload early if two or more of these last a week:',
      'Resting heart rate 5+ above baseline.',
      'Readiness 2 or lower out of 5.',
      'A lift stalls for 2 sessions.',
      'Joint pain rising.'
    ] },
    { id: 'measure', title: 'How to measure', lines: [
      'Measure once a month, first thing in the morning before eating or training, after using the bathroom. Three sites only: waist, shoulders, and both arms.',
      'Use a flexible cloth tape (a self-locking one such as a MyoTape helps when measuring yourself). Stand relaxed and breathe normally. Read the tape to the nearest 0.25 in.',
      'Tape snug on the skin but not pressing in, and level all the way around. Take each measurement twice; if they differ by more than 0.25 in., take a third and use the average of the two closest.',
      'Waist: tape around the navel, level. Stand tall, belly relaxed (don’t suck in), and read at the end of a normal breath out.',
      'Shoulders: around the widest point of both shoulders (the outside of the delts), arms relaxed at your sides, tape passing over the top of the chest and the shoulder blades. Needs a helper or a mirror; if alone, use the same method every time.',
      'Arm (flexed): raise the arm to shoulder height, bend the elbow about 90 degrees and flex hard. Tape around the peak of the biceps, at a right angle to the upper arm. Left then right.',
      'The app works out shoulder-to-waist ratio and the left/right arm gap. Changes under 0.25 in. are measuring error.',
      'Your weekly weight trend tells you more about fat loss than the tape does. Use the tape to confirm the shape is changing.'
    ] },
    { id: 'food', title: 'Nutrition', lines: [
      'This drives the smaller midsection more than the training does. Two numbers matter most: protein every day and the weekly weight trend.',
      'Protein 140–160 g a day across 4 meals (30–40 g each). Add it on Today as you eat.',
      'Weight: weigh each morning after the bathroom, before eating. Judge the 7-day average, not single days. Aim to lose 0.5–1.0 lb a week.',
      'If the 7-day average hasn’t moved for 3 weeks and the waist hasn’t either, cut about 150–200 kcal a day. If you lose more than 1.5 lb a week for 2 weeks, add about 150 kcal.',
      'Calories about 1,880–2,080 a day (300–500 deficit). Carbs 150–200 g, mostly around training. Fat 60–70 g. Fiber 30 g or more. Alcohol 2 drinks a week or fewer.',
      'Optional: each Saturday, import the Cronometer Daily Nutrition file (Settings). Cronometer protein fills in days you didn’t add protein here.',
      'Days under 1,000 kcal in Cronometer count as not fully logged and are left out of its averages.'
    ] },
    { id: 'goals', title: 'Week-12 targets', lines: [
      'Body weight down about 6–10 lb on the 7-day average, with protein at target on 6 of 7 days.',
      'Waist down 1–2 in.; shoulder-to-waist ratio up 0.03–0.06.',
      'Left/right arm gap and single-side lift gaps under 10%.',
      'Main lifts back to about 90–100% of 2025 bests (hack squat sets a new baseline).',
      'Broad jump and med-ball throw up 5–10%.',
      'Shoulder pain 3/10 or lower.'
    ] }
  ];

  var NUTRITION = { kcal: [1880, 2080], protein: [140, 160], carbs: [150, 200], fat: [60, 70], fiber: 30, drinksWeek: 2, gramsPerDrink: 14, minKcal: 1000,
    lossPerWeek: [0.5, 1.0], proteinAdd: [10, 20, 30, 40] };

  return { NUTRITION: NUTRITION, SESSIONS: SESSIONS, PHASES: PHASES, PHASE_LONG: PHASE_LONG, rx: rx, rirFor: rirFor, CALENDAR_DAY: CALENDAR_DAY, INTERVALS: INTERVALS, FRIDAY: FRIDAY, GUIDE: GUIDE, WEEKS: 12,
    MEASURE_DAYS: 28, GUIDE_URL: 'https://claude.ai/artifact/HjcDSYgQS5MmXot8NTPPYK' };
})();
