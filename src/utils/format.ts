import { Player } from '../types/game';

export function formatTenge(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const absStr = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${absStr} ₸`;
}

export function formatShortTenge(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1);
    return `${sign}${val} млн ₸`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `${sign}${val} мың ₸`;
  }
  return `${sign}${abs} ₸`;
}

export interface PlayerFinancialSummary {
  salary: number;
  passiveIncome: number;
  totalIncome: number;
  totalTaxes: number;
  liabilitiesMonthly: number;
  bankLoanInterest: number;
  livingExpense: number;
  housingExpense: number;
  childrenExpense: number;
  totalExpenses: number;
  monthlyCashFlow: number;
  totalDebt: number;
  totalAssetsCost: number;
  ratRaceProgressPercent: number;
  fastTrackProgressPercent: number;
}

export function calculatePlayerSummary(player: Player): PlayerFinancialSummary {
  const { profession } = player;
  const totalTaxes =
    profession.taxBreakdown.ipn +
    profession.taxBreakdown.opv +
    profession.taxBreakdown.vosms +
    profession.taxBreakdown.other;

  const assetsPassive = player.assets.reduce(
    (sum, a) =>
      sum +
      a.monthlyCashFlow *
        (a.category === 'stock' || a.category === 'fx' || a.category === 'crypto'
          ? 1
          : a.quantity),
    0
  );

  // Wait: OwnedAsset stores total monthlyCashFlow or unit? Let's keep monthlyCashFlow per unit and multiply by quantity if not tradable (or stocks have 0 anyway).
  const passiveIncome =
    player.phase === 'rat_race'
      ? assetsPassive
      : player.fastTrackBasePassive + player.fastTrackAddedPassive;

  const salary = player.phase === 'rat_race' ? profession.grossSalary : 0;
  const totalIncome = salary + passiveIncome;

  const liabilitiesMonthly = player.liabilities.reduce(
    (sum, l) => sum + l.monthlyPayment,
    0
  );
  const bankLoanInterest = Math.round(player.bankLoan * 0.1);
  const childrenExpense = player.childrenCount * profession.childExpensePerChild;
  const housingExpense =
    profession.housingDebt > 0 ? 0 : profession.housingExpense; // If mortgaged, mortgage payment is in liabilities!

  const totalExpenses =
    player.phase === 'rat_race'
      ? totalTaxes +
        housingExpense +
        profession.livingExpense +
        liabilitiesMonthly +
        bankLoanInterest +
        childrenExpense
      : 0;

  const monthlyCashFlow =
    player.phase === 'rat_race' ? totalIncome - totalExpenses : passiveIncome;

  const liabilitiesDebt = player.liabilities.reduce(
    (sum, l) => sum + l.balance,
    0
  );
  const assetsMortgage = player.assets.reduce((sum, a) => sum + a.mortgage, 0);
  const totalDebt = liabilitiesDebt + player.bankLoan + assetsMortgage;

  const totalAssetsCost = player.assets.reduce(
    (sum, a) => sum + a.unitCost * a.quantity,
    0
  );

  const ratRaceProgressPercent =
    totalExpenses > 0
      ? Math.min(100, Math.max(0, Math.round((passiveIncome / totalExpenses) * 100)))
      : 100;

  const fastTrackProgressPercent =
    player.fastTrackTargetPassive > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (player.fastTrackAddedPassive / player.fastTrackTargetPassive) * 100
            )
          )
        )
      : 0;

  return {
    salary,
    passiveIncome,
    totalIncome,
    totalTaxes,
    liabilitiesMonthly,
    bankLoanInterest,
    livingExpense: profession.livingExpense,
    housingExpense,
    childrenExpense,
    totalExpenses,
    monthlyCashFlow,
    totalDebt,
    totalAssetsCost,
    ratRaceProgressPercent,
    fastTrackProgressPercent,
  };
}
