/* account.html page logic. Loaded last, after icons/data/storage/main/cart/orders/credits. */

/* Must run before this script's own render calls below — DOMContentLoaded (where main.js
   normally triggers seeding) fires only after every script tag has already executed, which
   is too late for account.js's own synchronous renderOrders()/renderCreditsSummary() calls. */
initializePrototypeData();

function orderStatusClass(status) {
  return {
    pending_pickup: 'pending',
    renting: 'renting',
    pending_return_check: 'pending',
    completed: 'done',
    cancelled: 'pending',
    purchased: 'done',
  }[status] || 'pending';
}

function orderItemRowHTML(item) {
  const metaParts = [];
  if (item.mode === 'rent') {
    metaParts.push('租借');
    if (item.selectedSize) metaParts.push(`尺寸 ${item.selectedSize}`);
    if (item.startDate && item.endDate) metaParts.push(`${item.startDate} ~ ${item.endDate}（${item.days} 天）`);
  } else {
    metaParts.push('直接購買');
    if (item.selectedSize) metaParts.push(`尺寸 ${item.selectedSize}`);
  }
  const equipmentLine = item.mode === 'rent' && item.assignedEquipmentId
    ? `<div class="oi-meta">裝備編號：${item.assignedEquipmentId}</div>` : '';
  const creditLine = item.rentToBuyCreditEarned > 0
    ? `<div class="oi-meta" style="color:var(--color-forest-dark)">已產生折抵：${formatCurrency(item.rentToBuyCreditEarned)}</div>` : '';
  const redeemedLine = item.creditRedeemed > 0
    ? `<div class="oi-meta" style="color:var(--color-forest-dark)">已套用折抵：−${formatCurrency(item.creditRedeemed)}</div>` : '';

  return `
    <div class="order-item-row">
      <div class="oi-thumb gear-thumb${item.photo ? ' has-photo' : ''}" data-activity="${item.activity || ''}">${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : svgIcon(item.icon || 'package')}</div>
      <div style="flex:1">
        <div class="oi-title">${item.name || '未知商品'}</div>
        <div class="oi-meta">${metaParts.join(' · ')}</div>
        ${equipmentLine}
        ${creditLine}
        ${redeemedLine}
      </div>
      <div class="sli-price">${formatCurrency(item.lineTotal || 0)}</div>
    </div>
  `;
}

function orderTimelineHTML(order) {
  const status = deriveOrderStatus(order);
  if (status === 'cancelled') return '';
  const { flow, current } = getOrderTimelineStage(order);
  const stages = flow === 'buy' ? BUY_FLOW : RENT_FLOW;
  return `<div class="order-timeline">${stages.map((label, i) => {
    const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
    const dot = state === 'done' ? svgIcon('checkCircle') : `<span class="ot-dot-num">${i + 1}</span>`;
    return `<div class="ot-step ${state}"><div class="ot-dot">${dot}</div><div class="ot-label">${label}</div></div>`;
  }).join('<div class="ot-connector"></div>')}</div>`;
}

function orderCardHTML(order) {
  if (!order || !Array.isArray(order.items)) return '';
  const status = deriveOrderStatus(order);
  const statusLabel = ORDER_STATUS_LABELS[status] || '處理中';
  const fulfillment = order.fulfillment || {};
  const pricing = order.pricing || {};

  const pickupLine = fulfillment.pickupLocation
    ? `${fulfillment.pickupLocation}${fulfillment.pickupTime ? ' ・ ' + fulfillment.pickupTime.label : ''}`
    : null;
  const returnLine = fulfillment.returnLocation
    ? `${fulfillment.returnLocation}${fulfillment.returnTime ? ' ・ ' + fulfillment.returnTime.label : ''}`
    : null;

  const pricingRows = [
    pricing.rentSubtotal > 0 ? `<div class="op-row"><span>租借小計</span><span>${formatCurrency(pricing.rentSubtotal)}</span></div>` : '',
    pricing.purchaseSubtotal > 0 ? `<div class="op-row"><span>購買小計</span><span>${formatCurrency(pricing.purchaseSubtotal)}</span></div>` : '',
    pricing.creditApplied > 0 ? `<div class="op-row"><span>先租後買折抵</span><span>−${formatCurrency(pricing.creditApplied)}</span></div>` : '',
    `<div class="op-row op-total"><span>訂單總額</span><span>${formatCurrency(pricing.total || 0)}</span></div>`,
    pricing.depositAuthorization > 0 ? `<div class="op-row"><span>押金授權</span><span>${formatCurrency(pricing.depositAuthorization)}</span></div>` : '',
  ].join('');

  const showInspectBtn = status === 'pending_return_check';

  return `
    <div class="order-card" id="order-${order.orderId}" data-order-id="${order.orderId}">
      <div class="order-card-head">
        <div>
          <div class="oc-id">訂單編號 ${order.orderId}</div>
          <div class="oc-date">建立時間：${formatDateTimeTW(order.createdAt)}</div>
          ${pickupLine ? `<div class="oc-date">取貨：${pickupLine}</div>` : ''}
          ${returnLine ? `<div class="oc-date">歸還：${returnLine}</div>` : ''}
        </div>
        <span class="status-pill ${orderStatusClass(status)}">${statusLabel}</span>
      </div>

      ${orderTimelineHTML(order)}

      ${order.items.map(orderItemRowHTML).join('')}

      <div class="order-pricing">${pricingRows}</div>

      ${showInspectBtn ? `<button type="button" class="btn btn-forest btn-sm" data-inspect="${order.orderId}" style="margin-top:14px">完成裝備檢查</button>` : ''}
    </div>
  `;
}

function renderOrders() {
  const orders = getOrders().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('ordersEmptyState');
  if (orders.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = orders.map(orderCardHTML).join('');
}

function renderCreditsSummary() {
  const credits = getCredits();
  const panel = document.getElementById('creditsSummaryPanel');
  const gearIds = [...new Set(credits.map((c) => c.gearId))];

  if (gearIds.length === 0) {
    panel.innerHTML = `
      <h2 style="font-size:1.1rem">先租後買折抵</h2>
      <p class="field-hint" style="margin-top:8px">目前沒有可用折抵。完成租借並歸還裝備後，符合資格的租金折抵會顯示在這裡。</p>
    `;
    return;
  }

  const rows = gearIds.map((gearId) => {
    const gearCredits = credits.filter((c) => c.gearId === gearId);
    const remaining = gearCredits.reduce((s, c) => s + c.remainingAmount, 0);
    const gear = getGearById(gearId);
    const sourceIds = [...new Set(gearCredits.map((c) => c.sourceOrderId))].join('、');
    return `
      <div class="credit-summary-row">
        <div>
          <div class="credit-line-title">${gear ? gear.name : gearId}</div>
          <div class="field-hint">來源訂單 ${sourceIds}</div>
        </div>
        <div class="${remaining > 0 ? 'rvb-num' : 'field-hint'}">${remaining > 0 ? formatCurrency(remaining) : '已使用完畢'}</div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `<h2 style="font-size:1.1rem">先租後買折抵</h2><div class="credits-summary-list">${rows}</div>`;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-inspect]');
  if (!btn) return;
  const orderId = btn.dataset.inspect;
  const overlay = showModal(`
    <h2 id="inspectTitle" style="font-size:1.1rem">確認裝備已完成歸還與檢查？</h2>
    <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">完成後將解除押金授權，並將符合資格的租金轉為先租後買折抵。此為作品集示範流程，不是實際門市操作權限。</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="confirmInspect">確認完成</button>
      <button type="button" class="btn btn-ghost btn-block" id="cancelInspect">取消</button>
    </div>
  `, { labelledBy: 'inspectTitle' });
  overlay.querySelector('#confirmInspect').addEventListener('click', () => {
    completeReturnInspection(orderId);
    closeModal();
    renderOrders();
    renderCreditsSummary();
    showToast('裝備檢查已完成，租金折抵已加入帳戶。');
  });
  overlay.querySelector('#cancelInspect').addEventListener('click', () => closeModal());
});

/* ==========================================================================
   View switching (我的訂單 / 我的尺寸紀錄) + "即將推出" placeholders
   ========================================================================== */
const views = document.querySelectorAll('[id^="view-"]');
const sideNavLinks = document.querySelectorAll('.side-nav a[data-view]');

function showView(name) {
  views.forEach((v) => { v.style.display = v.id === `view-${name}` ? 'block' : 'none'; });
  sideNavLinks.forEach((a) => a.classList.toggle('active', a.dataset.view === name));
}

sideNavLinks.forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    showView(a.dataset.view);
    history.replaceState(null, '', `#${a.dataset.view}`);
  });
});

document.querySelectorAll('[data-coming-soon]').forEach((btn) => {
  btn.addEventListener('click', () => showToast('此功能為後續規劃中的示範項目。'));
});

const initialView = location.hash === '#sizes' ? 'sizes' : 'orders';
showView(initialView);

/* ==========================================================================
   Size profile form
   ========================================================================== */
function loadProfileIntoForm() {
  const profile = getSizeProfile();
  if (!profile) return;
  if (profile.height) document.getElementById('profileHeight').value = profile.height;
  if (profile.weight) document.getElementById('profileWeight').value = profile.weight;
  if (profile.shoeSizeEU) document.getElementById('profileShoeSize').value = profile.shoeSizeEU;
  if (profile.footWidth) document.getElementById('profileFootWidth').value = profile.footWidth;
  if (profile.preferredFit) document.getElementById('profileFit').value = profile.preferredFit;
  document.getElementById('profileSavedNote').textContent = `上次儲存時間：${profile.savedAt}`;
}
loadProfileIntoForm();

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  const height = parseFloat(document.getElementById('profileHeight').value) || null;
  const weight = parseFloat(document.getElementById('profileWeight').value) || null;
  const shoeSizeEU = parseFloat(document.getElementById('profileShoeSize').value) || null;
  if (!shoeSizeEU) {
    document.getElementById('profileSavedNote').textContent = '請至少填寫平常鞋碼再儲存。';
    return;
  }
  if (shoeSizeEU < 36 || shoeSizeEU > 45) {
    document.getElementById('profileSavedNote').textContent = '鞋碼請填在 EU 36–45 之間（本站登山鞋提供的範圍）。';
    return;
  }
  const profile = {
    height, weight, shoeSizeEU,
    footWidth: document.getElementById('profileFootWidth').value,
    preferredFit: document.getElementById('profileFit').value,
    savedAt: todayStr(),
  };
  const ok = setSizeProfile(profile);
  document.getElementById('profileSavedNote').textContent = ok
    ? `已儲存（${profile.savedAt}）。之後到登山鞋商品頁會顯示建議試穿尺寸。`
    : '資料暫時無法儲存，請確認瀏覽器沒有停用網站儲存功能。';
  if (ok) showToast('尺寸紀錄已儲存');
});

document.getElementById('resetProfileBtn').addEventListener('click', () => {
  document.getElementById('profileHeight').value = '';
  document.getElementById('profileWeight').value = '';
  document.getElementById('profileShoeSize').value = '';
  document.getElementById('profileFootWidth').value = 'regular';
  document.getElementById('profileFit').value = 'regular';
  document.getElementById('profileSavedNote').textContent = '';
});

/* ==========================================================================
   ?order=ORD-... deep link: scroll to and briefly highlight the matching card
   ========================================================================== */
function highlightOrderFromURL() {
  const orderId = new URLSearchParams(location.search).get('order');
  if (!orderId) return;
  const el = document.getElementById(`order-${orderId}`);
  if (!el) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  el.classList.add('order-highlight');
  setTimeout(() => el.classList.remove('order-highlight'), 2400);
}

renderOrders();
renderCreditsSummary();
highlightOrderFromURL();
