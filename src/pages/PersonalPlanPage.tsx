import { useState } from 'react';
import { PLAN_TASKS } from '../data/homeestetData.ts';
import type { PageView, PlanState } from '../types.ts';
import { formatUAH } from '../utils/format.ts';
import { Printer, Clock, ArrowRight, Trash2, ExternalLink } from 'lucide-react';

interface PersonalPlanPageProps {
  plan: PlanState;
  onToggleTask: (taskId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onNavigate: (view: PageView) => void;
}

const WEEKS: { num: number | 'all'; title: string }[] = [
  { num: 'all', title: 'Весь план на 30 днів' },
  { num: 1, title: 'Тиждень 1: Порядок' },
  { num: 2, title: 'Тиждень 2: Текстиль' },
  { num: 3, title: 'Тиждень 3: Освітлення' },
  { num: 4, title: 'Тиждень 4: Декор' },
];

export function PersonalPlanPage({ plan, onToggleTask, onRemoveEntry, onNavigate }: PersonalPlanPageProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  const filteredTasks = selectedWeek === 'all' ? PLAN_TASKS : PLAN_TASKS.filter((t) => t.week === selectedWeek);

  const entryTaskIds = plan.entries.flatMap((entry) => entry.tasks.map((task) => `${entry.id}:${task.id}`));
  const allTaskIds = [...PLAN_TASKS.map((t) => t.id), ...entryTaskIds];
  const completedCount = plan.completedTaskIds.filter((id) => allTaskIds.includes(id)).length;
  const totalTasks = allTaskIds.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  const isDone = (id: string) => plan.completedTaskIds.includes(id);

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#967259] font-semibold block mb-1">Персональний ритм</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2C2C] font-normal tracking-tight">📋 Твій план оновлення дому на 30 днів</h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl">
              Покроковий план трансформації без вигорання та стресу: від розхламлення та теплого світла до фінального затишку. Прогрес зберігається у вашому браузері.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Друк плану</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-stone-800">Ваш прогрес оновлення простору:</span>
            <span className="font-mono font-bold text-[#967259]">
              {completedCount} з {totalTasks} завдань ({progressPercent}%)
            </span>
          </div>
          <div
            className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Прогрес плану"
          >
            <div className="h-full bg-[#8A9A86] transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-[11px] text-stone-500">
            {progressPercent === 100
              ? '🎉 Вітаємо! Ваш дім повністю перетворено за методикою HomeEstet!'
              : 'Виконуйте по 1 кроку щотижня, відмічаючи чекбокси.'}
          </p>
        </div>

        {plan.entries.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-[#2C2C2C] font-normal">Мої рішення в плані ({plan.entries.length})</h2>
            {plan.entries.map((entry) => (
              <div key={entry.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6D4C2] shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-[#967259] font-medium block">{entry.zoneName}</span>
                    <h3 className="font-serif text-xl font-medium text-stone-900 mt-0.5">{entry.title}</h3>
                    <span className="text-xs text-stone-500 block mt-1">
                      Бюджет: <strong>{formatUAH(entry.budget)}</strong> · додано {new Date(entry.addedAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {entry.params && (
                      <button
                        type="button"
                        onClick={() => onNavigate({ type: 'zone-builder', zoneId: entry.zoneId, params: entry.params })}
                        className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
                        title="Відкрити рішення"
                        aria-label="Відкрити рішення"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveEntry(entry.id)}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      title="Прибрати з плану"
                      aria-label="Прибрати з плану"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {entry.tasks.map((task) => {
                    const id = `${entry.id}:${task.id}`;
                    const done = isDone(id);
                    return (
                      <li key={id}>
                        <label
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#8A9A86] ${
                            done ? 'bg-[#F2EFE9] border-[#D9D3C7] text-stone-500' : 'bg-[#FAF8F5] border-stone-200 hover:border-stone-400 text-stone-900'
                          }`}
                        >
                          <input type="checkbox" checked={done} onChange={() => onToggleTask(id)} className="mt-1 w-4 h-4 accent-[#8A9A86] shrink-0" />
                          <span className="block">
                            <span className={`text-sm font-medium block ${done ? 'line-through' : ''}`}>
                              {task.id}. {task.title}
                            </span>
                            <span className="text-xs text-stone-600 block mt-0.5">{task.description}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl w-fit" role="group" aria-label="Фільтр за тижнем">
          {WEEKS.map((week) => (
            <button
              type="button"
              key={week.title}
              onClick={() => setSelectedWeek(week.num)}
              aria-pressed={selectedWeek === week.num}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedWeek === week.num ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {week.title}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {filteredTasks.map((task) => {
            const done = isDone(task.id);
            return (
              <li key={task.id}>
                <label
                  className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#8A9A86] ${
                    done ? 'bg-[#F2EFE9] border-[#D9D3C7] text-stone-500' : 'bg-white border-stone-200 hover:border-stone-400 text-stone-900 shadow-2xs'
                  }`}
                >
                  <input type="checkbox" checked={done} onChange={() => onToggleTask(task.id)} className="mt-1 w-5 h-5 accent-[#8A9A86] shrink-0" />

                  <span className="flex-1 min-w-0 block">
                    <span className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[#967259]">{task.category}</span>
                        <span className="text-stone-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-stone-500">{task.weekTitle.split(' — ')[0]}</span>
                      </span>

                      <span className="flex items-center gap-3 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" aria-hidden="true" />
                          {task.estimatedMinutes} хв
                        </span>
                        <span className="font-medium text-stone-700">{task.costEstimate === 0 ? '0 ₴ (безкоштовно)' : `~${formatUAH(task.costEstimate)}`}</span>
                      </span>
                    </span>

                    <span className={`font-serif text-base sm:text-lg font-medium leading-snug block ${done ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs sm:text-sm mt-1 leading-relaxed block ${done ? 'text-stone-400' : 'text-stone-600'}`}>{task.description}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="p-6 bg-[#FAF2EB] rounded-2xl border border-[#E6D4C2] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-serif text-lg font-medium text-stone-900">Потрібна конкретна допомога з однією кімнатою?</h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Скористайтеся функцією «Зроби цю зону», щоб отримати персоналізовані товари та розрахунок бюджету, і додайте результат у цей план.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'zone-builder' })}
            className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0"
          >
            <span>Зробити мою зону</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
