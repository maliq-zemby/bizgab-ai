import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  TrendingDown,
  Trash2,
  Calendar,
  X,
  Zap,
  Truck,
  Building,
  Users,
  Package,
  Layers
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { formatFCFA, formatDateFR, formatDateTimeFR, formatPercent } from '../utils/formatters';

interface ExpensesModuleProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  isNewExpenseModalOpen: boolean;
  setIsNewExpenseModalOpen: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; icon: string }> = {
  Approvisionnement: { label: 'Approvisionnement & Marchandises', icon: '📦' },
  Loyer: { label: 'Loyer Magasin / Échoppe', icon: '🏪' },
  Electricite_SEEG: { label: 'Électricité SEEG (Edan/Frigo)', icon: '⚡' },
  Transport: { label: 'Transport / Taxi / Fret marchandises', icon: '🚚' },
  Salaires: { label: 'Salaires & Aides de vente', icon: '👥' },
  Emballages: { label: 'Sachets & Emballages clients', icon: '🛍️' },
  Taxes: { label: 'Taxes communales & Patentes', icon: '🏛️' },
  Autre: { label: 'Autres charges diverses', icon: '📋' },
};

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  isNewExpenseModalOpen,
  setIsNewExpenseModalOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Approvisionnement');
  const [formAmount, setFormAmount] = useState<number>(5000);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Especes');
  const [formDate, setFormDate] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [formNotes, setFormNotes] = useState('');

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Aggregate metrics
  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // Breakdown by category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formAmount <= 0) return;

    onAddExpense({
      date: new Date(formDate).toISOString(),
      title: formTitle.trim(),
      category: formCategory,
      amount: Math.max(0, Number(formAmount) || 0),
      paymentMethod: formPaymentMethod,
      notes: formNotes.trim() || undefined,
    });

    setFormTitle('');
    setFormAmount(5000);
    setFormNotes('');
    setIsNewExpenseModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Supprimer la dépense "${title}" ?`)) {
      onDeleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Registre des Dépenses</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300">
              {filteredExpenses.length} dépense(s)
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Suivi des charges d'exploitation, factures SEEG, loyer et approvisionnements
          </p>
        </div>

        <button
          onClick={() => setIsNewExpenseModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Dépense</span>
        </button>
      </div>

      {/* KPI & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Expense Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Dépenses Enregistrées
            </span>
            <div className="text-2xl font-black text-rose-600 mt-2 font-mono-num">
              {formatFCFA(totalExpensesAmount)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sur {filteredExpenses.length} opération(s)
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Catégorie principale :{' '}
            <strong className="text-slate-800">
              {Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0]
                ? CATEGORY_LABELS[Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0][0] as ExpenseCategory]?.label
                : 'Aucune'}
            </strong>
          </div>
        </div>

        {/* Quick Category Summary Tiles */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              'Approvisionnement',
              'Electricite_SEEG',
              'Loyer',
              'Transport',
            ] as ExpenseCategory[]
          ).map(cat => {
            const amount = categoryStats[cat] || 0;
            const pct = totalExpensesAmount > 0 ? (amount / totalExpensesAmount) * 100 : 0;
            return (
              <div
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="text-base mb-1">{CATEGORY_LABELS[cat].icon}</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {cat === 'Electricite_SEEG' ? 'SEEG Électricité' : cat}
                </div>
                <div className="text-sm font-black text-slate-900 mt-1 font-mono-num">
                  {formatFCFA(amount)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatPercent(pct)} du total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une dépense..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toutes ({expenses.length})
          </button>
          {Object.keys(CATEGORY_LABELS).map(catKey => (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                categoryFilter === catKey
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_LABELS[catKey as ExpenseCategory].icon} {catKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Aucune dépense enregistrée.</p>
            <p className="text-slate-400 text-xs mt-1">Vos sorties d'argent apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Intitulé de la dépense</th>
                  <th className="px-4 py-3.5">Catégorie</th>
                  <th className="px-4 py-3.5">Mode Paiement</th>
                  <th className="px-4 py-3.5 text-right">Montant (FCFA)</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="font-bold text-slate-900">{formatDateFR(exp.date)}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(exp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-xs text-slate-500 mt-0.5">{exp.notes}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <span>{CATEGORY_LABELS[exp.category]?.icon || '📋'}</span>
                        <span>{CATEGORY_LABELS[exp.category]?.label || exp.category}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {exp.paymentMethod === 'AirtelMoney'
                        ? 'Airtel Money'
                        : exp.paymentMethod === 'MoovMoney'
                        ? 'Moov Money'
                        : 'Espèces'}
                    </td>

                    <td className="px-4 py-3 text-right font-black font-mono-num text-rose-600 text-sm">
                      -{formatFCFA(exp.amount)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(exp.id, exp.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Supprimer cette dépense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <span>Ajouter une Dépense</span>
              </h3>
              <button
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Motif / Intitulé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ex: Recharge Edan SEEG, Taxi marchandises Mont-Bouët..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Catégorie de charge *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono-num font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Date & Heure
                  </label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Règlement par
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('Especes')}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                      formPaymentMethod === 'Especes'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Espèces
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('AirtelMoney')}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                      formPaymentMethod === 'AirtelMoney'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Airtel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('MoovMoney')}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                      formPaymentMethod === 'MoovMoney'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Moov Money
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes ou reçu (Optionnel)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ex: Numéro reçu, fournisseur concerné..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Enregistrer la Dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
