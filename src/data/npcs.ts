// ===== NPC 数据（24 位天骄） =====
export interface NpcDef {
  real: string // 本名
  n: string // 道号
  sect: string // 宗门名或 散修
  align: '正' | '魔' | '中'
  flavor: string
  baseLv: number // 初始境界级别
  growth: number // 隐藏修炼速度系数
}
export const NPC_DEFS: NpcDef[] = [
  { real: '李沧澜', n: '青云散人', sect: '散修', align: '中', flavor: '剑修', baseLv: 3, growth: 1.12 },
  { real: '苏红霓', n: '赤霞仙子', sect: '丹霞谷', align: '正', flavor: '丹修', baseLv: 2, growth: 1.05 },
  { real: '顾长风', n: '流云剑客', sect: '青霄剑宗', align: '正', flavor: '剑修', baseLv: 2, growth: 1.1 },
  { real: '王守一', n: '玄机真人', sect: '太虚观', align: '正', flavor: '阵修', baseLv: 4, growth: 1.0 },
  { real: '姜幽', n: '幽冥鬼母', sect: '幽冥宗', align: '魔', flavor: '魔修', baseLv: 5, growth: 1.15 },
  { real: '雷震霄', n: '天雷子', sect: '青霄剑宗', align: '正', flavor: '雷修', baseLv: 3, growth: 1.08 },
  { real: '赵黑风', n: '黑风老怪', sect: '散修', align: '魔', flavor: '体修', baseLv: 4, growth: 1.06 },
  { real: '楚青衣', n: '青衣剑客', sect: '散修', align: '中', flavor: '剑修', baseLv: 1, growth: 1.02 },
  { real: '白崇山', n: '白发老者', sect: '散修', align: '正', flavor: '散修', baseLv: 6, growth: 0.98 },
  { real: '柳红衣', n: '红衣女修', sect: '丹霞谷', align: '正', flavor: '丹修', baseLv: 1, growth: 1.0 },
  { real: '铁无锋', n: '铁剑先生', sect: '青霄剑宗', align: '正', flavor: '剑修', baseLv: 3, growth: 1.04 },
  { real: '温丹心', n: '丹心居士', sect: '丹霞谷', align: '正', flavor: '丹修', baseLv: 4, growth: 1.0 },
  { real: '石破军', n: '万兽狂人', sect: '万兽山', align: '中', flavor: '御兽', baseLv: 3, growth: 1.09 },
  { real: '张紫霄', n: '紫霄道长', sect: '太虚观', align: '正', flavor: '阵修', baseLv: 5, growth: 1.03 },
  { real: '屠万里', n: '血屠魔君', sect: '幽冥宗', align: '魔', flavor: '魔修', baseLv: 6, growth: 1.18 },
  { real: '周净尘', n: '净尘师太', sect: '太虚观', align: '正', flavor: '阵修', baseLv: 2, growth: 1.02 },
  { real: '沈摘星', n: '摘星楼主', sect: '天工阁', align: '中', flavor: '器修', baseLv: 4, growth: 1.01 },
  { real: '释无相', n: '无相禅师', sect: '散修', align: '正', flavor: '佛修', baseLv: 5, growth: 1.0 },
  { real: '虞九幽', n: '九幽阴姬', sect: '幽冥宗', align: '魔', flavor: '魔修', baseLv: 3, growth: 1.13 },
  { real: '陈玄真', n: '太虚道长', sect: '太虚观', align: '正', flavor: '阵修', baseLv: 7, growth: 0.95 },
  { real: '金大力', n: '金甲力士', sect: '天工阁', align: '中', flavor: '体修', baseLv: 2, growth: 1.06 },
  { real: '柳垂纶', n: '寒江钓叟', sect: '散修', align: '中', flavor: '散修', baseLv: 6, growth: 0.97 },
  { real: '洛玲珑', n: '玲珑仙子', sect: '万兽山', align: '中', flavor: '御兽', baseLv: 2, growth: 1.05 },
  { real: '秦弈', n: '弈山散人', sect: '散修', align: '正', flavor: '棋修', baseLv: 4, growth: 1.0 },
]
