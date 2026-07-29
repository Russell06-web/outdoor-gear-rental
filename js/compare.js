/* Product comparison (最多 3 項). Loaded after storage.js/main.js/data.js, before gear-render.js. */

const COMPARE_KEY = 'ogr_compare_v1';
const COMPARE_MAX = 3;

const COMPARE_ROWS = [
  { label: '品牌', get: (g) => g.brand },
  { label: '每日租金', get: (g) => `${formatCurrency(g.rentPricePerDay)}／天` },
  { label: '購買價格', get: (g) => formatCurrency(g.buyPrice) },
  { label: '重量', get: (g) => g.compareSpecs?.weight },
  { label: '容量', get: (g) => g.compareSpecs?.capacity },
  { label: '適用天數', get: (g) => g.compareSpecs?.suitableDays },
  { label: '適用人數', get: (g) => g.compareSpecs?.suitablePeople },
  { label: '活動難度', get: (g) => g.difficulty },
  { label: '尺寸範圍', get: (g) => g.compareSpecs?.sizeRange },
  { label: '主要材質', get: (g) => g.compareSpecs?.material },
  { label: '防水能力', get: (g) => g.compareSpecs?.waterproof },
  { label: '舒適溫度', get: (g) => g.compareSpecs?.comfortTemp },
  { label: 'R值', get: (g) => g.compareSpecs?.rValue },
  { label: '最大承重', get: (g) => g.compareSpecs?.maxLoad },
  { label: '先租後買資格', get: () => '符合資格' },
];

function getCompareIds() {
  return safeGetJSON(COMPARE_KEY, []);
}
function setCompareIds(ids) {
  return safeSetJSON(COMPARE_KEY, ids);
}
function isInCompare(gearId) {
  return getCompareIds().includes(gearId);
}

/* Returns { ok, reason } — reason is 'max' when a 4th item was rejected, so
   callers can show a specific message instead of failing silently. */
function toggleCompare(gearId) {
  const ids = getCompareIds();
  const idx = ids.indexOf(gearId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    setCompareIds(ids);
    renderCompareBar();
    return { ok: true, added: false };
  }
  if (ids.length >= COMPARE_MAX) {
    return { ok: false, reason: 'max' };
  }
  ids.push(gearId);
  setCompareIds(ids);
  renderCompareBar();
  return { ok: true, added: true };
}

function clearCompare() {
  setCompareIds([]);
  renderCompareBar();
}

function compareButtonHTML(gearId) {
  const active = isInCompare(gearId);
  return `
    <button type="button" class="compare-btn${active ? ' active' : ''}" data-compare-toggle="${gearId}" aria-pressed="${active}">
      ${svgIcon('scale', 'style="width:14px;height:14px"')}
      ${active ? '已加入比較' : '加入比較'}
    </button>
  `;
}

function wireCompareButtons(container) {
  container.querySelectorAll('[data-compare-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const result = toggleCompare(btn.dataset.compareToggle);
      if (!result.ok && result.reason === 'max') {
        showToast('最多可比較 3 項商品，請先移除一項再加入。');
        return;
      }
      const active = isInCompare(btn.dataset.compareToggle);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      btn.innerHTML = `${svgIcon('scale', 'style="width:14px;height:14px"')} ${active ? '已加入比較' : '加入比較'}`;
    });
  });
}

function renderCompareBar() {
  const ids = getCompareIds();
  let bar = document.getElementById('compareBar');
  if (ids.length === 0) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compareBar';
    bar.className = 'compare-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '商品比較清單');
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <span class="compare-bar-count">已選擇 ${ids.length}／${COMPARE_MAX} 項</span>
    <div class="compare-bar-actions">
      <button type="button" class="btn btn-ghost btn-sm" id="compareBarClear">清除</button>
      <button type="button" class="btn btn-primary btn-sm" id="compareBarView" ${ids.length < 2 ? 'disabled' : ''}>查看比較</button>
    </div>
  `;
  bar.querySelector('#compareBarClear').addEventListener('click', clearCompare);
  bar.querySelector('#compareBarView').addEventListener('click', openCompareModal);
}

function compareCellValue(row, gear) {
  const v = row.get(gear);
  if (v === undefined || v === null || v === '' || Number.isNaN(v)) return '不適用';
  return v;
}

function openCompareModal() {
  const gears = getCompareIds().map((id) => getGearById(id)).filter(Boolean);
  if (gears.length === 0) return;

  const headerCells = gears.map((g) => `
    <th>
      <div class="compare-th-thumb gear-thumb${g.photo ? ' has-photo' : ''}" data-activity="${g.activity}">
        ${g.photo ? `<img src="${g.photo}" alt="${g.name}">` : svgIcon(g.icon)}
      </div>
      <div class="compare-th-name">${g.name}</div>
    </th>
  `).join('');

  const bodyRows = COMPARE_ROWS.map((row) => `
    <tr>
      <th scope="row">${row.label}</th>
      ${gears.map((g) => `<td>${compareCellValue(row, g)}</td>`).join('')}
    </tr>
  `).join('');

  const overlay = showModal(`
    <h2 id="compareModalTitle" style="font-size:1.15rem">商品比較</h2>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead><tr><th></th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost btn-block" id="compareModalClose">關閉</button>
    </div>
  `, { labelledBy: 'compareModalTitle' });
  overlay.querySelector('.modal-dialog').style.maxWidth = '780px';
  overlay.querySelector('#compareModalClose').addEventListener('click', () => closeModal());
}
