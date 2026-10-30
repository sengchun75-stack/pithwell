/* The crossdating demonstration: slide an undated sample along a dated master and
 * count how many of its narrow rings fall in years where the master is narrow too.
 * The widths are invented and the plot says so. */

export function initSlide(fig) {
  const svg = fig.querySelector('svg');
  const g = svg.querySelector('#sa');
  const input = fig.querySelector('input');
  const out = fig.querySelector('output');
  const dx = +g.dataset.dx, off = +g.dataset.off;
  const master = new Set([...svg.querySelectorAll('[data-i]')].map(l => +l.dataset.i));
  const lines = [...g.querySelectorAll('[data-j]')];

  function set(s) {
    g.setAttribute('transform', 'translate(' + ((s - off) * dx) + ' 0)');
    let hit = 0;
    for (const l of lines) { const h = master.has(s + +l.dataset.j); l.classList.toggle('hit', h); if (h) hit++; }
    const locked = hit >= lines.length - 1;
    out.textContent = 'Starts in ' + (1801 + s) + ': ' + hit + ' of its ' + lines.length + ' narrow rings line up.' + (locked ? ' Locked.' : '');
    fig.classList.toggle('is-locked', locked);
  }

  input.addEventListener('input', () => set(+input.value));
  input.value = 3;
  set(3);
}
