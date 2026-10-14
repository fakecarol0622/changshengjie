// ===== 世界数据：副本 / 活动日历 / 奇遇 / 世界消息 / 灵根体质出身 =====
import type { Mods } from '../types'

// ---------- 副本 ----------
export interface DungeonDef {
  id: string
  n: string
  type: string
  desc: string
  daily?: number
  weekly?: number
  special?: 'tower' | 'pvp' | 'chaos'
  enemies: string[]
  rewards: string
}
export const DUNGEONS: DungeonDef[] = [
  { id: 'kuangku', n: '浮尘矿窟', type: '资源', desc: '矿脉纵横，可采灵脉石与粗矿', daily: 6, enemies: ['矿窟妖鼠', '石魈', '矿灵', '土行蜈'], rewards: '灵脉石、装备' },
  { id: 'jianzhong', n: '万剑冢', type: '装备', desc: '万剑埋骨之地，剑意森然', daily: 4, enemies: ['剑冢怨灵', '断剑老鬼', '守冢剑奴', '残锋战魂'], rewards: '攻击向装备、剑意' },
  { id: 'hantan', n: '星落寒潭', type: '装备', desc: '天外陨星坠处，寒气刺骨', daily: 4, enemies: ['寒潭水鬼', '星陨兽', '冰晶螭', '玄龟'], rewards: '防御向装备、星陨石' },
  { id: 'youlins', n: '万兽幽林', type: '灵兽', desc: '古林深处兽吼不绝', daily: 5, enemies: ['狂暴野猪', '赤目狼王', '幽林蟒', '三尾灵狐'], rewards: '灵兽蛋、兽魂' },
  { id: 'danxia', n: '丹霞秘境', type: '丹药', desc: '丹霞蒸蔚，药香弥漫', daily: 5, enemies: ['药园妖藤', '丹毒傀儡', '守鼎蟾蜍', '药灵'], rewards: '丹药材料、丹方残页' },
  { id: 'qihun', n: '器魂深渊', type: '法宝', desc: '深渊底部器魂悲鸣', daily: 4, enemies: ['器魂怨影', '断戈魔像', '熔炉鬼工', '剑胎'], rewards: '法宝碎片、器魂' },
  { id: 'langhuan', n: '琅嬛玉阁', type: '功法', desc: '上古藏书之地，玉简林立', daily: 3, enemies: ['守阁文魂', '玉简傀儡', '琅嬛书灵', '墨煞'], rewards: '功法残页、神通' },
  { id: 'tower', n: '镇妖九重塔', type: '爬塔', desc: '塔镇万妖，层层凶险', special: 'tower', enemies: ['镇妖塔妖将', '塔灵', '千年老妖', '幽冥塔主'], rewards: '洗练石、共鸣石' },
  { id: 'xianwu', n: '仙武论道台', type: 'PVP', desc: '以武会友，以道争锋', weekly: 1, special: 'pvp', enemies: [], rewards: '仙武积分、排名奖励' },
  { id: 'leiyuan', n: '天劫雷渊', type: '挑战', desc: '雷渊之中孕育渡劫造化', weekly: 4, enemies: ['雷渊兽', '劫雷精', '雷罚使', '太古雷兽'], rewards: '突破材料、渡劫符' },
  { id: 'guxu', n: '太古遗墟', type: '探索', desc: '上古遗迹，杀机与造化并存', weekly: 2, enemies: ['太古守卫', '废墟巨像', '遗墟邪灵', '上古凶兽'], rewards: '稀有灵纹、至宝碎片' },
  { id: 'chaos', n: '混沌之门', type: '终局', desc: '门后混沌，藏无尽造化', special: 'chaos', enemies: ['混沌魔影', '虚空吞噬者', '混沌之子', '天道残念'], rewards: '全资源、隐藏结局' },
]

export interface DiffDef { n: string; mult: number; lvOff: number; rw: number }
export const DIFFS: DiffDef[] = [
  { n: '普通', mult: 1, lvOff: 0, rw: 1 },
  { n: '困难', mult: 1.5, lvOff: 2, rw: 1.8 },
  { n: '噩梦', mult: 2.3, lvOff: 5, rw: 3 },
  { n: '炼狱', mult: 3.6, lvOff: 9, rw: 5 },
]

// ---------- 活动日历（游戏月=10 天，压缩映射 GDD 每月窗口） ----------
export const CYCLE_DAYS = 10
export interface ActivityDef { id: string; n: string; s: number; e: number; desc: string }
export const ACTIVITIES: ActivityDef[] = [
  { id: 'tide', n: '灵脉潮汐·涌', s: 0, e: 2.5, desc: '灵脉挖掘出货率+40%，暴动概率翻倍' },
  { id: 'beast', n: '万兽潮·临', s: 2.5, e: 5, desc: '万兽幽林产出翻倍，限定灵兽蛋' },
  { id: 'wudao', n: '仙武论道·争', s: 5, e: 7.5, desc: '论道台对局积分翻倍，排名悬赏' },
  { id: 'trib', n: '天劫雷渊·降', s: 7.5, e: 10, desc: '渡劫成功率+20%，雷渊必出突破材料' },
]
export function cycleDay(now: number): number {
  return (now / 86400000) % CYCLE_DAYS
}
export function cycleIndex(now: number): number {
  return Math.floor(now / 86400000 / CYCLE_DAYS)
}
export function activeActivity(now: number): ActivityDef | null {
  const d = cycleDay(now)
  return ACTIVITIES.find(a => d >= a.s && d < a.e) || null
}
export function chaosOpen(now: number): boolean {
  const d = cycleDay(now)
  return cycleIndex(now) % 3 === 2 && d >= 9
}

// ---------- 世界消息模板 ----------
export const WORLD_MSGS: string[] = [
  '{n1}在剑冢拔出了仙兵「{item}」',
  '{n1}突破{realm}失败，修为大损',
  '{n1}与{n2}因机缘结仇，约战天骄榜',
  '{n1}挖出至宝，坊市一片哗然',
  '{n1}在太古遗墟重伤而归',
  '{n1}庆云缭绕，成功突破{realm}！',
  '{n1}拍卖会上豪掷万金，拍走「{item}」',
  '{n1}收{n2}为徒，传下衣钵',
  '{n1}与{n2}结为道侣，双修论道',
  '{n1}走火入魔，屠戮一方后被镇压',
  '{n1}于东海之滨顿悟，修为暴涨',
  '{n1}的灵兽「{beast}」突然进化！',
  '{n1}挑战镇妖塔第九重，惜败而归',
  '{n1}炼丹炸炉，丹房化为灰烬',
  '{n1}寻得上古洞府，满载而归',
  '{n1}得罪了{n2}，被追杀三千里',
  '{n1}坐化于洞府之中，享年{age}岁',
  '{n1}渡劫失败，兵解转世',
  '{n1}的「{item}」被{n2}夺去，怀恨在心',
  '{n1}布下大阵，静待天劫降临',
  '{n1}在万兽幽林降服一头「{beast}」',
  '{n1}练成神功，天地异象频现',
  '{n1}散尽家财求一枚破障丹',
  '{n1}与{n2}相约论剑，胜负未分',
  '坊市传闻：{n1}手中有至宝碎片待价而沽',
  '{n1}破除心魔，道心更加圆满',
]

// ---------- 灵根 ----------
export interface RootDef { n: string; mult: number; w: number; elems: number; desc: string }
export const ELEMS = ['金', '木', '水', '火', '土']
export const SPIRIT_ROOTS: RootDef[] = [
  { n: '五灵根', mult: 1.0, w: 40, elems: 5, desc: '五行俱全，资质平平，修行缓慢' },
  { n: '四灵根', mult: 1.12, w: 25, elems: 4, desc: '资质平平，胜在根基全面' },
  { n: '三灵根', mult: 1.25, w: 15, elems: 3, desc: '小有资质，可堪一修' },
  { n: '双灵根', mult: 1.45, w: 10, elems: 2, desc: '双系同修，资质上佳' },
  { n: '单灵根', mult: 1.8, w: 6, elems: 1, desc: '天资卓绝，修行一日千里' },
  { n: '天灵根', mult: 2.3, w: 2.5, elems: 1, desc: '万中无一的绝世之资' },
  { n: '变异灵根', mult: 2.6, w: 1.2, elems: 1, desc: '异种灵根，天生异象' },
  { n: '混沌灵根', mult: 3.2, w: 0.3, elems: 5, desc: '传说中的至高灵根，演化混沌' },
]

// ---------- 体质（觉醒） ----------
export interface PhysiqueDef { n: string; w: number; desc: string; mods: Mods }
export const PHYSIQUES: PhysiqueDef[] = [
  { n: '荒古圣体', w: 8, desc: '气血根基雄厚无比', mods: { hpP: 30, defP: 10 } },
  { n: '混沌道体', w: 4, desc: '万法加身，融会贯通', mods: { allP: 15 } },
  { n: '太阴之体', w: 14, desc: '月华眷顾，静修极快', mods: { cultP: 12 } },
  { n: '太阳之体', w: 14, desc: '阳炎焚天，攻势凌厉', mods: { atkP: 12 } },
  { n: '剑体', w: 12, desc: '天生剑骨，剑意自生', mods: { atkP: 20, critAdd: 3 } },
  { n: '雷体', w: 10, desc: '雷霆淬体，迅疾如雷', mods: { spdP: 18, critAdd: 5 } },
]
export const PHYS_CHANCE = 0.08 // 初始觉醒概率

// ---------- 出身 ----------
export interface OriginDef { n: string; desc: string; attrs?: Record<string, number>; lingshi?: number; lingmai?: number; tech?: boolean }
export const ORIGINS: OriginDef[] = [
  { n: '散修弃婴', desc: '无依无靠，天养地育（气运+2，灵石+200）', attrs: { qiYun: 2 }, lingshi: 200 },
  { n: '山村猎户', desc: '自幼山野，筋骨强健（根骨+2）', attrs: { genGu: 2 } },
  { n: '没落世家', desc: '家道中落，尚有薄财（灵石+800，魅力+1）', attrs: { meiLi: 1 }, lingshi: 800 },
  { n: '将门之后', desc: '军伍磨砺，胆识过人（根骨+1，神识+1）', attrs: { genGu: 1, shenShi: 1 } },
  { n: '书香门第', desc: '幼读经史，慧根深种（悟性+2）', attrs: { wuXing: 2 } },
  { n: '仙宗遗孤', desc: '宗门覆灭，流落人间（神识+1，悟性+1，带一本功法残卷）', attrs: { shenShi: 1, wuXing: 1 }, tech: true },
]

// ---------- 奇遇 ----------
export interface EncRes {
  text: string
  cult?: number
  lingshi?: number
  lingmai?: number
  xilian?: number
  gongming?: number
  attr?: [string, number]
  daoXin?: number
  yeLi?: number
  gongDe?: number
  mat?: [string, number]
  equipQ?: [number, number]
  techTier?: number
  beast?: boolean
  treasure?: boolean
  hpPct?: number
  fight?: number // 敌人等级偏移，触发战斗
  jieQi?: number
  reincP?: number
  xianyu?: number
}
export interface EncOption { label: string; res: EncRes }
export interface EncounterDef {
  id: string
  q: 1 | 2 | 3 | 4 | 5
  title: string
  text: string
  options: EncOption[]
}
export const ENC_NAMES = ['凡缘', '灵缘', '仙缘', '道缘', '混沌缘']
export const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'e1', q: 1, title: '路边灵草', text: '山道石缝间生着一株莹莹发光的灵草，叶脉似有流光。',
    options: [
      { label: '小心采下', res: { text: '你小心采下灵草，入手清凉。', mat: ['ningcao', 2] } },
      { label: '不夺天材，任其生长', res: { text: '你摇了摇头，转身离去，心中一片澄澈。', daoXin: 1 } },
    ],
  },
  {
    id: 'e2', q: 1, title: '残破玉简', text: '溪底淤泥中埋着一枚残破玉简，隐约有灵光流转。',
    options: [
      { label: '运灵力解读', res: { text: '你以灵力浸润玉简，一段古老的心法流入识海。', cult: 60 } },
      { label: '收起来日后再说', res: { text: '你收好玉简，打算改日再研究。', lingshi: 50 } },
    ],
  },
  {
    id: 'e3', q: 1, title: '迷路商队', text: '一队凡人商队在山中迷了路，正焦急地四处张望。',
    options: [
      { label: '为他们指路', res: { text: '你指点迷津，商队千恩万谢，硬塞给你一袋灵石。', lingshi: 120, gongDe: 2 } },
      { label: '视而不见', res: { text: '凡尘俗事，与你何干。你径直离开。', daoXin: -1 } },
    ],
  },
  {
    id: 'e4', q: 1, title: '山间拳谱', text: '破庙残壁后刻着一套粗浅拳法，笔画古拙。',
    options: [
      { label: '照着比划', res: { text: '你依样挥拳，汗出如浆，筋骨隐隐发热。', attr: ['genGu', 1] } },
      { label: '刻录下来', res: { text: '你把拳谱刻在随身竹片上，或许日后有用。', mat: ['fuwen', 1] } },
    ],
  },
  {
    id: 'e5', q: 2, title: '灵泉沐浴', text: '半山腰有一眼灵泉，泉水汩汩，灵气氤氲。',
    options: [
      { label: '入泉修炼', res: { text: '你浸泡灵泉之中，灵气自毛孔涌入，修为大涨。', cult: 260 } },
      { label: '取水带走', res: { text: '你以玉瓶取了满满一瓶灵泉水。', mat: ['lingye', 2], lingmai: 2 } },
    ],
  },
  {
    id: 'e6', q: 2, title: '受伤的散修', text: '一名散修倒在血泊中，气若游丝，腰间储物袋若隐若现。',
    options: [
      { label: '出手救治', res: { text: '你以灵力为他稳住伤势，散修感激涕零，赠你一份谢礼。', gongDe: 8, mat: ['yuzhi', 2], lingmai: 3 } },
      { label: '取走储物袋', res: { text: '你不动声色地取走储物袋，转身离开。身后传来一声微弱的诅咒。', yeLi: 15, lingshi: 400, daoXin: -2 } },
    ],
  },
  {
    id: 'e7', q: 2, title: '古碑参悟', text: '荒野中立着一块斑驳古碑，碑文似道非道，观之令人目眩。',
    options: [
      { label: '凝神参悟', res: { text: '你静立碑前整整三日，忽有会心，道心愈坚。', daoXin: 3, cult: 180 } },
      { label: '拓印碑文', res: { text: '你将碑文拓印下来，或许可换些灵石。', lingshi: 200, mat: ['fuwen', 1] } },
    ],
  },
  {
    id: 'e8', q: 2, title: '洞窟灵兽', text: '山洞深处传来幼兽的呜咽声，一只毛色奇异的小兽蜷缩其中。',
    options: [
      { label: '喂食疗伤，结个善缘', res: { text: '小兽蹭了蹭你的掌心，眼中满是依恋——它认你为主了！', beast: true } },
      { label: '猎杀取材料', res: { text: '幼兽的皮毛与骨血皆为上品材料。你心中却掠过一丝不忍。', mat: ['shougu', 3], yeLi: 3 } },
    ],
  },
  {
    id: 'e9', q: 3, title: '老爷爷传功', text: '一位白发老者拦住去路：「小友筋骨奇佳，可愿承老夫衣钵？」',
    options: [
      { label: '恭敬拜谢，接受传功', res: { text: '老者一指点在你眉心，一门玄妙功法烙印识海。', techTier: 3 } },
      { label: '心存戒备，婉言谢绝', res: { text: '你拱手谢过，老者捋须而笑：「谨慎是好事。」', daoXin: 2, cult: 200 } },
    ],
  },
  {
    id: 'e10', q: 3, title: '上古洞府', text: '地动山摇间，一座尘封洞府露出石门，门上禁制早已残破。',
    options: [
      { label: '破门而入', res: { text: '洞府深处，一室灵光——竟是前人手泽所炼的宝器！', equipQ: [8, 11], lingshi: 300 } },
      { label: '谨慎离去', res: { text: '你思忖再三，觉得机缘背后或有凶险，悄然离去。', daoXin: 1, lingshi: 100 } },
    ],
  },
  {
    id: 'e11', q: 3, title: '陷阵夺宝', text: '一座迷阵中央悬浮着半截古剑，阵纹明灭不定。',
    options: [
      { label: '强破阵法', res: { text: '你以蛮力破阵，阵眼崩碎，古剑入手！', treasure: true } },
      { label: '寻阵眼前行', res: { text: '你循阵理而行，安然取宝，毫发无损。', treasure: true, daoXin: 1 } },
    ],
  },
  {
    id: 'e12', q: 3, title: '灵脉暴走', text: '附近灵脉突然暴动，地涌灵潮，附近修士纷纷赶来。',
    options: [
      { label: '镇压灵脉', res: { text: '你施法镇压暴走的灵脉，灵潮退去前的馈赠尽入囊中。', lingmai: 30, gongDe: 5 } },
      { label: '趁乱收灵', res: { text: '你趁乱收取了大把灵脉石，溜之大吉。', lingmai: 45, yeLi: 2 } },
    ],
  },
  {
    id: 'e13', q: 4, title: '顿悟时刻', text: '月明星稀，你静坐山巅，忽觉天地间游丝般的道韵触手可及。',
    options: [
      { label: '顺其自然，静心参悟', res: { text: '一夜顿悟，胜却苦修十年！', cult: 1.0, daoXin: 4 } },
      { label: '强行捕捉道韵', res: { text: '你强行摄道，险些反噬，好在修为亦有精进。', cult: 0.5, hpPct: -20, jieQi: 2 } },
    ],
  },
  {
    id: 'e14', q: 4, title: '前辈论道', text: '云海之上，一位前辈高人邀你论道，谈笑间直指大道本源。',
    options: [
      { label: '虚心求教', res: { text: '前辈抚掌而笑，传你一门神通要诀。', techTier: 5, daoXin: 2 } },
      { label: '针锋相对，各抒己见', res: { text: '你与前辈舌战三日，虽落下风，却道心通明。', daoXin: 6, cult: 0.3 } },
    ],
  },
  {
    id: 'e15', q: 4, title: '魔修伏杀', text: '三名魔修自暗处扑出，血光漫天：「留下储物袋，饶你不死！」',
    options: [
      { label: '杀出一条血路', res: { text: '你与魔修恶战一场，血染长空，终将其尽数斩杀。', fight: 2, yeLi: 8, lingshi: 600, mat: ['shouhun', 2] } },
      { label: '遁走避战', res: { text: '你施展身法遁走，虽保全性命，却被魔气侵体。', hpPct: -25, daoXin: -1 } },
    ],
  },
  {
    id: 'e16', q: 4, title: '天降陨星', text: '一颗流星划破夜空坠入山野，砸出丈许深坑，星核犹在灼热发光。',
    options: [
      { label: '抢在他人之前取走', res: { text: '你抢先抱走星核，熔金的道路铺向远方。', mat: ['xingyunTie', 3], xingyun: 2 } },
      { label: '就地吸纳星力', res: { text: '你盘膝坐于坑中，吸纳陨星余韵，体魄为之一新。', attr: ['genGu', 2] } },
    ],
  },
  {
    id: 'e17', q: 5, title: '天道碎片', text: '虚空中漂浮着一枚法则碎片，明灭间照见万古洪荒，触之或有大造化，亦有大劫难。',
    options: [
      { label: '融入己身', res: { text: '碎片入体，你窥见了天道一角，却也逆了天意——天劫值涌动。', attr: ['shenShi', 3], jieQi: 8, cult: 2.0 } },
      { label: '封印收藏', res: { text: '你小心封印碎片，此物或有大用。天道眷顾了你的敬畏。', gongDe: 30, reincP: 1 } },
    ],
  },
  {
    id: 'e18', q: 5, title: '轮回旧忆', text: '梦中你见到前世的自己：同样的山巅，同样的仰望星空。醒来时，枕边多了一滴泪。',
    options: [
      { label: '追寻旧忆', res: { text: '你循着记忆碎片回溯，前世修行感悟涌入心田。', cult: 3.0, reincP: 1 } },
      { label: '放下执念', res: { text: '前尘如烟，惟道永存。你的道心圆满无瑕。', daoXin: 8 } },
    ],
  },
  {
    id: 'e19', q: 1, title: '破庙夜雨', text: '夜雨骤至，你避入一间破庙。神像残破，香火却未断绝。',
    options: [
      { label: '添一炷香', res: { text: '你拂去神像积尘，添上一炷残香。冥冥中似有注视，福泽绵长。', gongDe: 5, cult: 0.3 } },
      { label: '搜找香油钱', res: { text: '你从神像基座里找出些碎银，心里却多了份说不清的重。', lingshi: 200, yeLi: 2 } },
    ],
  },
  {
    id: 'e20', q: 2, title: '狐仙讨酒', text: '月下一只白狐化作人形，拦住去路，乌黑的眼瞳里只有一件事：讨酒喝。',
    options: [
      { label: '慷慨赠酒', res: { text: '白狐大醉而去，临走时赠你一团纯粹的月华之力。', cult: 0.5, daoXin: 1 } },
      { label: '讨要买路钱', res: { text: '白狐笑而不语，丢下一袋碎银消失在山雾中。', lingshi: 300, yeLi: 2 } },
    ],
  },
  {
    id: 'e21', q: 2, title: '路遗钱袋', text: '官道旁躺着鼓囊囊的钱袋，四周无人，雨后的泥地里只有你一行脚印。',
    options: [
      { label: '原地等候失主', res: { text: '半日后，一位行商满头大汗地寻来，千恩万谢奉上重礼。', gongDe: 10, lingshi: 150 } },
      { label: '收入囊中', res: { text: '你掂了掂钱袋，收进袖中。钱财到手，心却微微发沉。', lingshi: 400, yeLi: 4 } },
    ],
  },
  {
    id: 'e22', q: 3, title: '悬崖剑痕', text: '千仞悬崖上，一道剑痕横贯山壁，剑气历经千年而不散。',
    options: [
      { label: '临摹剑痕', res: { text: '你以指为剑，临摹那道剑痕，指尖锐痛，眼中却亮起光来。', attr: ['genGu', 1], cult: 0.8 } },
      { label: '静坐感悟', res: { text: '你在崖前静坐三日，剑意如风，拂过心湖却不留痕。', cult: 1.0 } },
    ],
  },
  {
    id: 'e23', q: 3, title: '药王谷求援', text: '药王谷的采药人愁眉不展：谷中灵药成熟在即，人手却不够。',
    options: [
      { label: '挽袖帮忙', res: { text: '你帮采药人忙活一整日，谷主送上谢礼与药园灵液。', mat: ['lingye', 3], lingmai: 4 } },
      { label: '只求报酬', res: { text: '你验货报价，公道利落。谷主付了工钱。', lingshi: 600 } },
    ],
  },
  {
    id: 'e24', q: 4, title: '古战场遗骸', text: '荒野枯骨枕籍，一具无名义士的遗骸仍保持着握刀的姿势——无人为他收殓。',
    options: [
      { label: '立碑收殓', res: { text: '你掘土为坟，立碑无字。风过处，似有长揖一礼。遗物中托付你一件旧物。', gongDe: 25, equipQ: [8, 10] } },
      { label: '取其遗物', res: { text: '你从遗骸手中取下那柄断刀，刀身残存的执念归入你身。', equipQ: [8, 12], yeLi: 5 } },
    ],
  },
  {
    id: 'e25', q: 4, title: '星陨之夜', text: '夜空星陨如雨，一颗火流星拖着长尾坠向无名山谷，大地隐隐震颤。',
    options: [
      { label: '追陨石', res: { text: '你赶到陨石坑时还热浪扑面，炼化其中星核，另有仙玉相随。', lingshi: 800, xianyu: 15 } },
      { label: '遥拜星君', res: { text: '你朝天一拜，星陨之景烙入识海，心境空明。', gongDe: 15, daoXin: 2 } },
    ],
  },
  {
    id: 'e26', q: 5, title: '混沌低语', text: '识海深处响起不属于此世的低语，声调古老，仿佛自天地初开时便已存在。',
    options: [
      { label: '聆听低语', res: { text: '低语灌入神魂，你窥见了轮回之外的碎片，天劫值随之翻涌。', reincP: 1, jieQi: 5 } },
      { label: '以道心镇之', res: { text: '你守心一念，低语渐渐沉寂。道心如磐石不可摧。', daoXin: 6 } },
    ],
  },
]
