/* Orders: single source of truth for ogr_orders_v1 — creation, lookup, status derivation, timeline.
   Loaded after cart.js. */

const RENT_FLOW = ['預約成立', '門市備貨', '等待取貨', '租借中', '等待歸還', '裝備檢查', '押金解除'];
const BUY_FLOW = ['訂單成立', '商品準備', '等待取貨', '訂單完成'];

const ORDER_STATUS_LABELS = {
  pending_pickup: '待取貨',
  renting: '租借中',
  pending_return_check: '待歸還確認',
  completed: '已完成',
  cancelled: '已取消',
  purchased: '購買完成',
};

function getOrders() {
  const orders = safeGetJSON(ORDERS_KEY, []);
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  return safeSetJSON(ORDERS_KEY, Array.isArray(orders) ? orders : []);
}

function addOrder(order) {
  const orders = getOrders();
  orders.push(order);
  return saveOrders(orders);
}

/* The shared rental window for an order's rent-mode items (same-date-range is enforced at
   checkout, so any rent line's dates represent the whole order). Null for buy-only orders. */
function getOrderRentDateRange(order) {
  const rentLines = order.items.filter((i) => i.mode === 'rent' && i.startDate && i.endDate);
  if (rentLines.length === 0) return null;
  return { startDate: rentLines[0].startDate, endDate: rentLines[0].endDate };
}

function getOrderById(orderId) {
  return getOrders().find((o) => o.orderId === orderId) || null;
}

function generateOrderId() {
  const compact = todayStr().replace(/-/g, '');
  const prefix = `ORD-${compact}-`;
  const orders = getOrders();
  const seqs = orders
    .filter((o) => o.orderId && o.orderId.startsWith(prefix))
    .map((o) => parseInt(o.orderId.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = seqs.length ? Math.max(...seqs) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

/* Explicit terminal states (completed/cancelled) always win once set. Everything else is derived
   live from today's date vs. the order's rental window, per spec — never trusted from storage. */
function deriveOrderStatus(order, now = new Date()) {
  if (!order || !Array.isArray(order.items)) return 'pending_pickup';
  if (order.status === 'completed' || order.status === 'cancelled') return order.status;

  const hasRent = order.items.some((i) => i.mode === 'rent');
  if (!hasRent) return 'purchased';

  const rentLines = order.items.filter((i) => i.mode === 'rent' && i.startDate && i.endDate);
  if (rentLines.length === 0) return 'pending_pickup';

  const earliestStart = rentLines.reduce((min, l) => (!min || l.startDate < min ? l.startDate : min), null);
  const latestEnd = rentLines.reduce((max, l) => (!max || l.endDate > max ? l.endDate : max), null);
  const today = localDateString(now);

  if (today < earliestStart) return 'pending_pickup';
  if (today > latestEnd) return 'pending_return_check';
  return 'renting';
}

function getOrderStatusLabel(order) {
  return ORDER_STATUS_LABELS[deriveOrderStatus(order)] || '處理中';
}

/* { flow: 'rent'|'buy', current } — current = number of completed stages (index of the active
   stage; equal to flow.length once everything is done, so nothing renders as "current"). */
function getOrderTimelineStage(order) {
  const hasRent = order.items.some((i) => i.mode === 'rent');
  if (!hasRent) return { flow: 'buy', current: BUY_FLOW.length };

  const status = deriveOrderStatus(order);
  const map = {
    pending_pickup: 2,
    renting: 3,
    pending_return_check: 5,
    completed: RENT_FLOW.length,
  };
  return { flow: 'rent', current: map[status] ?? 0 };
}

/* ==========================================================================
   Demo "complete return inspection" action (product portfolio demo only —
   not a real store-operations permission).
   ========================================================================== */
function completeReturnInspection(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return false;
  const order = orders[idx];
  if (order.status === 'completed') return false; // already done, avoid double-crediting

  order.status = 'completed';
  order.items.forEach((item) => {
    if (item.mode === 'rent' && item.assignedEquipmentId === '待門市配貨') {
      item.assignedEquipmentId = null;
    }
  });
  if (typeof createCreditsFromCompletedOrder === 'function') {
    createCreditsFromCompletedOrder(order);
  }
  orders[idx] = order;
  saveOrders(orders);
  return true;
}

/* ==========================================================================
   Migration: fold the old single "last order" snapshot (from before the real
   order system existed) into the orders list, once.
   ========================================================================== */
function migrateLastOrder() {
  const raw = localStorage.getItem(LAST_ORDER_KEY);
  if (!raw) return;
  try {
    const legacy = JSON.parse(raw);
    if (legacy && Array.isArray(legacy.items) && legacy.items.length > 0) {
      const orders = getOrders();
      const items = legacy.items.map((line) => ({
        ...normalizeCartLine(line),
        assignedEquipmentId: line.mode === 'rent' ? '待門市配貨' : null,
        rentToBuyCreditEarned: 0,
        creditGenerated: false,
      }));
      const rentSubtotal = items.filter((i) => i.mode === 'rent').reduce((s, i) => s + i.lineTotal, 0);
      const purchaseSubtotal = items.filter((i) => i.mode === 'buy').reduce((s, i) => s + i.lineTotal, 0);
      const depositAuthorization = items
        .filter((i) => i.mode === 'rent')
        .reduce((s, i) => {
          const gear = getGearById(i.gearId);
          return s + (gear ? Math.round(gear.buyPrice * 0.3) : 0);
        }, 0);
      orders.push({
        orderId: generateOrderId(),
        createdAt: legacy.submittedAt || new Date().toISOString(),
        status: null,
        customer: { name: '', phone: '', email: '' },
        fulfillment: { pickupLocation: null, returnLocation: null, pickupTime: null, returnTime: null },
        items,
        pricing: { rentSubtotal, purchaseSubtotal, creditApplied: 0, total: rentSubtotal + purchaseSubtotal, depositAuthorization },
        agreementAccepted: true,
        migratedFromLegacy: true,
      });
      saveOrders(orders);
    }
  } catch (e) {
    console.warn('無法搬移舊訂單資料', e);
  }
  localStorage.removeItem(LAST_ORDER_KEY);
}

/* Portfolio prototype only: seed 3 demo orders (one per interesting status) so the order
   list, timeline, and "complete return inspection" flow all have something to show on first
   visit. Dates are relative to today so the demo stays coherent no matter when it's viewed. */
function seedDemoOrders() {
  if (localStorage.getItem(ORDERS_KEY) !== null) return;

  const boots = getGearById('hiking-boots');
  const poles = getGearById('trekking-poles');
  const tent = getGearById('tent-2p');
  const sup = getGearById('sup-board');
  const vest = getGearById('life-vest');

  const orderA = {
    orderId: 'ORD-DEMO-001',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: null,
    customer: { name: '邱志綸', phone: '0912-345-678', email: 'russell@example.com' },
    fulfillment: {
      pickupLocation: '台北信義門市',
      returnLocation: '台北信義門市',
      pickupTime: { value: '09:00-12:00', label: '上午 09:00–12:00' },
      returnTime: { value: '13:00-17:00', label: '下午 13:00–17:00' },
    },
    items: [
      {
        lineId: 'demo-a1', gearId: 'hiking-boots', name: boots.name, icon: boots.icon, photo: boots.photo, activity: boots.activity,
        mode: 'rent', selectedSize: '41', recommendedSize: '41',
        startDate: todayStr(-2), endDate: todayStr(3), days: 5,
        quantity: 1, unitPrice: boots.rentPricePerDay, lineTotal: 5 * boots.rentPricePerDay,
        addedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        assignedEquipmentId: 'GL-BT-014', rentToBuyCreditEarned: 0, creditGenerated: false,
      },
      {
        lineId: 'demo-a2', gearId: 'trekking-poles', name: poles.name, icon: poles.icon, photo: poles.photo, activity: poles.activity,
        mode: 'rent', selectedSize: null, recommendedSize: null,
        startDate: todayStr(-2), endDate: todayStr(3), days: 5,
        quantity: 1, unitPrice: poles.rentPricePerDay, lineTotal: 5 * poles.rentPricePerDay,
        addedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        assignedEquipmentId: 'GL-PL-006', rentToBuyCreditEarned: 0, creditGenerated: false,
      },
    ],
    pricing: null,
    agreementAccepted: true,
  };

  const orderB = {
    orderId: 'ORD-DEMO-002',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: null,
    customer: { name: '邱志綸', phone: '0912-345-678', email: 'russell@example.com' },
    fulfillment: {
      pickupLocation: '台北信義門市',
      returnLocation: '台北信義門市',
      pickupTime: { value: '09:00-12:00', label: '上午 09:00–12:00' },
      returnTime: { value: '13:00-17:00', label: '下午 13:00–17:00' },
    },
    items: [
      {
        lineId: 'demo-b1', gearId: 'tent-2p', name: tent.name, icon: tent.icon, photo: tent.photo, activity: tent.activity,
        mode: 'rent', selectedSize: null, recommendedSize: null,
        startDate: todayStr(-10), endDate: todayStr(-5), days: 5,
        quantity: 1, unitPrice: tent.rentPricePerDay, lineTotal: 5 * tent.rentPricePerDay,
        addedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        assignedEquipmentId: 'GL-TT-002', rentToBuyCreditEarned: 0, creditGenerated: false,
      },
    ],
    pricing: null,
    agreementAccepted: true,
  };

  const orderC = {
    orderId: 'ORD-DEMO-003',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: null,
    customer: { name: '邱志綸', phone: '0912-345-678', email: 'russell@example.com' },
    fulfillment: {
      pickupLocation: '台北信義門市',
      returnLocation: '台北信義門市',
      pickupTime: { value: '09:00-12:00', label: '上午 09:00–12:00' },
      returnTime: { value: '13:00-17:00', label: '下午 13:00–17:00' },
    },
    items: [
      {
        lineId: 'demo-c1', gearId: 'sup-board', name: sup.name, icon: sup.icon, photo: sup.photo, activity: sup.activity,
        mode: 'buy', selectedSize: null, recommendedSize: null,
        startDate: null, endDate: null, days: 0,
        quantity: 1, unitPrice: sup.buyPrice, lineTotal: sup.buyPrice,
        addedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        assignedEquipmentId: null, rentToBuyCreditEarned: 0, creditGenerated: false,
      },
      {
        lineId: 'demo-c2', gearId: 'life-vest', name: vest.name, icon: vest.icon, photo: vest.photo, activity: vest.activity,
        mode: 'rent', selectedSize: 'M', recommendedSize: 'M',
        startDate: todayStr(2), endDate: todayStr(5), days: 3,
        quantity: 1, unitPrice: vest.rentPricePerDay, lineTotal: 3 * vest.rentPricePerDay,
        addedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        assignedEquipmentId: '待門市配貨', rentToBuyCreditEarned: 0, creditGenerated: false,
      },
    ],
    pricing: null,
    agreementAccepted: true,
  };

  [orderA, orderB, orderC].forEach((order) => {
    const rentSubtotal = order.items.filter((i) => i.mode === 'rent').reduce((s, i) => s + i.lineTotal, 0);
    const purchaseSubtotal = order.items.filter((i) => i.mode === 'buy').reduce((s, i) => s + i.lineTotal, 0);
    const depositAuthorization = order.items
      .filter((i) => i.mode === 'rent')
      .reduce((s, i) => {
        const gear = getGearById(i.gearId);
        return s + (gear ? Math.round(gear.buyPrice * 0.3) : 0);
      }, 0);
    order.pricing = { rentSubtotal, purchaseSubtotal, creditApplied: 0, total: rentSubtotal + purchaseSubtotal, depositAuthorization };
  });

  saveOrders([orderA, orderB, orderC]);
}
