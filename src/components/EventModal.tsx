import React, { useState } from 'react';
import {
  AlertTriangle,
  Baby,
  Briefcase,
  Coins,
  HeartHandshake,
  Landmark,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ActiveModalState, Player } from '../types/game';
import { calculatePlayerSummary, formatTenge } from '../utils/format';

interface EventModalProps {
  modal: ActiveModalState;
  player: Player;
  allPlayers: Player[];
  queueIndicator?: string | null;
  onChooseDealSize: (size: 'small' | 'big') => void;
  onBuyDeal: (quantity: number, useLoanIfNeeded: boolean) => void;
  onSkipDeal: () => void;
  onApplyMarketEvent: (sellAssetInstanceIds: string[]) => void;
  onPayDoodad: (useKaspiRed: boolean) => void;
  onCharityDecision: (accept: boolean) => void;
  onAcknowledgeChild: () => void;
  onAcknowledgeDownsized: () => void;
  onAcknowledgePayday: () => void;
  onAcknowledgePhaseTransition: () => void;
  onBuyFastTrackBusiness: () => void;
  onBuyDream: () => void;
  onAcknowledgeFastTrackRisk: () => void;
  onConfirmAutoLoan: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  modal,
  player,
  allPlayers,
  queueIndicator,
  onChooseDealSize,
  onBuyDeal,
  onSkipDeal,
  onApplyMarketEvent,
  onPayDoodad,
  onCharityDecision,
  onAcknowledgeChild,
  onAcknowledgeDownsized,
  onAcknowledgePayday,
  onAcknowledgePhaseTransition,
  onBuyFastTrackBusiness,
  onBuyDream,
  onAcknowledgeFastTrackRisk,
  onConfirmAutoLoan,
}) => {
  const [qty, setQty] = useState(1);
  const [selectedSellIds, setSelectedSellIds] = useState<string[]>([]);
  const summary = calculatePlayerSummary(player);

  React.useEffect(() => {
    setQty(1);
    setSelectedSellIds([]);
  }, [modal]);

  const renderTip = (tip?: string) => {
    if (!tip) return null;
    return (
      <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-left">
        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
          <span className="font-bold">Қаржылық кеңес: </span>
          {tip}
        </div>
      </div>
    );
  };

  // Helper for market event matching assets across Rat Race players
  const getMatchingAssetsForPlayer = (p: Player) => {
    const ev = modal.marketEvent;
    if (!ev) return [];
    return p.assets.filter((a) => ev.targetCategories.includes(a.category));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6">
        {queueIndicator && (
          <div className="flex justify-end mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono-num bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {queueIndicator}
            </span>
          </div>
        )}
        {/* 1. Opportunity Choice */}
        {modal.type === 'opportunity_choice' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Мүмкіндік ұяшығы · {player.name}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Қандай мәміле түрін таңдайсыз?
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Қолма-қол ақшаңыз: <strong className="font-mono-num">{formatTenge(player.cash)}</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChooseDealSize('small')}
                className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  Шағын мәміле
                </div>
                <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  10 000 ₸ – 1 500 000 ₸ аралығы. Депозит, акция, крипто, мал, шағын актив.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onChooseDealSize('big')}
                className="p-4 rounded-xl border border-teal-300 dark:border-teal-700/70 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-teal-900 dark:text-teal-200">
                  Ірі мәміле
                </div>
                <p className="mt-1 text-xs text-teal-800/80 dark:text-teal-300/80">
                  1 900 000 ₸ – 4 500 000 ₸ бастапқы жарна. Пәтер, ПВЗ, автожуу, бизнес.
                </p>
              </button>
            </div>
            {renderTip(modal.tip)}
          </div>
        )}

        {/* 2. Deal Card */}
        {modal.type === 'deal_card' && modal.deal && (() => {
          const deal = modal.deal;
          const totalCost = deal.isTradable ? deal.cost * qty : deal.cost;
          const shortBy = Math.max(0, totalCost - player.cash);
          const loanNeeded =
            shortBy > 0 ? Math.max(10_000, Math.ceil(shortBy / 10_000) * 10_000) : 0;
          const annualRoi =
            deal.monthlyCashFlow > 0
              ? Math.round(((deal.monthlyCashFlow * 12) / deal.cost) * 100)
              : 0;

          return (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {deal.size === 'small' ? 'Шағын мәміле' : 'Ірі мәміле'}
                    {deal.ticker ? ` · ${deal.ticker}` : ''}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {deal.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {deal.description}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {deal.isTradable ? '1 лот/дана бағасы:' : 'Бастапқы жарна / Құны:'}
                  </span>
                  <span className="font-bold font-mono-num">{formatTenge(deal.cost)}</span>
                </div>

                {deal.totalPrice && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Толық нарықтық құны:</span>
                    <span className="font-mono-num">{formatTenge(deal.totalPrice)}</span>
                  </div>
                )}

                {deal.mortgage && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ипотека / Несие:</span>
                    <span className="font-mono-num">{formatTenge(deal.mortgage)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Айлық ақша ағыны:</span>
                  <span className="font-bold font-mono-num text-emerald-700 dark:text-emerald-400">
                    {deal.monthlyCashFlow > 0
                      ? `+${formatTenge(deal.monthlyCashFlow)}/ай (${annualRoi}% жылдық)`
                      : 'Нарық өсімінен табыс'}
                  </span>
                </div>

                {deal.isTradable && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Саны:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold font-mono-num">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQty(Math.max(1, Math.floor(player.cash / deal.cost)))
                        }
                        className="px-2.5 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Макс
                      </button>
                    </div>
                  </div>
                )}

                {deal.isTradable && (
                  <div className="flex justify-between font-bold pt-1">
                    <span>Барлық сома:</span>
                    <span className="font-mono-num">{formatTenge(totalCost)}</span>
                  </div>
                )}
              </div>

              {shortBy > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Қолма-қол ақша {formatTenge(shortBy)} жетпейді. Банктен {formatTenge(loanNeeded)} несие алып сатып алуға болады (айлық пайызы: +{formatTenge(loanNeeded * 0.1)}/ай).
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                {shortBy === 0 ? (
                  <button
                    type="button"
                    onClick={() => onBuyDeal(qty, false)}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
                  >
                    Сатып алу ({formatTenge(totalCost)})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBuyDeal(qty, true)}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer"
                  >
                    Несиемен алу (+{formatTenge(loanNeeded)})
                  </button>
                )}

                <button
                  type="button"
                  onClick={onSkipDeal}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold cursor-pointer"
                >
                  Өткізіп жіберу
                </button>
              </div>

              {renderTip(deal.tip)}
            </div>
          );
        })()}

        {/* 3. Market Event */}
        {modal.type === 'market_event' && modal.marketEvent && (() => {
          const ev = modal.marketEvent;
          const matching = getMatchingAssetsForPlayer(player);

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <div>
                  <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                    Нарық оқиғасы
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {ev.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {ev.description}
              </p>

              {(ev.effectType === 'sell_offer' || ev.effectType === 'stock_price') && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Сатуға болатын сіздің активтеріңіз:
                  </div>
                  {matching.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      Сізде бұл санаттағы активтер жоқ. Боттар мен басқа ойыншыларда бар болса, олар нарық бағасымен әрекет етеді.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {matching.map((asset) => {
                        const checked = selectedSellIds.includes(asset.instanceId);
                        const sellGross =
                          ev.effectType === 'stock_price' && ev.newPrice
                            ? ev.newPrice * asset.quantity
                            : Math.round(
                                (asset.downPaymentPaid + asset.mortgage) *
                                  (ev.priceMultiplier || 1.25)
                              );
                        const netProceeds = Math.max(0, sellGross - asset.mortgage);
                        return (
                          <label
                            key={asset.instanceId}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40'
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedSellIds((prev) =>
                                    prev.includes(asset.instanceId)
                                      ? prev.filter((id) => id !== asset.instanceId)
                                      : [...prev, asset.instanceId]
                                  )
                                }
                                className="w-4 h-4 accent-teal-600"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{asset.title}</div>
                                <div className="text-xs text-slate-500 font-mono-num">
                                  Сату бағасы: {formatTenge(sellGross)}
                                  {asset.mortgage > 0 ? ` (несие шегеріледі)` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm font-bold font-mono-num text-emerald-700 dark:text-emerald-400 shrink-0">
                              +{formatTenge(netProceeds)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {ev.effectType === 'cashflow_change' && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
                  Барлық ойыншылардың сәйкес активтерінің айлық ақша ағыны{' '}
                  <strong>
                    {(ev.cashFlowDeltaPercent || 0) > 0
                      ? `+${ev.cashFlowDeltaPercent}%`
                      : `${ev.cashFlowDeltaPercent}%`}
                  </strong>{' '}
                  өзгереді. ({allPlayers.length} ойыншы тексеріледі)
                </div>
              )}

              <button
                type="button"
                onClick={() => onApplyMarketEvent(selectedSellIds)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
              >
                {selectedSellIds.length > 0
                  ? `Таңдалған (${selectedSellIds.length}) активті сату және жалғастыру`
                  : 'Қабылдау және жалғастыру'}
              </button>

              {renderTip(ev.tip)}
            </div>
          );
        })()}

        {/* 4. Doodad */}
        {modal.type === 'doodad' && modal.doodad && (() => {
          const dd = modal.doodad;
          const shortBy = Math.max(0, dd.cost - player.cash);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                <div>
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Күтпеген шығын
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {dd.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {dd.description}
              </p>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                <span className="text-sm font-medium text-rose-900 dark:text-rose-200">Шығын сомасы:</span>
                <span className="text-lg font-bold font-mono-num text-rose-700 dark:text-rose-300">
                  -{formatTenge(dd.cost)}
                </span>
              </div>

              {shortBy > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Қолма-қол ақша жетпеген жағдайда банктен автоматты түрде жеткіліксіз сомаға несие рәсімделеді.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => onPayDoodad(false)}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Қолма-қол төлеу ({formatTenge(dd.cost)})
                </button>
                {dd.canUseKaspiRed && (
                  <button
                    type="button"
                    onClick={() => onPayDoodad(true)}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-semibold cursor-pointer"
                  >
                    Kaspi Red (бөліп төлеу +{formatTenge(Math.round(dd.cost / 12))}/ай)
                  </button>
                )}
              </div>

              {renderTip(dd.tip)}
            </div>
          );
        })()}

        {/* 5. Charity */}
        {modal.type === 'charity' && (() => {
          const gift = Math.max(20_000, Math.round(summary.totalIncome * 0.1));
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                <div>
                  <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    Қайырымдылық / Садақа
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Жақсылық жасау мүмкіндігі
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Жалпы табысыңыздың 10%-ын (<strong>{formatTenge(gift)}</strong>) қайырымдылық қорына аударсаңыз, келесі{' '}
                <strong>3 жүрісте</strong> таңдауыңыз бойынша 1 немесе 2 сүйек лақтыра аласыз!
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={player.cash < gift}
                  onClick={() => onCharityDecision(true)}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-45 cursor-pointer"
                >
                  Садақа беру ({formatTenge(gift)})
                </button>
                <button
                  type="button"
                  onClick={() => onCharityDecision(false)}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold cursor-pointer"
                >
                  Бас тарту
                </button>
              </div>

              {renderTip(modal.tip)}
            </div>
          );
        })()}

        {/* 6. Child */}
        {modal.type === 'child' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Baby className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  Отбасы қуанышы
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Сіздің отбасыңызда бала дүниеге келді!
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Құттықтаймыз! Балабақша, киім және күтімге байланысты айлық шығындарыңыз{' '}
              <strong className="font-mono-num text-rose-700 dark:text-rose-400">
                +{formatTenge(player.profession.childExpensePerChild)}/ай
              </strong>{' '}
              артты. (Қазіргі бала саны: {player.childrenCount + 1})
            </p>

            <button
              type="button"
              onClick={onAcknowledgeChild}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
            >
              Қабылдау
            </button>

            {renderTip(modal.tip)}
          </div>
        )}

        {/* 7. Downsized */}
        {modal.type === 'downsized' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Жұмыстан қысқарту
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Уақытша жұмыссыз қалдыңыз
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Келесі <strong>2 жүрісті</strong> өткізіп аласыз және 1 айлық жалпы шығысыңызды (
              <strong className="font-mono-num">{formatTenge(summary.totalExpenses)}</strong>) төлеуге тура келеді.
            </p>

            <button
              type="button"
              onClick={onAcknowledgeDownsized}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer"
            >
              Шығынды төлеу ({formatTenge(summary.totalExpenses)})
            </button>

            {renderTip(modal.tip)}
          </div>
        )}

        {/* 8. Payday */}
        {modal.type === 'payday' && (() => {
          const amt = modal.paydayAmount || 0;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {player.phase === 'fast_track' ? 'Ақша ағыны күні' : 'Жалақы күні'}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Айлық түсті
                  </h2>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <span className="text-sm font-medium">Шотқа түсті:</span>
                <span
                  className={`text-xl font-bold font-mono-num ${
                    amt >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {amt >= 0 ? '+' : ''}
                  {formatTenge(amt)}
                </span>
              </div>

              <button
                type="button"
                onClick={onAcknowledgePayday}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
              >
                Керемет, жалғастыру
              </button>
            </div>
          );
        })()}

        {/* 9. Phase Transition (Rat Race -> Fast Track) */}
        {modal.type === 'phase_transition' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Қарбалас шеңберден шықтыңыз!
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Құттықтаймыз, {player.name}!
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Сіздің пассивті табысыңыз барлық айлық шығындарыңыздан асты! Енді сіз{' '}
              <strong>«Еркін жол» (2-кезең)</strong> тақтасына өтесіз. Бұл жерде ірі бизнестер алып, өз Арманыңызды (
              <strong>{player.dream.title}</strong>) жүзеге асырасыз!
            </p>

            <button
              type="button"
              onClick={onAcknowledgePhaseTransition}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer"
            >
              Еркін жолға өту
            </button>
          </div>
        )}

        {/* 10. Fast Track Business */}
        {modal.type === 'ft_business' && modal.ftDeal && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Еркін жол · Ірі бизнес
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modal.ftDeal.title}
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modal.ftDeal.description}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Инвестиция сомасы:</span>
                <span className="font-bold font-mono-num">{formatTenge(modal.ftDeal.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Айлық пассивті табыс:</span>
                <span className="font-bold font-mono-num text-emerald-700 dark:text-emerald-400">
                  +{formatTenge(modal.ftDeal.monthlyCashFlow)}/ай
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={player.cash < modal.ftDeal.cost}
                onClick={onBuyFastTrackBusiness}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-45 cursor-pointer"
              >
                Бизнесті сатып алу ({formatTenge(modal.ftDeal.cost)})
              </button>
              <button
                type="button"
                onClick={onSkipDeal}
                className="min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer"
              >
                Өткізу
              </button>
            </div>

            {renderTip(modal.ftDeal.tip)}
          </div>
        )}

        {/* 11. Fast Track Dream */}
        {modal.type === 'ft_dream' && modal.dream && (() => {
          const isMine = modal.dream.id === player.dream.id;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {isMine ? 'Сіздің Арманыңыз!' : 'Арман ұяшығы'}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {modal.dream.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {modal.dream.description}
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-sm">
                <span>Құны:</span>
                <span className="font-bold font-mono-num text-lg">{formatTenge(modal.dream.cost)}</span>
              </div>

              {isMine ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={player.cash < modal.dream.cost}
                    onClick={onBuyDream}
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold disabled:opacity-45 cursor-pointer"
                  >
                    Арманды сатып алып жеңу!
                  </button>
                  <button
                    type="button"
                    onClick={onSkipDeal}
                    className="min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Әзірше өткізу
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSkipDeal}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
                >
                  Жалғастыру (Сіздің арманыңыз: {player.dream.title})
                </button>
              )}
            </div>
          );
        })()}

        {/* 12. Fast Track Risk (Audit / Tax) */}
        {modal.type === 'ft_risk' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Еркін жол тәуекелі
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modal.riskTitle}
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modal.riskDescription}
            </p>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex justify-between items-center">
              <span className="text-sm">Шығын:</span>
              <span className="font-bold font-mono-num text-rose-700 dark:text-rose-300">
                -{formatTenge(modal.riskAmount || 0)}
              </span>
            </div>

            <button
              type="button"
              onClick={onAcknowledgeFastTrackRisk}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer"
            >
              Төлеу және жалғастыру
            </button>

            {renderTip(modal.tip)}
          </div>
        )}

        {/* 13. Automatic Bank Loan Warning */}
        {modal.type === 'auto_loan_warning' && modal.autoLoan && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {modal.autoLoan.reasonTitle}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Қаражат жетіспейді!
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Банк сізге автоматты түрде несие береді:{' '}
              <strong className="font-mono-num">{formatTenge(modal.autoLoan.loanAmount)}</strong>. Айына{' '}
              <strong className="font-mono-num">{formatTenge(modal.autoLoan.monthlyPayment)}</strong> төлейсіз.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Қазіргі ақша ағыны</span>
                <span
                  className={`font-bold font-mono-num ${
                    modal.autoLoan.currentCashFlow >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {modal.autoLoan.currentCashFlow >= 0 ? '+' : ''}
                  {formatTenge(modal.autoLoan.currentCashFlow)}/ай
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/70 dark:border-amber-800/70">
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  Несиеден кейінгі ақша ағыны
                </span>
                <span
                  className={`font-bold font-mono-num ${
                    modal.autoLoan.newCashFlow >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {modal.autoLoan.newCashFlow >= 0 ? '+' : ''}
                  {formatTenge(modal.autoLoan.newCashFlow)}/ай
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onConfirmAutoLoan}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer"
            >
              Түсінікті, несие алу
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
