/* StacklyFit — real-time layer (open status, floor traffic, live class schedule + booking).
   All numbers are simulated from the clock so the demo behaves "live"; swap `occupancy()` and SLOTS for your real API. */
(() => {
  const TZ = 'Asia/Kolkata', OPEN = 5 * 60, CLOSE = 23 * 60, CAP = 220;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' });
  const now = () => { const o = {}; dtf.formatToParts(new Date()).forEach(p => o[p.type] = p.value); const h = +o.hour % 24; return { h, m: +o.minute, s: +o.second, min: h * 60 + +o.minute + +o.second / 60, key: `${o.year}-${o.month}-${o.day}`, date: new Date(`${o.year}-${o.month}-${o.day}T12:00:00`) } };
  const t12 = min => { const h = Math.floor(min / 60) % 24, m = Math.round(min % 60), ap = h >= 12 ? 'PM' : 'AM'; return `${pad(h % 12 || 12)}:${pad(m)} ${ap}` };
  const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return ((h >>> 0) % 10000) / 10000 };
  const toast = m => { const t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800) };
  const setAll = (sel, txt) => $$(sel).forEach(e => { if (e.textContent !== String(txt)) e.textContent = txt });

  /* ---------- floor traffic ---------- */
  const CURVE = [0, 0, 0, 0, 0, 18, 45, 72, 80, 60, 38, 30, 35, 42, 34, 30, 38, 62, 84, 88, 70, 45, 22, 0];
  const target = min => { if (min < OPEN || min >= CLOSE) return 0; const h = Math.floor(min / 60), f = (min % 60) / 60; return CURVE[h] + (CURVE[(h + 1) % 24] - CURVE[h]) * f };
  let cur = target(now().min);
  const isOpen = min => min >= OPEN && min < CLOSE;

  /* ---------- classes ---------- */
  const SLOTS = [['06:00', 'Strength Foundations', 'Sarah Mitchell', 60, 18], ['07:30', 'HIIT Express', 'David Wilson', 45, 22], ['09:00', 'Yoga Flow', 'Priya Sharma', 60, 16], ['12:30', 'Lunch Burn Circuit', 'David Wilson', 45, 20],
    ['17:30', 'Power Cycling', 'James Carter', 45, 24], ['18:30', 'Strength & Conditioning', 'Sarah Mitchell', 60, 18], ['19:45', 'Sports Conditioning', 'James Carter', 60, 20], ['21:00', 'Mobility Reset', 'Priya Sharma', 45, 16]]
    .map(([t, n, c, d, cap]) => { const [h, m] = t.split(':').map(Number); return { n, c, d, cap, start: h * 60 + m, end: h * 60 + m + d } });
  const LS = 'stacklyfit-booked';
  const loadB = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}') } catch { return {} } };
  const saveB = b => { try { localStorage.setItem(LS, JSON.stringify(b)) } catch { } };

  const lists = $$('[data-live-schedule]');
  let tomorrow = false, bkey = '';
  const build = () => lists.forEach(l => {
    l.innerHTML = SLOTS.map((s, i) => `<div class="cls" data-i="${i}"><div class="tm"><b>${t12(s.start)}</b><small>${s.d} min</small></div><div class="inf"><h4>${s.n.replace('&', '&amp;')}</h4><small>with ${s.c}</small><div class="pg"><i></i></div></div><div class="sp"><span class="bd">Upcoming</span><small data-sp></small></div><button class="bk" type="button">Book</button></div>`).join('')
  });
  build();
  lists.forEach(l => l.addEventListener('click', e => {
    const b = e.target.closest('.bk'); if (!b || b.disabled) return;
    const i = +b.closest('.cls').dataset.i, all = loadB(), set = new Set(all[bkey] || []);
    if (set.has(i)) { set.delete(i); toast(`Booking cancelled: ${SLOTS[i].n}`) } else { set.add(i); toast(`Booked: ${SLOTS[i].n} · ${t12(SLOTS[i].start)}${tomorrow ? ' tomorrow' : ''}`) }
    all[bkey] = [...set]; saveB(all); update()
  }));

  /* ---------- update loop ---------- */
  function update() {
    const n = now(), min = n.min, open = isOpen(min);
    // clock + status
    const clock = `${pad(n.h % 12 || 12)}:${pad(n.m)}:${pad(n.s)} ${n.h >= 12 ? 'PM' : 'AM'}`;
    $$('[data-live-clock]').forEach(e => e.textContent = e.closest('.topbar') ? clock.replace(/:\d\d (?=[AP]M)/, ' ') + ' IST' : clock);
    const closing = CLOSE - min, st = open ? (closing <= 60 ? `Closing in ${Math.ceil(closing)} min` : 'Open now') : 'Closed';
    setAll('[data-live-status]', st);
    setAll('[data-live-status-long]', open ? `Open now · closes ${t12(CLOSE)}` : `Closed · opens ${t12(OPEN)}`);
    document.body.classList.toggle('closed', !open);

    // classes
    tomorrow = SLOTS.every(s => min >= s.end);
    const eff = tomorrow ? min - 1440 : min, d = new Date(n.date); if (tomorrow) d.setDate(d.getDate() + 1);
    bkey = d.toISOString().slice(0, 10);
    const booked = new Set(loadB()[bkey] || []);
    setAll('[data-live-date]', (tomorrow ? 'Tomorrow · ' : 'Today · ') + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    let nextTxt = null, liveTxt = null;
    lists.forEach(l => {
      const limit = +l.dataset.limit || 0; let shown = 0;
      $$('.cls', l).forEach((row, i) => {
        const s = SLOTS[i], rem = s.start - eff, live = eff >= s.start && eff < s.end, done = eff >= s.end;
        const ramp = Math.max(0, Math.min(1, 1 - rem / 360)), h1 = hash(bkey + i), h2 = hash(i + bkey + 'x');
        let taken = Math.round(s.cap * Math.min(1, .22 + .5 * h1 + .3 * ramp * h2)) + (booked.has(i) ? 1 : 0);
        taken = Math.min(taken, s.cap); const left = s.cap - taken;
        row.hidden = !!limit && (done || shown >= limit); if (!row.hidden && !done) shown++;
        row.className = 'cls' + (live ? ' live' : done ? ' done' : rem <= 60 ? ' soon' : '') + (left > 0 && left <= 4 && !done ? ' low' : '');
        const bd = row.querySelector('.bd'), sp = row.querySelector('[data-sp]'), bk = row.querySelector('.bk');
        let label;
        if (done) label = 'Completed'; else if (live) label = `Live · ${Math.ceil(s.end - eff)} min left`;
        else if (rem <= 10) { const sec = Math.max(0, Math.round(rem * 60)); label = `Starts in ${Math.floor(sec / 60)}:${pad(sec % 60)}` }
        else if (rem <= 60) label = `Starts in ${Math.ceil(rem)} min`; else label = tomorrow ? 'Tomorrow' : 'Upcoming';
        if (bd.textContent !== label) bd.textContent = label;
        const spt = done ? '' : left <= 0 ? 'Class full' : `${left} spot${left === 1 ? '' : 's'} left`;
        if (sp.textContent !== spt) sp.textContent = spt;
        row.querySelector('.pg i').style.setProperty('--p', live ? `${((eff - s.start) / s.d * 100).toFixed(1)}%` : '0%');
        const isB = booked.has(i);
        bk.classList.toggle('on', isB);
        bk.textContent = isB ? 'Booked ✓' : done ? 'Closed' : left <= 0 ? 'Full' : live ? 'Join now' : 'Book';
        bk.disabled = done || (left <= 0 && !isB);
      });
    });
    SLOTS.forEach((s, i) => {
      const rem = s.start - eff;
      if (eff >= s.start && eff < s.end && !liveTxt) liveTxt = `<strong>Live now:</strong> ${s.n} · ${Math.ceil(s.end - eff)} min left`;
      if (rem > 0 && !nextTxt) nextTxt = `<strong>Next class:</strong> ${s.n} ${tomorrow ? 'tomorrow at ' + t12(s.start) : rem < 60 ? 'in ' + Math.ceil(rem) + ' min' : 'at ' + t12(s.start)}`;
    });
    $$('[data-live-next]').forEach(e => e.innerHTML = liveTxt || nextTxt || 'View today’s live schedule');
  }

  /* ---------- gauge / counters (every 2.5 s) ---------- */
  const bars = $$('[data-live-bars]');
  const buildBars = () => bars.forEach(b => { b.innerHTML = Array.from({ length: 18 }, (_, k) => `<i title="${t12((k + 5) * 60)}"></i>`).join('') });
  buildBars();
  function traffic() {
    const n = now(), open = isOpen(n.min), t = target(n.min);
    cur = open ? Math.max(2, Math.min(98, cur + (t - cur) * .25 + (Math.random() - .5) * 2.6)) : 0;
    const pct = Math.round(cur), count = Math.round(CAP * cur / 100);
    setAll('[data-live-count]', open ? count : 0); setAll('[data-live-pct]', pct); setAll('[data-live-cap]', CAP);
    $$('[data-live-ring]').forEach(r => { r.style.strokeDasharray = `${cur.toFixed(1)} 100`; r.classList.toggle('hot', cur >= 80) });
    $$('[data-live-label]').forEach(l => { l.className = 'lv' + (!open ? ' off' : cur >= 65 ? ' busy' : ''); l.textContent = !open ? 'Closed right now' : cur < 35 ? 'Quiet · great time to train' : cur < 65 ? 'Moderate · plenty of space' : cur < 85 ? 'Busy · expect a short wait' : 'Peak hours' });
    bars.forEach(b => $$('i', b).forEach((bar, k) => { const h = k + 5, isNow = open && h === n.h; bar.style.setProperty('--h', (isNow ? cur : CURVE[h]) + '%'); bar.className = isNow ? 'now' : (h < n.h ? 'past' : '') }));
  }
  update(); traffic();
  setInterval(update, 1000); setInterval(traffic, 2500);
})();
