/* checkout.html page logic. Loaded last, after icons/data/storage/main/cart/orders/credits. */

/* Must run before renderAll() at the bottom of this file — see the same note in account.js. */
initializePrototypeData();

const TIME_SLOT_MAP = {
  '09:00-12:00': { value: '09:00-12:00', label: '上午 09:00–12:00' },
  '13:00-17:00': { value: '13:00-17:00', label: '下午 13:00–17:00' },
  '17:00-19:00': { value: '17:00-19:00', label: '傍晚 17:00–19:00' },
};

const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const customerEmail = document.getElementById('customerEmail');
const pickupLocationSelect = document.getElementById('pickupLocation');
const returnLocationSelect = document.getElementById('returnLocation');
const returnFieldsWrap = document.getElementById('returnFieldsWrap');
const agreeCheckbox = document.getElementById('agreeCheckbox');
const confirmBtn = document.getElementById('confirmBtn');

/* lineId -> { gearId, amount } — kept across re-renders so checked boxes survive redraws. */
const selectedCreditByLineId = {};
let isSubmitting = false;

function getCheckedRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function setupRadioGroup(groupId) {
  document.getElementById(groupId).querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      document.querySelectorAll(`#${groupId} .radio-card`).forEach((card) => card.classList.remove('selected'));
      input.closest('.radio-card').classList.add('selected');
      renderAll();
    });
  });
}
setupRadioGroup('pickupTimeGroup');
setupRadioGroup('returnTimeGroup');

[customerName, customerPhone, customerEmail, pickupLocationSelect, returnLocationSelect].forEach((el) => {
  el.addEventListener('input', renderReviewOnly);
  el.addEventListener('change', renderReviewOnly);
});

function getCheckoutPageTitle(cart) {
  const hasRent = cart.some((l) => l.mode === 'rent');
  const hasBuy = cart.some((l) => l.mode === 'buy');
  if (hasRent && hasBuy) return '確認訂單';
  if (hasRent) return '確認預約';
  return '確認購買';
}

function thumbHTML(line) {
  const gear = getGearById(line.gearId);
  return gear && gear.photo
    ? `<img src="${gear.photo}" alt="${line.name}">`
    : svgIcon(line.icon);
}

function lineItemHTML(line) {
  const gear = getGearById(line.gearId);
  const activity = getActivityById(line.activity);
  let meta;
  if (line.selectedSize) {
    meta = line.mode === 'rent'
      ? `租借 · EU ${line.selectedSize} · ${line.startDate}～${line.endDate} · ${line.days} 天`
      : `直接購買 · EU ${line.selectedSize}`;
  } else {
    meta = line.mode === 'rent'
      ? `租借 · ${line.startDate} ~ ${line.endDate}（${line.days} 天）`
      : `直接購買`;
  }
  return `
    <div class="summary-line-item">
      <div class="sli-thumb gear-thumb${gear && gear.photo ? ' has-photo' : ''}" data-activity="${line.activity}">${thumbHTML(line)}</div>
      <div class="sli-body">
        <div class="sli-title">${line.name}</div>
        <div class="sli-meta">${activity ? activity.name + ' · ' : ''}${meta}</div>
      </div>
      <div class="sli-price">${formatCurrency(line.lineTotal)}</div>
    </div>
  `;
}

function checkoutItemRowHTML(line) {
  const gear = getGearById(line.gearId);
  const baseMeta = line.mode === 'rent'
    ? `租借區間：${line.startDate} ~ ${line.endDate}（${line.days} 天 × ${formatCurrency(line.unitPrice)}）`
    : '模式：直接購買';
  const meta = line.selectedSize ? `尺寸：EU ${line.selectedSize} ・ ${baseMeta}` : baseMeta;
  return `
    <div class="order-item-row">
      <div class="oi-thumb gear-thumb${gear && gear.photo ? ' has-photo' : ''}" data-activity="${line.activity}">${thumbHTML(line)}</div>
      <div style="flex:1">
        <div class="oi-title">${line.name}</div>
        <div class="oi-meta">${meta}</div>
      </div>
      <div style="text-align:right">
        <div class="sli-price">${formatCurrency(line.lineTotal)}</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px" data-remove="${line.lineId}" type="button">移除</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Compatibility warnings (unchanged behaviour from the previous round)
   ========================================================================== */
const dismissedWarnings = new Set();

function computeCompatWarnings(cart) {
  const gearIds = cart.map((l) => l.gearId);
  const has = (id) => gearIds.includes(id);
  const warnings = [];

  const bootsLine = cart.find((l) => l.gearId === 'hiking-boots');
  if (bootsLine && !bootsLine.selectedSize) {
    warnings.push({ id: 'boots-no-size', text: '中筒防水登山鞋尚未選擇尺寸，請回商品頁選擇後再送出預約。', href: 'product.html?id=hiking-boots' });
  }
  if ((has('sup-board') || has('snorkel-set')) && !has('life-vest')) {
    warnings.push({ id: 'water-no-vest', text: '你加入了水上活動裝備，但預約清單中還沒有救生衣，建議一併加入以確保安全。', href: 'product.html?id=life-vest' });
  }
  if (has('backpack-60l') && !has('headlamp')) {
    warnings.push({ id: 'multiday-no-headlamp', text: '你的活動設定為多日重裝，但目前尚未加入頭燈，建議一併加入。', href: 'product.html?id=headlamp' });
  }
  const checklist = getChecklistState();
  if (checklist && checklist.activityId === 'camping' && checklist.answers && checklist.answers.people > 2) {
    const tentCount = cart.filter((l) => l.gearId === 'tent-2p').length;
    if (tentCount === 1) {
      warnings.push({ id: 'tent-capacity', text: `你在裝備清單中設定為 ${checklist.answers.people} 人，但目前只有一頂兩人帳，建議加租一頂或確認實際過夜人數。`, href: 'product.html?id=tent-2p' });
    }
  }
  return warnings.filter((w) => !dismissedWarnings.has(w.id));
}

function renderCompatWarnings(cart) {
  const panel = document.getElementById('compatPanel');
  const warnings = computeCompatWarnings(cart);
  if (warnings.length === 0) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  document.getElementById('compatWarnings').innerHTML = warnings.map((w) => `
    <div class="policy-banner tone-warning" style="margin-top:12px">
      <div class="pb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg></div>
      <div>
        <p>${w.text}</p>
        <div class="cta-row" style="margin-top:10px">
          <a href="${w.href}" class="btn btn-outline btn-sm">查看建議裝備</a>
          <button type="button" class="btn btn-ghost btn-sm" data-dismiss-warning="${w.id}">忽略此提醒</button>
        </div>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-dismiss-warning]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dismissedWarnings.add(btn.dataset.dismissWarning);
      renderCompatWarnings(getCart());
    });
  });
}

/* ==========================================================================
   Rent-to-buy credit redemption
   ========================================================================== */
function maxApplicableForLine(line, cart) {
  const gear = getGearById(line.gearId);
  if (!gear) return 0;
  const totalAvailable = getAvailableCreditForGear(line.gearId);
  const allocatedElsewhere = cart
    .filter((l) => l.gearId === line.gearId && l.lineId !== line.lineId && selectedCreditByLineId[l.lineId])
    .reduce((sum, l) => sum + (selectedCreditByLineId[l.lineId]?.amount || 0), 0);
  const remainingPool = Math.max(0, totalAvailable - allocatedElsewhere);
  const priceCap = Math.round(gear.buyPrice * RENT_TO_BUY_CAP_RATIO);
  return Math.min(remainingPool, priceCap);
}

function renderCredits(cart) {
  const buyLines = cart.filter((l) => l.mode === 'buy' && getAvailableCreditForGear(l.gearId) > 0);
  const panel = document.getElementById('creditsPanel');
  if (buyLines.length === 0) {
    panel.style.display = 'none';
    // drop any stale selections for lines no longer eligible
    Object.keys(selectedCreditByLineId).forEach((lineId) => {
      if (!buyLines.some((l) => l.lineId === lineId)) delete selectedCreditByLineId[lineId];
    });
    return;
  }
  panel.style.display = 'block';

  document.getElementById('creditsList').innerHTML = buyLines.map((line) => {
    const gear = getGearById(line.gearId);
    const applicable = maxApplicableForLine(line, cart);
    const checked = !!selectedCreditByLineId[line.lineId];
    const amount = checked ? selectedCreditByLineId[line.lineId].amount : applicable;
    return `
      <div class="credit-line">
        <div>
          <div class="credit-line-title">${gear.name}</div>
          <p class="field-hint">你目前有 ${formatCurrency(getAvailableCreditForGear(line.gearId))} 可用折抵，本次最高可折抵 ${formatCurrency(applicable)}。</p>
        </div>
        <label class="checkbox-row" style="margin-top:6px">
          <input type="checkbox" data-credit-line="${line.lineId}" data-credit-gear="${line.gearId}" data-credit-amount="${applicable}" ${applicable <= 0 ? 'disabled' : ''} ${checked ? 'checked' : ''}>
          <span>套用 ${formatCurrency(amount)} 租金折抵</span>
        </label>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-credit-line]').forEach((input) => {
    input.addEventListener('change', () => {
      const lineId = input.dataset.creditLine;
      if (input.checked) {
        const line = cart.find((l) => l.lineId === lineId);
        selectedCreditByLineId[lineId] = { gearId: input.dataset.creditGear, amount: maxApplicableForLine(line, cart) };
      } else {
        delete selectedCreditByLineId[lineId];
      }
      renderAll();
    });
  });
}

/* ==========================================================================
   Pricing (single source of truth)
   ========================================================================== */
function calculateCheckoutPricing(cart, creditSelections) {
  const rentSubtotal = cart.filter((l) => l.mode === 'rent').reduce((s, l) => s + l.lineTotal, 0);
  const purchaseSubtotal = cart.filter((l) => l.mode === 'buy').reduce((s, l) => s + l.lineTotal, 0);
  const creditApplied = Object.values(creditSelections).reduce((s, c) => s + (c?.amount || 0), 0);
  const depositAuthorization = cart
    .filter((l) => l.mode === 'rent')
    .reduce((s, l) => {
      const gear = getGearById(l.gearId);
      return s + (gear ? Math.round(gear.buyPrice * 0.3) : 0);
    }, 0);
  const total = Math.max(0, rentSubtotal + purchaseSubtotal - creditApplied);
  return { rentSubtotal, purchaseSubtotal, creditApplied, depositAuthorization, total };
}

function renderSummary(cart) {
  document.getElementById('summaryLineItems').innerHTML = cart.map(lineItemHTML).join('');
  const pricing = calculateCheckoutPricing(cart, selectedCreditByLineId);

  document.getElementById('summaryTotals').innerHTML = `
    ${pricing.rentSubtotal > 0 ? `<div class="st-row"><span>租借小計</span><span>${formatCurrency(pricing.rentSubtotal)}</span></div>` : ''}
    ${pricing.purchaseSubtotal > 0 ? `<div class="st-row"><span>購買小計</span><span>${formatCurrency(pricing.purchaseSubtotal)}</span></div>` : ''}
    ${pricing.creditApplied > 0 ? `<div class="st-row"><span>先租後買折抵</span><span class="st-discount">−${formatCurrency(pricing.creditApplied)}</span></div>` : ''}
    <div class="st-row grand"><span>今日應付</span><span class="st-num">${formatCurrency(pricing.total)}</span></div>
  `;

  const note = document.getElementById('depositNote');
  if (pricing.depositAuthorization > 0) {
    note.style.display = 'block';
    note.innerHTML = `<strong>押金授權：</strong>${formatCurrency(pricing.depositAuthorization)}。歸還完成並確認無損壞後解除授權，不會立即請款。`;
  } else {
    note.style.display = 'none';
  }
}

function renderReviewOnly() {
  const cart = getCart();
  const hasRent = cart.some((l) => l.mode === 'rent');
  const name = customerName.value.trim() || '（尚未填寫）';
  const phone = customerPhone.value.trim() || '（尚未填寫）';
  const email = customerEmail.value.trim() || '（尚未填寫）';
  const pickupLoc = pickupLocationSelect.value || '（尚未選擇）';
  const pickupTimeVal = getCheckedRadioValue('pickupTime');
  const pickupTimeLabel = TIME_SLOT_MAP[pickupTimeVal]?.label || '（尚未選擇）';

  let html = `
    <div class="review-row"><span>聯絡人</span><span>${name}</span></div>
    <div class="review-row"><span>手機</span><span>${phone}</span></div>
    <div class="review-row"><span>電子信箱</span><span>${email}</span></div>
    <div class="review-row"><span>取貨</span><span>${pickupLoc}・${pickupTimeLabel}</span></div>
  `;
  if (hasRent) {
    const returnRaw = returnLocationSelect.value;
    const returnLoc = returnRaw === 'same' || !returnRaw ? pickupLoc : returnRaw;
    const returnTimeVal = getCheckedRadioValue('returnTime');
    const returnTimeLabel = TIME_SLOT_MAP[returnTimeVal]?.label || '（尚未選擇）';
    const range = getCartRentalDateRange(cart);
    html += `
      <div class="review-row"><span>歸還</span><span>${returnLoc}・${returnTimeLabel}</span></div>
      <div class="review-row"><span>租借期間</span><span>${range ? `${formatDateTW(range.startDate)}～${formatDateTW(range.endDate)}` : '—'}</span></div>
    `;
  }
  document.getElementById('reviewContent').innerHTML = html;
}

/* ==========================================================================
   Validation
   ========================================================================== */
function clearAllFieldErrors() {
  document.querySelectorAll('.form-error').forEach((el) => { el.textContent = ''; el.style.display = 'none'; });
}

function validateCheckout(cart) {
  const errors = [];
  if (cart.length === 0) errors.push({ field: 'general', message: '購物車是空的，請先加入裝備。' });

  if (customerName.value.trim().length < 2) errors.push({ field: 'customerName', message: '請輸入聯絡人姓名。' });

  const phoneNormalized = customerPhone.value.replace(/[\s-]/g, '');
  if (!/^09\d{8}$/.test(phoneNormalized)) errors.push({ field: 'customerPhone', message: '請輸入有效的台灣手機號碼，例如 0912-345-678。' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value.trim())) {
    errors.push({ field: 'customerEmail', message: '請輸入有效的電子信箱。' });
  }

  if (!pickupLocationSelect.value) errors.push({ field: 'pickupLocation', message: '請選擇取貨地點。' });
  if (!getCheckedRadioValue('pickupTime')) errors.push({ field: 'pickupTime', message: '請選擇取貨時段。' });

  const hasRent = cart.some((l) => l.mode === 'rent');
  if (hasRent) {
    if (!returnLocationSelect.value) errors.push({ field: 'returnLocation', message: '請選擇歸還地點。' });
    if (!getCheckedRadioValue('returnTime')) errors.push({ field: 'returnTime', message: '請選擇歸還時段。' });
  }

  cart.forEach((line) => {
    const gear = getGearById(line.gearId);
    if (gear && getSizeStockForMode(gear, line.mode) && !line.selectedSize) {
      errors.push({ field: 'general', message: `${line.name} 尚未選擇尺寸，請回商品頁選擇。` });
    }
  });

  const rentLines = cart.filter((l) => l.mode === 'rent');
  if (rentLines.length > 0) {
    const first = rentLines[0];
    if (rentLines.some((l) => l.startDate !== first.startDate || l.endDate !== first.endDate)) {
      errors.push({ field: 'general', message: '租借商品的日期不一致，請回商品頁重新確認。' });
    }
    if (rentLines.some((l) => daysBetween(l.startDate, l.endDate) <= 0)) {
      errors.push({ field: 'general', message: '租借日期無效，請重新選擇。' });
    }
  }

  if (!agreeCheckbox.checked) errors.push({ field: 'agree', message: '請先閱讀並同意租借、損壞與取消規則。' });

  const pricing = calculateCheckoutPricing(cart, selectedCreditByLineId);
  if (pricing.creditApplied < 0 || pricing.total < 0) {
    errors.push({ field: 'general', message: '折抵金額計算異常，請重新確認。' });
  }

  return errors;
}

function showErrors(errors) {
  clearAllFieldErrors();
  const generalMessages = [];
  let firstField = null;
  errors.forEach((err) => {
    if (err.field === 'general') {
      generalMessages.push(err.message);
      return;
    }
    const target = document.getElementById(`err-${err.field}`);
    if (target) {
      target.textContent = err.message;
      target.style.display = 'block';
    }
    if (!firstField) firstField = err.field;
  });
  if (generalMessages.length) {
    const el = document.getElementById('err-general');
    el.textContent = generalMessages.join(' ');
    el.style.display = 'block';
    if (!firstField) firstField = 'general';
  }
  return firstField;
}

function focusField(fieldId) {
  const map = {
    customerName: () => customerName,
    customerPhone: () => customerPhone,
    customerEmail: () => customerEmail,
    pickupLocation: () => pickupLocationSelect,
    pickupTime: () => document.querySelector('#pickupTimeGroup input'),
    returnLocation: () => returnLocationSelect,
    returnTime: () => document.querySelector('#returnTimeGroup input'),
    agree: () => agreeCheckbox,
    general: () => document.getElementById('err-general'),
  };
  const el = map[fieldId] ? map[fieldId]() : null;
  if (el) {
    el.focus();
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }
}

/* ==========================================================================
   Main render
   ========================================================================== */
function renderAll() {
  const cart = getCart();
  const withItems = document.getElementById('checkoutWithItems');
  const emptyState = document.getElementById('checkoutEmptyState');

  if (cart.length === 0) {
    withItems.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  withItems.style.display = 'block';
  emptyState.style.display = 'none';

  const title = getCheckoutPageTitle(cart);
  document.getElementById('pageTitle').textContent = `${title}｜GearLoop`;
  document.getElementById('pageHeading').textContent = title;
  document.getElementById('itemsPanelHeading').textContent = cart.some((l) => l.mode === 'rent') && cart.some((l) => l.mode === 'buy')
    ? '商品確認'
    : (cart.every((l) => l.mode === 'buy') ? '購買商品確認' : '租借商品確認');

  const hasRent = cart.some((l) => l.mode === 'rent');
  returnFieldsWrap.style.display = hasRent ? 'block' : 'none';

  renderCompatWarnings(cart);
  document.getElementById('checkoutItemList').innerHTML = cart.map(checkoutItemRowHTML).join('');
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      delete selectedCreditByLineId[btn.dataset.remove];
      removeFromCart(btn.dataset.remove);
      renderAll();
    });
  });

  renderCredits(cart);
  renderSummary(cart);
  renderReviewOnly();
}

confirmBtn.addEventListener('click', () => {
  if (isSubmitting) return;
  const cart = getCart();
  const errors = validateCheckout(cart);
  if (errors.length > 0) {
    const firstField = showErrors(errors);
    if (firstField) focusField(firstField);
    return;
  }

  clearAllFieldErrors();
  isSubmitting = true;
  confirmBtn.disabled = true;
  confirmBtn.textContent = '正在建立訂單…';

  try {
    const pricing = calculateCheckoutPricing(cart, selectedCreditByLineId);
    const hasRent = cart.some((l) => l.mode === 'rent');
    const pickupTimeVal = getCheckedRadioValue('pickupTime');
    const returnTimeVal = hasRent ? getCheckedRadioValue('returnTime') : null;
    const pickupLoc = pickupLocationSelect.value;
    const returnRaw = returnLocationSelect.value;

    const items = cart.map((line) => ({
      ...line,
      assignedEquipmentId: line.mode === 'rent' ? '待門市配貨' : null,
      rentToBuyCreditEarned: 0,
      creditGenerated: false,
      creditRedeemed: selectedCreditByLineId[line.lineId] ? selectedCreditByLineId[line.lineId].amount : 0,
    }));

    const order = {
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: null,
      customer: {
        name: customerName.value.trim(),
        phone: customerPhone.value.trim(),
        email: customerEmail.value.trim(),
      },
      fulfillment: {
        pickupLocation: pickupLoc,
        returnLocation: hasRent ? (returnRaw === 'same' ? pickupLoc : returnRaw) : null,
        pickupTime: TIME_SLOT_MAP[pickupTimeVal] || null,
        returnTime: hasRent ? (TIME_SLOT_MAP[returnTimeVal] || null) : null,
      },
      items,
      pricing,
      agreementAccepted: true,
    };

    const saved = addOrder(order);
    if (!saved) {
      throw new Error('STORAGE_WRITE_FAILED');
    }

    Object.values(selectedCreditByLineId).forEach((sel) => {
      applyCreditsToPurchase(sel.gearId, sel.amount);
    });

    setCart([]);
    showSuccessState(order);
  } catch (e) {
    console.error(e);
    isSubmitting = false;
    confirmBtn.disabled = false;
    confirmBtn.textContent = '送出預約';
    const el = document.getElementById('err-general');
    el.textContent = e.message === 'STORAGE_WRITE_FAILED'
      ? '資料暫時無法儲存，請確認瀏覽器沒有停用網站儲存功能。'
      : '目前無法建立訂單，請確認資料後再試一次。';
    el.style.display = 'block';
  }
});

function showSuccessState(order) {
  document.getElementById('checkoutWithItems').style.display = 'none';
  document.getElementById('checkoutEmptyState').style.display = 'none';
  const box = document.getElementById('checkoutSuccessState');
  const hasRent = order.items.some((i) => i.mode === 'rent');
  const range = getOrderRentDateRange(order);
  const creditApplied = order.pricing.creditApplied;

  box.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/></svg>
    <h2 style="font-size:1.3rem; margin-top:14px; color:var(--color-text)">訂單已成立</h2>
    <div class="success-summary">
      <div class="review-row"><span>訂單編號</span><span>${order.orderId}</span></div>
      <div class="review-row"><span>聯絡人</span><span>${order.customer.name}</span></div>
      <div class="review-row"><span>取貨地點</span><span>${order.fulfillment.pickupLocation}</span></div>
      <div class="review-row"><span>取貨時間</span><span>${hasRent && range ? `${formatDateTW(range.startDate)}・` : ''}${order.fulfillment.pickupTime?.label || ''}${!hasRent ? '（依訂單成立後門市通知安排）' : ''}</span></div>
      ${hasRent ? `
        <div class="review-row"><span>歸還地點</span><span>${order.fulfillment.returnLocation}</span></div>
        <div class="review-row"><span>歸還時間</span><span>${range ? `${formatDateTW(range.endDate)}・` : ''}${order.fulfillment.returnTime?.label || ''}</span></div>
      ` : ''}
      ${creditApplied > 0 ? `<div class="review-row"><span>已套用先租後買折抵</span><span>−${formatCurrency(creditApplied)}</span></div>` : ''}
      <div class="review-row grand"><span>訂單金額</span><span>${formatCurrency(order.pricing.total)}</span></div>
    </div>
    <div class="cta-row" style="margin-top:20px; justify-content:center; flex-wrap:wrap">
      <a href="account.html?order=${order.orderId}" class="btn btn-forest">查看我的訂單</a>
      <a href="gear-list.html" class="btn btn-outline">繼續瀏覽裝備</a>
    </div>
  `;
  box.style.display = 'block';
}

renderAll();
