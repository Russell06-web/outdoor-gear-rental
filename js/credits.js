/* Rent-to-buy credits: single source of truth for ogr_rent_to_buy_credits_v1.
   Loaded after orders.js. */

/* 已付租金的 60% 可折抵購買價，最高折抵購買價的 50%（per-gearId, not per-order). */
const RENT_TO_BUY_RATE = 0.6;
const RENT_TO_BUY_CAP_RATIO = 0.5;

function calcRentToBuyCredit(rentPaid, buyPrice) {
  const raw = rentPaid * RENT_TO_BUY_RATE;
  const cap = buyPrice * RENT_TO_BUY_CAP_RATIO;
  return Math.min(raw, cap);
}

function getCredits() {
  const credits = safeGetJSON(CREDITS_KEY, []);
  return Array.isArray(credits) ? credits : [];
}

function saveCredits(credits) {
  return safeSetJSON(CREDITS_KEY, Array.isArray(credits) ? credits : []);
}

function getAvailableCreditForGear(gearId) {
  return getCredits()
    .filter((c) => c.gearId === gearId && c.remainingAmount > 0)
    .reduce((sum, c) => sum + c.remainingAmount, 0);
}

function markCreditAsUsed(creditId, amount) {
  if (!(amount > 0)) return false;
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.creditId === creditId);
  if (idx === -1) return false;
  const credit = credits[idx];
  const usable = Math.min(amount, credit.remainingAmount);
  if (usable <= 0) return false;
  credit.usedAmount = (credit.usedAmount || 0) + usable;
  credit.remainingAmount -= usable;
  credits[idx] = credit;
  saveCredits(credits);
  return true;
}

/* Deducts up to `amount` NT$ of credit for gearId across one or more credit records
   (oldest first). Returns the amount actually applied — callers must compute and pass
   in an already-capped amount (available vs. 50%-of-price) before calling this. */
function applyCreditsToPurchase(gearId, amount) {
  if (!(amount > 0)) return 0;
  const candidates = getCredits()
    .filter((c) => c.gearId === gearId && c.remainingAmount > 0)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let remaining = amount;
  let applied = 0;
  for (const credit of candidates) {
    if (remaining <= 0) break;
    const use = Math.min(credit.remainingAmount, remaining);
    if (use > 0 && markCreditAsUsed(credit.creditId, use)) {
      applied += use;
      remaining -= use;
    }
  }
  return applied;
}

/* Called when a rental order's return inspection is completed. Creates one credit record
   per eligible rent line (skips lines that already generated a credit, and lines with a
   $0 result). Mutates order.items in place; caller is responsible for saving the order. */
function createCreditsFromCompletedOrder(order) {
  const credits = getCredits();
  let created = false;
  order.items.forEach((item) => {
    if (item.mode !== 'rent' || item.creditGenerated) return;
    const gear = getGearById(item.gearId);
    if (!gear) return;
    const earned = calcRentToBuyCredit(item.lineTotal, gear.buyPrice);
    if (!(earned > 0)) return;
    credits.push({
      /* Keyed by lineId, not gearId — an order can rent the same gear on more than
         one line (e.g. two tents), and those would otherwise collide on one ID. */
      creditId: `CREDIT-${order.orderId}-${item.lineId}`,
      gearId: item.gearId,
      sourceOrderId: order.orderId,
      sourceLineId: item.lineId,
      earnedAmount: earned,
      usedAmount: 0,
      remainingAmount: earned,
      createdAt: new Date().toISOString(),
      expiresAt: null,
    });
    item.rentToBuyCreditEarned = earned;
    item.creditGenerated = true;
    created = true;
  });
  if (created) saveCredits(credits);
  return created;
}

/* Portfolio prototype only: seed one demo credit so the checkout redemption flow can be
   demonstrated without first having to complete a real rent -> return -> credit cycle. */
function seedDemoCredits() {
  if (localStorage.getItem(CREDITS_KEY) !== null) return;
  saveCredits([
    {
      creditId: 'CREDIT-DEMO-HIKING-BOOTS',
      gearId: 'hiking-boots',
      sourceOrderId: 'ORD-DEMO-000',
      earnedAmount: 750,
      usedAmount: 0,
      remainingAmount: 750,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      expiresAt: null,
      isDemo: true,
    },
  ]);
}
