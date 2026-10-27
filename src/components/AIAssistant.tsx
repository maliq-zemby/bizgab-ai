import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Building,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Product, Sale, Expense, BusinessProfile, ChatMessage } from '../types';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppShareUrl } from '../utils/whatsapp';

interface AIAssistantProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  profile: BusinessProfile;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content: `Bonjour ! Je suis votre **assistant d'affaires BIZGAB AI**, dédié aux commerçants et entrepreneurs du Gabon 🇬🇦.

Je peux vous accompagner concrètement pour :
• **Calculer vos prix de vente et marges** en FCFA pour garantir votre rentabilité.
• **Optimiser vos stocks**, gérer les rotations et anticiper les ruptures.
• **Négocier avec vos grossistes** (Oloumi, Mont-Bouët, port d'Owendo...).
• **Maîtriser vos dépenses d'exploitation** (factures SEEG, transport routier, emballages).
• **Gérer les ardoises clients** (carnets de crédit) et fidéliser votre clientèle.

*Note de rigueur : Si une information officielle (règlement fiscal précis, tarif douanier spécifique) n'est pas vérifiée, je vous l'indiquerai en toute franchise sans rien inventer.*

Comment puis-je vous aider aujourd'hui ?`,
  timestamp: new Date().toISOString(),
};

const SUGGESTED_QUESTIONS = [
  "Comment fixer mon prix de vente avec 30% de marge brute ?",
  "Comment gérer les ardoises clients sans perdre ma clientèle ?",
  "Quelles astuces pour négocier avec les grossistes d'Oloumi ?",
  "Comment réduire mes pertes sur les produits frais et périssables ?",
  "Quels sont les avantages d'Airtel Money et Moov Money pour mon commerce ?",
  "Comment calculer mon seuil de rentabilité mensuel avec mon loyer ?"
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
  products,
  sales,
  expenses,
  profile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('bizgab_chat_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture historique chat:', e);
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bizgab_chat_messages_v1', JSON.stringify(messages));
    } catch (e) {
      console.error('Erreur sauvegarde chat:', e);
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Calculate current business context summary to send securely to server
      const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const stockCostValue = products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);

      const businessContext = {
        businessName: profile.name,
        city: profile.city,
        neighborhood: profile.neighborhood,
        productCount: products.length,
        stockValue: stockCostValue,
        salesCount: sales.length,
        totalSales: totalSalesRevenue,
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          businessContext,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let replyContent = '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.reply) {
          replyContent = data.reply;
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          replyContent = 'Désolé, aucune réponse n\'a pu être formulée.';
        }
      } else {
        // If an HTML error page was returned by a proxy
        const rawText = await response.text();
        console.warn('Réponse non-JSON reçue:', rawText.slice(0, 120));
        throw new Error('Le service BIZGAB AI redémarre ou est temporairement inaccessible. Veuillez réécrire votre message.');
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Erreur chat assistant:', err);
      setErrorMessage(
        err.message || 'Impossible de joindre l\'assistant BIZGAB AI. Vérifiez votre connexion ou réessayez dans un instant.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Voulez-vous réinitialiser la conversation avec l\'assistant IA ?')) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      setErrorMessage(null);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                Assistant IA BIZGAB
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Spécialisé Commerce Gabon
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Modèle Gemini • Gestion d'entreprise, marges, stocks & conseils locaux en FCFA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            title="Nouvelle conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Effacer historique</span>
          </button>
        </div>
      </div>

      {/* Accuracy & Rigor notice */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Garantie de sincérité :</strong> L'assistant calcule avec rigueur en FCFA, vous indique explicitement s'il ne dispose pas d'un texte légal ou tarif officiel vérifié, et n'invente jamais de chiffres.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  isUser
                    ? 'bg-slate-800'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Action buttons (WhatsApp & Copy) for bot response */}
                {!isUser && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <a
                      href={getWhatsAppShareUrl(
                        `💡 *Conseil BIZGAB AI (${profile.name} - ${profile.city})*\n\n${message.content}\n\n_Partagé depuis BIZGAB AI 🇬🇦_`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-emerald-600 hover:text-emerald-800 bg-white rounded border border-slate-200 cursor-pointer shadow-2xs"
                      title="Partager ce conseil sur WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                    </a>
                    <button
                      onClick={() => handleCopyText(message.id, message.content)}
                      className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded border border-slate-200 cursor-pointer shadow-2xs"
                      title="Copier le texte"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 font-medium ml-2">
                BIZGAB AI analyse et rédige votre conseil...
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
              className="text-xs font-bold text-rose-900 underline hover:no-underline cursor-pointer shrink-0"
            >
              Réessayer
            </button>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested prompts pills if few messages */}
      {messages.length <= 3 && (
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Questions suggérées :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-full transition-colors cursor-pointer text-left shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Posez votre question (ex: comment calculer mon prix de vente avec 25% de marge ?)..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  );
};
