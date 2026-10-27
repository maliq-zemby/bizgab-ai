import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Send,
  ThumbsUp,
  MapPin,
  Tag,
  Sparkles,
  Building2,
  Clock,
  Filter,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { CommunityMessage, BusinessProfile } from '../types';
import { formatDateFR, formatDateTimeFR } from '../utils/formatters';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getWhatsAppShareUrl } from '../utils/whatsapp';

interface CommunityModuleProps {
  profile: BusinessProfile;
}

const CATEGORY_TAGS = [
  { id: 'all', label: 'Toutes les discussions' },
  { id: 'fournisseurs', label: 'Bons plans grossistes & Arrivages' },
  { id: 'gestion', label: 'Gestion & Pratiques de vente' },
  { id: 'alerte', label: 'Alertes prix & Ruptures' },
  { id: 'entraide', label: 'Entraide & Questions' },
];

export const CommunityModule: React.FC<CommunityModuleProps> = ({ profile }) => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // New message form
  const [authorName, setAuthorName] = useState(profile.ownerName || 'Commerçant Gabonais');
  const [businessName, setBusinessName] = useState(profile.name || 'Boutique locale');
  const [city, setCity] = useState(profile.city || 'Libreville');
  const [postCategory, setPostCategory] = useState<'fournisseurs' | 'gestion' | 'alerte' | 'entraide' | 'general'>('fournisseurs');
  const [content, setContent] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // Reply form state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState(profile.ownerName || 'Commerçant');

  // Fetch messages from backend
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/community');
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Erreur chargement messages communauté:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !authorName.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim(),
          businessName: businessName.trim(),
          city: city.trim(),
          category: postCategory,
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [data.message, ...prev]);
        setContent('');
        setShowNewPostModal(false);
      }
    } catch (err) {
      console.error('Erreur publication message:', err);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/community/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, likes: data.likes } : m));
      }
    } catch (err) {
      console.error('Erreur like:', err);
    }
  };

  const handleSendReply = async (msgId: string) => {
    if (!replyContent.trim()) return;

    try {
      const res = await fetch(`/api/community/${msgId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: replyAuthor.trim() || 'Commerçant',
          city: profile.city || 'Gabon',
          content: replyContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              replies: [...(m.replies || []), data.reply],
            };
          }
          return m;
        }));
        setReplyContent('');
        setReplyingToId(null);
      }
    } catch (err) {
      console.error('Erreur réponse:', err);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>Réseau d'Échange & Entraide des Commerçants</span>
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Gabon Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Espace d'échange entre commerçants et clients : partage d'arrivages, astuces fournisseurs et entraide
          </p>
        </div>

        <button
          onClick={() => setShowNewPostModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publier un Message</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {CATEGORY_TAGS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl font-bold shrink-0 cursor-pointer transition-all border ${
              activeCategory === cat.id
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Aucun message dans cette catégorie.</p>
            <p className="text-slate-400 text-xs mt-1">Soyez le premier à poser une question ou partager un bon plan !</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            >
              {/* Author & Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {msg.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{msg.author}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        ({msg.businessName})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-medium text-emerald-700">
                        <MapPin className="w-3 h-3" /> {msg.city}
                      </span>
                      <span>•</span>
                      <span>{formatDateTimeFR(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {msg.category === 'fournisseurs'
                    ? '📦 Grossiste'
                    : msg.category === 'gestion'
                    ? '💼 Gestion'
                    : msg.category === 'alerte'
                    ? '⚠️ Alerte'
                    : '🤝 Entraide'}
                </span>
              </div>

              {/* Message Body */}
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>

              {/* Action buttons (Like & Reply) */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleLike(msg.id)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Utile ({msg.likes})</span>
                </button>

                <button
                  onClick={() => setReplyingToId(replyingToId === msg.id ? null : msg.id)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Répondre {msg.replies && msg.replies.length > 0 ? `(${msg.replies.length})` : ''}</span>
                </button>

                <a
                  href={getWhatsAppShareUrl(
                    `📢 *Message Réseau Commerçants Gabon (BIZGAB AI)*\n👤 *Auteur :* ${msg.author} (${msg.businessName} - ${msg.city})\n\n"${msg.content}"\n\n_Partagé depuis l'application BIZGAB AI 🇬🇦_`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer transition-colors ml-auto"
                  title="Partager ce message dans un groupe WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span className="hidden sm:inline">Partager sur WhatsApp</span>
                </a>
              </div>

              {/* Replies Thread */}
              {msg.replies && msg.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-2.5 pt-2">
                  {msg.replies.map(rep => (
                    <div key={rep.id} className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-800">{rep.author} ({rep.city})</span>
                        <span className="text-[10px]">{formatDateFR(rep.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply input */}
              {replyingToId === msg.id && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Votre nom..."
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Votre réponse ou conseil..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleSendReply(msg.id)}
                      className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      Envoyer la réponse
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-black text-lg text-slate-900 mb-1">
              Partager un message avec les commerçants du Gabon
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Arrivage de stock, question sur la gestion, avis sur un grossiste ou entraide
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Votre Nom *</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ville (Gabon) *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Libreville, Port-Gentil..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nom de votre commerce</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="ex: Épicerie du quartier"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Thème *</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="fournisseurs">Bons plans grossistes & Arrivages</option>
                    <option value="gestion">Gestion & Pratiques de vente</option>
                    <option value="alerte">Alerte prix & Ruptures</option>
                    <option value="entraide">Entraide & Questions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Votre Message *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez votre message, votre question ou partagez les tarifs d'un arrivage..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isPosting ? 'Publication...' : 'Publier le message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
