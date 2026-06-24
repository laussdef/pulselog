(function () {
  const CONFIG = {
    energyLevel: 7,
    focusLevel: 6,
    defaultFriction: 'Creative Block',
  };

  const R = 52;
  const CIRC = 2 * Math.PI * R;     // 326.726
  const ARC = 0.75 * CIRC;          // 245.044
  const clamp = (n) => Math.max(0, Math.min(10, n));

  function offsetFor(value) {
    return CIRC - (clamp(value) / 10) * ARC;
  }

  function setDate() {
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    document.getElementById('date').textContent =
      `${weekday} · ${month} ${d.getDate()}`.toUpperCase();
  }

  function initMeters() {
    document.getElementById('energyValue').textContent = CONFIG.energyLevel;
    document.getElementById('focusValue').textContent = CONFIG.focusLevel;

    const energyArc = document.getElementById('energyArc');
    const focusArc = document.getElementById('focusArc');
    energyArc.style.strokeDashoffset = CIRC;
    focusArc.style.strokeDashoffset = CIRC;

    // animate the fill in on load
    requestAnimationFrame(() => {
      setTimeout(() => {
        energyArc.style.strokeDashoffset = offsetFor(CONFIG.energyLevel);
        focusArc.style.strokeDashoffset = offsetFor(CONFIG.focusLevel);
      }, 80);
    });
  }

  function initFriction() {
    const grid = document.getElementById('frictionGrid');
    const buttons = grid.querySelectorAll('.friction-btn');

    function select(name) {
      buttons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.friction === name);
      });
    }

    select(CONFIG.defaultFriction);
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.friction-btn');
      if (btn) select(btn.dataset.friction);
    });
  }

  function initChecklist() {
    const initial = { hydration: true, walk: false, play: true };
    const list = document.getElementById('checklist');
    list.querySelectorAll('.check-row').forEach((row) => {
      row.classList.toggle('checked', initial[row.dataset.check]);
      row.addEventListener('click', () => row.classList.toggle('checked'));
    });
  }

  function initNav() {
    const nav = document.getElementById('navItems');
    const items = nav.querySelectorAll('.nav-item');
    function select(name) {
      items.forEach((item) => item.classList.toggle('active', item.dataset.nav === name));
    }
    select('Dashboard');
    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (item) select(item.dataset.nav);
    });
  }

  setDate();
  initMeters();
  initFriction();
  initChecklist();
  initNav();
})();
