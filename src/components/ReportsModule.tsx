import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  DollarSign,
  PieChart,
  Wallet
} from 'lucide-react';
import { Sale, Expense, Product, BusinessProfile } from '../types';
import { formatFCFA, formatPercent, formatDateFR } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatDailyReportForWhatsApp, getWhatsAppShareUrl } from '../utils/whatsapp';

interface ReportsModuleProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  profile: BusinessProfile;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  expenses,
  products,
  profile,
}) => {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('all');

  // Filter based on period
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (period === 'all') {
      return { filteredSales: sales, filteredExpenses: expenses };
    }

    const isCurrentMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const isLastMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    };

    const filterFn = period === 'this_month' ? isCurrentMonth : isLastMonth;

    return {
      filteredSales: sales.filter(s => filterFn(s.date)),
      filteredExpenses: expenses.filter(e => filterFn(e.date)),
    };
  }, [sales, expenses, period]);

  // Deterministic financial figures
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [filteredSales]);

  const totalCostOfGoods = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
  }, [filteredSales]);

  const totalGrossMargin = totalRevenue - totalCostOfGoods;
  const grossMarginRate = totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0;

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const netOperatingIncome = totalGrossMargin - totalExpenses; // Bénéfice net d'exploitation
  const netCashFlow = totalRevenue - totalExpenses; // Flux de trésorerie net (entrées - sorties)

  // Expense breakdown
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [filteredExpenses]);

  // Payment breakdown
  const salesByPaymentMethod = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.totalAmount;
    });
    return map;
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Rapports & Résumé des Résultats</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compte de résultat synthétique, trésorerie et rentabilité en FCFA
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                period === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ce mois
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                period === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tout l'historique
            </button>
          </div>

          <a
            href={getWhatsAppShareUrl(
              formatDailyReportForWhatsApp(
                {
                  periodLabel: period === 'this_month' ? 'Ce mois' : 'Historique complet',
                  revenue: totalRevenue,
                  salesCount: filteredSales.length,
                  expenses: totalExpenses,
                  netProfit: netOperatingIncome,
                  grossMargin: totalGrossMargin,
                  payments: salesByPaymentMethod,
                  lowStockCount: products.filter(p => p.quantity <= p.lowStockThreshold).length,
                },
                profile
              )
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Partager ce bilan financier sur WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Partager bilan WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Imprimer le bilan financier"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* Main Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chiffre d'Affaires Brut
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono-num">
            {formatFCFA(totalRevenue)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredSales.length} transaction(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Marge Commerciale Brute
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono-num">
            {formatFCFA(totalGrossMargin)}
          </div>
          <span className="text-xs text-emerald-800 font-semibold mt-1 block">
            Taux de marge : {formatPercent(grossMarginRate)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Charges & Dépenses
          </span>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono-num">
            {formatFCFA(totalExpenses)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredExpenses.length} dépense(s)
          </span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${
          netOperatingIncome >= 0
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider">
            Bénéfice Net d'Exploitation
          </span>
          <div className={`text-2xl font-black mt-2 font-mono-num ${
            netOperatingIncome >= 0 ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {formatFCFA(netOperatingIncome)}
          </div>
          <span className="text-xs mt-1 block font-medium">
            {netOperatingIncome >= 0 ? 'Commerce en situation bénéficiaire' : 'Pertes sur la période'}
          </span>
        </div>
      </div>

      {/* Simplified Profit & Loss Statement (Compte de résultat) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Compte de Résultat Simplifié
            </h3>
            <p className="text-xs text-slate-500">
              {profile.name} • {profile.city}, Gabon
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
            Norme OHADA simplifié
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-sm">
          {/* Revenue */}
          <div className="py-2.5 flex justify-between items-center font-bold text-slate-900">
            <span>(+) Ventes de marchandises (Chiffre d'Affaires)</span>
            <span className="font-mono-num text-emerald-700 font-black text-base">
              {formatFCFA(totalRevenue)}
            </span>
          </div>

          {/* Cost of Goods Sold */}
          <div className="py-2.5 flex justify-between items-center text-slate-600 pl-4">
            <span>(-) Coût d'achat des marchandises vendues</span>
            <span className="font-mono-num text-slate-700 font-semibold">
              -{formatFCFA(totalCostOfGoods)}
            </span>
          </div>

          {/* Gross Margin Subtotal */}
          <div className="py-3 flex justify-between items-center font-extrabold bg-slate-50 px-3 rounded-lg text-slate-900">
            <span>(=) MARGE COMMERCIALE BRUTE</span>
            <span className="font-mono-num text-emerald-800 text-base">
              {formatFCFA(totalGrossMargin)}
            </span>
          </div>

          {/* Operating Expenses Breakdown */}
          <div className="py-3 space-y-1.5 pl-4 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block text-xs mb-1">
              (-) Charges externes et frais d'exploitation :
            </span>
            {Object.entries(expensesByCategory).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center pr-1">
                <span>• {cat.replace('_', ' ')}</span>
                <span className="font-mono-num text-rose-600">-{formatFCFA(amt)}</span>
              </div>
            ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <div className="text-slate-400 italic">Aucune charge d'exploitation enregistrée.</div>
            )}
          </div>

          {/* Total Expenses Subtotal */}
          <div className="py-2.5 flex justify-between items-center font-bold text-rose-700 pl-4">
            <span>Total Charges d'Exploitation</span>
            <span className="font-mono-num font-black">-{formatFCFA(totalExpenses)}</span>
          </div>

          {/* Final Net Result */}
          <div className={`py-4 flex justify-between items-center font-black text-base px-4 rounded-xl mt-2 ${
            netOperatingIncome >= 0
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            <span>(=) RÉSULTAT NET D'EXPLOITATION</span>
            <span className="font-mono-num text-xl">
              {formatFCFA(netOperatingIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Cash Flow Summary & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encaissé par moyen de paiement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
            Répartition des encaissements
          </h3>
          <div className="space-y-2.5 text-xs">
            {Object.entries(salesByPaymentMethod).map(([method, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
              return (
                <div key={method} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">{method}</span>
                    <span className="text-[11px] text-slate-500">{formatPercent(pct)} des ventes</span>
                  </div>
                  <span className="font-mono-num font-bold text-slate-900 text-sm">
                    {formatFCFA(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trésorerie nette */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Solde de Trésorerie Réel</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Flux d'argent liquide & mobile
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Différence directe entre tous les encaissements reçus et toutes les dépenses décaissées.
            </p>

            <div className="text-3xl font-black font-mono-num mt-4 text-slate-900">
              {formatFCFA(netCashFlow)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Ventes encaissées : {formatFCFA(totalRevenue)}</span>
            <span>Sorties de caisse : {formatFCFA(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
