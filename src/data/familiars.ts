// ===== 精怪系统（参考寻道大千：碎片凝形 → 收服 → 出战被动 + 战斗技能自动触发 → 升级/升星） =====
import type { Mods, Proc } from '../types'
import { pick, weighted } from '../core/rng'

export interface FamiliarDef {
  id: string
  n: string
  r: 1 | 2 | 3 | 4 | 5 // 妖灵/灵胎/玄妖/地妖/天妖
  desc: string
  mods: Mods
  sk: string // 战斗技名（出战位时自动触发）
  skDesc: string
  proc: Proc
}

export const FAM_RARITY = ['', '妖灵', '灵胎', '玄妖', '地妖', '天妖']

const P = (id: string, name: string, trigger: Proc['trigger'], chance: number, eff: Proc['eff'], desc: string): Proc =>
  ({ id, name, trigger, chance, desc, eff, src: 'pet' })

export const FAMILIARS: FamiliarDef[] = [
  // 妖灵（凡）
  { id: 'huyao', n: '小狐妖', r: 1, desc: '修行尚浅的狐妖，灵动狡黠', mods: { atkP: 4 }, sk: '狐影迷踪', skDesc: '攻击时 15% 追加一击（35%攻击）', proc: P('fam_huyao', '狐影迷踪', 'attack', 0.15, { t: 'extraHit', mult: 0.35 }, '狐影分身，追加一击') },
  { id: 'dengxin', n: '灯芯鬼', r: 1, desc: '古灯灯芯化形，夜深人静时窃窃私语', mods: { hpP: 4 }, sk: '永夜灯明', skDesc: '每回合 22% 回复 2.5% 气血', proc: P('fam_dengxin', '永夜灯明', 'round', 0.22, { t: 'heal', pct: 2.5 }, '鬼火摇曳，气血微复') },
  { id: 'tianluo', n: '田螺精', r: 1, desc: '田螺成精，壳中藏着小楼阁', mods: { defP: 4 }, sk: '螺壳护主', skDesc: '受击时 20% 获得 5% 护盾', proc: P('fam_tianluo', '螺壳护主', 'hit', 0.2, { t: 'shield', pct: 5 }, '螺壳叠甲，护主周旋') },
  { id: 'zhiren', n: '纸人偶', r: 1, desc: '剪纸上生了灵性，翩跹如活物', mods: { dodgeAdd: 3 }, sk: '画影惑敌', skDesc: '攻击时 15% 使敌方防御崩解 10%（2回合）', proc: P('fam_zhiren', '画影惑敌', 'attack', 0.15, { t: 'defDown', pct: 10, rounds: 2 }, '画影重重，敌目为之眩') },  { id: 'zhujing', n: '竹节精', r: 1, desc: '一节灵竹吸了山风水气，化出小小人形', mods: { spdP: 3 }, sk: '竹影婆娑', skDesc: '攻击时 15% 使敌方防御崩解 8%（2回合）', proc: P('fam_zhujing', '竹影婆娑', 'attack', 0.15, { t: 'defDown', pct: 8, rounds: 2 }, '竹影摇曳，敌势为之一缓') },
  { id: 'wamao', n: '瓦猫', r: 1, desc: '屋脊泥塑镇宅猫，夜里会轻轻走动', mods: { critAdd: 2 }, sk: '瓦猫扑影', skDesc: '攻击时 15% 追加一击（30%攻击）', proc: P('fam_wamao', '瓦猫扑影', 'attack', 0.15, { t: 'extraHit', mult: 0.3 }, '瓦猫跃起，利爪补击') },  // 灵胎（良）
  { id: 'shanxiao', n: '山魈', r: 2, desc: '深山老魈，蛮力慑人', mods: { atkP: 7 }, sk: '魈啸慑魂', skDesc: '攻击时 12% 击晕目标 1 回合', proc: P('fam_shanxiao', '魈啸慑魂', 'attack', 0.12, { t: 'stun', rounds: 1 }, '魈啸山野，敌魂为之一夺') },
  { id: 'zaowang', n: '灶王爷', r: 2, desc: '受了人间香火的小神，护宅安宅', mods: { hpP: 7 }, sk: '灶火护宅', skDesc: '开场 50% 获得 8% 护盾', proc: P('fam_zaowang', '灶火护宅', 'start', 0.5, { t: 'shield', pct: 8 }, '灶火升腾，护宅安宅') },
  { id: 'xuenv', n: '雪女', r: 2, desc: '雪夜遇人，呵气成霜', mods: { defP: 7, dmgReduceAdd: 2 }, sk: '呵气成霜', skDesc: '攻击时 15% 使敌方防御崩解 12%（2回合）', proc: P('fam_xuenv', '呵气成霜', 'attack', 0.15, { t: 'defDown', pct: 12, rounds: 2 }, '霜气凝结，敌方护体崩裂') },
  { id: 'yinghuo', n: '萤火虫群', r: 2, desc: '万千萤点结成妖身，如梦似幻', mods: { spdP: 6 }, sk: '流萤附刃', skDesc: '攻击时 18% 追加一击（30%攻击）', proc: P('fam_yinghuo', '流萤附刃', 'attack', 0.18, { t: 'extraHit', mult: 0.3 }, '流萤附于刃上，再补一击') },  { id: 'jinli', n: '锦鲤精', r: 2, desc: '放生池中的老锦鲤，鳞光流转如霞', mods: { dropLuck: 2 }, sk: '锦鲤献瑞', skDesc: '每回合 18% 回复 2% 气血', proc: P('fam_jinli', '锦鲤献瑞', 'round', 0.18, { t: 'heal', pct: 2 }, '锦鲤摆尾，瑞气盈身') },
  { id: 'shuiyue', n: '水月镜妖', r: 2, desc: '月下潭水映出的妖影，真假难辨', mods: { dodgeAdd: 4 }, sk: '镜花水月', skDesc: '攻击时 15% 使敌方防御崩解 10%（2回合）', proc: P('fam_shuiyue', '镜花水月', 'attack', 0.15, { t: 'defDown', pct: 10, rounds: 2 }, '镜月交映，敌目迷离') },  // 玄妖（珍）
  { id: 'yecha', n: '夜叉', r: 3, desc: '夜叉一族，爪利如刃，专破护体罡气', mods: { atkP: 5, armorPenAdd: 5 }, sk: '夜叉破罡', skDesc: '攻击时 15% 造成 50% 攻击真实伤害', proc: P('fam_yecha', '夜叉破罡', 'attack', 0.15, { t: 'true', mult: 0.5 }, '夜叉利爪破罡，直噬根本') },
  { id: 'yaoseng', n: '妖僧', r: 3, desc: '披着袈裟的千年老妖，皮糙肉厚', mods: { hpP: 10, reflectAdd: 3 }, sk: '金刚不坏', skDesc: '受击时 18% 回复 3% 气血', proc: P('fam_yaoseng', '金刚不坏', 'hit', 0.18, { t: 'heal', pct: 3 }, '妖僧皮坚，创伤自愈') },
  { id: 'huoshu', n: '火鼠', r: 3, desc: '火山口生出的火精，灼热难当', mods: { dmgP: 4, critAdd: 2 }, sk: '烈焰缠身', skDesc: '攻击时 20% 附加灼烧（3回合，每回合40%攻击）', proc: P('fam_huoshu', '烈焰缠身', 'attack', 0.2, { t: 'dot', pct: 0.4, rounds: 3, name: '灼烧' }, '火鼠沾身，烈焰不熄') },
  { id: 'shigandang', n: '石敢当', r: 3, desc: '镇宅石生了灵，镇鬼辟邪', mods: { defP: 10, dmgReduceAdd: 3 }, sk: '镇宅辟邪', skDesc: '开场 50% 获得 10% 护盾', proc: P('fam_shigandang', '镇宅辟邪', 'start', 0.5, { t: 'shield', pct: 10 }, '石令镇宅，百邪不侵') },
  { id: 'yinlong', n: '银蛟', r: 3, desc: '深潭银蛟，翻尾便能卷起三尺浪', mods: { spdP: 8, comboAdd: 3 }, sk: '蛟尾翻江', skDesc: '攻击时 15% 追加一击（50%攻击）', proc: P('fam_yinlong', '蛟尾翻江', 'attack', 0.15, { t: 'extraHit', mult: 0.5 }, '银尾横扫，浪涌再击') },
  { id: 'xuanfeng', n: '玄蜂', r: 3, desc: '玄色巨蜂，尾针蕴着化不开的剧毒', mods: { armorPenAdd: 6 }, sk: '玄蜂毒刺', skDesc: '攻击时 25% 附加蜂毒（3回合，每回合35%攻击）', proc: P('fam_xuanfeng', '玄蜂毒刺', 'attack', 0.25, { t: 'dot', pct: 0.35, rounds: 3, name: '蜂毒' }, '毒针入体，蜂毒蔓延') },
  // 地妖（极）
  { id: 'shuyao', n: '千年树妖', r: 4, desc: '参天古木成精，根须盘结如龙', mods: { hpP: 12, dmgReduceAdd: 4 }, sk: '古木回春', skDesc: '每回合 20% 回复 3% 气血', proc: P('fam_shuyao', '古木回春', 'round', 0.2, { t: 'heal', pct: 3 }, '古木吐新芽，气血自还') },
  { id: 'guiche', n: '鬼车', r: 4, desc: '九头夜行之妖，啼声裂胆', mods: { atkP: 12, critDmgAdd: 8 }, sk: '九头噬魂', skDesc: '攻击时 15% 造成 80% 攻击伤害', proc: P('fam_guiche', '九头噬魂', 'attack', 0.15, { t: 'dmg', mult: 0.8 }, '鬼车九首齐啸，噬魂一击') },
  { id: 'fengbo', n: '风伯', r: 4, desc: '御风而行，来去无踪', mods: { spdP: 12, comboAdd: 4 }, sk: '御风追袭', skDesc: '攻击时 12% 追加一击（60%攻击）', proc: P('fam_fengbo', '御风追袭', 'attack', 0.12, { t: 'extraHit', mult: 0.6 }, '乘风追击，快不可当') },
  { id: 'hanba', n: '旱魃', r: 4, desc: '上古旱神残躯，所过之处赤地千里', mods: { atkP: 10, dmgP: 4 }, sk: '赤地千里', skDesc: '攻击时 15% 附加旱火（3回合，每回合45%攻击）', proc: P('fam_hanba', '赤地千里', 'attack', 0.15, { t: 'dot', pct: 0.45, rounds: 3, name: '旱火' }, '旱火燎原，草木皆焚') },
  { id: 'luoshen', n: '洛水神女', r: 4, desc: '洛水之畔的一缕神念，凌波微步，罗袜生尘', mods: { hpP: 8, dmgReduceAdd: 3 }, sk: '洛水回澜', skDesc: '每回合 25% 回复 3.5% 气血', proc: P('fam_luoshen', '洛水回澜', 'round', 0.25, { t: 'heal', pct: 3.5 }, '洛水漾开，气血回流') },
  { id: 'dangkang', n: '当康', r: 4, desc: '山海异兽，其现则五谷丰登', mods: { hpP: 12, defP: 6 }, sk: '拱土成墙', skDesc: '开场 50% 获得 12% 护盾', proc: P('fam_dangkang', '拱土成墙', 'start', 0.5, { t: 'shield', pct: 12 }, '当康拱地，土墙嶙峋护身') },
  // 天妖（传）
  { id: 'jiuwei', n: '九尾天狐', r: 5, desc: '九尾如扇，一顾倾人城，再顾倾人国', mods: { allP: 7 }, sk: '倾国魅惑', skDesc: '攻击时 15% 魅惑目标（击晕1回合）', proc: P('fam_jiuwei', '倾国魅惑', 'attack', 0.15, { t: 'stun', rounds: 1 }, '九尾一缠，敌为魅惑') },
  { id: 'mozun', n: '魔尊残魂', r: 5, desc: '陨落魔尊的一缕残魂，煞气冲霄', mods: { allP: 9, dmgP: 6 }, sk: '魔煞噬天', skDesc: '攻击时 18% 造成 60% 攻击真实伤害', proc: P('fam_mozun', '魔煞噬天', 'attack', 0.18, { t: 'true', mult: 0.6 }, '魔煞滔天，噬灭根本') },
  { id: 'guolong', n: '山海古龙', r: 5, desc: '上古真龙遗脉，蛰伏于山海之间', mods: { atkP: 15, hpP: 10 }, sk: '真龙吐息', skDesc: '攻击时 12% 造成 100% 攻击伤害', proc: P('fam_guolong', '真龙吐息', 'attack', 0.12, { t: 'dmg', mult: 1.0 }, '真龙吐息，山崩海啸') },
  { id: 'zhuque', n: '朱雀神念', r: 5, desc: '南明离火凝成的一点神念，灼尽诸邪', mods: { dmgP: 8, critDmgAdd: 8 }, sk: '南明离火', skDesc: '攻击时 15% 附加离火（3回合，每回合60%攻击）', proc: P('fam_zhuque', '南明离火', 'attack', 0.15, { t: 'dot', pct: 0.6, rounds: 3, name: '离火' }, '离火缠身，焚尽诸邪') },
  { id: 'xuanwu', n: '玄武神念', r: 5, desc: '北冥玄水之灵，龟蛇盘结，镇守一方', mods: { defP: 14, dmgReduceAdd: 5 }, sk: '玄武镇海', skDesc: '开场 60% 获得 15% 护盾', proc: P('fam_xuanwu', '玄武镇海', 'start', 0.6, { t: 'shield', pct: 15 }, '玄武负图，玄水化盾') },
  { id: 'qilin', n: '麒麟瑞兽', r: 5, desc: '祥瑞之兽踏云而来，所至之处枯木回春', mods: { allP: 8, hpP: 6 }, sk: '祥瑞临身', skDesc: '气血低于40%时 50% 回复 8% 气血', proc: P('fam_qilin', '祥瑞临身', 'lowhp', 0.5, { t: 'heal', pct: 8 }, '麒麟吐瑞，枯木回春') },
]

export const FAM_MAP: Record<string, FamiliarDef> = Object.fromEntries(FAMILIARS.map(f => [f.id, f]))

// 凝形稀有度权重（bonus 由气运/轮回提升高位概率）
export function catchRoll(bonus = 0): FamiliarDef {
  const b = Math.min(6, Math.max(0, bonus))
  const weights = [
    { w: 44 - b, v: 1 }, { w: 27, v: 2 }, { w: 17 + b * 0.4, v: 3 },
    { w: 9 + b, v: 4 }, { w: 3 + b * 0.5, v: 5 },
  ]
  const r = weighted(weights)
  return pick(FAMILIARS.filter(f => f.r === r))
}

// 精怪加成总倍率：等级 +8%/级，星级 +25%/星
export function famScale(level: number, stars: number): number {
  return (1 + 0.08 * (level - 1)) * (1 + 0.25 * (stars - 1))
}
