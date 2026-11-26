import React from 'react';
import {
  Baby,
  Briefcase,
  Coins,
  HeartHandshake,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserMinus,
} from 'lucide-react';
import { BoardSquare, Player } from '../types/game';
import { FAST_TRACK_BOARD, RAT_RACE_BOARD } from '../data/board';
import { DiceRoller } from './DiceRoller';
import { QoshqarMuiizCorner } from './KazakhOrnament';

interface GameBoardProps {
  players: Player[];
  currentPlayer: Player;
  dice: number[];
  rolling: boolean;
  canRoll: boolean;
  onRoll: (useTwoDice?: boolean) => void;
  lastActionText: string;
}

function getRatRaceGridPos(index: number): { row: number; col: number } {
  if (index <= 6) return { row: 1, col: index + 1 };
  if (index <= 11) return { row: index - 5, col: 7 };
  if (index <= 18) return { row: 7, col: 7 - (index - 12) };
  return { row: 7 - (index - 18), col: 1 };
}

function getFastTrackGridPos(index: number): { row: number; col: number } {
  if (index <= 5) return { row: 1, col: index + 1 };
  if (index <= 8) return { row: index - 4, col: 6 };
  if (index <= 14) return { row: 5, col: 6 - (index - 9) };
  return { row: 5 - (index - 14), col: 1 };
}

function getSquareVisual(type: BoardSquare['type']) {
  switch (type) {
    case 'payday':
    case 'cashflow_day':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/70',
        text: 'text-amber-900 dark:text-amber-200',
        icon: <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />,
      };
    case 'opportunity':
    case 'ft_business':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/70',
        text: 'text-emerald-900 dark:text-emerald-200',
        icon: <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />,
      };
    case 'market':
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/70',
        text: 'text-sky-900 dark:text-sky-200',
        icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />,
      };
    case 'doodad':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/70',
        text: 'text-rose-900 dark:text-rose-200',
        icon: <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />,
      };
    case 'charity':
    case 'ft_charity':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/70',
        text: 'text-teal-900 dark:text-teal-200',
        icon: <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" />,
      };
    case 'child':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700/70',
        text: 'text-indigo-900 dark:text-indigo-200',
        icon: <Baby className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />,
      };
    case 'downsized':
      return {
        bg: 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600',
        text: 'text-slate-900 dark:text-slate-200',
        icon: <UserMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />,
      };
    case 'dream':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600',
        text: 'text-amber-950 dark:text-amber-100',
        icon: <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-300" />,
      };
    default:
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/70',
        text: 'text-rose-900 dark:text-rose-200',
        icon: <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />,
      };
  }
}

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayer,
  dice,
  rolling,
  canRoll,
  onRoll,
  lastActionText,
}) => {
  const isFastTrack = currentPlayer.phase === 'fast_track';
  const squares = isFastTrack ? FAST_TRACK_BOARD : RAT_RACE_BOARD;
  const visiblePlayers = players.filter((p) => p.phase === currentPlayer.phase);

  return (
    <div className="relative bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-4 shadow-sm overflow-hidden">
      <QoshqarMuiizCorner className="hidden sm:block absolute top-2 left-2 w-7 h-7 text-amber-600/30 dark:text-amber-400/25 pointer-events-none" />
      <QoshqarMuiizCorner className="hidden sm:block absolute top-2 right-2 w-7 h-7 text-amber-600/30 dark:text-amber-400/25 rotate-90 pointer-events-none" />
      <QoshqarMuiizCorner className="hidden sm:block absolute bottom-2 right-2 w-7 h-7 text-amber-600/30 dark:text-amber-400/25 rotate-180 pointer-events-none" />
      <QoshqarMuiizCorner className="hidden sm:block absolute bottom-2 left-2 w-7 h-7 text-amber-600/30 dark:text-amber-400/25 -rotate-90 pointer-events-none" />

      <div
        className={`grid gap-1 sm:gap-1.5 ${
          isFastTrack
            ? 'grid-cols-6 grid-rows-5'
            : 'grid-cols-7 grid-rows-7'
        }`}
      >
        {squares.map((sq) => {
          const pos = isFastTrack
            ? getFastTrackGridPos(sq.index)
            : getRatRaceGridPos(sq.index);
          const visual = getSquareVisual(sq.type);
          const playersHere = visiblePlayers.filter((p) => p.position === sq.index);
          const isCurrentHere = currentPlayer.position === sq.index;
          const isPlayerDream = isFastTrack && sq.dreamId === currentPlayer.dream.id;

          return (
            <div
              key={sq.index}
              style={{
                gridRowStart: pos.row,
                gridColumnStart: pos.col,
              }}
              title={sq.label}
              className={`relative min-h-[50px] sm:min-h-[68px] md:min-h-[76px] rounded-lg border p-1 sm:p-1.5 flex flex-col items-center justify-between text-center transition-all duration-150 ${
                visual.bg
              } ${
                isCurrentHere
                  ? 'ring-2 ring-teal-600 dark:ring-teal-400 shadow-md z-10 scale-[1.02]'
                  : ''
              } ${
                isPlayerDream
                  ? 'ring-2 ring-amber-500 dark:ring-amber-400'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] sm:text-[10px] font-mono-num opacity-55 leading-none">
                  {sq.index + 1}
                </span>
                {visual.icon}
              </div>

              <span
                className={`text-[9px] sm:text-[11px] font-semibold leading-tight line-clamp-2 ${visual.text}`}
              >
                {isPlayerDream ? 'Менің арманым!' : sq.shortLabel}
              </span>

              <div className="flex flex-wrap items-center justify-center gap-0.5 min-h-[14px]">
                {playersHere.map((p) => (
                  <span
                    key={p.id}
                    title={`${p.name} (${p.profession.title})`}
                    className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm border border-white/80 transition-transform duration-200 ${
                      p.id === currentPlayer.id ? 'scale-110' : 'opacity-90'
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    {p.tokenSymbol}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        <div
          className={`${
            isFastTrack
              ? 'col-start-2 col-end-6 row-start-2 row-end-5'
              : 'col-start-2 col-end-7 row-start-2 row-end-7'
          } rounded-xl bg-slate-50/90 dark:bg-[#0D141C] border border-slate-200 dark:border-slate-800 p-2.5 sm:p-4 flex flex-col items-center justify-center text-center gap-2.5 sm:gap-3`}
        >
          <div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400">
              {isFastTrack ? '2-кезең · Еркін жол' : '1-кезең · Қарбалас шеңбер'}
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {currentPlayer.name} жүрісі
            </h3>
          </div>

          <DiceRoller
            dice={dice}
            rolling={rolling}
            canRoll={canRoll}
            diceCount={isFastTrack || currentPlayer.charityTurnsLeft > 0 ? 2 : 1}
            isBotTurn={currentPlayer.isBot}
            isFastTrack={isFastTrack}
            charityTurnsLeft={currentPlayer.charityTurnsLeft}
            onRoll={onRoll}
          />

          {lastActionText && (
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 max-w-xs line-clamp-2 leading-relaxed">
              {lastActionText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
