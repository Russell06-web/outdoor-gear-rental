/* Mock catalogue data — no backend, everything lives in this file + localStorage. */

const ACTIVITIES = [
  {
    id: 'hiking',
    name: '登山',
    nameEn: 'Hiking',
    icon: 'mountain',
    desc: '單日健行到多天重裝縱走的裝備',
    photo: 'assets/images/activities/activity-hiking.jpg',
  },
  {
    id: 'camping',
    name: '露營',
    nameEn: 'Camping',
    icon: 'tent',
    desc: '營地過夜所需的帳篷、睡眠與炊事裝備',
    photo: 'assets/images/activities/activity-camping.jpg',
  },
  {
    id: 'water',
    name: '水上活動',
    nameEn: 'Water Sports',
    icon: 'waves',
    desc: 'SUP、浮潛與各式水域活動防護裝備',
  },
];

/*
  sizeGuide types:
  - 'shoe'   : 依平常鞋碼 + 是否多日重裝，推薦租借鞋碼
  - 'height' : 依身高，推薦尺寸區間
  - 'weight' : 依體重，推薦浮力/尺寸等級
  - 'capacity': 依行程天數，判斷容量是否適合
  - null     : 無需量身尺寸（單一規格）
*/
const GEAR_ITEMS = [
  {
    id: 'hiking-boots',
    name: '中筒防水登山鞋',
    activity: 'hiking',
    icon: 'boots',
    difficulty: '進階',
    sizeGuide: 'shoe',
    rentPricePerDay: 250,
    buyPrice: 4200,
    stock: 8,
    unit: '雙',
    photo: 'assets/images/gear/hiking-boots.jpg',
    desc: 'Vibram 大底、GORE-TEX 防水透氣，適合多日重裝縱走。',
    specs: [
      ['適用行程', '單日健行～多日重裝縱走'],
      ['鞋碼範圍', 'EU 36–45（含半號）'],
      ['防水等級', 'GORE-TEX 全防水'],
      ['建議搭配', '登山襪、綁腿'],
    ],
  },
  {
    id: 'trekking-poles',
    name: '碳纖登山杖（一對）',
    activity: 'hiking',
    icon: 'poles',
    difficulty: '新手',
    sizeGuide: 'height',
    rentPricePerDay: 120,
    buyPrice: 1800,
    stock: 15,
    unit: '組',
    desc: '三節式快扣，減輕膝蓋負擔，新手上路也適用。',
    specs: [
      ['材質', '碳纖維'],
      ['可調長度', '65–135 cm'],
      ['握把', '軟木握把＋防滑腕帶'],
      ['重量', '480g / 對'],
    ],
  },
  {
    id: 'backpack-60l',
    name: '60L 重裝登山背包',
    activity: 'hiking',
    icon: 'backpack',
    difficulty: '進階',
    sizeGuide: 'capacity',
    rentPricePerDay: 200,
    buyPrice: 5200,
    stock: 5,
    unit: '個',
    photo: 'assets/images/gear/backpack-60l.jpg',
    desc: '可調式背負系統，適合 2 天以上的重裝縱走。',
    specs: [
      ['容量', '60 公升'],
      ['適合行程長度', '2 天以上重裝'],
      ['背負系統', '可調式，含腰帶支撐'],
      ['防雨罩', '內附'],
    ],
  },
  {
    id: 'headlamp',
    name: 'LED 頭燈',
    activity: 'hiking',
    icon: 'headlamp',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 60,
    buyPrice: 900,
    stock: 20,
    unit: '個',
    desc: '最大 300 流明，紅光模式不驚擾夜間野生動物。',
    specs: [
      ['亮度', '最大 300 流明'],
      ['續航', '一般模式約 12 小時'],
      ['防水等級', 'IPX6'],
      ['電力', '內附充電線'],
    ],
  },

  {
    id: 'tent-2p',
    name: '兩人四季帳',
    activity: 'camping',
    icon: 'tent',
    difficulty: '新手',
    sizeGuide: 'capacity',
    rentPricePerDay: 350,
    buyPrice: 6800,
    stock: 6,
    unit: '頂',
    photo: 'assets/images/gear/tent-2p.jpg',
    desc: '雙層帳設計，抗風耐雨，10 分鐘快速搭建。',
    specs: [
      ['適用人數', '2 人（含裝備）'],
      ['搭建時間', '約 10 分鐘'],
      ['耐候性', '抗風、雙層防水'],
      ['重量', '2.8 kg'],
    ],
  },
  {
    id: 'sleeping-bag',
    name: '秋冬羽絨睡袋',
    activity: 'camping',
    icon: 'sleepingbag',
    difficulty: '新手',
    sizeGuide: 'height',
    rentPricePerDay: 150,
    buyPrice: 2600,
    stock: 10,
    unit: '個',
    desc: '舒適溫度 5°C，適合秋冬中低海拔營地過夜。',
    specs: [
      ['舒適溫度', '約 5°C'],
      ['內填', '90/10 白鵝絨'],
      ['適用身高', '160–190 cm（分兩種長度）'],
      ['收納體積', '直徑 18cm × 高 30cm'],
    ],
  },
  {
    id: 'stove-set',
    name: '卡式爐炊具套組',
    activity: 'camping',
    icon: 'stove',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 100,
    buyPrice: 1500,
    stock: 2,
    unit: '組',
    photo: 'assets/images/gear/stove-set.jpg',
    desc: '含爐頭、鈦杯、防風板，2–3 人份簡易炊事剛好。',
    specs: [
      ['內容物', '爐頭、鈦杯 x2、防風板'],
      ['適合人數', '2–3 人'],
      ['瓦斯罐', '需另購，不含在租借內'],
      ['重量', '650g'],
    ],
  },
  {
    id: 'camp-furniture',
    name: '露營折疊桌椅組',
    activity: 'camping',
    icon: 'furniture',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 180,
    buyPrice: 2400,
    stock: 0,
    unit: '組',
    desc: '一桌四椅，鋁合金骨架，收納後可放入背包側袋。',
    specs: [
      ['組成', '折疊桌 x1、折疊椅 x4'],
      ['材質', '鋁合金骨架'],
      ['承重', '單椅 100kg'],
      ['收納尺寸', '60 × 15 × 15 cm'],
    ],
  },

  {
    id: 'sup-board',
    name: '立式划槳板 SUP',
    activity: 'water',
    icon: 'paddleboard',
    difficulty: '進階',
    sizeGuide: 'weight',
    rentPricePerDay: 500,
    buyPrice: 15800,
    stock: 3,
    unit: '塊',
    desc: '充氣式船身，含船槳與打氣筒，適合平靜水域使用。',
    specs: [
      ['尺寸', '320 × 76 × 15 cm'],
      ['承重', '最大 110 kg'],
      ['適用水域', '平靜湖面、無浪岸邊'],
      ['配件', '船槳、打氣筒、修補包'],
    ],
  },
  {
    id: 'snorkel-set',
    name: '浮潛面鏡呼吸管組',
    activity: 'water',
    icon: 'snorkel',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 150,
    buyPrice: 1200,
    stock: 12,
    unit: '組',
    desc: '乾式呼吸管防嗆水設計，鏡面防霧處理。',
    specs: [
      ['內容物', '面鏡、乾式呼吸管、網袋'],
      ['適用臉型', '成人均一尺寸（含可調式頭帶）'],
      ['鏡片', '強化玻璃、防霧塗層'],
      ['清潔', '每次租借前均消毒'],
    ],
  },
  {
    id: 'life-vest',
    name: '成人救生衣',
    activity: 'water',
    icon: 'lifevest',
    difficulty: '新手',
    sizeGuide: 'weight',
    rentPricePerDay: 100,
    buyPrice: 1600,
    stock: 18,
    unit: '件',
    desc: 'CNS 認證浮力材質，前扣式設計方便穿脫。',
    specs: [
      ['認證', 'CNS 12989 浮力標準'],
      ['適用體重', '40–100 kg（分 3 種尺寸）'],
      ['穿脫方式', '前扣式＋可調束帶'],
      ['顏色', '亮橘色，利於水面辨識'],
    ],
  },
  {
    id: 'dry-bag',
    name: '防水收納袋 20L',
    activity: 'water',
    icon: 'drybag',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 80,
    buyPrice: 750,
    stock: 25,
    unit: '個',
    desc: '捲口密封防水袋，保護手機、相機等隨身物品。',
    specs: [
      ['容量', '20 公升'],
      ['防水等級', 'IPX6（可承受短暫浸泡）'],
      ['背負方式', '附可調背帶'],
      ['材質', '500D PVC 塗層防水布'],
    ],
  },
];

function getGearById(id) {
  return GEAR_ITEMS.find((g) => g.id === id);
}

function getActivityById(id) {
  return ACTIVITIES.find((a) => a.id === id);
}

function stockStatus(stock) {
  if (stock <= 0) return { key: 'out-stock', label: '目前額滿' };
  if (stock <= 3) return { key: 'low-stock', label: `剩 ${stock} 件` };
  return { key: 'in-stock', label: '庫存充足' };
}

/* 先租後買折抵規則：已付租金的 60% 可折抵購買價，最高折抵購買價的 50%。 */
const RENT_TO_BUY_RATE = 0.6;
const RENT_TO_BUY_CAP_RATIO = 0.5;

function calcRentToBuyCredit(rentPaid, buyPrice) {
  const raw = rentPaid * RENT_TO_BUY_RATE;
  const cap = buyPrice * RENT_TO_BUY_CAP_RATIO;
  return Math.min(raw, cap);
}
