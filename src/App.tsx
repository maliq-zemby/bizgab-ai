/**
 * BIZGAB AI - Application de gestion commerciale et assistant IA pour le Gabon
 * Développée pour les commerçants, demi-grossistes et PME gabonaises
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AIAssistant } from './components/AIAssistant';
import { InventoryModule } from './components/InventoryModule';
import { SalesModule } from './components/SalesModule';
import { ExpensesModule } from './components/ExpensesModule';
import { CalculatorModule } from './components/CalculatorModule';
import { ReportsModule } from './components/ReportsModule';
import { CommunityModule } from './components/CommunityModule';
import { SettingsModal } from './components/SettingsModal';

import { Product, Sale, Expense, BusinessProfile } from './types';
import { StorageService } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Application State
  const [profile, setProfile] = useState<BusinessProfile>(() => StorageService.getProfile());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());

  // Modals state
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync state changes with StorageService
  useEffect(() => {
    StorageService.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.saveSales(sales);
  }, [sales]);

  useEffect(() => {
    StorageService.saveExpenses(expenses);
  }, [expenses]);

  // Product Operations
  const handleAddProduct = (newProd: Omit<Product, 'id' | 'updatedAt'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [product, ...prev]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleQuickRestock = (productId: string, addQty: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            quantity: p.quantity + addQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // Sales Operations (With automatic inventory stock deduction)
  const handleRecordSale = (newSale: Omit<Sale, 'id'>) => {
    const saleId = `sale-${Date.now()}`;
    const sale: Sale = {
      ...newSale,
      id: saleId,
    };

    // Deduct stock for each sold product in inventory
    setProducts(prev => {
      const updated = [...prev];
      sale.items.forEach(item => {
        if (item.productId) {
          const index = updated.findIndex(p => p.id === item.productId);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              quantity: Math.max(0, updated[index].quantity - item.quantity),
              updatedAt: new Date().toISOString(),
            };
          }
        }
      });
      return updated;
    });

    setSales(prev => [sale, ...prev]);
  };

  // Expense Operations
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Data Restore / Demo Reset
  const handleRestoreAllData = (data: {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    profile: BusinessProfile;
  }) => {
    setProducts(data.products);
    setSales(data.sales);
    setExpenses(data.expenses);
    setProfile(data.profile);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        profile={profile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenNewSale={() => setIsNewSaleModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          products={products}
          profile={profile}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              sales={sales}
              expenses={expenses}
              profile={profile}
              onOpenNewSale={() => setIsNewSaleModalOpen(true)}
              onOpenNewExpense={() => setIsNewExpenseModalOpen(true)}
              onOpenNewProduct={() => setActiveTab('inventory')}
              setActiveTab={setActiveTab}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistant
              products={products}
              sales={sales}
              expenses={expenses}
              profile={profile}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryModule
              products={products}
              profile={profile}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeTab === 'sales' && (
            <SalesModule
              sales={sales}
              products={products}
              profile={profile}
              onRecordSale={handleRecordSale}
              isNewSaleModalOpen={isNewSaleModalOpen}
              setIsNewSaleModalOpen={setIsNewSaleModalOpen}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesModule
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              isNewExpenseModalOpen={isNewExpenseModalOpen}
              setIsNewExpenseModalOpen={setIsNewExpenseModalOpen}
            />
          )}

          {activeTab === 'calculator' && (
            <CalculatorModule />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              sales={sales}
              expenses={expenses}
              products={products}
              profile={profile}
            />
          )}

          {activeTab === 'community' && (
            <CommunityModule profile={profile} />
          )}
        </main>
      </div>

      {/* Global Settings & Data Storage Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        profile={profile}
        products={products}
        sales={sales}
        expenses={expenses}
        onUpdateProfile={setProfile}
        onRestoreAllData={handleRestoreAllData}
      />
    </div>
  );
}
