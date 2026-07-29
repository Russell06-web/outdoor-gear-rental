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
    photo: 'assets/images/activities/activity-water.jpg',
  },
];

/* 智慧裝備清單：活動類型、對應問題、必備/建議/依需求裝備（皆對應 GEAR_ITEMS 既有品項，不虛構商品）。 */
const CHECKLIST_ACTIVITIES = [
  {
    id: 'day-hike',
    name: '單日健行',
    desc: '當天來回，不過夜的健行行程',
    questions: [
      {
        id: 'difficulty',
        label: '預計活動難度',
        type: 'select',
        options: [
          { value: 'easy', label: '新手／郊山步道' },
          { value: 'normal', label: '一般／中級山' },
          { value: 'hard', label: '挑戰／地形複雜' },
        ],
      },
      {
        id: 'firstTime',
        label: '是否第一次參加健行？',
        type: 'select',
        options: [
          { value: 'no', label: '否，有經驗' },
          { value: 'yes', label: '是，第一次' },
        ],
      },
    ],
    must: ['hiking-boots', 'trekking-poles'],
    suggested: ['headlamp', 'dry-bag'],
    optional: [],
  },
  {
    id: 'multi-day-hike',
    name: '多日重裝登山',
    desc: '需過夜、自行背負裝備的縱走行程',
    questions: [
      { id: 'days', label: '活動天數', type: 'number', min: 2, max: 14, placeholder: '例如 3' },
      {
        id: 'difficulty',
        label: '預計活動難度',
        type: 'select',
        options: [
          { value: 'normal', label: '一般／傳統路線' },
          { value: 'hard', label: '挑戰／地形複雜' },
        ],
      },
      {
        id: 'firstTime',
        label: '是否第一次挑戰多日縱走？',
        type: 'select',
        options: [
          { value: 'no', label: '否，有經驗' },
          { value: 'yes', label: '是，第一次' },
        ],
      },
    ],
    must: ['hiking-boots', 'backpack-60l', 'trekking-poles', 'headlamp'],
    suggested: ['dry-bag', 'sleeping-bag', 'stove-set'],
    optional: ['tent-2p'],
  },
  {
    id: 'camping',
    name: '露營',
    desc: '營地紮營過夜，含炊事與休憩裝備',
    questions: [
      { id: 'days', label: '活動天數', type: 'number', min: 1, max: 14, placeholder: '例如 2' },
      { id: 'people', label: '參加人數', type: 'number', min: 1, max: 10, placeholder: '例如 2' },
    ],
    must: ['tent-2p', 'sleeping-bag'],
    suggested: ['stove-set', 'headlamp', 'camp-furniture'],
    optional: ['dry-bag'],
  },
  {
    id: 'sup',
    name: 'SUP',
    desc: '立式划槳板水域活動',
    questions: [
      {
        id: 'firstTime',
        label: '是否第一次嘗試 SUP？',
        type: 'select',
        options: [
          { value: 'no', label: '否，有經驗' },
          { value: 'yes', label: '是，第一次' },
        ],
      },
    ],
    must: ['sup-board', 'life-vest'],
    suggested: ['dry-bag'],
    optional: [],
  },
  {
    id: 'snorkeling',
    name: '浮潛',
    desc: '近岸水域浮潛活動',
    questions: [
      {
        id: 'firstTime',
        label: '是否第一次浮潛？',
        type: 'select',
        options: [
          { value: 'no', label: '否，有經驗' },
          { value: 'yes', label: '是，第一次' },
        ],
      },
    ],
    must: ['snorkel-set', 'life-vest'],
    suggested: ['dry-bag'],
    optional: [],
  },
];

function getChecklistActivity(id) {
  return CHECKLIST_ACTIVITIES.find((c) => c.id === id);
}

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
    difficulty: '多日重裝適用',
    sizeGuide: 'shoe',
    rentPricePerDay: 250,
    buyPrice: 4200,
    stock: 8,
    unit: '雙',
    photo: 'assets/images/gear/hiking-boots.jpg',
    desc: 'Vibram 大底、GORE-TEX 防水透氣，適合多日重裝縱走。',
    brand: '岳形 PeakForm',
    gearType: '鞋類與穿戴裝備',
    useCase: '適合多日重裝縱走行程',
    keySpec: 'GORE-TEX 全防水',
    weightKg: 0.59,
    needTags: ['多日重裝', '雨天裝備', '熱門租借'],
    compareSpecs: { sizeRange: 'EU 36–45', waterproof: 'GORE-TEX 全防水', material: 'Vibram 大底' },
    fitGuidance: {
      suitable: ['多日重裝縱走行程', '需要防水與抓地力的複雜地形'],
      notSuitable: ['平地日常散步', '鞋碼在 EU 36–45 範圍外'],
    },
    rentalContents: ['登山鞋一雙', '鞋帶'],
    sizeMin: 36,
    sizeMax: 45,
    sizeStep: 0.5,
    /* Rental units are used-but-inspected stock; purchase units are brand-new stock — kept separate on purpose (see getSizeStockForMode). */
    rentalSizeStock: {
      '36': 1, '36.5': 1, '37': 2, '37.5': 1, '38': 2, '38.5': 2,
      '39': 2, '39.5': 1, '40': 3, '40.5': 2, '41': 2, '41.5': 1,
      '42': 3, '42.5': 2, '43': 2, '43.5': 1, '44': 1, '44.5': 1, '45': 1,
    },
    purchaseSizeStock: {
      '36': 3, '36.5': 2, '37': 4, '37.5': 3, '38': 5, '38.5': 4,
      '39': 5, '39.5': 3, '40': 6, '40.5': 5, '41': 6, '41.5': 4,
      '42': 6, '42.5': 4, '43': 5, '43.5': 3, '44': 3, '44.5': 2, '45': 2,
    },
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
    photo: 'assets/images/gear/trekking-poles.jpg',
    desc: '三節式快扣，減輕膝蓋負擔，新手上路也適用。',
    brand: '行路 TrailPace',
    gearType: '登山杖與配件',
    useCase: '適合新手到進階的健行支撐',
    keySpec: '重量 480g／對',
    weightKg: 0.48,
    needTags: ['新手推薦', '輕量化裝備', '兩天一夜'],
    compareSpecs: { weight: '480g / 對', material: '碳纖維' },
    fitGuidance: {
      suitable: ['新手到進階皆適用的健行支撐', '需要減輕膝蓋負擔的下坡路段'],
      notSuitable: ['完全平坦、無需支撐的步道'],
    },
    rentalContents: ['登山杖一對', '收納束帶'],
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
    brand: '岳形 PeakForm',
    gearType: '背包',
    useCase: '適合 2 天以上重裝縱走',
    keySpec: '容量 60L',
    weightKg: 1.6,
    needTags: ['三天以上'],
    compareSpecs: { weight: '1.6kg', capacity: '60L', suitableDays: '2 天以上' },
    fitGuidance: {
      suitable: ['2 天以上重裝縱走', '裝備總重約 10～15kg'],
      notSuitable: ['單日輕裝健行', '不習慣使用大型背包的新手'],
    },
    rentalContents: ['背包本體', '防雨罩', '腰帶束帶'],
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
    photo: 'assets/images/gear/headlamp.jpg',
    desc: '最大 300 流明，紅光模式不驚擾夜間野生動物。',
    brand: '光徑 LumaTrail',
    gearType: '鞋類與穿戴裝備',
    useCase: '夜間行走與營地照明',
    keySpec: '最大 300 流明',
    weightKg: 0.09,
    needTags: ['新手推薦', '輕量化裝備', '兩天一夜'],
    compareSpecs: { weight: '90g', waterproof: 'IPX6' },
    fitGuidance: {
      suitable: ['夜間行走或摸黑紮營', '需要雙手空出的照明需求'],
      notSuitable: ['僅白天活動、完全不需照明的行程'],
    },
    rentalContents: ['頭燈本體', '頭帶', '充電線'],
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
    brand: '野居 CampNest',
    gearType: '帳篷',
    useCase: '適合 2 人露營過夜',
    keySpec: '重量 2.8kg',
    weightKg: 2.8,
    needTags: ['新手推薦', '多人套裝', '兩天一夜', '雨天裝備', '熱門租借'],
    compareSpecs: { weight: '2.8kg', suitablePeople: '2 人', waterproof: '雙層防水' },
    fitGuidance: {
      suitable: ['兩人野營過夜', '春夏秋三季使用'],
      notSuitable: ['高山冬季風雪環境', '超過兩人使用'],
    },
    rentalContents: ['帳篷本體', '營柱', '營釘', '營繩', '地布', '收納袋'],
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
    photo: 'assets/images/gear/sleeping-bag.jpg',
    desc: '舒適溫度 5°C，適合秋冬中低海拔營地過夜。',
    brand: '暖境 WarmField',
    gearType: '睡眠系統',
    useCase: '適合秋冬中低海拔過夜',
    keySpec: '舒適溫度 5°C',
    weightKg: 0.9,
    needTags: ['兩天一夜', '三天以上'],
    compareSpecs: { weight: '900g', comfortTemp: '5°C' },
    fitGuidance: {
      suitable: ['秋冬中低海拔營地過夜', '氣溫約 5°C 上下的行程'],
      notSuitable: ['高山嚴寒環境（需更低溫睡袋）', '夏季悶熱平地紮營'],
    },
    rentalContents: ['睡袋本體', '收納壓縮袋'],
    specs: [
      ['舒適溫度', '約 5°C'],
      ['內填', '90/10 白鵝絨'],
      ['適用身高', '160–190 cm（分兩種長度）'],
      ['收納體積', '直徑 18cm × 高 30cm'],
    ],
  },
  {
    id: 'sleeping-pad',
    name: '充氣睡墊',
    activity: 'camping',
    icon: 'pad',
    difficulty: '新手',
    sizeGuide: null,
    rentPricePerDay: 70,
    buyPrice: 1200,
    stock: 14,
    unit: '個',
    photo: null,
    desc: '充氣式隔絕地面寒氣與碎石感，收納後約水瓶大小。',
    brand: '暖境 WarmField',
    gearType: '睡眠系統',
    useCase: '隔絕地面寒氣與碎石感',
    keySpec: 'R值 3.2',
    weightKg: 0.45,
    needTags: ['輕量化裝備', '兩天一夜'],
    compareSpecs: { weight: '450g', rValue: '3.2' },
    fitGuidance: {
      suitable: ['搭配睡袋隔絕地面寒氣', '重視收納體積的輕量行程'],
      notSuitable: ['車宿或有現成床鋪的住宿'],
    },
    rentalContents: ['睡墊本體', '內建幫浦', '修補包'],
    specs: [
      ['厚度', '5 cm 充氣後'],
      ['R值', '3.2（三季適用）'],
      ['收納尺寸', '直徑 10cm × 長 25cm'],
      ['充氣方式', '內建幫浦，約 20 次按壓'],
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
    brand: '野炊 FireCamp',
    gearType: '炊具',
    useCase: '適合 2–3 人簡易炊事',
    keySpec: '含爐頭與鈦杯',
    weightKg: 0.65,
    needTags: ['多人套裝', '三天以上'],
    compareSpecs: { weight: '650g', suitablePeople: '2–3 人' },
    fitGuidance: {
      suitable: ['2–3 人份簡易炊事', '需要快速煮水泡麵咖啡的行程'],
      notSuitable: ['需要大量炊煮的多人團體', '需自備瓦斯罐（不含在租借內）'],
    },
    rentalContents: ['爐頭', '鈦杯 x2', '防風板', '收納袋'],
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
    photo: 'assets/images/gear/camp-furniture.jpg',
    desc: '一桌四椅，鋁合金骨架，收納後可放入背包側袋。',
    brand: '野居 CampNest',
    gearType: '炊具',
    useCase: '營地用餐與休憩',
    keySpec: '一桌四椅',
    weightKg: 3.2,
    needTags: ['多人套裝'],
    compareSpecs: { weight: '3.2kg', material: '鋁合金' },
    fitGuidance: {
      suitable: ['營地用餐與休憩', '重視露營舒適度的家庭或多人露營'],
      notSuitable: ['需要輕量化背負的重裝縱走'],
    },
    rentalContents: ['折疊桌 x1', '折疊椅 x4', '收納袋'],
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
    photo: 'assets/images/gear/sup-board.jpg',
    desc: '充氣式船身，含船槳與打氣筒，適合平靜水域使用。',
    brand: '潮形 TideForm',
    gearType: '水上安全裝備',
    useCase: '適合平靜水域立式划槳',
    keySpec: '最大承重 110kg',
    weightKg: 9,
    needTags: ['熱門租借'],
    compareSpecs: { weight: '9kg', maxLoad: '110kg', material: '充氣式船身' },
    fitGuidance: {
      suitable: ['平靜湖面、無浪岸邊立式划槳', '體重在 110kg 以內'],
      notSuitable: ['有浪或水流湍急的水域', '完全不會游泳且無教練陪同'],
    },
    rentalContents: ['充氣船身', '船槳', '打氣筒', '修補包', '收納背包'],
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
    photo: 'assets/images/gear/snorkel-set.jpg',
    desc: '乾式呼吸管防嗆水設計，鏡面防霧處理。',
    brand: '潮形 TideForm',
    gearType: '水上安全裝備',
    useCase: '近岸浮潛活動',
    keySpec: '防霧鏡片',
    weightKg: 0.3,
    needTags: ['新手推薦'],
    compareSpecs: { material: '強化玻璃、防霧塗層' },
    fitGuidance: {
      suitable: ['近岸水域浮潛', '第一次嘗試浮潛的新手'],
      notSuitable: ['需要專業裝備的深潛活動'],
    },
    rentalContents: ['面鏡', '乾式呼吸管', '網袋'],
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
    photo: 'assets/images/gear/life-vest.jpg',
    desc: 'CNS 認證浮力材質，前扣式設計方便穿脫。',
    brand: '浮境 FloatLine',
    gearType: '水上安全裝備',
    useCase: '水域活動安全防護',
    keySpec: 'CNS 認證浮力',
    weightKg: 0.4,
    needTags: ['新手推薦'],
    compareSpecs: { sizeRange: 'S/M/L（40–100kg）', material: 'CNS 12989 浮力材質' },
    fitGuidance: {
      suitable: ['所有水域活動的基本安全防護', '體重 40–100kg'],
      notSuitable: ['體重超出 40–100kg 建議範圍（請洽客服確認尺寸）'],
    },
    rentalContents: ['救生衣本體', '可調束帶'],
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
    photo: 'assets/images/gear/dry-bag.jpg',
    desc: '捲口密封防水袋，保護手機、相機等隨身物品。',
    brand: '浮境 FloatLine',
    gearType: '水上安全裝備',
    useCase: '保護隨身電子物品防水',
    keySpec: '容量 20L',
    weightKg: 0.15,
    needTags: ['新手推薦', '輕量化裝備', '雨天裝備'],
    compareSpecs: { capacity: '20L', waterproof: 'IPX6' },
    fitGuidance: {
      suitable: ['保護手機、相機等隨身電子物品', '水上活動或多雨行程'],
      notSuitable: ['需要完全防水浸泡的長時間潛水'],
    },
    rentalContents: ['防水袋本體', '可調背帶'],
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

function stockStatus(stock, unit) {
  const u = unit || '件';
  if (stock <= 0) return { key: 'out-stock', label: '目前額滿' };
  if (stock <= 3) return { key: 'low-stock', label: `剩 ${stock} ${u}` };
  return { key: 'in-stock', label: '庫存充足' };
}

/* Rent and buy draw from separate stock pools (see GEAR_ITEMS.rentalSizeStock / purchaseSizeStock).
   Falls back to the legacy single `sizeStock` field if an item hasn't been migrated. */
function getSizeStockForMode(item, mode) {
  if (mode === 'buy') return item.purchaseSizeStock || item.sizeStock || null;
  return item.rentalSizeStock || item.sizeStock || null;
}

/* ==========================================================================
   Starter kits — bundles of existing GEAR_ITEMS only, no invented products.
   `ratio` = how many people one unit of that item serves (e.g. a 2-person
   tent has ratio 2), used to scale quantity when the shopper changes 人數.
   ========================================================================== */
const KIT_DISCOUNT_RATIO = 0.86;

const STARTER_KITS = [
  {
    id: 'kit-hut-hike',
    name: '兩天一夜山屋入門組',
    scenario: '第一次挑戰過夜健行，投宿山屋不需自行紮營',
    defaultPeople: 1,
    days: 2,
    items: [
      { gearId: 'backpack-60l', ratio: 1 },
      { gearId: 'sleeping-bag', ratio: 1 },
      { gearId: 'sleeping-pad', ratio: 1 },
      { gearId: 'headlamp', ratio: 1 },
      { gearId: 'trekking-poles', ratio: 1 },
    ],
  },
  {
    id: 'kit-camp',
    name: '兩天一夜野營組',
    scenario: '自行紮營過夜，含炊事與睡眠系統',
    defaultPeople: 2,
    days: 2,
    items: [
      { gearId: 'backpack-60l', ratio: 1 },
      { gearId: 'tent-2p', ratio: 2 },
      { gearId: 'sleeping-bag', ratio: 1 },
      { gearId: 'sleeping-pad', ratio: 1 },
      { gearId: 'headlamp', ratio: 1 },
      { gearId: 'stove-set', ratio: 3 },
    ],
  },
  {
    id: 'kit-water',
    name: '水上活動安心組',
    scenario: 'SUP／浮潛等近岸水域活動的安全裝備',
    defaultPeople: 2,
    days: 1,
    items: [
      { gearId: 'sup-board', ratio: 1 },
      { gearId: 'life-vest', ratio: 1 },
      { gearId: 'dry-bag', ratio: 2 },
      { gearId: 'snorkel-set', ratio: 1 },
    ],
  },
];

/* Homepage FAQ summary — a handful of questions spanning categories.
   The full categorised FAQ page is a later phase; this is just the summary. */
const FAQ_HOME_ITEMS = [
  {
    q: '第一次登山需要準備什麼？',
    a: '至少要有合腳的登山鞋與登山杖，行程超過一天再加上背包、睡眠系統與頭燈。不確定的話，建立「智慧裝備清單」會依你的行程天數與經驗自動整理必備品項。',
  },
  {
    q: '兩天一夜需要多大的背包？',
    a: '一般建議 40～60L，實際大小要看是否需要自己背帳篷與炊具。住山屋、不需紮營的話，40～55L 通常就足夠；需要自行紮營露營，60L 會比較保險。',
  },
  {
    q: '尺寸不合怎麼辦？',
    a: '線上尺寸推薦僅供參考，取貨時可以現場試穿／試背，不合適可以現場更換尺寸或款式，不需要事後另外申請退換。',
  },
  {
    q: '建議提前多久預訂？',
    a: '熱門檔期（連假、寒暑假）建議提前 1～2 週預訂；平日或非熱門裝備通常提前 2～3 天預訂即可，實際庫存以商品頁即時顯示為準。',
  },
  {
    q: '押金何時解除？',
    a: '取貨時會進行押金授權，歸還並完成裝備檢查確認無異常後即解除，不會立即請款。',
  },
  {
    q: '遇到天氣不佳可以退款或改期嗎？',
    a: '活動地區發布颱風、豪雨或封山封海公告時，可以免費改期一次，或申請全額退款。',
  },
];

function getKitById(id) {
  return STARTER_KITS.find((k) => k.id === id);
}

function kitItemQuantity(kitItem, people) {
  return Math.max(1, Math.ceil(people / kitItem.ratio));
}

/* Single source of truth for kit pricing — computed from live GEAR_ITEMS prices,
   never hand-typed, so it can't drift out of sync with the catalogue. */
function calcKitPricing(kit, people = kit.defaultPeople) {
  const lines = kit.items.map((kitItem) => {
    const gear = getGearById(kitItem.gearId);
    const quantity = kitItemQuantity(kitItem, people);
    const lineTotal = gear.rentPricePerDay * kit.days * quantity;
    return { gear, quantity, lineTotal };
  });
  const rawTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const kitPrice = Math.round(rawTotal * KIT_DISCOUNT_RATIO);
  const savings = rawTotal - kitPrice;
  return { lines, rawTotal, kitPrice, savings };
}

/* ==========================================================================
   Grouped specs — regroups each item's flat `specs` [label, value] pairs
   into 基本資訊 / 使用能力 / 適合使用者 via a shared label→group lookup,
   so every item's spec table follows the same three buckets consistently.
   ========================================================================== */
const SPEC_GROUP_MAP = {
  '適用行程': '適合使用者', '鞋碼範圍': '適合使用者', '防水等級': '使用能力', '建議搭配': '基本資訊',
  '材質': '基本資訊', '可調長度': '基本資訊', '握把': '基本資訊', '重量': '基本資訊',
  '容量': '使用能力', '適合行程長度': '適合使用者', '背負系統': '基本資訊', '防雨罩': '基本資訊',
  '亮度': '使用能力', '續航': '使用能力', '電力': '基本資訊',
  '適用人數': '使用能力', '搭建時間': '基本資訊', '耐候性': '使用能力',
  '舒適溫度': '使用能力', '內填': '基本資訊', '適用身高': '適合使用者', '收納體積': '基本資訊',
  '厚度': '基本資訊', 'R值': '使用能力', '收納尺寸': '基本資訊', '充氣方式': '基本資訊',
  '內容物': '基本資訊', '適合人數': '使用能力', '瓦斯罐': '基本資訊',
  '組成': '基本資訊', '承重': '使用能力', '尺寸': '基本資訊',
  '適用水域': '使用能力', '配件': '基本資訊', '適用臉型': '適合使用者', '鏡片': '基本資訊', '清潔': '基本資訊',
  '認證': '使用能力', '適用體重': '適合使用者', '穿脫方式': '基本資訊', '顏色': '基本資訊',
  '防水能力': '使用能力', '背負方式': '基本資訊',
};
const SPEC_GROUP_ORDER = ['基本資訊', '使用能力', '適合使用者'];

function groupSpecs(item) {
  const groups = { '基本資訊': [], '使用能力': [], '適合使用者': [] };
  item.specs.forEach(([label, value]) => {
    const group = SPEC_GROUP_MAP[label] || '基本資訊';
    groups[group].push([label, value]);
  });
  return SPEC_GROUP_ORDER.map((name) => ({ name, rows: groups[name] })).filter((g) => g.rows.length > 0);
}

/* ==========================================================================
   Cleaning & quality checklist — per gearType, shown on every product page
   (the homepage cleaning section only shows a 3-category summary).
   ========================================================================== */
const CLEANING_CHECKLISTS = {
  '鞋類與穿戴裝備': ['表面清潔', '鞋墊拆洗（如適用）', '內部除濕', '異味檢查', '防水與功能檢查'],
  '帳篷': ['帳布清潔', '營柱檢查', '營釘數量確認', '防水接縫檢查', '完全乾燥後收納'],
  '睡眠系統': ['內外層清潔', '完全乾燥', '拉鍊／充氣閥檢查', '保暖／支撐狀態確認'],
  '背包': ['內外層清潔', '背負系統檢查', '拉鍊與扣具測試', '防雨罩確認'],
  '登山杖與配件': ['杖身清潔', '快扣結構測試', '腳墊磨耗檢查'],
  '炊具': ['器具清潔消毒', '零件與配件清點', '功能測試'],
  '水上安全裝備': ['沖淡水清潔', '完全乾燥', '浮力／氣密結構檢查', '扣具與縫線檢查'],
};

function getCleaningChecklist(gearType) {
  return CLEANING_CHECKLISTS[gearType] || ['外觀檢查', '清潔除味', '功能測試', '配件確認'];
}

/* ==========================================================================
   Scenario FAQ — broader than FAQ_HOME_ITEMS, tagged so product pages can
   surface only the questions relevant to that item's gear type / activity.
   Items with no gearTypes/activities tag are universal (always eligible).
   ========================================================================== */
const FAQ_ITEMS = [
  { category: '如何選裝備', q: '第一次登山需要準備什麼？', a: '至少要有合腳的登山鞋與登山杖，行程超過一天再加上背包、睡眠系統與頭燈。建立「智慧裝備清單」可依行程天數與經驗自動整理必備品項。', activities: ['hiking'] },
  { category: '如何選裝備', q: '兩天一夜需要多大的背包？', a: '住山屋不需紮營，40～55L 通常足夠；需自行紮營露營則建議 60L 以上，以容納帳篷、睡眠系統與炊具。', gearTypes: ['背包'] },
  { category: '如何選裝備', q: '登山杖應該使用一支還是兩支？', a: '雙杖較能平均分攤上下坡衝擊、提升穩定度，新手與重裝行程建議使用一對；單支多用於平緩步道的輔助。', gearTypes: ['登山杖與配件'] },
  { category: '如何選裝備', q: '兩人帳篷真的適合兩個人嗎？', a: '本款兩人帳空間設計含基本裝備放置空間，若兩人皆攜帶較大背包，建議加租一頂或選擇分開放置裝備。', gearTypes: ['帳篷'] },
  { category: '租借與日期', q: '建議提前多久預訂？', a: '熱門檔期（連假、寒暑假）建議提前 1～2 週；平日或非熱門裝備提前 2～3 天預訂即可，實際庫存以商品頁即時顯示為準。' },
  { category: '租借與日期', q: '租借天數怎麼計算？', a: '以取貨日至歸還日之間的晚數計算，例如 8 月 1 日取貨、8 月 4 日歸還，共計 3 天。' },
  { category: '租借與日期', q: '可以延長租借嗎？', a: '若裝備無其他預約衝突，可在租借中於「我的訂單」申請延長租期，實際天數以門市確認為準。' },
  { category: '租借與日期', q: '可以修改日期嗎？', a: '訂單成立後如需修改日期，建議提前聯繫調整；同一筆預約中的租借商品需維持相同日期區間。' },
  { category: '尺寸與試穿', q: '尺寸不合怎麼辦？', a: '線上尺寸推薦僅供參考，取貨時可以現場試穿／試背，不合適可以現場更換尺寸或款式，不需要事後另外申請退換。', sizedOnly: true },
  { category: '尺寸與試穿', q: '可以先到門市試穿嗎？', a: '可以，商品頁提供「預約到店試穿／試背」功能，選擇門市與時段即可預約。', sizedOnly: true },
  { category: '尺寸與試穿', q: '尺寸推薦是否保證合適？', a: '尺寸推薦是根據常見數據計算的參考建議，不同品牌楦型與個人習慣仍有差異，取貨時仍建議實際試穿確認。', sizedOnly: true },
  { category: '清潔與衛生', q: '鞋子與睡袋如何清潔？', a: '鞋類會拆洗鞋墊、除濕消毒；睡眠系統會完成內外層清潔與完全乾燥，皆通過功能檢查後才重新上架。', gearTypes: ['鞋類與穿戴裝備', '睡眠系統'] },
  { category: '清潔與衛生', q: '裝備是否會有使用痕跡？', a: '租借裝備可能有輕微外觀使用痕跡，但功能、清潔與安全相關項目皆通過檢查才會重新上架。' },
  { category: '清潔與衛生', q: '租借前是否會檢查？', a: '每件裝備歸還後都會完成外觀檢查、清潔除味、乾燥除濕、功能測試與配件確認，才會重新上架出租。' },
  { category: '押金與損壞', q: '押金何時解除？', a: '取貨時會進行押金授權，歸還並完成裝備檢查確認無異常後即解除，不會立即請款。' },
  { category: '押金與損壞', q: '正常使用痕跡需要賠償嗎？', a: '正常使用造成的輕微痕跡不另外收費，遺失或不當使用造成的損壞則會依維修或重置費用處理。' },
  { category: '取消與退款', q: '遇到天氣不佳可以退款或改期嗎？', a: '活動地區發布颱風、豪雨或封山封海公告時，可免費改期一次，或申請全額退款。' },
  { category: '先租後買', q: '先租後買折抵怎麼計算？', a: '已付租金的 60% 可折抵購買價，最高折抵購買價的 50%，折抵金額會在完成歸還檢查後加入帳戶。' },
];

function getProductFaqItems(item) {
  const matched = FAQ_ITEMS.filter((f) => {
    if (f.sizedOnly && !item.sizeGuide) return false;
    if (f.gearTypes && !f.gearTypes.includes(item.gearType)) return false;
    if (f.activities && !f.activities.includes(item.activity)) return false;
    return true;
  });
  const specific = matched.filter((f) => f.gearTypes || f.activities);
  const universal = matched.filter((f) => !f.gearTypes && !f.activities);
  return [...specific, ...universal].slice(0, 5);
}
