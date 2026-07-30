/* Starter-kit bundle rendering + "add whole kit to cart" flow.
   Loaded after credits.js (needs getGearById/calcKitPricing/addToCart/showModal). */

function buildKitCartLine(gear, quantity, startDate, endDate) {
  const days = daysBetween(startDate, endDate);
  return {
    gearId: gear.id,
    name: gear.name,
    icon: gear.icon,
    photo: gear.photo || null,
    activity: gear.activity,
    mode: 'rent',
    selectedSize: null,
    recommendedSize: null,
    quantity,
    startDate,
    endDate,
    days,
    unitPrice: gear.rentPricePerDay,
    lineTotal: gear.rentPricePerDay * days * quantity,
  };
}

/* Checks every kit line's date-based rental availability before adding.
   Returns the first shortfall found ({ gear, available }), or null if the
   whole kit fits. Kit items never have a per-size stock pool, so size is
   always omitted (getAvailableRentalStock falls back to the flat gear.stock). */
function findKitStockShortage(kit, people, startDate, endDate) {
  const pricing = calcKitPricing(kit, people);
  for (const line of pricing.lines) {
    const available = getAvailableRentalStock({ gearId: line.gear.id, startDate, endDate });
    if (available < line.quantity) {
      return { gear: line.gear, available };
    }
  }
  return null;
}

function addKitToCart(kit, people, startDate, endDate) {
  const pricing = calcKitPricing(kit, people);
  let allOk = true;
  pricing.lines.forEach((l) => {
    const ok = addToCart(buildKitCartLine(l.gear, l.quantity, startDate, endDate));
    if (!ok) allOk = false;
  });
  updateCartBadge();
  showToast(allOk
    ? `已將「${kit.name}」整組加入預約清單`
    : '資料暫時無法儲存，請確認瀏覽器沒有停用網站儲存功能。');
}

function kitCardHTML(kit) {
  const pricing = calcKitPricing(kit, kit.defaultPeople);
  const itemRows = pricing.lines
    .map((l) => `<li>${l.gear.name}${l.quantity > 1 ? ` × ${l.quantity}` : ''}</li>`)
    .join('');
  return `
    <div class="kit-card">
      <h3>${kit.name}</h3>
      <p class="kit-scenario">${kit.scenario}</p>
      <div class="kit-meta">
        <span>建議人數 ${kit.defaultPeople} 人</span>
        <span>建議天數 ${kit.days} 天</span>
      </div>
      <details class="kit-items">
        <summary>查看套餐內容（${kit.items.length} 項裝備）</summary>
        <ul>${itemRows}</ul>
      </details>
      <div class="kit-pricing">
        <div class="kit-price-row"><span>單租總額</span><span class="kit-strike">${formatCurrency(pricing.rawTotal)}</span></div>
        <div class="kit-price-row kit-price-main"><span>套餐租金</span><span>${formatCurrency(pricing.kitPrice)}</span></div>
        <div class="kit-savings">現省 ${formatCurrency(pricing.savings)}</div>
      </div>
      <button type="button" class="btn btn-primary btn-block" data-kit-add="${kit.id}">整組加入預約清單</button>
    </div>
  `;
}

function renderKitSection(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = STARTER_KITS.map(kitCardHTML).join('');
  el.querySelectorAll('[data-kit-add]').forEach((btn) => {
    btn.addEventListener('click', () => openKitModal(getKitById(btn.dataset.kitAdd)));
  });
}

function kitModalPreviewHTML(kit, people) {
  const pricing = calcKitPricing(kit, people);
  const rows = pricing.lines
    .map((l) => `<div class="kit-preview-row"><span>${l.gear.name}${l.quantity > 1 ? ` × ${l.quantity}` : ''}</span><span>${formatCurrency(l.lineTotal)}</span></div>`)
    .join('');
  return `
    <div class="kit-preview">
      ${rows}
      <div class="kit-preview-row kit-preview-total"><span>套餐租金</span><span>${formatCurrency(pricing.kitPrice)}</span></div>
    </div>
  `;
}

function openKitModal(kit) {
  const start = todayStr(3);
  const end = todayStr(3 + kit.days);

  const overlay = showModal(`
    <h2 id="kitModalTitle" style="font-size:1.15rem">${kit.name}</h2>
    <p class="field-hint" style="margin-top:6px">${kit.scenario}</p>
    <div class="kit-modal-field">
      <label for="kitPeopleInput">本次人數</label>
      <input type="number" id="kitPeopleInput" class="input" min="1" max="8" value="${kit.defaultPeople}">
    </div>
    <div class="kit-modal-field-row">
      <div class="kit-modal-field">
        <label for="kitStartDate">取貨日</label>
        <input type="date" id="kitStartDate" class="input" value="${start}" min="${todayStr()}">
      </div>
      <div class="kit-modal-field">
        <label for="kitEndDate">歸還日</label>
        <input type="date" id="kitEndDate" class="input" value="${end}">
      </div>
    </div>
    <div id="kitModalPreview" aria-live="polite"></div>
    <p class="form-error" id="kitModalError" role="alert" style="display:none"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="kitConfirmBtn">加入預約清單</button>
      <button type="button" class="btn btn-ghost btn-block" id="kitCancelBtn">取消</button>
    </div>
  `, { labelledBy: 'kitModalTitle' });

  const peopleInput = overlay.querySelector('#kitPeopleInput');
  const startInput = overlay.querySelector('#kitStartDate');
  const endInput = overlay.querySelector('#kitEndDate');
  const preview = overlay.querySelector('#kitModalPreview');
  const errorEl = overlay.querySelector('#kitModalError');

  function currentPeople() {
    return Math.max(1, parseInt(peopleInput.value, 10) || 1);
  }
  function renderPreview() {
    preview.innerHTML = kitModalPreviewHTML(kit, currentPeople());
  }
  function clearError() { errorEl.style.display = 'none'; errorEl.textContent = ''; }
  function showError(msg) { errorEl.textContent = msg; errorEl.style.display = 'block'; }

  peopleInput.addEventListener('input', renderPreview);
  renderPreview();

  [startInput, endInput].forEach((el) => el.addEventListener('change', () => {
    if (endInput.value && startInput.value && endInput.value <= startInput.value) {
      const d = new Date(`${startInput.value}T00:00:00`);
      d.setDate(d.getDate() + 1);
      endInput.value = localDateString(d);
    }
    clearError();
  }));

  overlay.querySelector('#kitConfirmBtn').addEventListener('click', () => {
    clearError();
    const people = currentPeople();
    const days = daysBetween(startInput.value, endInput.value);
    if (days <= 0) { showError('請選擇有效的取貨與歸還日期。'); return; }

    const shortage = findKitStockShortage(kit, people, startInput.value, endInput.value);
    if (shortage) {
      showError(shortage.available > 0
        ? `${shortage.gear.name} 所選日期目前只剩 ${shortage.available} 件，請調整數量、日期或選擇其他裝備。`
        : `${shortage.gear.name} 所選日期目前無庫存，請調整日期或選擇其他裝備。`);
      return;
    }

    if (!isSameRentalDateRange(startInput.value, endInput.value)) {
      openKitDateConflictModal(kit, people, startInput.value, endInput.value);
      return;
    }
    addKitToCart(kit, people, startInput.value, endInput.value);
    closeModal();
  });
  overlay.querySelector('#kitCancelBtn').addEventListener('click', () => closeModal());
}

function openKitDateConflictModal(kit, people, newStart, newEnd) {
  const current = getCartRentalDateRange();
  const overlay = showModal(`
    <h2 id="kitConflictTitle" style="font-size:1.15rem">套餐日期與目前預約不同</h2>
    <p style="margin-top:10px; font-size:0.88rem; color:var(--color-muted)">同一筆預約中的租借裝備需要使用相同日期。</p>
    <div class="modal-date-compare">
      <div>
        <div class="pb-label">目前預約清單中的租借日期</div>
        <div class="modal-date-value">${formatDateTW(current.startDate)}～${formatDateTW(current.endDate)}</div>
      </div>
      <div>
        <div class="pb-label">套餐選擇的租借日期</div>
        <div class="modal-date-value">${formatDateTW(newStart)}～${formatDateTW(newEnd)}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="kitUseCurrent">沿用目前預約日期加入整組</button>
      <button type="button" class="btn btn-outline btn-block" id="kitClearAndUseNew">清空租借商品並使用套餐新日期</button>
      <button type="button" class="btn btn-ghost btn-block" id="kitConflictCancel">取消</button>
    </div>
  `, { labelledBy: 'kitConflictTitle' });

  function confirmedAdd(startDate, endDate) {
    const shortage = findKitStockShortage(kit, people, startDate, endDate);
    if (shortage) {
      closeModal();
      showToast(shortage.available > 0
        ? `${shortage.gear.name} 所選日期目前只剩 ${shortage.available} 件，請調整數量、日期或選擇其他裝備。`
        : `${shortage.gear.name} 所選日期目前無庫存，請調整日期或選擇其他裝備。`);
      return;
    }
    addKitToCart(kit, people, startDate, endDate);
    closeModal();
  }

  overlay.querySelector('#kitUseCurrent').addEventListener('click', () => {
    confirmedAdd(current.startDate, current.endDate);
  });
  overlay.querySelector('#kitClearAndUseNew').addEventListener('click', () => {
    clearRentalLines();
    confirmedAdd(newStart, newEnd);
  });
  overlay.querySelector('#kitConflictCancel').addEventListener('click', () => closeModal());
}
