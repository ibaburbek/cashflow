import React from 'react';
import { X } from 'lucide-react';
import { Player } from '../types/game';
import { calculatePlayerSummary, formatTenge } from '../utils/format';

interface FinancialStatementModalProps {
  player: Player;
  onClose: () => void;
  onPayLiability: (liabilityId: string) => void;
  onRepayBankLoan: (amount: number) => void;
}

export const FinancialStatementModal: React.FC<FinancialStatementModalProps> = ({
  player,
  onClose,
  onPayLiability,
  onRepayBankLoan,
}) => {
  const summary = calculatePlayerSummary(player);
  const { profession } = player;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Қаржылық есеп"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-white/95 dark:bg-[#131C26]/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Қаржылық есеп — {player.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {profession.title} · Қолма-қол: {formatTenge(player.cash)} · Арман: {player.dream.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Top KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Жалпы табыс</div>
              <div className="mt-1 text-base font-bold font-mono-num text-slate-900 dark:text-white">
                {formatTenge(summary.totalIncome)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Пассивті табыс</div>
              <div className="mt-1 text-base font-bold font-mono-num text-emerald-700 dark:text-emerald-400">
                {formatTenge(summary.passiveIncome)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Жалпы шығыс</div>
              <div className="mt-1 text-base font-bold font-mono-num text-rose-700 dark:text-rose-400">
                {formatTenge(summary.totalExpenses)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <div className="text-xs text-teal-800 dark:text-teal-300">Айлық ақша ағыны</div>
              <div className="mt-1 text-base font-bold font-mono-num text-teal-900 dark:text-teal-200">
                {summary.monthlyCashFlow >= 0 ? '+' : ''}
                {formatTenge(summary.monthlyCashFlow)}
              </div>
            </div>
          </div>

          {/* Income & Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Income */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Табыстар (Айлық)
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-slate-400">Жалақы / негізгі табыс</dt>
                  <dd className="font-semibold font-mono-num text-slate-900 dark:text-white">
                    {formatTenge(summary.salary)}
                  </dd>
                </div>
                {player.phase === 'rat_race' ? (
                  player.assets
                    .filter((a) => a.monthlyCashFlow > 0)
                    .map((a) => (
                      <div key={a.instanceId} className="flex justify-between gap-2">
                        <dt className="text-slate-600 dark:text-slate-400 truncate">
                          {a.title} {a.quantity > 1 ? `(×${a.quantity})` : ''}
                        </dt>
                        <dd className="font-semibold font-mono-num text-emerald-700 dark:text-emerald-400 shrink-0">
                          +{formatTenge(a.monthlyCashFlow * a.quantity)}
                        </dd>
                      </div>
                    ))
                ) : (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-slate-400">Еркін жол бизнес ағыны</dt>
                    <dd className="font-semibold font-mono-num text-emerald-700 dark:text-emerald-400">
                      +{formatTenge(summary.passiveIncome)}
                    </dd>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold">
                  <dt>Барлық табыс</dt>
                  <dd className="font-mono-num">{formatTenge(summary.totalIncome)}</dd>
                </div>
              </dl>
            </div>

            {/* Expenses */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Шығыстар (Айлық)
              </h3>
              {player.phase === 'fast_track' ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Сіз Қарбалас шеңберден шықтыңыз! Бұл кезеңде тұрмыстық шығындар пассивті табыспен толық жабылған.
                </p>
              ) : (
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-slate-400">
                      Салықтар (ИПН, ОПВ 10%, ВОСМС 2%)
                    </dt>
                    <dd className="font-mono-num text-slate-900 dark:text-slate-200">
                      {formatTenge(summary.totalTaxes)}
                    </dd>
                  </div>
                  <div className="pl-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 font-mono-num">
                    <span>ИПН: {formatTenge(profession.taxBreakdown.ipn)}</span>
                    <span>ОПВ: {formatTenge(profession.taxBreakdown.opv)}</span>
                    <span>ВОСМС: {formatTenge(profession.taxBreakdown.vosms)}</span>
                    {profession.taxBreakdown.other > 0 && (
                      <span>Салық: {formatTenge(profession.taxBreakdown.other)}</span>
                    )}
                  </div>

                  {summary.housingExpense > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">
                        {profession.housingLabel}
                      </dt>
                      <dd className="font-mono-num">{formatTenge(summary.housingExpense)}</dd>
                    </div>
                  )}

                  {player.liabilities.map((l) => (
                    <div key={l.id} className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">{l.name}</dt>
                      <dd className="font-mono-num">{formatTenge(l.monthlyPayment)}</dd>
                    </div>
                  ))}

                  {player.bankLoan > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-amber-700 dark:text-amber-400">
                        Банк несиесі пайызы (10%)
                      </dt>
                      <dd className="font-mono-num text-amber-700 dark:text-amber-400">
                        {formatTenge(summary.bankLoanInterest)}
                      </dd>
                    </div>
                  )}

                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-slate-400">
                      Коммуналдық төлем, азық-түлік, жолақы
                    </dt>
                    <dd className="font-mono-num">{formatTenge(summary.livingExpense)}</dd>
                  </div>

                  {player.childrenCount > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-slate-400">
                        Балалар шығыны ({player.childrenCount} бала)
                      </dt>
                      <dd className="font-mono-num">{formatTenge(summary.childrenExpense)}</dd>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold">
                    <dt>Барлық шығыс</dt>
                    <dd className="font-mono-num text-rose-700 dark:text-rose-400">
                      {formatTenge(summary.totalExpenses)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* Balance Sheet: Assets & Liabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Assets */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Активтер ({player.assets.length})
              </h3>
              {player.assets.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Әзірге активтер жоқ. «Мүмкіндік» ұяшығына түскенде алғашқы инвестицияңызды жасаңыз.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {player.assets.map((asset) => (
                    <li key={asset.instanceId} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {asset.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                          {asset.ticker
                            ? `${asset.quantity} дана · ${formatTenge(asset.unitCost)}/дана`
                            : `Жарна: ${formatTenge(asset.downPaymentPaid)}`}
                          {asset.mortgage > 0 ? ` · Ипотека: ${formatTenge(asset.mortgage)}` : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono-num shrink-0">
                        {asset.monthlyCashFlow > 0 ? (
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            +{formatTenge(asset.monthlyCashFlow * asset.quantity)}/ай
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Құны: {formatTenge(asset.unitCost * asset.quantity)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Liabilities */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Міндеттемелер (Қарыздар)
              </h3>
              {player.liabilities.length === 0 && player.bankLoan === 0 && player.assets.every((a) => a.mortgage === 0) ? (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Құттықтаймыз! Барлық жеке қарыздарыңыз өтелген.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {player.bankLoan > 0 && (() => {
                    const stepAmt = Math.min(
                      player.bankLoan,
                      player.bankLoan >= 100_000 ? 100_000 : 10_000
                    );
                    return (
                      <li className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-amber-800 dark:text-amber-300">
                            Банк несиесі (10%/ай)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                            Қалдық: {formatTenge(player.bankLoan)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={player.cash < stepAmt}
                            onClick={() => onRepayBankLoan(stepAmt)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-200 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                          >
                            -{formatTenge(stepAmt)}
                          </button>
                          <button
                            type="button"
                            disabled={player.cash < player.bankLoan}
                            onClick={() => onRepayBankLoan(player.bankLoan)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                          >
                            Толық
                          </button>
                        </div>
                      </li>
                    );
                  })()}

                  {player.liabilities.map((l) => (
                    <li key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {l.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                          Қалдық: {formatTenge(l.balance)} · {formatTenge(l.monthlyPayment)}/ай
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={player.cash < l.balance}
                        onClick={() => onPayLiability(l.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Толық жабу
                      </button>
                    </li>
                  ))}

                  {player.assets
                    .filter((a) => a.mortgage > 0)
                    .map((a) => (
                      <li key={`${a.instanceId}_debt`} className="py-2 flex items-center justify-between gap-2">
                        <div className="text-slate-700 dark:text-slate-300 truncate">
                          {a.title} (Ипотека/Несие)
                        </div>
                        <div className="font-mono-num text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                          {formatTenge(a.mortgage)}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
