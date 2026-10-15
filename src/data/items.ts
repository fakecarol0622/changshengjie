// ===== 材料 / 丹药 / 丹方 / 功法神通 / 法宝 / 灵兽 =====
import type { Eff, Mods, Proc } from '../types'

const PR = (id: string, name: string, trigger: Proc['trigger'], chance: number, eff: Eff, desc: string): Proc =>
  ({ id, name, trigger, chance, eff, desc })

// ---------- 材料 ----------
export interface MatDef { id: string; n: string; type: 'herb' | 'ore' | 'misc' | 'gift'; desc: string }
export const MATERIALS: MatDef[] = [
  { id: 'ningcao', n: '宁神草', type: 'herb', desc: '安神定气的常见灵草' },
  { id: 'chishen', n: '赤血参', type: 'herb', desc: '补血养气的灵参' },
  { id: 'yuzhi', n: '玉髓芝', type: 'herb', desc: '温养经脉的玉芝' },
  { id: 'huanhun', n: '还魂花', type: 'herb', desc: '传说能吊住一线生机的奇花' },
  { id: 'jiuye', n: '九叶莲', type: 'herb', desc: '九叶一芯，药力磅礴' },
  { id: 'longxian', n: '龙涎果', type: 'herb', desc: '沾染龙气的灵果' },
  { id: 'tiekuang', n: '铁矿', type: 'ore', desc: '寻常矿石，炼器打底' },
  { id: 'xuantie', n: '玄铁矿', type: 'ore', desc: '炼器常用的坚矿' },
  { id: 'xingyunTie', n: '星陨铁', type: 'ore', desc: '天外陨铁，内蕴星力' },
  { id: 'longxue', n: '龙血矿', type: 'ore', desc: '浸染龙血的赤色矿脉' },
  { id: 'taichu', n: '太初石', type: 'ore', desc: '开天辟地时残留的奇石' },
  { id: 'shougu', n: '兽骨', type: 'misc', desc: '灵兽骨材，坚硬非常' },
  { id: 'shouhun', n: '兽魂', type: 'misc', desc: '灵兽精魂，可滋养灵兽' },
  { id: 'lingye', n: '灵液', type: 'misc', desc: '灵泉凝液，炼丹药引' },
  { id: 'fuwen', n: '符文石', type: 'misc', desc: '刻有符纹的灵石，炼器辅材' },
  { id: 'jianyi', n: '剑意', type: 'misc', desc: '万剑冢凝聚的凛冽剑意' },
  { id: 'danfang', n: '丹方残页', type: 'misc', desc: '记载丹方的残页' },
  { id: 'gongfaPage', n: '功法残页', type: 'misc', desc: '记载功法的残页' },
  { id: 'fabaoPiece', n: '法宝碎片', type: 'misc', desc: '法宝崩碎后的残片' },
  { id: 'zhibaoPiece', n: '至宝碎片', type: 'misc', desc: '至宝崩碎后的残片，价值连城' },
  { id: 'seed1', n: '宁神草种子', type: 'misc', desc: '灵田可种' },
  { id: 'seed2', n: '赤血参种子', type: 'misc', desc: '灵田可种' },
  { id: 'seed3', n: '玉髓芝种子', type: 'misc', desc: '灵田可种' },
  { id: 'seed4', n: '九叶莲种子', type: 'misc', desc: '灵田可种' },
  { id: 'yaozhu', n: '妖珠碎片', type: 'misc', desc: '精怪凝结的妖珠碎块，30 枚可凝形一只精怪' },
  { id: 'longsui', n: '龙髓', type: 'misc', desc: '烛龙脉的髓脂，缩短剩余培育时间20%，至少10分钟（不超过剩余时间）' },
  // 礼物（投其所好，好感翻倍）
  { id: 'lingcha', n: '雨前灵茶', type: 'gift', desc: '雾雨山巅采的灵茶（喜好：茶）' },
  { id: 'baihua', n: '百花酿', type: 'gift', desc: '以百花酿成的灵酒（喜好：酒）' },
  { id: 'qinpu', n: '古琴谱', type: 'gift', desc: '失传的上古琴曲谱（喜好：乐）' },
  { id: 'minghua', n: '名家画轴', type: 'gift', desc: '仙家真迹画轴（喜好：书画）' },
  { id: 'yupei', n: '玲珑玉佩', type: 'gift', desc: '温润灵玉所制配饰（喜好：珍宝）' },
  { id: 'xianglu', n: '沉云香炉', type: 'gift', desc: '燃之静心凝神的古香炉（喜好：香）' },  { id: 'xueya', n: '雪芽仙毫', type: 'gift', desc: '千年雪顶采的仙茶（喜好：茶）' },
  { id: 'wudao', n: '悟道茶', type: 'gift', desc: '饮之可入定悟道的灵茶（喜好：茶）' },
  { id: 'yunwu', n: '云雾仙芽', type: 'gift', desc: '云海深处孕育的茶中极品（喜好：茶）' },
  { id: 'zuixian', n: '醉仙酿', type: 'gift', desc: '仙人闻香亦醉的百年陈酿（喜好：酒）' },
  { id: 'taiqing', n: '太清玉液', type: 'gift', desc: '道门秘传的玉液琼浆（喜好：酒）' },
  { id: 'wangyou', n: '忘忧醴泉', type: 'gift', desc: '一饮可忘百年忧的灵泉（喜好：酒）' },
  { id: 'shanhe', n: '山河真迹', type: 'gift', desc: '画圣亲笔的山河长卷（喜好：书画）' },
  { id: 'wuzi', n: '无字天书', type: 'gift', desc: '观之字字浮现的通玄天书（喜好：书画）' },
  { id: 'luoshenfu', n: '洛神赋残卷', type: 'gift', desc: '前朝大家的真迹残卷（喜好：书画）' },
  { id: 'qilinyin', n: '紫金麒麟印', type: 'gift', desc: '紫金铸就的镇宅宝印（喜好：珍宝）' },
  { id: 'jiuqiao', n: '九窍玲珑珠', type: 'gift', desc: '九窍生辉的奇珠（喜好：珍宝）' },
  { id: 'kunwu', n: '昆吾玉璧', type: 'gift', desc: '昆吾山巅采得的古玉璧（喜好：珍宝）' },
  { id: 'anxin', n: '安神龙涎香', type: 'gift', desc: '一缕可安神三日的龙涎香（喜好：香）' },
  { id: 'ningshen', n: '凝神返魂香', type: 'gift', desc: '古方所制凝神奇香（喜好：香）' },
  { id: 'tianxiang', n: '九天神木香', type: 'gift', desc: '神木心材所制，燃之通玄（喜好：香）' },
  { id: 'guangling', n: '广陵散残谱', type: 'gift', desc: '失传名曲的古谱残页（喜好：乐）' },
  { id: 'tianyin', n: '天音玉笛', type: 'gift', desc: '玉笛一响百鸟朝凤（喜好：乐）' },
  { id: 'fengming', n: '凤鸣焦尾琴', type: 'gift', desc: '琴身有凤鸣九霄之音（喜好：乐）' },]
export const MAT_MAP: Record<string, MatDef> = Object.fromEntries(MATERIALS.map(m => [m.id, m]))

// ---------- 丹药 ----------
export interface PillDef { id: string; n: string; desc: string; realm: number }
export const PILLS: PillDef[] = [
  { id: 'juling', n: '聚灵丹', desc: '30分钟内修炼速度+40%，可叠加时长', realm: 0 },
  { id: 'liaoshang', n: '疗伤丹', desc: '治愈受伤状态', realm: 0 },
  { id: 'podan', n: '破障丹', desc: '突破成功率+15%', realm: 1 },
  { id: 'zengshou', n: '培元丹', desc: '立即获得 1 小时挂机修为', realm: 1 },
  { id: 'xisui', n: '洗髓丹', desc: '重掷先天气运 ×3（逆天改命，天劫值+2）', realm: 3 },
  { id: 'dujie', n: '渡劫丹', desc: '渡劫中每次判定受到的伤害-50%', realm: 5 },
]
export const PILL_MAP: Record<string, PillDef> = Object.fromEntries(PILLS.map(p => [p.id, p]))
export const PILL_QNAMES = ['废丹', '下品', '中品', '上品', '极品', '丹纹', '变异']
export const PILL_QMULT = [0, 0.5, 0.8, 1.0, 1.35, 1.7, 2.2]

// ---------- 丹方 ----------
export interface RecipeDef { id: string; out: string; realm: number; mats: [string, number][]; desc: string }
export const RECIPES: RecipeDef[] = [
  { id: 'juling', out: 'juling', realm: 0, mats: [['ningcao', 3]], desc: '宁神草×3' },
  { id: 'liaoshang', out: 'liaoshang', realm: 0, mats: [['yuzhi', 2], ['lingye', 1]], desc: '玉髓芝×2、灵液×1' },
  { id: 'podan', out: 'podan', realm: 1, mats: [['chishen', 3], ['fuwen', 1]], desc: '赤血参×3、符文石×1' },
  { id: 'zengshou', out: 'zengshou', realm: 2, mats: [['huanhun', 2], ['longxian', 1]], desc: '还魂花×2、龙涎果×1' },
  { id: 'xisui', out: 'xisui', realm: 3, mats: [['jiuye', 2], ['longxue', 2]], desc: '九叶莲×2、龙血矿×2' },
  { id: 'dujie', out: 'dujie', realm: 5, mats: [['longxian', 2], ['taichu', 1]], desc: '龙涎果×2、太初石×1' },
]
export const RECIPE_MAP: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map(r => [r.id, r]))

// ---------- 灵田种子 ----------
export interface SeedDef { id: string; n: string; herb: string; minutes: number; yield: [number, number]; realm: number }
export const SEEDS: SeedDef[] = [
  { id: 'seed1', n: '宁神草种子', herb: 'ningcao', minutes: 5, yield: [3, 6], realm: 1 },
  { id: 'seed2', n: '赤血参种子', herb: 'chishen', minutes: 10, yield: [3, 5], realm: 2 },
  { id: 'seed3', n: '玉髓芝种子', herb: 'yuzhi', minutes: 15, yield: [2, 4], realm: 3 },
  { id: 'seed4', n: '九叶莲种子', herb: 'jiuye', minutes: 25, yield: [2, 3], realm: 4 },
]
export const SEED_MAP: Record<string, SeedDef> = Object.fromEntries(SEEDS.map(s => [s.id, s]))

// ---------- 功法 / 神通 ----------
export interface TechDef { id: string; n: string; tier: number; kind: 'passive' | 'active'; desc: string; mods?: Mods; procs?: Proc[] }
export const TECH_TIERS = ['凡阶', '灵阶', '玄阶', '地阶', '天阶', '仙阶', '道阶']
export const TECHNIQUES: TechDef[] = [
  { id: 'yinqi', n: '引气诀', tier: 1, kind: 'passive', desc: '修炼速度+12%', mods: { cultP: 12 } },
  { id: 'qiangshen', n: '强身诀', tier: 1, kind: 'passive', desc: '气血+10%', mods: { hpP: 10 } },
  { id: 'tiegu', n: '铁骨功', tier: 1, kind: 'passive', desc: '防御+10%', mods: { defP: 10 } },
  { id: 'yufeng', n: '御风诀', tier: 2, kind: 'passive', desc: '速度+15%', mods: { spdP: 15 } },
  { id: 'jinzhong', n: '金钟罩', tier: 2, kind: 'passive', desc: '伤害减免+5%', mods: { dmgReduceAdd: 5 } },
  { id: 'liehuo', n: '烈火掌', tier: 2, kind: 'passive', desc: '攻击+10%', mods: { atkP: 10 } },
  { id: 'qinglian', n: '青莲剑歌', tier: 3, kind: 'passive', desc: '攻击+15%、连击+5%', mods: { atkP: 15, comboAdd: 5 } },
  { id: 'xuangui', n: '玄龟功', tier: 3, kind: 'passive', desc: '气血+20%、防御+10%', mods: { hpP: 20, defP: 10 } },
  { id: 'bingxin', n: '冰心诀', tier: 3, kind: 'passive', desc: '暴击率+6%', mods: { critAdd: 6 } },
  { id: 'taiyi', n: '太乙剑诀', tier: 4, kind: 'passive', desc: '攻击+25%', mods: { atkP: 25 } },
  { id: 'luohan', n: '罗汉金身', tier: 4, kind: 'passive', desc: '气血+35%、防御+15%', mods: { hpP: 35, defP: 15 } },
  { id: 'leiting_cui', n: '雷霆淬体', tier: 4, kind: 'passive', desc: '速度+20%、暴击+8%', mods: { spdP: 20, critAdd: 8 } },
  { id: 'dayan', n: '大衍炼神诀', tier: 5, kind: 'passive', desc: '修炼速度+50%', mods: { cultP: 50 } },
  { id: 'jiuzhuan', n: '九转玄功', tier: 5, kind: 'passive', desc: '全属性+15%', mods: { allP: 15 } },
  { id: 'taixu_jian', n: '太虚剑意', tier: 5, kind: 'passive', desc: '攻击+35%、连击+10%', mods: { atkP: 35, comboAdd: 10 } },
  { id: 'taishang', n: '太上忘情道', tier: 6, kind: 'passive', desc: '暴击伤害+40%', mods: { critDmgAdd: 40 } },
  { id: 'daluo', n: '大罗金仙诀', tier: 6, kind: 'passive', desc: '全属性+25%', mods: { allP: 25 } },
  { id: 'hundun_jing', n: '混沌经', tier: 6, kind: 'passive', desc: '修炼+100%、全属性+10%', mods: { cultP: 100, allP: 10 } },
  { id: 'hongmeng', n: '鸿蒙造化功', tier: 7, kind: 'passive', desc: '全属性+60%', mods: { allP: 60 } },
  { id: 'zhan_sanshi', n: '斩三尸妙法', tier: 7, kind: 'passive', desc: '修炼速度+200%', mods: { cultP: 200 } },
  // 神通（主动技，战斗自动释放）
  { id: 'yujian', n: '御剑术', tier: 2, kind: 'active', desc: '30%概率追加一剑', procs: [PR('sk_yujian', '御剑术', 'attack', 0.3, { t: 'extraHit', mult: 0.7 }, '御剑斩击')] },
  {
    id: 'wulei', n: '五雷正法', tier: 3, kind: 'active', desc: '25%概率雷罚（麻痹+伤害）',
    procs: [PR('sk_wulei', '五雷正法', 'attack', 0.25, { t: 'stun', rounds: 1 }, '雷霆麻痹'), PR('sk_wulei2', '五雷正法·轰', 'attack', 0.25, { t: 'dmg', mult: 0.6 }, '雷法轰击')],
  },
  { id: 'lieyan', n: '烈焰焚天', tier: 3, kind: 'active', desc: '30%概率附加灼烧', procs: [PR('sk_lieyan', '烈焰焚天', 'attack', 0.3, { t: 'dot', pct: 0.5, rounds: 3, name: '烈焰' }, '烈焰缠身')] },
  { id: 'hanbing', n: '寒冰诀', tier: 3, kind: 'active', desc: '20%概率冻结目标', procs: [PR('sk_hanbing', '寒冰诀', 'attack', 0.2, { t: 'stun', rounds: 1 }, '寒冰冻结')] },
  { id: 'huichun', n: '回春术', tier: 3, kind: 'active', desc: '气血低于40%时回复15%气血', procs: [PR('sk_huichun', '回春术', 'lowhp', 0.5, { t: 'heal', pct: 15 }, '枯木回春')] },
  { id: 'jinshen', n: '金身护体', tier: 4, kind: 'active', desc: '开局获得20%护盾', procs: [PR('sk_jinshen', '金身护体', 'start', 1, { t: 'shield', pct: 20 }, '金光罩体')] },
  { id: 'jianqi', n: '剑气纵横', tier: 4, kind: 'active', desc: '35%概率剑气追伤', procs: [PR('sk_jianqi', '剑气纵横', 'attack', 0.35, { t: 'extraHit', mult: 0.5 }, '剑气纵横')] },
  { id: 'youming_shou', n: '幽冥鬼手', tier: 4, kind: 'active', desc: '25%概率汲取生命', procs: [PR('sk_youming', '幽冥鬼手', 'attack', 0.25, { t: 'heal', pct: 8 }, '幽冥汲命')] },
  { id: 'xingluo', n: '星落九天', tier: 5, kind: 'active', desc: '25%概率降下星陨（250%真实伤害）', procs: [PR('sk_xingluo', '星落九天', 'round', 0.25, { t: 'true', mult: 2.5 }, '星陨天降')] },
  { id: 'niepan', n: '涅槃神诀', tier: 6, kind: 'active', desc: '阵亡后以30%气血涅槃一次', procs: [PR('sk_niepan', '涅槃神诀', 'start', 1, { t: 'revive', pct: 30 }, '涅槃重生')] },
  { id: 'tiangang', n: '天罡战体', tier: 5, kind: 'active', desc: '开局战意沸腾（攻击+30%）', procs: [PR('sk_tiangang', '天罡战体', 'start', 1, { t: 'atkBuff', pct: 30, rounds: 6 }, '战意沸腾')] },
]
export const TECH_MAP: Record<string, TechDef> = Object.fromEntries(TECHNIQUES.map(t => [t.id, t]))

// ---------- 法宝 ----------
export interface TreasureDef { id: string; n: string; q: number; desc: string; mods?: Mods; procs?: Proc[] }
export const TREASURES: TreasureDef[] = [
  { id: 'qingxiao', n: '青霄剑', q: 11, desc: '攻击+15%，20%概率追加剑气', mods: { atkP: 15 }, procs: [PR('tr_qingxiao', '青霄剑气', 'attack', 0.2, { t: 'extraHit', mult: 0.6 }, '青霄剑气纵横')] },
  { id: 'zidian', n: '紫电锤', q: 11, desc: '暴击+6%，25%概率麻痹', mods: { critAdd: 6 }, procs: [PR('tr_zidian', '紫电麻痹', 'attack', 0.25, { t: 'stun', rounds: 1 }, '紫电麻痹')] },
  { id: 'xuangui_dun', n: '玄龟盾', q: 10, desc: '防御+20%，减伤+5%', mods: { defP: 20, dmgReduceAdd: 5 } },
  { id: 'chiyanzhu', n: '赤炎珠', q: 10, desc: '30%概率附加灼烧', procs: [PR('tr_chiyan', '赤炎灼烧', 'attack', 0.3, { t: 'dot', pct: 0.45, rounds: 3, name: '赤炎' }, '赤炎焚身')] },
  { id: 'bingpojing', n: '冰魄镜', q: 10, desc: '20%概率冻结目标', procs: [PR('tr_bingpo', '冰魄冻结', 'attack', 0.2, { t: 'stun', rounds: 1 }, '冰魄封印')] },
  { id: 'fenglingfan', n: '风灵幡', q: 10, desc: '速度+15%，闪避+5%', mods: { spdP: 15, dodgeAdd: 5 } },
  { id: 'leiyin', n: '雷印', q: 11, desc: '15%概率天雷加身（150%真实伤害）', procs: [PR('tr_leiyin', '天雷加身', 'attack', 0.15, { t: 'true', mult: 1.5 }, '天雷轰顶')] },
  { id: 'tuyuan_yin', n: '土元印', q: 10, desc: '开局获得15%护盾', procs: [PR('tr_tuyuan', '土元护盾', 'start', 1, { t: 'shield', pct: 15 }, '土元壁障')] },
  { id: 'jinjiao', n: '金蛟剪', q: 11, desc: '破甲+12%', mods: { armorPenAdd: 12 } },
  { id: 'mulinzhang', n: '木灵杖', q: 10, desc: '每回合回复2%气血', procs: [PR('tr_mulin', '木灵滋养', 'round', 1, { t: 'heal', pct: 2 }, '木灵回春')] },
  { id: 'shuilongzhu', n: '水龙珠', q: 11, desc: '受击后30%概率回复5%气血', procs: [PR('tr_shuilong', '水龙回响', 'hit', 0.3, { t: 'heal', pct: 5 }, '水润回春')] },
  { id: 'huofengyu', n: '火凤羽', q: 12, desc: '阵亡后以30%气血复活一次', procs: [PR('tr_huofeng', '火凤涅槃', 'start', 1, { t: 'revive', pct: 30 }, '凤凰涅槃')] },
  { id: 'xingchenpan', n: '星辰盘', q: 12, desc: '30%概率降下星陨（250%真实伤害）', procs: [PR('tr_xingchen', '星陨', 'round', 0.3, { t: 'true', mult: 2.5 }, '星辰陨落')] },
  { id: 'yuehualun', n: '月华轮', q: 11, desc: '吸血+8%', mods: { lifestealAdd: 8 } },
  { id: 'rijinglun', n: '日精轮', q: 11, desc: '暴击伤害+25%', mods: { critDmgAdd: 25 } },
  { id: 'youmingdeng', n: '幽冥灯', q: 12, desc: '20%概率幽冥真伤', procs: [PR('tr_youming', '幽冥侵蚀', 'attack', 0.2, { t: 'true', mult: 0.5 }, '幽冥侵蚀')] },
  { id: 'xuemoDao', n: '血魔刀', q: 12, desc: '吸血+15%，伤害+15%', mods: { lifestealAdd: 15, dmgP: 15 } },
  { id: 'yujingping', n: '玉净瓶', q: 10, desc: '每回合回复3%气血', procs: [PR('tr_yujing', '玉净甘露', 'round', 1, { t: 'heal', pct: 3 }, '甘露润体')] },
  { id: 'huntianling', n: '混天绫', q: 12, desc: '连击+12%', mods: { comboAdd: 12 } },
  { id: 'qiankundai', n: '乾坤袋', q: 10, desc: '摇落出货率+8%', mods: { dropLuck: 8 } },
  { id: 'panlongzhang', n: '蟠龙杖', q: 11, desc: '强化灵兽+15%，气血+10%', mods: { beastBoostAdd: 15, hpP: 10 } },
  { id: 'zhenhunfan', n: '镇魂幡', q: 12, desc: '击晕+6%，20%概率摄魂麻痹', mods: { stunAdd: 6 }, procs: [PR('tr_zhenhun', '摄魂', 'attack', 0.2, { t: 'stun', rounds: 1 }, '魂幡招展，神魂一滞')] },
  { id: 'jingangzhuo', n: '金刚琢', q: 12, desc: '反击+8%，受击时35%反震', mods: { counterAdd: 8 }, procs: [PR('tr_jingang', '金刚反震', 'hit', 0.35, { t: 'dmg', mult: 0.5 }, '金刚琢震，反噬其身')] },
  { id: 'jiuyouling', n: '九幽令', q: 12, desc: '弱化治疗+10%，破甲+8%', mods: { healCutAdd: 10, armorPenAdd: 8 } },
  { id: 'fuyaozhou', n: '扶摇舟', q: 11, desc: '速度+20%，闪避+6%', mods: { spdP: 20, dodgeAdd: 6 } },
  { id: 'taixujing', n: '太虚镜', q: 12, desc: '增伤+8%，暴击+5%', mods: { dmgBoostAdd: 8, critAdd: 5 } },
]
export const TREASURE_MAP: Record<string, TreasureDef> = Object.fromEntries(TREASURES.map(t => [t.id, t]))
// 法宝组合共鸣
export const TREASURE_COMBOS: { ids: [string, string]; n: string; desc: string; mods: Mods }[] = [
  { ids: ['qingxiao', 'zidian'], n: '雷剑共鸣', desc: '伤害+15%', mods: { dmgP: 15 } },
  { ids: ['bingpojing', 'shuilongzhu'], n: '寒龙共鸣', desc: '防御+15%、气血+10%', mods: { defP: 15, hpP: 10 } },
  { ids: ['yuehualun', 'rijinglun'], n: '日月同辉', desc: '暴击伤害+20%', mods: { critDmgAdd: 20 } },
  { ids: ['xuemoDao', 'youmingdeng'], n: '幽冥血契', desc: '吸血+10%、伤害+10%', mods: { lifestealAdd: 10, dmgP: 10 } },
  { ids: ['zhenhunfan', 'youmingdeng'], n: '幽冥引魂', desc: '强化灵兽+10%、弱化治疗+8%', mods: { beastBoostAdd: 10, healCutAdd: 8 } },
  { ids: ['jingangzhuo', 'xuangui_dun'], n: '金刚不坏', desc: '反击+6%、减伤+5%', mods: { counterAdd: 6, dmgReduceAdd: 5 } },
  { ids: ['panlongzhang', 'jinjiao'], n: '龙蛟合璧', desc: '强化灵兽+8%、破甲+6%', mods: { beastBoostAdd: 8, armorPenAdd: 6 } },
  { ids: ['fuyaozhou', 'fenglingfan'], n: '扶摇御风', desc: '速度+15%、闪避+5%', mods: { spdP: 15, dodgeAdd: 5 } },
  { ids: ['taixujing', 'xingchenpan'], n: '太虚星象', desc: '增伤+6%、全属性+4%', mods: { dmgBoostAdd: 6, allP: 4 } },
]

// ---------- 灵兽 ----------
export interface BeastDef { id: string; n: string; desc: string; mods?: Mods; procs?: Proc[] }
export const BEAST_KINDS: BeastDef[] = [
  { id: 'huoya', n: '火鸦', desc: '助战：25%概率灼烧', mods: { atkP: 5 }, procs: [PR('bs_huoya', '火鸦·灼烧', 'attack', 0.25, { t: 'dot', pct: 0.4, rounds: 2, name: '鸦火' }, '火鸦扑击')] },
  { id: 'hubing', n: '冰狐', desc: '助战：20%概率冻结', procs: [PR('bs_hubing', '冰狐·冻结', 'attack', 0.2, { t: 'stun', rounds: 1 }, '霜尾扫击')] },
  { id: 'leiying', n: '雷鹰', desc: '助战：20%概率雷击麻痹', mods: { spdP: 5 }, procs: [PR('bs_leiying', '雷鹰·麻痹', 'attack', 0.2, { t: 'stun', rounds: 1 }, '雷羽贯空')] },
  { id: 'tuxiong', n: '土熊', desc: '助战：气血+8%', mods: { hpP: 8 } },
  { id: 'jinshe', n: '金蛇', desc: '助战：破甲+6%', mods: { armorPenAdd: 6 } },
  { id: 'mulu', n: '木鹿', desc: '助战：每回合回复1.5%气血', procs: [PR('bs_mulu', '木鹿·回春', 'round', 1, { t: 'heal', pct: 1.5 }, '灵光沐浴')] },
  { id: 'shuijiao', n: '水蛟', desc: '助战：受击回血', procs: [PR('bs_shuijiao', '水蛟·吐息', 'hit', 0.25, { t: 'heal', pct: 4 }, '水幕轻抚')] },
  { id: 'fenglang', n: '风狼', desc: '助战：速度+10%，先手凌厉', mods: { spdP: 10 } },
  { id: 'duxie', n: '毒蝎', desc: '助战：30%概率中毒', procs: [PR('bs_duxie', '毒蝎·剧毒', 'attack', 0.3, { t: 'dot', pct: 0.35, rounds: 3, name: '剧毒' }, '毒针穿刺')] },
  { id: 'guanghe', n: '光鹤', desc: '助战：每回合回复2%气血', procs: [PR('bs_guanghe', '光鹤·祥和', 'round', 1, { t: 'heal', pct: 2 }, '鹤鸣祥和')] },
  { id: 'anbao', n: '暗豹', desc: '助战：暴击+5%', mods: { critAdd: 5 } },
  { id: 'yangui', n: '岩龟', desc: '助战：防御+12%，减伤+4%', mods: { defP: 12, dmgReduceAdd: 4 } },
  { id: 'yunlong', n: '云龙', desc: '助战：全属性+6%', mods: { allP: 6 } },
  { id: 'xinglu', n: '星鹿', desc: '助战：星陨真伤', procs: [PR('bs_xinglu', '星鹿·星陨', 'round', 0.2, { t: 'true', mult: 1.2 }, '星光洒落')] },
  { id: 'yuetu', n: '月兔', desc: '助战：闪避+6%', mods: { dodgeAdd: 6 } },
  { id: 'rishi', n: '日狮', desc: '助战：攻击+10%', mods: { atkP: 10 } },
  { id: 'youmingquan', n: '幽冥犬', desc: '助战：吸血+5%', mods: { lifestealAdd: 5 } },
  { id: 'xuefu', n: '血蝠', desc: '助战：击杀回血', mods: { killHealPct: 0 } as Mods, procs: [PR('bs_xuefu', '血蝠·血蚀', 'attack', 0.25, { t: 'heal', pct: 3 }, '血光掠影')] },
  { id: 'yuchan', n: '玉蟾', desc: '助战：摇落出货率+5%', mods: { dropLuck: 5 } },
  { id: 'lingdie', n: '灵蝶', desc: '助战：速度+8%，冷却-8%', mods: { spdP: 8, cdrAdd: 8 } },
]
export const BEAST_MAP: Record<string, BeastDef> = Object.fromEntries(BEAST_KINDS.map(b => [b.id, b]))
// 灵兽阶位（进阶：每阶属性/技能效果 +20%，并依次解锁下列助战技）
export const BEAST_STAGES = ['幼年期', '成长期', '成熟期', '统领期', '太古期']
export const BEAST_STAGE_SKILLS: Proc[] = [
  PR('st_guard', '兽魂护体', 'start', 0.5, { t: 'shield', pct: 8 }, '兽魂萦绕周身'),
  PR('st_bite', '野性撕咬', 'attack', 0.15, { t: 'extraHit', mult: 0.6 }, '利齿撕咬'),
  PR('st_roar', '上古威压', 'round', 0.15, { t: 'defDown', pct: 15, rounds: 2 }, '威压震世'),
  PR('st_taigu', '太古咆哮', 'lowhp', 0.5, { t: 'atkBuff', pct: 30, rounds: 3 }, '太古血脉觉醒'),
]
// 灵兽命名前缀（按品质段）
export const BEAST_PREFIX = [
  ['幼', '小', '灰', '白'],
  ['灵', '玄', '幽'],
  ['天', '仙', '造化'],
  ['圣', '混沌', '鸿蒙'],
]
export function beastName(q: number, kind: string): string {
  const seg = q <= 4 ? 0 : q <= 8 ? 1 : q <= 12 ? 2 : 3
  const arr = BEAST_PREFIX[seg]
  const pre = arr[Math.floor(Math.random() * arr.length)]
  return pre + kind
}
