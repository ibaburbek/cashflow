import React from 'react';
import { Award, Lightbulb, RotateCcw } from 'lucide-react';
import { Player } from '../types/game';
import { calculatePlayerSummary, formatTenge } from '../utils/format';
import { QoshqarMuiizDivider } from './KazakhOrnament';

interface VictoryScreenProps {
  winner: Player;
  winReason: string;
  players: Player[];
  onPlayAgain: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  winReason,
  players,
  onPlayAgain,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-9 h-9" />
          </div>
          <div className="text-xs font-bold tracking-wide text-amber-700 dark:text-amber-400">
            Қаржылық еркіндікке жеттіңіз!
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Жеңімпаз: {winner.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            {winReason}
          </p>
        </div>

        <QoshqarMuiizDivider />

        {/* Players Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Барлық ойыншылардың қорытындысы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const s = calculatePlayerSummary(p);
              const isWinner = p.id === winner.id;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border ${
                    isWinner
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.tokenSymbol}
                      </span>
                      <span className="font-bold text-sm">{p.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {p.phase === 'fast_track' ? 'Еркін жол' : 'Қарбалас шеңбер'}
                    </span>
                  </div>
                  <div className="mt-2.5 text-xs space-y-1 font-mono-num text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Кәсіп:</span>
                      <span className="font-sans">{p.profession.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Пассивті табыс:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatTenge(s.passiveIncome)}/ай
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Қолма-қол:</span>
                      <span>{formatTenge(p.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Активтер / Мәмілелер:</span>
                      <span>{p.stats.dealsBought} рет</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Recap */}
        <div className="p-4 sm:p-5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-900 dark:text-teal-200">
            <Lightbulb className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            Ойыннан басты қаржылық сабақтар
          </div>
          <ul className="text-xs sm:text-sm text-teal-900/90 dark:text-teal-100/90 space-y-1.5 list-disc pl-5">
            <li>Жалақы мөлшері емес, ай соңында қалатын ақша ағыны мен активтер маңызды.</li>
            <li>Тұтынушылық несиелер мен Kaspi Red ақша ағынын азайтады, ал табыс әкелетін активтер еркіндік сыйлайды.</li>
            <li>Депозит, қор нарығы (KASE), жылжымайтын мүлік және бизнесті үйлестіру қаржылық тұрақтылық береді.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          Қайта ойнау (Басты мәзір)
        </button>
      </div>
    </div>
  );
};
