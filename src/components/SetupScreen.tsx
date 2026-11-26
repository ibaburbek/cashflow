import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  Moon,
  Play,
  RotateCcw,
  Sun,
  User,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DREAMS } from '../data/assets';
import { PROFESSIONS } from '../data/professions';
import { ThemeMode } from '../types/game';
import { formatTenge } from '../utils/format';
import { QoshqarMuiizDivider, QoshqarMuiizEmblem } from './KazakhOrnament';

export interface PlayerDraft {
  name: string;
  isBot: boolean;
  professionId: string;
  dreamId: string;
}

interface SetupScreenProps {
  hasSavedGame: boolean;
  theme: ThemeMode;
  soundEnabled: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onResumeSavedGame: () => void;
  onOpenRules: () => void;
  onStartNewGame: (drafts: PlayerDraft[]) => void;
}

const DEFAULT_NAMES = [
  'Айдын',
  'Мәдина',
  'Ерлан (Бот)',
  'Әсел (Бот)',
  'Дамир',
  'Жанерке',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  hasSavedGame,
  theme,
  soundEnabled,
  onToggleTheme,
  onToggleSound,
  onResumeSavedGame,
  onOpenRules,
  onStartNewGame,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [botQuickMode, setBotQuickMode] = useState<boolean>(true);
  const [drafts, setDrafts] = useState<PlayerDraft[]>(() =>
    Array.from({ length: 6 }).map((_, idx) => ({
      name: idx === 0 ? 'Ойыншы 1' : idx === 1 ? 'Бот Арман' : DEFAULT_NAMES[idx],
      isBot: idx === 1,
      professionId: PROFESSIONS[idx % PROFESSIONS.length].id,
      dreamId: DREAMS[idx % DREAMS.length].id,
    }))
  );

  const handleCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handleBotModeToggle = (vsBot: boolean) => {
    setBotQuickMode(vsBot);
    setDrafts((prev) =>
      prev.map((d, idx) => {
        if (idx === 0) return { ...d, isBot: false };
        if (vsBot) {
          return {
            ...d,
            isBot: true,
            name: d.name.includes('Бот') ? d.name : `Бот ${idx}`,
          };
        }
        return {
          ...d,
          isBot: false,
          name: d.name.startsWith('Бот') ? `Ойыншы ${idx + 1}` : d.name,
        };
      })
    );
  };

  const updateDraft = (index: number, patch: Partial<PlayerDraft>) => {
    setDrafts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const activeDrafts = drafts.slice(0, playerCount);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Clean 3-zone top bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#131C26]/85 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <QoshqarMuiizEmblem className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Қаржы Ағыны
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={onOpenRules}
              className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              Ойын ережесі
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Дыбысты өшіру' : 'Дыбысты қосу'}
              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Жарық режим' : 'Қараңғы режим'}
              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400">
            Қазақстандық қаржылық сауаттылық үстел ойыны
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
            Қарбалас шеңберден Еркін жолға шығыңыз
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Кәсіп таңдап, салық пен несиені басқарыңыз, депозит, акция, жылжымайтын мүлік және бизнес арқылы пассивті табыс құрыңыз.
          </p>

          {hasSavedGame && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onResumeSavedGame}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Сақталған ойынды жалғастыру
              </button>
            </div>
          )}
        </section>

        <QoshqarMuiizDivider className="max-w-xl mx-auto" />

        {/* Setup Panel */}
        <section className="bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            {/* Player Count */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                Ойыншылар саны (1–6)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCountChange(num)}
                    className={`w-11 h-11 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      playerCount === num
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Play vs Bots / Hot-seat Toggle */}
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Ойын режимі
              </span>
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleBotModeToggle(true)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    botQuickMode
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  Ботпен ойнау
                </button>
                <button
                  type="button"
                  onClick={() => handleBotModeToggle(false)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    !botQuickMode
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Бір құрылғыда (Достармен)
                </button>
              </div>
            </div>
          </div>

          {/* Players Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDrafts.map((draft, idx) => {
              const prof =
                PROFESSIONS.find((p) => p.id === draft.professionId) || PROFESSIONS[0];
              const taxes =
                prof.taxBreakdown.ipn +
                prof.taxBreakdown.opv +
                prof.taxBreakdown.vosms +
                prof.taxBreakdown.other;
              const expenses =
                taxes +
                prof.housingExpense +
                prof.autoExpense +
                prof.kaspiRedExpense +
                prof.otherLoanExpense +
                prof.livingExpense;
              const cashflow = prof.grossSalary - expenses;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                      {idx + 1}-ойыншы
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => updateDraft(idx, { isBot: !draft.isBot })}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          draft.isBot
                            ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {draft.isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {draft.isBot ? 'Бот' : 'Адам'}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Есімі
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      maxLength={24}
                      onChange={(e) => updateDraft(idx, { name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Кәсіпті таңдау
                    </label>
                    <select
                      value={draft.professionId}
                      onChange={(e) =>
                        updateDraft(idx, { professionId: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {PROFESSIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick profession preview */}
                  <div className="pt-1 text-xs space-y-1 text-slate-600 dark:text-slate-400 font-mono-num">
                    <div className="flex justify-between">
                      <span>Жалақы:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {formatTenge(prof.grossSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Шығыс:</span>
                      <span className="text-rose-700 dark:text-rose-400">
                        {formatTenge(expenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ақша ағыны:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        +{formatTenge(cashflow)}/ай
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Бастапқы қор:</span>
                      <span>{formatTenge(prof.startingSavings)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Жеке Арман (2-кезең мақсаты)
                    </label>
                    <select
                      value={draft.dreamId}
                      onChange={(e) => updateDraft(idx, { dreamId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {DREAMS.map((dr) => (
                        <option key={dr.id} value={dr.id}>
                          {dr.title} ({formatTenge(dr.cost)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ойын барысы браузер жадында автоматты түрде сақталады.
            </p>
            <button
              type="button"
              onClick={() => onStartNewGame(activeDrafts)}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-base font-bold shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Play className="w-5 h-5" />
              Жаңа ойын бастау
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
