import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Play,
  Share2,
  UserMinus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DREAMS } from '../data/assets';
import { PROFESSIONS } from '../data/professions';
import { LobbyPlayer, ThemeMode } from '../types/game';
import { formatTenge } from '../utils/format';
import { QoshqarMuiizDivider, QoshqarMuiizEmblem } from './KazakhOrnament';

export const LOBBY_COLORS = [
  { hex: '#0D7A6F', label: 'Жасыл-көк' },
  { hex: '#D97706', label: 'Сары-алтын' },
  { hex: '#2563EB', label: 'Көк' },
  { hex: '#BE185D', label: 'Қызыл-қошқыл' },
  { hex: '#7C3AED', label: 'Күлгін' },
  { hex: '#047857', label: 'Изумруд' },
];

interface OnlineLobbyProps {
  roomCode: string;
  isHost: boolean;
  mySessionId: string;
  lobbyPlayers: LobbyPlayer[];
  theme: ThemeMode;
  onUpdateProfile: (patch: {
    name: string;
    professionId: string;
    dreamId: string;
    color: string;
  }) => void;
  onToggleReady: (nextReady: boolean) => void;
  onKickPlayer: (sessionId: string) => void;
  onStartOnlineGame: () => void;
  onLeaveLobby: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  roomCode,
  isHost,
  mySessionId,
  lobbyPlayers,
  onUpdateProfile,
  onToggleReady,
  onKickPlayer,
  onStartOnlineGame,
  onLeaveLobby,
}) => {
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const me = lobbyPlayers.find((p) => p.sessionId === mySessionId) || lobbyPlayers[0];
  const readyCount = lobbyPlayers.filter((p) => p.isReady && p.isConnected).length;
  const canStart = isHost && lobbyPlayers.length >= 2 && readyCount >= 2;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : `?room=${roomCode}`;

  const handleShareOrCopy = async () => {
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Қаржы Ағыны — Онлайн ойын',
          text: `«Қаржы Ағыны» ойынына қосылыңыз! Бөлме коды: ${roomCode}`,
          url: shareUrl,
        });
        setCopiedNotice('Сілтеме жіберілді!');
        window.setTimeout(() => setCopiedNotice(null), 2500);
        return;
      } catch {
        // Fallback to clipboard below
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedNotice('Сілтеме көшірілді!');
    } catch {
      setCopiedNotice(`Код: ${roomCode}`);
    }
    window.setTimeout(() => setCopiedNotice(null), 2500);
  };

  const takenColorsByOthers = new Set(
    lobbyPlayers.filter((p) => p.sessionId !== mySessionId).map((p) => p.color)
  );

  const myProf = me
    ? PROFESSIONS.find((p) => p.id === me.professionId) || PROFESSIONS[0]
    : PROFESSIONS[0];
  const taxes =
    myProf.taxBreakdown.ipn +
    myProf.taxBreakdown.opv +
    myProf.taxBreakdown.vosms +
    myProf.taxBreakdown.other;
  const expenses =
    taxes +
    myProf.housingExpense +
    myProf.autoExpense +
    myProf.kaspiRedExpense +
    myProf.otherLoanExpense +
    myProf.livingExpense;
  const cashflow = myProf.grossSalary - expenses;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#131C26]/85 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <QoshqarMuiizEmblem className="w-6 h-6 text-teal-700 dark:text-teal-400" />
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Қаржы Ағыны · Онлайн бөлме
            </span>
          </div>
          <button
            type="button"
            onClick={onLeaveLobby}
            className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Шығу
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* Room Code & Share Card */}
        <section className="bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Достарыңызды шақыру коды (2–6 ойыншы)
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black tracking-[0.18em] font-mono-num text-slate-900 dark:text-white">
                {roomCode}
              </span>
              {copiedNotice && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {copiedNotice}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-all">
              {shareUrl}
            </p>
          </div>

          <button
            type="button"
            onClick={handleShareOrCopy}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            {typeof navigator !== 'undefined' &&
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
            typeof navigator.share === 'function' ? (
              <Share2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Сілтемені көшіру
          </button>
        </section>

        <QoshqarMuiizDivider className="max-w-lg mx-auto" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Player Profile Setup (Self) */}
          {me && (
            <section className="lg:col-span-6 bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Сіздің профиліңіз
                </h2>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: me.color }}
                >
                  {me.tokenSymbol}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Есіміңіз
                </label>
                <input
                  type="text"
                  value={me.name}
                  maxLength={24}
                  onChange={(e) =>
                    onUpdateProfile({
                      name: e.target.value,
                      professionId: me.professionId,
                      dreamId: me.dreamId,
                      color: me.color,
                    })
                  }
                  placeholder="Атыңызды енгізіңіз"
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Фишка түсі (әр ойыншыда бөлек болуы тиіс)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {LOBBY_COLORS.map((c) => {
                    const isMine = me.color === c.hex;
                    const isTaken = takenColorsByOthers.has(c.hex);
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={isTaken}
                        aria-label={c.label}
                        title={isTaken ? `${c.label} — бос емес` : c.label}
                        onClick={() =>
                          onUpdateProfile({
                            name: me.name,
                            professionId: me.professionId,
                            dreamId: me.dreamId,
                            color: c.hex,
                          })
                        }
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                          isMine
                            ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110'
                            : ''
                        } ${isTaken ? 'opacity-25 cursor-not-allowed' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isMine && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Кәсіпті таңдау
                </label>
                <select
                  value={me.professionId}
                  onChange={(e) =>
                    onUpdateProfile({
                      name: me.name,
                      professionId: e.target.value,
                      dreamId: me.dreamId,
                      color: me.color,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {PROFESSIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono-num">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Жалақы:</span>
                  <span className="font-semibold">{formatTenge(myProf.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Шығыс:</span>
                  <span className="text-rose-700 dark:text-rose-400">
                    {formatTenge(expenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ақша ағыны:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    +{formatTenge(cashflow)}/ай
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Бастапқы қор:</span>
                  <span>{formatTenge(myProf.startingSavings)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Жеке Арман (2-кезең мақсаты)
                </label>
                <select
                  value={me.dreamId}
                  onChange={(e) =>
                    onUpdateProfile({
                      name: me.name,
                      professionId: me.professionId,
                      dreamId: e.target.value,
                      color: me.color,
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {DREAMS.map((dr) => (
                    <option key={dr.id} value={dr.id}>
                      {dr.title} ({formatTenge(dr.cost)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onToggleReady(!me.isReady)}
                className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-sm font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-2 ${
                  me.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                }`}
              >
                <Check className="w-4 h-4" />
                {me.isReady ? 'Дайынмын ✓ (бас тарту)' : 'Дайынмын'}
              </button>
            </section>
          )}

          {/* Lobby Players List & Start Game */}
          <section className="lg:col-span-6 bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Ойыншылар ({lobbyPlayers.length}/6)
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Дайын: {readyCount}/{lobbyPlayers.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {lobbyPlayers.map((p) => {
                const prof =
                  PROFESSIONS.find((pr) => pr.id === p.professionId) || PROFESSIONS[0];
                const isSelf = p.sessionId === mySessionId;
                return (
                  <li
                    key={p.sessionId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isSelf
                        ? 'border-teal-600/60 bg-teal-50/40 dark:bg-teal-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.tokenSymbol}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              <Crown className="w-3 h-3" />
                              Хост
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                              (Сіз)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate">{prof.title}</span>
                          <span>·</span>
                          <span
                            className={`inline-flex items-center gap-1 ${
                              p.isConnected
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {p.isConnected ? (
                              <Wifi className="w-3 h-3" />
                            ) : (
                              <WifiOff className="w-3 h-3" />
                            )}
                            {p.isConnected ? 'Онлайн' : 'Офлайн'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          p.isReady
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {p.isReady ? 'Дайын' : 'Күтуде'}
                      </span>

                      {isHost && !p.isHost && (
                        <button
                          type="button"
                          onClick={() => onKickPlayer(p.sessionId)}
                          title="Бөлмеден шығару"
                          aria-label={`${p.name} ойыншысын шығару`}
                          className="w-9 h-9 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {isHost ? (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={onStartOnlineGame}
                  className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-base font-bold shadow-sm disabled:opacity-45 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Ойынды бастау
                </button>
                {!canStart && (
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Ойынды бастау үшін кемінде 2 ойыншы қосылып, «Дайынмын» батырмасын басуы керек.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Хост ойынды бастағанын күтуде...
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
