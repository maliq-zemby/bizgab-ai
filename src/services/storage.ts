import { Product, Sale, Expense, BusinessProfile } from '../types';
import { DEMO_PRODUCTS, DEMO_SALES, DEMO_EXPENSES, DEMO_PROFILE } from '../data/mockAgroData';

const STORAGE_KEYS = {
  PRODUCTS: 'bizgab_products_v1',
  SALES: 'bizgab_sales_v1',
  EXPENSES: 'bizgab_expenses_v1',
  PROFILE: 'bizgab_profile_v1',
  CHAT: 'bizgab_chat_history_v1',
};

export const StorageService = {
  getProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erreur lecture profil:', e);
    }
    return DEMO_PROFILE;
  },

  saveProfile(profile: BusinessProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Erreur sauvegarde profil:', e);
    }
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture produits:', e);
    }
    // Default to demo products on first launch
    return DEMO_PRODUCTS;
  },

  saveProducts(products: Product[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Erreur sauvegarde produits:', e);
    }
  },

  getSales(): Sale[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture ventes:', e);
    }
    return DEMO_SALES;
  },

  saveSales(sales: Sale[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error('Erreur sauvegarde ventes:', e);
    }
  },

  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture dépenses:', e);
    }
    return DEMO_EXPENSES;
  },

  saveExpenses(expenses: Expense[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Erreur sauvegarde dépenses:', e);
    }
  },

  resetToDemoData(): { products: Product[]; sales: Sale[]; expenses: Expense[]; profile: BusinessProfile } {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEMO_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(DEMO_SALES));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEMO_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
    return {
      products: DEMO_PRODUCTS,
      sales: DEMO_SALES,
      expenses: DEMO_EXPENSES,
      profile: DEMO_PROFILE,
    };
  },

  clearToBlankData(storeName: string = 'Mon Commerce Gabonais', city: string = 'Libreville'): {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    profile: BusinessProfile;
  } {
    const blankProfile: BusinessProfile = {
      name: storeName,
      ownerName: 'Gérant',
      city: city,
      neighborhood: 'Centre-Ville',
      phone: '+241 077 00 00 00',
      isDemo: false,
      currency: 'FCFA',
    };
    const emptyProducts: Product[] = [];
    const emptySales: Sale[] = [];
    const emptyExpenses: Expense[] = [];

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(emptyProducts));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(emptySales));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(emptyExpenses));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(blankProfile));

    return {
      products: emptyProducts,
      sales: emptySales,
      expenses: emptyExpenses,
      profile: blankProfile,
    };
  },

  exportBackupJSON(products: Product[], sales: Sale[], expenses: Expense[], profile: BusinessProfile) {
    const backup = {
      app: 'BIZGAB_AI',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      products,
      sales,
      expenses,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `bizgab_sauvegarde_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportSalesCSV(sales: Sale[]) {
    const headers = ['ID Vente', 'Date', 'Heure', 'Articles', 'Montant Total (FCFA)', 'Marge Brute (FCFA)', 'Mode Paiement', 'Client'];
    const rows = sales.map(s => {
      const d = new Date(s.date);
      const dateStr = d.toLocaleDateString('fr-FR');
      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const itemsSummary = s.items.map(i => `${i.quantity}x ${i.productName}`).join(' | ');
      return [
        `"${s.id}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        s.totalAmount,
        s.grossMargin,
        `"${s.paymentMethod}"`,
        `"${(s.customerName || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bizgab_ventes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  importBackupJSON(jsonString: string): {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    profile: BusinessProfile;
  } | null {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!data.products && !data.sales)) {
        throw new Error('Format de fichier invalide');
      }
      const products: Product[] = Array.isArray(data.products) ? data.products : [];
      const sales: Sale[] = Array.isArray(data.sales) ? data.sales : [];
      const expenses: Expense[] = Array.isArray(data.expenses) ? data.expenses : [];
      const profile: BusinessProfile = data.profile || DEMO_PROFILE;

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

      return { products, sales, expenses, profile };
    } catch (e) {
      console.error('Erreur import JSON:', e);
      return null;
    }
  },
};
