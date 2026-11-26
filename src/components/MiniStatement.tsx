import React from 'react';
import { FileSpreadsheet, Landmark, TrendingUp, Wallet } from 'lucide-react';
import { Player } from '../types/game';
import { calculatePlayerSummary, formatTenge } from '../utils/format';

interface MiniStatementProps {
  player: Player;
  onOpenStatement: () => void;
  onOpenLoan: () => void;
}

export const MiniStatement: React.FC<MiniStatementProps> = ({
  player,
  onOpenStatement,
  onOpenLoan,
}) => {
  const summary = calculatePlayerSummary(player);
  const isFastTrack = player.phase === 'fast_track';

  return (
    <section
      aria-label="Қаржылық қысқаша мәлімет"
      className="bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: player.color }}
          >
            {player.tokenSymbol}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {player.name}
              </h2>
              {player.isBot && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  · Бот
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {player.profession.title} ·{' '}
              {isFastTrack ? 'Еркін жол (2-кезең)' : 'Қарбалас шеңбер (1-кезең)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenStatement}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            Қаржы есебі
          </button>
          {!isFastTrack && (
            <button
              type="button"
              onClick={onOpenLoan}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Landmark className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              Несие
            </button>
          )}
        </div>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            Қолма-қол ақша
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-slate-900 dark:text-white">
            {formatTenge(player.cash)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Пассивті табыс
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-emerald-700 dark:text-emerald-400">
            {formatTenge(summary.passiveIncome)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isFastTrack ? 'Арман құны' : 'Айлық шығын'}
          </div>
          <div className="mt-1 text-sm sm:text-base font-bold font-mono-num text-rose-700 dark:text-rose-400">
            {isFastTrack
              ? formatTenge(player.dream.cost)
              : formatTenge(summary.totalExpenses)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Айлық ақша ағыны
          </div>
          <div
            className={`mt-1 text-sm sm:text-base font-bold font-mono-num ${
              summary.monthlyCashFlow >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {summary.monthlyCashFlow >= 0 ? '+' : ''}
            {formatTenge(summary.monthlyCashFlow)}
          </div>
        </div>
      </div>

      {/* Progress to next phase or victory */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {!isFastTrack ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Еркін жолға шығу мақсаты (Пассивті табыс &gt; Шығын)
              </span>
              <span className="font-bold font-mono-num text-teal-700 dark:text-teal-400">
                {summary.ratRaceProgressPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-teal-500 transition-all duration-300"
                style={{ width: `${summary.ratRaceProgressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Еркін жол табыс мақсаты (+{formatTenge(player.fastTrackTargetPassive)}) немесе Арман: {player.dream.title}
              </span>
              <span className="font-bold font-mono-num text-amber-700 dark:text-amber-400">
                {summary.fastTrackProgressPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${summary.fastTrackProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
