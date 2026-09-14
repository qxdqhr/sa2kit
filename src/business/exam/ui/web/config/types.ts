import type {
  Question,
  StartScreenData,
  ResultModalData,
} from '../types';

export type {
  Question,
  StartScreenData,
  ResultModalData,
  ModalPopEffect,
  TextShakeEffect,
  TextFlashEffect,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  Option,
  SpecialEffect,
  UserAnswer,
  FillBlankQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  QuestionType,
  SpecialEffectType,
} from '../types';

export { QuestionType, SpecialEffectType } from '../types';

export interface ConfigData {
  questions: Question[];
  startScreen: StartScreenData;
  resultModal: ResultModalData;
}

export const EXAM_TYPE_MAP: Record<string, string> = {
  default: 'default',
  arknights: 'arknights',
};
