import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Product, Sale, Expense, BusinessProfile } from '../types';
import { formatFCFA, formatPercent, formatDateFR, formatDateTimeFR } from '../utils/formatters';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatDailyReportForWhatsApp, getWhatsAppShareUrl } from '../utils/whatsapp';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  profile: BusinessProfile;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct: () => void;
  setActiveTab: (tab: string) => void;
  onQuickRestock: (productId: string, addQty: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  sales,
  expenses,
  profile,
  onOpenNewSale,
  onOpenNewExpense,
  onOpenNewProduct,
  setActiveTab,
  onQuickRestock,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'today' | '7days' | 'month' | 'all'>('today');

  // Filter sales and expenses by period
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const isMatch = (dateStr: string) => {
      const time = new Date(dateStr).getTime();
      if (periodFilter === 'today') return time >= startOfToday;
      if (periodFilter === '7days') return time >= sevenDaysAgo;
      if (periodFilter === 'month') return time >= startOfMonth;
      return true;
    };

    return {
      filteredSales: sales.filter(s => isMatch(s.date)),
      filteredExpenses: expenses.filter(e => isMatch(e.date)),
    };
  }, [sales, expenses, periodFilter]);

  // Deterministic financial summaries
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [filteredSales]);

  const totalCostOfSales = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  }, [filteredSales]);

  const totalGrossMargin = useMemo(() => {
    return totalRevenue - totalCostOfSales;
  }, [totalRevenue, totalCostOfSales]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const estimatedNetProfit = totalGrossMargin - totalExpensesAmount;

  const averageTicket = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;
  const averageMarginRate = totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0;

  // Stock inventory KPIs
  const totalStockValueCost = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);
  }, [products]);

  const totalStockValueRetail = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.quantity * p.sellingPrice), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.quantity <= p.lowStockThreshold);
  }, [products]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const stats: Record<string, number> = { Especes: 0, AirtelMoney: 0, MoovMoney: 0, Autre: 0 };
    filteredSales.forEach(s => {
      const method = s.paymentMethod || 'Autre';
      stats[method] = (stats[method] || 0) + s.totalAmount;
    });
    return stats;
  }, [filteredSales]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    const countMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const key = item.productId || item.productName;
        if (!countMap[key]) {
          countMap[key] = { name: item.productName, qty: 0, revenue: 0 };
        }
        countMap[key].qty += item.quantity;
        countMap[key].revenue += item.total;
      });
    });
    return Object.values(countMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tableau de bord
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {profile.city}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Activité de <span className="font-semibold text-slate-700">{profile.name}</span> • Monnaie en FCFA
          </p>
        </div>

        {/* Period filters & WhatsApp share */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(
              [
                { key: 'today', label: "Aujourd'hui" },
                { key: '7days', label: '7 jours' },
                { key: 'month', label: 'Ce mois' },
                { key: 'all', label: 'Tout' },
              ] as const
            ).map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodFilter(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === p.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <a
            href={getWhatsAppShareUrl(
              formatDailyReportForWhatsApp(
                {
                  periodLabel:
                    periodFilter === 'today'
                      ? "Aujourd'hui"
                      : periodFilter === '7days'
                      ? '7 derniers jours'
                      : periodFilter === 'month'
                      ? 'Ce mois'
                      : 'Historique complet',
                  revenue: totalRevenue,
                  salesCount: filteredSales.length,
                  expenses: totalExpensesAmount,
                  netProfit: estimatedNetProfit,
                  grossMargin: totalGrossMargin,
                  payments: paymentBreakdown,
                  lowStockCount: lowStockProducts.length,
                },
                profile
              )
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Partager le bilan sur WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Partager point de caisse</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventes / CA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chiffre d'Affaires
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-num">
              {formatFCFA(totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-700">{filteredSales.length}</span> vente(s) enregistrée(s)
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Panier moyen</span>
            <span className="font-bold text-slate-700 font-mono-num">{formatFCFA(averageTicket)}</span>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dépenses Totales
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 font-mono-num">
              {formatFCFA(totalExpensesAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{filteredExpenses.length}</span> sortie(s) de caisse
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ratio dépenses/CA</span>
            <span className="font-bold text-slate-700">
              {totalRevenue > 0 ? formatPercent((totalExpensesAmount / totalRevenue) * 100) : '0%'}
            </span>
          </div>
        </div>

        {/* Bénéfice Net Estimé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bénéfice Net Estimé
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              estimatedNetProfit >= 0 ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono-num ${
              estimatedNetProfit >= 0 ? 'text-teal-700' : 'text-amber-700'
            }`}>
              {formatFCFA(estimatedNetProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Marge brute :</span>
              <span className="font-bold text-slate-700 font-mono-num">{formatFCFA(totalGrossMargin)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Taux de marge brute</span>
            <span className="font-bold text-emerald-700">{formatPercent(averageMarginRate)}</span>
          </div>
        </div>

        {/* Valeur du Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock Disponible
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-num">
              {formatFCFA(totalStockValueCost)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Valeur au prix d'achat</span> • <span className="font-bold text-slate-700">{products.length}</span> réf.
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Articles en alerte</span>
            <span className={`font-bold px-2 py-0.5 rounded-full ${
              lowStockProducts.length > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {lowStockProducts.length} article(s)
            </span>
          </div>
        </div>
      </div>

      {/* Low stock alerts section if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Alertes de stock bas ({lowStockProducts.length})
                </h3>
                <p className="text-xs text-slate-600">
                  Ces produits ont atteint ou dépassé leur seuil minimal de sécurité.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              Gérer l'inventaire <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(prod => (
              <div
                key={prod.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="truncate">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{prod.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Reste : {prod.quantity} {prod.unit}
                    </span>
                    <span>Seuil : {prod.lowStockThreshold}</span>
                  </div>
                </div>

                <button
                  onClick={() => onQuickRestock(prod.id, 10)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-2xs"
                  title="Ajouter 10 unités au stock"
                >
                  +10 {prod.unit.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Payment breakdown + Top selling + AI Quick Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Règlements encaissés</span>
            <span className="text-xs font-normal text-slate-500 lowercase">sur la période</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800">Espèces (Cash)</span>
                  <p className="text-[11px] text-slate-500">Caisse physique</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 font-mono-num">
                {formatFCFA(paymentBreakdown.Especes)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800">Airtel Money Gabon</span>
                  <p className="text-[11px] text-slate-500">Portefeuille mobile</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 font-mono-num">
                {formatFCFA(paymentBreakdown.AirtelMoney)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800">Moov Money Flooz</span>
                  <p className="text-[11px] text-slate-500">Paiement marchand</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 font-mono-num">
                {formatFCFA(paymentBreakdown.MoovMoney)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Articles phares</span>
            <span className="text-xs font-normal text-slate-500 lowercase">volume vendu</span>
          </h3>

          {topSellingProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center italic">
              Aucune vente enregistrée sur cette période.
            </p>
          ) : (
            <div className="space-y-2.5">
              {topSellingProducts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900 truncate block">{item.name}</span>
                    <span className="text-[11px] text-slate-500">{item.qty} unités vendues</span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0 font-mono-num">
                    {formatFCFA(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assistant IA banner & Quick Action */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 rounded-2xl text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Assistant IA BIZGAB</span>
            </div>
            <h3 className="text-lg font-black leading-snug">
              Conseils personnalisés pour votre commerce
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Posez des questions sur le calcul des prix, la rotation des stocks, la fidélisation des clients ou la négociation avec les grossistes d'Oloumi et de Mont-Bouët.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/60">
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Ouvrir l'assistant conversationnel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Dernières écritures</h3>
            <p className="text-xs text-slate-500">Historique récent des ventes et dépenses</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewSale}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 cursor-pointer"
            >
              + Vente
            </button>
            <button
              onClick={onOpenNewExpense}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-200 cursor-pointer"
            >
              + Dépense
            </button>
          </div>
        </div>

        {filteredSales.length === 0 && filteredExpenses.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs italic">
            Aucune écriture pour la période sélectionnée.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Merge recent sales and expenses */}
            {[
              ...filteredSales.slice(0, 5).map(s => ({
                id: s.id,
                type: 'sale' as const,
                title: s.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
                subtitle: `${s.paymentMethod} • ${s.customerName || 'Client anonyme'}`,
                date: s.date,
                amount: s.totalAmount,
                margin: s.grossMargin,
              })),
              ...filteredExpenses.slice(0, 5).map(e => ({
                id: e.id,
                type: 'expense' as const,
                title: e.title,
                subtitle: `${e.category} • ${e.paymentMethod}`,
                date: e.date,
                amount: e.amount,
                margin: null,
              })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 6)
              .map(entry => (
                <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        entry.type === 'sale'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {entry.type === 'sale' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {entry.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.subtitle} • {formatDateTimeFR(entry.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-black text-sm font-mono-num ${
                        entry.type === 'sale' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {entry.type === 'sale' ? '+' : '-'} {formatFCFA(entry.amount)}
                    </div>
                    {entry.margin !== null && (
                      <p className="text-[11px] text-slate-400">
                        Marge : +{formatFCFA(entry.margin)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
