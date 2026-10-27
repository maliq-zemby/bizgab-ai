import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Target,
  Percent,
  DollarSign,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import {
  formatFCFA,
  formatPercent,
  calculateProductMargin,
  calculateSellingPriceFromCostAndMargin,
  calculateBreakEven,
} from '../utils/formatters';

export const CalculatorModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'price_margin' | 'break_even' | 'discount'>('price_margin');

  // Tab 1: Price and Margin Calculator state
  const [costPrice, setCostPrice] = useState<number>(3500);
  const [transportCostPerUnit, setTransportCostPerUnit] = useState<number>(250);
  const [targetMarginRate, setTargetMarginRate] = useState<number>(25);

  // Tab 2: Break Even Point state
  const [rentCost, setRentCost] = useState<number>(45000);
  const [electricityCost, setElectricityCost] = useState<number>(20000);
  const [salariesCost, setSalariesCost] = useState<number>(35000);
  const [otherFixedCosts, setOtherFixedCosts] = useState<number>(15000);
  const [avgMarginPercent, setAvgMarginPercent] = useState<number>(22);
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(3000);

  // Tab 3: Discount & Pack Simulator state
  const [regularPrice, setRegularPrice] = useState<number>(4500);
  const [itemCost, setItemCost] = useState<number>(3500);
  const [discountPercent, setDiscountPercent] = useState<number>(10);

  // Calculations for Tab 1
  const totalUnitCost = (costPrice || 0) + (transportCostPerUnit || 0);
  const suggestedResult = calculateSellingPriceFromCostAndMargin(
    costPrice,
    targetMarginRate,
    transportCostPerUnit
  );
  const currentMargin = calculateProductMargin(totalUnitCost, suggestedResult.suggestedPrice);

  // Calculations for Tab 2
  const totalMonthlyFixedCosts = (rentCost || 0) + (electricityCost || 0) + (salariesCost || 0) + (otherFixedCosts || 0);
  const breakEvenResult = calculateBreakEven(
    totalMonthlyFixedCosts,
    avgMarginPercent,
    avgTicketPrice
  );

  // Calculations for Tab 3
  const discountedPrice = Math.round((regularPrice * (1 - discountPercent / 100)) / 25) * 25;
  const initialMargin = Math.max(0, regularPrice - itemCost);
  const discountedMargin = Math.max(0, discountedPrice - itemCost);
  const marginDropPercent = initialMargin > 0 ? ((initialMargin - discountedMargin) / initialMargin) * 100 : 0;
  // Volume compensation multiplier needed to make the exact same gross profit:
  const requiredVolumeMultiplier = discountedMargin > 0 ? initialMargin / discountedMargin : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-600" />
              <span>Calculateur Financier & Rentabilité</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Outils mathématiques déterministes en FCFA : fixation des prix, marges et seuil de rentabilité
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
            <button
              onClick={() => setActiveTab('price_margin')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'price_margin'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prix de Vente & Marge
            </button>
            <button
              onClick={() => setActiveTab('break_even')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'break_even'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seuil de Rentabilité
            </button>
            <button
              onClick={() => setActiveTab('discount')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'discount'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulateur Remises
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Prix de Vente & Marge Brute */}
      {activeTab === 'price_margin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Paramètres du produit</span>
              <span className="text-[11px] font-normal text-slate-400">Étape par étape</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                1. Prix d'achat unitaire fournisseur (FCFA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-num font-bold text-base focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  FCFA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Prix unitaire payé au grossiste (ex: Mont-Bouët ou Oloumi).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                2. Frais d'approche / transport par unité (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={transportCostPerUnit}
                  onChange={(e) => setTransportCostPerUnit(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-num font-bold text-base focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  FCFA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Course taxi clando, manutention, carburant ramené à chaque article.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600 font-medium">Coût de revient total par unité :</span>
              <span className="font-mono-num font-black text-slate-900 text-sm">
                {formatFCFA(totalUnitCost)}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  3. Taux de marge brute souhaité (%)
                </label>
                <span className="font-mono-num font-black text-emerald-700 text-sm">
                  {targetMarginRate}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={targetMarginRate}
                onChange={(e) => setTargetMarginRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>5% (très faible)</span>
                <span>25% (commerce courant)</span>
                <span>50%+ (forte marge)</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] text-slate-500 font-medium">Marges types :</span>
              {[15, 20, 25, 30, 40].map(rate => (
                <button
                  key={rate}
                  onClick={() => setTargetMarginRate(rate)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    targetMarginRate === rate
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Prix de Vente Recommandé
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono-num mt-2">
                {formatFCFA(suggestedResult.suggestedPrice)}
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Arrondi commercial de commodité (pour faciliter le rendu de monnaie en pièces).
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-emerald-700/60">
                <div>
                  <span className="text-xs text-emerald-300 block">Marge brute en FCFA</span>
                  <span className="text-xl font-bold font-mono-num text-white">
                    +{formatFCFA(suggestedResult.grossMargin)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-emerald-300 block">Taux de marque réel</span>
                  <span className="text-xl font-bold font-mono-num text-white">
                    {formatPercent(suggestedResult.finalMarkup)}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown table for different margins */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                Grille comparative pour ce produit
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                {[15, 20, 25, 30, 35, 45].map(rate => {
                  const comp = calculateSellingPriceFromCostAndMargin(costPrice, rate, transportCostPerUnit);
                  const isSelected = rate === targetMarginRate;
                  return (
                    <div
                      key={rate}
                      className={`py-2 px-2 rounded-lg flex items-center justify-between ${
                        isSelected ? 'bg-emerald-50 font-bold text-emerald-950' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        Marge visée : <strong>{rate}%</strong>
                      </span>
                      <span className="text-slate-500">Marge : +{formatFCFA(comp.grossMargin)}</span>
                      <span className="font-mono-num font-black text-slate-900">
                        {formatFCFA(comp.suggestedPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Seuil de rentabilité (Break-Even) */}
      {activeTab === 'break_even' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Fixed costs input */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Charges fixes mensuelles d'exploitation
            </h3>
            <p className="text-xs text-slate-500">
              Dépenses que vous devez payer chaque mois, même si vous ne vendez rien.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loyer magasin / échoppe (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={rentCost}
                  onChange={(e) => setRentCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Électricité SEEG & Frigo (FCFA / mois)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={electricityCost}
                  onChange={(e) => setElectricityCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Salaires ou aides de comptoir (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={salariesCost}
                  onChange={(e) => setSalariesCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Taxes municipales, téléphone, divers (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={otherFixedCosts}
                  onChange={(e) => setOtherFixedCosts(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Charges Fixes / mois :</span>
                <span className="font-mono-num font-black text-rose-600 text-base">
                  {formatFCFA(totalMonthlyFixedCosts)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Taux de marge moyen (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={avgMarginPercent}
                    onChange={(e) => setAvgMarginPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Panier moyen estimé (FCFA)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={avgTicketPrice}
                    onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-sm text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Target className="w-4 h-4" />
                <span>Objectif Point Mort (Zéro Perte)</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Chiffre d'Affaires Minimum à Réaliser
              </h3>
              <div className="text-3xl font-black text-emerald-800 font-mono-num mt-2">
                {formatFCFA(breakEvenResult.breakEvenRevenue)} / mois
              </div>
              <p className="text-xs text-slate-500 mt-1">
                C'est le montant exact des ventes nécessaire pour couvrir toutes vos charges fixes et ne pas être à perte. Au-delà, vous commencez à faire du bénéfice réel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Objectif par jour</span>
                  <span className="text-lg font-black text-slate-900 font-mono-num">
                    {formatFCFA(breakEvenResult.dailyRevenueNeeded)} / jour
                  </span>
                  <span className="text-[10px] text-slate-400">Sur base de 26 jours de vente</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Nombre de paniers à servir</span>
                  <span className="text-lg font-black text-slate-900 font-mono-num">
                    {breakEvenResult.breakEvenUnits} clients / mois
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ≈ {Math.ceil(breakEvenResult.breakEvenUnits / 26)} clients / jour
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Formule économique utilisée</span>
              </div>
              <p>
                Point Mort = Charges Fixes ÷ (Taux de Marge Brute en %)
              </p>
              <p className="text-blue-800 font-mono text-[11px]">
                {formatFCFA(totalMonthlyFixedCosts)} ÷ {avgMarginPercent}% = {formatFCFA(breakEvenResult.breakEvenRevenue)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Discount & Pack Simulator */}
      {activeTab === 'discount' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Simulateur de Remises Commerciales
            </h3>
            <p className="text-xs text-slate-500">
              Vérifiez si accorder une remise ou un prix de gros reste rentable pour vous.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Prix de vente habituel (FCFA)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={regularPrice}
                onChange={(e) => setRegularPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-num font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Coût d'achat de l'article (FCFA)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={itemCost}
                onChange={(e) => setItemCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-num font-bold text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-600">
                  Pourcentage de remise accordé
                </label>
                <span className="font-mono-num font-black text-rose-600 text-sm">
                  {discountPercent}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prix Après Remise
              </span>
              <div className="text-3xl font-black text-slate-900 font-mono-num mt-1">
                {formatFCFA(discountedPrice)}
              </div>
              <span className="text-xs text-rose-600 font-semibold">
                Baisse de {formatFCFA(regularPrice - discountedPrice)} par article
              </span>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Marge initiale habituelle :</span>
                  <span className="font-mono-num font-bold text-slate-800">
                    +{formatFCFA(initialMargin)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Marge restante après remise :</span>
                  <span className="font-mono-num font-bold text-emerald-700">
                    +{formatFCFA(discountedMargin)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600">
                  <span>Chute de votre gain unitaire :</span>
                  <span>-{formatPercent(marginDropPercent)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong className="block mb-1 font-bold">Règle de compensation :</strong>
                {requiredVolumeMultiplier > 1 ? (
                  <span>
                    Pour gagner la même somme d'argent qu'au prix normal, vous devez vendre{' '}
                    <strong>{requiredVolumeMultiplier.toFixed(1)} fois plus</strong> d'articles (soit une hausse des volumes de {formatPercent((requiredVolumeMultiplier - 1) * 100)}).
                  </span>
                ) : (
                  <span>La remise est trop forte, la marge est nulle ou négative !</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
