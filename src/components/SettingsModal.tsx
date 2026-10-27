import React, { useState } from 'react';
import {
  Building2,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldAlert,
  CheckCircle,
  MapPin,
  X,
  FileJson
} from 'lucide-react';
import { BusinessProfile, Product, Sale, Expense } from '../types';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  onUpdateProfile: (newProfile: BusinessProfile) => void;
  onRestoreAllData: (data: {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    profile: BusinessProfile;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  products,
  sales,
  expenses,
  onUpdateProfile,
  onRestoreAllData,
}) => {
  const [name, setName] = useState(profile.name);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [city, setCity] = useState(profile.city);
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood);
  const [phone, setPhone] = useState(profile.phone);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessProfile = {
      ...profile,
      name: name.trim(),
      ownerName: ownerName.trim(),
      city: city.trim(),
      neighborhood: neighborhood.trim(),
      phone: phone.trim(),
    };
    onUpdateProfile(updated);
    onClose();
  };

  const handleResetToDemo = () => {
    if (
      window.confirm(
        'Voulez-vous réinitialiser toutes les données avec la boutique agroalimentaire d\'exemple de Libreville ?'
      )
    ) {
      const data = StorageService.resetToDemoData();
      onRestoreAllData(data);
      setName(data.profile.name);
      setOwnerName(data.profile.ownerName);
      setCity(data.profile.city);
      setNeighborhood(data.profile.neighborhood);
      setPhone(data.profile.phone);
      onClose();
    }
  };

  const handleClearToBlank = () => {
    if (
      window.confirm(
        'ATTENTION : Êtes-vous sûr de vouloir vider les données d\'exemple pour démarrer avec votre propre boutique vierge ? Pensez à exporter une sauvegarde si besoin.'
      )
    ) {
      const storeName = prompt('Nom de votre commerce au Gabon :', 'Mon Commerce') || 'Mon Commerce';
      const cityChoice = prompt('Ville au Gabon (Libreville, Port-Gentil...) :', 'Libreville') || 'Libreville';
      const data = StorageService.clearToBlankData(storeName, cityChoice);
      onRestoreAllData(data);
      setName(data.profile.name);
      setOwnerName(data.profile.ownerName);
      setCity(data.profile.city);
      setNeighborhood(data.profile.neighborhood);
      setPhone(data.profile.phone);
      onClose();
    }
  };

  const handleDownloadBackup = () => {
    StorageService.exportBackupJSON(products, sales, expenses, profile);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const restored = StorageService.importBackupJSON(content);
      if (restored) {
        onRestoreAllData(restored);
        setImportStatus('Sauvegarde restaurée avec succès !');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } else {
        setImportStatus('Erreur : Fichier JSON de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                Paramètres & Gestion des Données
              </h3>
              <p className="text-xs text-slate-500">
                Identité de la boutique et sauvegarde sur cet appareil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Identity Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Identité commerciale
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Nom du commerce *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Gérant(e) / Propriétaire
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Téléphone (Airtel / Moov)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Ville au Gabon
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Libreville, Port-Gentil..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Quartier / Emplacement
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Mont-Bouët, Oloumi, Glass..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Enregistrer les coordonnées
            </button>
          </div>
        </form>

        {/* Storage Transparency Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Stockage Local & Confidentialité
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vos produits, ventes et dépenses sont <strong>enregistrés en toute confidentialité dans la mémoire de votre navigateur (LocalStorage)</strong> sur cet appareil.
            Aucun compte distant n'est requis et vos chiffres restent sous votre contrôle exclusif.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Télécharger Sauvegarde (JSON)</span>
            </button>

            <label className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Restaurer Fichier (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-2 text-xs font-bold rounded bg-emerald-100 text-emerald-900 text-center">
              {importStatus}
            </div>
          )}
        </div>

        {/* Demo Data Management */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Gestion du mode Démonstration
          </h4>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réinitialiser Boutique Démo</span>
            </button>

            <button
              type="button"
              onClick={handleClearToBlank}
              className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Créer Boutique Vierge (À blanc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
