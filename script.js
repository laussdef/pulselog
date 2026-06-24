(function () {
  const DB = window.PulseLogDB;

  const R = 52;
  const CIRC = 2 * Math.PI * R;     // 326.726
  const ARC = 0.75 * CIRC;          // 245.044
  const clamp10 = (n) => Math.max(0, Math.min(10, n));

  function offsetFor(value) {
    return CIRC - (clamp10(value) / 10) * ARC;
  }

  function energyStatusText(v) {
    if (v <= 2) return 'Depleted';
    if (v <= 4) return 'Low';
    if (v <= 6) return 'Steady';
    if (v <= 8) return 'Elevated';
    return 'Peak';
  }

  function focusStatusText(v) {
    if (v <= 2) return 'Scattered';
    if (v <= 4) return 'Drifting';
    if (v <= 6) return 'Steady';
    if (v <= 8) return 'Sharp';
    return 'Locked In';
  }

  const els = {
    views: {
      login: document.getElementById('view-login'),
      dashboard: document.getElementById('view-dashboard'),
      history: document.getElementById('view-history'),
      insights: document.getElementById('view-insights'),
    },
    navbar: document.getElementById('navbar'),
    navItems: document.querySelectorAll('.nav-item'),

    authTitle: document.getElementById('authTitle'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authError: document.getElementById('authError'),
    authSubmit: document.getElementById('authSubmit'),
    authToggle: document.getElementById('authToggle'),
    authToggleText: document.getElementById('authToggleText'),

    date: document.getElementById('date'),
    energyArc: document.getElementById('energyArc'),
    focusArc: document.getElementById('focusArc'),
    energyValue: document.getElementById('energyValue'),
    focusValue: document.getElementById('focusValue'),
    energyStatus: document.getElementById('energyStatus'),
    focusStatus: document.getElementById('focusStatus'),
    energyDec: document.getElementById('energyDec'),
    energyInc: document.getElementById('energyInc'),
    focusDec: document.getElementById('focusDec'),
    focusInc: document.getElementById('focusInc'),
    frictionGrid: document.getElementById('frictionGrid'),
    anchorInput: document.getElementById('anchorInput'),
    checklist: document.getElementById('checklist'),
    saveBtn: document.getElementById('saveBtn'),

    historyList: document.getElementById('historyList'),
    avgEnergy: document.getElementById('avgEnergy'),
    avgFocus: document.getElementById('avgFocus'),
    trendChart: document.getElementById('trendChart'),
    frictionBreakdown: document.getElementById('frictionBreakdown'),
  };

  const state = {
    energy: 7,
    focus: 6,
    selectedFriction: 'Creative Block',
    anchor: '',
    checks: { hydration: true, walk: false, play: true },
    dashboardMounted: false,
    authMode: 'signin',
  };

  // ── View switching ──
  function showView(name) {
    Object.entries(els.views).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    els.navbar.style.display = name === 'login' ? 'none' : '';
    els.navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.nav === name);
    });
  }

  // ── Date header ──
  function renderDate() {
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    els.date.textContent = `${weekday} · ${month} ${d.getDate()}`.toUpperCase();
  }

  // ── Meters ──
  function renderMeters(animate) {
    els.energyValue.textContent = state.energy;
    els.focusValue.textContent = state.focus;
    els.energyStatus.textContent = energyStatusText(state.energy);
    els.focusStatus.textContent = focusStatusText(state.focus);
    els.energyArc.style.strokeDashoffset = animate ? offsetFor(state.energy) : CIRC;
    els.focusArc.style.strokeDashoffset = animate ? offsetFor(state.focus) : CIRC;
  }

  function setEnergy(v) { state.energy = clamp10(v); renderMeters(true); }
  function setFocus(v) { state.focus = clamp10(v); renderMeters(true); }

  // ── Friction grid ──
  function renderFriction() {
    els.frictionGrid.querySelectorAll('.friction-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.friction === state.selectedFriction);
    });
  }

  // ── Checklist ──
  function renderChecklist() {
    els.checklist.querySelectorAll('.check-row').forEach((row) => {
      row.classList.toggle('checked', !!state.checks[row.dataset.check]);
    });
  }

  // ── Dashboard wiring (once) ──
  function wireDashboard() {
    els.energyDec.addEventListener('click', () => setEnergy(state.energy - 1));
    els.energyInc.addEventListener('click', () => setEnergy(state.energy + 1));
    els.focusDec.addEventListener('click', () => setFocus(state.focus - 1));
    els.focusInc.addEventListener('click', () => setFocus(state.focus + 1));

    els.frictionGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.friction-btn');
      if (!btn) return;
      state.selectedFriction = btn.dataset.friction;
      renderFriction();
    });

    els.anchorInput.addEventListener('input', (e) => { state.anchor = e.target.value; });

    els.checklist.addEventListener('click', (e) => {
      const row = e.target.closest('.check-row');
      if (!row) return;
      const key = row.dataset.check;
      state.checks[key] = !state.checks[key];
      renderChecklist();
    });

    els.saveBtn.addEventListener('click', onSave);
  }

  async function onSave() {
    els.saveBtn.disabled = true;
    els.saveBtn.classList.remove('saved');
    els.saveBtn.textContent = 'Saving…';
    try {
      await DB.saveLog({
        log_date: DB.todayStr(),
        energy_level: state.energy,
        focus_state: state.focus,
        friction_type: state.selectedFriction,
        unshakable_fact: state.anchor,
        hydration: state.checks.hydration,
        walk: state.checks.walk,
        creative_play: state.checks.play,
      });
      els.saveBtn.textContent = 'Saved ✓';
      els.saveBtn.classList.add('saved');
    } catch (err) {
      els.saveBtn.textContent = 'Could not save — retry';
      console.error(err);
    } finally {
      els.saveBtn.disabled = false;
      setTimeout(() => {
        els.saveBtn.textContent = "Save Today's Entry";
        els.saveBtn.classList.remove('saved');
      }, 1800);
    }
  }

  async function loadTodayIntoDashboard() {
    let log = null;
    try {
      log = await DB.getLogByDate(DB.todayStr());
    } catch (err) {
      console.error(err);
    }
    if (log) {
      state.energy = clamp10(log.energy_level);
      state.focus = clamp10(log.focus_state);
      state.selectedFriction = log.friction_type || 'Creative Block';
      state.anchor = log.unshakable_fact || '';
      state.checks = { hydration: !!log.hydration, walk: !!log.walk, play: !!log.creative_play };
    }
    els.anchorInput.value = state.anchor;
    renderFriction();
    renderChecklist();
    renderMeters(false);
    requestAnimationFrame(() => setTimeout(() => renderMeters(true), 80));
  }

  // ── History ──
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  }

  async function renderHistory() {
    els.historyList.innerHTML = '<div class="history-empty">Loading…</div>';
    let logs = [];
    try {
      logs = await DB.listLogs();
    } catch (err) {
      els.historyList.innerHTML = '<div class="history-empty">Could not load history.</div>';
      console.error(err);
      return;
    }
    if (!logs.length) {
      els.historyList.innerHTML = '<div class="history-empty">No entries yet — save your first day from the Dashboard.</div>';
      return;
    }
    els.historyList.innerHTML = logs.map((log) => `
      <div class="history-card">
        <div class="history-date">${formatDate(log.log_date)}</div>
        <div class="history-metrics">
          <span class="history-metric history-metric-energy">Energy ${log.energy_level}/10</span>
          <span class="history-metric history-metric-focus">Focus ${log.focus_state}/10</span>
        </div>
        ${log.unshakable_fact ? `<div class="history-fact">${escapeHtml(log.unshakable_fact)}</div>` : ''}
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Insights ──
  function renderTrendChart(logs) {
    const svg = els.trendChart;
    svg.innerHTML = '';
    const recent = logs.slice(0, 14).slice().reverse(); // oldest -> newest, max 14
    if (recent.length < 2) {
      svg.innerHTML = '<text x="150" y="64" text-anchor="middle" fill="rgba(245,245,247,0.35)" font-size="11">Not enough entries yet</text>';
      return;
    }
    const w = 300, h = 120, pad = 10;
    const x = (i) => pad + (i / (recent.length - 1)) * (w - pad * 2);
    const y = (v) => h - pad - (clamp10(v) / 10) * (h - pad * 2);

    function pathFor(key) {
      return recent.map((log, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(log[key]).toFixed(1)}`).join(' ');
    }

    svg.innerHTML = `
      <path d="${pathFor('energy_level')}" fill="none" stroke="#FF8A3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${pathFor('focus_state')}" fill="none" stroke="#FF2E9F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  function renderFrictionBreakdown(logs) {
    const counts = {};
    logs.forEach((log) => {
      if (!log.friction_type) return;
      counts[log.friction_type] = (counts[log.friction_type] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      els.frictionBreakdown.innerHTML = '<div class="history-empty">No friction logged yet.</div>';
      return;
    }
    const max = entries[0][1];
    els.frictionBreakdown.innerHTML = entries.map(([label, count]) => `
      <div class="friction-bar-row">
        <span class="friction-bar-label">${escapeHtml(label)}</span>
        <span class="friction-bar-track"><span class="friction-bar-fill" style="width:${(count / max) * 100}%"></span></span>
        <span class="friction-bar-count">${count}</span>
      </div>
    `).join('');
  }

  async function renderInsights() {
    let logs = [];
    try {
      logs = await DB.listLogs();
    } catch (err) {
      console.error(err);
    }
    if (logs.length) {
      const avg = (key) => (logs.reduce((sum, l) => sum + l[key], 0) / logs.length).toFixed(1);
      els.avgEnergy.textContent = avg('energy_level');
      els.avgFocus.textContent = avg('focus_state');
    } else {
      els.avgEnergy.textContent = '–';
      els.avgFocus.textContent = '–';
    }
    renderTrendChart(logs);
    renderFrictionBreakdown(logs);
  }

  // ── Nav ──
  document.getElementById('navItems').addEventListener('click', async (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    const dest = item.dataset.nav;
    if (dest === 'logout') {
      await DB.signOut();
      return;
    }
    showView(dest);
    if (dest === 'history') renderHistory();
    if (dest === 'insights') renderInsights();
  });

  // ── Auth ──
  function setAuthMode(mode) {
    state.authMode = mode;
    const isSignUp = mode === 'signup';
    els.authTitle.textContent = isSignUp ? 'Create Account' : 'Sign In';
    els.authSubmit.textContent = isSignUp ? 'Create Account' : 'Sign In';
    els.authToggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    els.authToggle.textContent = isSignUp ? 'Sign in' : 'Create one';
    els.authError.textContent = '';
  }

  els.authToggle.addEventListener('click', () => {
    setAuthMode(state.authMode === 'signup' ? 'signin' : 'signup');
  });

  els.authSubmit.addEventListener('click', async () => {
    const email = els.authEmail.value.trim();
    const password = els.authPassword.value;
    els.authError.textContent = '';
    els.authError.style.color = '#FF6B6B';
    if (!email || !password) {
      els.authError.textContent = 'Enter an email and password.';
      return;
    }
    els.authSubmit.disabled = true;
    try {
      if (state.authMode === 'signup') {
        await DB.signUp(email, password);
        const session = await DB.getSession();
        if (!session) {
          els.authError.style.color = '#6BCB77';
          els.authError.textContent = 'Account created — check your email to confirm, then sign in.';
          setAuthMode('signin');
        }
      } else {
        await DB.signIn(email, password);
      }
    } catch (err) {
      els.authError.textContent = err.message || 'Something went wrong.';
    } finally {
      els.authSubmit.disabled = false;
    }
  });

  // ── Boot ──
  async function enterApp() {
    showView('dashboard');
    renderDate();
    if (!state.dashboardMounted) {
      wireDashboard();
      state.dashboardMounted = true;
    }
    await loadTodayIntoDashboard();
  }

  DB.onAuthChange((session) => {
    if (session) enterApp();
    else showView('login');
  });

  DB.getSession().then((session) => {
    if (session) enterApp();
    else showView('login');
  });
})();
