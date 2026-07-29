/* product.html page logic. Loaded last, after icons/data/storage/main/cart/orders/credits. */

/* Must run before this script's own rendering — see the same note in account.js. */
initializePrototypeData();

const params = new URLSearchParams(location.search);
const item = getGearById(params.get('id')) || GEAR_ITEMS[0];
const activity = getActivityById(item.activity);

document.title = `${item.name}｜GearLoop`;
document.getElementById('breadcrumbActivity').textContent = activity.name + '裝備';
document.getElementById('breadcrumbActivity').href = `gear-list.html?activity=${item.activity}`;
document.getElementById('breadcrumbName').textContent = item.name;
document.getElementById('productName').textContent = item.name;
document.getElementById('productDesc').textContent = item.desc;
document.getElementById('productTags').innerHTML = `
  <span class="tag">${activity.name}</span>
  <span class="tag">${item.difficulty}</span>
  <span class="tag">單位：${item.unit}</span>
`;

const galleryEl = document.getElementById('productGalleryMain');
galleryEl.setAttribute('data-activity', item.activity);
galleryEl.classList.add('gear-thumb');
if (item.photo) {
  galleryEl.classList.add('has-photo');
  galleryEl.innerHTML = `<img src="${item.photo}" alt="${item.name}">`;
} else {
  galleryEl.innerHTML = svgIcon(item.icon);
}

document.getElementById('specTableBody').innerHTML = item.specs
  .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
  .join('');

let mode = 'rent';
let selectedSize = null;
let recommendedSize = null;

function currentSizeStock() {
  return getSizeStockForMode(item, mode);
}

function renderStock() {
  const row = document.getElementById('stockStatusRow');
  const sizeStock = currentSizeStock();
  if (sizeStock) {
    if (!selectedSize) {
      row.innerHTML = `<span class="stock-badge in-stock">依尺寸而定</span><span style="color:var(--color-muted); font-size:0.82rem">請先選擇尺寸查看該尺寸庫存。</span>`;
      return;
    }
    const n = sizeStock[selectedSize] ?? 0;
    const st = stockStatus(n, item.unit);
    row.innerHTML = `<span class="stock-badge ${st.key}">${st.label}</span><span style="color:var(--color-muted); font-size:0.82rem">EU ${selectedSize}｜尚有 ${n} ${item.unit}可供${mode === 'rent' ? '租借' : '購買'}。</span>`;
    return;
  }
  const status = stockStatus(item.stock, item.unit);
  const extra = status.key === 'out-stock'
    ? '目前熱門檔期已滿，可先選擇附近日期或改租其他裝備。'
    : `尚有 ${item.stock} ${item.unit}可供租借／購買。`;
  row.innerHTML = `<span class="stock-badge ${status.key}">${status.label}</span><span style="color:var(--color-muted); font-size:0.82rem">${extra}</span>`;
}

const modeButtons = document.querySelectorAll('.mode-btn');
const rentPanel = document.getElementById('rentPanel');
const buyPanel = document.getElementById('buyPanel');

function setMode(newMode) {
  mode = newMode;
  modeButtons.forEach((b) => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  rentPanel.style.display = mode === 'rent' ? 'block' : 'none';
  buyPanel.style.display = mode === 'buy' ? 'block' : 'none';

  // switching modes uses a different stock pool — clear a size that no longer resolves in it
  const sizeStock = currentSizeStock();
  if (sizeStock && selectedSize && !(sizeStock[selectedSize] > 0)) {
    selectedSize = null;
  }
  clearAddBookingError();
  renderSizePicker();
  renderStock();
  updateAddButton();
}

modeButtons.forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
document.getElementById('buyTotal').textContent = formatCurrency(item.buyPrice);

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

function syncDateBounds() {
  startInput.min = todayStr();
  const start = new Date(startInput.value || todayStr(3));
  const minEnd = new Date(start);
  minEnd.setDate(minEnd.getDate() + 1);
  endInput.min = localDateString(minEnd);
  if (endInput.value && endInput.value <= startInput.value) {
    endInput.value = endInput.min;
  }
}

function updatePrice() {
  syncDateBounds();
  const days = daysBetween(startInput.value, endInput.value);
  document.getElementById('rentDaysLabel').textContent = days > 0 ? `${days} 天` : '請選擇日期區間';
  document.getElementById('rentTotal').textContent = formatCurrency(days * item.rentPricePerDay);
  updateAddButton();
}

startInput.value = todayStr(3);
endInput.value = todayStr(6);
syncDateBounds();
startInput.addEventListener('change', updatePrice);
endInput.addEventListener('change', updatePrice);

const rentVsBuyToggle = document.getElementById('rentVsBuyToggle');
const rentVsBuyTool = document.getElementById('rentVsBuyTool');
rentVsBuyToggle.addEventListener('click', () => {
  const open = rentVsBuyTool.style.display === 'none';
  rentVsBuyTool.style.display = open ? 'block' : 'none';
  rentVsBuyToggle.setAttribute('aria-expanded', String(open));
});

document.getElementById('rentVsBuyCalcBtn').addEventListener('click', () => {
  const uses = parseFloat(document.getElementById('usesPerYear').value);
  const days = parseFloat(document.getElementById('daysPerUse').value);
  const resultBox = document.getElementById('rentVsBuyResult');
  if (!uses || uses <= 0 || !days || days <= 0) {
    resultBox.className = 'size-result show';
    resultBox.innerHTML = `<p style="color:var(--color-danger)">請先輸入一年使用次數與每次使用天數。</p>`;
    return;
  }
  const rentCost = uses * days * item.rentPricePerDay;
  const buyCost = item.buyPrice;
  const breakEvenUse = Math.ceil(buyCost / (days * item.rentPricePerDay));
  const verdict = uses < breakEvenUse
    ? '以目前的使用頻率，先租借較划算。'
    : '以目前的使用頻率，購買可能較划算，可考慮直接購買或留意先租後買折抵。';

  resultBox.className = 'size-result show';
  resultBox.innerHTML = `
    <div class="rvb-compare">
      <div class="rvb-col">
        <div class="pb-label">租借一年預估費用</div>
        <div class="rvb-num">${formatCurrency(rentCost)}</div>
      </div>
      <div class="rvb-col">
        <div class="pb-label">直接購買費用</div>
        <div class="rvb-num">${formatCurrency(buyCost)}</div>
      </div>
    </div>
    <div class="sr-badge" style="margin-top:12px">${verdict}</div>
    <p style="margin-top:8px">以每次 ${days} 天估算，預估使用第 ${breakEvenUse} 次後，累積租金可能超過購買價格。</p>
    <p class="field-hint" style="margin-top:8px">此試算未包含保養、收納與裝備汰換成本，僅供決策參考。</p>
  `;
});

function renderSizeProfileBanner() {
  if (item.id !== 'hiking-boots') return;
  const profile = getSizeProfile();
  if (!profile || !profile.shoeSizeEU) return;
  const bump = (profile.footWidth === 'wide' || profile.preferredFit === 'loose') ? 0.5 : 0;
  const suggested = Math.min(item.sizeMax, Math.max(item.sizeMin, profile.shoeSizeEU + bump));
  const banner = document.getElementById('sizeProfileBanner');
  banner.style.display = 'block';
  banner.innerHTML = `
    <div class="size-tool">
      <p>根據你的尺寸紀錄，建議優先試穿 <strong>EU ${suggested}</strong>。</p>
      <div class="cta-row" style="margin-top:10px">
        <button class="btn btn-forest btn-sm" type="button" id="useProfileBtn">使用我的尺寸紀錄</button>
        <a href="account.html#sizes" class="btn btn-ghost btn-sm">重新計算</a>
      </div>
    </div>
  `;
  document.getElementById('useProfileBtn').addEventListener('click', () => {
    document.getElementById('sizeToolWrap').style.display = 'block';
    const input1 = document.getElementById('sizeInput1');
    if (input1) {
      input1.value = profile.shoeSizeEU;
      computeSize();
    }
  });
}

function renderSizeTool() {
  if (!item.sizeGuide) return;
  document.getElementById('sizeToolWrap').style.display = 'block';
  const tool = document.getElementById('sizeTool');
  let fieldsHTML = '';

  if (item.id === 'hiking-boots') {
    fieldsHTML = `
      <div class="size-tool-grid">
        <div class="field">
          <label>平常鞋碼（EU）</label>
          <input type="number" class="input" id="sizeInput1" min="36" max="45" step="0.5" placeholder="例如 40">
        </div>
        <div class="field">
          <label>此趟是否為多日重裝行程？</label>
          <select class="input" id="sizeInput2">
            <option value="no">否，單日輕裝</option>
            <option value="yes">是，2 天以上重裝</option>
          </select>
        </div>
      </div>`;
  } else if (item.id === 'trekking-poles' || item.id === 'sleeping-bag') {
    fieldsHTML = `
      <div class="field">
        <label>身高（cm）</label>
        <input type="number" class="input" id="sizeInput1" min="140" max="200" placeholder="例如 170">
      </div>`;
  } else if (item.id === 'life-vest') {
    fieldsHTML = `
      <div class="field">
        <label>體重（kg）</label>
        <input type="number" class="input" id="sizeInput1" min="30" max="120" placeholder="例如 62">
      </div>`;
  } else if (item.id === 'sup-board') {
    fieldsHTML = `
      <div class="field">
        <label>使用者體重（kg，含隨身裝備）</label>
        <input type="number" class="input" id="sizeInput1" min="30" max="150" placeholder="例如 65">
      </div>`;
  } else if (item.id === 'backpack-60l') {
    fieldsHTML = `
      <div class="field">
        <label>預計行程天數</label>
        <input type="number" class="input" id="sizeInput1" min="1" max="14" placeholder="例如 3">
      </div>`;
  } else if (item.id === 'tent-2p') {
    fieldsHTML = `
      <div class="field">
        <label>實際過夜人數</label>
        <input type="number" class="input" id="sizeInput1" min="1" max="6" placeholder="例如 2">
      </div>`;
  }

  tool.innerHTML = fieldsHTML + `
    <button class="btn btn-forest btn-sm" id="sizeCalcBtn" style="margin-top:14px" type="button">計算建議</button>
    <div class="size-result" id="sizeResult" aria-live="polite"></div>
  `;
  document.getElementById('sizeCalcBtn').addEventListener('click', computeSize);
}

function computeSize() {
  const input1 = document.getElementById('sizeInput1');
  const input2 = document.getElementById('sizeInput2');
  const v1 = input1 ? parseFloat(input1.value) : null;
  const v2 = input2 ? input2.value : null;
  const resultBox = document.getElementById('sizeResult');

  if (v1 === null || Number.isNaN(v1) || v1 <= 0) {
    resultBox.className = 'size-result show';
    resultBox.innerHTML = `<p style="color:var(--color-danger)">請先輸入數值再計算。</p>`;
    return;
  }

  if (item.id === 'hiking-boots' && (v1 < item.sizeMin || v1 > item.sizeMax)) {
    resultBox.className = 'size-result show';
    resultBox.innerHTML = `<p style="color:var(--color-danger)">此商品僅提供 EU ${item.sizeMin}–${item.sizeMax} 尺寸，請輸入此範圍內的鞋碼再計算。</p>`;
    return;
  }

  let badge = '';
  let note = '';
  let disclaimer = '';

  if (item.id === 'hiking-boots') {
    const bump = v2 === 'yes' ? 0.5 : 0;
    let recommended = Math.round((v1 + bump) * 2) / 2;
    let clampNote = '';
    if (recommended > item.sizeMax) {
      recommended = item.sizeMax;
      clampNote = `建議尺寸已超出本商品提供的 EU ${item.sizeMin}–${item.sizeMax} 範圍，已為您顯示可租借的最大尺寸 ${item.sizeMax}，請務必實際確認合腳程度。`;
    }
    recommendedSize = String(recommended);
    badge = `EU ${recommended}`;
    note = (bump
      ? '多日重裝建議加大半號，搭配厚襪更合腳，避免下坡時腳趾頂到鞋頭。'
      : '與平常鞋碼相同即可，單日行程不需要特別加大。') + (clampNote ? ' ' + clampNote : '');
    disclaimer = '此結果僅供選碼參考，不同品牌楦型可能有差異，取貨時仍需實際試穿確認。';
    renderSizePicker();
  } else if (item.id === 'trekking-poles') {
    const len = Math.round((v1 * 0.68) / 5) * 5;
    badge = `${len} cm`;
    note = `建議先調到約 ${len} cm，此款可調範圍 65–135 cm，上坡可縮短、下坡可加長。`;
  } else if (item.id === 'sleeping-bag') {
    badge = v1 <= 178 ? '標準版' : '加大版';
    note = v1 <= 178
      ? '標準版適合 180cm 以下使用，包覆度剛好，保暖效果較好。'
      : '身高較高建議選加大版，避免腳部露出睡袋外著涼。';
  } else if (item.id === 'life-vest') {
    badge = v1 < 55 ? 'S 號' : v1 <= 80 ? 'M 號' : 'L 號';
    note = '合身的救生衣才能發揮浮力效果，太寬鬆落水時容易脫落。';
  } else if (item.id === 'sup-board') {
    badge = v1 <= 110 ? '適合租借' : '超出建議承重';
    note = v1 <= 110
      ? `此款最大承重 110kg，含你的體重（${v1}kg）與隨身物品仍在安全範圍內。`
      : `此款最大承重 110kg，${v1}kg 已超出建議範圍，建議改租承重更高的款式或洽客服。`;
  } else if (item.id === 'backpack-60l') {
    badge = v1 >= 2 ? '容量剛好' : '可能偏大';
    note = v1 >= 2
      ? `60L 適合 2 天以上重裝行程，${v1} 天的裝備量剛好裝得下。`
      : `${v1} 天的輕裝行程用 60L 可能略顯空曠、增加不必要重量，若不介意背包偏大可以照租。`;
  } else if (item.id === 'tent-2p') {
    badge = v1 <= 2 ? '人數剛好' : '超過建議人數';
    note = v1 <= 2
      ? '此帳篷設計上剛好容納 2 人與隨身裝備，空間舒適。'
      : `建議 ${v1} 人加租一頂帳篷，塞太多人會壓縮到裝備與活動空間。`;
  }

  resultBox.className = 'size-result show';
  resultBox.innerHTML = `<div class="sr-badge">${badge}</div><p>${note}</p>${disclaimer ? `<p class="field-hint" style="margin-top:8px">${disclaimer}</p>` : ''}`;
}

function renderSizePicker() {
  const sizeStock = currentSizeStock();
  const wrap = document.getElementById('sizePickWrap');
  const label = document.getElementById('sizeSelectLabel');
  if (!sizeStock) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  label.textContent = mode === 'rent' ? '選擇實際租借尺寸' : '選擇購買尺寸';

  const select = document.getElementById('sizeSelect');
  const sizes = Object.keys(sizeStock).sort((a, b) => parseFloat(a) - parseFloat(b));
  select.innerHTML = '<option value="">請選擇尺寸</option>' + sizes.map((s) => {
    const n = sizeStock[s];
    const isRecommended = recommendedSize === s;
    const suffix = isRecommended ? '・建議尺寸' : '';
    const label2 = n > 0 ? `EU ${s}（尚有 ${n} ${item.unit}）${suffix}` : `EU ${s}（目前無庫存）`;
    return `<option value="${s}" ${n > 0 ? '' : 'disabled'}>${label2}</option>`;
  }).join('');
  select.value = selectedSize || '';
  if (select.value !== (selectedSize || '')) select.value = '';

  updateSizeStockHint();
}

function updateSizeStockHint() {
  const hint = document.getElementById('sizeStockHint');
  const sizeStock = currentSizeStock();
  if (!selectedSize || !sizeStock) {
    hint.textContent = `請選擇尺寸以查看該尺寸庫存。`;
    return;
  }
  const n = sizeStock[selectedSize] ?? 0;
  hint.textContent = n > 0
    ? `EU ${selectedSize}｜目前尚有 ${n} ${item.unit}`
    : `EU ${selectedSize}｜目前無庫存`;
}

document.getElementById('sizeSelect').addEventListener('change', (e) => {
  selectedSize = e.target.value || null;
  updateSizeStockHint();
  renderStock();
  clearAddBookingError();
  updateAddButton();
});

function renderDifficultyCheck() {
  if (item.difficulty !== '進階') return;
  const wrap = document.getElementById('difficultyWrap');
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <label>你的活動經驗程度</label>
    <select class="input" id="experienceSelect">
      <option value="experienced">有相關經驗</option>
      <option value="beginner">新手，第一次嘗試</option>
    </select>
    <div id="mismatchWarning" aria-live="polite"></div>
  `;
  document.getElementById('experienceSelect').addEventListener('change', (e) => {
    const box = document.getElementById('mismatchWarning');
    if (e.target.value === 'beginner') {
      box.innerHTML = `
        <div class="policy-banner" style="margin-top:12px; background:var(--color-warning-soft); border-color:rgba(200,134,43,0.3)">
          <div class="pb-icon" style="background:rgba(255,255,255,0.7)">${svgIcon('alertTriangle').replace('stroke="currentColor"', 'stroke="#C8862B"')}</div>
          <div>
            <h3 style="color:var(--color-warning)">裝備難度可能不適合新手</h3>
            <p style="font-size:0.82rem; margin-top:4px">「${item.name}」較適合有經驗的使用者。建議搭配教練或有經驗的夥伴同行，或先從難度較低的裝備、較短的路線開始嘗試。</p>
          </div>
        </div>`;
    } else {
      box.innerHTML = '';
    }
  });
}

function clearAddBookingError() {
  const err = document.getElementById('addBookingError');
  err.style.display = 'none';
  err.textContent = '';
}

function showAddBookingError(message) {
  const err = document.getElementById('addBookingError');
  err.textContent = message;
  err.style.display = 'block';
}

function updateAddButton() {
  const btn = document.getElementById('addBookingBtn');
  const verb = mode === 'rent' ? '加入預約清單' : '加入購物車';
  if (item.stock <= 0) {
    btn.textContent = '目前無法預約（額滿）';
    btn.disabled = true;
    return;
  }
  const sizeStock = currentSizeStock();
  if (sizeStock && !selectedSize) {
    btn.disabled = true;
    btn.textContent = mode === 'rent' ? '請先選擇租借尺寸' : '請先選擇購買尺寸';
    return;
  }
  const sizeSuffix = sizeStock ? ` · EU ${selectedSize}` : '';
  if (mode === 'rent') {
    const days = daysBetween(startInput.value, endInput.value);
    btn.disabled = days <= 0;
    btn.textContent = days > 0 ? `${verb}${sizeSuffix} · ${formatCurrency(days * item.rentPricePerDay)}` : '請先選擇有效租借日期';
  } else {
    btn.disabled = false;
    btn.textContent = `${verb}${sizeSuffix} · ${formatCurrency(item.buyPrice)}`;
  }
}

function buildCartLine() {
  const sizeStock = currentSizeStock();
  const base = {
    gearId: item.id,
    name: item.name,
    icon: item.icon,
    photo: item.photo || null,
    activity: item.activity,
    mode,
    selectedSize: sizeStock ? selectedSize : null,
    recommendedSize: sizeStock ? (recommendedSize || null) : null,
    quantity: 1,
  };
  if (mode === 'rent') {
    const days = daysBetween(startInput.value, endInput.value);
    return {
      ...base,
      startDate: startInput.value,
      endDate: endInput.value,
      days,
      unitPrice: item.rentPricePerDay,
      lineTotal: days * item.rentPricePerDay,
    };
  }
  return {
    ...base,
    startDate: null,
    endDate: null,
    days: 0,
    unitPrice: item.buyPrice,
    lineTotal: item.buyPrice,
  };
}

function performAdd() {
  addToCart(buildCartLine());
  showToast(mode === 'rent' ? '已加入預約清單' : '已加入購物車');
}

function openDateConflictDialog(newStart, newEnd) {
  const current = getCartRentalDateRange();
  const overlay = showModal(`
    <h2 id="dateConflictTitle" style="font-size:1.15rem">租借日期與目前預約不同</h2>
    <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">同一筆預約中的租借裝備需要使用相同日期。</p>
    <div class="modal-date-compare">
      <div>
        <div class="pb-label">目前預約清單中的租借日期</div>
        <div class="modal-date-value">${formatDateTW(current.startDate)}～${formatDateTW(current.endDate)}</div>
      </div>
      <div>
        <div class="pb-label">你這次選擇的租借日期</div>
        <div class="modal-date-value">${formatDateTW(newStart)}～${formatDateTW(newEnd)}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="modalUseCurrent">沿用目前預約日期</button>
      <button type="button" class="btn btn-outline btn-block" id="modalClearAndUseNew">清空租借商品並使用新日期</button>
      <button type="button" class="btn btn-ghost btn-block" id="modalCancel">取消</button>
    </div>
  `, { labelledBy: 'dateConflictTitle' });

  overlay.querySelector('#modalUseCurrent').addEventListener('click', () => {
    startInput.value = current.startDate;
    endInput.value = current.endDate;
    updatePrice();
    closeModal();
    showToast('已改用目前預約清單的租借日期，請確認後再加入');
  });
  overlay.querySelector('#modalClearAndUseNew').addEventListener('click', () => {
    clearRentalLines();
    performAdd();
    closeModal();
  });
  overlay.querySelector('#modalCancel').addEventListener('click', () => closeModal());
}

document.getElementById('addBookingBtn').addEventListener('click', () => {
  clearAddBookingError();
  if (item.stock <= 0) return;

  const sizeStock = currentSizeStock();
  if (sizeStock && !selectedSize) {
    showAddBookingError(mode === 'rent' ? '請先選擇租借尺寸。' : '請先選擇購買尺寸。');
    return;
  }

  if (mode === 'rent') {
    const days = daysBetween(startInput.value, endInput.value);
    if (days <= 0) {
      showAddBookingError('請先選擇有效租借日期。');
      return;
    }
    if (!isSameRentalDateRange(startInput.value, endInput.value)) {
      openDateConflictDialog(startInput.value, endInput.value);
      return;
    }
  }

  performAdd();
});

if (item.id === 'hiking-boots') {
  document.getElementById('bootExtras').style.display = 'block';
}

renderStock();
renderSizeProfileBanner();
renderSizeTool();
renderSizePicker();
renderDifficultyCheck();
updatePrice();
