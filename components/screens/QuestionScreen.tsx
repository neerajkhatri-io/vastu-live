import type { Question } from '@/lib/questions';

interface QuestionScreenProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (id: string, answer: boolean) => void;
}

export default function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
}: QuestionScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-10">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-colors"
            style={{
              backgroundColor: i === questionIndex ? '#C17F2B' : 'transparent',
              border: `2px solid ${i <= questionIndex ? '#C17F2B' : '#d1d5db'}`,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Question {questionIndex + 1} of {totalQuestions}
        </p>

        <h2
          className="text-2xl font-semibold text-gray-800 leading-snug max-w-sm"
          style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}
        >
          {question.text}
        </h2>

        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 max-w-sm">
          <p className="text-sm text-gray-500 leading-relaxed">
            💡 {question.hint}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm w-full mx-auto">
        <button
          onClick={() => onAnswer(question.id, true)}
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold active:opacity-80 transition-opacity"
          style={{ backgroundColor: '#15803d', minHeight: '56px' }}
        >
          ✅ Yes
        </button>
        <button
          onClick={() => onAnswer(question.id, false)}
          className="w-full py-4 rounded-2xl text-gray-700 text-lg font-semibold bg-gray-100 active:opacity-70 transition-opacity"
          style={{ minHeight: '56px' }}
        >
          ❌ No
        </button>
      </div>
    </div>
  );
}
