import type { RawArticle } from "@/lib/digest/schema";

/** Fallback raw articles when RSS is thin — cleaned, no duplicate shells. */
export const SEED_RAW_HK: RawArticle[] = [
  {
    title: "華爾街股票在油價與債券收益率波動後回升",
    summary:
      "週三華爾街主要指數早盤回升，因對伊朗威脅使油價與十年期美債收益率短暫回落，緩解通脹壓力，市場享受較廣泛反彈。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "美國股市因就業報告強於預期而收低",
    summary:
      "上月非農就業意外增加16.2萬職位，提高聯儲局本月加息預期；標普500跌0.4%，通脹率因油價及中東局勢仍高於3%。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "香港灰色加密幣自助機詐騙風險",
    summary:
      "鰂魚涌洗衣店內出現標稱可購比特幣、狗狗幣的自助機，投入港幣即可入帳數位錢包；機器遍佈全城但缺乏監管，易被用於詐騙與洗錢。",
    source: "SCMP Hong Kong",
    link: "https://www.scmp.com/",
    regionHint: "hk",
  },
  {
    title: "香港股市盤整受債券油價雙重壓力",
    summary:
      "恒生指數基本持平，恒生科技跌0.7%；內地滬深三大指數下跌，受全球債券拋售及油價上升影響，Shein股價再跌5%。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "美國股市下跌，油價因伊朗衝突升溫",
    summary:
      "布倫特原油突破每桶90美元，美國襲擊伊朗火箭發射器後伊朗報復，同時受美聯儲主席鷹派言論影響，歐美股市下跌。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "港股穩固分化，利率憂慮緩和帶動科技反彈",
    summary:
      "恒生指數跌1.7%報25,650點，但科技指數升2.3%；美聯儲官員華勒表示若通脹緩和則傾向維持利率不變，阿里巴巴升2.4%。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "習近平首次十年訪埃及會晤塞西",
    summary:
      "雙方預計簽署人工智能、運輸、製造等協議，並探討蘇伊士運河經濟區開發與能源基建合作，同時討論中東局勢與海上貿易安全。",
    source: "RTHK Greater China",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "美伊衝突升級亞洲股市廣泛下跌",
    summary:
      "港股開盤跌0.19%，上證、深證、KOSPI、日經齊跌；避險資金流向美元與日圓，新興市場資金外流壓力加大。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "金管局關注聯繫匯率下拆息波動",
    summary:
      "香港銀行同業拆息隨美元利率預期起伏，分析指若美債收益率高位徘徊，本地按揭與企業融資成本將維持偏硬，影響置業與中小企周轉。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
  {
    title: "香港保險業評估中東航運保費上行風險",
    summary:
      "地緣衝突推高霍爾木茲相關航線戰爭險報價，本地再保險與貿易融資機構開始審視中東貨物保額與信用額度，以防索賠與違約鏈蔓延。",
    source: "RTHK Finance",
    link: "https://news.rthk.hk/",
    regionHint: "hk",
  },
];

export const SEED_RAW_INTL: RawArticle[] = [
  {
    title: "台灣譴責中國在太平洋論壇的戰狼行為",
    summary:
      "台灣在太平洋島國論壇譴責戰狼外交，指導彈試射引發安全關切；各國領袖表達關切但未能一致譴責，凸顯區域分歧。",
    source: "Google News World",
    link: "https://news.google.com/",
    regionHint: "intl",
  },
  {
    title: "澳洲工黨擬立法監管社群媒體演算法",
    summary:
      "通訊部長預計提出數位照顧義務草案，規範演算法以降低有害內容，反對黨警告或濫用審查權，兩黨爭論升溫。",
    source: "The Guardian World",
    link: "https://www.theguardian.com/",
    regionHint: "intl",
  },
  {
    title: "美國財政部計畫回購平時兩倍的長期國債",
    summary:
      "財政部宣布加大長期國債回購，可能影響美元流動性與債息，並引發與聯準會政策協調的市場討論。",
    source: "NPR Economy",
    link: "https://www.npr.org/",
    regionHint: "intl",
  },
  {
    title: "日圓因日本央行可能加息而急升",
    summary:
      "日圓兌美元上漲逾2%，觸及一個月高位155.57，避險情緒升溫，分析指將影響亞洲出口競爭格局。",
    source: "The Guardian World",
    link: "https://www.theguardian.com/",
    regionHint: "intl",
  },
  {
    title: "澳洲反對黨領袖敦促強硬移民政策",
    summary:
      "反對黨承諾針對濫難民申訴並擬定完整移民方案，同時批評教育經費創新高但學生標準下降。",
    source: "The Guardian World",
    link: "https://www.theguardian.com/",
    regionHint: "intl",
  },
  {
    title: "算法關閉開關不足須建立數位照護責任",
    summary:
      "報導指單靠關閉開關無法遏制成癮設計，應建立數位照護責任，讓科技公司為平台安全負責。",
    source: "The Guardian Business",
    link: "https://www.theguardian.com/",
    regionHint: "intl",
  },
  {
    title: "心臟藥物Pelacarsen試驗失敗震盪生技股",
    summary:
      "諾華與Ionis合作藥物未達主要終點，未顯著降低心血管事件風險，相關藥企股價盤後下跌。",
    source: "Google News Business",
    link: "https://news.google.com/",
    regionHint: "intl",
  },
  {
    title: "布倫特原油站上九十美元 mag 市場重估通脹路徑",
    summary:
      "中東供應擔憂推升油價，交易員重新定價通脹黏性與央行利率路徑，風險資產波動加大。",
    source: "NPR Economy",
    link: "https://www.npr.org/",
    regionHint: "intl",
  },
  {
    title: "全球資金流向美元避險新興市場承壓",
    summary:
      "地緣與利率不確定性帶動資金回流美元資產，亞洲股市與貨幣普遍受壓，跨國配置轉趨防守。",
    source: "Google News Business",
    link: "https://news.google.com/",
    regionHint: "intl",
  },
  {
    title: "歐美就大型科技平台演算法問責展開政策對話",
    summary:
      "多國討論要求平台對推薦系統危害負責，焦點包括青少年保護與虛假資訊放大，或推高合規成本。",
    source: "The Guardian World",
    link: "https://www.theguardian.com/",
    regionHint: "intl",
  },
];
