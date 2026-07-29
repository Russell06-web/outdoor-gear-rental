/* Small hand-built line-icon set (no external icon library / no fetched images). */
const ICONS = {
  mountain: '<path d="M2 20L9 8l4 6 3-4 6 10z"/><circle cx="18" cy="6" r="2"/>',
  tent: '<path d="M3 20L12 4l9 16"/><path d="M8.5 20L12 12l3.5 8"/>',
  waves: '<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',

  backpack: '<rect x="6" y="8" width="12" height="13" rx="3"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><line x1="9" y1="13" x2="9" y2="17"/><line x1="15" y1="13" x2="15" y2="17"/>',
  boots: '<path d="M6 3v9l-3 3v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2c0-2-2-3-4-3h-2V3z"/><line x1="6" y1="8" x2="10" y2="8"/>',
  poles: '<line x1="7" y1="2" x2="4" y2="22"/><line x1="17" y1="2" x2="20" y2="22"/><circle cx="7" cy="2" r="1.4"/><circle cx="17" cy="2" r="1.4"/>',
  headlamp: '<circle cx="12" cy="9" r="4"/><path d="M4 9a8 8 0 0 1 16 0"/><circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none"/>',
  sleepingbag: '<path d="M9 3h6l3 5v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/>',
  stove: '<path d="M5 11h14l-1 9H6z"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  furniture: '<path d="M6 4v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V4"/><line x1="7" y1="16" x2="7" y2="21"/><line x1="17" y1="16" x2="17" y2="21"/>',
  kayak: '<path d="M2 14c4-6 16-6 20 0-4 3-16 3-20 0z"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="18" x2="15" y2="18"/>',
  paddleboard: '<ellipse cx="12" cy="12" rx="9" ry="3.2"/><line x1="12" y1="3" x2="12" y2="21"/>',
  lifevest: '<path d="M9 3h6v4H9z"/><path d="M7 7h10l2 4v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9z"/><line x1="9" y1="7" x2="9" y2="21"/><line x1="15" y1="7" x2="15" y2="21"/>',
  snorkel: '<circle cx="12" cy="10" r="6"/><path d="M12 16v4"/><path d="M9 20h6"/>',
  drybag: '<path d="M7 9V6a5 5 0 0 1 10 0v3"/><rect x="5" y="9" width="14" height="12" rx="2"/><path d="M8 9l-2 3M16 9l2 3"/>',
  pad: '<rect x="4" y="7" width="16" height="10" rx="3"/><line x1="4" y1="12" x2="20" y2="12"/>',

  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  cart: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  arrowRight: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  alertTriangle: '<path d="M12 3l10 18H2z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  mapPin: '<path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A4.5 4.5 0 0 1 17 18H7z"/>',
  shield: '<path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><line x1="7" y1="8" x2="7" y2="11"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="15" y1="8" x2="15" y2="11"/>',
  package: '<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v9l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="22"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  inbox: '<path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12l2-8h12l2 8v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
  route: '<path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/>',
  search: '<circle cx="10" cy="10" r="6"/><line x1="15" y1="15" x2="21" y2="21"/>',
  droplet: '<path d="M12 3c-3.2 4.2-6 7.6-6 11a6 6 0 0 0 12 0c0-3.4-2.8-6.8-6-11z"/>',
  scale: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M5 7l-3 6a3.2 3.2 0 0 0 6 0z"/><path d="M19 7l-3 6a3.2 3.2 0 0 0 6 0z"/><path d="M5 7h14"/>',
};

function svgIcon(name, extraAttrs) {
  const inner = ICONS[name] || '';
  const attrs = extraAttrs || '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${inner}</svg>`;
}
