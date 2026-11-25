/* 12-week program content. Edit here to change the plan; app.js holds no program details.
   Roles: power, main, sec, uni, iso, core. p1/p2 = [sets, repsLow, repsHigh].
   uni: logged Left then Right. unit: lb | kg | bw. dist: reps are metres. invert: lower weight = harder. */
var PROGRAM = (function () {
  var S = function (o) { o.alts = o.alts || []; o.unit = o.unit || 'lb'; o.step = o.step || 5; o.inc = (o.inc === undefined ? o.step : o.inc); return o; };

  var SESSIONS = [
    { key: 'LA', name: 'Lower A', focus: 'Squat strength', day: 0, mins: '70–80 min', lower: true, ex: [
      S({ n: 'Box jump (low box)', role: 'power', p1: [3, 3, 3], p2: [4, 3, 3], e1: 'Max speed', e2: 'Max speed', rest: 75, restTxt: '60–90 s', unit: 'bw', cue: 'Low box (12–18 in). Land soft, stand tall, step down. Reset each rep.', alts: ['Squat jump onto mat', 'Med-ball scoop toss'] }),
      S({ n: 'Hack squat', role: 'main', test: true, p1: [4, 6, 8], p2: [4, 4, 5], e1: 'RPE 7–8', e2: 'RPE 7.5–8.5', rest: 150, restTxt: '2–3 min', step: 5, inc: 10, startW: 90, wLabel: 'Plates (lb, not counting the sled)', cue: 'Shoulders under the pads, hands on the handles, feet shoulder-width mid-platform. Sit deep under control, drive through mid-foot, don’t lock the knees.', alts: ['Belt squat', 'Leg press', 'Goblet squat'] }),
      S({ n: 'Romanian deadlift', role: 'sec', p1: [3, 8, 8], p2: [3, 6, 8], e1: 'RIR 2', e2: 'RIR 2', rest: 120, restTxt: '2 min', step: 5, startW: 95, cue: 'Soft knees, push hips back, bar close to legs, stop when hamstrings limit.', alts: ['DB Romanian deadlift', '45-degree back extension'] }),
      S({ n: 'Bulgarian split squat', role: 'uni', uni: true, sideTest: true, p1: [3, 8, 8], p2: [3, 6, 8], e1: 'RIR 2', e2: 'RIR 2', rest: 75, restTxt: '60–90 s per side', step: 5, startW: 30, wLabel: 'Weight (lb, both DBs)', cue: 'Rear foot on bench, torso slightly forward, front knee over mid-foot. Left side first.', alts: ['Split squat (rear foot on floor)', 'Reverse lunge'] }),
      S({ n: 'Lying leg curl', role: 'iso', p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 75, restTxt: '60–90 s', step: 5, startW: 50, cue: 'Hips down, 1 s squeeze, 2–3 s lower.', alts: ['Seated leg curl'] }),
      S({ n: 'Standing calf raise', role: 'iso', p1: [3, 10, 15], p2: [3, 10, 15], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 10, startW: 90, cue: 'Full stretch with 2 s pause at bottom, full rise.', alts: ['Leg-press calf raise'] }),
      S({ n: 'Pallof press', role: 'core', uni: true, p1: [3, 10, 10], p2: [3, 10, 10], e1: 'Moderate', e2: 'Moderate', rest: 45, restTxt: '45 s', step: 5, startW: 20, cue: 'Stand side-on to cable, press out, resist rotation 2 s, return.', alts: ['Band Pallof press'] })
    ] },
    { key: 'UA', name: 'Upper A', focus: 'Press and row strength', day: 1, mins: '70–80 min', ex: [
      S({ n: 'Med-ball rotational scoop toss', role: 'power', uni: true, care: true, p1: [3, 4, 4], p2: [4, 3, 3], e1: 'Max speed', e2: 'Max speed', rest: 75, restTxt: '60–90 s', unit: 'kg', step: 1, inc: 0, startW: 4, wLabel: 'Ball (kg)', cue: 'Side-on to wall, load back hip, throw from hips, not arms. 4–6 kg. Both sides.', alts: ['Cable woodchop, fast'] }),
      S({ n: 'Neutral-grip DB bench press', role: 'main', test: true, care: true, p1: [4, 6, 8], p2: [4, 5, 6], e1: 'RPE 7–8', e2: 'RPE 8–8.5', rest: 150, restTxt: '2–3 min', step: 10, startW: 60, wLabel: 'Weight (lb, both DBs)', cue: 'Palms facing, elbows ~45°, stop 1–2 in. above chest, shoulder blades back.', alts: ['Hammer Strength chest press', 'Floor press'] }),
      S({ n: 'Chest-supported row', role: 'main', test: true, p1: [4, 6, 8], p2: [4, 5, 6], e1: 'RPE 7–8', e2: 'RPE 7–8', rest: 120, restTxt: '2 min', step: 5, startW: 70, cue: 'Chest on pad, pull elbows to hips, pause, full stretch.', alts: ['Hammer Strength row', 'Seated cable row'] }),
      S({ n: 'Lat pulldown (neutral grip)', role: 'sec', p1: [3, 8, 10], p2: [3, 8, 10], e1: 'RIR 2', e2: 'RIR 2', rest: 90, restTxt: '90 s', step: 5, startW: 90, cue: 'Lean back slightly, pull to upper chest, elbows down and in.', alts: ['Machine pulldown'] }),
      S({ n: 'Half-kneeling landmine press', role: 'uni', uni: true, care: true, sideTest: true, p1: [3, 8, 8], p2: [3, 8, 8], e1: 'RIR 2–3', e2: 'RIR 2–3', rest: 75, restTxt: '60–90 s', step: 5, startW: 25, wLabel: 'Plates on the bar (lb)', cue: 'Barbell end wedged in a corner (towel under it). Kneel on same-side knee, press up and slightly forward, ribs down. Left side first.', alts: ['Single-arm cable press', 'Hammer Strength shoulder press (if PT OK)'] }),
      S({ n: 'Cable lateral raise', role: 'iso', care: true, p1: [3, 12, 15], p2: [3, 12, 15], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 2.5, startW: 10, cue: 'Cable from low, arm slightly forward of body, raise to shoulder height only, slow lower.', alts: ['DB lateral raise (light)', 'Machine lateral raise'] }),
      S({ n: 'EZ-bar curl', role: 'iso', p1: [3, 8, 10], p2: [3, 8, 10], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 5, startW: 40, cue: 'Elbows still, full range, 2 s lower. Superset with pushdown.', alts: ['Cable curl'] }),
      S({ n: 'Rope triceps pushdown', role: 'iso', p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 5, startW: 30, cue: 'Elbows pinned, spread rope at the bottom.', alts: ['Bar pushdown'] }),
      S({ n: 'Face pull', role: 'iso', p1: [2, 15, 15], p2: [2, 15, 15], e1: 'Moderate', e2: 'Moderate', rest: 45, restTxt: '45 s', step: 5, startW: 25, cue: 'Rope to forehead, elbows high, rotate hands back.', alts: ['Band pull-apart'] })
    ] },
    { key: 'LB', name: 'Lower B', focus: 'Hinge and single-leg', day: 3, mins: '65–75 min', lower: true, ex: [
      S({ n: 'Kettlebell swing', role: 'power', p1: [3, 8, 8], p2: [4, 6, 6], e1: 'Max snap', e2: 'Max snap, heavier bell', rest: 75, restTxt: '60–90 s', step: 5, inc: 0, startW: 35, wLabel: 'Bell (lb)', cue: 'Hinge, hike the bell back, snap hips; arms just guide. Bell to chest height.', alts: ['Hip thrust (fast)', 'Broad jump'] }),
      S({ n: 'Barbell deadlift', role: 'main', test: true, p1: [3, 8, 10], p2: [3, 6, 8], e1: 'RPE 7', e2: 'RPE 7.5–8', rest: 150, restTxt: '2–3 min', step: 10, inc: 10, startW: 135, cue: 'Bar over mid-foot, shins to bar, double-overhand grip (straps on top sets, no mixed grip), brace, push the floor away. Reset each rep.', alts: ['Block pull (bar on 2–4 in. plates)', 'Sumo deadlift'] }),
      S({ n: 'Single-leg leg press', role: 'uni', uni: true, sideTest: true, p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 2', e2: 'RIR 2', rest: 60, restTxt: '60 s per side', step: 10, startW: 90, cue: 'Foot mid-plate, controlled depth, no knee lockout. Left first.', alts: ['Step-up'] }),
      S({ n: 'Leg extension', role: 'iso', p1: [2, 12, 15], p2: [2, 12, 15], e1: 'RIR 1', e2: 'RIR 1', rest: 60, restTxt: '60 s', step: 5, startW: 50, cue: '1 s squeeze at top, 2–3 s lower.', alts: ['Sissy squat (assisted)'] }),
      S({ n: 'Seated leg curl', role: 'iso', p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 75, restTxt: '60–90 s', step: 5, startW: 50, cue: 'Lean forward slightly for more stretch.', alts: ['Lying leg curl'] }),
      S({ n: 'Seated calf raise', role: 'iso', p1: [3, 15, 15], p2: [3, 15, 15], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 10, startW: 45, cue: 'Pause at bottom, full rise.', alts: ['Standing calf raise'] }),
      S({ n: 'Dead bug', role: 'core', p1: [3, 8, 8], p2: [3, 8, 8], e1: 'Moderate', e2: 'Moderate', rest: 45, restTxt: '45 s', unit: 'bw', repsLabel: 'Reps (each side)', cue: 'Low back pressed down, extend opposite arm and leg slowly.', alts: ['Bird dog'] }),
      S({ n: 'Suitcase carry', role: 'core', uni: true, dist: true, p1: [3, 30, 30], p2: [3, 30, 30], e1: 'Moderate', e2: 'Moderate', rest: 60, restTxt: '60 s', step: 5, startW: 40, wLabel: 'DB or bell (lb)', cue: 'One heavy DB or bell, walk tall without leaning, 30 m per hand. Note if one side is harder.', alts: ['Farmer carry'] })
    ] },
    { key: 'UB', name: 'Upper B', focus: 'Taper: lats, side delts, arms', day: 4, mins: '65–75 min', ex: [
      S({ n: 'Cable lateral raise', role: 'iso', care: true, p1: [4, 12, 15], p2: [4, 12, 15], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s', step: 2.5, startW: 10, cue: 'Cable from low, arm slightly forward of body, raise to shoulder height only, slow lower.', alts: ['DB lateral raise (light)', 'Machine lateral raise'] }),
      S({ n: 'Med-ball chest pass', role: 'power', care: true, p1: [3, 5, 5], p2: [4, 4, 4], e1: 'Max speed', e2: 'Max speed', rest: 75, restTxt: '60–90 s', unit: 'kg', step: 1, inc: 0, startW: 3, wLabel: 'Ball (kg)', cue: '3–4 kg, throw hard to wall from chest, catch soft. Only if shoulder pain is 0–3.', alts: ['Med-ball rotational scoop toss'] }),
      S({ n: 'Assisted pull-up', role: 'main', care: true, invert: true, p1: [4, 8, 10], p2: [4, 6, 8], e1: 'RIR 2', e2: 'RIR 2', rest: 120, restTxt: '2 min', step: 5, startW: 70, wLabel: 'Assistance (lb, less is harder)', cue: 'Neutral or shoulder-width grip, full hang to chin over bar, no kipping.', alts: ['Wide neutral-grip pulldown'] }),
      S({ n: 'Single-arm DB row', role: 'uni', uni: true, sideTest: true, p1: [3, 10, 10], p2: [3, 8, 8], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 60, restTxt: '60 s per side', step: 5, startW: 40, wLabel: 'Dumbbell (lb)', cue: 'Hand and knee on bench, pull DB to hip, full stretch. Left first.', alts: ['Single-arm cable row'] }),
      S({ n: 'Low-incline DB press', role: 'sec', care: true, p1: [3, 8, 10], p2: [3, 8, 10], e1: 'RIR 2', e2: 'RIR 2', rest: 90, restTxt: '90 s', step: 10, startW: 50, wLabel: 'Weight (lb, both DBs)', cue: '15–30° bench, neutral or slight-angle grip, shortened bottom.', alts: ['Incline Hammer Strength press'] }),
      S({ n: 'Straight-arm cable pulldown', role: 'iso', care: true, p1: [2, 12, 15], p2: [2, 12, 15], e1: 'RIR 1', e2: 'RIR 1', rest: 60, restTxt: '60 s', step: 5, startW: 30, cue: 'Slight hinge, arms nearly straight, sweep bar to thighs.', alts: ['DB pullover (light)'] }),
      S({ n: 'Reverse cable fly', role: 'iso', p1: [3, 15, 15], p2: [3, 15, 15], e1: 'RIR 1–2', e2: 'RIR 1–2', rest: 45, restTxt: '45 s', step: 2.5, startW: 10, cue: 'Cross cables, arms slightly bent, pull wide, squeeze.', alts: ['Rear delt machine'] }),
      S({ n: 'Incline DB curl', role: 'iso', care: true, p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 1', e2: 'RIR 1', rest: 60, restTxt: '60 s', step: 5, startW: 30, wLabel: 'Weight (lb, both DBs)', cue: 'Bench ~60°, arms hang, curl without swinging.', alts: ['Cable curl'] }),
      S({ n: 'Single-arm cable pushdown', role: 'iso', uni: true, p1: [3, 10, 12], p2: [3, 10, 12], e1: 'RIR 1', e2: 'RIR 1', rest: 45, restTxt: '45 s', step: 2.5, startW: 15, cue: 'Elbow pinned, full lockout. Left first.', alts: ['Rope pushdown'] }),
      S({ n: 'Half-kneeling cable chop', role: 'core', uni: true, care: true, p1: [3, 8, 8], p2: [3, 8, 8], e1: 'Moderate', e2: 'Moderate', rest: 45, restTxt: '45 s', step: 5, startW: 20, cue: 'High to low across body, rotate through upper back, hips square.', alts: ['Med-ball rotational toss'] })
    ] }
  ];

  var PHASES = ['', 'Re-entry', 'Re-entry', 'Phase 1', 'Phase 1', 'Phase 1', 'Phase 1', 'Deload', 'Phase 2', 'Phase 2', 'Phase 2', 'Phase 2', 'Deload + retest'];
  var PHASE_LONG = ['', 'Re-entry and baseline', 'Re-entry and baseline', 'Build', 'Build', 'Build', 'Build', 'Deload and partial retest', 'Strength and power', 'Strength and power', 'Strength and power', 'Strength and power', 'Deload and full retest'];

  /* Prescription for one exercise in one week. Returns sets, rep range, effort, note, and whether loads may rise. */
  function rx(ex, wk, sessKey) {
    var p1 = ex.p1, p2 = ex.p2, r;
    var mainish = ex.role === 'main' || ex.role === 'sec';
    if (wk <= 2) {
      if (mainish) r = { sets: 3, lo: 8, hi: 8, eff: 'RPE 6–7' };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Learn the drill, easy speed' };
      else r = { sets: Math.max(2, p1[0] - 1), lo: p1[1], hi: p1[2], eff: 'RIR 3' };
      r.prog = true;
      if (wk === 2 && ex.test) r.note = 'Baseline test: after your sets, work up to a weight you can lift for 5 at RPE 8. Log it as an extra set.';
      if (wk === 2 && ex.sideTest) r.note = 'Single-side test: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    } else if (wk <= 6) {
      r = { sets: p1[0], lo: p1[1], hi: p1[2], eff: ex.e1, prog: true };
    } else if (wk === 7) {
      if (ex.role === 'main') r = { sets: 2, lo: 5, hi: 5, eff: 'RPE 6 at week-6 load' };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Easy speed' };
      else r = { sets: Math.ceil(p1[0] / 2), lo: p1[1], hi: p1[2], eff: 'RIR 3' };
      r.prog = false; r.deload = true;
      if (ex.sideTest) r.note = 'Single-side retest: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    } else if (wk <= 11) {
      r = { sets: p2[0], lo: p2[1], hi: p2[2], eff: ex.e2, prog: true };
    } else {
      var retestDay = sessKey === 'LA' || sessKey === 'UA' || sessKey === 'LB';
      if (ex.test && retestDay) r = { sets: 1, lo: 5, hi: 5, eff: 'RPE 8 (retest)', note: 'Full retest: warm up, then work up to a weight you can lift for 5 at RPE 8.' };
      else if (ex.role === 'main') r = { sets: 2, lo: 5, hi: 5, eff: 'RPE 6' };
      else if (ex.role === 'power') r = { sets: 2, lo: p1[1], hi: p1[2], eff: 'Easy speed' };
      else r = { sets: Math.ceil(p1[0] / 2), lo: p1[1], hi: p1[2], eff: 'RIR 3' };
      r.prog = false; r.deload = true;
      if (ex.sideTest) r.note = 'Single-side retest: same load both sides, reps to 1 in reserve, left first. Log it as an extra set.';
    }
    return r;
  }

  var CALENDAR_DAY = ['Lower A', 'Upper A', 'Walk or incline treadmill 35–45 min + 10 min mobility', 'Lower B', 'Upper B', 'Weeks 1–2: walk. Week 3 on: intervals (bike or rower) + 15 min walk', 'Off (easy walk OK). Weekly review and export.'];
  var INTERVALS = ['', '', '', '6 × 30 s', '6 × 30 s', '7 × 30 s', '7 × 30 s', '', '6 × 30 s', '7 × 30 s', '8 × 30 s', '8 × 30 s', ''];

  var GUIDE = [
    { id: 'use', title: 'Using this app', lines: [
      'Today shows your next session. Tap a card to log it.',
      'Weight and reps start at the suggestion or your last set. Adjust with + and −, or tap the number to type it, then tap Log set.',
      'The rest timer starts after each set, and the phone buzzes when rest is over. Tap +30 s for more time, or Skip.',
      'Single-arm and single-leg lifts: log left first, then right. A gap over 10% is flagged.',
      'RPE and shoulder pain are optional, one tap each. Tap again to clear.',
      'Your data stays on this phone. Export every Saturday (Settings, Export) and save the files to OneDrive.'
    ] },
    { id: 'phases', title: 'The 12 weeks', lines: [
      'Weeks 1–2: re-entry and baseline. Main lifts 3 × 8 at RPE 6–7; one set fewer on the rest.',
      'Weeks 3–6: build (muscle and symmetry). A days 4 × 6–8, B days 3 × 8–10.',
      'Week 7: deload and partial retest. Main lifts 2 × 5 at RPE 6; half the sets elsewhere.',
      'Weeks 8–11: strength and power. A days 4 × 4–5, B days 3 × 6–8.',
      'Week 12: deload and full retest.'
    ] },
    { id: 'week', title: 'Weekly schedule', lines: [
      'Sun: Lower A (squat) + power, 70–80 min.',
      'Mon: Upper A (press and row) + power, 70–80 min.',
      'Tue: brisk walk or incline treadmill 35–45 min + 10 min mobility.',
      'Wed: Lower B (hinge, single-leg) + power, 65–75 min.',
      'Thu: Upper B (taper: lats, side delts, arms) + power, 65–75 min.',
      'Fri: weeks 1–2 walk; week 3 on, intervals on bike or rower + 15 min walk.',
      'Sat: off (easy walk OK). Weekly review and export.',
      'Every day: PT exercises first, plus 5–10 min mobility. Upper days stay 72 hours apart (Mon and Thu) for the left shoulder.'
    ] },
    { id: 'prog', title: 'When to add weight', lines: [
      'Hit the top of the rep range on every set at the target effort, and the app suggests more weight next time.',
      'Hack squat and deadlift: +10 lb. Presses and rows: +5 to 10 lb. Dumbbells and cables: smallest step.',
      'Missed the range? Stay at the same weight and aim for more reps.',
      'Left/right gap over 10% at a retest: add one extra set for the weaker side.'
    ] },
    { id: 'adjust', title: 'Going beyond the suggestion', lines: [
      'The suggested weight and reps are a starting point. Adjust from how the set felt.',
      'Go up one step (now or next session): the last set felt 2+ reps easier than the target, or you beat the top of the range by 2+ reps.',
      'Drop 5–10%: you missed the bottom of the range, form broke down, or RPE ran 1+ above target.',
      'Drop 5–10% or do one set fewer: readiness 1–2, poor sleep, or resting HR 5+ above baseline.',
      'Shoulder pain 4+: follow the pain rule. No increases on Care lifts while pain is above 3.',
      'Change one thing at a time, weight or reps, on working sets only.',
      'In re-entry and deload weeks, stay at or below the stated RPE even when it feels easy.'
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
      'Avoid until PT clears: back squat, behind-the-neck work, upright rows, dips, deep-stretch flyes, barbell overhead press, front raises, wide-grip barbell bench.'
    ] },
    { id: 'warm', title: 'Warm-up (8–10 min)', lines: [
      'Bike 5 min.',
      'Band pull-aparts 2 × 15; band external rotation 2 × 12 each (or PT version); wall slides 1 × 10.',
      'Lower days add bodyweight squats, glute bridges, leg swings.',
      '2–3 ramp-up sets before the first main lift.'
    ] },
    { id: 'deload', title: 'When to back off early', lines: [
      'Deload early if two or more of these last a week:',
      'Resting heart rate 5+ above baseline.',
      'Readiness 2 or lower out of 5.',
      'A lift stalls for 2 sessions.',
      'Joint pain rising.'
    ] },
    { id: 'food', title: 'Nutrition', lines: [
      'Calories about 1,880–2,080 a day (300–500 deficit).',
      'Protein 140–160 g across 4 meals.',
      'Carbs 150–200 g, mostly around training. Fat 60–70 g. Fiber 30 g or more.',
      'Alcohol 2 drinks a week or fewer.'
    ] },
    { id: 'goals', title: 'Week-12 targets', lines: [
      'Main lifts back to about 90–100% of 2025 bests (hack squat sets a new baseline).',
      'Waist down 1–2 in.; shoulder-to-waist ratio up 0.03–0.06.',
      'Left/right gaps under 10%.',
      'Broad jump and med-ball throw up 5–10%.',
      'Shoulder pain 3/10 or lower.'
    ] }
  ];

  return { SESSIONS: SESSIONS, PHASES: PHASES, PHASE_LONG: PHASE_LONG, rx: rx, CALENDAR_DAY: CALENDAR_DAY, INTERVALS: INTERVALS, GUIDE: GUIDE, WEEKS: 12,
    GUIDE_URL: 'https://claude.ai/artifact/HjcDSYgQS5MmXot8NTPPYK' };
})();
