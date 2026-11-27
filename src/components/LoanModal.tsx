import React, { useState } from 'react';
import { Landmark, X } from 'lucide-react';
import { Player } from '../types/game';
import { calculatePlayerSummary, formatTenge } from '../utils/format';

interface LoanModalProps {
  player: Player;
  readOnlyActions?: boolean;
  onClose: () => void;
  onTakeLoan: (amount: number) => void;
  onRepayBankLoan: (amount: number) => void;
  onPayLiability: (liabilityId: string) => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  player,
  readOnlyActions = false,
  onClose,
  onTakeLoan,
  onRepayBankLoan,
  onPayLiability,
}) => {
  const [loanStep, setLoanStep] = useState(200_000);
  const summary = calculatePlayerSummary(player);
  const maxSafeLoan = Math.max(0, Math.floor(summary.monthlyCashFlow / 0.1 / 100_000) * 100_000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Банк несиесі және қарыз өтеу"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Банк несиесі және өтеу
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Қолда бар қаражат:</span>
              <span className="font-bold font-mono-num">{formatTenge(player.cash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Айлық ақша ағыны:</span>
              <span className="font-bold font-mono-num">{formatTenge(summary.monthlyCashFlow)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Ағымдағы банк несиесі:</span>
              <span className="font-bold font-mono-num text-amber-700 dark:text-amber-400">
                {formatTenge(player.bankLoan)}
              </span>
            </div>
          </div>

          {/* Take a Loan */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Банктен несие алу (айлық пайызы — 10%)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Несие 100 000 ₸ еселігімен беріледі. Әр 100 000 ₸ үшін айлық шығыс 10 000 ₸-ге артады.
              Теріс ақша ағынына түспеу үшін ұсынылатын шек: <strong className="font-mono-num">{formatTenge(maxSafeLoan)}</strong>.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLoanStep((v) => Math.max(100_000, v - 100_000))}
                className="w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 text-center py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold font-mono-num text-base">
                {formatTenge(loanStep)}
              </div>
              <button
                type="button"
                onClick={() => setLoanStep((v) => v + 100_000)}
                className="w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Айлық қосымша төлем:</span>
              <span className="font-mono-num font-semibold text-rose-600 dark:text-rose-400">
                +{formatTenge(loanStep * 0.1)}/ай
              </span>
            </div>

            {readOnlyActions && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Несие алу немесе қарыз жабу тек өз жүрісіңізде қолжетімді.
              </p>
            )}

            <button
              type="button"
              disabled={readOnlyActions}
              onClick={() => {
                onTakeLoan(loanStep);
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold disabled:opacity-45 transition-colors cursor-pointer"
            >
              {formatTenge(loanStep)} несие алу
            </button>
          </div>

          {/* Repay existing loans */}
          {(player.bankLoan > 0 || player.liabilities.length > 0) && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Қарыздарды мерзімінен бұрын жабу
              </h3>

              {player.bankLoan > 0 && (
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <div>
                    <div className="text-sm font-semibold">Банк несиесі</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono-num">
                      {formatTenge(player.bankLoan)} ({formatTenge(player.bankLoan * 0.1)}/ай)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const stepAmt = Math.min(
                        player.bankLoan,
                        player.bankLoan >= 100_000 ? 100_000 : 10_000
                      );
                      return (
                        <button
                          type="button"
                          disabled={readOnlyActions || player.cash < stepAmt}
                          onClick={() => onRepayBankLoan(stepAmt)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                        >
                          -{formatTenge(stepAmt)}
                        </button>
                      );
                    })()}
                    <button
                      type="button"
                      disabled={readOnlyActions || player.cash < player.bankLoan}
                      onClick={() => onRepayBankLoan(player.bankLoan)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      Толық
                    </button>
                  </div>
                </div>
              )}

              {player.liabilities.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{l.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono-num">
                      {formatTenge(l.balance)} · босатылады: {formatTenge(l.monthlyPayment)}/ай
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={readOnlyActions || player.cash < l.balance}
                    onClick={() => onPayLiability(l.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Жабу
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
