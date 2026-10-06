import { useState } from 'react';
import { STYLES } from '../data/homeestetData.ts';
import { QUIZ_QUESTIONS, scoreQuiz } from '../utils/quizEngine.ts';
import type { PageView, QuizResult } from '../types.ts';
import { AppImage } from '../components/AppImage.tsx';
import { Sparkles, ArrowRight, ArrowLeft, Check, RotateCcw } from 'lucide-react';

interface StyleQuizPageProps {
  onNavigate: (view: PageView) => void;
  onComplete: (result: QuizResult) => void;
}

export function StyleQuizPage({ onNavigate, onComplete }: StyleQuizPageProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const question = QUIZ_QUESTIONS[step];
  const isLast = step === QUIZ_QUESTIONS.length - 1;
  const answered = Boolean(answers[question.id]);

  const choose = (optionId: string) => setAnswers((prev) => ({ ...prev, [question.id]: optionId }));

  const finish = () => {
    const scored = scoreQuiz(answers);
    const full: QuizResult = { ...scored, completedAt: new Date().toISOString() };
    setResult(full);
    onComplete(full);
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  const primary = result ? STYLES.find((s) => s.id === result.primaryStyleId) ?? STYLES[0] : null;
  const secondary = result?.secondaryStyleId ? STYLES.find((s) => s.id === result.secondaryStyleId) : undefined;

  const optionClass = (selected: boolean, extra = '') =>
    `rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A9A86] ${
      selected ? 'border-[#967259] bg-[#FAF8F5] ring-2 ring-[#967259]/20' : 'border-stone-200 hover:border-stone-400 bg-white'
    } ${extra}`;

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-8 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {!result && (
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Тест-діагностика HomeEstet</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal tracking-tight">«Який стиль підійде моєму дому?»</h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Дайте відповідь на {QUIZ_QUESTIONS.length} простих питань. Кожна відповідь додає бали кільком стилям, а результат визначає їх сума.
            </p>

            <ol className="flex items-center justify-center gap-2 mt-5" aria-label="Прогрес тесту">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <li
                  key={q.id}
                  aria-current={idx === step ? 'step' : undefined}
                  className={`h-1.5 rounded-full transition-all ${idx === step ? 'w-8 bg-[#967259]' : idx < step ? 'w-4 bg-[#8A9A86]' : 'w-4 bg-stone-200'}`}
                >
                  <span className="sr-only">Питання {idx + 1}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!result && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 space-y-6 animate-in" key={question.id}>
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900">{question.title}</h2>

            <div
              role="radiogroup"
              aria-label={question.title}
              className={
                question.layout === 'swatches' || question.layout === 'tiles'
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                  : question.layout === 'cards'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                    : question.layout === 'styles'
                      ? 'grid grid-cols-2 lg:grid-cols-4 gap-3'
                      : 'space-y-2.5'
              }
            >
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                const style = question.layout === 'styles' ? STYLES.find((s) => s.id === option.id) : undefined;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={option.id}
                    onClick={() => choose(option.id)}
                    className={optionClass(
                      selected,
                      question.layout === 'swatches'
                        ? 'p-3.5 flex flex-col justify-between h-24'
                        : question.layout === 'tiles'
                          ? 'p-4 text-center'
                          : question.layout === 'styles'
                            ? 'overflow-hidden flex flex-col'
                            : 'p-4 w-full'
                    )}
                  >
                    {question.layout === 'swatches' && (
                      <span className="w-5 h-5 rounded-full border border-stone-300 block" style={{ backgroundColor: option.swatch }} aria-hidden="true" />
                    )}
                    {style && (
                      <span className="block h-28 bg-stone-100 overflow-hidden">
                        <AppImage image={style.image} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="w-full h-full object-cover" />
                      </span>
                    )}
                    <span className={`block ${style ? 'p-3' : ''}`}>
                      <span className={`font-medium text-stone-900 block ${question.layout === 'tiles' ? 'text-xs sm:text-sm' : 'text-sm'}`}>
                        {option.label}
                      </span>
                      {option.desc && (
                        <span className={`text-stone-500 mt-0.5 block ${style ? 'text-[11px] line-clamp-2' : 'text-xs'}`}>{option.desc}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-black flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Назад
                </button>
              ) : (
                <span />
              )}

              {isLast ? (
                <button
                  type="button"
                  onClick={finish}
                  disabled={!answered}
                  className="px-8 py-3 bg-[#967259] hover:bg-[#7e5f49] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Дізнатися мій стиль</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!answered}
                  className="px-6 py-2.5 bg-[#2C2C2C] hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  Далі <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {result && primary && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-stone-200 shadow-sm space-y-8 animate-in">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Результат діагностики HomeEstet</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal">
                Твій стиль: {primary.name}
                <span className="block text-xl sm:text-2xl text-stone-500 mt-1">{primary.uaName}</span>
              </h1>
              <p className="text-sm text-stone-600 mt-2 max-w-xl mx-auto leading-relaxed">{primary.description}</p>
            </div>

            <div className="rounded-xl overflow-hidden aspect-[16/9] border border-stone-200 bg-stone-100">
              <AppImage image={primary.image} alt={primary.name} priority sizes="(min-width: 768px) 720px, 100vw" className="w-full h-full object-cover" />
            </div>

            <div className="bg-[#FAF8F5] p-6 rounded-xl border border-stone-200">
              <h2 className="font-serif text-xl font-medium text-stone-900 mb-3">Тобі ідеально підійдуть:</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-stone-700">
                {primary.keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#8A9A86] shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-stone-500 mt-4">{primary.recommendedFor}</p>
            </div>

            {secondary && (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 flex items-center gap-4">
                <AppImage image={secondary.image} alt="" sizes="64px" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Також вам може підійти</span>
                  <span className="font-serif text-lg text-stone-900 block">
                    {secondary.name} <span className="text-stone-500 text-sm">({secondary.uaName})</span>
                  </span>
                  <span className="text-xs text-stone-600 block">{secondary.description}</span>
                </div>
              </div>
            )}

            <div className="pt-2 text-center space-y-3">
              <button
                type="button"
                onClick={() => onNavigate({ type: 'zone-builder', zoneId: 'sofa', prefilledStyle: primary.id })}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Показати рішення для мого стилю</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="text-xs text-stone-500">Стиль збережено у вашому кабінеті «Мій HomeEstet» і він буде підставлятися в майстер «Зроби цю зону».</p>
              <button
                type="button"
                onClick={restart}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Пройти тест ще раз</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
