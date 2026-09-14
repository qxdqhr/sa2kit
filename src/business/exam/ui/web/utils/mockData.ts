import { Question, QuestionType, ResultModalData, SpecialEffectType, StartScreenData } from '../types';

// 创建模拟题目数据
export const mockQuestions: Question[] = [
  {
    id: '1',
    content: '一般情况下，干员维什戴尔最多可以在场上召唤多少"祖宗"召唤物同时在场?',
    type: QuestionType.SingleChoice,
    options: [
      { id: '1a', content: '1' },
      { id: '1b', content: '2' },
      { id: '1c', content: '3' },
      { id: '1d', content: '4' },
    ],
    answer: '1c',
    score: 2,
  },
  {
    id: '2',
    content: '在故事集"熔炉还魂记"中锡人最后离开卡兹戴尔的时候带走了几位同类?',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '2a', content: '1' },
      { id: '2b', content: '2' },
      { id: '2c', content: '3' },
      { id: '2d', content: '4' },
    ],
    answers: ['2a', '2b', '2d'],
    score: 3,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示',
      content: '检测到系统自动判题系统下线,请检测系统安全。',
      buttonText: '我明白了'
    }
  },
  {
    id: '3',
    content: '年的ep的名称是？',
    type: QuestionType.SingleChoice,
    options: [
      { id: '3a', content: '嚣' },
      { id: '3b', content: '器' },
      { id: '3c', content: '器' },
      { id: '3d', content: '嚣' },
    ],
    answer: '3d',
    score: 2,
    specialEffect: {
      type: SpecialEffectType.TextShake
    }
  },
  {
    id: '4',
    content: '以下哪个词条可以在公开招募里招募到一星干员？',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '4a', content: '支援' },
      { id: '4b', content: '输出' },
      { id: '4c', content: '群攻' },
      { id: '4d', content: '减速' },
    ],
    answers: ['4a', '4c', '4d'],
    score: 3,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示',
      content: '提示示是是是试试：\\u81ea\\u52a8\\u5224\\u9898系统模块缺失,可能会影响您的考试。',
      buttonText: '我明白了'
    }
  },
  {
    id: '5',
    content: '(出题人：上帝大哥)开斯特公爵的旗舰舰名是？',
    type: QuestionType.SingleChoice,
    options: [
      { id: '5a', content: '精益号' },
      { id: '5b', content: '勇敢者号' },
      { id: '5c', content: '荣光号' },
      { id: '5d', content: '福灵号' },
    ],
    answer: '5b',
    score: 2,
    specialEffect: {
      type: SpecialEffectType.TextFlash
    }
  },
  {
    id: '6',
    content: '(出题人：上帝大哥)开斯特公爵的旗舰舰名是？',
    type: QuestionType.SingleChoice,
    options: [
      { id: '6a', content: '精益号' },
      { id: '6b', content: '勇敢者号' },
      { id: '6c', content: '荣光号' },
      { id: '6d', content: '福灵号' },
    ],
    answer: '5b',
    score: 2,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示',
      content: '系统异常解除,人工判卷已上线，请正常进行考试。',
      buttonText: '我明白了'
    }
  },
  {
    id: '7',
    content: '下列干员中身高最高的是？',
    type: QuestionType.SingleChoice,
    options: [
      { id: '7a', content: '凛视' },
      { id: '7b', content: '星熊' },
      { id: '7c', content: '哈洛德' },
      { id: '7d', content: '山' },
    ],
    answer: '7b',
    score: 2,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示',
      content: '系统异常解除,人工判卷已上线，请正常进行考试。',
      buttonText: '我明白了好久不见博士'
    }
  },
  {
    id: '8',
    content: '以下罗德岛职员为术师的是？',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '7a', content: '凛视' },
      { id: '7b', content: '星熊' },
      { id: '7c', content: '哈洛德' },
      { id: '7d', content: '山' },
    ],
    answers: ['7a', '7b', '7c'],
    score: 2,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示',
      content: '本题为多选题，请选择所有正确选项。我们还是没有实现一起醒来的约定',
      buttonText: '我明白了'
    }
  },
  {
    id: '9',
    content: '以下罗德岛职员为术师的是？',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '7a', content: '凛视' },
      { id: '7b', content: '星熊' },
      { id: '7c', content: '哈洛德' },
      { id: '7d', content: '山' },
    ],
    answers: ['7a', '7b', '7c'],
    score: 2,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示:但我不会责怪你,预言家从来如一',
      content: '本题为多选题，请选择所有正确选项。',
      buttonText: '我明白了'
    }
  },
  {
    id: '9',
    content: '以下罗德岛职员为术师的是？但在考试时被打扰还是有些失礼',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '7a', content: '凛视' },
      { id: '7b', content: '星熊' },
      { id: '7c', content: '哈洛德' },
      { id: '7d', content: '山' },
    ],
    answers: ['7a', '7b', '7c'],
    score: 2,
    specialEffect: {
      type: SpecialEffectType.ModalPop,
      title: '提示:',
      content: '本题为多选题，请选择所有正确选项。',
      buttonText: '我明白了'
    }
  },
  {
    id: '9',
    content: '以下罗德岛职员为术师的是？',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '7a', content: '凛视但你' },
      { id: '7b', content: '星熊总能' },
      { id: '7c', content: '哈洛德理解我的' },
      { id: '7d', content: '山不是吗' },
    ],
    answers: ['7a', '7b', '7c'],
    score: 2,
    specialEffect: {
      type: SpecialEffectType.TextShake,
    }
  },
  {
    id: '9',
    content: '等考试结束希以下罗德岛望我们职员为术师的是？还能继续推进我',
    type: QuestionType.MultipleChoice,
    options: [
      { id: '7a', content: '凛视们之前' },
      { id: '7b', content: '星熊的计划' },
      { id: '7c', content: '哈洛德' },
      { id: '7d', content: '山不是吗' },
    ],
    answers: ['7a', '7b', '7c'],
    score: 2,
    specialEffect: {
      type: SpecialEffectType.TextFlash,
    }
  },

];

// 创建启动页数据
export const mockStartScreenData: StartScreenData = {
  title: "2025年普通高等学校招生统一考试(百灶一卷)",
  description: "欢迎参加本次考试！本场考试内容为明日方舟综合知识，考试形式为开卷。请仔细阅读题目，并在规定时间内完成作答。",
  rules: {
    title: "考试须知：",
    items: [
      "答题前，请先将自己的游戏ID, 准考证号，考场号，座位号等有效信息准确无误填写在试卷上。",
      "考试期间，请看管好您的PRTS, 以免影响考场秩序。考试过程中禁止对试卷施加任何源石技艺。",
      "如有违反考试纪律的，依照炎礼教[1055]18号《大炎教育考试违规处理办法》处置。",
      "普瑞赛斯在看着你，请专心答题。"
    ]
  },
  buttonText: "开始答题"
}; 

// 创建结果页弹窗数据
export const mockResultModalData: ResultModalData = {
  title: "考试结果分析完成",
  showDelayTime: 5000, // 5秒后显示弹窗
  messages: {
    pass: "您已经查看了成绩报告，恭喜您完成考试！需要重新测试吗？",
    fail: "你果然还记得我们的过去，即使是新生文明，也无法逃脱即将毁灭的未来"
  },
  buttonText: "关闭",
  passingScore: 60 // 60%为及格线
}; 