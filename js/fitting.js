/* In-store fitting/try-on booking. Loaded after storage.js/main.js.
   Portfolio demo only — see the disclaimer text in the modal below. */

const FITTING_BOOKING_KEY = 'ogr_fitting_bookings_v1';
const FITTING_STORES = ['台北信義門市', '新竹門市', '台中大雅門市'];
const FITTING_TIME_SLOTS = [
  { value: '09:00-12:00', label: '上午 09:00–12:00' },
  { value: '13:00-17:00', label: '下午 13:00–17:00' },
  { value: '17:00-19:00', label: '傍晚 17:00–19:00' },
];

function getFittingBookings() {
  return safeGetJSON(FITTING_BOOKING_KEY, []);
}
function saveFittingBookings(list) {
  return safeSetJSON(FITTING_BOOKING_KEY, list);
}

function openFittingModal(item) {
  const overlay = showModal(`
    <h2 id="fittingModalTitle" style="font-size:1.15rem">預約到店試穿／試背</h2>
    <p class="field-hint" style="margin-top:6px">${item.name}</p>
    <div class="kit-modal-field">
      <label for="fittingStore">門市</label>
      <select class="input" id="fittingStore">${FITTING_STORES.map((s) => `<option value="${s}">${s}</option>`).join('')}</select>
    </div>
    <div class="kit-modal-field-row">
      <div class="kit-modal-field">
        <label for="fittingDate">日期</label>
        <input type="date" class="input" id="fittingDate" min="${todayStr()}" value="${todayStr(2)}">
      </div>
      <div class="kit-modal-field">
        <label for="fittingSlot">時段</label>
        <select class="input" id="fittingSlot">${FITTING_TIME_SLOTS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}</select>
      </div>
    </div>
    <div class="kit-modal-field">
      <label for="fittingUsualSize">平常尺寸（選填）</label>
      <input type="text" class="input" id="fittingUsualSize" placeholder="例如 EU 41 或身高 170cm">
    </div>
    <div class="kit-modal-field">
      <label for="fittingNote">備註（選填）</label>
      <textarea class="input" id="fittingNote" rows="2"></textarea>
    </div>
    <p class="field-hint" style="margin-top:14px">此為作品集示範功能，不會實際通知門市。</p>
    <p class="form-error" id="fittingError" role="alert" style="display:none"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="fittingConfirmBtn">送出預約</button>
      <button type="button" class="btn btn-ghost btn-block" id="fittingCancelBtn">取消</button>
    </div>
  `, { labelledBy: 'fittingModalTitle' });

  overlay.querySelector('#fittingConfirmBtn').addEventListener('click', () => {
    const store = overlay.querySelector('#fittingStore').value;
    const date = overlay.querySelector('#fittingDate').value;
    const slotVal = overlay.querySelector('#fittingSlot').value;
    const slot = FITTING_TIME_SLOTS.find((s) => s.value === slotVal);
    const errorEl = overlay.querySelector('#fittingError');

    if (!date) {
      errorEl.textContent = '請選擇預約日期。';
      errorEl.style.display = 'block';
      return;
    }

    const bookings = getFittingBookings();
    bookings.push({
      bookingId: `FIT-${Date.now()}`,
      gearId: item.id,
      gearName: item.name,
      store,
      date,
      slot,
      usualSize: overlay.querySelector('#fittingUsualSize').value.trim(),
      note: overlay.querySelector('#fittingNote').value.trim(),
      createdAt: new Date().toISOString(),
    });
    const ok = saveFittingBookings(bookings);
    closeModal();
    if (!ok) {
      showToast('資料暫時無法儲存，請確認瀏覽器沒有停用網站儲存功能。');
      return;
    }
    showFittingSuccessModal(store, date, slot);
  });
  overlay.querySelector('#fittingCancelBtn').addEventListener('click', () => closeModal());
}

function showFittingSuccessModal(store, date, slot) {
  const overlay = showModal(`
    <h2 id="fittingSuccessTitle" style="font-size:1.15rem">試穿預約已建立</h2>
    <div class="review-box" style="margin-top:14px">
      <div class="review-row"><span>門市</span><span>${store}</span></div>
      <div class="review-row"><span>日期</span><span>${formatDateTW(date)}</span></div>
      <div class="review-row"><span>時段</span><span>${slot.label}</span></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-primary btn-block" id="fittingSuccessClose">完成</button>
    </div>
  `, { labelledBy: 'fittingSuccessTitle' });
  overlay.querySelector('#fittingSuccessClose').addEventListener('click', () => closeModal());
}
