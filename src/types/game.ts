export type GamePhase = 'rat_race' | 'fast_track';
export type ScreenMode = 'menu' | 'lobby' | 'playing' | 'victory';
export type ThemeMode = 'light' | 'dark';
export type OnlineRole = 'local' | 'online_host' | 'online_guest';

export interface TaxBreakdown {
  ipn: number;    // ИПН 10%
  opv: number;    // ОПВ 10%
  vosms: number;  // ВОСМС / ОСМС 2%
  other: number;  // Басқа / БЖТ / ЖК салығы
}

export interface LiabilityItem {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  canPayPartially?: boolean;
}

export interface Profession {
  id: string;
  title: string;
  category: string;
  description: string;
  grossSalary: number;
  taxBreakdown: TaxBreakdown;
  housingExpense: number;
  housingLabel: string;
  housingDebt: number;
  autoExpense: number;
  autoDebt: number;
  kaspiRedExpense: number;
  kaspiRedDebt: number;
  otherLoanExpense: number;
  otherLoanLabel: string;
  otherLoanDebt: number;
  livingExpense: number;
  childExpensePerChild: number;
  startingSavings: number;
}

export type DealSize = 'small' | 'big';

export type AssetCategory =
  | 'deposit'
  | 'bond'
  | 'livestock'
  | 'vending'
  | 'real_estate'
  | 'auto_rental'
  | 'business'
  | 'land'
  | 'stock'
  | 'fx'
  | 'crypto'
  | 'fast_track_business';

export interface DealCard {
  id: string;
  title: string;
  size: DealSize;
  category: AssetCategory;
  description: string;
  cost: number;           // Down payment or full price for non-stock; per-share price for stock/fx/crypto
  totalPrice?: number;    // Total property/business value if financed
  mortgage?: number;      // Associated debt if bought
  monthlyCashFlow: number; // Passive income per month (0 for stocks/land)
  isTradable?: boolean;   // True for stocks, FX, crypto
  ticker?: string;
  priceRange?: [number, number];
  tip: string;
}

export interface OwnedAsset {
  instanceId: string;
  dealId: string;
  title: string;
  category: AssetCategory;
  quantity: number;       // 1 for real estate/business, N shares/lots for tradables
  unitCost: number;
  downPaymentPaid: number;
  mortgage: number;
  monthlyCashFlow: number;
  ticker?: string;
}

export interface FastTrackDeal {
  id: string;
  title: string;
  description: string;
  cost: number;
  monthlyCashFlow: number;
  tip: string;
}

export interface DreamOption {
  id: string;
  title: string;
  description: string;
  cost: number;
}

export interface DoodadEvent {
  id: string;
  title: string;
  description: string;
  cost: number;
  canUseKaspiRed?: boolean; // Optional twist: pay cash or add Kaspi Red debt
  tip: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  targetCategories: AssetCategory[];
  targetTicker?: string;
  effectType: 'sell_offer' | 'cashflow_change' | 'stock_price' | 'macro_expense';
  priceMultiplier?: number;   // e.g. 1.35 means 35% higher sell price
  newPrice?: number;          // For stock/FX/crypto market price card
  cashFlowDeltaPercent?: number; // e.g. +20 or -15
  cashImpact?: number;        // One-time cash change for everyone or specific condition
  tip: string;
}

export type RatRaceSquareType =
  | 'payday'
  | 'opportunity'
  | 'market'
  | 'doodad'
  | 'charity'
  | 'child'
  | 'downsized';

export type FastTrackSquareType =
  | 'cashflow_day'
  | 'ft_business'
  | 'dream'
  | 'ft_charity'
  | 'audit'
  | 'tax_check';

export interface BoardSquare {
  index: number;
  type: RatRaceSquareType | FastTrackSquareType;
  label: string;
  shortLabel: string;
  dreamId?: string;
  ftDealId?: string;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  tokenSymbol: string;
  profession: Profession;
  dream: DreamOption;
  phase: GamePhase;
  position: number;
  cash: number;
  childrenCount: number;
  bankLoan: number;         // Emergency / bank loan taken during game (10% monthly interest)
  liabilities: LiabilityItem[];
  assets: OwnedAsset[];
  charityTurnsLeft: number; // Can roll 2 dice for next N turns
  missedTurns: number;      // From Downsized
  fastTrackBasePassive: number;
  fastTrackAddedPassive: number;
  fastTrackTargetPassive: number;
  boughtDream: boolean;
  sessionId?: string;
  isConnected?: boolean;
  botControlled?: boolean;
  stats: {
    turnsPlayed: number;
    dealsBought: number;
    doodadsPaid: number;
    loansTaken: number;
    charityGiven: number;
  };
}

export interface TurnLogEntry {
  id: string;
  playerName: string;
  playerColor: string;
  message: string;
  timestamp: number;
}

export interface PendingAutoLoan {
  loanAmount: number;
  monthlyPayment: number;
  reasonTitle: string;
  currentCashFlow: number;
  newCashFlow: number;
  kind:
    | { type: 'doodad'; cost: number; title: string }
    | { type: 'deal'; dealId: string; quantity: number; totalCost: number }
    | { type: 'downsized'; cost: number }
    | { type: 'payday_deficit'; deficit: number };
}

export interface ActiveModalState {
  type:
    | 'opportunity_choice'
    | 'deal_card'
    | 'market_event'
    | 'doodad'
    | 'charity'
    | 'child'
    | 'downsized'
    | 'payday'
    | 'phase_transition'
    | 'ft_business'
    | 'ft_dream'
    | 'ft_risk'
    | 'ft_charity'
    | 'auto_loan_warning';
  deal?: DealCard;
  marketEvent?: MarketEvent;
  doodad?: DoodadEvent;
  ftDeal?: FastTrackDeal;
  dream?: DreamOption;
  paydayAmount?: number;
  riskAmount?: number;
  riskTitle?: string;
  riskDescription?: string;
  tip?: string;
  autoLoan?: PendingAutoLoan;
}

export interface SavedGameState {
  screen: ScreenMode;
  players: Player[];
  currentPlayerIndex: number;
  turnCount: number;
  logs: TurnLogEntry[];
  winnerId: string | null;
  winReason: string | null;
  lastDice: number[];
}

export interface LobbyPlayer {
  sessionId: string;
  name: string;
  professionId: string;
  dreamId: string;
  color: string;
  tokenSymbol: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface ToastNotice {
  id: string;
  message: string;
  playerColor?: string;
}

export interface OnlineGameSnapshot {
  screen: 'lobby' | 'playing' | 'victory';
  roomCode: string;
  hostSessionId: string;
  lobbyPlayers: LobbyPlayer[];
  players: Player[];
  currentPlayerIndex: number;
  turnCount: number;
  logs: TurnLogEntry[];
  lastDice: number[];
  rolling: boolean;
  isStepping: boolean;
  modalQueue: ActiveModalState[];
  queueTotalCount: number;
  winnerId: string | null;
  winReason: string | null;
  toast: ToastNotice | null;
}

export type GuestAction =
  | {
      type: 'LOBBY_UPDATE_PROFILE';
      name: string;
      professionId: string;
      dreamId: string;
      color: string;
    }
  | { type: 'LOBBY_TOGGLE_READY'; isReady: boolean }
  | { type: 'ROLL_DICE'; useTwoDice?: boolean }
  | { type: 'CHOOSE_DEAL_SIZE'; size: 'small' | 'big' }
  | { type: 'BUY_DEAL'; quantity: number; useLoanIfNeeded: boolean }
  | { type: 'SKIP_DEAL' }
  | { type: 'APPLY_MARKET_EVENT'; sellAssetInstanceIds: string[] }
  | { type: 'PAY_DOODAD'; useKaspiRed: boolean }
  | { type: 'CHARITY_DECISION'; accept: boolean }
  | { type: 'ACK_CHILD' }
  | { type: 'ACK_DOWNSIZED' }
  | { type: 'ACK_PAYDAY' }
  | { type: 'ACK_PHASE_TRANSITION' }
  | { type: 'BUY_FT_BUSINESS' }
  | { type: 'BUY_DREAM' }
  | { type: 'ACK_FT_RISK' }
  | { type: 'CONFIRM_AUTO_LOAN' }
  | { type: 'TAKE_MANUAL_LOAN'; amount: number }
  | { type: 'REPAY_BANK_LOAN'; amount: number }
  | { type: 'PAY_LIABILITY'; liabilityId: string };

export type PeerMessage =
  | {
      type: 'HELLO';
      sessionId: string;
      name: string;
      professionId: string;
      dreamId: string;
      preferredColor?: string;
    }
  | { type: 'PING'; ts: number }
  | { type: 'PONG'; ts: number }
  | { type: 'ACTION'; sessionId: string; action: GuestAction }
  | { type: 'STATE_SYNC'; snapshot: OnlineGameSnapshot }
  | { type: 'ROOM_ERROR'; reason: string }
  | { type: 'KICKED'; reason: string }
  | { type: 'HOST_CLOSED' };

