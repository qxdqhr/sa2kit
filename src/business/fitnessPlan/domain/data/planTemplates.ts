import type { PlanItemInput } from '../types';

export interface PlanTemplateDefinition {
  id: string;
  name: string;
  description: string;
  goalTags: string[];
  items: PlanItemInput[];
}

export const PLAN_TEMPLATES: PlanTemplateDefinition[] = [
  {
    id: 'push-pull-legs-push',
    name: '推拉腿 · 推日',
    description: '胸肩三头为主的上肢推类训练日',
    goalTags: ['muscle_gain', 'strength'],
    items: [
      { exerciseName: '杠铃卧推', targetSets: 4, targetReps: 8, restSeconds: 120 },
      { exerciseName: '哑铃推举', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '上斜卧推', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '侧平举', targetSets: 3, targetReps: 15, restSeconds: 60 },
      { exerciseName: '绳索下压', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'push-pull-legs-pull',
    name: '推拉腿 · 拉日',
    description: '背二头为主的上肢拉类训练日',
    goalTags: ['muscle_gain', 'strength'],
    items: [
      { exerciseName: '硬拉', targetSets: 3, targetReps: 5, restSeconds: 180 },
      { exerciseName: '引体向上', targetSets: 4, targetReps: 8, restSeconds: 120 },
      { exerciseName: '杠铃划船', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '面拉', targetSets: 3, targetReps: 15, restSeconds: 60 },
      { exerciseName: '杠铃弯举', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'push-pull-legs-legs',
    name: '推拉腿 · 腿日',
    description: '下肢与核心训练日',
    goalTags: ['muscle_gain', 'strength'],
    items: [
      { exerciseName: '杠铃深蹲', targetSets: 4, targetReps: 8, restSeconds: 150 },
      { exerciseName: '罗马尼亚硬拉', targetSets: 3, targetReps: 10, restSeconds: 120 },
      { exerciseName: '腿举', targetSets: 3, targetReps: 12, restSeconds: 90 },
      { exerciseName: '腿弯举', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseName: '提踵', targetSets: 4, targetReps: 15, restSeconds: 45 },
    ],
  },
  {
    id: 'upper-lower-upper',
    name: 'Upper/Lower · 上肢',
    description: '上肢推拉综合',
    goalTags: ['muscle_gain', 'strength'],
    items: [
      { exerciseName: '杠铃卧推', targetSets: 4, targetReps: 8, restSeconds: 120 },
      { exerciseName: '杠铃划船', targetSets: 4, targetReps: 8, restSeconds: 120 },
      { exerciseName: '哑铃推举', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '高位下拉', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '锤式弯举', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'upper-lower-lower',
    name: 'Upper/Lower · 下肢',
    description: '下肢与核心',
    goalTags: ['muscle_gain', 'strength'],
    items: [
      { exerciseName: '杠铃深蹲', targetSets: 4, targetReps: 6, restSeconds: 150 },
      { exerciseName: '保加利亚分腿蹲', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '腿屈伸', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseName: '腿弯举', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseName: '平板支撑', targetSets: 3, targetReps: 1, restSeconds: 60 },
    ],
  },
  {
    id: 'cardio-strength-mix',
    name: '有氧 + 力量 · 综合',
    description: '一次力量 + 一次有氧的混合周计划单元',
    goalTags: ['fat_loss', 'endurance', 'maintain'],
    items: [
      { exerciseName: '杠铃深蹲', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseName: '俯卧撑', targetSets: 3, targetReps: 15, restSeconds: 60 },
      { exerciseName: '坐姿划船', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseName: '跑步', targetDurationMinutes: 25 },
      { exerciseName: '跳绳', targetDurationMinutes: 10 },
    ],
  },
];

export const PLAN_TEMPLATE_GROUPS = [
  {
    id: 'push-pull-legs',
    title: '推拉腿',
    templateIds: ['push-pull-legs-push', 'push-pull-legs-pull', 'push-pull-legs-legs'],
  },
  {
    id: 'upper-lower',
    title: 'Upper/Lower',
    templateIds: ['upper-lower-upper', 'upper-lower-lower'],
  },
  {
    id: 'cardio-strength',
    title: '有氧+力量周循环',
    templateIds: ['cardio-strength-mix'],
  },
] as const;
