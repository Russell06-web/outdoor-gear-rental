/* account.html page logic. Loaded last, after icons/data/storage/main/cart/orders/credits. */

/* Must run before this script's own render calls below — DOMContentLoaded (where main.js
   normally triggers seeding) fires only after every script tag has already executed, which
   is too late for account.js's own synchronous renderOrders()/renderCreditsSummary() calls. */
initializePrototypeData();

const SHOW_DEMO_KEY = 'ogr_show_demo_v1';
function getShowDemo() {
  const v = safeGetJSON(SHOW_DEMO_KEY, true);
  return v !== false;
}
function setShowDemo(v) {
  safeSetJSON(SHOW_DEMO_KEY, v);
}

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

const NEEDS_ATTENTION_STATUSES = ['pending_pickup', 'renting', 'pending_return_check'];

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
  const hasRent = order.items.some((i) => i.mode === 'rent');

  const actionButtons = [
    `<button type="button" class="btn btn-outline btn-sm" data-view-order="${order.orderId}">查看訂單</button>`,
    `<button type="button" class="btn btn-outline btn-sm" data-coming-soon>修改取貨資訊<span class="coming-soon-tag">即將推出</span></button>`,
    canCancelOrder(order) ? `<button type="button" class="btn btn-outline btn-sm" data-cancel-order="${order.orderId}">取消訂單</button>` : '',
    hasRent ? `<button type="button" class="btn btn-outline btn-sm" data-reorder="${order.orderId}">再次租借</button>` : '',
    `<button type="button" class="btn btn-outline btn-sm" data-buy-again="${order.orderId}">購買同款</button>`,
  ].filter(Boolean).join('');

  return `
    <div class="order-card" id="order-${order.orderId}" data-order-id="${order.orderId}">
      <div class="order-card-head">
        <div>
          <div class="oc-id">訂單編號 ${order.orderId}${order.isDemo ? '<span class="demo-tag">示範訂單</span>' : ''}</div>
          <div class="oc-date">建立時間：${formatDateTimeTW(order.createdAt)}</div>
          ${pickupLine ? `<div class="oc-date">取貨：${pickupLine}</div>` : ''}
          ${returnLine ? `<div class="oc-date">歸還：${returnLine}</div>` : ''}
        </div>
        <span class="status-pill ${orderStatusClass(status)}">${statusLabel}</span>
      </div>

      ${orderTimelineHTML(order)}

      ${order.items.map(orderItemRowHTML).join('')}

      <div class="order-pricing">${pricingRows}</div>

      <div class="order-actions-row">${actionButtons}</div>

      ${showInspectBtn ? `<button type="button" class="btn btn-forest btn-sm" data-inspect="${order.orderId}" style="margin-top:10px">完成裝備檢查</button>` : ''}
    </div>
  `;
}

function renderOrders() {
  const showDemo = getShowDemo();
  const allOrders = getOrders().filter((o) => showDemo || !o.isDemo);
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('ordersEmptyState');

  if (getOrders().length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const sorted = allOrders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const needsAttention = sorted.filter((o) => NEEDS_ATTENTION_STATUSES.includes(deriveOrderStatus(o)));
  const history = sorted.filter((o) => !NEEDS_ATTENTION_STATUSES.includes(deriveOrderStatus(o)));

  const section = (title, orders) => {
    if (orders.length === 0) return '';
    return `
      <div class="order-group">
        <p class="order-group-title">${title}</p>
        ${orders.map(orderCardHTML).join('')}
      </div>
    `;
  };

  list.innerHTML = section('需要處理', needsAttention) + section('歷史訂單', history)
    || `<p class="field-hint">目前隱藏了所有示範訂單，開啟「顯示示範資料」即可查看。</p>`;
}

function renderCreditsSummary() {
  const showDemo = getShowDemo();
  const credits = getCredits().filter((c) => showDemo || !c.isDemo);
  const panel = document.getElementById('creditsSummaryPanel');
  const gearIds = [...new Set(credits.map((c) => c.gearId))];

  if (gearIds.length === 0) {
    panel.innerHTML = `
      <h2 style="font-size:1.1rem">先租後買折抵</h2>
      <p class="field-hint" style="margin-top:8px">目前沒有可用折抵。完成租借並歸還裝備後，符合資格的租金折抵會顯示在這裡。</p>
    `;
    return;
  }

  const totalAvailable = credits.reduce((s, c) => s + c.remainingAmount, 0);
  const availableGearCount = gearIds.filter((id) => credits.some((c) => c.gearId === id && c.remainingAmount > 0)).length;

  const row = (gearId) => {
    const gearCredits = credits.filter((c) => c.gearId === gearId);
    const remaining = gearCredits.reduce((s, c) => s + c.remainingAmount, 0);
    const used = gearCredits.reduce((s, c) => s + (c.usedAmount || 0), 0);
    const gear = getGearById(gearId);
    const sourceIds = [...new Set(gearCredits.map((c) => c.sourceOrderId))].join('、');
    const createdDates = [...new Set(gearCredits.map((c) => formatDateTW(c.createdAt)))].join('、');
    const isDemo = gearCredits.some((c) => c.isDemo);
    return `
      <div class="credit-summary-row">
        <div>
          <div class="credit-line-title">${gear ? gear.name : gearId}${isDemo ? '<span class="demo-tag">示範資料</span>' : ''}</div>
          <div class="field-hint">來源訂單 ${sourceIds} · 建立日期 ${createdDates}</div>
          ${used > 0 ? `<div class="field-hint">已使用 ${formatCurrency(used)}</div>` : ''}
        </div>
        <div class="${remaining > 0 ? 'rvb-num' : 'field-hint'}">${remaining > 0 ? formatCurrency(remaining) : '已使用完畢'}</div>
      </div>
    `;
  };

  const availableIds = gearIds.filter((id) => credits.some((c) => c.gearId === id && c.remainingAmount > 0));
  const exhaustedIds = gearIds.filter((id) => !availableIds.includes(id));

  panel.innerHTML = `
    <h2 style="font-size:1.1rem">先租後買折抵</h2>
    <div class="credit-headline-row">
      <div><div class="credit-headline-num">${formatCurrency(totalAvailable)}</div><div class="field-hint">可用租金折抵</div></div>
      <div><div class="credit-headline-num">${availableGearCount}</div><div class="field-hint">可用商品</div></div>
    </div>
    ${availableIds.length ? `<div class="credits-summary-list">${availableIds.map(row).join('')}</div>` : ''}
    ${exhaustedIds.length ? `
      <details class="credit-history">
        <summary>折抵歷史（${exhaustedIds.length}）</summary>
        <div class="credits-summary-list">${exhaustedIds.map(row).join('')}</div>
      </details>
    ` : ''}
  `;
}

/* ==========================================================================
   Order quick actions
   ========================================================================== */
function openOrderDetailModal(order) {
  const c = order.customer || {};
  const f = order.fulfillment || {};
  const overlay = showModal(`
    <h2 id="orderDetailTitle" style="font-size:1.15rem">訂單詳情</h2>
    <div class="review-box" style="margin-top:14px">
      <div class="review-row"><span>訂單編號</span><span>${order.orderId}</span></div>
      <div class="review-row"><span>聯絡人</span><span>${c.name || '—'}</span></div>
      <div class="review-row"><span>手機</span><span>${c.phone || '—'}</span></div>
      <div class="review-row"><span>電子信箱</span><span>${c.email || '—'}</span></div>
      <div class="review-row"><span>取貨地點</span><span>${f.pickupLocation || '—'}</span></div>
      <div class="review-row"><span>取貨時段</span><span>${f.pickupTime?.label || '—'}</span></div>
      ${f.returnLocation ? `<div class="review-row"><span>歸還地點</span><span>${f.returnLocation}</span></div>` : ''}
      ${f.returnTime ? `<div class="review-row"><span>歸還時段</span><span>${f.returnTime.label}</span></div>` : ''}
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost btn-block" id="orderDetailClose">關閉</button>
    </div>
  `, { labelledBy: 'orderDetailTitle' });
  overlay.querySelector('#orderDetailClose').addEventListener('click', () => closeModal());
}

function reorderRentItems(order) {
  const rentItems = order.items.filter((i) => i.mode === 'rent');
  if (rentItems.length === 0) return;

  const existingRange = getCartRentalDateRange();
  const start = existingRange ? existingRange.startDate : todayStr(3);
  const end = existingRange ? existingRange.endDate : todayStr(6);
  const days = daysBetween(start, end) || 3;

  rentItems.forEach((item) => {
    const gear = getGearById(item.gearId);
    if (!gear) return;
    addToCart({
      gearId: gear.id, name: gear.name, icon: gear.icon, photo: gear.photo || null, activity: gear.activity,
      mode: 'rent', selectedSize: item.selectedSize || null, recommendedSize: null,
      quantity: item.quantity || 1, startDate: start, endDate: end, days,
      unitPrice: gear.rentPricePerDay, lineTotal: gear.rentPricePerDay * days * (item.quantity || 1),
    });
  });
  updateCartBadge();
  showToast(existingRange
    ? '已加入預約清單，並沿用購物車目前的租借日期。'
    : '已加入預約清單，請至結帳頁確認日期。');
}

function buyAgainFromOrder(order) {
  order.items.forEach((item) => {
    const gear = getGearById(item.gearId);
    if (!gear) return;
    addToCart({
      gearId: gear.id, name: gear.name, icon: gear.icon, photo: gear.photo || null, activity: gear.activity,
      mode: 'buy', selectedSize: null, recommendedSize: null, quantity: 1,
      startDate: null, endDate: null, days: 0,
      unitPrice: gear.buyPrice, lineTotal: gear.buyPrice,
    });
  });
  updateCartBadge();
  showToast('已將同款商品加入購物車（購買）。');
}

document.addEventListener('click', (e) => {
  const inspectBtn = e.target.closest('[data-inspect]');
  if (inspectBtn) {
    const orderId = inspectBtn.dataset.inspect;
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
    return;
  }

  const viewBtn = e.target.closest('[data-view-order]');
  if (viewBtn) {
    const order = getOrderById(viewBtn.dataset.viewOrder);
    if (order) openOrderDetailModal(order);
    return;
  }

  const cancelBtn = e.target.closest('[data-cancel-order]');
  if (cancelBtn) {
    const orderId = cancelBtn.dataset.cancelOrder;
    const overlay = showModal(`
      <h2 id="cancelOrderTitle" style="font-size:1.1rem">確定要取消這筆訂單嗎？</h2>
      <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">取消後無法復原，依規則可能有退款比例限制，實際退款以完整租借規範為準。</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary btn-block" id="confirmCancelOrder">確認取消訂單</button>
        <button type="button" class="btn btn-ghost btn-block" id="dismissCancelOrder">保留訂單</button>
      </div>
    `, { labelledBy: 'cancelOrderTitle' });
    overlay.querySelector('#confirmCancelOrder').addEventListener('click', () => {
      cancelOrder(orderId);
      closeModal();
      renderOrders();
      showToast('訂單已取消。');
    });
    overlay.querySelector('#dismissCancelOrder').addEventListener('click', () => closeModal());
    return;
  }

  const reorderBtn = e.target.closest('[data-reorder]');
  if (reorderBtn) {
    const order = getOrderById(reorderBtn.dataset.reorder);
    if (order) reorderRentItems(order);
    return;
  }

  const buyAgainBtn = e.target.closest('[data-buy-again]');
  if (buyAgainBtn) {
    const order = getOrderById(buyAgainBtn.dataset.buyAgain);
    if (order) buyAgainFromOrder(order);
    return;
  }
});

/* ==========================================================================
   Demo-data management — show/hide, clear user-created data, full reset.
   ========================================================================== */
function updateDemoToggleLabel() {
  const btn = document.getElementById('toggleDemoBtn');
  if (!btn) return;
  btn.textContent = getShowDemo() ? '隱藏示範資料' : '顯示示範資料';
}

document.getElementById('toggleDemoBtn').addEventListener('click', () => {
  setShowDemo(!getShowDemo());
  updateDemoToggleLabel();
  renderOrders();
  renderCreditsSummary();
});

document.getElementById('clearUserDataBtn').addEventListener('click', () => {
  const overlay = showModal(`
    <h2 id="clearUserTitle" style="font-size:1.1rem">清除我的操作資料？</h2>
    <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">會清除你自己建立的訂單、折抵與購物車內容，示範資料會保留。此操作無法復原。</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="confirmClearUser">確認清除</button>
      <button type="button" class="btn btn-ghost btn-block" id="cancelClearUser">取消</button>
    </div>
  `, { labelledBy: 'clearUserTitle' });
  overlay.querySelector('#confirmClearUser').addEventListener('click', () => {
    saveOrders(getOrders().filter((o) => o.isDemo));
    saveCredits(getCredits().filter((c) => c.isDemo));
    setCart([]);
    closeModal();
    renderOrders();
    renderCreditsSummary();
    updateCartBadge();
    showToast('已清除你自己的操作資料，示範資料已保留。');
  });
  overlay.querySelector('#cancelClearUser').addEventListener('click', () => closeModal());
});

document.getElementById('resetPrototypeBtn').addEventListener('click', () => {
  const overlay = showModal(`
    <h2 id="resetTitle" style="font-size:1.1rem">重設作品原型？</h2>
    <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">會清除所有資料（包含示範資料）並重新產生初始示範內容，此操作無法復原。</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="confirmReset">確認重設</button>
      <button type="button" class="btn btn-ghost btn-block" id="cancelReset">取消</button>
    </div>
  `, { labelledBy: 'resetTitle' });
  overlay.querySelector('#confirmReset').addEventListener('click', () => {
    /* Hardcoded rather than referencing COMPARE_KEY/FITTING_BOOKING_KEY — those constants
       live in compare.js/fitting.js, which account.html doesn't otherwise need to load. */
    [CART_KEY, ORDERS_KEY, CREDITS_KEY, SIZE_PROFILE_KEY, CHECKLIST_KEY, 'ogr_compare_v1', 'ogr_fitting_bookings_v1', SHOW_DEMO_KEY]
      .forEach((k) => localStorage.removeItem(k));
    location.reload();
  });
  overlay.querySelector('#cancelReset').addEventListener('click', () => closeModal());
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

updateDemoToggleLabel();
renderOrders();
renderCreditsSummary();
highlightOrderFromURL();
