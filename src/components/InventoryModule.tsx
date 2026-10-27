import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  X,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, BusinessProfile } from '../types';
import { formatFCFA, formatPercent, calculateProductMargin } from '../utils/formatters';
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatCatalogForWhatsApp, getWhatsAppShareUrl } from '../utils/whatsapp';

interface InventoryModuleProps {
  products: Product[];
  profile: BusinessProfile;
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onQuickRestock: (productId: string, addQty: number) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  profile,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onQuickRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Épicerie Générale');
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(5);
  const [formCostPrice, setFormCostPrice] = useState<number>(1000);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(1300);
  const [formUnit, setFormUnit] = useState('Unité');
  const [formBarcode, setFormBarcode] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchTerm));

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchLowStock = !onlyLowStock || p.quantity <= p.lowStockThreshold;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [products, searchTerm, selectedCategory, onlyLowStock]);

  // Total stock cost and retail valuation
  const totalStockCost = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);
  }, [products]);

  const totalStockRetail = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.quantity * p.sellingPrice), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.quantity <= p.lowStockThreshold).length;
  }, [products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Épicerie Générale');
    setFormQuantity(10);
    setFormLowStockThreshold(5);
    setFormCostPrice(1000);
    setFormSellingPrice(1300);
    setFormUnit('Unité');
    setFormBarcode('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category || 'Épicerie');
    setFormQuantity(prod.quantity);
    setFormLowStockThreshold(prod.lowStockThreshold);
    setFormCostPrice(prod.costPrice);
    setFormSellingPrice(prod.sellingPrice);
    setFormUnit(prod.unit);
    setFormBarcode(prod.barcode || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formName.trim(),
        category: formCategory.trim(),
        quantity: Math.max(0, Number(formQuantity) || 0),
        lowStockThreshold: Math.max(0, Number(formLowStockThreshold) || 0),
        costPrice: Math.max(0, Number(formCostPrice) || 0),
        sellingPrice: Math.max(0, Number(formSellingPrice) || 0),
        unit: formUnit.trim() || 'Unité',
        barcode: formBarcode.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddProduct({
        name: formName.trim(),
        category: formCategory.trim(),
        quantity: Math.max(0, Number(formQuantity) || 0),
        lowStockThreshold: Math.max(0, Number(formLowStockThreshold) || 0),
        costPrice: Math.max(0, Number(formCostPrice) || 0),
        sellingPrice: Math.max(0, Number(formSellingPrice) || 0),
        unit: formUnit.trim() || 'Unité',
        barcode: formBarcode.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" du stock ?`)) {
      onDeleteProduct(id);
    }
  };

  // Live margin preview for the form
  const formMargin = calculateProductMargin(formCostPrice, formSellingPrice);

  return (
    <div className="space-y-6">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Gestion des Stocks & Produits</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {products.length} référence(s)
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Suivi des quantités, alertes de réapprovisionnement et valorisation du stock en FCFA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <a
            href={getWhatsAppShareUrl(formatCatalogForWhatsApp(products, profile))}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Partager les tarifs des produits disponibles sur WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>Partager Tarifs WhatsApp</span>
          </a>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Produit</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valeur d'Achat du Stock
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono-num">
            {formatFCFA(totalStockCost)}
          </div>
          <span className="text-xs text-slate-400">Capital immobilisé</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valeur de Vente Potentielle
          </span>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono-num">
            {formatFCFA(totalStockRetail)}
          </div>
          <span className="text-xs text-slate-400">
            Marge brute latente : {formatFCFA(totalStockRetail - totalStockCost)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Articles en Alerte
          </span>
          <div className={`text-xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {lowStockCount} référence(s)
          </div>
          <span className="text-xs text-slate-400">Stock ≤ seuil de sécurité</span>
        </div>
      </div>

      {/* Search and filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit, code-barre..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick toggle for low stock only */}
          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                onlyLowStock
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Voir uniquement stocks bas ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toutes les catégories ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Aucun produit ne correspond à vos critères.</p>
            <p className="text-slate-400 text-xs mt-1">Modifiez vos filtres ou ajoutez une nouvelle référence.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Produit & Catégorie</th>
                  <th className="px-4 py-3.5">Stock Disponible</th>
                  <th className="px-4 py-3.5 text-right">Prix d'Achat</th>
                  <th className="px-4 py-3.5 text-right">Prix de Vente</th>
                  <th className="px-4 py-3.5 text-right">Marge Brute</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.quantity <= p.lowStockThreshold;
                  const isOut = p.quantity === 0;
                  const margin = calculateProductMargin(p.costPrice, p.sellingPrice);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Cat */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {p.category}
                          </span>
                          {p.barcode && (
                            <span className="text-[11px] text-slate-400 font-mono-num">
                              Code: {p.barcode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 font-mono-num">
                            {p.quantity}
                          </span>
                          <span className="text-xs text-slate-500">{p.unit}</span>
                        </div>
                        <div className="mt-1">
                          {isOut ? (
                            <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full inline-block">
                              Rupture de stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Stock bas (≤ {p.lowStockThreshold})
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Normal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-right font-mono-num text-slate-600">
                        {formatFCFA(p.costPrice)}
                      </td>

                      {/* Selling */}
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                        {formatFCFA(p.sellingPrice)}
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono-num font-bold text-emerald-700">
                          +{formatFCFA(margin.grossMarginAmount)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatPercent(margin.markupRate)} marque
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onQuickRestock(p.id, 5)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded border border-emerald-200 cursor-pointer"
                            title="Ajouter 5 unités au stock"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-lg text-slate-900">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Riz Parfumé Dina 5kg, Huile Mayor 1L..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="ex: Céréales, Boissons..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Unité de vente
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="ex: Sac 5kg, Bouteille 1L, Pièce..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Prix de revient / Achat (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    required
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Prix de vente unitaire (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono-num font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Instant Margin Preview Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Marge brute dégagée : {formatFCFA(formMargin.grossMarginAmount)}
                  </span>
                  <span className="text-emerald-700">
                    Taux de marge : {formatPercent(formMargin.marginRate)} • Taux de marque : {formatPercent(formMargin.markupRate)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Seuil d'alerte stock bas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formLowStockThreshold}
                    onChange={(e) => setFormLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Code-barre ou référence (Optionnel)
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  placeholder="ex: 600123456001"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono-num"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Mettre à jour' : 'Enregistrer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
