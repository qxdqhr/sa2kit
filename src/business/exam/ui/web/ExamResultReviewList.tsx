import React from 'react';

type ReviewQuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank' | 'short_answer' | 'essay';

interface ReviewOption {
  id: string;
  content: string;
}

interface ReviewQuestion {
  id: string;
  type: ReviewQuestionType;
  content: string;
  options?: ReviewOption[];
  answer?: string;
  answers?: string[];
}

interface ReviewUserAnswer {
  questionId: string;
  selectedOptions: string[];
}

export interface ExamResultReviewListProps {
  questions: ReviewQuestion[];
  userAnswers: ReviewUserAnswer[];
  skipFillBlank?: boolean;
}

export const ExamResultReviewList: React.FC<ExamResultReviewListProps> = ({
  questions,
  userAnswers,
  skipFillBlank = true,
}) => {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {questions.map((question, index) => {
        const userAnswer = userAnswers.find((answer) => answer.questionId === question.id);

        if (question.type === 'fill_blank' && skipFillBlank) {
          return (
            <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1 font-semibold text-slate-900">第 {index + 1} 题（填空题）</div>
              <div className="text-slate-800">{question.content}</div>
              <div className="mt-2 text-sm text-slate-500">填空题暂不展示答案详情</div>
            </div>
          );
        }

        if (question.type === 'single_choice') {
          const selectedId = userAnswer?.selectedOptions?.[0];
          const correctId = question.answer;
          const selectedOption = question.options?.find((option) => option.id === selectedId);
          const correctOption = question.options?.find((option) => option.id === correctId);
          const isCorrect = !!selectedId && !!correctId && selectedId === correctId;

          return (
            <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1 font-semibold text-slate-900">第 {index + 1} 题（单选题）</div>
              <div className="text-slate-800">{question.content}</div>
              <div className="mt-1 text-slate-700">你的选择：{selectedOption ? selectedOption.content : '未作答'}</div>
              <div className="mt-1 text-slate-700">正确答案：{correctOption ? correctOption.content : correctId || '-'}</div>
              <div className={isCorrect ? 'mt-2 font-semibold text-teal-700' : 'mt-2 font-semibold text-rose-700'}>
                {isCorrect ? '回答正确' : '回答错误'}
              </div>
            </div>
          );
        }

        if (question.type === 'multiple_choice') {
          const selectedIds = userAnswer?.selectedOptions || [];
          const correctIds = question.answers || [];
          const selectedOptions = question.options?.filter((option) => selectedIds.includes(option.id)) || [];
          const correctOptions = question.options?.filter((option) => correctIds.includes(option.id)) || [];
          const isCorrect =
            selectedIds.length === correctIds.length && correctIds.every((answerId) => selectedIds.includes(answerId));

          return (
            <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1 font-semibold text-slate-900">第 {index + 1} 题（多选题）</div>
              <div className="text-slate-800">{question.content}</div>
              <div className="mt-1 text-slate-700">
                你的选择：{selectedOptions.length > 0 ? selectedOptions.map((option) => option.content).join('，') : '未作答'}
              </div>
              <div className="mt-1 text-slate-700">正确答案：{correctOptions.map((option) => option.content).join('，')}</div>
              <div className={isCorrect ? 'mt-2 font-semibold text-teal-700' : 'mt-2 font-semibold text-rose-700'}>
                {isCorrect ? '回答正确' : '回答错误'}
              </div>
            </div>
          );
        }

        return (
          <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-1 font-semibold text-slate-900">第 {index + 1} 题</div>
            <div className="text-slate-800">{question.content}</div>
            <div className="mt-2 text-sm text-slate-500">该题型暂不展示答案详情</div>
          </div>
        );
      })}
    </div>
  );
};
