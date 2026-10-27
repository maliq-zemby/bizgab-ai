import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Package,
  ShoppingCart,
  Receipt,
  Calculator,
  BarChart3,
  Users,
  AlertTriangle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Product, BusinessProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  products: Product[];
  profile: BusinessProfile;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  products,
  profile,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenSettings,
}) => {
  const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'ai-assistant',
      label: 'Assistant IA',
      icon: Bot,
      isSpecial: true,
      badge: 'Gemini',
    },
    {
      id: 'inventory',
      label: 'Produits & Stocks',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alerte${lowStockCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'sales',
      label: 'Ventes',
      icon: ShoppingCart,
      badge: null,
    },
    {
      id: 'expenses',
      label: 'Dépenses',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'calculator',
      label: 'Calculateur Marge',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Rapports & Bilans',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'community',
      label: 'Réseau Commerçants',
      icon: Users,
      badge: 'Gabon Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-10 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile header inside drawer */}
          <div className="p-4 border-b border-slate-200 md:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                BG
              </div>
              <span className="font-extrabold text-base text-slate-900">
                BIZGAB <span className="text-emerald-600">AI</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Principal
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? item.isSpecial
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? item.isSpecial
                            ? 'text-white'
                            : 'text-emerald-700'
                          : item.isSpecial
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        item.badgeColor
                          ? item.badgeColor
                          : isActive && item.isSpecial
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Profile / Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {profile.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {profile.neighborhood}, {profile.city}
              </p>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Gérer le profil"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            BIZGAB AI • Gabon v1.0
          </p>
        </div>
      </aside>
    </>
  );
};
