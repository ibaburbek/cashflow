import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  History,
  Home,
  Moon,
  SkipForward,
  Sun,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { OFFLINE_TURN_WAIT_SECONDS } from './config/peerConfig';
import { BIG_DEALS, DREAMS, FAST_TRACK_DEALS, SMALL_DEALS } from './data/assets';
import { FAST_TRACK_BOARD, RAT_RACE_BOARD } from './data/board';
import { DOODADS, GENERAL_FINANCIAL_TIPS, MARKET_EVENTS } from './data/events';
import { buildInitialLiabilities, PROFESSIONS } from './data/professions';
import {
  ActiveModalState,
  DealCard,
  GuestAction,
  LobbyPlayer,
  OnlineGameSnapshot,
  OnlineRole,
  OwnedAsset,
  PendingAutoLoan,
  PeerMessage,
  Player,
  SavedGameState,
  ScreenMode,
  ThemeMode,
  ToastNotice,
  TurnLogEntry,
} from './types/game';
import { calculatePlayerSummary, formatTenge } from './utils/format';
import {
  normalizeRoomCode,
  OnlineGuestTransport,
  OnlineHostTransport,
} from './utils/peerManager';
import { sound } from './utils/sound';
import {
  clearGameState,
  getOrCreateSessionId,
  loadGameState,
  loadOnlineProfile,
  loadSoundSetting,
  loadThemeMode,
  saveGameState,
  saveOnlineProfile,
  saveSoundSetting,
  saveThemeMode,
} from './utils/storage';
import { EventModal } from './components/EventModal';
import { FinancialStatementModal } from './components/FinancialStatementModal';
import { GameBoard } from './components/GameBoard';
import { QoshqarMuiizEmblem } from './components/KazakhOrnament';
import { LoanModal } from './components/LoanModal';
import { MiniStatement } from './components/MiniStatement';
import { LOBBY_COLORS, OnlineLobby } from './components/OnlineLobby';
import { RulesModal } from './components/RulesModal';
import { PlayerDraft, SetupScreen } from './components/SetupScreen';
import { VictoryScreen } from './components/VictoryScreen';

const PLAYER_COLORS = [
  '#0D7A6F',
  '#D97706',
  '#2563EB',
  '#BE185D',
  '#7C3AED',
  '#047857',
];
const PLAYER_SYMBOLS = ['◆', '●', '▲', '★', '■', '✦'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function buildPendingAutoLoan(
  p: Player,
  shortfall: number,
  reasonTitle: string,
  kind: PendingAutoLoan['kind']
): PendingAutoLoan {
  const loanAmount = Math.max(10_000, Math.ceil(shortfall / 10_000) * 10_000);
  const monthlyPayment = Math.round(loanAmount * 0.1);
  const summary = calculatePlayerSummary(p);
  return {
    loanAmount,
    monthlyPayment,
    reasonTitle,
    currentCashFlow: summary.monthlyCashFlow,
    newCashFlow: summary.monthlyCashFlow - monthlyPayment,
    kind,
  };
}

function buildModalToast(player: Player, queued: ActiveModalState[]): ToastNotice | null {
  const first = queued[0];
  if (!first) return null;
  switch (first.type) {
    case 'payday':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} жалақы күнін алуда (${(first.paydayAmount || 0) >= 0 ? '+' : ''}${formatTenge(first.paydayAmount || 0)})`,
      };
    case 'opportunity_choice':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} «Мүмкіндік» картасын таңдауда...`,
      };
    case 'doodad':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} күтпеген шығынға тап болды`,
      };
    case 'market_event':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `Нарық оқиғасы: ${first.marketEvent?.title || ''}`,
      };
    case 'charity':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} қайырымдылық шешімін қабылдауда`,
      };
    case 'child':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} отбасында бала дүниеге келді!`,
      };
    case 'downsized':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} жұмыстан қысқартуға түсті`,
      };
    case 'ft_business':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} Еркін жол бизнесін қарауда`,
      };
    case 'ft_dream':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name} Арман ұяшығына түсті`,
      };
    case 'ft_risk':
      return {
        id: makeId('toast'),
        playerColor: player.color,
        message: `${player.name}: ${first.riskTitle || 'Тәуекел'}`,
      };
    default:
      return null;
  }
}

export default function App() {
  const mySessionId = useMemo(() => getOrCreateSessionId(), []);
  const initialRoomCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return normalizeRoomCode(
      new URLSearchParams(window.location.search).get('room') || ''
    );
  }, []);

  const [theme, setTheme] = useState<ThemeMode>(() => loadThemeMode());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const s = loadSoundSetting();
    sound.enabled = s;
    return s;
  });

  const [savedExists, setSavedExists] = useState<boolean>(() => !!loadGameState());
  const [screen, setScreen] = useState<ScreenMode>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [logs, setLogs] = useState<TurnLogEntry[]>([]);
  const [lastDice, setLastDice] = useState<number[]>([1]);
  const [rolling, setRolling] = useState<boolean>(false);
  const [isStepping, setIsStepping] = useState<boolean>(false);
  const [modalQueue, setModalQueue] = useState<ActiveModalState[]>([]);
  const [queueTotalCount, setQueueTotalCount] = useState<number>(0);
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winReason, setWinReason] = useState<string | null>(null);

  // Online multiplayer state
  const [onlineRole, setOnlineRole] = useState<OnlineRole>('local');
  const [roomCode, setRoomCode] = useState<string>('');
  const [hostSessionId, setHostSessionId] = useState<string>('');
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [onlineBusy, setOnlineBusy] = useState<boolean>(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [hostDisconnected, setHostDisconnected] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<ToastNotice | null>(null);
  const [offlineCountdown, setOfflineCountdown] = useState<number | null>(null);

  const hostTransportRef = useRef<OnlineHostTransport | null>(null);
  const guestTransportRef = useRef<OnlineGuestTransport | null>(null);
  const prevGuestSnapRef = useRef<{ rolling: boolean; pos: number; screen: string } | null>(
    null
  );

  const activeModal = modalQueue[0] || null;
  const queueIndicator =
    modalQueue.length > 0 && queueTotalCount > 1
      ? `${queueTotalCount - modalQueue.length + 1} / ${queueTotalCount}`
      : null;

  const timersRef = useRef<number[]>([]);
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const cleanupOnlineTransports = useCallback(() => {
    if (hostTransportRef.current) {
      hostTransportRef.current.destroy();
      hostTransportRef.current = null;
    }
    if (guestTransportRef.current) {
      guestTransportRef.current.destroy();
      guestTransportRef.current = null;
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemeMode(theme);
  }, [theme]);

  useEffect(() => {
    if (onlineRole === 'local' && (screen === 'playing' || screen === 'victory')) {
      const state: SavedGameState = {
        screen,
        players,
        currentPlayerIndex,
        turnCount,
        logs: logs.slice(0, 40),
        winnerId,
        winReason,
        lastDice,
      };
      saveGameState(state);
      setSavedExists(true);
    }
  }, [onlineRole, screen, players, currentPlayerIndex, turnCount, logs, winnerId, winReason, lastDice]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      cleanupOnlineTransports();
    };
  }, [clearAllTimers, cleanupOnlineTransports]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sound.enabled = next;
      saveSoundSetting(next);
      return next;
    });
  };

  const addLog = useCallback((player: Player, message: string) => {
    setLogs((prev) => [
      {
        id: makeId('log'),
        playerName: player.name,
        playerColor: player.color,
        message,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 39),
    ]);
  }, []);

  const handleStartNewGame = (drafts: PlayerDraft[]) => {
    clearAllTimers();
    cleanupOnlineTransports();
    setOnlineRole('local');
    setRoomCode('');
    setLobbyPlayers([]);
    setHostDisconnected(false);
    setToastNotice(null);
    setOfflineCountdown(null);

    const initialPlayers: Player[] = drafts.map((d, idx) => {
      const prof = PROFESSIONS.find((p) => p.id === d.professionId) || PROFESSIONS[0];
      const dream = DREAMS.find((dr) => dr.id === d.dreamId) || DREAMS[0];
      return {
        id: makeId(`p${idx}`),
        name: d.name.trim() || `Ойыншы ${idx + 1}`,
        isBot: d.isBot,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        tokenSymbol: PLAYER_SYMBOLS[idx % PLAYER_SYMBOLS.length],
        profession: prof,
        dream,
        phase: 'rat_race',
        position: 0,
        cash: prof.startingSavings,
        childrenCount: 0,
        bankLoan: 0,
        liabilities: buildInitialLiabilities(prof),
        assets: [],
        charityTurnsLeft: 0,
        missedTurns: 0,
        fastTrackBasePassive: 0,
        fastTrackAddedPassive: 0,
        fastTrackTargetPassive: 5_000_000,
        boughtDream: false,
        stats: {
          turnsPlayed: 0,
          dealsBought: 0,
          doodadsPaid: 0,
          loansTaken: 0,
          charityGiven: 0,
        },
      };
    });

    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setTurnCount(1);
    setLogs([
      {
        id: makeId('log'),
        playerName: initialPlayers[0].name,
        playerColor: initialPlayers[0].color,
        message: 'Ойын басталды! Сәттілік тілейміз!',
        timestamp: Date.now(),
      },
    ]);
    setLastDice([1]);
    setModalQueue([]);
    setQueueTotalCount(0);
    setWinnerId(null);
    setWinReason(null);
    setRolling(false);
    setIsStepping(false);
    setScreen('playing');
  };

  const handleResumeSavedGame = () => {
    const saved = loadGameState();
    if (!saved) return;
    clearAllTimers();
    cleanupOnlineTransports();
    setOnlineRole('local');
    setRoomCode('');
    setLobbyPlayers([]);
    setHostDisconnected(false);
    setToastNotice(null);
    setOfflineCountdown(null);
    setPlayers(saved.players);
    setCurrentPlayerIndex(saved.currentPlayerIndex);
    setTurnCount(saved.turnCount);
    setLogs(saved.logs);
    setWinnerId(saved.winnerId);
    setWinReason(saved.winReason);
    setLastDice(saved.lastDice || [1]);
    setModalQueue([]);
    setQueueTotalCount(0);
    setRolling(false);
    setIsStepping(false);
    setScreen(saved.screen);
  };

  const applyCashChangeWithAutoLoan = (
    p: Player,
    delta: number
  ): { updated: Player; loanAdded: number } => {
    let nextCash = p.cash + delta;
    let loanAdded = 0;
    let nextBankLoan = p.bankLoan;
    let loansTaken = p.stats.loansTaken;

    if (nextCash < 0) {
      const deficit = Math.abs(nextCash);
      loanAdded = Math.max(10_000, Math.ceil(deficit / 10_000) * 10_000);
      nextCash += loanAdded;
      nextBankLoan += loanAdded;
      loansTaken += 1;
    }

    return {
      updated: {
        ...p,
        cash: nextCash,
        bankLoan: nextBankLoan,
        stats: {
          ...p.stats,
          loansTaken,
        },
      },
      loanAdded,
    };
  };

  const checkGraduationToFastTrack = useCallback(
    (p: Player): { graduated: boolean; nextPlayer: Player } => {
      if (p.phase !== 'rat_race') return { graduated: false, nextPlayer: p };
      const summary = calculatePlayerSummary(p);
      if (summary.passiveIncome > summary.totalExpenses) {
        const baseFt = Math.max(
          1_000_000,
          Math.round((summary.passiveIncome * 10) / 100_000) * 100_000
        );
        const nextPlayer: Player = {
          ...p,
          phase: 'fast_track',
          position: 0,
          cash: p.cash + 15_000_000,
          fastTrackBasePassive: baseFt,
          fastTrackAddedPassive: 0,
          fastTrackTargetPassive: 5_000_000,
          charityTurnsLeft: 0,
          missedTurns: 0,
        };
        return { graduated: true, nextPlayer };
      }
      return { graduated: false, nextPlayer: p };
    },
    []
  );

  const checkVictory = useCallback((p: Player): string | null => {
    if (p.phase !== 'fast_track') return null;
    if (p.boughtDream) {
      return `${p.name} өз Арманын («${p.dream.title}») сатып алып, толық қаржылық еркіндікке жетті!`;
    }
    if (p.fastTrackAddedPassive >= p.fastTrackTargetPassive) {
      return `${p.name} Еркін жолда пассивті табысын +${formatTenge(p.fastTrackTargetPassive)} арттырып, жеңіске жетті!`;
    }
    return null;
  }, []);

  const advanceTurn = useCallback(
    (latestPlayers: Player[], fromIndex: number) => {
      let nextIdx = (fromIndex + 1) % latestPlayers.length;
      let loops = 0;
      const working = [...latestPlayers];

      while (loops < working.length) {
        const candidate = working[nextIdx];
        if (candidate.missedTurns > 0) {
          working[nextIdx] = {
            ...candidate,
            missedTurns: candidate.missedTurns - 1,
          };
          addLog(
            candidate,
            `Жұмыстан қысқартуға байланысты жүрісті өткізді (қалды: ${
              candidate.missedTurns - 1
            }).`
          );
          nextIdx = (nextIdx + 1) % working.length;
          loops += 1;
        } else {
          break;
        }
      }

      setPlayers(working);
      setCurrentPlayerIndex(nextIdx);
      setTurnCount((t) => t + 1);
      setToastNotice(null);
    },
    [addLog]
  );

  const commitPlayerUpdate = useCallback(
    (
      updater: (p: Player) => Player,
      options?: {
        advanceAfter?: boolean;
        checkGrad?: boolean;
        remainingQueue?: ActiveModalState[];
      }
    ) => {
      const idx = currentPlayerIndex;
      const target = players[idx];
      if (!target) return;

      let finalTarget = updater(target);

      const winText = checkVictory(finalTarget);
      if (winText) {
        const nextArr = players.map((pl, i) => (i === idx ? finalTarget : pl));
        setPlayers(nextArr);
        sound.playVictory();
        setWinnerId(finalTarget.id);
        setWinReason(winText);
        setModalQueue([]);
        setQueueTotalCount(0);
        setScreen('victory');
        return;
      }

      let graduatedNow = false;
      if (options?.checkGrad) {
        const grad = checkGraduationToFastTrack(finalTarget);
        if (grad.graduated) {
          finalTarget = grad.nextPlayer;
          graduatedNow = true;
          sound.playVictory();
          addLog(
            finalTarget,
            'Құттықтаймыз! Пассивті табыс шығыстардан асып, Еркін жолға өтті!'
          );
        }
      }

      const nextArr = players.map((pl, i) => (i === idx ? finalTarget : pl));
      setPlayers(nextArr);

      if (graduatedNow && !finalTarget.isBot) {
        setShowStatementModal(false);
        setShowLoanModal(false);
        const rest = options?.remainingQueue ?? modalQueue;
        setModalQueue([{ type: 'phase_transition' }, ...rest]);
        setQueueTotalCount((c) => Math.max(1, c) + (rest.length === 0 && modalQueue.length === 0 ? 0 : 1));
        return;
      }

      const pendingCount = options?.remainingQueue
        ? options.remainingQueue.length
        : modalQueue.length;

      if (options?.advanceAfter && pendingCount === 0) {
        const tId = window.setTimeout(() => {
          advanceTurn(nextArr, idx);
        }, 80);
        timersRef.current.push(tId);
      }
    },
    [
      players,
      currentPlayerIndex,
      modalQueue,
      checkVictory,
      checkGraduationToFastTrack,
      addLog,
      advanceTurn,
    ]
  );

  const handleSquareLanding = useCallback(
    (
      landedPlayer: Player,
      landedOnIndex: number,
      paydaysCrossed: number,
      totalPaydayAmount: number,
      paydayDeficit: number,
      landedOnPaydaySquare: boolean
    ) => {
      const idx = currentPlayerIndex;

      if (landedPlayer.phase === 'rat_race') {
        const sq = RAT_RACE_BOARD[landedOnIndex];

        if (landedPlayer.isBot) {
          const botResolve = () => {
            let working = { ...landedPlayer };
            if (sq.type === 'payday') {
              const s = calculatePlayerSummary(working);
              addLog(working, `Жалақы күні: ${formatTenge(s.monthlyCashFlow)} алды.`);
            } else if (sq.type === 'opportunity') {
              const pool = working.cash >= 2_400_000 ? BIG_DEALS : SMALL_DEALS;
              const deal = randomItem(pool);
              if (deal.isTradable) {
                const qty = Math.min(5, Math.floor(working.cash / deal.cost));
                if (qty >= 1 && deal.cost <= 35_000) {
                  const spent = qty * deal.cost;
                  working = {
                    ...working,
                    cash: working.cash - spent,
                    assets: [
                      ...working.assets,
                      {
                        instanceId: makeId('asset'),
                        dealId: deal.id,
                        title: deal.title,
                        category: deal.category,
                        quantity: qty,
                        unitCost: deal.cost,
                        downPaymentPaid: spent,
                        mortgage: 0,
                        monthlyCashFlow: 0,
                        ticker: deal.ticker,
                      },
                    ],
                    stats: { ...working.stats, dealsBought: working.stats.dealsBought + 1 },
                  };
                  addLog(working, `${deal.title} (${qty} дана) сатып алды.`);
                } else {
                  addLog(working, `${deal.title} мәмілесін өткізіп жіберді.`);
                }
              } else if (working.cash >= deal.cost && deal.monthlyCashFlow > 0) {
                working = {
                  ...working,
                  cash: working.cash - deal.cost,
                  assets: [
                    ...working.assets,
                    {
                      instanceId: makeId('asset'),
                      dealId: deal.id,
                      title: deal.title,
                      category: deal.category,
                      quantity: 1,
                      unitCost: deal.cost,
                      downPaymentPaid: deal.cost,
                      mortgage: deal.mortgage || 0,
                      monthlyCashFlow: deal.monthlyCashFlow,
                    },
                  ],
                  stats: { ...working.stats, dealsBought: working.stats.dealsBought + 1 },
                };
                sound.playDeal();
                addLog(
                  working,
                  `«${deal.title}» сатып алды (+${formatTenge(deal.monthlyCashFlow)}/ай).`
                );
              } else {
                addLog(working, `«${deal.title}» мәмілесіне қаржы жетпей, өткізді.`);
              }
            } else if (sq.type === 'doodad') {
              const dd = randomItem(DOODADS);
              const res = applyCashChangeWithAutoLoan(working, -dd.cost);
              working = {
                ...res.updated,
                stats: { ...res.updated.stats, doodadsPaid: res.updated.stats.doodadsPaid + 1 },
              };
              addLog(working, `Күтпеген шығын (${dd.title}): -${formatTenge(dd.cost)}.`);
            } else if (sq.type === 'charity') {
              const s = calculatePlayerSummary(working);
              const gift = Math.max(20_000, Math.round(s.totalIncome * 0.1));
              if (working.cash > gift * 2.5) {
                working = {
                  ...working,
                  cash: working.cash - gift,
                  charityTurnsLeft: 3,
                  stats: { ...working.stats, charityGiven: working.stats.charityGiven + 1 },
                };
                addLog(working, `Қайырымдылық жасады (${formatTenge(gift)}).`);
              } else {
                addLog(working, 'Қайырымдылықты өткізіп жіберді.');
              }
            } else if (sq.type === 'child') {
              if (working.childrenCount < 3) {
                working = { ...working, childrenCount: working.childrenCount + 1 };
                addLog(working, 'Отбасында бала дүниеге келді (+айлық шығын).');
              } else {
                addLog(working, 'Отбасылық демалыс.');
              }
            } else if (sq.type === 'downsized') {
              const s = calculatePlayerSummary(working);
              const res = applyCashChangeWithAutoLoan(working, -s.totalExpenses);
              working = { ...res.updated, missedTurns: 2 };
              addLog(
                working,
                `Жұмыстан қысқарту: -${formatTenge(s.totalExpenses)} және 2 жүріс өткізу.`
              );
            } else if (sq.type === 'market') {
              const ev = randomItem(MARKET_EVENTS);
              if (ev.effectType === 'cashflow_change' && ev.cashFlowDeltaPercent) {
                working = {
                  ...working,
                  assets: working.assets.map((a) =>
                    ev.targetCategories.includes(a.category) && a.monthlyCashFlow > 0
                      ? {
                          ...a,
                          monthlyCashFlow: Math.max(
                            5_000,
                            Math.round(a.monthlyCashFlow * (1 + ev.cashFlowDeltaPercent! / 100))
                          ),
                        }
                      : a
                  ),
                };
              } else if (
                (ev.effectType === 'sell_offer' && (ev.priceMultiplier || 1) >= 1.3) ||
                (ev.effectType === 'stock_price' && (ev.newPrice || 0) >= 50_000)
              ) {
                let cashGain = 0;
                working = {
                  ...working,
                  assets: working.assets.filter((a) => {
                    if (!ev.targetCategories.includes(a.category)) return true;
                    const gross =
                      ev.effectType === 'stock_price' && ev.newPrice
                        ? ev.newPrice * a.quantity
                        : Math.round(
                            (a.downPaymentPaid + a.mortgage) * (ev.priceMultiplier || 1.3)
                          );
                    cashGain += Math.max(0, gross - a.mortgage);
                    return false;
                  }),
                  cash: working.cash + cashGain,
                };
                if (cashGain > 0) {
                  addLog(
                    working,
                    `Нарықта («${ev.title}») активтерін сатып +${formatTenge(cashGain)} алды.`
                  );
                }
              }
              addLog(working, `Нарық: ${ev.title}`);
            }

            const grad = checkGraduationToFastTrack(working);
            if (grad.graduated) {
              working = grad.nextPlayer;
              sound.playVictory();
              addLog(working, 'Еркін жол (2-кезең) тақтасына өтті!');
            }

            setPlayers((prev) => {
              const nextArr = prev.map((pl, i) => (i === idx ? working : pl));
              const tId = window.setTimeout(() => advanceTurn(nextArr, idx), 650);
              timersRef.current.push(tId);
              return nextArr;
            });
          };

          const tId = window.setTimeout(botResolve, 500);
          timersRef.current.push(tId);
          return;
        }

        const queued: ActiveModalState[] = [];
        if (paydaysCrossed > 0) {
          queued.push({
            type: 'payday',
            paydayAmount: totalPaydayAmount,
          });
          if (paydayDeficit > 0) {
            sound.playWarning();
            queued.push({
              type: 'auto_loan_warning',
              autoLoan: buildPendingAutoLoan(
                landedPlayer,
                paydayDeficit,
                'Айлық шығыстарды жабу',
                { type: 'payday_deficit', deficit: paydayDeficit }
              ),
            });
          }
        }

        if (sq.type === 'opportunity') {
          queued.push({
            type: 'opportunity_choice',
            tip: randomItem(GENERAL_FINANCIAL_TIPS),
          });
        } else if (sq.type === 'market') {
          const ev = randomItem(MARKET_EVENTS);
          queued.push({ type: 'market_event', marketEvent: ev });
        } else if (sq.type === 'doodad') {
          sound.playWarning();
          queued.push({ type: 'doodad', doodad: randomItem(DOODADS) });
        } else if (sq.type === 'charity') {
          queued.push({
            type: 'charity',
            tip: 'Қайырымдылық пен жомарттық қаржылық ой-өрісті кеңейтіп, 2 сүйекпен жылдам жүруге мүмкік береді.',
          });
        } else if (sq.type === 'child') {
          if (landedPlayer.childrenCount >= 3) {
            addLog(landedPlayer, 'Балалар саны шегіне жеткендіктен шығын өзгермеді.');
          } else {
            queued.push({
              type: 'child',
              tip: 'Балалы болу — үлкен бақыт. Алдын ала жинақ пен пассивті табыс отбасылық шығындарды жеңіл көтеруге көмектеседі.',
            });
          }
        } else if (sq.type === 'downsized') {
          sound.playWarning();
          queued.push({
            type: 'downsized',
            tip: 'Жалғыз жалақыға тәуелді болу — үлкен тәуекел. Пассивті табыс пен 6 айлық қор қысқарту кезінде қорғайды.',
          });
        }

        if (queued.length > 0) {
          setModalQueue(queued);
          setQueueTotalCount(queued.length);
          if (onlineRole === 'online_host') {
            setToastNotice(buildModalToast(landedPlayer, queued));
          }
        } else if (landedOnPaydaySquare || sq.type === 'child') {
          setPlayers((prev) => {
            const tId = window.setTimeout(() => advanceTurn(prev, idx), 350);
            timersRef.current.push(tId);
            return prev;
          });
        }
      } else {
        const sq = FAST_TRACK_BOARD[landedOnIndex];
        if (landedPlayer.isBot) {
          const botFtResolve = () => {
            let working = { ...landedPlayer };
            if (sq.type === 'ft_business') {
              const deal =
                FAST_TRACK_DEALS.find((d) => d.id === sq.ftDealId) ||
                randomItem(FAST_TRACK_DEALS);
              if (working.cash >= deal.cost) {
                working = {
                  ...working,
                  cash: working.cash - deal.cost,
                  fastTrackAddedPassive: working.fastTrackAddedPassive + deal.monthlyCashFlow,
                  stats: { ...working.stats, dealsBought: working.stats.dealsBought + 1 },
                };
                sound.playDeal();
                addLog(working, `Еркін жолда «${deal.title}» сатып алды!`);
              } else {
                addLog(working, `«${deal.title}» бизнесін өткізіп жіберді.`);
              }
            } else if (sq.type === 'dream') {
              if (sq.dreamId === working.dream.id && working.cash >= working.dream.cost) {
                working = {
                  ...working,
                  cash: working.cash - working.dream.cost,
                  boughtDream: true,
                };
                addLog(working, `Өз Арманын («${working.dream.title}») сатып алды!`);
              } else {
                addLog(working, `«${sq.label}» ұяшығына түсті.`);
              }
            } else if (sq.type === 'audit' || sq.type === 'tax_check') {
              const penalty = Math.min(working.cash, 2_500_000);
              working = { ...working, cash: working.cash - penalty };
              addLog(working, `${sq.label}: -${formatTenge(penalty)}.`);
            } else if (sq.type === 'cashflow_day') {
              const s = calculatePlayerSummary(working);
              addLog(working, `Ақша ағыны күні: +${formatTenge(s.passiveIncome)}.`);
            } else {
              addLog(working, `${sq.label} ұяшығына түсті.`);
            }

            const winText = checkVictory(working);
            if (winText) {
              setPlayers((prev) => prev.map((pl, i) => (i === idx ? working : pl)));
              sound.playVictory();
              setWinnerId(working.id);
              setWinReason(winText);
              setScreen('victory');
              return;
            }

            setPlayers((prev) => {
              const nextArr = prev.map((pl, i) => (i === idx ? working : pl));
              const tId = window.setTimeout(() => advanceTurn(nextArr, idx), 650);
              timersRef.current.push(tId);
              return nextArr;
            });
          };

          const tId = window.setTimeout(botFtResolve, 500);
          timersRef.current.push(tId);
          return;
        }

        const queued: ActiveModalState[] = [];
        if (paydaysCrossed > 0) {
          queued.push({
            type: 'payday',
            paydayAmount: totalPaydayAmount,
          });
        }

        if (sq.type === 'ft_business') {
          const deal =
            FAST_TRACK_DEALS.find((d) => d.id === sq.ftDealId) ||
            randomItem(FAST_TRACK_DEALS);
          queued.push({ type: 'ft_business', ftDeal: deal });
        } else if (sq.type === 'dream') {
          const dream = DREAMS.find((d) => d.id === sq.dreamId) || landedPlayer.dream;
          queued.push({ type: 'ft_dream', dream });
        } else if (sq.type === 'ft_charity') {
          queued.push({
            type: 'ft_risk',
            riskTitle: 'Меценаттық қорға қолдау',
            riskDescription: 'Қоғамдық қайырымдылық жобасына 1 000 000 ₸ үлес қосылды.',
            riskAmount: Math.min(landedPlayer.cash, 1_000_000),
            tip: 'Үлкен капитал иелері қоғамға пайдалы жобаларды қолдау арқылы тұрақты экожүйе қалыптастырады.',
          });
        } else if (sq.type !== 'cashflow_day') {
          sound.playWarning();
          queued.push({
            type: 'ft_risk',
            riskTitle: sq.label,
            riskDescription:
              sq.type === 'tax_check'
                ? 'Ірі активтер бойынша жылдық салық аудиті жүргізіліп, қосымша салық есептелді.'
                : 'Нарықтағы уақытша дағдарысқа байланысты бизнес резервтен шығын шекті.',
            riskAmount: Math.min(landedPlayer.cash, 2_500_000),
            tip: 'Ірі бизнесте де форс-мажорлар болады — әрдайым қолма-қол өтімді қор ұстаңыз.',
          });
        }

        if (queued.length > 0) {
          setModalQueue(queued);
          setQueueTotalCount(queued.length);
          if (onlineRole === 'online_host') {
            setToastNotice(buildModalToast(landedPlayer, queued));
          }
        }
      }
    },
    [currentPlayerIndex, addLog, checkGraduationToFastTrack, advanceTurn, checkVictory, onlineRole]
  );

  const executeRollDice = useCallback(
    (useTwoDice?: boolean) => {
      const current = players[currentPlayerIndex];
      if (!current || rolling || isStepping || modalQueue.length > 0 || screen !== 'playing') return;

      const count =
        current.phase === 'fast_track'
          ? 2
          : useTwoDice && current.charityTurnsLeft > 0
          ? 2
          : 1;

      setRolling(true);
      sound.playDice();

      const rollTimer = window.setTimeout(() => {
        const rolls = Array.from({ length: count }).map(
          () => Math.floor(Math.random() * 6) + 1
        );
        const totalSteps = rolls.reduce((a, b) => a + b, 0);
        setLastDice(rolls);
        setRolling(false);
        setIsStepping(true);

        const boardLen =
          current.phase === 'fast_track'
            ? FAST_TRACK_BOARD.length
            : RAT_RACE_BOARD.length;
        const paydayIndices =
          current.phase === 'fast_track' ? [0, 5, 10] : [0, 6, 12, 18];

        let step = 0;
        let pos = current.position;
        let paydaysCrossed = 0;
        let totalPaydayAmount = 0;
        let paydayDeficit = 0;
        let workingPlayer: Player = {
          ...current,
          charityTurnsLeft:
            current.phase === 'rat_race' && current.charityTurnsLeft > 0
              ? current.charityTurnsLeft - 1
              : 0,
          stats: {
            ...current.stats,
            turnsPlayed: current.stats.turnsPlayed + 1,
          },
        };

        const stepOnce = () => {
          step += 1;
          pos = (pos + 1) % boardLen;
          sound.playStep();

          if (paydayIndices.includes(pos)) {
            paydaysCrossed += 1;
            const summary = calculatePlayerSummary(workingPlayer);
            const payAmount =
              workingPlayer.phase === 'fast_track'
                ? summary.passiveIncome
                : summary.monthlyCashFlow;
            totalPaydayAmount += payAmount;

            if (workingPlayer.isBot) {
              const cashRes = applyCashChangeWithAutoLoan(workingPlayer, payAmount);
              workingPlayer = cashRes.updated;
            } else {
              const nextCash = workingPlayer.cash + payAmount;
              if (nextCash < 0) {
                paydayDeficit += Math.abs(nextCash);
                workingPlayer = { ...workingPlayer, cash: 0 };
              } else {
                workingPlayer = { ...workingPlayer, cash: nextCash };
              }
            }
            sound.playPayday();
          }

          workingPlayer = { ...workingPlayer, position: pos };

          setPlayers((prev) =>
            prev.map((pl, i) => (i === currentPlayerIndex ? workingPlayer : pl))
          );

          if (step < totalSteps) {
            const nextStepTimer = window.setTimeout(stepOnce, 130);
            timersRef.current.push(nextStepTimer);
          } else {
            setIsStepping(false);
            if (paydaysCrossed > 0 && !paydayIndices.includes(pos)) {
              addLog(
                workingPlayer,
                `Жалақы/табыс күнінен өтіп, ${formatTenge(totalPaydayAmount)} алды.`
              );
            }
            handleSquareLanding(
              workingPlayer,
              pos,
              paydaysCrossed,
              totalPaydayAmount,
              paydayDeficit,
              paydayIndices.includes(pos)
            );
          }
        };

        const firstStepTimer = window.setTimeout(stepOnce, 130);
        timersRef.current.push(firstStepTimer);
      }, 460);

      timersRef.current.push(rollTimer);
    },
    [
      players,
      currentPlayerIndex,
      rolling,
      isStepping,
      modalQueue.length,
      screen,
      addLog,
      handleSquareLanding,
    ]
  );

  useEffect(() => {
    if (onlineRole === 'online_guest') return;
    if (screen !== 'playing' || rolling || isStepping || modalQueue.length > 0) return;
    const current = players[currentPlayerIndex];
    if (!current || !current.isBot) return;

    const botTimer = window.setTimeout(() => {
      executeRollDice(current.charityTurnsLeft > 0 || current.phase === 'fast_track');
    }, 650);
    timersRef.current.push(botTimer);

    return () => window.clearTimeout(botTimer);
  }, [onlineRole, screen, rolling, isStepping, modalQueue.length, players, currentPlayerIndex, executeRollDice]);

  const popCurrentModal = useCallback(() => {
    const remaining = modalQueue.slice(1);
    setModalQueue(remaining);
    if (remaining.length === 0) {
      setQueueTotalCount(0);
    }
    return remaining;
  }, [modalQueue]);

  const pushAutoLoanModal = useCallback(
    (autoLoan: PendingAutoLoan) => {
      sound.playWarning();
      setModalQueue((prev) => [{ type: 'auto_loan_warning', autoLoan }, ...prev.slice(1)]);
      setQueueTotalCount((c) => Math.max(1, c) + 1);
      if (onlineRole === 'online_host') {
        const cur = players[currentPlayerIndex];
        if (cur) {
          setToastNotice({
            id: makeId('toast'),
            playerColor: cur.color,
            message: `${cur.name} банк несиесін растауда...`,
          });
        }
      }
    },
    [onlineRole, players, currentPlayerIndex]
  );

  const executeChooseDealSize = (size: 'small' | 'big') => {
    if (activeModal?.type !== 'opportunity_choice') return;
    const deal: DealCard =
      size === 'small' ? randomItem(SMALL_DEALS) : randomItem(BIG_DEALS);
    setModalQueue((prev) => [{ type: 'deal_card', deal }, ...prev.slice(1)]);
  };

  const executeBuyDeal = (quantity: number, useLoanIfNeeded: boolean) => {
    const current = players[currentPlayerIndex];
    if (activeModal?.type !== 'deal_card' || !activeModal.deal || !current) return;
    const deal = activeModal.deal;
    const safeQty = Math.max(1, Math.floor(quantity) || 1);
    const totalCost = deal.isTradable ? deal.cost * safeQty : deal.cost;

    if (current.cash < totalCost) {
      if (!useLoanIfNeeded) return;
      const shortfall = totalCost - current.cash;
      const autoLoan = buildPendingAutoLoan(
        current,
        shortfall,
        `Мәміле: ${deal.title}`,
        { type: 'deal', dealId: deal.id, quantity: safeQty, totalCost }
      );
      pushAutoLoanModal(autoLoan);
      return;
    }

    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        const newAsset: OwnedAsset = {
          instanceId: makeId('asset'),
          dealId: deal.id,
          title: deal.title,
          category: deal.category,
          quantity: deal.isTradable ? safeQty : 1,
          unitCost: deal.cost,
          downPaymentPaid: totalCost,
          mortgage: deal.mortgage || 0,
          monthlyCashFlow: deal.monthlyCashFlow,
          ticker: deal.ticker,
        };

        sound.playDeal();
        addLog(
          p,
          `«${deal.title}» сатып алды (${formatTenge(totalCost)}${
            deal.monthlyCashFlow > 0
              ? `, +${formatTenge(deal.monthlyCashFlow)}/ай`
              : ''
          }).`
        );

        return {
          ...p,
          cash: p.cash - totalCost,
          assets: [...p.assets, newAsset],
          stats: {
            ...p.stats,
            dealsBought: p.stats.dealsBought + 1,
          },
        };
      },
      { advanceAfter: remaining.length === 0, checkGrad: true, remainingQueue: remaining }
    );
  };

  const executeSkipDeal = () => {
    if (
      activeModal?.type !== 'deal_card' &&
      activeModal?.type !== 'ft_business' &&
      activeModal?.type !== 'ft_dream'
    ) {
      return;
    }
    const current = players[currentPlayerIndex];
    if (current) {
      addLog(current, 'Мәмілені өткізіп жіберді.');
    }
    const remaining = popCurrentModal();
    if (remaining.length === 0) {
      advanceTurn(players, currentPlayerIndex);
    }
  };

  const executeApplyMarketEvent = (sellAssetInstanceIds: string[]) => {
    if (activeModal?.type !== 'market_event' || !activeModal.marketEvent) return;
    const ev = activeModal.marketEvent;
    const remaining = popCurrentModal();

    const idx = currentPlayerIndex;
    const nextPlayers = players.map((p, pIndex) => {
      if (p.phase !== 'rat_race') return p;
      let cash = p.cash;
      let remainingAssets = [...p.assets];

      if (ev.effectType === 'cashflow_change' && ev.cashFlowDeltaPercent) {
        remainingAssets = remainingAssets.map((a) => {
          if (ev.targetCategories.includes(a.category) && a.monthlyCashFlow > 0) {
            const updatedCf = Math.max(
              5_000,
              Math.round(a.monthlyCashFlow * (1 + ev.cashFlowDeltaPercent! / 100))
            );
            return { ...a, monthlyCashFlow: updatedCf };
          }
          return a;
        });
      }

      if (pIndex === idx && sellAssetInstanceIds.length > 0) {
        const soldTitles: string[] = [];
        remainingAssets = remainingAssets.filter((a) => {
          if (!sellAssetInstanceIds.includes(a.instanceId)) return true;
          const gross =
            ev.effectType === 'stock_price' && ev.newPrice
              ? ev.newPrice * a.quantity
              : Math.round(
                  (a.downPaymentPaid + a.mortgage) * (ev.priceMultiplier || 1.25)
                );
          const net = Math.max(0, gross - a.mortgage);
          cash += net;
          soldTitles.push(`${a.title} (+${formatTenge(net)})`);
          return false;
        });
        if (soldTitles.length > 0) {
          sound.playDeal();
          addLog(p, `Нарықта сатты: ${soldTitles.join(', ')}`);
        }
      }

      return { ...p, cash, assets: remainingAssets };
    });

    const currentAfter = nextPlayers[idx];
    addLog(currentAfter, `Нарық оқиғасы: ${ev.title}`);

    const grad = checkGraduationToFastTrack(currentAfter);
    if (grad.graduated) {
      nextPlayers[idx] = grad.nextPlayer;
      sound.playVictory();
      addLog(currentAfter, 'Еркін жолға (2-кезең) өтті!');
      setPlayers(nextPlayers);
      if (!currentAfter.isBot) {
        setModalQueue([{ type: 'phase_transition' }, ...remaining]);
        setQueueTotalCount((c) => Math.max(1, c) + (remaining.length === 0 ? 0 : 1));
        return;
      }
    } else {
      setPlayers(nextPlayers);
    }

    if (remaining.length === 0) {
      const tId = window.setTimeout(() => advanceTurn(nextPlayers, idx), 120);
      timersRef.current.push(tId);
    }
  };

  const executePayDoodad = (useKaspiRed: boolean) => {
    if (activeModal?.type !== 'doodad' || !activeModal.doodad) return;
    const dd = activeModal.doodad;
    const current = players[currentPlayerIndex];
    if (!current) return;

    if (!useKaspiRed && current.cash < dd.cost) {
      const shortfall = dd.cost - current.cash;
      const autoLoan = buildPendingAutoLoan(
        current,
        shortfall,
        `Күтпеген шығын: ${dd.title}`,
        { type: 'doodad', cost: dd.cost, title: dd.title }
      );
      pushAutoLoanModal(autoLoan);
      return;
    }

    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        if (useKaspiRed) {
          const monthly = Math.round(dd.cost / 12);
          const existingKaspi = p.liabilities.find((l) => l.id === 'kaspi_red');
          const nextLiabilities = existingKaspi
            ? p.liabilities.map((l) =>
                l.id === 'kaspi_red'
                  ? {
                      ...l,
                      balance: l.balance + dd.cost,
                      monthlyPayment: l.monthlyPayment + monthly,
                    }
                  : l
              )
            : [
                ...p.liabilities,
                {
                  id: 'kaspi_red',
                  name: 'Kaspi Red / Бөліп төлеу',
                  balance: dd.cost,
                  monthlyPayment: monthly,
                  canPayPartially: false,
                },
              ];
          addLog(
            p,
            `${dd.title} — Kaspi Red арқылы алды (+${formatTenge(monthly)}/ай міндеттеме).`
          );
          return {
            ...p,
            liabilities: nextLiabilities,
            stats: { ...p.stats, doodadsPaid: p.stats.doodadsPaid + 1 },
          };
        }

        addLog(p, `Күтпеген шығын төледі (${dd.title}): -${formatTenge(dd.cost)}.`);
        return {
          ...p,
          cash: p.cash - dd.cost,
          stats: { ...p.stats, doodadsPaid: p.stats.doodadsPaid + 1 },
        };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeCharityDecision = (accept: boolean) => {
    if (activeModal?.type !== 'charity') return;
    const current = players[currentPlayerIndex];
    if (!current) return;
    const summary = calculatePlayerSummary(current);
    const gift = Math.max(20_000, Math.round(summary.totalIncome * 0.1));
    const remaining = popCurrentModal();

    commitPlayerUpdate(
      (p) => {
        if (!accept || p.cash < gift) {
          addLog(p, 'Қайырымдылықты өткізіп жіберді.');
          return p;
        }
        sound.playDeal();
        addLog(p, `Садақа берді (${formatTenge(gift)}). Келесі 3 жүріс — 2 сүйек!`);
        return {
          ...p,
          cash: p.cash - gift,
          charityTurnsLeft: 3,
          stats: { ...p.stats, charityGiven: p.stats.charityGiven + 1 },
        };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeAcknowledgeChild = () => {
    if (activeModal?.type !== 'child') return;
    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        addLog(p, 'Отбасында бала дүниеге келді! Айлық шығын артты.');
        return { ...p, childrenCount: p.childrenCount + 1 };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeAcknowledgeDownsized = () => {
    if (activeModal?.type !== 'downsized') return;
    const current = players[currentPlayerIndex];
    if (!current) return;
    const s = calculatePlayerSummary(current);

    if (current.cash < s.totalExpenses) {
      const shortfall = s.totalExpenses - current.cash;
      const autoLoan = buildPendingAutoLoan(
        current,
        shortfall,
        'Жұмыстан қысқарту шығыны',
        { type: 'downsized', cost: s.totalExpenses }
      );
      pushAutoLoanModal(autoLoan);
      return;
    }

    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        addLog(
          p,
          `Жұмыстан қысқарту: -${formatTenge(s.totalExpenses)} төледі және 2 жүріс өткізеді.`
        );
        return { ...p, cash: p.cash - s.totalExpenses, missedTurns: 2 };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeAcknowledgePayday = () => {
    if (activeModal?.type !== 'payday') return;
    const amt = activeModal.paydayAmount || 0;
    const current = players[currentPlayerIndex];
    if (current) {
      addLog(
        current,
        `Жалақы күні: ${amt >= 0 ? '+' : ''}${formatTenge(amt)} түсті.`
      );
    }
    const remaining = popCurrentModal();
    if (remaining.length === 0) {
      advanceTurn(players, currentPlayerIndex);
    }
  };

  const executeAcknowledgePhaseTransition = () => {
    if (activeModal?.type !== 'phase_transition') return;
    const remaining = popCurrentModal();
    if (remaining.length === 0) {
      advanceTurn(players, currentPlayerIndex);
    }
  };

  const executeBuyFastTrackBusiness = () => {
    if (activeModal?.type !== 'ft_business' || !activeModal.ftDeal) return;
    const deal = activeModal.ftDeal;
    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        if (p.cash < deal.cost) return p;
        sound.playDeal();
        addLog(
          p,
          `Еркін жолда «${deal.title}» сатып алды (+${formatTenge(deal.monthlyCashFlow)}/ай).`
        );
        return {
          ...p,
          cash: p.cash - deal.cost,
          fastTrackAddedPassive: p.fastTrackAddedPassive + deal.monthlyCashFlow,
          stats: { ...p.stats, dealsBought: p.stats.dealsBought + 1 },
        };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeBuyDream = () => {
    if (activeModal?.type !== 'ft_dream' || !activeModal.dream) return;
    const dream = activeModal.dream;
    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        if (p.cash < dream.cost) return p;
        addLog(p, `Арманына жетті: «${dream.title}»!`);
        return {
          ...p,
          cash: p.cash - dream.cost,
          boughtDream: true,
        };
      },
      { advanceAfter: false, remainingQueue: remaining }
    );
  };

  const executeAcknowledgeFastTrackRisk = () => {
    if (activeModal?.type !== 'ft_risk') return;
    const amt = activeModal.riskAmount || 0;
    const title = activeModal.riskTitle || 'Шығын';
    const remaining = popCurrentModal();
    commitPlayerUpdate(
      (p) => {
        addLog(p, `${title}: -${formatTenge(amt)}.`);
        return { ...p, cash: Math.max(0, p.cash - amt) };
      },
      { advanceAfter: remaining.length === 0, remainingQueue: remaining }
    );
  };

  const executeConfirmAutoLoan = () => {
    if (activeModal?.type !== 'auto_loan_warning' || !activeModal.autoLoan) return;
    const autoLoan = activeModal.autoLoan;
    const remaining = popCurrentModal();

    commitPlayerUpdate(
      (p) => {
        const nextBankLoan = p.bankLoan + autoLoan.loanAmount;
        const nextLoansTaken = p.stats.loansTaken + 1;

        if (autoLoan.kind.type === 'doodad') {
          const { cost, title } = autoLoan.kind;
          const nextCash = Math.max(0, p.cash + autoLoan.loanAmount - cost);
          sound.playWarning();
          addLog(
            p,
            `Күтпеген шығын төледі (${title}): -${formatTenge(cost)} (банк несиесі: +${formatTenge(autoLoan.loanAmount)}).`
          );
          return {
            ...p,
            cash: nextCash,
            bankLoan: nextBankLoan,
            stats: {
              ...p.stats,
              doodadsPaid: p.stats.doodadsPaid + 1,
              loansTaken: nextLoansTaken,
            },
          };
        }

        if (autoLoan.kind.type === 'deal') {
          const { dealId, quantity, totalCost } = autoLoan.kind;
          const deal =
            SMALL_DEALS.find((d) => d.id === dealId) ||
            BIG_DEALS.find((d) => d.id === dealId);
          if (!deal) {
            return {
              ...p,
              cash: p.cash + autoLoan.loanAmount,
              bankLoan: nextBankLoan,
              stats: { ...p.stats, loansTaken: nextLoansTaken },
            };
          }

          const newAsset: OwnedAsset = {
            instanceId: makeId('asset'),
            dealId: deal.id,
            title: deal.title,
            category: deal.category,
            quantity: deal.isTradable ? quantity : 1,
            unitCost: deal.cost,
            downPaymentPaid: totalCost,
            mortgage: deal.mortgage || 0,
            monthlyCashFlow: deal.monthlyCashFlow,
            ticker: deal.ticker,
          };

          const nextCash = Math.max(0, p.cash + autoLoan.loanAmount - totalCost);
          sound.playDeal();
          addLog(
            p,
            `«${deal.title}» сатып алды (${formatTenge(totalCost)}${
              deal.monthlyCashFlow > 0
                ? `, +${formatTenge(deal.monthlyCashFlow)}/ай`
                : ''
            }, банк несиесі: +${formatTenge(autoLoan.loanAmount)}).`
          );
          return {
            ...p,
            cash: nextCash,
            bankLoan: nextBankLoan,
            assets: [...p.assets, newAsset],
            stats: {
              ...p.stats,
              dealsBought: p.stats.dealsBought + 1,
              loansTaken: nextLoansTaken,
            },
          };
        }

        if (autoLoan.kind.type === 'downsized') {
          const { cost } = autoLoan.kind;
          const nextCash = Math.max(0, p.cash + autoLoan.loanAmount - cost);
          sound.playWarning();
          addLog(
            p,
            `Жұмыстан қысқарту: -${formatTenge(cost)} төледі және 2 жүріс өткізеді (банк несиесі: +${formatTenge(autoLoan.loanAmount)}).`
          );
          return {
            ...p,
            cash: nextCash,
            bankLoan: nextBankLoan,
            missedTurns: 2,
            stats: { ...p.stats, loansTaken: nextLoansTaken },
          };
        }

        // payday_deficit
        const { deficit } = autoLoan.kind;
        const nextCash = Math.max(0, p.cash + autoLoan.loanAmount - deficit);
        sound.playPayday();
        addLog(
          p,
          `Айлық тапшылықты жабу үшін банк несиесі алынды: +${formatTenge(autoLoan.loanAmount)}.`
        );
        return {
          ...p,
          cash: nextCash,
          bankLoan: nextBankLoan,
          stats: { ...p.stats, loansTaken: nextLoansTaken },
        };
      },
      {
        advanceAfter: remaining.length === 0,
        checkGrad: autoLoan.kind.type === 'deal',
        remainingQueue: remaining,
      }
    );
  };

  const executeTakeManualLoan = (amount: number) => {
    if (amount <= 0) return;
    commitPlayerUpdate((p) => {
      sound.playPayday();
      addLog(p, `Банктен ${formatTenge(amount)} несие алды.`);
      return {
        ...p,
        cash: p.cash + amount,
        bankLoan: p.bankLoan + amount,
        stats: { ...p.stats, loansTaken: p.stats.loansTaken + 1 },
      };
    });
  };

  const executeRepayBankLoan = (amount: number) => {
    if (amount <= 0) return;
    commitPlayerUpdate(
      (p) => {
        const pay = Math.min(amount, p.bankLoan, p.cash);
        if (pay <= 0) return p;
        sound.playDeal();
        addLog(p, `Банк несиесінен ${formatTenge(pay)} өтеді.`);
        return {
          ...p,
          cash: p.cash - pay,
          bankLoan: p.bankLoan - pay,
        };
      },
      { checkGrad: true }
    );
  };

  const executePayLiability = (liabilityId: string) => {
    commitPlayerUpdate(
      (p) => {
        const target = p.liabilities.find((l) => l.id === liabilityId);
        if (!target || p.cash < target.balance) return p;
        sound.playDeal();
        addLog(p, `«${target.name}» қарызын толық жапты (${formatTenge(target.balance)}).`);
        return {
          ...p,
          cash: p.cash - target.balance,
          liabilities: p.liabilities.filter((l) => l.id !== liabilityId),
        };
      },
      { checkGrad: true }
    );
  };

  // UI Action Dispatchers (either run locally/host or forward to host from guest)
  const isMyOnlineTurn =
    onlineRole === 'local' ||
    (players[currentPlayerIndex]?.sessionId === mySessionId &&
      !players[currentPlayerIndex]?.isBot);

  const dispatchAction = useCallback(
    (action: GuestAction, localExecutor: () => void) => {
      if (onlineRole === 'online_guest') {
        if (!isMyOnlineTurn) return;
        guestTransportRef.current?.sendAction(mySessionId, action);
        return;
      }
      if (onlineRole === 'online_host' && !isMyOnlineTurn) return;
      localExecutor();
    },
    [onlineRole, isMyOnlineTurn, mySessionId]
  );

  const handleRollDice = useCallback(
    (useTwoDice?: boolean) => {
      dispatchAction({ type: 'ROLL_DICE', useTwoDice }, () => executeRollDice(useTwoDice));
    },
    [dispatchAction, executeRollDice]
  );

  const handleChooseDealSize = (size: 'small' | 'big') => {
    dispatchAction({ type: 'CHOOSE_DEAL_SIZE', size }, () => executeChooseDealSize(size));
  };

  const handleBuyDeal = (quantity: number, useLoanIfNeeded: boolean) => {
    dispatchAction({ type: 'BUY_DEAL', quantity, useLoanIfNeeded }, () =>
      executeBuyDeal(quantity, useLoanIfNeeded)
    );
  };

  const handleSkipDeal = () => {
    dispatchAction({ type: 'SKIP_DEAL' }, () => executeSkipDeal());
  };

  const handleApplyMarketEvent = (sellAssetInstanceIds: string[]) => {
    dispatchAction({ type: 'APPLY_MARKET_EVENT', sellAssetInstanceIds }, () =>
      executeApplyMarketEvent(sellAssetInstanceIds)
    );
  };

  const handlePayDoodad = (useKaspiRed: boolean) => {
    dispatchAction({ type: 'PAY_DOODAD', useKaspiRed }, () =>
      executePayDoodad(useKaspiRed)
    );
  };

  const handleCharityDecision = (accept: boolean) => {
    dispatchAction({ type: 'CHARITY_DECISION', accept }, () =>
      executeCharityDecision(accept)
    );
  };

  const handleAcknowledgeChild = () => {
    dispatchAction({ type: 'ACK_CHILD' }, () => executeAcknowledgeChild());
  };

  const handleAcknowledgeDownsized = () => {
    dispatchAction({ type: 'ACK_DOWNSIZED' }, () => executeAcknowledgeDownsized());
  };

  const handleAcknowledgePayday = () => {
    dispatchAction({ type: 'ACK_PAYDAY' }, () => executeAcknowledgePayday());
  };

  const handleAcknowledgePhaseTransition = () => {
    dispatchAction({ type: 'ACK_PHASE_TRANSITION' }, () =>
      executeAcknowledgePhaseTransition()
    );
  };

  const handleBuyFastTrackBusiness = () => {
    dispatchAction({ type: 'BUY_FT_BUSINESS' }, () => executeBuyFastTrackBusiness());
  };

  const handleBuyDream = () => {
    dispatchAction({ type: 'BUY_DREAM' }, () => executeBuyDream());
  };

  const handleAcknowledgeFastTrackRisk = () => {
    dispatchAction({ type: 'ACK_FT_RISK' }, () => executeAcknowledgeFastTrackRisk());
  };

  const handleConfirmAutoLoan = () => {
    dispatchAction({ type: 'CONFIRM_AUTO_LOAN' }, () => executeConfirmAutoLoan());
  };

  const handleTakeManualLoan = (amount: number) => {
    dispatchAction({ type: 'TAKE_MANUAL_LOAN', amount }, () =>
      executeTakeManualLoan(amount)
    );
  };

  const handleRepayBankLoan = (amount: number) => {
    dispatchAction({ type: 'REPAY_BANK_LOAN', amount }, () =>
      executeRepayBankLoan(amount)
    );
  };

  const handlePayLiability = (liabilityId: string) => {
    dispatchAction({ type: 'PAY_LIABILITY', liabilityId }, () =>
      executePayLiability(liabilityId)
    );
  };

  // Online Host: build and broadcast latest authoritative snapshot
  const latestSnapshot = useMemo<OnlineGameSnapshot>(
    () => ({
      screen: screen === 'menu' ? 'lobby' : screen,
      roomCode,
      hostSessionId,
      lobbyPlayers,
      players,
      currentPlayerIndex,
      turnCount,
      logs: logs.slice(0, 40),
      lastDice,
      rolling,
      isStepping,
      modalQueue,
      queueTotalCount,
      winnerId,
      winReason,
      toast: toastNotice,
    }),
    [
      screen,
      roomCode,
      hostSessionId,
      lobbyPlayers,
      players,
      currentPlayerIndex,
      turnCount,
      logs,
      lastDice,
      rolling,
      isStepping,
      modalQueue,
      queueTotalCount,
      winnerId,
      winReason,
      toastNotice,
    ]
  );

  const latestSnapshotRef = useRef<OnlineGameSnapshot>(latestSnapshot);
  latestSnapshotRef.current = latestSnapshot;

  useEffect(() => {
    if (onlineRole === 'online_host' && screen !== 'menu') {
      hostTransportRef.current?.broadcastSnapshot(latestSnapshot);
    }
  }, [onlineRole, screen, latestSnapshot]);

  // Host refs to avoid stale closures inside PeerJS event callbacks
  const hostCallbacksRef = useRef<{
    onHello: (
      msg: Extract<PeerMessage, { type: 'HELLO' }>
    ) => { accepted: boolean; errorReason?: string };
    onAction: (sessionId: string, action: GuestAction) => void;
    onDisconnect: (sessionId: string) => void;
  }>({
    onHello: () => ({ accepted: false }),
    onAction: () => {},
    onDisconnect: () => {},
  });

  hostCallbacksRef.current = {
    onHello: (msg) => {
      if (screen === 'lobby') {
        const existingIdx = lobbyPlayers.findIndex((p) => p.sessionId === msg.sessionId);
        if (existingIdx >= 0) {
          setLobbyPlayers((prev) =>
            prev.map((p, i) =>
              i === existingIdx ? { ...p, isConnected: true } : p
            )
          );
          window.setTimeout(() => {
            hostTransportRef.current?.sendToSession(msg.sessionId, {
              type: 'STATE_SYNC',
              snapshot: latestSnapshotRef.current,
            });
          }, 40);
          return { accepted: true };
        }

        if (lobbyPlayers.length >= 6) {
          return { accepted: false, errorReason: 'Бөлме толы (ең көбі 6 ойыншы).' };
        }

        const usedColors = new Set(lobbyPlayers.map((p) => p.color));
        const pickedColor =
          msg.preferredColor && !usedColors.has(msg.preferredColor)
            ? msg.preferredColor
            : LOBBY_COLORS.find((c) => !usedColors.has(c.hex))?.hex ||
              PLAYER_COLORS[lobbyPlayers.length % PLAYER_COLORS.length];

        const colorIdx = Math.max(
          0,
          LOBBY_COLORS.findIndex((c) => c.hex === pickedColor)
        );
        const newLobbyPlayer: LobbyPlayer = {
          sessionId: msg.sessionId,
          name: msg.name.trim() || `Ойыншы ${lobbyPlayers.length + 1}`,
          professionId:
            PROFESSIONS.find((p) => p.id === msg.professionId)?.id ||
            PROFESSIONS[lobbyPlayers.length % PROFESSIONS.length].id,
          dreamId:
            DREAMS.find((d) => d.id === msg.dreamId)?.id ||
            DREAMS[lobbyPlayers.length % DREAMS.length].id,
          color: pickedColor,
          tokenSymbol: PLAYER_SYMBOLS[colorIdx % PLAYER_SYMBOLS.length],
          isHost: false,
          isReady: false,
          isConnected: true,
        };

        setLobbyPlayers((prev) => [...prev, newLobbyPlayer]);
        return { accepted: true };
      }

      // Game already started: allow reconnect only if sessionId matches a seat
      const seatIdx = players.findIndex((p) => p.sessionId === msg.sessionId);
      if (seatIdx < 0) {
        return {
          accepted: false,
          errorReason: 'Ойын басталып кеткен. Жаңа ойыншы қосыла алмайды.',
        };
      }

      const returningPlayer = players[seatIdx];
      setPlayers((prev) =>
        prev.map((p, i) =>
          i === seatIdx
            ? { ...p, isConnected: true, isBot: false, botControlled: false }
            : p
        )
      );
      addLog(returningPlayer, 'Ойынға қайта қосылды!');
      window.setTimeout(() => {
        hostTransportRef.current?.sendToSession(msg.sessionId, {
          type: 'STATE_SYNC',
          snapshot: latestSnapshotRef.current,
        });
      }, 40);
      return { accepted: true };
    },

    onAction: (sessionId, action) => {
      if (screen === 'lobby') {
        if (action.type === 'LOBBY_UPDATE_PROFILE') {
          setLobbyPlayers((prev) => {
            const colorTaken = prev.some(
              (p) => p.sessionId !== sessionId && p.color === action.color
            );
            return prev.map((p) => {
              if (p.sessionId !== sessionId) return p;
              const nextColor = colorTaken ? p.color : action.color;
              const symIdx = Math.max(
                0,
                LOBBY_COLORS.findIndex((c) => c.hex === nextColor)
              );
              return {
                ...p,
                name: action.name.slice(0, 24),
                professionId: action.professionId,
                dreamId: action.dreamId,
                color: nextColor,
                tokenSymbol: PLAYER_SYMBOLS[symIdx % PLAYER_SYMBOLS.length],
              };
            });
          });
        } else if (action.type === 'LOBBY_TOGGLE_READY') {
          setLobbyPlayers((prev) =>
            prev.map((p) =>
              p.sessionId === sessionId ? { ...p, isReady: action.isReady } : p
            )
          );
        }
        return;
      }

      if (screen !== 'playing') return;
      const current = players[currentPlayerIndex];
      if (!current || current.sessionId !== sessionId || current.isBot) return;

      switch (action.type) {
        case 'ROLL_DICE':
          executeRollDice(action.useTwoDice);
          break;
        case 'CHOOSE_DEAL_SIZE':
          executeChooseDealSize(action.size);
          break;
        case 'BUY_DEAL':
          executeBuyDeal(action.quantity, action.useLoanIfNeeded);
          break;
        case 'SKIP_DEAL':
          executeSkipDeal();
          break;
        case 'APPLY_MARKET_EVENT':
          executeApplyMarketEvent(action.sellAssetInstanceIds);
          break;
        case 'PAY_DOODAD':
          executePayDoodad(action.useKaspiRed);
          break;
        case 'CHARITY_DECISION':
          executeCharityDecision(action.accept);
          break;
        case 'ACK_CHILD':
          executeAcknowledgeChild();
          break;
        case 'ACK_DOWNSIZED':
          executeAcknowledgeDownsized();
          break;
        case 'ACK_PAYDAY':
          executeAcknowledgePayday();
          break;
        case 'ACK_PHASE_TRANSITION':
          executeAcknowledgePhaseTransition();
          break;
        case 'BUY_FT_BUSINESS':
          executeBuyFastTrackBusiness();
          break;
        case 'BUY_DREAM':
          executeBuyDream();
          break;
        case 'ACK_FT_RISK':
          executeAcknowledgeFastTrackRisk();
          break;
        case 'CONFIRM_AUTO_LOAN':
          executeConfirmAutoLoan();
          break;
        case 'TAKE_MANUAL_LOAN':
          executeTakeManualLoan(action.amount);
          break;
        case 'REPAY_BANK_LOAN':
          executeRepayBankLoan(action.amount);
          break;
        case 'PAY_LIABILITY':
          executePayLiability(action.liabilityId);
          break;
      }
    },

    onDisconnect: (sessionId) => {
      if (screen === 'lobby') {
        setLobbyPlayers((prev) =>
          prev.map((p) =>
            p.sessionId === sessionId ? { ...p, isConnected: false, isReady: false } : p
          )
        );
        return;
      }

      const disconnectedPlayer = players.find((p) => p.sessionId === sessionId);
      setPlayers((prev) =>
        prev.map((p) =>
          p.sessionId === sessionId ? { ...p, isConnected: false } : p
        )
      );
      if (disconnectedPlayer) {
        addLog(disconnectedPlayer, 'Байланыстан ажыратылды (офлайн).');
      }
    },
  };

  // Host 30s disconnect countdown when current active player is offline
  useEffect(() => {
    if (onlineRole !== 'online_host' || screen !== 'playing') {
      setOfflineCountdown(null);
      return;
    }

    const current = players[currentPlayerIndex];
    const isOfflineTurn = Boolean(
      current &&
        current.sessionId !== mySessionId &&
        !current.isBot &&
        current.isConnected === false
    );

    if (!isOfflineTurn) {
      setOfflineCountdown(null);
      return;
    }

    setOfflineCountdown(OFFLINE_TURN_WAIT_SECONDS);
    const intervalId = window.setInterval(() => {
      setOfflineCountdown((prev) => {
        if (prev === null || prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [onlineRole, screen, players, currentPlayerIndex, mySessionId]);

  const handleCreateOnlineRoom = (rawName: string) => {
    const cleanName = rawName.trim() || 'Хост';
    const savedProf = loadOnlineProfile();
    const profId = savedProf?.professionId || PROFESSIONS[0].id;
    const dreamId = savedProf?.dreamId || DREAMS[0].id;
    const color = savedProf?.color || LOBBY_COLORS[0].hex;
    saveOnlineProfile({ name: cleanName, professionId: profId, dreamId, color });

    clearAllTimers();
    cleanupOnlineTransports();
    setOnlineBusy(true);
    setOnlineError(null);
    setHostDisconnected(false);

    const hostPlayer: LobbyPlayer = {
      sessionId: mySessionId,
      name: cleanName,
      professionId: profId,
      dreamId,
      color,
      tokenSymbol: PLAYER_SYMBOLS[0],
      isHost: true,
      isReady: false,
      isConnected: true,
    };

    const transport = new OnlineHostTransport({
      onReady: (code) => {
        setOnlineBusy(false);
        setOnlineRole('online_host');
        setRoomCode(code);
        setHostSessionId(mySessionId);
        setLobbyPlayers([hostPlayer]);
        setScreen('lobby');
      },
      onError: (msg) => {
        setOnlineBusy(false);
        setOnlineError(msg);
        cleanupOnlineTransports();
      },
      onGuestHello: (payload) => hostCallbacksRef.current.onHello(payload),
      onGuestAction: (sessionId, action) =>
        hostCallbacksRef.current.onAction(sessionId, action),
      onGuestDisconnect: (sessionId) =>
        hostCallbacksRef.current.onDisconnect(sessionId),
    });

    hostTransportRef.current = transport;
    transport.start();
  };

  const handleJoinOnlineRoom = (rawCode: string, rawName: string) => {
    const code = normalizeRoomCode(rawCode);
    if (code.length !== 5) {
      setOnlineError('Бөлме коды 5 таңбадан тұруы тиіс.');
      return;
    }

    const cleanName = rawName.trim() || 'Ойыншы';
    const savedProf = loadOnlineProfile();
    const profId = savedProf?.professionId || PROFESSIONS[1].id;
    const dreamId = savedProf?.dreamId || DREAMS[1].id;
    const preferredColor = savedProf?.color;
    saveOnlineProfile({
      name: cleanName,
      professionId: profId,
      dreamId,
      color: preferredColor || LOBBY_COLORS[1].hex,
    });

    clearAllTimers();
    cleanupOnlineTransports();
    prevGuestSnapRef.current = null;
    setOnlineBusy(true);
    setOnlineError(null);
    setHostDisconnected(false);

    const transport = new OnlineGuestTransport({
      onConnected: () => {
        setOnlineBusy(false);
        setOnlineRole('online_guest');
        setRoomCode(code);
      },
      onSnapshot: (snap) => {
        const prev = prevGuestSnapRef.current;
        if (prev) {
          if (!prev.rolling && snap.rolling) {
            sound.playDice();
          }
          const curPos = snap.players[snap.currentPlayerIndex]?.position ?? 0;
          if (snap.isStepping && curPos !== prev.pos) {
            sound.playStep();
          }
          if (prev.screen !== 'victory' && snap.screen === 'victory') {
            sound.playVictory();
          }
        }
        prevGuestSnapRef.current = {
          rolling: snap.rolling,
          pos: snap.players[snap.currentPlayerIndex]?.position ?? 0,
          screen: snap.screen,
        };

        setRoomCode(snap.roomCode);
        setHostSessionId(snap.hostSessionId);
        setLobbyPlayers(snap.lobbyPlayers);
        setPlayers(snap.players);
        setCurrentPlayerIndex(snap.currentPlayerIndex);
        setTurnCount(snap.turnCount);
        setLogs(snap.logs);
        setLastDice(snap.lastDice);
        setRolling(snap.rolling);
        setIsStepping(snap.isStepping);
        setModalQueue(snap.modalQueue);
        setQueueTotalCount(snap.queueTotalCount);
        setWinnerId(snap.winnerId);
        setWinReason(snap.winReason);
        setToastNotice(snap.toast);
        setScreen(snap.screen);
      },
      onError: (reason) => {
        setOnlineBusy(false);
        setOnlineError(reason);
        setOnlineRole('local');
        setScreen('menu');
        cleanupOnlineTransports();
      },
      onKicked: (reason) => {
        setOnlineBusy(false);
        setOnlineError(reason);
        setOnlineRole('local');
        setScreen('menu');
        cleanupOnlineTransports();
      },
      onHostDisconnected: () => {
        setHostDisconnected(true);
      },
    });

    guestTransportRef.current = transport;
    transport.connect(code, {
      sessionId: mySessionId,
      name: cleanName,
      professionId: profId,
      dreamId,
      preferredColor,
    });
  };

  const handleLobbyUpdateProfile = (patch: {
    name: string;
    professionId: string;
    dreamId: string;
    color: string;
  }) => {
    saveOnlineProfile(patch);
    if (onlineRole === 'online_guest') {
      guestTransportRef.current?.sendAction(mySessionId, {
        type: 'LOBBY_UPDATE_PROFILE',
        ...patch,
      });
      return;
    }

    setLobbyPlayers((prev) => {
      const colorTaken = prev.some(
        (p) => p.sessionId !== mySessionId && p.color === patch.color
      );
      return prev.map((p) => {
        if (p.sessionId !== mySessionId) return p;
        const nextColor = colorTaken ? p.color : patch.color;
        const symIdx = Math.max(
          0,
          LOBBY_COLORS.findIndex((c) => c.hex === nextColor)
        );
        return {
          ...p,
          name: patch.name.slice(0, 24),
          professionId: patch.professionId,
          dreamId: patch.dreamId,
          color: nextColor,
          tokenSymbol: PLAYER_SYMBOLS[symIdx % PLAYER_SYMBOLS.length],
        };
      });
    });
  };

  const handleLobbyToggleReady = (nextReady: boolean) => {
    if (onlineRole === 'online_guest') {
      guestTransportRef.current?.sendAction(mySessionId, {
        type: 'LOBBY_TOGGLE_READY',
        isReady: nextReady,
      });
      return;
    }
    setLobbyPlayers((prev) =>
      prev.map((p) =>
        p.sessionId === mySessionId ? { ...p, isReady: nextReady } : p
      )
    );
  };

  const handleLobbyKickPlayer = (targetSessionId: string) => {
    if (onlineRole !== 'online_host' || targetSessionId === mySessionId) return;
    hostTransportRef.current?.kickSession(targetSessionId);
    setLobbyPlayers((prev) => prev.filter((p) => p.sessionId !== targetSessionId));
  };

  const handleStartOnlineGame = () => {
    if (onlineRole !== 'online_host') return;
    const readyCount = lobbyPlayers.filter((p) => p.isReady && p.isConnected).length;
    if (lobbyPlayers.length < 2 || readyCount < 2) return;

    const initialPlayers: Player[] = lobbyPlayers.map((lp, idx) => {
      const prof = PROFESSIONS.find((p) => p.id === lp.professionId) || PROFESSIONS[0];
      const dream = DREAMS.find((d) => d.id === lp.dreamId) || DREAMS[0];
      return {
        id: makeId(`op${idx}`),
        name: lp.name.trim() || `Ойыншы ${idx + 1}`,
        isBot: false,
        botControlled: false,
        sessionId: lp.sessionId,
        isConnected: lp.isConnected,
        color: lp.color,
        tokenSymbol: lp.tokenSymbol,
        profession: prof,
        dream,
        phase: 'rat_race',
        position: 0,
        cash: prof.startingSavings,
        childrenCount: 0,
        bankLoan: 0,
        liabilities: buildInitialLiabilities(prof),
        assets: [],
        charityTurnsLeft: 0,
        missedTurns: 0,
        fastTrackBasePassive: 0,
        fastTrackAddedPassive: 0,
        fastTrackTargetPassive: 5_000_000,
        boughtDream: false,
        stats: {
          turnsPlayed: 0,
          dealsBought: 0,
          doodadsPaid: 0,
          loansTaken: 0,
          charityGiven: 0,
        },
      };
    });

    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setTurnCount(1);
    setLogs([
      {
        id: makeId('log'),
        playerName: initialPlayers[0].name,
        playerColor: initialPlayers[0].color,
        message: 'Онлайн ойын басталды! Сәттілік тілейміз!',
        timestamp: Date.now(),
      },
    ]);
    setLastDice([1]);
    setModalQueue([]);
    setQueueTotalCount(0);
    setWinnerId(null);
    setWinReason(null);
    setRolling(false);
    setIsStepping(false);
    setToastNotice(null);
    setScreen('playing');
  };

  const handleHostSkipOfflineTurn = () => {
    if (onlineRole !== 'online_host') return;
    const current = players[currentPlayerIndex];
    if (!current) return;
    setModalQueue([]);
    setQueueTotalCount(0);
    setToastNotice(null);
    addLog(current, 'Офлайн болғандықтан жүрісі өткізілді.');
    advanceTurn(players, currentPlayerIndex);
  };

  const handleHostLetBotPlay = () => {
    if (onlineRole !== 'online_host') return;
    const current = players[currentPlayerIndex];
    if (!current) return;

    const hadOpenModals = modalQueue.length > 0;
    setModalQueue([]);
    setQueueTotalCount(0);
    setToastNotice(null);

    const nextArr = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, isBot: true, botControlled: true } : p
    );
    setPlayers(nextArr);
    addLog(current, 'Офлайн — уақытша бот ойнайды.');

    if (hadOpenModals) {
      const tId = window.setTimeout(() => {
        advanceTurn(nextArr, currentPlayerIndex);
      }, 350);
      timersRef.current.push(tId);
    }
  };

  const handleLeaveToMenu = () => {
    clearAllTimers();
    cleanupOnlineTransports();
    setOnlineRole('local');
    setRoomCode('');
    setLobbyPlayers([]);
    setHostDisconnected(false);
    setToastNotice(null);
    setOfflineCountdown(null);
    setModalQueue([]);
    setQueueTotalCount(0);
    setShowLoanModal(false);
    setShowStatementModal(false);
    setScreen('menu');
  };

  const handlePlayAgain = () => {
    clearAllTimers();
    if (onlineRole === 'local') {
      clearGameState();
      setSavedExists(false);
    }
    handleLeaveToMenu();
  };

  const currentPlayer = players[currentPlayerIndex];
  const viewedPlayer =
    onlineRole === 'local'
      ? currentPlayer
      : players.find((p) => p.sessionId === mySessionId) || currentPlayer;
  const winner = players.find((p) => p.id === winnerId) || players[0];

  const canShowPrivateModal =
    Boolean(activeModal && currentPlayer) &&
    (onlineRole === 'local' ||
      (currentPlayer.sessionId === mySessionId && !currentPlayer.isBot));

  const waitingOnlineText =
    onlineRole !== 'local' && currentPlayer && !isMyOnlineTurn && !currentPlayer.isBot
      ? modalQueue.length > 0
        ? `${currentPlayer.name} шешім қабылдап жатыр...`
        : `${currentPlayer.name} жүріс жасап жатыр...`
      : null;

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-slate-900 dark:bg-[#0B1117] dark:text-slate-100 transition-colors">
      {screen === 'menu' && (
        <SetupScreen
          hasSavedGame={savedExists}
          theme={theme}
          soundEnabled={soundEnabled}
          initialRoomCode={initialRoomCode}
          onlineBusy={onlineBusy}
          onlineError={onlineError}
          onToggleTheme={toggleTheme}
          onToggleSound={toggleSound}
          onResumeSavedGame={handleResumeSavedGame}
          onOpenRules={() => setShowRulesModal(true)}
          onStartNewGame={handleStartNewGame}
          onCreateOnlineRoom={handleCreateOnlineRoom}
          onJoinOnlineRoom={handleJoinOnlineRoom}
        />
      )}

      {screen === 'lobby' && (
        <OnlineLobby
          roomCode={roomCode}
          isHost={onlineRole === 'online_host'}
          mySessionId={mySessionId}
          lobbyPlayers={lobbyPlayers}
          theme={theme}
          onUpdateProfile={handleLobbyUpdateProfile}
          onToggleReady={handleLobbyToggleReady}
          onKickPlayer={handleLobbyKickPlayer}
          onStartOnlineGame={handleStartOnlineGame}
          onLeaveLobby={handleLeaveToMenu}
        />
      )}

      {screen === 'victory' && winner && (
        <VictoryScreen
          winner={winner}
          winReason={winReason || 'Ойын сәтті аяқталды!'}
          players={players}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {screen === 'playing' && currentPlayer && viewedPlayer && (
        <div className="min-h-screen flex flex-col">
          {/* Clean 3-zone Game Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131C26]/90 backdrop-blur-xs">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                <QoshqarMuiizEmblem className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                <span className="text-base sm:text-lg font-extrabold tracking-tight">
                  Қаржы Ағыны
                </span>
                {onlineRole !== 'local' && roomCode && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono-num bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {roomCode}
                  </span>
                )}
              </div>

              <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="hover:text-teal-700 dark:hover:text-teal-400 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                  Ереже
                </button>
                <button
                  type="button"
                  onClick={handleLeaveToMenu}
                  className="hover:text-teal-700 dark:hover:text-teal-400 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Home className="w-4 h-4" />
                  Мәзір
                </button>
              </nav>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-xs font-mono-num text-slate-500 dark:text-slate-400 mr-1 whitespace-nowrap">
                  Жүріс #{turnCount}
                </span>
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={soundEnabled ? 'Дыбысты өшіру' : 'Дыбысты қосу'}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Жарық режим' : 'Қараңғы режим'}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </header>

          {/* Main Game Layout */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Host 30s Offline Turn Banner */}
              {onlineRole === 'online_host' && offlineCountdown !== null && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-100">
                      {offlineCountdown > 0 ? (
                        <span>
                          <strong>{currentPlayer.name}</strong> офлайн. Қайта қосылуын күтуде:{' '}
                          <strong className="font-mono-num">{offlineCountdown} с</strong>...
                        </span>
                      ) : (
                        <span>
                          <strong>{currentPlayer.name}</strong> 30 секунд ішінде оралмады. Әрекет таңдаңыз:
                        </span>
                      )}
                    </div>
                  </div>
                  {offlineCountdown === 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleHostSkipOfflineTurn}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Өткізіп жіберу
                      </button>
                      <button
                        type="button"
                        onClick={handleHostLetBotPlay}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Бот ойнасын
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Non-blocking Toast for Spectators when Acting Player Has a Private Modal */}
              {onlineRole !== 'local' && !isMyOnlineTurn && toastNotice && (
                <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#131C26] border border-teal-200 dark:border-teal-800 shadow-xs flex items-center gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: toastNotice.playerColor || '#0D7A6F' }}
                  />
                  <span>{toastNotice.message}</span>
                </div>
              )}

              <GameBoard
                players={players}
                currentPlayer={currentPlayer}
                dice={lastDice}
                rolling={rolling}
                canRoll={
                  !rolling &&
                  !isStepping &&
                  !activeModal &&
                  !currentPlayer.isBot &&
                  isMyOnlineTurn
                }
                waitingOnlineText={waitingOnlineText}
                onRoll={handleRollDice}
                lastActionText={logs[0] ? `${logs[0].playerName}: ${logs[0].message}` : ''}
              />
            </div>

            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <MiniStatement
                player={viewedPlayer}
                onOpenStatement={() => setShowStatementModal(true)}
                onOpenLoan={() => setShowLoanModal(true)}
              />

              <section className="bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <Users className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ойыншылар ({players.length})
                  </h2>
                </div>
                <ul className="mt-2.5 space-y-2">
                  {players.map((p, idx) => {
                    const s = calculatePlayerSummary(p);
                    const isActive = idx === currentPlayerIndex;
                    const isSelf = onlineRole !== 'local' && p.sessionId === mySessionId;
                    return (
                      <li
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          isActive
                            ? 'border-teal-600 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'border-slate-100 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.tokenSymbol}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span className="truncate">
                                {p.name}
                                {isSelf ? ' (Сіз)' : ''}
                                {isActive ? ' · Жүріс' : ''}
                              </span>
                              {onlineRole !== 'local' && (
                                <span
                                  title={
                                    p.botControlled
                                      ? 'Бот'
                                      : p.isConnected !== false
                                      ? 'Онлайн'
                                      : 'Офлайн'
                                  }
                                  className={`inline-flex items-center gap-0.5 text-[10px] font-semibold shrink-0 ${
                                    p.botControlled
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : p.isConnected !== false
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {p.botControlled ? (
                                    <Bot className="w-3 h-3" />
                                  ) : p.isConnected !== false ? (
                                    <Wifi className="w-3 h-3" />
                                  ) : (
                                    <WifiOff className="w-3 h-3" />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {p.phase === 'fast_track' ? 'Еркін жол' : p.profession.title}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono-num shrink-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatTenge(p.cash)}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Пассив: {formatTenge(s.passiveIncome)}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <History className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Соңғы оқиғалар
                  </h2>
                </div>
                <ul className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {logs.slice(0, 20).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: entry.playerColor }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {entry.playerName}:{' '}
                        </span>
                        {entry.message}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </main>
        </div>
      )}

      {canShowPrivateModal && activeModal && currentPlayer && (
        <EventModal
          modal={activeModal}
          player={currentPlayer}
          allPlayers={players}
          queueIndicator={queueIndicator}
          onChooseDealSize={handleChooseDealSize}
          onBuyDeal={handleBuyDeal}
          onSkipDeal={handleSkipDeal}
          onApplyMarketEvent={handleApplyMarketEvent}
          onPayDoodad={handlePayDoodad}
          onCharityDecision={handleCharityDecision}
          onAcknowledgeChild={handleAcknowledgeChild}
          onAcknowledgeDownsized={handleAcknowledgeDownsized}
          onAcknowledgePayday={handleAcknowledgePayday}
          onAcknowledgePhaseTransition={handleAcknowledgePhaseTransition}
          onBuyFastTrackBusiness={handleBuyFastTrackBusiness}
          onBuyDream={handleBuyDream}
          onAcknowledgeFastTrackRisk={handleAcknowledgeFastTrackRisk}
          onConfirmAutoLoan={handleConfirmAutoLoan}
        />
      )}

      {showStatementModal && viewedPlayer && (
        <FinancialStatementModal
          player={viewedPlayer}
          readOnlyActions={onlineRole !== 'local' && !isMyOnlineTurn}
          onClose={() => setShowStatementModal(false)}
          onPayLiability={handlePayLiability}
          onRepayBankLoan={handleRepayBankLoan}
        />
      )}

      {showLoanModal && viewedPlayer && (
        <LoanModal
          player={viewedPlayer}
          readOnlyActions={onlineRole !== 'local' && !isMyOnlineTurn}
          onClose={() => setShowLoanModal(false)}
          onTakeLoan={handleTakeManualLoan}
          onRepayBankLoan={handleRepayBankLoan}
          onPayLiability={handlePayLiability}
        />
      )}

      {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}

      {hostDisconnected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <WifiOff className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Хост ойыннан шықты, ойын аяқталды
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Бөлме иесімен байланыс үзілді. Басты мәзірге оралып, жаңа ойын бастай аласыз.
            </p>
            <button
              type="button"
              onClick={handleLeaveToMenu}
              className="w-full min-h-[44px] py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold cursor-pointer"
            >
              Мәзірге қайту
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
