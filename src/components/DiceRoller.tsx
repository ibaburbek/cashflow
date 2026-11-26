import React from 'react';
import { Dices } from 'lucide-react';

interface DiceFaceProps {
  value: number;
  rolling: boolean;
}

const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DiceFace: React.FC<DiceFaceProps> = ({ value, rolling }) => {
  const pips = PIP_POSITIONS[value] || PIP_POSITIONS[1];
  return (
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-md grid grid-cols-3 grid-rows-3 p-2 gap-1 transition-transform ${
        rolling ? 'animate-dice' : ''
      }`}
      aria-label={`Сүйек: ${value}`}
    >
      {Array.from({ length: 9 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-center">
          {pips.includes(idx) && (
            <span
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                value === 1
                  ? 'bg-amber-600 dark:bg-amber-400'
                  : 'bg-slate-900 dark:bg-slate-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

interface DiceRollerProps {
  dice: number[];
  rolling: boolean;
  canRoll: boolean;
  diceCount: 1 | 2;
  isBotTurn: boolean;
  isFastTrack: boolean;
  charityTurnsLeft: number;
  onRoll: (useTwoDice?: boolean) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  dice,
  rolling,
  canRoll,
  diceCount,
  isBotTurn,
  isFastTrack,
  charityTurnsLeft,
  onRoll,
}) => {
  const total = dice.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex items-center justify-center gap-2.5">
        {dice.map((val, i) => (
          <DiceFace key={i} value={val} rolling={rolling} />
        ))}
      </div>

      {!rolling && total > 0 && (
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
          Түскен сан: <span className="font-bold text-slate-900 dark:text-white">{total}</span>
        </div>
      )}

      {isBotTurn ? (
        <div className="px-4 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg whitespace-nowrap">
          Бот жүріс жасауда...
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {charityTurnsLeft > 0 && !isFastTrack ? (
            <>
              <button
                type="button"
                disabled={!canRoll || rolling}
                onClick={() => onRoll(false)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-45 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                1 сүйек
              </button>
              <button
                type="button"
                disabled={!canRoll || rolling}
                onClick={() => onRoll(true)}
                className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-sm disabled:opacity-45 cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Dices className="w-4 h-4" />
                2 сүйек лақтыру ({charityTurnsLeft})
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={!canRoll || rolling}
              onClick={() => onRoll(diceCount === 2)}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-sm disabled:opacity-45 cursor-pointer transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Dices className="w-4 h-4" />
              {rolling
                ? 'Лақтырылуда...'
                : isFastTrack
                ? '2 сүйек лақтыру'
                : 'Сүйек лақтыру'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
