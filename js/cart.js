/* Cart: single source of truth for reading/writing ogr_cart_v1 and same-date-range enforcement.
   Loaded after data.js + storage.js + main.js. */

function normalizeCartLine(line) {
  const gear = typeof getGearById === 'function' ? getGearById(line.gearId) : null;
  return {
    lineId: line.lineId,
    gearId: line.gearId,
    name: line.name || (gear ? gear.name : '未知商品'),
    icon: line.icon || (gear ? gear.icon : 'package'),
    photo: line.photo || (gear ? gear.photo : null),
    activity: line.activity || (gear ? gear.activity : null),
    mode: line.mode === 'buy' ? 'buy' : 'rent',
    selectedSize: line.selectedSize ?? null,
    recommendedSize: line.recommendedSize ?? null,
    startDate: line.startDate ?? null,
    endDate: line.endDate ?? null,
    days: line.days ?? 0,
    quantity: line.quantity ?? 1,
    unitPrice: line.unitPrice ?? 0,
    lineTotal: line.lineTotal ?? 0,
    addedAt: line.addedAt || null,
  };
}

function getCart() {
  const cart = safeGetJSON(CART_KEY, []);
  if (!Array.isArray(cart)) return [];
  return cart.map(normalizeCartLine);
}

function setCart(cart) {
  const ok = safeSetJSON(CART_KEY, Array.isArray(cart) ? cart : []);
  updateCartBadge();
  return ok;
}

function addToCart(line) {
  const cart = safeGetJSON(CART_KEY, []);
  const list = Array.isArray(cart) ? cart : [];
  line.lineId = line.lineId || ('line_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
  line.quantity = line.quantity ?? 1;
  line.addedAt = line.addedAt || new Date().toISOString();
  list.push(line);
  setCart(list);
  return line;
}

function removeFromCart(lineId) {
  const cart = getCart().filter((l) => l.lineId !== lineId);
  setCart(cart);
}

/* Removes only rent-mode lines, keeping any buy-mode lines untouched. Used by the
   date-conflict dialog's "清空租借商品並使用新日期" action. */
function clearRentalLines() {
  const cart = getCart().filter((l) => l.mode !== 'rent');
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

/* The single rental date range currently in the cart, or null if there are no rental lines yet. */
function getCartRentalDateRange(cart = getCart()) {
  const rentalLine = cart.find((line) => line.mode === 'rent');
  if (!rentalLine) return null;
  return {
    startDate: rentalLine.startDate,
    endDate: rentalLine.endDate,
  };
}

function isSameRentalDateRange(startDate, endDate, cart = getCart()) {
  const currentRange = getCartRentalDateRange(cart);
  if (!currentRange) return true;
  return (
    currentRange.startDate === startDate &&
    currentRange.endDate === endDate
  );
}
