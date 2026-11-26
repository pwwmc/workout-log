/* Workout Log: offline, on-device workout logger. Data lives in this browser's localStorage. */
(function () {
  'use strict';
  var P = PROGRAM;
  var KEY = 'workoutlog.v1';
  var VERSION = '1.2.0';
  var ORDER = ['LA', 'UA', 'LB', 'UB'];

  /* ---------- storage ---------- */
  function fresh() {
    return { v: 1, settings: { start: '2026-11-29', baseHR: null, keepAwake: true, sound: true, lastExport: null },
      pos: { wk: 1, done: [] }, lighten: null, breakAck: null, sessions: [], sets: [], checks: [], body: [], cardio: [], nutrition: [], swaps: {}, active: null };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) { var f = fresh(); for (var k in f) if (!(k in s)) s[k] = f[k]; for (var k2 in f.settings) if (!(k2 in s.settings)) s.settings[k2] = f.settings[k2]; return s; }
    } catch (e) { /* fall through */ }
    return fresh();
  }
  var DB = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { toast('Could not save. Phone storage may be full. Export now.'); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { UI.persisted = ok; });

  /* ---------- UI state (not saved) ---------- */
  var UI = { tab: 'today', screen: null, pick: null, sheet: null, swapOpen: false, extra: false, guideOpen: 'use', toast: '', detail: null,
    check: null, body: null, cardio: null, persisted: false, installEvt: null, updateReady: null };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function parseD(s) { var a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function addDays(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDay(s) { var d = parseD(s); return DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate(); }
  function fmtShort(s) { var d = parseD(s); return MON[d.getMonth()] + ' ' + d.getDate(); }
  function num(n) { return String(Math.round(n * 100) / 100); }
  function fix1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function fix2(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function roundStep(x, st) { return Math.max(0, Math.round(x / st) * st); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function calWeek(dateStr) { return Math.floor(daysBetween(DB.settings.start, dateStr) / 7) + 1; }
  function getSession(key) { for (var i = 0; i < P.SESSIONS.length; i++) if (P.SESSIONS[i].key === key) return P.SESSIONS[i]; return null; }
  function exName(ex) { return DB.swaps[ex.n] || ex.n; }
  function unitOf(ex) { return ex.unit === 'kg' ? 'kg' : 'lb'; }
  function rxFor(ex, wk, key) {
    var r = P.rx(ex, wk, key), o = {}; for (var k in r) o[k] = r[k];
    if (DB.lighten && DB.lighten.wk === wk && !o.deload) { o.sets = Math.max(1, o.sets - 1); o.light = true; }
    return o;
  }
  function rangeTxt(r) { return r.lo === r.hi ? String(r.lo) : r.lo + '–' + r.hi; }
  function vol(s) { return s.bw ? s.r : s.w * s.r; }
  function gapPct(a, b) { var va = vol(a), vb = vol(b), mx = Math.max(va, vb); return mx ? Math.round(Math.abs(va - vb) / mx * 100) : 0; }
  function e1rm(w, r) { return w * (1 + r / 30); }
  function doneCount(ex, sets) { var w = sets.filter(function (s) { return !s.extra; }); return ex.uni ? w.filter(function (s) { return s.side === 'R'; }).length : w.length; }
  function phaseOf(wk) { return P.PHASES[Math.min(12, Math.max(1, wk))]; }
  function plannedDate(wk, key) { return addDays(DB.settings.start, (wk - 1) * 7 + getSession(key).day); }
  function nextKey() { for (var i = 0; i < ORDER.length; i++) if (DB.pos.done.indexOf(ORDER[i]) < 0) return ORDER[i]; return 'LA'; }
  function currentKey() { if (DB.active) return DB.active.key; return UI.pick || nextKey(); }
  function lastSession() { return DB.sessions.length ? DB.sessions[DB.sessions.length - 1] : null; }

  /* ---------- progression ---------- */
  function adviseFrom(ex, last, r) {
    var u = unitOf(ex);
    if (!last || !last.length) return { w: ex.unit === 'bw' ? 0 : ex.startW, r: r.hi, why: 'No history yet. Pick a comfortable starting weight.', kind: 'first' };
    var work = last.filter(function (s) { return !s.extra; }); if (!work.length) work = last;
    var ws = work.map(function (s) { return s.w; });
    var base = ex.invert ? Math.min.apply(null, ws) : Math.max.apply(null, ws);
    var lastRx = work[0].rxSets || r.sets, lastHi = work[0].rxHi || r.hi;
    var cnt = ex.uni ? work.filter(function (s) { return s.side === 'R'; }).length : work.length;
    var hit = cnt >= lastRx && work.every(function (s) { return s.r >= lastHi; });
    var painHigh = work.some(function (s) { return s.pain != null && s.pain >= 4; });
    if (DB.lighten && DB.lighten.wk === UI._adviseWk && !r.deload) {
      var lw = ex.unit === 'bw' ? 0 : roundStep(ex.invert ? base / DB.lighten.f : base * DB.lighten.f, ex.step);
      return { w: lw, r: r.hi, why: 'About ' + Math.round((1 - DB.lighten.f) * 100) + '% lighter after a break.', kind: 'light' };
    }
    if (r.deload) return { w: base, r: r.hi, why: 'Deload week: same load as last time, easy effort.', kind: 'deload' };
    if (painHigh && ex.care) return { w: base, r: r.hi, why: 'Hold: shoulder pain was 4 or more last time.', kind: 'hold' };
    if (hit && r.prog && ex.inc > 0 && ex.unit !== 'bw') {
      var nw = ex.invert ? Math.max(0, base - ex.inc) : base + ex.inc;
      return { w: nw, r: r.lo, why: (ex.invert ? 'Less assistance' : 'Up ' + num(ex.inc) + ' ' + u) + ': you hit ' + lastHi + ' on every set last time.', kind: 'up' };
    }
    var lastW = work[work.length - 1], tgt = lastW.rxRir;
    if (!hit && r.prog && ex.unit !== 'bw' && ex.step > 0 && ex.role !== 'power' && lastW.rir != null && tgt != null && lastW.rir >= tgt + 2 && lastW.r >= (lastW.rxLo || r.lo) && !(painHigh && ex.care)) {
      var uw = ex.invert ? Math.max(0, base - ex.step) : base + ex.step;
      return { w: uw, r: r.lo, why: (ex.invert ? 'Less assistance' : 'Up ' + num(ex.step) + ' ' + u) + ': your last set had ' + (lastW.rir >= 5 ? '5+' : lastW.rir) + ' reps left, target ' + tgt + '.', kind: 'up' };
    }
    var missed = work.some(function (s) { return s.r < (s.rxLo || r.lo); });
    if (missed && ex.unit !== 'bw' && ex.role !== 'power' && ex.role !== 'core' && !r.deload) {
      var dw = ex.invert ? roundStep(base * 1.05 + ex.step / 2, ex.step) : roundStep(base * 0.95, ex.step);
      if (dw === base) dw = ex.invert ? base + ex.step : Math.max(0, base - ex.step);
      return { w: dw, r: r.lo, why: (ex.invert ? 'More assistance' : 'About 5% lighter') + ': a set fell short of ' + (work[0].rxLo || r.lo) + ' reps last time.', kind: 'down' };
    }
    return { w: base, r: r.hi, why: hit ? 'Same as last time.' : 'Same as last time. Aim for ' + r.hi + ' on every set at the target RIR.', kind: 'same' };
  }
  function lastSetsFor(name, excludeSid) {
    var hist = DB.sets.filter(function (s) { return s.ex === name && s.sid !== excludeSid; });
    if (!hist.length) return null;
    var sid = hist[hist.length - 1].sid;
    return hist.filter(function (s) { return s.sid === sid; });
  }
  function advise(ex, wk, key, excludeSid) { UI._adviseWk = wk; return adviseFrom(ex, lastSetsFor(exName(ex), excludeSid), rxFor(ex, wk, key)); }

  /* ---------- active session ---------- */
  function ensureActive(key) {
    if (DB.active && DB.active.key === key) return DB.active;
    DB.active = { sid: uid(), wk: DB.pos.wk, key: key, date: today(), startedAt: Date.now(), exIdx: 0, side: 'L', w: 0, r: 0, rir: null, pain: null, timerEnd: 0, timerTotal: 0, restDone: false, warm: false };
    return DB.active;
  }
  function sessSets(sid) { return DB.sets.filter(function (s) { return s.sid === sid; }); }
  function exSets(a, i) { return DB.sets.filter(function (s) { return s.sid === a.sid && s.exi === i; }); }
  function openEx(i) {
    var key = currentKey(); var a = ensureActive(key); var ex = getSession(key).ex[i];
    a.exIdx = i; a.rir = null; a.pain = null; UI.extra = false; UI.swapOpen = false;
    var mine = exSets(a, i), last = mine[mine.length - 1];
    if (last) { a.w = last.w; a.r = last.r; a.side = ex.uni && last.side === 'L' ? 'R' : 'L'; }
    else { var adv = advise(ex, a.wk, a.key, a.sid); a.w = adv.w; a.r = adv.r; a.side = 'L'; }
    if (a.timerEnd && Date.now() > a.timerEnd + 60000) { a.timerEnd = 0; a.restDone = false; }
    save(); UI.screen = 'ex'; wake(true); render();
  }
  function logSet() {
    var a = DB.active, sess = getSession(a.key), ex = sess.ex[a.exIdx], r = rxFor(ex, a.wk, a.key);
    var mine = exSets(a, a.exIdx);
    var setNo = mine.filter(function (s) { return !ex.uni || s.side === a.side; }).length + 1;
    DB.sets.push({ id: uid(), sid: a.sid, date: a.date, wk: a.wk, key: a.key, exi: a.exIdx, ex: exName(ex), orig: ex.n, side: ex.uni ? a.side : 'Both', setNo: setNo,
      w: ex.unit === 'bw' ? 0 : a.w, r: a.r, rir: a.rir, rpe: a.rir == null ? null : 10 - a.rir, pain: a.pain, bw: ex.unit === 'bw', unit: ex.unit, dist: !!ex.dist, extra: UI.extra || false, rxSets: r.sets, rxHi: r.hi, rxLo: r.lo, rxRir: r.rir ? r.rir[1] : null });
    if (ex.uni) a.side = a.side === 'L' ? 'R' : 'L';
    a.rir = null; a.pain = null;
    a.timerTotal = ex.rest; a.timerEnd = Date.now() + ex.rest * 1000; a.restDone = false;
    primeAudio(); save(); render();
  }
  function undoSet() {
    var a = DB.active, mine = exSets(a, a.exIdx); if (!mine.length) return;
    var gone = mine[mine.length - 1];
    DB.sets = DB.sets.filter(function (s) { return s.id !== gone.id; });
    if (gone.side === 'L' || gone.side === 'R') a.side = gone.side;
    a.w = gone.w; a.r = gone.r; a.timerEnd = 0; a.restDone = false; save(); render();
  }
  function finishSession() {
    var a = DB.active;
    if (!a) { var key = currentKey(); a = ensureActive(key); }
    var sets = sessSets(a.sid);
    if (!sets.length && !confirm('No sets logged. Mark this session as done anyway?')) return;
    DB.sessions.push({ id: a.sid, wk: a.wk, key: a.key, date: a.date, startedAt: a.startedAt, endedAt: Date.now(), light: !!(DB.lighten && DB.lighten.wk === a.wk) });
    if (a.wk === DB.pos.wk && DB.pos.done.indexOf(a.key) < 0) DB.pos.done.push(a.key);
    if (DB.pos.done.length >= 4) {
      if (DB.lighten && DB.lighten.wk === DB.pos.wk) DB.lighten = null;
      DB.pos.wk += 1; DB.pos.done = [];
    }
    DB.active = null; UI.pick = null; UI.screen = null; UI.tab = 'today'; wake(false);
    save(); toast('Session saved'); render();
  }

  /* ---------- timer, sound, wake lock ---------- */
  var audioCtx = null;
  function primeAudio() { if (!DB.settings.sound) return; try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) { audioCtx = null; } }
  function beep() {
    if (!DB.settings.sound || !audioCtx) return;
    try {
      [0, 0.25].forEach(function (t) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        var s = audioCtx.currentTime + t; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.4, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.18);
        o.start(s); o.stop(s + 0.2);
      });
    } catch (e) { /* ignore */ }
  }
  setInterval(function () {
    var a = DB.active; if (!a || !a.timerEnd || a.restDone) return;
    var left = (a.timerEnd - Date.now()) / 1000;
    var t = document.getElementById('tleft'), b = document.getElementById('tbar');
    if (left <= 0) {
      a.restDone = true; save();
      if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      beep(); if (UI.screen === 'ex') render(); return;
    }
    if (t) t.textContent = mmss(left);
    if (b) b.style.width = Math.round(left / a.timerTotal * 100) + '%';
  }, 250);
  var wakeLock = null;
  function wake(on) {
    if (!('wakeLock' in navigator)) return;
    if (on && DB.settings.keepAwake) { if (!wakeLock) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; l.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {}); }
    else if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && UI.screen === 'ex') wake(true); });

  function toast(msg) { UI.toast = msg; render(); clearTimeout(toast.t); toast.t = setTimeout(function () { UI.toast = ''; render(); }, 2400); }

  /* ---------- icons ---------- */
  var IC = {
    chev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A4F57" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    down: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A4F57" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    gear: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    today: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
    pulse: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
    tape: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4"/></svg>',
    chart: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/></svg>',
    book: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>'
  };

  /* ---------- small builders ---------- */
  function chipRow(list, cols, cur, act, toneFn, sm) {
    return '<div class="chips" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + list.map(function (n) {
      var on = cur === n.v, tone = toneFn ? toneFn(n.v) : 'var(--blue)';
      return '<button class="chip' + (sm ? ' sm' : '') + (on ? ' on' : '') + '" style="' + (on ? 'background:' + tone + ';border-color:' + tone : '') + '" data-a="' + act + '" data-v="' + n.v + '" aria-pressed="' + on + '">' + esc(n.l) + '</button>';
    }).join('') + '</div>';
  }
  function nums(a, b) { var o = []; for (var i = a; i <= b; i++) o.push({ v: i, l: String(i) }); return o; }
  function painTone(n) { return n >= 6 ? '#991B1B' : (n >= 4 ? '#C2410C' : '#1D4ED8'); }
  function stepper(label, value, field, act, sm, inputmode) {
    return '<div class="stack"><div class="label">' + esc(label) + '</div><div class="stepper' + (sm ? ' sm' : '') + '">' +
      '<button data-a="' + act + '" data-d="-1" aria-label="Decrease ' + esc(label) + '">−</button>' +
      '<input type="text" inputmode="' + (inputmode || 'decimal') + '" data-f="' + field + '" value="' + esc(value) + '" aria-label="' + esc(label) + '">' +
      '<button data-a="' + act + '" data-d="1" aria-label="Increase ' + esc(label) + '">+</button></div></div>';
  }
  function lineChart(pts, opts) {
    opts = opts || {};
    if (pts.length < 2) return '<div class="small">' + (pts.length ? 'One entry so far: ' + esc(opts.fmt ? opts.fmt(pts[0].y) : pts[0].y) + '. A trend shows after the next one.' : 'No entries yet.') + '</div>';
    var W = 320, H = 120, L = 6, R = 6, T = 12, B = 22;
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (x1 === x0) x1 = x0 + 1; if (y1 === y0) { y1 += 1; y0 -= 1; }
    var px = function (x) { return L + (x - x0) / (x1 - x0) * (W - L - R); }, py = function (y) { return T + (1 - (y - y0) / (y1 - y0)) * (H - T - B); };
    var line = pts.map(function (p) { return px(p.x).toFixed(1) + ',' + py(p.y).toFixed(1); }).join(' ');
    var f = opts.fmt || function (v) { return num(v); };
    var first = pts[0], last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'Trend') + ' from ' + esc(f(first.y)) + ' to ' + esc(f(last.y)) + '">' +
      '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="#DEDAD1"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + px(last.x).toFixed(1) + '" cy="' + py(last.y).toFixed(1) + '" r="5" fill="#1D4ED8"/>' +
      '<text x="' + L + '" y="' + (H - 6) + '" font-size="12" fill="#4A4F57">' + esc(fmtShort(iso(new Date(first.x)))) + '</text>' +
      '<text x="' + (W - R) + '" y="' + (H - 6) + '" font-size="12" fill="#4A4F57" text-anchor="end">' + esc(fmtShort(iso(new Date(last.x)))) + '</text>' +
      '</svg><div class="small">' + esc(f(first.y)) + ' → <b>' + esc(f(last.y)) + '</b></div>';
  }

  /* ---------- screens ---------- */
  function navBar() {
    var t = [['today', 'Today', IC.today], ['check', 'Check-in', IC.pulse], ['body', 'Body', IC.tape], ['progress', 'Progress', IC.chart], ['guide', 'Guide', IC.book]];
    return '<nav class="nav">' + t.map(function (x) { return '<button class="' + (UI.tab === x[0] ? 'on' : '') + '" data-a="tab" data-v="' + x[0] + '">' + x[2] + x[1] + '</button>'; }).join('') + '</nav>';
  }

  function breakBanner() {
    var ls = lastSession(); if (!ls || DB.active) return '';
    var days = daysBetween(iso(new Date(ls.endedAt)), today());
    if (days < 14 || DB.breakAck === ls.id || DB.lighten) return '';
    var W = DB.pos.done.length ? DB.pos.wk : Math.max(1, DB.pos.wk - 1);
    var h = '<div class="card pad stack"><div style="font-size:18px;font-weight:700">Welcome back. It’s been ' + days + ' days.</div>';
    if (days >= 28) {
      h += '<div class="small">After 4 weeks or more, redo the two re-entry weeks, starting about 15% lighter.</div>' +
        '<button class="btn primary" data-a="break-restart">Restart with re-entry weeks</button>' +
        '<button class="btn" data-a="break-repeat" data-v="' + W + '">Repeat week ' + W + ', 10% lighter</button>';
    } else {
      h += '<div class="small">Recommended: repeat week ' + W + ' about 10% lighter with one set fewer, then carry on.</div>' +
        '<button class="btn primary" data-a="break-repeat" data-v="' + W + '">Repeat week ' + W + ', 10% lighter</button>';
    }
    return h + '<button class="btn link" data-a="break-carry">Carry on as planned</button></div>';
  }

  function exportDue() {
    var dates = DB.sets.map(function (s) { return s.date; }).concat(DB.checks.map(function (c) { return c.date; }), DB.body.map(function (b) { return b.date; }));
    if (!dates.length) return false;
    var first = dates.sort()[0], sat = new Date().getDay() === 6;
    var last = DB.settings.lastExport;
    if (!last) return sat || daysBetween(first, today()) >= 7;
    var d = daysBetween(last.slice(0, 10), today());
    return d >= 7 || (sat && d >= 1);
  }

  /* ---------- daily basics: protein and weight trend ---------- */
  function checkOn(d) { return DB.checks.filter(function (c) { return c.date === d; })[0] || null; }
  function proteinOn(d) {
    var c = checkOn(d); if (c && c.protein > 0) return c.protein;
    var n = DB.nutrition.filter(function (o) { return o.date === d && fullDay(o); })[0];
    return n ? n.protein : null;
  }
  function proteinWeek(end) {
    var vals = []; for (var i = 6; i >= 0; i--) { var v = proteinOn(addDays(end, -i)); if (v != null) vals.push(v); }
    return { n: vals.length, avg: vals.length ? vals.reduce(function (s, x) { return s + x; }, 0) / vals.length : null, hit: vals.filter(function (v) { return v >= N.protein[0]; }).length };
  }
  function bwAvg(end) {
    var from = addDays(end, -6), w = DB.checks.filter(function (c) { return c.bw && c.date >= from && c.date <= end; });
    return w.length ? { avg: w.reduce(function (s, c) { return s + c.bw; }, 0) / w.length, n: w.length } : null;
  }
  function weightTrend() {
    var t = today(), cur = bwAvg(t), prev = bwAvg(addDays(t, -7));
    return { cur: cur, prev: prev, change: cur && prev && cur.n >= 3 && prev.n >= 3 ? cur.avg - prev.avg : null };
  }
  function trendStatus(ch) {
    if (ch == null) return '';
    var loss = -ch;
    if (loss < N.lossPerWeek[0] - 0.1) return loss < 0 ? 'up, not down' : 'slower than target';
    if (loss > 1.5) return 'faster than target';
    return 'on target';
  }
  function dailyCard() {
    var t = today(), c = checkOn(t), pToday = c && c.protein ? c.protein : 0, pw = proteinWeek(t), wt = weightTrend();
    var pct = Math.min(100, Math.round(pToday / N.protein[0] * 100));
    var h = '<div class="card pad stack daily"><div class="row" style="justify-content:space-between"><div class="label">Daily basics</div><button class="btn link" style="min-height:36px;padding:0" data-a="tab" data-v="progress">Trends</button></div>';
    h += '<div class="grid2"><div class="stat dark"><span class="label">Weight, 7-day avg</span><span class="v">' + (wt.cur ? fix1(wt.cur.avg) : '–') + '<span style="font-size:16px"> lb</span></span><span class="small">' +
      (wt.change != null ? (wt.change > 0 ? '+' : '') + fix1(wt.change) + ' lb vs last week · ' + trendStatus(wt.change) : 'Goal: down 0.5–1.0 lb a week') + '</span></div>' +
      '<div class="stat dark"><span class="label">Protein today</span><span class="v">' + Math.round(pToday) + '<span style="font-size:16px"> g</span></span><span class="small">Target ' + N.protein[0] + '–' + N.protein[1] + ' · 7-day avg ' + (pw.avg == null ? '–' : Math.round(pw.avg) + ' g') + '</span></div></div>';
    h += '<div class="progress" aria-label="Protein ' + pct + '% of target"><div style="width:' + pct + '%"></div></div>';
    h += '<div class="label">Add protein</div><div class="chips" style="grid-template-columns:repeat(5,minmax(0,1fr))">' +
      N.proteinAdd.map(function (g) { return '<button class="chip sm" data-a="p-add" data-v="' + g + '">+' + g + '</button>'; }).join('') +
      '<button class="chip sm" data-a="p-add" data-v="-10" aria-label="Remove 10 grams">−10</button></div>';
    if (!c || !c.bw) h += '<button class="btn ghost" data-a="tab" data-v="check">Log this morning\u2019s weight</button>';
    return h + '</div>';
  }

  function renderToday() {
    var h = '';
    if (DB.pos.wk > 12) {
      return '<div class="scroll"><div class="row"><div class="grow"><div class="kicker">' + fmtDay(today()) + '</div><h1 class="h1">Program complete</h1></div>' +
        '<button class="iconbtn" data-a="settings" aria-label="Settings">' + IC.gear + '</button></div>' +
        '<div class="sub">All 12 weeks are logged. Export your data and compare the retests in the workbook.</div>' +
        '<button class="btn primary" data-a="export">Export my data</button>' +
        '<button class="btn" data-a="restart-block">Start a new 12 weeks</button></div>';
    }
    var key = currentKey(), sess = getSession(key), a = DB.active && DB.active.key === key ? DB.active : null;
    var wk = a ? a.wk : DB.pos.wk;
    var planned = plannedDate(wk, key);
    h += '<div class="row"><div class="grow stack" style="gap:4px"><div class="kicker">' + fmtDay(today()) + ' · Week ' + wk + ' · ' + esc(phaseOf(wk)) + '</div>' +
      '<h1 class="h1">' + esc(sess.name) + '</h1><div class="sub">' + esc(sess.focus) + ' · ' + sess.mins + (planned !== today() ? ' · planned ' + fmtShort(planned) : '') + '</div></div>' +
      '<button class="iconbtn" data-a="settings" aria-label="Settings">' + IC.gear + '</button></div>';
    if (UI.updateReady) h += '<button class="btn ghost" data-a="update">An update is ready. Tap to restart the app.</button>';
    if (today() < DB.settings.start && !DB.sets.length) h += '<div class="note info">The program starts ' + fmtDay(DB.settings.start) + '. You can start early if you like.</div>';
    if (DB.lighten && DB.lighten.wk === wk) h += '<div class="note info">This week runs about ' + Math.round((1 - DB.lighten.f) * 100) + '% lighter with one set fewer, after your break.</div>';
    h += breakBanner();
    if (exportDue()) h += '<div class="note warn row" style="gap:10px"><span class="grow">Weekly backup is due.</span><button class="btn ghost" style="min-height:44px" data-a="export">Export</button></div>';
    h += dailyCard();
    var dow = new Date().getDay(), slot = dow === 5 ? 'Boxing conditioning: ' + (P.FRIDAY[Math.min(12, DB.pos.wk)] || P.CALENDAR_DAY[5]) : P.CALENDAR_DAY[dow];
    var lb = lastOf(DB.body);
    if (dow === 6 && (!lb || daysBetween(lb.date, today()) >= P.MEASURE_DAYS - 2)) h += '<div class="note info row" style="gap:10px"><span class="grow">Monthly measurements are due (waist, shoulders, arms).</span><button class="btn ghost" style="min-height:44px" data-a="tab" data-v="body">Measure</button></div>';
    if (dow === 6) {
      var li = DB.settings.lastNutritionImport, recent = li && daysBetween(li.slice(0, 10), today()) < 1;
      if (recent && DB.nutrition.length) h += '<div class="card pad stack"><div class="label">Nutrition this week</div><div style="font-size:17px;line-height:1.4">' + esc(nutritionLine(nutritionWeek(lastOf(DB.nutrition).date))) + '</div><button class="btn link" data-a="tab" data-v="progress">See details</button></div>';
      else h += '<div class="note info row" style="gap:10px"><span class="grow">Import this week\u2019s Cronometer file.</span><button class="btn ghost" style="min-height:44px" data-a="settings">Import</button></div>';
    }
    if (dow === 2 || dow === 5 || dow === 6) h += '<div class="card pad stack"><div class="label">Today on the calendar</div><div style="font-size:17px;line-height:1.4">' + esc(slot) + '</div><button class="btn ghost" data-a="cardio">Log cardio or footwork</button></div>';

    var doneEx = 0;
    var cards = sess.ex.map(function (ex, i) {
      var r = rxFor(ex, wk, key), sets = a ? exSets(a, i) : [], d = doneCount(ex, sets), complete = d >= r.sets; if (complete) doneEx++;
      var adv = advise(ex, wk, key, a ? a.sid : null);
      var load = ex.unit === 'bw' ? (ex.dist ? '' : 'bodyweight') : num(adv.w) + ' ' + unitOf(ex);
      if (ex.invert && ex.unit !== 'bw') load = num(adv.w) + ' lb assist';
      var target = r.sets + ' × ' + rangeTxt(r) + (ex.dist ? ' m' : '') + (ex.uni ? ' each' : '') + (load ? ' · ' + load : '') + ' · ' + r.eff;
      var pills = ''; for (var k = 0; k < r.sets; k++) pills += '<span class="pill' + (k < d ? ' on' : '') + '"></span>';
      var swapped = DB.swaps[ex.n];
      return '<button class="excard' + (complete ? ' done' : '') + '" data-a="open-ex" data-v="' + i + '">' +
        '<span class="num">' + (complete ? '✓' : (i + 1)) + '</span><span class="grow stack" style="gap:6px">' +
        '<span class="exname">' + esc(exName(ex)) + '</span><span class="sub">' + esc(target) + '</span>' +
        '<span class="meta"><span class="pills">' + pills + '</span><span class="small" style="font-weight:600">' + (complete ? 'Done' : (d ? d + ' of ' + r.sets + ' sets' : r.sets + (r.sets === 1 ? ' set' : ' sets'))) + '</span>' +
        (ex.uni ? '<span class="tag uni">LEFT / RIGHT</span>' : '') + (ex.role === 'power' ? '<span class="tag power">POWER</span>' : '') + (ex.day === 'H' ? '<span class="tag heavy">HEAVY</span>' : ex.day === 'M' ? '<span class="tag moderate">MODERATE</span>' : '') + (ex.care ? '<span class="tag care">SHOULDER CARE</span>' : '') + (ex.pt ? '<span class="tag pt">CHECK WITH PT</span>' : '') + (swapped ? '<span class="tag swap">SWAP</span>' : '') +
        '</span></span>' + IC.chev + '</button>';
    }).join('');
    h += '<div class="row"><div class="progress"><div style="width:' + Math.round(doneEx / sess.ex.length * 100) + '%"></div></div><div style="font-size:16px;font-weight:600;white-space:nowrap">' + doneEx + ' of ' + sess.ex.length + ' done</div></div>';
    var warm = a ? a.warm : UI.warmPre;
    h += '<button class="warm' + (warm ? ' on' : '') + '" data-a="warm" aria-pressed="' + !!warm + '"><span class="box">' + (warm ? IC.check : '') + '</span><span class="stack" style="gap:2px"><span style="font-size:18px;font-weight:600">Warm-up, 8–10 min</span><span class="small">Bike 5 min · band pull-aparts · external rotation · wall slides' + (sess.lower ? ' · bodyweight squats, glute bridges, leg swings' : '') + '. Then the power drills, while fresh.</span></span></button>';
    h += cards;
    h += '<button class="btn" data-a="finish-open">Finish session</button>';
    h += '<div class="grid2"><button class="btn link" data-a="choose">Choose another session</button><button class="btn link" data-a="cardio">Log cardio</button></div>';
    return '<div class="scroll">' + h + '</div>';
  }

  function renderEx() {
    var a = DB.active, sess = getSession(a.key), ex = sess.ex[a.exIdx], r = rxFor(ex, a.wk, a.key);
    var sets = exSets(a, a.exIdx), d = doneCount(ex, sets), complete = d >= r.sets, showInputs = !complete || UI.extra;
    var adv = advise(ex, a.wk, a.key, a.sid), u = unitOf(ex), name = exName(ex);
    var h = '<div class="topbar"><button class="back" data-a="back">' + IC.back + 'Today</button><div class="grow"></div>' +
      '<button class="btn link" data-a="prev-ex" ' + (a.exIdx === 0 ? 'disabled' : '') + ' aria-label="Previous exercise">‹ Prev</button>' +
      '<div class="small" style="font-weight:600">' + (a.exIdx + 1) + ' of ' + sess.ex.length + '</div>' +
      '<button class="btn link" data-a="next-ex" ' + (a.exIdx === sess.ex.length - 1 ? 'disabled' : '') + ' aria-label="Next exercise">Next ›</button></div>';
    if (a.timerEnd && (a.restDone || Date.now() < a.timerEnd)) {
      var left = Math.max(0, (a.timerEnd - Date.now()) / 1000);
      h += '<div class="timer"><div class="row"><div class="grow stack" style="gap:0"><span class="tl">' + (a.restDone ? 'REST DONE · NEXT SET' : 'RESTING') + '</span><span class="t" id="tleft">' + (a.restDone ? 'Go' : mmss(left)) + '</span></div>' +
        '<button class="b1" data-a="rest-add">+30 s</button><button class="b2" data-a="rest-skip">' + (a.restDone ? 'Close' : 'Skip') + '</button></div>' +
        '<div class="tbar"><div id="tbar" style="width:' + (a.restDone ? 0 : Math.round(left / a.timerTotal * 100)) + '%"></div></div></div>';
    }
    h += '<div class="scroll" style="gap:16px">';
    h += '<div class="stack"><h1 class="h1 sm">' + esc(name) + '</h1>' +
      '<div style="font-size:18px;font-weight:600">' + r.sets + ' × ' + rangeTxt(r) + (ex.dist ? ' m' : '') + (ex.uni ? ' each side' : '') + ' · ' + esc(r.eff) + '</div>' +
      '<div class="sub">Rest ' + esc(ex.restTxt) + '</div>' +
      (ex.care || ex.pt ? '<div class="row" style="flex-wrap:wrap;gap:6px">' + (ex.care ? '<span class="tag care">SHOULDER CARE · pain rule applies</span>' : '') + (ex.pt ? '<span class="tag pt">CHECK WITH PT before doing this</span>' : '') + '</div>' : '') +
      (DB.swaps[ex.n] ? '<div class="small">Swapped in for ' + esc(ex.n) + '. Logged under its own name.</div>' : '') +
      '<div class="cue">' + esc(DB.swaps[ex.n] ? 'Same purpose as ' + ex.n + '. Use the usual technique for this exercise.' : ex.cue) + '</div>' +
      (r.note ? '<div class="note info">' + esc(r.note) + '</div>' : '') +
      (adv.kind !== 'first' || !sets.length ? '<div class="small"><b>Suggestion:</b> ' + esc(ex.unit === 'bw' ? 'Reps as prescribed.' : num(adv.w) + ' ' + (ex.invert ? 'lb assistance' : u) + '. ' + adv.why) + '</div>' : '') +
      '<div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn ghost" data-a="swap-toggle">' + (UI.swapOpen ? 'Close swap list' : 'Swap exercise') + '</button></div>';
    if (UI.swapOpen) {
      var cur = exName(ex);
      h += '<div class="stack" style="gap:8px"><div class="label">Same purpose, from your exercise library. The swap stays until you switch back.</div>' +
        [ex.n].concat(ex.alts).map(function (nm, k) { return '<button class="option' + (cur === nm ? ' on' : '') + '" data-a="swap-pick" data-v="' + esc(nm) + '">' + (k === 0 ? 'Original: ' : '') + esc(nm) + (cur === nm ? '  ✓' : '') + '</button>'; }).join('') + '</div>';
    }
    h += '</div>';

    if (sets.length) {
      h += '<div class="card list">';
      if (ex.uni) {
        var Ls = sets.filter(function (s) { return s.side === 'L'; }), Rs = sets.filter(function (s) { return s.side === 'R'; });
        for (var i = 0; i < Ls.length; i++) {
          var L = Ls[i], R = Rs[i], g = R ? gapPct(L, R) : null;
          h += '<div class="li row"><span class="setn">' + (i + 1) + '</span><span class="grow stack" style="gap:2px"><span class="setd">L ' + setTxt(ex, L) + (R ? ' &nbsp; R ' + setTxt(ex, R) : ' &nbsp; R …') + '</span>' +
            (L.extra ? '<span class="small">Extra set</span>' : '') + (g != null && g > 10 ? '<span class="small">' + (vol(L) > vol(R) ? 'Right' : 'Left') + ' side behind by more than 10%</span>' : '') + '</span>' +
            (g != null ? '<span class="gap' + (g > 10 ? ' flag' : '') + '">Gap ' + g + '%</span>' : '') + '</div>';
        }
      } else {
        sets.forEach(function (s, i) {
          var m = []; if (s.extra) m.push('Extra set'); if (s.rir != null) m.push('RIR ' + (s.rir >= 5 ? '5+' : s.rir)); else if (s.rpe) m.push('RPE ' + s.rpe); if (s.pain != null) m.push('Shoulder ' + s.pain);
          h += '<div class="li row"><span class="setn">' + (i + 1) + '</span><span class="grow stack" style="gap:2px"><span class="setd">' + setTxt(ex, s, true) + '</span>' + (m.length ? '<span class="small">' + m.join(' · ') + '</span>' : '') + '</span></div>';
        });
      }
      h += '<button class="btn link" data-a="undo">Undo last set</button></div>';
    }

    if (showInputs) {
      h += '<div class="stack" style="gap:16px">';
      if (ex.uni) h += '<div class="stack"><div class="label">Side (left first)</div><div class="seg"><button class="' + (a.side === 'L' ? 'on' : '') + '" data-a="side" data-v="L">Left</button><button class="' + (a.side === 'R' ? 'on' : '') + '" data-a="side" data-v="R">Right</button></div></div>';
      if (ex.unit !== 'bw') h += stepper(ex.wLabel || (u === 'kg' ? 'Weight (kg)' : 'Weight (lb)'), num(a.w), 'w', 'w-step');
      h += stepper(ex.dist ? 'Distance (m)' : (ex.repsLabel || 'Reps'), String(a.r), 'r', 'r-step', false, 'numeric');
      var tRir = ex.uni ? P.rirFor(r, Math.min(r.sets, sets.filter(function (s) { return !s.extra && s.side === a.side; }).length + 1)) : P.rirFor(r, Math.min(r.sets, d + 1));
      h += '<div class="stack"><div class="label">Reps left in reserve (optional) · 0 = couldn\u2019t do another' + (tRir != null && !UI.extra ? ' · target ' + tRir : '') + '</div>' +
        chipRow([0, 1, 2, 3, 4, 5].map(function (n) { return { v: n, l: n === 5 ? '5+' : String(n) }; }), 6, a.rir, 'rir', function (n) { return tRir != null && n < tRir ? '#C2410C' : '#1D4ED8'; }) + '</div>';
      h += '<div class="stack"><div class="label">Left shoulder pain (optional) · 0–10</div>' + chipRow(nums(0, 10), 6, a.pain, 'pain', painTone, true);
      if (a.pain != null) h += a.pain >= 6 ? '<div class="note stop">Stop this movement today and tell your PT.</div>' : a.pain >= 4 ? '<div class="note warn">Hold the load. Cut sets by a third or use the alternative.</div>' : '<div class="note info">0–3: carry on.</div>';
      h += '</div></div>';
    }
    h += '</div>';

    var label, act, sec = '';
    if (showInputs) {
      label = UI.extra ? 'Log extra set' : (ex.uni ? 'Log ' + (a.side === 'L' ? 'left' : 'right') + ' · set ' + (d + 1) + ' of ' + r.sets : 'Log set ' + (d + 1) + ' of ' + r.sets);
      act = 'log';
      if (UI.extra) sec = '<button class="btn link" data-a="extra-off">Done with extra sets</button>';
    } else {
      if (a.exIdx < sess.ex.length - 1) { label = 'Next: ' + exName(sess.ex[a.exIdx + 1]); act = 'next-ex'; }
      else { label = 'Finish session'; act = 'finish-open'; }
      sec = '<button class="btn link" data-a="extra-on">Log an extra set</button>';
    }
    h += '<div class="footer">' + sec + '<button class="btn primary" data-a="' + act + '">' + esc(label) + '</button></div>';
    return h;
  }
  function setTxt(ex, s, long) {
    if (s.bw) return s.r + (long ? ' reps' : '');
    if (s.dist) return s.r + ' m × ' + num(s.w);
    var u = s.unit === 'kg' ? ' kg' : (long ? ' lb' : '');
    return long ? s.r + ' reps × ' + num(s.w) + u + (ex && ex.invert ? ' assist' : '') : s.r + ' × ' + num(s.w);
  }

  function renderFinish() {
    var a = DB.active, key = a ? a.key : currentKey(), sess = getSession(key), wk = a ? a.wk : DB.pos.wk;
    var sets = a ? sessSets(a.sid) : [], volume = 0, maxPain = null, doneEx = 0;
    sets.forEach(function (s) { if (!s.bw && s.unit !== 'kg') volume += s.w * s.r; if (s.pain != null) maxPain = Math.max(maxPain == null ? 0 : maxPain, s.pain); });
    var rows = sess.ex.map(function (ex, i) {
      var mine = a ? exSets(a, i) : [], r = rxFor(ex, wk, key), d = doneCount(ex, mine); if (d >= r.sets) doneEx++;
      if (!mine.length) return '<div class="li"><div class="row"><span class="grow" style="font-size:17px;font-weight:700">' + esc(exName(ex)) + '</span><span class="small" style="font-weight:700">Not logged</span></div></div>';
      var nextWk = Math.min(12, wk + 1); UI._adviseWk = nextWk;
      var nx = adviseFrom(ex, mine, rxFor(ex, nextWk, key));
      var best = mine.reduce(function (p, c) { return vol(c) > vol(p) ? c : p; });
      var nextTxt = ex.unit === 'bw' ? 'Keep' : (nx.kind === 'up' ? num(nx.w) + ' ' + (ex.invert ? 'lb assist' : unitOf(ex)) + ' ↑' : 'Stay ' + num(nx.w) + ' ' + (ex.invert ? 'lb assist' : unitOf(ex)));
      var gapTxt = '';
      if (ex.uni) {
        var Ls = mine.filter(function (s) { return s.side === 'L'; }), Rs = mine.filter(function (s) { return s.side === 'R'; }), worst = 0;
        for (var k = 0; k < Math.min(Ls.length, Rs.length); k++) worst = Math.max(worst, gapPct(Ls[k], Rs[k]));
        if (Rs.length) gapTxt = '<span class="gap' + (worst > 10 ? ' flag' : '') + '" style="align-self:flex-start">Left/right gap ' + worst + '%' + (worst > 10 ? ' · add a set for the weaker side' : '') + '</span>';
      }
      return '<div class="li stack" style="gap:3px"><div class="row" style="justify-content:space-between"><span style="font-size:17px;font-weight:700">' + esc(exName(ex)) + '</span>' +
        '<span class="' + (nx.kind === 'up' ? 'tag uni' : 'small') + '" style="font-weight:700;white-space:nowrap">' + esc(nextTxt) + '</span></div>' +
        '<span class="small">' + d + ' of ' + r.sets + ' sets · best ' + setTxt(ex, best, true) + '</span>' + gapTxt + '</div>';
    }).join('');
    var mins = a ? Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)) : 0;
    var h = '<div class="topbar"><button class="back" data-a="back">' + IC.back + 'Back</button></div><div class="scroll">' +
      '<div class="stack" style="gap:4px"><div class="kicker">' + fmtDay(today()) + ' · ' + esc(sess.name) + ' · Week ' + wk + '</div><h1 class="h1">Finish session</h1></div>' +
      '<div class="grid2">' + [['Time', mins ? mins + ' min' : '–'], ['Exercises', doneEx + ' of ' + sess.ex.length], ['Volume (lb)', Math.round(volume).toLocaleString('en-US')], ['Max shoulder pain', maxPain == null ? '–' : maxPain + ' / 10']]
        .map(function (s) { return '<div class="stat"><span class="label">' + s[0] + '</span><span class="v">' + s[1] + '</span></div>'; }).join('') + '</div>' +
      '<h2 class="h2">Next time</h2><div class="card list">' + rows + '</div>' +
      '<div class="small">Top of the rep range on every set at target effort adds weight next time.</div>' +
      '<button class="btn primary" data-a="finish">Save and finish</button></div>';
    return h;
  }

  function lastOf(arr) { return arr.length ? arr[arr.length - 1] : null; }
  function lastBw() { for (var i = DB.checks.length - 1; i >= 0; i--) if (DB.checks[i].bw) return DB.checks[i].bw; return null; }
  function baseHR() {
    if (DB.settings.baseHR) return +DB.settings.baseHR;
    var w1 = DB.checks.filter(function (c) { return c.hr && calWeek(c.date) === 1; });
    if (!w1.length) return null;
    return Math.round(w1.reduce(function (s, c) { return s + c.hr; }, 0) / w1.length);
  }
  function renderCheck() {
    if (!UI.check) {
      var t = today(), ex = DB.checks.filter(function (c) { return c.date === t; })[0], prev = lastOf(DB.checks);
      var base = { date: t, sleep: prev && prev.sleep != null ? prev.sleep : 7.5, hr: prev && prev.hr ? prev.hr : 60, bw: lastBw() || 172, ready: null, sore: null, pain: null, pt: false, protein: 0, note: '' };
      UI.check = ex ? JSON.parse(JSON.stringify(ex)) : base;
      ['sleep', 'hr', 'bw'].forEach(function (k) { if (UI.check[k] == null || UI.check[k] === '') { UI.check[k] = base[k]; UI.check['_new_' + k] = true; } });
      if (UI.check.protein == null) UI.check.protein = 0;
      UI.check.isEdit = !!ex && ex.sleep != null;
    }
    var c = UI.check, b = baseHR();
    var h = '<div class="scroll" style="gap:18px"><div class="stack" style="gap:4px"><div class="kicker">' + fmtDay(c.date) + (c.isEdit ? ' · already saved, editing' : '') + '</div><h1 class="h1">Daily check</h1></div>';
    h += stepper('Sleep (hours)', fix1(c.sleep), 'c-sleep', 'c-step-sleep', true);
    h += stepper('Resting heart rate (bpm)' + (b ? ' · baseline ' + b : ''), String(c.hr), 'c-hr', 'c-step-hr', true, 'numeric');
    if (b && c.hr >= b + 5) h += '<div class="note warn">5 or more above baseline. If this lasts a week with low readiness, deload early.</div>';
    h += stepper('Body weight (lb) · after the bathroom, before eating', fix1(c.bw), 'c-bw', 'c-step-bw', true);
    h += stepper('Protein so far today (g) · target ' + N.protein[0] + '–' + N.protein[1], String(Math.round(c.protein || 0)), 'c-protein', 'c-step-protein', true, 'numeric');
    h += '<div class="stack"><div class="label">Readiness · 1 = drained, 5 = ready to go</div>' + chipRow(nums(1, 5), 5, c.ready, 'c-ready') + '</div>';
    h += '<div class="stack"><div class="label">Soreness · 1 = none, 5 = very sore</div>' + chipRow(nums(1, 5), 5, c.sore, 'c-sore') + '</div>';
    h += '<div class="stack"><div class="label">Left shoulder on waking · 0–10</div>' + chipRow(nums(0, 10), 6, c.pain, 'c-pain', painTone, true) + '</div>';
    h += '<div class="stack"><div class="label">PT exercises done today</div><div class="grid2"><button class="chip' + (c.pt ? ' on' : '') + '" style="' + (c.pt ? 'background:#1D4ED8;border-color:#1D4ED8' : '') + '" data-a="c-pt" data-v="1">Yes</button><button class="chip' + (!c.pt ? ' on' : '') + '" style="' + (!c.pt ? 'background:#1D4ED8;border-color:#1D4ED8' : '') + '" data-a="c-pt" data-v="0">Not yet</button></div></div>';
    h += '<div class="stack"><label class="label" for="cnote">Notes (optional)</label><textarea id="cnote" data-f="c-note" placeholder="Slept badly, knee stiff, etc.">' + esc(c.note) + '</textarea></div>';
    h += '<button class="btn primary" data-a="c-save">' + (c.isEdit ? 'Update check-in' : 'Save check-in') + '</button>';
    var recent = DB.checks.slice(-5).reverse();
    if (recent.length) h += '<h2 class="h2">Recent</h2><div class="card list">' + recent.map(function (x) { return '<div class="li small"><b>' + fmtShort(x.date) + '</b>' + (x.sleep != null ? ' · sleep ' + fix1(x.sleep) + ' h' : '') + (x.hr ? ' · HR ' + x.hr : '') + (x.bw ? ' · ' + fix1(x.bw) + ' lb' : '') + (x.protein ? ' · protein ' + Math.round(x.protein) + ' g' : '') + (x.ready ? ' · ready ' + x.ready : '') + (x.pain != null ? ' · shoulder ' + x.pain : '') + '</div>'; }).join('') + '</div>';
    return h + '</div>';
  }

  var BODY_SINGLE = [['waist', 'Waist (at navel)'], ['shoulders', 'Shoulders (widest point)']];
  var BODY_PAIR = [['arm', 'Arm (flexed)']];
  var BODY_KEYS = ['waist', 'shoulders', 'armL', 'armR'];
  function renderBody() {
    if (!UI.body) {
      var prev = lastOf(DB.body);
      UI.body = { waist: 32, shoulders: 48, armL: 14.5, armR: 14.75, note: '' };
      if (prev) BODY_KEYS.forEach(function (k) { if (prev[k] != null) UI.body[k] = prev[k]; });
      UI.body.date = today(); UI.body.note = '';
    }
    var b = UI.body, prev = lastOf(DB.body);
    var h = '<div class="scroll"><div class="stack" style="gap:4px"><div class="kicker">Once a month · inches · morning, before eating</div><h1 class="h1">Body measurements</h1>' +
      (prev ? '<div class="small">Last measured ' + fmtDay(prev.date) + (daysBetween(prev.date, today()) < P.MEASURE_DAYS - 2 ? '. Next due around ' + fmtShort(addDays(prev.date, P.MEASURE_DAYS)) + '.' : '. Due now.') + ' Values start from last time.</div>' : '<div class="small">Values below are placeholders. Set each one, then save.</div>') + '<button class="btn link" style="align-self:flex-start;padding:0;min-height:36px" data-a="how-measure">How to measure</button></div>';
    h += '<div class="grid2"><div class="stat dark"><span class="label">Shoulder : waist</span><span class="v">' + (b.shoulders / b.waist).toFixed(2) + '</span><span class="small">Goal: up 0.03–0.06 by wk 12</span></div>' +
      '<div class="stat dark"><span class="label">Arm L/R gap</span><span class="v">' + (Math.max(b.armL, b.armR) ? (Math.abs(b.armL - b.armR) / Math.max(b.armL, b.armR) * 100).toFixed(1) : '0.0') + '%</span><span class="small">' + (prev && prev.waist ? 'Waist ' + (b.waist - prev.waist >= 0 ? '+' : '') + fix2(b.waist - prev.waist) + ' in vs last' : 'Goal: under 10%') + '</span></div></div>';
    BODY_SINGLE.forEach(function (f) { h += stepper(f[1], fix2(b[f[0]]), 'b-' + f[0], 'b-step-' + f[0], true); });
    BODY_PAIR.forEach(function (f) {
      var L = b[f[0] + 'L'], R = b[f[0] + 'R'], g = Math.max(L, R) ? Math.abs(L - R) / Math.max(L, R) * 100 : 0;
      h += '<div class="stack"><div class="row" style="justify-content:space-between"><span class="label">' + f[1] + '</span><span class="gap">Gap ' + g.toFixed(1) + '%</span></div><div class="grid2">' +
        ['L', 'R'].map(function (sd) {
          var k = f[0] + sd;
          return '<div class="pairbox"><button data-a="b-step-' + k + '" data-d="-1" aria-label="Decrease ' + f[1] + ' ' + (sd === 'L' ? 'left' : 'right') + '">−</button><span class="pv"><span>' + (sd === 'L' ? 'LEFT' : 'RIGHT') + '</span>' +
            '<input type="text" inputmode="decimal" data-f="b-' + k + '" value="' + fix2(b[k]) + '" aria-label="' + f[1] + ' ' + (sd === 'L' ? 'left' : 'right') + '"></span><button data-a="b-step-' + k + '" data-d="1" aria-label="Increase ' + f[1] + ' ' + (sd === 'L' ? 'left' : 'right') + '">+</button></div>';
        }).join('') + '</div></div>';
    });
    h += '<div class="stack"><label class="label" for="bnote">Notes (optional)</label><textarea id="bnote" data-f="b-note">' + esc(b.note) + '</textarea></div>';
    h += '<button class="btn primary" data-a="b-save">Save measurements</button>';
    return h + '</div>';
  }

  var CARDIO_TYPES = ['Walk (zone 2)', 'Incline treadmill', 'Footwork + intervals', 'Footwork + walk', 'Intervals (bike)', 'Intervals (rower)', 'Other'];
  function renderCardio() {
    if (!UI.cardio) UI.cardio = { date: today(), type: new Date().getDay() === 5 ? (DB.pos.wk >= 3 && P.INTERVALS[DB.pos.wk] ? 'Footwork + intervals' : 'Footwork + walk') : 'Walk (zone 2)', min: new Date().getDay() === 2 ? 45 : 40, dist: 2.0, hr: '', intervals: '', rpe: null, note: '' };
    var c = UI.cardio, isInt = /Intervals|intervals/.test(c.type);
    if (isInt && !c.intervals) c.intervals = P.INTERVALS[DB.pos.wk] || '6 × 30 s';
    var h = '<div class="topbar"><button class="back" data-a="back">' + IC.back + 'Back</button></div><div class="scroll" style="gap:18px">' +
      '<div class="stack" style="gap:4px"><div class="kicker">' + fmtDay(c.date) + '</div><h1 class="h1">Log cardio</h1></div>' +
      '<div class="stack" style="gap:8px"><div class="label">Type</div>' + CARDIO_TYPES.map(function (t) { return '<button class="option' + (c.type === t ? ' on' : '') + '" data-a="k-type" data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
    h += stepper('Minutes', String(c.min), 'k-min', 'k-step-min', true, 'numeric');
    h += stepper('Distance (miles, optional)', fix1(c.dist), 'k-dist', 'k-step-dist', true);
    h += '<div class="stack"><label class="label" for="khr">Average heart rate (optional)</label><input id="khr" class="field" type="text" inputmode="numeric" data-f="k-hr" value="' + esc(c.hr) + '"></div>';
    if (isInt) h += '<div class="stack"><label class="label" for="kint">Intervals</label><input id="kint" class="field" type="text" data-f="k-intervals" value="' + esc(c.intervals) + '"><div class="small">Hard 30 s, easy 90 s. Zone 2 is about 100–120 bpm, or a pace where you can still talk.</div></div>';
    h += '<div class="stack"><div class="label">Effort (optional) · 1–10</div>' + chipRow(nums(1, 10), 5, c.rpe, 'k-rpe', null, true) + '</div>';
    h += '<div class="stack"><label class="label" for="knote">Notes (optional)</label><textarea id="knote" data-f="k-note">' + esc(c.note) + '</textarea></div>';
    h += '<button class="btn primary" data-a="k-save">Save cardio</button>';
    var recent = DB.cardio.slice(-5).reverse();
    if (recent.length) h += '<h2 class="h2">Recent</h2><div class="card list">' + recent.map(function (x) { return '<div class="li small"><b>' + fmtShort(x.date) + '</b> · ' + esc(x.type) + ' · ' + x.min + ' min' + (x.dist ? ' · ' + fix1(x.dist) + ' mi' : '') + '</div>'; }).join('') + '</div>';
    return h + '</div>';
  }

  function renderProgress() {
    var h = '<div class="scroll"><div class="stack" style="gap:4px"><div class="kicker">Week ' + Math.min(12, DB.pos.wk) + ' of 12</div><h1 class="h1">Progress</h1></div>';
    if (!DB.sets.length && !DB.checks.length && !DB.body.length && !DB.nutrition.length) return h + '<div class="sub">Nothing logged yet. Your trends show here after your first sessions and check-ins.</div></div>';
    var cks = DB.checks.filter(function (c) { return c.bw; }).slice().sort(function (x, y) { return x.date < y.date ? -1 : 1; });
    var bwPts = cks.map(function (c) {
      var from = addDays(c.date, -6), win = cks.filter(function (x) { return x.date >= from && x.date <= c.date; });
      return { x: parseD(c.date).getTime(), y: win.reduce(function (s, x) { return s + x.bw; }, 0) / win.length };
    });
    var wt = weightTrend(), pw = proteinWeek(today());
    h += '<h2 class="h2">Daily basics</h2><div class="grid2">' +
      '<div class="stat"><span class="label">Weight change, 7-day avg</span><span class="v">' + (wt.change == null ? '–' : (wt.change > 0 ? '+' : '') + fix1(wt.change)) + '<span style="font-size:16px"> lb/wk</span></span><span class="small">Target −' + N.lossPerWeek[0] + ' to −' + N.lossPerWeek[1].toFixed(1) + (wt.change != null ? ' · ' + trendStatus(wt.change) : ' · needs 3+ weigh-ins in each of 2 weeks') + '</span></div>' +
      '<div class="stat"><span class="label">Protein, last 7 days</span><span class="v">' + (pw.avg == null ? '–' : Math.round(pw.avg)) + '<span style="font-size:16px"> g/day</span></span><span class="small">Target hit ' + pw.hit + ' of ' + pw.n + ' logged days</span></div></div>';
    h += '<div class="card pad stack chart"><div class="label">Body weight, 7-day average (lb)</div>' + lineChart(bwPts, { label: 'Body weight', fmt: fix1 }) + '</div>';
    var pDates = {}; DB.checks.forEach(function (c) { if (c.protein > 0) pDates[c.date] = 1; }); DB.nutrition.forEach(function (o) { if (fullDay(o)) pDates[o.date] = 1; });
    var pPts = Object.keys(pDates).sort().map(function (d) { return { x: parseD(d).getTime(), y: proteinOn(d) }; });
    h += '<div class="card pad stack chart"><div class="label">Protein per day (g) · target ' + N.protein[0] + '+</div>' + lineChart(pPts, { label: 'Protein', fmt: function (v) { return Math.round(v) + ' g'; } }) + '</div>';
    var waist = DB.body.filter(function (b) { return b.waist; }).map(function (b) { return { x: parseD(b.date).getTime(), y: b.waist }; });
    var sw = DB.body.filter(function (b) { return b.waist && b.shoulders; }).map(function (b) { return { x: parseD(b.date).getTime(), y: b.shoulders / b.waist }; });
    h += '<h2 class="h2">Shape (monthly)</h2>';
    h += '<div class="card pad stack chart"><div class="label">Waist (in)</div>' + lineChart(waist, { label: 'Waist', fmt: fix2 }) + '</div>';
    h += '<div class="card pad stack chart"><div class="label">Shoulder-to-waist ratio · goal up 0.03–0.06</div>' + lineChart(sw, { label: 'Shoulder to waist', fmt: fix2 }) + '</div>';
    var lbm = lastOf(DB.body);
    if (lbm && lbm.armL && lbm.armR) { var ag = Math.abs(lbm.armL - lbm.armR) / Math.max(lbm.armL, lbm.armR) * 100; h += '<div class="card pad small">Arm left/right gap, ' + fmtShort(lbm.date) + ': <b>' + ag.toFixed(1) + '%</b> (L ' + fix2(lbm.armL) + ', R ' + fix2(lbm.armR) + ' in). Goal under 10%.</div>'; }
    if (DB.nutrition.length) {
      var wkN = nutritionWeek(lastOf(DB.nutrition).date), fullAll = DB.nutrition.filter(fullDay), stale = '';
      if (!wkN.logged && fullAll.length) { stale = 'No fully logged days in the latest week (' + fmtShort(wkN.from) + '\u2013' + fmtShort(wkN.to) + '). Showing the most recent week that has some. '; wkN = nutritionWeek(lastOf(fullAll).date); }
      var tile = function (label, v, unit, lo, hi) {
        var st = nutritionStatus(v, lo, hi);
        return '<div class="stat"><span class="label">' + label + '</span><span class="v">' + (v == null ? '–' : Math.round(v).toLocaleString('en-US')) + '<span style="font-size:16px"> ' + unit + '</span></span>' +
          '<span class="small">Target ' + lo.toLocaleString('en-US') + (hi ? '–' + hi.toLocaleString('en-US') : '+') + (st ? ' · ' + st : '') + '</span></div>';
      };
      h += '<h2 class="h2">Nutrition, ' + fmtShort(wkN.from) + '–' + fmtShort(wkN.to) + '</h2>';
      h += '<div class="small">' + stale + 'Averages of ' + wkN.logged + ' fully logged day' + (wkN.logged === 1 ? '' : 's') + ' out of 7. Days under ' + N.minKcal.toLocaleString('en-US') + ' kcal are left out.</div>';
      h += '<div class="grid2">' + tile('Calories', wkN.kcal, 'kcal', N.kcal[0], N.kcal[1]) + tile('Protein', wkN.protein, 'g', N.protein[0], N.protein[1]) +
        tile('Carbs', wkN.carbs, 'g', N.carbs[0], N.carbs[1]) + tile('Fat', wkN.fat, 'g', N.fat[0], N.fat[1]) + '</div>';
      h += '<div class="card pad small">Protein target hit on ' + wkN.proteinDays + ' of ' + wkN.logged + ' logged days · fiber ' + (wkN.fiber == null ? '–' : Math.round(wkN.fiber) + ' g') + ' (target ' + N.fiber + '+) · about ' + fix1(wkN.drinks) + ' drinks (limit ' + N.drinksWeek + ' a week)</div>';
      var fullDays = DB.nutrition.filter(fullDay);
      var roll = function (m) {
        return fullDays.map(function (o) {
          var from = addDays(o.date, -6), win = fullDays.filter(function (x) { return x.date >= from && x.date <= o.date; });
          return { x: parseD(o.date).getTime(), y: win.reduce(function (s, x) { return s + x[m]; }, 0) / win.length };
        });
      };
      h += '<div class="card pad stack chart"><div class="label">Calories, 7-day average of logged days</div>' + lineChart(roll('kcal'), { label: 'Calories', fmt: function (v) { return Math.round(v).toLocaleString('en-US') + ' kcal'; } }) + '</div>';
      h += '<div class="card pad stack chart"><div class="label">Protein, 7-day average of logged days</div>' + lineChart(roll('protein'), { label: 'Protein', fmt: function (v) { return Math.round(v) + ' g'; } }) + '</div>';
    }
    var lifts = ['Hack squat', 'Neutral-grip DB bench press', 'Barbell deadlift', 'Chest-supported row'];
    lifts.forEach(function (nm) {
      var bySid = {}, order = [];
      DB.sets.forEach(function (s) { if (s.ex !== nm || s.bw || s.r > 12 || !s.r) return; var v = e1rm(s.w, s.r); if (!(s.sid in bySid)) { bySid[s.sid] = { x: parseD(s.date).getTime(), y: v }; order.push(s.sid); } else bySid[s.sid].y = Math.max(bySid[s.sid].y, v); });
      if (!order.length) return;
      h += '<div class="card pad stack chart"><div class="label">' + esc(nm) + ' · estimated 1-rep max (lb)</div>' + lineChart(order.map(function (k) { return bySid[k]; }), { label: nm, fmt: function (v) { return String(Math.round(v)); } }) + '</div>';
    });
    var uniNames = {};
    P.SESSIONS.forEach(function (s) { s.ex.forEach(function (e) { if (e.uni) uniNames[exName(e)] = 1; }); });
    var gapRows = Object.keys(uniNames).map(function (nm) {
      var last = lastSetsFor(nm, DB.active ? DB.active.sid : null); if (!last) return '';
      var Ls = last.filter(function (s) { return s.side === 'L'; }), Rs = last.filter(function (s) { return s.side === 'R'; }), worst = 0;
      if (!Rs.length) return '';
      for (var k = 0; k < Math.min(Ls.length, Rs.length); k++) worst = Math.max(worst, gapPct(Ls[k], Rs[k]));
      return '<div class="li row"><span class="grow">' + esc(nm) + '<div class="small">' + fmtShort(last[0].date) + '</div></span><span class="gap' + (worst > 10 ? ' flag' : '') + '">' + worst + '%</span></div>';
    }).join('');
    if (gapRows) h += '<h2 class="h2">Left/right gaps, last session</h2><div class="card list">' + gapRows + '</div>';
    if (DB.sessions.length) {
      h += '<h2 class="h2">Sessions</h2><div class="card list">' + DB.sessions.slice().reverse().map(function (s) {
        var n = DB.sets.filter(function (x) { return x.sid === s.id; }).length;
        return '<button class="li row" style="width:100%;border:none;border-bottom:1px solid #ECE9E2;background:transparent;text-align:left;color:inherit" data-a="detail" data-v="' + s.id + '"><span class="grow"><span style="font-weight:700">' + esc(getSession(s.key).name) + '</span> · week ' + s.wk + '<div class="small">' + fmtDay(s.date) + ' · ' + n + ' sets' + (s.light ? ' · lighter week' : '') + '</div></span>' + IC.chev + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  function renderDetail() {
    var s = DB.sessions.filter(function (x) { return x.id === UI.detail; })[0];
    if (!s) { UI.screen = null; return renderMain(); }
    var sess = getSession(s.key), sets = DB.sets.filter(function (x) { return x.sid === s.id; });
    var h = '<div class="topbar"><button class="back" data-a="back">' + IC.back + 'Progress</button></div><div class="scroll">' +
      '<div class="stack" style="gap:4px"><div class="kicker">' + fmtDay(s.date) + ' · week ' + s.wk + '</div><h1 class="h1">' + esc(sess.name) + '</h1></div>';
    var groups = {};
    sets.forEach(function (x) { (groups[x.exi] = groups[x.exi] || []).push(x); });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], ex = sess.ex[k];
      h += '<div class="card list"><div class="li" style="font-weight:700">' + esc(g[0].ex) + '</div>' + g.map(function (x) {
        return '<div class="li row"><span class="grow setd" style="font-size:17px">' + (x.side !== 'Both' ? x.side + ' ' : '') + setTxt(ex, x, true) + (x.rir != null ? ' · RIR ' + (x.rir >= 5 ? '5+' : x.rir) : (x.rpe ? ' · RPE ' + x.rpe : '')) + (x.pain != null ? ' · shoulder ' + x.pain : '') + (x.extra ? ' · extra' : '') + '</span>' +
          '<button class="btn link" data-a="del-set" data-v="' + x.id + '" aria-label="Delete this set">Delete</button></div>';
      }).join('') + '</div>';
    });
    if (!sets.length) h += '<div class="sub">No sets in this session.</div>';
    h += '<button class="btn danger" data-a="del-session" data-v="' + s.id + '">Delete this session</button>';
    return h + '</div>';
  }

  function renderGuide() {
    var h = '<div class="scroll" style="gap:12px"><div class="stack" style="gap:4px"><div class="kicker">Week ' + Math.min(12, DB.pos.wk) + ' of 12 · ' + esc(P.PHASE_LONG[Math.min(12, DB.pos.wk)]) + '</div><h1 class="h1">Guide</h1><div class="sub">Quick reference. Tap a topic to open it.</div></div>';
    h += P.GUIDE.map(function (g) {
      var open = UI.guideOpen === g.id;
      return '<div class="card" style="overflow:hidden"><button class="acc' + (open ? ' open' : '') + '" data-a="guide" data-v="' + g.id + '" aria-expanded="' + open + '"><span class="t">' + esc(g.title) + '</span>' + IC.down + '</button>' +
        (open ? '<ul class="accbody">' + g.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('');
    h += '<a class="btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="' + P.GUIDE_URL + '" target="_blank" rel="noopener">Open the full program guide</a>';
    return h + '</div>';
  }

  function renderSettings() {
    var s = DB.settings;
    var h = '<div class="topbar"><button class="back" data-a="back">' + IC.back + 'Today</button></div><div class="scroll" style="gap:18px"><h1 class="h1">Settings</h1>';
    h += '<div class="card pad stack" style="gap:10px"><div style="font-size:19px;font-weight:700">Backup and export</div>' +
      '<div class="small">Last export: ' + (s.lastExport ? fmtDay(s.lastExport.slice(0, 10)) : 'never') + '. Export every Saturday and save the files to OneDrive.</div>' +
      '<button class="btn primary" data-a="export">Export my data</button>' +
      '<div class="small">You get a backup file (for restoring this app), four CSV files laid out like the workbook’s Log, Daily Check, Body and Cardio sheets, and a Nutrition file once you import Cronometer data.</div>' +
      '<label class="btn" style="display:flex;align-items:center;justify-content:center">Restore from a backup file<input type="file" accept=".json,application/json" data-f="restore" style="display:none"></label></div>';
    var lastN = lastOf(DB.nutrition);
    h += '<div class="card pad stack" style="gap:10px"><div style="font-size:19px;font-weight:700">Nutrition (Cronometer)</div>' +
      '<div class="small">Each Saturday, export Daily Nutrition from Cronometer, then import the file here. Re-importing the same days replaces them.</div>' +
      '<label class="btn" style="display:flex;align-items:center;justify-content:center">Import Cronometer file<input type="file" accept=".csv,text/csv,text/comma-separated-values,text/plain" data-f="nutri" style="display:none"></label>' +
      (UI.nutriMsg ? '<div class="note info">' + esc(UI.nutriMsg) + '</div>' : '') +
      '<div class="small">' + (lastN ? DB.nutrition.length + ' days stored, latest ' + fmtDay(lastN.date) + '.' : 'No nutrition data yet.') + '</div></div>';
    h += '<div class="card pad stack" style="gap:10px"><div style="font-size:19px;font-weight:700">Program</div>' +
      '<label class="label" for="sstart">Start date (a Sunday)</label><input id="sstart" class="field" type="date" data-f="s-start" value="' + esc(s.start) + '">' +
      '<div class="small">Now on week ' + Math.min(12, DB.pos.wk) + '. Sessions done this week: ' + (DB.pos.done.map(function (k) { return getSession(k).name; }).join(', ') || 'none') + '.</div>' +
      '<label class="label" for="shr">Baseline resting heart rate (blank = week-1 average)</label><input id="shr" class="field" type="text" inputmode="numeric" data-f="s-hr" value="' + esc(s.baseHR || '') + '"></div>';
    h += '<div class="card pad stack" style="gap:10px"><div style="font-size:19px;font-weight:700">During workouts</div>' +
      toggle('Keep the screen on while logging', s.keepAwake, 'keepAwake') + toggle('Beep when rest ends (the phone also vibrates)', s.sound, 'sound') + '</div>';
    h += '<div class="card pad stack" style="gap:10px"><div style="font-size:19px;font-weight:700">App</div>' +
      (UI.installEvt ? '<button class="btn" data-a="install">Install on home screen</button>' : '<div class="small">To install: Chrome menu (⋮), then Add to Home screen or Install app.</div>') +
      '<div class="small">Storage: ' + (UI.persisted ? 'protected from automatic clearing' : 'standard browser storage, so keep exporting') + '. ' + DB.sets.length + ' sets, ' + DB.sessions.length + ' sessions saved on this phone.</div>' +
      '<div class="small">Version ' + VERSION + '</div>' +
      '<button class="btn danger" data-a="reset">Erase all data on this phone</button></div>';
    return h + '</div>';
  }
  function toggle(label, on, key) {
    return '<button class="option' + (on ? ' on' : '') + '" data-a="toggle" data-v="' + key + '" aria-pressed="' + !!on + '">' + (on ? '✓ ' : '') + esc(label) + '</button>';
  }

  function renderSheet() {
    if (UI.sheet !== 'choose') return '';
    var cur = currentKey();
    var h = '<div class="sheet" data-a="sheet-close"><div data-stop="1"><div style="font-size:20px;font-weight:700">Week ' + DB.pos.wk + ' sessions</div>' +
      '<div class="small">Pick any session for today. Do all four before the week moves on.</div>';
    if (DB.active) h += '<div class="note warn">' + esc(getSession(DB.active.key).name) + ' is in progress. Finish it first, or discard it below.</div>';
    h += ORDER.map(function (k) {
      var done = DB.pos.done.indexOf(k) >= 0, s = getSession(k);
      return '<button class="option' + (k === cur ? ' on' : '') + '" data-a="choose-pick" data-v="' + k + '"' + (DB.active && DB.active.key !== k ? ' disabled' : '') + '>' + esc(s.name) + ' · ' + esc(s.focus) + (done ? ' · done' : '') + '</button>';
    }).join('');
    if (DB.active) h += '<button class="btn danger" data-a="discard">Discard the session in progress</button>';
    return h + '<button class="btn" data-a="sheet-close">Close</button></div></div>';
  }

  function renderMain() {
    var body;
    if (UI.screen === 'ex' && DB.active) return renderEx();
    if (UI.screen === 'finish') return renderFinish();
    if (UI.screen === 'settings') return renderSettings();
    if (UI.screen === 'cardio') return renderCardio();
    if (UI.screen === 'detail') return renderDetail();
    UI.screen = null;
    if (UI.tab === 'check') body = renderCheck();
    else if (UI.tab === 'body') body = renderBody();
    else if (UI.tab === 'progress') body = renderProgress();
    else if (UI.tab === 'guide') body = renderGuide();
    else body = renderToday();
    return body + navBar();
  }

  var root = document.getElementById('app');
  function render() {
    var sc = root.querySelector('.scroll'), y = sc ? sc.scrollTop : 0, key = UI.screen + '|' + UI.tab;
    root.innerHTML = renderMain() + renderSheet() + (UI.toast ? '<div class="toast" role="status">' + esc(UI.toast) + '</div>' : '');
    var sc2 = root.querySelector('.scroll');
    if (sc2 && render.key === key) sc2.scrollTop = y;
    render.key = key;
  }

  /* ---------- nutrition (Cronometer daily-summary CSV) ---------- */
  var N = P.NUTRITION;
  var NUT_FIELDS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'alcohol'];
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false;
    text = text.replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += ch;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || r[0] !== ''; });
  }
  function importNutrition(text) {
    var rows = parseCSV(text); if (rows.length < 2) throw new Error('empty');
    var h = rows[0].map(function (x) { return x.trim(); });
    var col = function (name) { return h.indexOf(name); };
    var iD = col('Date'), iG = col('Group'), iK = col('Energy (kcal)');
    if (iD < 0 || iK < 0) throw new Error('format');
    var idx = { kcal: iK, protein: col('Protein (g)'), carbs: col('Carbs (g)'), fat: col('Fat (g)'), fiber: col('Fiber (g)'), alcohol: col('Alcohol (g)') };
    var g = function (r, i) { var v = i < 0 ? NaN : parseFloat(r[i]); return isNaN(v) ? 0 : v; };
    var parts = [], hasTotal = {};
    rows.slice(1).forEach(function (r) {
      var d = (r[iD] || '').trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      var grp = iG >= 0 ? (r[iG] || '').trim() : 'Total';
      if (grp === 'Total') hasTotal[d] = true;
      var o = { date: d, grp: grp }; NUT_FIELDS.forEach(function (m) { o[m] = g(r, idx[m]); }); parts.push(o);
    });
    var out = {};
    parts.forEach(function (x) {
      if (hasTotal[x.date] && x.grp !== 'Total') return;
      var o = out[x.date] || (out[x.date] = { date: x.date, kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, alcohol: 0 });
      NUT_FIELDS.forEach(function (m) { o[m] += x[m]; });
    });
    var list = Object.keys(out).sort().map(function (d) { var o = out[d]; NUT_FIELDS.forEach(function (m) { o[m] = Math.round(o[m] * 10) / 10; }); return o; });
    if (!list.length) throw new Error('nodays');
    var dates = {}; list.forEach(function (o) { dates[o.date] = 1; });
    DB.nutrition = DB.nutrition.filter(function (o) { return !dates[o.date]; }).concat(list).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    DB.settings.lastNutritionImport = new Date().toISOString();
    save();
    var full = list.filter(fullDay).length;
    return list.length + ' days imported (' + fmtShort(list[0].date) + ' to ' + fmtShort(list[list.length - 1].date) + '), ' + full + ' fully logged.';
  }
  function fullDay(o) { return o.kcal >= N.minKcal; }
  function nutritionWeek(endDate) {
    var from = addDays(endDate, -6), days = DB.nutrition.filter(function (o) { return o.date >= from && o.date <= endDate; });
    var full = days.filter(fullDay), n = full.length;
    var avg = function (m) { return n ? full.reduce(function (s, o) { return s + o[m]; }, 0) / n : null; };
    return { from: from, to: endDate, logged: n, kcal: avg('kcal'), protein: avg('protein'), carbs: avg('carbs'), fat: avg('fat'), fiber: avg('fiber'),
      proteinDays: full.filter(function (o) { return o.protein >= N.protein[0]; }).length,
      drinks: days.reduce(function (s, o) { return s + o.alcohol; }, 0) / N.gramsPerDrink };
  }
  function nutritionLine(w) {
    if (!w.logged) return 'No fully logged days from ' + fmtShort(w.from) + ' to ' + fmtShort(w.to) + '.';
    return 'Avg ' + Math.round(w.kcal).toLocaleString('en-US') + ' kcal · protein ' + Math.round(w.protein) + ' g (target ' + N.protein[0] + ') · ' + w.logged + ' of 7 days logged';
  }
  function nutritionStatus(v, lo, hi) { return v == null ? '' : v < lo ? 'below' : (hi && v > hi) ? 'above' : 'on target'; }

  /* ---------- export / import ---------- */
  function csv(rows) { return rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n') + '\r\n'; }
  function buildFiles() {
    var d = today(), files = [];
    var log = [['Date', 'Week', 'Phase', 'Session', 'Exercise', 'Side', 'Set #', 'Weight (lb)', 'Reps', 'RPE', 'Shoulder pain (0-10)', 'Notes']];
    DB.sets.forEach(function (s) {
      var n = []; if (s.ex !== s.orig) n.push('Swap for ' + s.orig); if (s.extra) n.push('Extra set'); if (s.unit === 'kg') n.push('Weight in kg'); if (s.dist) n.push('Reps = metres');
      if (/Assisted/.test(s.orig) && s.ex === s.orig) n.push('Weight = assistance');
      log.push([s.date, s.wk, P.PHASES[s.wk] || '', getSession(s.key).name, s.ex, s.side, s.setNo, s.bw ? '' : s.w, s.r, s.rpe == null ? '' : s.rpe, s.pain == null ? '' : s.pain, n.join('; ')]);
    });
    var chk = [['Date', 'Week', 'Sleep (h)', 'Readiness (1-5)', 'Soreness (1-5)', 'Resting HR (bpm)', 'Shoulder AM (0-10)', 'Body weight (lb)', 'Protein (g)', 'Notes']];
    DB.checks.forEach(function (c) { var full = c.sleep != null; chk.push([c.date, calWeek(c.date), full ? c.sleep : '', c.ready == null ? '' : c.ready, c.sore == null ? '' : c.sore, c.hr || '', c.pain == null ? '' : c.pain, c.bw || '', c.protein || '', (full ? (c.pt ? 'PT done' : 'PT not done') : 'Protein only') + (c.note ? '; ' + c.note : '')]); });
    var body = [['Date', 'Week', 'Waist', 'Shoulders', 'Chest', 'Arm L', 'Arm R', 'Thigh L', 'Thigh R', 'Calf L', 'Calf R', 'Notes']];
    DB.body.forEach(function (b) { body.push([b.date, calWeek(b.date), b.waist, b.shoulders, b.chest, b.armL, b.armR, b.thighL, b.thighR, b.calfL, b.calfR, b.note || '']); }); /* chest, thigh, calf: older records only */
    var car = [['Date', 'Week', 'Type', 'Minutes', 'Distance (mi)', 'Avg HR', 'Intervals (e.g. 6x30s)', 'RPE (1-10)', 'Notes']];
    DB.cardio.forEach(function (c) { car.push([c.date, calWeek(c.date), c.type, c.min, c.dist || '', c.hr || '', c.intervals || '', c.rpe == null ? '' : c.rpe, c.note || '']); });
    var nut = [['Date', 'Week', 'Energy (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Alcohol (g)', 'Fully logged']];
    DB.nutrition.forEach(function (o) { nut.push([o.date, calWeek(o.date), o.kcal, o.protein, o.carbs, o.fat, o.fiber, o.alcohol, fullDay(o) ? 'Yes' : 'No']); });
    var mk = function (name, text, type) { return new File([text], name, { type: type }); };
    files.push(mk('workout-backup-' + d + '.json', JSON.stringify(DB), 'application/json'));
    files.push(mk('Log-' + d + '.csv', csv(log), 'text/csv'));
    files.push(mk('DailyCheck-' + d + '.csv', csv(chk), 'text/csv'));
    files.push(mk('Body-' + d + '.csv', csv(body), 'text/csv'));
    files.push(mk('Cardio-' + d + '.csv', csv(car), 'text/csv'));
    if (DB.nutrition.length) files.push(mk('Nutrition-' + d + '.csv', csv(nut), 'text/csv'));
    return files;
  }
  function doExport() {
    var files = buildFiles();
    var done = function () { DB.settings.lastExport = new Date().toISOString(); save(); toast('Exported ' + files.length + ' files'); };
    if (navigator.canShare && navigator.canShare({ files: files })) {
      navigator.share({ files: files, title: 'Workout data ' + today() }).then(done).catch(function (e) { if (e && e.name !== 'AbortError') downloadAll(files, done); });
    } else downloadAll(files, done);
  }
  function downloadAll(files, done) {
    files.forEach(function (f, i) {
      setTimeout(function () { var u = URL.createObjectURL(f), aEl = document.createElement('a'); aEl.href = u; aEl.download = f.name; document.body.appendChild(aEl); aEl.click(); aEl.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }, i * 400);
    });
    done();
  }
  function doRestore(file) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!d || d.v !== 1 || !Array.isArray(d.sets) || !Array.isArray(d.sessions)) throw new Error('bad');
        if (!confirm('Replace everything on this phone with this backup (' + d.sets.length + ' sets, ' + d.sessions.length + ' sessions)?')) return;
        DB = d; var f = fresh(); for (var k in f) if (!(k in DB)) DB[k] = f[k];
        save(); UI.screen = null; UI.tab = 'today'; UI.check = UI.body = UI.cardio = null; toast('Backup restored');
      } catch (e) { toast('That file is not a backup from this app.'); }
    };
    rd.readAsText(file);
  }

  /* ---------- actions ---------- */
  function stepVal(obj, k, d, st, min, max, dec) { var v = Math.round(((+obj[k] || 0) + d * st) * 100) / 100; if (min != null) v = Math.max(min, v); if (max != null) v = Math.min(max, v); obj[k] = v; }
  var ACT = {
    tab: function (v) { UI.tab = v; UI.screen = null; if (v === 'check') UI.check = null; if (v === 'body') UI.body = null; },
    settings: function () { UI.screen = 'settings'; },
    back: function () { if (UI.screen === 'detail') { UI.screen = null; UI.tab = 'progress'; } else { UI.screen = null; } UI.swapOpen = false; UI.extra = false; wake(false); },
    'open-ex': function (v) { openEx(+v); return true; },
    'prev-ex': function () { openEx(DB.active.exIdx - 1); return true; },
    'next-ex': function () { var a = DB.active; if (a.exIdx < getSession(a.key).ex.length - 1) openEx(a.exIdx + 1); return true; },
    log: function () { logSet(); return true; },
    undo: function () { undoSet(); return true; },
    'extra-on': function () { UI.extra = true; },
    'extra-off': function () { UI.extra = false; },
    'w-step': function (v, el) { var a = DB.active, ex = getSession(a.key).ex[a.exIdx]; stepVal(a, 'w', +el.dataset.d, ex.step, 0); save(); },
    'r-step': function (v, el) { stepVal(DB.active, 'r', +el.dataset.d, 1, 0); save(); },
    rir: function (v) { var a = DB.active; a.rir = a.rir === +v ? null : +v; save(); },
    pain: function (v) { var a = DB.active; a.pain = a.pain === +v ? null : +v; save(); },
    side: function (v) { DB.active.side = v; save(); },
    'rest-add': function () { var a = DB.active, base = a.restDone ? Date.now() : a.timerEnd; a.timerEnd = base + 30000; a.timerTotal = Math.max(a.timerTotal, (a.timerEnd - Date.now()) / 1000); a.restDone = false; save(); },
    'rest-skip': function () { var a = DB.active; a.timerEnd = 0; a.restDone = false; save(); },
    'swap-toggle': function () { UI.swapOpen = !UI.swapOpen; },
    'swap-pick': function (v) {
      var a = DB.active, ex = getSession(a.key).ex[a.exIdx];
      if (exSets(a, a.exIdx).length && exName(ex) !== v && !confirm('Sets already logged for this exercise stay under ' + exName(ex) + '. Swap anyway?')) return;
      if (v === ex.n) delete DB.swaps[ex.n]; else DB.swaps[ex.n] = v;
      UI.swapOpen = false; var adv = advise(ex, a.wk, a.key, a.sid); if (!exSets(a, a.exIdx).length) { a.w = adv.w; a.r = adv.r; }
      save(); UI.toast = v === ex.n ? 'Back to ' + v : 'Swapped to ' + v; setTimeout(function () { UI.toast = ''; render(); }, 2200);
    },
    warm: function () { var key = currentKey(); if (DB.active && DB.active.key === key) { DB.active.warm = !DB.active.warm; save(); } else UI.warmPre = !UI.warmPre; },
    'finish-open': function () { UI.screen = 'finish'; wake(false); },
    finish: function () { finishSession(); return true; },
    choose: function () { UI.sheet = 'choose'; },
    'choose-pick': function (v) { if (!DB.active) UI.pick = v; UI.sheet = null; },
    discard: function () { if (!confirm('Discard the session in progress and its logged sets?')) return; var sid = DB.active.sid; DB.sets = DB.sets.filter(function (s) { return s.sid !== sid; }); DB.active = null; UI.sheet = null; save(); },
    'sheet-close': function () { UI.sheet = null; },
    'break-repeat': function (v) { DB.pos.wk = +v; DB.pos.done = []; DB.lighten = { wk: +v, f: 0.9 }; DB.breakAck = lastSession().id; save(); },
    'break-restart': function () { DB.pos.wk = 1; DB.pos.done = []; DB.lighten = { wk: 1, f: 0.85 }; DB.breakAck = lastSession().id; save(); },
    'break-carry': function () { DB.breakAck = lastSession().id; save(); },
    'restart-block': function () { if (!confirm('Start a new 12 weeks from week 1? Your history stays.')) return; DB.pos = { wk: 1, done: [] }; save(); },
    cardio: function () { UI.screen = 'cardio'; UI.cardio = null; },
    export: function () { doExport(); },
    install: function () { if (UI.installEvt) { UI.installEvt.prompt(); UI.installEvt = null; } },
    update: function () { if (UI.updateReady) UI.updateReady.postMessage('skipWaiting'); },
    toggle: function (v) { DB.settings[v] = !DB.settings[v]; save(); },
    reset: function () { if (!confirm('Erase all workout data on this phone? Export first if you want a copy.')) return; if (!confirm('This cannot be undone. Erase everything?')) return; DB = fresh(); save(); UI.screen = null; UI.tab = 'today'; },
    guide: function (v) { UI.guideOpen = UI.guideOpen === v ? '' : v; },
    'how-measure': function () { UI.guideOpen = 'measure'; UI.tab = 'guide'; UI.screen = null; },
    detail: function (v) { UI.detail = v; UI.screen = 'detail'; },
    'del-set': function (v) { if (!confirm('Delete this set?')) return; DB.sets = DB.sets.filter(function (s) { return s.id !== v; }); save(); },
    'del-session': function (v) {
      if (!confirm('Delete this session and all its sets? The week counter does not move back.')) return;
      DB.sets = DB.sets.filter(function (s) { return s.sid !== v; }); DB.sessions = DB.sessions.filter(function (s) { return s.id !== v; }); UI.screen = null; UI.tab = 'progress'; save();
    },
    'c-step-sleep': function (v, el) { stepVal(UI.check, 'sleep', +el.dataset.d, 0.5, 0, 14); },
    'c-step-hr': function (v, el) { stepVal(UI.check, 'hr', +el.dataset.d, 1, 30, 150); },
    'c-step-bw': function (v, el) { stepVal(UI.check, 'bw', +el.dataset.d, 0.2, 50, 400); },
    'c-step-protein': function (v, el) { stepVal(UI.check, 'protein', +el.dataset.d, 5, 0, 400); UI.check._p0 = 1; },
    'p-add': function (v) {
      var t = today(), c = checkOn(t);
      if (!c) { c = { date: t, sleep: null, hr: null, bw: null, ready: null, sore: null, pain: null, pt: false, protein: 0, note: '' }; DB.checks.push(c); DB.checks.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
      c.protein = Math.max(0, Math.round((c.protein || 0) + (+v)));
      save(); UI.check = null; toast('Protein today: ' + c.protein + ' g');
      return true;
    },
    'c-ready': function (v) { UI.check.ready = UI.check.ready === +v ? null : +v; },
    'c-sore': function (v) { UI.check.sore = UI.check.sore === +v ? null : +v; },
    'c-pain': function (v) { UI.check.pain = UI.check.pain === +v ? null : +v; },
    'c-pt': function (v) { UI.check.pt = v === '1'; },
    'c-save': function () {
      var c = UI.check, old = checkOn(c.date), rec = { date: c.date, sleep: c.sleep, hr: c.hr, bw: c.bw, ready: c.ready, sore: c.sore, pain: c.pain, pt: c.pt, protein: c.protein || 0, note: c.note || '' };
      if (old && old.protein > (c.protein || 0) && c._p0 == null) rec.protein = old.protein;
      DB.checks = DB.checks.filter(function (x) { return x.date !== c.date; }); DB.checks.push(rec); DB.checks.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      save(); UI.check = null; toast('Check-in saved'); return true;
    },
    'b-save': function () {
      var b = UI.body, rec = {}; ['date'].concat(BODY_KEYS, ['note']).forEach(function (k) { rec[k] = b[k]; });
      DB.body = DB.body.filter(function (x) { return x.date !== b.date; }); DB.body.push(rec); DB.body.sort(function (a, c) { return a.date < c.date ? -1 : 1; });
      save(); UI.body = null; toast('Measurements saved'); return true;
    },
    'k-type': function (v) { UI.cardio.type = v; },
    'k-step-min': function (v, el) { stepVal(UI.cardio, 'min', +el.dataset.d, 5, 0, 300); },
    'k-step-dist': function (v, el) { stepVal(UI.cardio, 'dist', +el.dataset.d, 0.1, 0, 50); },
    'k-rpe': function (v) { UI.cardio.rpe = UI.cardio.rpe === +v ? null : +v; },
    'k-save': function () {
      var c = UI.cardio, isInt = /Intervals|intervals/.test(c.type);
      DB.cardio.push({ date: c.date, type: c.type, min: c.min, dist: c.dist || '', hr: c.hr ? +c.hr : '', intervals: isInt ? c.intervals : '', rpe: c.rpe, note: c.note || '' });
      save(); UI.cardio = null; UI.screen = null; toast('Cardio saved'); return true;
    }
  };
  ['waist', 'shoulders', 'chest', 'armL', 'armR', 'thighL', 'thighR', 'calfL', 'calfR'].forEach(function (k) {
    ACT['b-step-' + k] = function (v, el) { stepVal(UI.body, k, +el.dataset.d, 0.25, 0, 100); };
  });

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    if (el.dataset.a === 'sheet-close' && e.target.closest('[data-stop]') && el.classList.contains('sheet')) return;
    var fn = ACT[el.dataset.a]; if (!fn) return;
    var handled = fn(el.dataset.v, el);
    if (!handled) render();
  });
  root.addEventListener('change', function (e) {
    var el = e.target, f = el.dataset && el.dataset.f; if (!f) return;
    var v = el.value, n = parseFloat(v);
    if (f === 'restore') { if (el.files && el.files[0]) doRestore(el.files[0]); return; }
    if (f === 'nutri') {
      if (el.files && el.files[0]) { var rd = new FileReader(); rd.onload = function () { try { UI.nutriMsg = importNutrition(rd.result); } catch (err) { UI.nutriMsg = 'That file doesn\u2019t look like a Cronometer daily nutrition export. It needs Date and Energy (kcal) columns.'; } render(); }; rd.readAsText(el.files[0]); }
      el.value = ''; return;
    }
    if (f === 'w' || f === 'r') { if (!isNaN(n) && n >= 0) { DB.active[f] = f === 'r' ? Math.round(n) : n; save(); } render(); return; }
    if (f.indexOf('c-') === 0) { var k = f.slice(2); if (k === 'note') UI.check.note = v; else if (!isNaN(n)) { UI.check[k] = n; if (k === 'protein') UI.check._p0 = 1; } render(); return; }
    if (f.indexOf('b-') === 0) { var kb = f.slice(2); if (kb === 'note') UI.body.note = v; else if (!isNaN(n)) UI.body[kb] = n; render(); return; }
    if (f.indexOf('k-') === 0) { var kk = f.slice(2); if (kk === 'note' || kk === 'intervals' || kk === 'hr') UI.cardio[kk] = v; else if (!isNaN(n)) UI.cardio[kk] = n; render(); return; }
    if (f === 's-start') { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { DB.settings.start = v; save(); } render(); return; }
    if (f === 's-hr') { DB.settings.baseHR = isNaN(n) ? null : Math.round(n); save(); render(); return; }
  });
  root.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('.stepper input, .pairbox input')) setTimeout(function () { try { e.target.select(); } catch (x) { /* ignore */ } }, 0); });

  /* ---------- install + offline ---------- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); UI.installEvt = e; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var notify = function (w) { if (w && navigator.serviceWorker.controller) { UI.updateReady = w; render(); } };
      if (reg.waiting) notify(reg.waiting);
      reg.addEventListener('updatefound', function () { var w = reg.installing; w && w.addEventListener('statechange', function () { if (w.state === 'installed') notify(w); }); });
      setInterval(function () { reg.update().catch(function () {}); }, 3600000);
    }).catch(function () {});
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (!reloaded) { reloaded = true; location.reload(); } });
  }

  if (DB.active) { UI.screen = null; }
  render();
  window.__wl = { DB: function () { return DB; }, UI: UI, render: render };
})();
