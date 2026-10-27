/**
 * Utilitaires de partage WhatsApp pour BIZGAB AI (Gabon)
 */

import { Sale, Product, BusinessProfile } from '../types';
import { formatFCFA, formatDateFR, formatDateTimeFR } from './formatters';

/**
 * Nettoie et formate un numéro de téléphone pour l'indicatif Gabon (+241) si nécessaire
 */
export function formatGabonPhoneForWhatsApp(phoneStr?: string): string {
  if (!phoneStr) return '';
  // Garde uniquement les chiffres
  let digits = phoneStr.replace(/\D/g, '');
  if (!digits) return '';

  // Si le numéro commence par 0 (ex: 077 12 34 56 ou 066...), on enlève le 0 et on préfixe 241
  if (digits.startsWith('0') && digits.length === 9) {
    digits = '241' + digits.substring(1);
  } else if (digits.length === 8) {
    // Format 77 12 34 56 sans le 0
    digits = '241' + digits;
  }
  return digits;
}

/**
 * Génère le lien de partage WhatsApp compatible Web & Mobile
 */
export function getWhatsAppShareUrl(text: string, phone?: string): string {
  const encodedText = encodeURIComponent(text);
  const cleanPhone = formatGabonPhoneForWhatsApp(phone);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Génère un reçu de vente professionnel prêt à être envoyé au client par WhatsApp
 */
export function formatSaleReceiptForWhatsApp(sale: Sale, profile: BusinessProfile): string {
  const dateFormatted = formatDateTimeFR(sale.date);
  const refCode = sale.id.slice(-6).toUpperCase();

  const itemsList = sale.items
    .map(i => `• ${i.quantity}x ${i.productName} = ${formatFCFA(i.total)}`)
    .join('\n');

  const paymentLabel =
    sale.paymentMethod === 'AirtelMoney'
      ? 'Airtel Money 🔴'
      : sale.paymentMethod === 'MoovMoney'
      ? 'Moov Money 🔵'
      : 'Espèces (Cash) 💵';

  let message = `🧾 *TICKET DE CAISSE - ${profile.name.toUpperCase()}*\n`;
  message += `📍 ${profile.neighborhood}, ${profile.city} (Gabon)\n`;
  if (profile.phone) message += `📞 Tél : ${profile.phone}\n`;
  message += `📅 Date : ${dateFormatted} | Réf : #${refCode}\n`;
  message += `----------------------------------------\n`;
  if (sale.customerName) message += `👤 *Client :* ${sale.customerName}\n`;
  message += `💳 *Mode de règlement :* ${paymentLabel}\n`;
  message += `----------------------------------------\n`;
  message += `*ARTICLES ACHETÉS :*\n${itemsList}\n`;
  message += `----------------------------------------\n`;
  message += `*MONTANT TOTAL ENCAISSÉ : ${formatFCFA(sale.totalAmount)}*\n`;
  message += `----------------------------------------\n`;
  if (sale.notes) message += `📝 Note : ${sale.notes}\n`;
  message += `🙏 *Merci de votre confiance et à très bientôt !*\n`;
  message += `_Géré avec BIZGAB AI - Gabon 🇬🇦_`;

  return message;
}

/**
 * Génère le point de caisse du jour pour partage WhatsApp avec l'associé(e) ou le gérant
 */
export function formatDailyReportForWhatsApp(
  stats: {
    periodLabel: string;
    revenue: number;
    salesCount: number;
    expenses: number;
    netProfit: number;
    grossMargin: number;
    payments: Record<string, number>;
    lowStockCount: number;
  },
  profile: BusinessProfile
): string {
  const today = formatDateFR(new Date().toISOString());

  let message = `📊 *POINT DE GESTION BIZGAB AI*\n`;
  message += `🏪 *Commerce :* ${profile.name}\n`;
  message += `📍 ${profile.neighborhood}, ${profile.city}\n`;
  message += `📅 Période : ${stats.periodLabel} (${today})\n`;
  message += `========================================\n`;
  message += `💰 *Chiffre d'Affaires :* ${formatFCFA(stats.revenue)} (${stats.salesCount} vente(s))\n`;
  message += `📈 *Marge Brute :* +${formatFCFA(stats.grossMargin)}\n`;
  message += `📉 *Dépenses totales :* -${formatFCFA(stats.expenses)}\n`;
  message += `💵 *Bénéfice Net Estimé :* *${formatFCFA(stats.netProfit)}*\n`;
  message += `========================================\n`;
  message += `*VENTILATION DES RÈGLEMENTS :*\n`;
  message += `• Espèces : ${formatFCFA(stats.payments.Especes || 0)}\n`;
  message += `• Airtel Money : ${formatFCFA(stats.payments.AirtelMoney || 0)}\n`;
  message += `• Moov Money : ${formatFCFA(stats.payments.MoovMoney || 0)}\n`;
  message += `========================================\n`;
  if (stats.lowStockCount > 0) {
    message += `⚠️ *Alerte Stock :* ${stats.lowStockCount} article(s) sous le seuil d'alerte !\n`;
  } else {
    message += `✅ *Stocks :* Aucun article en rupture critique.\n`;
  }
  message += `_Rapport automatique généré par BIZGAB AI 🇬🇦_`;

  return message;
}

/**
 * Génère le catalogue des prix pour les clients sur WhatsApp
 */
export function formatCatalogForWhatsApp(products: Product[], profile: BusinessProfile): string {
  const available = products.filter(p => p.quantity > 0);

  let message = `🛒 *CATALOGUE & TARIFS - ${profile.name.toUpperCase()}*\n`;
  message += `📍 ${profile.neighborhood}, ${profile.city}\n`;
  if (profile.phone) message += `📞 Commandes au : ${profile.phone}\n`;
  message += `📅 Prix en vigueur au ${formatDateFR(new Date().toISOString())}\n`;
  message += `----------------------------------------\n`;

  available.forEach(p => {
    message += `• *${p.name}* (${p.unit})\n   👉 *${formatFCFA(p.sellingPrice)}*\n`;
  });

  message += `----------------------------------------\n`;
  message += `📲 _Paiements acceptés : Espèces, Airtel Money, Moov Money_\n`;
  message += `_Passez votre commande directement en répondant à ce message !_`;

  return message;
}
