/* Shared utilities: header/nav, cart (localStorage), toast, formatting. Loaded on every page. */

const CART_KEY = 'ogr_cart_v1';
const SIZE_PROFILE_KEY = 'ogr_size_profile_v1';
const CHECKLIST_KEY = 'ogr_checklist_v1';

function safeGetJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function getSizeProfile() {
  return safeGetJSON(SIZE_PROFILE_KEY, null);
}

function setSizeProfile(profile) {
  return safeSetJSON(SIZE_PROFILE_KEY, profile);
}

function getChecklistState() {
  return safeGetJSON(CHECKLIST_KEY, null);
}

function setChecklistState(state) {
  return safeSetJSON(CHECKLIST_KEY, state);
}

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

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(line) {
  const cart = getCart();
  line.lineId = 'line_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  cart.push(line);
  setCart(cart);
  return line;
}

function removeFromCart(lineId) {
  const cart = getCart().filter((l) => l.lineId !== lineId);
  setCart(cart);
}

function cartCount() {
  return getCart().length;
}

function updateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
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
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', initHeader);
