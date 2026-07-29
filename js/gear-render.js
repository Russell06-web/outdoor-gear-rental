/* Shared gear-card renderer for index.html + gear-list.html.
   Loaded after compare.js (needs compareButtonHTML/wireCompareButtons). */

function gearCardHTML(item) {
  const activity = getActivityById(item.activity);
  const status = stockStatus(item.stock, item.unit);
  return `
    <div class="gear-card">
      <a href="product.html?id=${item.id}" class="gear-card-link">
        <div class="gear-thumb${item.photo ? ' has-photo' : ''}" data-activity="${item.activity}">
          ${item.photo ? `<img src="${item.photo}" alt="${item.name}" loading="lazy">` : svgIcon(item.icon)}
          <span class="stock-badge ${status.key}">${status.label}</span>
          <span class="difficulty-badge">${item.difficulty}</span>
        </div>
        <div class="gear-body">
          <span class="gear-brand">${item.brand}</span>
          <h3>${item.name}</h3>
          <p class="gear-usecase">${item.useCase}</p>
          <p class="gear-keyspec">${item.keySpec}</p>
          <div class="price-compare">
            <div class="price-block rent">
              <div class="pb-label">租借</div>
              <div class="pb-value">${formatCurrency(item.rentPricePerDay)}<span class="pb-unit">/天</span></div>
            </div>
            <div class="price-block buy">
              <div class="pb-label">購買</div>
              <div class="pb-value">${formatCurrency(item.buyPrice)}</div>
            </div>
          </div>
          <div class="gear-credit-hint"><strong>60%</strong> 租金可折抵購買價</div>
        </div>
      </a>
      <div class="gear-card-actions">
        <a href="product.html?id=${item.id}" class="btn btn-outline btn-sm">查看詳情</a>
        ${compareButtonHTML(item.id)}
      </div>
    </div>
  `;
}

function renderGearGrid(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(gearCardHTML).join('');
  wireCompareButtons(el);
}
