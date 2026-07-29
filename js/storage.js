/* Safe localStorage read/write layer + key registry. Must load before any file that touches storage. */

const CART_KEY = 'ogr_cart_v1';
const ORDERS_KEY = 'ogr_orders_v1';
const CREDITS_KEY = 'ogr_rent_to_buy_credits_v1';
const SIZE_PROFILE_KEY = 'ogr_size_profile_v1';
const CHECKLIST_KEY = 'ogr_checklist_v1';
const LAST_ORDER_KEY = 'ogr_last_order';
const PROTOTYPE_SEEDED_KEY = 'ogr_prototype_seeded_v1';

function safeGetJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`無法讀取 ${key}`, error);
    return fallback;
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`無法儲存 ${key}`, error);
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
