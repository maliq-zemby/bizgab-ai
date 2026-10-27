import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  Menu, 
  X, 
  Database, 
  HelpCircle,
  Sparkles,
  MapPin
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppShareUrl } from '../utils/whatsapp';

interface HeaderProps {
  profile: BusinessProfile;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenNewSale: () => void;
  onOpenSettings: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenNewSale,
  onOpenSettings,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Top micro banner for demo mode notice if enabled */}
      {profile.isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-200/80 px-4 py-1 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>MODE EXEMPLE DÉMONSTRATION :</strong> Boutique agroalimentaire fictive à Libreville. Vos modifications sont conservées sur cet appareil.
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-amber-800 underline hover:text-amber-950 font-semibold cursor-pointer text-[11px]"
          >
            Changer ou créer ma boutique
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Gabon Flag accent */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-lg tracking-tight">BG</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-slate-900 tracking-tight">
                    BIZGAB <span className="text-emerald-600">AI</span>
                  </span>
                  {/* Gabon mini flag badge */}
                  <div className="flex h-3 w-4.5 rounded-xs overflow-hidden border border-slate-300 shadow-2xs" title="République Gabonaise">
                    <div className="w-1/3 bg-[#009e60]" />
                    <div className="w-1/3 bg-[#fcd116]" />
                    <div className="w-1/3 bg-[#3a75c4]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3 h-3 text-emerald-600 inline" />
                  <span className="truncate max-w-[160px] sm:max-w-xs font-medium">
                    {profile.name} • {profile.city}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency indicator */}
            <div className="hidden sm:flex items-center px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs font-semibold text-slate-700">
              <span>Devise : FCFA (XAF)</span>
            </div>

            {/* Storage status button */}
            <button
              onClick={onOpenSettings}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Données enregistrées localement sur ce navigateur"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stockage Local</span>
            </button>

            {/* WhatsApp App Share CTA */}
            <a
              href={getWhatsAppShareUrl(
                `🇬🇦 *BIZGAB AI - Application de Gestion Commerciale pour le Gabon*\n\nDécouvre cette application gratuite en FCFA pour gérer les ventes, stocks, marges et point de caisse au Gabon :\n${typeof window !== 'undefined' ? window.location.origin : ''}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Recommander BIZGAB AI sur WhatsApp"
              aria-label="Partager sur WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
            </a>

            {/* Direct Quick Sale CTA */}
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Enregistrer</span> Vente
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Paramètres de la boutique & Sauvegarde"
              aria-label="Paramètres"
            >
              <Building2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
