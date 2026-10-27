/**
 * Formatters and deterministic financial calculations for BIZGAB AI (Gabon)
 */

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(rounded);
  return `${formatted} FCFA`;
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return '0%';
  }
  return `${rate.toFixed(1)}%`;
}

export function formatDateFR(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTimeFR(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateShortFR(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Calculs déterministes de marge et rentabilité
 */
export interface MarginCalculation {
  costPrice: number;
  sellingPrice: number;
  grossMarginAmount: number; // Prix de vente - Prix de revient
  marginRate: number; // Marge / Coût d'achat (%) (Taux de marge brute)
  markupRate: number; // Marge / Prix de vente (%) (Taux de marque)
  multiplierCoefficient: number; // Prix de vente / Coût d'achat
}

export function calculateProductMargin(costPrice: number, sellingPrice: number): MarginCalculation {
  const safeCost = Math.max(0, costPrice || 0);
  const safeSelling = Math.max(0, sellingPrice || 0);
  const marginAmount = safeSelling - safeCost;

  const marginRate = safeCost > 0 ? (marginAmount / safeCost) * 100 : 0;
  const markupRate = safeSelling > 0 ? (marginAmount / safeSelling) * 100 : 0;
  const multiplierCoefficient = safeCost > 0 ? safeSelling / safeCost : 1;

  return {
    costPrice: safeCost,
    sellingPrice: safeSelling,
    grossMarginAmount: marginAmount,
    marginRate,
    markupRate,
    multiplierCoefficient,
  };
}

export function calculateSellingPriceFromCostAndMargin(
  costPrice: number,
  targetMarginRatePercent: number,
  additionalCostPerUnit: number = 0
): { suggestedPrice: number; grossMargin: number; finalMarkup: number } {
  const totalUnitCost = Math.max(0, costPrice) + Math.max(0, additionalCostPerUnit);
  const marginMultiplier = 1 + (targetMarginRatePercent / 100);
  const rawPrice = totalUnitCost * marginMultiplier;
  
  // En commerce au Gabon, arrondir généralement aux 25 ou 50 FCFA les plus proches
  const roundedPrice = Math.round(rawPrice / 25) * 25;
  const grossMargin = roundedPrice - totalUnitCost;
  const finalMarkup = roundedPrice > 0 ? (grossMargin / roundedPrice) * 100 : 0;

  return {
    suggestedPrice: roundedPrice,
    grossMargin,
    finalMarkup,
  };
}

export function calculateBreakEven(
  monthlyFixedCosts: number, // Loyer, SEEG, salaires, taxes
  averageMarginOnVariableCostRate: number, // en % (ex: 25%)
  averageTicketSalePrice: number = 0 // Prix moyen d'une vente ou d'un article
): {
  breakEvenRevenue: number; // Chiffre d'affaires minimum pour être rentable (Point Mort en FCFA)
  dailyRevenueNeeded: number; // CA par jour nécessaire (sur base 26 jours ouvrés)
  breakEvenUnits: number; // Nombre d'unités ou de clients à servir
} {
  const safeFixedCosts = Math.max(0, monthlyFixedCosts || 0);
  const safeMarginRate = Math.max(0.1, averageMarginOnVariableCostRate || 1); // éviter division par zéro

  const breakEvenRevenue = Math.round(safeFixedCosts / (safeMarginRate / 100));
  const dailyRevenueNeeded = Math.round(breakEvenRevenue / 26);
  const breakEvenUnits = averageTicketSalePrice > 0
    ? Math.ceil(breakEvenRevenue / averageTicketSalePrice)
    : 0;

  return {
    breakEvenRevenue,
    dailyRevenueNeeded,
    breakEvenUnits,
  };
}
