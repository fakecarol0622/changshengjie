// ===== 仙途故人 · 剧情人物志 =====
// 主线卷宗里登场的人物，常驻「众生百态」；状态随剧情读卷进度推进（无存档字段，全部由 story.done 派生）。
export interface StoryNpcStage {
  after: string // 已读完该卷后进入此状态
  status: string // 状态词（卡片 chip）
  desc: string // 近况一句话
  gone?: boolean // 已离场（坐化/身殁，卡片灰显）
}

export interface StoryNpcDef {
  id: string
  real: string // 本名
  name: string // 道号 / 称谓
  title: string // 身份
  sect: string
  align: '正' | '中' | '魔'
  appear: string // 登场卷：读完该卷后出现在众生百态
  first: { status: string; desc: string } // 首现状态
  stages: StoryNpcStage[] // 剧情推进状态（按序覆盖）
}

export const STORY_NPCS: StoryNpcDef[] = [
  {
    id: 'shen_cangfeng', real: '沈藏锋', name: '藏锋老人', title: '磨刀人', sect: '无门无派', align: '正',
    appear: 'm1',
    first: { status: '磨刀摊老人', desc: '街对面的磨刀摊老人。他没抬头，就问你：「昨儿夜里那条阶，滑不滑？」' },
    stages: [
      { after: 'm2', status: '师尊', desc: '你拜在他门下，第一课是磨刀。他说：世上最快的路，是先学会慢。' },
      { after: 'm12', status: '第九代守碑人', desc: '磨刀摊下藏着三百年——他扫了无字碑三百年，是第九代守碑人。守碑，守的是那句没答完的话。' },
      { after: 'm19', status: '坐化', desc: '他走在一个无云的夜里，把「问道」印留给了你。「天要黑了——这回，换你守。」', gone: true },
    ],
  },
  {
    id: 'cen_xingyao', real: '岑星遥', name: '司辰', title: '司天监观星人', sect: '司天监', align: '正',
    appear: 'm6',
    first: { status: '司天监观星人', desc: '落雁城废墟里，她抱着星图说：塌的不是城，是天秤上被挪走的一角。' },
    stages: [
      { after: 'm7', status: '司天监观星人', desc: '她带你看过观星台的四象星盘：宝树潮、万兽潮、仙武论道、天劫雷渊——灵气，正在退潮。' },
      { after: 'm16', status: '数尽', desc: '观星人以命算天。她算到了头：三年后的初雪。她说：替我看一眼，它睁眼。' },
      { after: 'm21', status: '已逝', desc: '入冬那天走的。走前把星盘擦得干干净净，只留一句：三年后的初雪，就是那天。', gone: true },
    ],
  },
  {
    id: 'gu_fenzhou', real: '顾焚舟', name: '焚舟', title: '天工阁少主', sect: '天工阁', align: '中',
    appear: 'm5',
    first: { status: '天工阁少主', desc: '仙武论道台上，机关鸟落在你肩上。他说：它挑人——它挑得比我的眼睛准。' },
    stages: [
      { after: 'm10', status: '开天盟盟主', desc: '他立开天盟：与其等它醒来碾碎人间，不如请它早醒。一场雨里，你们各走一边。' },
      { after: 'm13', status: '开天盟盟主·凿渠人', desc: '他在北境凿引龙渠。信上只有一行字：看一眼渠，看一眼人，再开口。' },
      { after: 'm18', status: '殁于引龙渠', desc: '渠崩那夜，他留下一句话：是我错了，还是这世道，没给我们资格错。', gone: true },
    ],
  },
]
