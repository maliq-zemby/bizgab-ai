import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  User,
  ArrowUpRight,
  Trash2,
  Receipt,
  CheckCircle,
  FileText,
  X
} from 'lucide-react';
import { Sale, Product, PaymentMethod, SaleItem, BusinessProfile } from '../types';
import { formatFCFA, formatDateFR, formatDateTimeFR, formatPercent } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatSaleReceiptForWhatsApp, getWhatsAppShareUrl } from '../utils/whatsapp';

interface SalesModuleProps {
  sales: Sale[];
  products: Product[];
  profile: BusinessProfile;
  onRecordSale: (newSale: Omit<Sale, 'id'>) => void;
  isNewSaleModalOpen: boolean;
  setIsNewSaleModalOpen: (open: boolean) => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  sales,
  products,
  profile,
  onRecordSale,
  isNewSaleModalOpen,
  setIsNewSaleModalOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [customerWhatsAppPhone, setCustomerWhatsAppPhone] = useState('');

  // New Sale Form State
  const [cartItems, setCartItems] = useState<SaleItem[]>([
    {
      productName: '',
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      total: 0,
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Especes');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch =
        s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
      return matchSearch && matchPayment;
    });
  }, [sales, searchTerm, paymentFilter]);

  // Aggregate stats
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [filteredSales]);

  const totalGrossMargin = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.grossMargin, 0);
  }, [filteredSales]);

  const averageTicket = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;

  // Handle Cart item changes
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProd = products.find(p => p.id === productId);
    if (!selectedProd) return;

    setCartItems(prev => {
      const next = [...prev];
      next[index] = {
        productId: selectedProd.id,
        productName: selectedProd.name,
        quantity: next[index].quantity || 1,
        unitPrice: selectedProd.sellingPrice,
        costPrice: selectedProd.costPrice,
        total: (next[index].quantity || 1) * selectedProd.sellingPrice,
      };
      return next;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setCartItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: safeQty,
        total: safeQty * next[index].unitPrice,
      };
      return next;
    });
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const safePrice = Math.max(0, price);
    setCartItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        unitPrice: safePrice,
        total: next[index].quantity * safePrice,
      };
      return next;
    });
  };

  const handleCustomNameChange = (index: number, name: string) => {
    setCartItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productName: name,
      };
      return next;
    });
  };

  const handleAddCartRow = () => {
    setCartItems(prev => [
      ...prev,
      {
        productName: '',
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveCartRow = (index: number) => {
    if (cartItems.length === 1) return;
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Cart total calculations
  const cartTotalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [cartItems]);

  const cartTotalCost = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  }, [cartItems]);

  const cartGrossMargin = cartTotalAmount - cartTotalCost;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = cartItems.filter(i => i.productName.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Veuillez ajouter au moins un article valide à la vente.');
      return;
    }

    onRecordSale({
      date: new Date(saleDate).toISOString(),
      items: validItems,
      totalAmount: cartTotalAmount,
      totalCost: cartTotalCost,
      grossMargin: cartGrossMargin,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setCartItems([
      {
        productName: '',
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        total: 0,
      },
    ]);
    setCustomerName('');
    setNotes('');
    setPaymentMethod('Especes');
    setIsNewSaleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & New Sale Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Registre des Ventes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              {filteredSales.length} vente(s)
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historique détaillé des encaissements, modes de paiement et marges réalisées
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => StorageService.exportSalesCSV(sales)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Exporter en CSV Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsNewSaleModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer une Vente</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Chiffre d'Affaires
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono-num">
            {formatFCFA(totalRevenue)}
          </div>
          <span className="text-xs text-slate-400">Total encaissé</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Marge Brute Réalisée
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono-num">
            {formatFCFA(totalGrossMargin)}
          </div>
          <span className="text-xs text-slate-400">
            Taux moyen : {totalRevenue > 0 ? formatPercent((totalGrossMargin / totalRevenue) * 100) : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Panier Moyen Client
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono-num">
            {formatFCFA(averageTicket)}
          </div>
          <span className="text-xs text-slate-400">Moyenne par passage en caisse</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par article, client..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Payment filter pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'Tous paiements' },
            { id: 'Especes', label: 'Espèces' },
            { id: 'AirtelMoney', label: 'Airtel Money' },
            { id: 'MoovMoney', label: 'Moov Money' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPaymentFilter(p.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                paymentFilter === p.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Aucune vente enregistrée.</p>
            <p className="text-slate-400 text-xs mt-1">Cliquez sur "Enregistrer une Vente" pour débuter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Date & Heure</th>
                  <th className="px-4 py-3.5">Articles Vendus</th>
                  <th className="px-4 py-3.5">Mode de Paiement</th>
                  <th className="px-4 py-3.5">Client / Note</th>
                  <th className="px-4 py-3.5 text-right">Montant Total</th>
                  <th className="px-4 py-3.5 text-right">Marge Brute</th>
                  <th className="px-4 py-3.5 text-center">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="font-bold text-slate-900">{formatDateFR(sale.date)}</div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="space-y-0.5">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-800 flex items-center justify-between gap-2">
                            <span className="truncate">
                              <strong className="text-emerald-800">{item.quantity}x</strong> {item.productName}
                            </span>
                            <span className="text-slate-500 font-mono-num text-[11px] shrink-0">
                              {formatFCFA(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          sale.paymentMethod === 'AirtelMoney'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : sale.paymentMethod === 'MoovMoney'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {sale.paymentMethod === 'AirtelMoney'
                          ? 'Airtel Money'
                          : sale.paymentMethod === 'MoovMoney'
                          ? 'Moov Money'
                          : 'Espèces'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="font-medium text-slate-900">
                        {sale.customerName || <span className="text-slate-400 italic">Client au comptoir</span>}
                      </div>
                      {sale.notes && (
                        <div className="text-slate-500 text-[11px] truncate max-w-[180px]">{sale.notes}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-black font-mono-num text-slate-900 text-sm">
                      {formatFCFA(sale.totalAmount)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-bold font-mono-num text-emerald-700 text-xs">
                        +{formatFCFA(sale.grossMargin)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedSaleForReceipt(sale);
                            setCustomerWhatsAppPhone('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Voir le reçu / ticket de caisse"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <a
                          href={getWhatsAppShareUrl(formatSaleReceiptForWhatsApp(sale, profile))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Partager le ticket sur WhatsApp"
                        >
                          <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <span>Enregistrer une Nouvelle Vente</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Déduction automatique des stocks & calcul de marge instantané
                </p>
              </div>
              <button
                onClick={() => setIsNewSaleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-4">
              {/* Date and Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Date & Heure
                  </label>
                  <input
                    type="datetime-local"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nom du client (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ex: M. Obame, Mme Mengue..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Articles vendus ({cartItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCartRow}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter un autre article
                  </button>
                </div>

                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Article #{idx + 1}
                      </span>
                      {cartItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCartRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Product Selector from stock */}
                      <div className="sm:col-span-6">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                        >
                          <option value="">-- Choisir dans le catalogue stock --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.quantity} {p.unit}) - {formatFCFA(p.sellingPrice)}
                            </option>
                          ))}
                        </select>

                        {/* Custom Name input if not selected or wanted */}
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleCustomNameChange(idx, e.target.value)}
                          placeholder="Ou saisir le nom manuellement..."
                          className="w-full mt-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono-num font-bold text-center"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Prix Unitaire (FCFA)</label>
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono-num font-bold text-right text-emerald-800"
                          required
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="sm:col-span-2 text-right flex flex-col justify-end">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Sous-total</label>
                        <div className="font-mono-num font-black text-xs text-slate-900 py-1.5">
                          {formatFCFA(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mode de Règlement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Especes')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'Especes'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    💵 Espèces (Cash)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('AirtelMoney')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'AirtelMoney'
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔴 Airtel Money
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MoovMoney')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'MoovMoney'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔵 Moov Money
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Note ou référence (Optionnel)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ex: Numéro transaction Airtel Money ou précision..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Sale Totals Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold block">Total à Encaisser</span>
                  <span className="text-2xl font-black text-emerald-950 font-mono-num">
                    {formatFCFA(cartTotalAmount)}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-emerald-700 block">
                    Marge brute estimée : <strong>+{formatFCFA(cartGrossMargin)}</strong>
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    Coût marchandises : {formatFCFA(cartTotalCost)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSaleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={cartTotalAmount <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider et Encaisser</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedSaleForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-300">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket de caisse</span>
              <button
                onClick={() => setSelectedSaleForReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-center">
              <h3 className="font-black text-lg text-slate-900">{profile.name}</h3>
              <p className="text-xs text-slate-500">{profile.neighborhood}, {profile.city}</p>
              <p className="text-xs text-slate-500">{profile.phone}</p>
              <div className="my-2 border-b border-dashed border-slate-200" />
              <p className="text-[11px] text-slate-400">
                {formatDateTimeFR(selectedSaleForReceipt.date)} • Ref #{selectedSaleForReceipt.id.slice(-6)}
              </p>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 py-2">
              {selectedSaleForReceipt.items.map((item, i) => (
                <div key={i} className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">{item.quantity}x {item.productName}</span>
                    <span className="block text-[10px] text-slate-400">à {formatFCFA(item.unitPrice)}</span>
                  </div>
                  <span className="font-mono-num font-bold text-slate-900">{formatFCFA(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
              <span>TOTAL</span>
              <span className="font-mono-num text-base text-emerald-700">
                {formatFCFA(selectedSaleForReceipt.totalAmount)}
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-500 flex justify-between">
              <span>Mode de paiement</span>
              <span className="font-semibold text-slate-700">{selectedSaleForReceipt.paymentMethod}</span>
            </div>

            {selectedSaleForReceipt.customerName && (
              <div className="mt-1 text-xs text-slate-500 flex justify-between">
                <span>Client</span>
                <span className="font-semibold text-slate-700">{selectedSaleForReceipt.customerName}</span>
              </div>
            )}

            <div className="mt-6 text-center text-[10px] text-slate-400 italic">
              Merci de votre visite et à bientôt !<br />
              BIZGAB AI - République Gabonaise
            </div>

            {/* WhatsApp Share Box */}
            <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-emerald-950">
                📲 Envoyer le reçu sur WhatsApp
              </label>
              <input
                type="tel"
                value={customerWhatsAppPhone}
                onChange={(e) => setCustomerWhatsAppPhone(e.target.value)}
                placeholder="Numéro du client (ex: 077 12 34 56)..."
                className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono-num placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <a
                href={getWhatsAppShareUrl(
                  formatSaleReceiptForWhatsApp(selectedSaleForReceipt, profile),
                  customerWhatsAppPhone
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Ouvrir dans WhatsApp</span>
              </a>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  const txt = formatSaleReceiptForWhatsApp(selectedSaleForReceipt, profile);
                  navigator.clipboard.writeText(txt);
                  alert('Texte du ticket copié dans le presse-papier !');
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Copier le texte
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
