/* Shared utilities: formatting, TW-local dates, toast, modal, header nav. Loaded after storage.js. */

function formatCurrency(n) {
  return 'NT$ ' + Math.round(n).toLocaleString('zh-TW');
}

function daysBetween(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const diff = Math.round((end - start) / 86400000);
  return diff > 0 ? diff : 0;
}

/* Local (browser) calendar date — avoids the UTC-shift bug from toISOString() near midnight in UTC+8. */
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayStr(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return localDateString(date);
}

/* 'YYYY-MM-DD' -> '2026/08/01' style TW date, for display only.
   Defensive: also tolerates being passed a full ISO datetime by reading just the date part,
   and never throws on bad input (returns '' instead of crashing the page). */
function formatDateTW(dateString) {
  if (!dateString) return '';
  const datePart = String(dateString).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

/* Full ISO datetime -> TW-local date+time, for display only (storage keeps the raw ISO string). */
function formatDateTimeTW(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

let toastTimer = null;
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.innerHTML = svgIcon('checkCircle', 'style="width:16px;height:16px;flex-shrink:0"') + '<span></span>';
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ==========================================================================
   Modal (shared by product.js date-conflict dialog and account.js return-check dialog)
   ========================================================================== */
let modalLastFocused = null;

function showModal(innerHTML, { labelledBy } = {}) {
  closeModal();
  modalLastFocused = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'activeModalOverlay';
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''} tabindex="-1">
      ${innerHTML}
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');

  const dialog = overlay.querySelector('.modal-dialog');
  const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  (focusable[0] || dialog).focus();

  function trapFocus(e) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(focusable);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  overlay.addEventListener('keydown', trapFocus);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  return overlay;
}

function closeModal() {
  const overlay = document.getElementById('activeModalOverlay');
  if (overlay) overlay.remove();
  document.body.classList.remove('modal-open');
  if (modalLastFocused && typeof modalLastFocused.focus === 'function') {
    modalLastFocused.focus();
  }
  modalLastFocused = null;
}

/* ==========================================================================
   Prototype demo data seeding — runs once per key, never overwrites real data.
   Individual seed functions live in orders.js / credits.js; this just calls them
   in the right order once every script on the page has loaded.
   ========================================================================== */
function initializePrototypeData() {
  if (typeof migrateLastOrder === 'function') migrateLastOrder();
  if (typeof seedDemoOrders === 'function') seedDemoOrders();
  if (typeof seedDemoCredits === 'function') seedDemoCredits();
}

/* ==========================================================================
   FAQ accordion — plain <button aria-expanded> + height animation, no library.
   ========================================================================== */
function initFaqAccordion(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.faq-question').forEach((btn) => {
    const answer = document.getElementById(btn.getAttribute('aria-controls'));
    if (!answer) return;
    answer.style.height = '0px';
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.height = isOpen ? '0px' : `${answer.scrollHeight}px`;
    });
  });
}

function initHeader() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    const setMenuOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
      toggle.innerHTML = svgIcon(open ? 'close' : 'menu');
    };
    toggle.addEventListener('click', () => setMenuOpen(!nav.classList.contains('open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) setMenuOpen(false);
    });
  }
  if (typeof updateCartBadge === 'function') updateCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
  initializePrototypeData();
  initHeader();
});
