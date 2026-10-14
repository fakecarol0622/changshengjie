// ===== 称号系统 =====
// 达成条件自动获得；稀有度 r：1 凡品 / 2 良品 / 3 珍品 / 4 极品 / 5 传说
export interface TitleCtx {
  major: number
  power: number
  rank: number // 天骄榜排名（1 = 第一）
  lingshi: number
  xianyu: number
  pulls: number // 挖掘次数
  bestQ: number // 图鉴最高品质
  codexCount: number
  sect: boolean // 已开宗立派
  reinc: number
  beasts: number
  treasures: number
  lovers: number
  masters: number
  swordFlavor: number // 已穿戴剑类装备数
  famCatch: number // 凝形次数
  famKinds: number // 收服精怪种类
  gachaLegend: number // 抽卡传说次数
  payTotal: number // 累计充值仙玉
  clones: number // 已凝练分身数（阳神/阴身）
  yaoRank: number // 妖王殿今日排名（0=未参与）
  veinLv: number // 烛龙脉等级
}

export interface TitleDef {
  id: string
  n: string
  desc: string
  r: 1 | 2 | 3 | 4 | 5
  ok: (c: TitleCtx) => boolean
}

export const TITLE_RARITY = ['', '凡品', '良品', '珍品', '极品', '传说']

export const TITLES: TitleDef[] = [
  { id: 'chujiang', n: '初入江湖', desc: '突破至炼气期', r: 1, ok: c => c.major >= 1 },
  { id: 'zhuji', n: '筑基修士', desc: '突破至筑基期', r: 1, ok: c => c.major >= 2 },
  { id: 'jindan', n: '小有所成', desc: '突破至金丹期', r: 2, ok: c => c.major >= 3 },
  { id: 'yuanying', n: '元婴老怪', desc: '突破至元婴期', r: 2, ok: c => c.major >= 4 },
  { id: 'huashen', n: '化神真君', desc: '突破至化神期', r: 3, ok: c => c.major >= 5 },
  { id: 'lianxu', n: '问道炼虚', desc: '突破至炼虚期', r: 3, ok: c => c.major >= 6 },
  { id: 'dacheng', n: '大乘老祖', desc: '突破至大乘期', r: 4, ok: c => c.major >= 8 },
  { id: 'xianren', n: '陆地神仙', desc: '飞升成仙', r: 5, ok: c => c.major >= 10 },
  { id: 'qiangzhe', n: '一方强者', desc: '战力达到 1 万', r: 3, ok: c => c.power >= 10000 },
  { id: 'hanshan', n: '力可撼山', desc: '战力达到 1000 万', r: 4, ok: c => c.power >= 1e7 },
  { id: 'fujia', n: '富甲一方', desc: '持有灵石 10 万', r: 2, ok: c => c.lingshi >= 1e5 },
  { id: 'wanguan', n: '腰缠万贯', desc: '持有仙玉 200', r: 2, ok: c => c.xianyu >= 200 },
  { id: 'kuangwang', n: '矿脉之王', desc: '挖掘灵脉 500 次', r: 3, ok: c => c.pulls >= 500 },
  { id: 'ouhuang', n: '天选欧皇', desc: '获得 15 品以上装备', r: 5, ok: c => c.bestQ >= 15 },
  { id: 'shoucang', n: '收藏大家', desc: '图鉴收录 60 件装备', r: 3, ok: c => c.codexCount >= 60 },
  { id: 'kuishou', n: '天骄魁首', desc: '登顶天骄榜第 1 名', r: 4, ok: c => c.rank === 1 },
  { id: 'zongshi', n: '一派宗师', desc: '开宗立派，自任掌门', r: 3, ok: c => c.sect },
  { id: 'lunhui', n: '轮回旅人', desc: '转世 1 次', r: 2, ok: c => c.reinc >= 1 },
  { id: 'yushou', n: '御兽大师', desc: '同时拥有 3 只灵兽', r: 3, ok: c => c.beasts >= 3 },
  { id: 'fabao', n: '法宝收藏家', desc: '拥有 3 件法宝', r: 3, ok: c => c.treasures >= 3 },
  { id: 'juanlv', n: '神仙眷侣', desc: '与天骄结为道侣', r: 4, ok: c => c.lovers >= 1 },
  { id: 'taoli', n: '桃李天下', desc: '收徒或拜师', r: 3, ok: c => c.masters >= 1 },
  { id: 'jiandao', n: '剑道宗师', desc: '同时穿戴 3 件剑类装备', r: 4, ok: c => c.swordFlavor >= 3 },
  { id: 'zhuoyao', n: '捉妖师', desc: '凝形精怪 50 次', r: 3, ok: c => c.famCatch >= 50 },
  { id: 'wanyao', n: '万妖俯首', desc: '收服 12 种精怪', r: 4, ok: c => c.famKinds >= 12 },
  { id: 'xianyuan', n: '仙缘深厚', desc: '寻仙问道抽出传说大奖', r: 4, ok: c => c.gachaLegend >= 1 },
  { id: 'haoke', n: '一掷千金', desc: '累计充值仙玉 5000', r: 4, ok: c => c.payTotal >= 5000 },
  { id: 'yangshen', n: '阳神出窍', desc: '凝练出阳神分身', r: 3, ok: c => c.clones >= 1 },
  { id: 'sanqing', n: '一气化三清', desc: '本源分化，阴阳双分身齐备', r: 4, ok: c => c.clones >= 2 },
  { id: 'yaowang', n: '妖王克星', desc: '妖王殿伤害榜登顶（当日）', r: 4, ok: c => c.yaoRank === 1 },
  { id: 'baiyao', n: '力压群妖', desc: '妖王殿伤害榜进入前三（当日）', r: 3, ok: c => c.yaoRank >= 1 && c.yaoRank <= 3 },
  { id: 'shumai', n: '疏脉师', desc: '烛龙脉疏通至 18 级（玄脉）', r: 3, ok: c => c.veinLv >= 18 },
  { id: 'zulong', n: '祖脉之主', desc: '烛龙脉疏通至 54 级（祖龙脉）', r: 5, ok: c => c.veinLv >= 54 },
]
