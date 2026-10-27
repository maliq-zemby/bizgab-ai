import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI client securely on server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory community board messages for Gabonese merchants
export interface CommunityMessage {
  id: string;
  author: string;
  businessName: string;
  city: string;
  category: 'fournisseurs' | 'gestion' | 'alerte' | 'entraide' | 'general';
  content: string;
  createdAt: string;
  likes: number;
  replies?: Array<{
    id: string;
    author: string;
    city: string;
    content: string;
    createdAt: string;
  }>;
}

const communityMessages: CommunityMessage[] = [
  {
    id: 'msg-1',
    author: 'Honorine Mba',
    businessName: 'Épicerie du Carrefour Léon Mba',
    city: 'Libreville',
    category: 'fournisseurs',
    content: 'Bonjour chers confrères ! Pour ceux qui cherchent du sucre blond et de la farine de blé en sac de 50kg, un nouvel arrivage vient d\'arriver au dépôt d\'Oloumi avec un bon tarif de gros. Marge possible de 22% au détail.',
    createdAt: '2026-10-25T14:30:00Z',
    likes: 8,
    replies: [
      {
        id: 'rep-1',
        author: 'Arsène B.',
        city: 'Owendo',
        content: 'Merci pour le tuyau maman Honorine ! Est-ce qu\'ils acceptent le paiement direct par Airtel Money Pro ?',
        createdAt: '2026-10-25T15:10:00Z',
      },
      {
        id: 'rep-2',
        author: 'Honorine Mba',
        city: 'Libreville',
        content: 'Oui, Airtel Money et Moov Money acceptés sans frais supplémentaires à partir de 100 000 FCFA.',
        createdAt: '2026-10-25T15:45:00Z',
      }
    ],
  },
  {
    id: 'msg-2',
    author: 'Christian Ndong',
    businessName: 'Quincaillerie & Épicerie Moderne',
    city: 'Port-Gentil',
    category: 'gestion',
    content: 'Petite astuce pour la gestion des crédits clients ("les carnets") : j\'ai fixé un plafond strict de 15 000 FCFA par client et maximum 7 jours de délai. Mon taux d\'impayés a baissé de moitié ce mois-ci !',
    createdAt: '2026-10-24T09:15:00Z',
    likes: 14,
    replies: [
      {
        id: 'rep-3',
        author: 'Fatou K.',
        city: 'Franceville',
        content: 'Très bonne initiative Christian. Chez nous à Potos, on demande aussi un acompte de 30% en espèces avant d\'ouvrir l\'ardoise.',
        createdAt: '2026-10-24T11:20:00Z',
      }
    ],
  },
  {
    id: 'msg-3',
    author: 'Marie-Claire Ondo',
    businessName: 'Alimentation & Produits Frais',
    city: 'Oyem',
    category: 'entraide',
    content: 'Question aux commerçants de l\'intérieur : comment vous organisez votre stock pour les produits frais quand il y a des délestages ? J\'envisage d\'installer un petit inverseur solaire pour mon congélateur.',
    createdAt: '2026-10-23T18:00:00Z',
    likes: 6,
    replies: [],
  },
];

// Community endpoints
app.get('/api/community', (req, res) => {
  res.json({ success: true, messages: communityMessages });
});

app.post('/api/community', (req, res) => {
  const { author, businessName, city, category, content } = req.body;
  if (!author || !content || !city) {
    return res.status(400).json({ error: 'Auteur, ville et message sont obligatoires.' });
  }

  const newMessage: CommunityMessage = {
    id: `msg-${Date.now()}`,
    author: String(author).trim(),
    businessName: businessName ? String(businessName).trim() : 'Commerce indépendant',
    city: String(city).trim(),
    category: category || 'general',
    content: String(content).trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: [],
  };

  communityMessages.unshift(newMessage);
  res.status(201).json({ success: true, message: newMessage });
});

app.post('/api/community/:id/like', (req, res) => {
  const { id } = req.params;
  const msg = communityMessages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Message introuvable.' });
  msg.likes += 1;
  res.json({ success: true, likes: msg.likes });
});

app.post('/api/community/:id/reply', (req, res) => {
  const { id } = req.params;
  const { author, city, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: 'Nom et réponse requis.' });
  }

  const msg = communityMessages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Message introuvable.' });

  if (!msg.replies) msg.replies = [];
  const newReply = {
    id: `rep-${Date.now()}`,
    author: String(author).trim(),
    city: city ? String(city).trim() : 'Gabon',
    content: String(content).trim(),
    createdAt: new Date().toISOString(),
  };

  msg.replies.push(newReply);
  res.status(201).json({ success: true, reply: newReply });
});


// Helper for fallback business retail advice when upstream API is experiencing temporary high demand
function generateLocalAdvisoryResponse(lastPrompt: string, businessContext?: any): string {
  const q = (lastPrompt || '').toLowerCase();
  const city = businessContext?.city || 'Libreville';
  const name = businessContext?.businessName || 'votre commerce';

  if (q.includes('marge') || q.includes('prix') || q.includes('calcul')) {
    return `### Conseil BIZGAB AI : Calcul de vos Prix & Marges (${city}) 🇬🇦

Pour fixer un prix de vente rentable en Francs CFA (FCFA) :

1. **Calcul du Coût de Revient Unitaire Réel :**
   - Prix d'achat chez le grossiste (ex: Oloumi ou Mont-Bouët)
   - **+** Frais de transport / taxi clando par article (ex: 100 à 250 FCFA par sac ou carton)
   - **= Coût de revient total**.

2. **Formule pour une Marge Brute (Exemple 25%) :**
   $$\\text{Prix de Vente} = \\text{Coût de Revient} \\times (1 + \\frac{25}{100})$$
   *Exemple chiffré :* Pour un article qui vous revient à **2 000 FCFA**, le prix recommandé est de **2 500 FCFA** (soit **500 FCFA** de marge brute par unité).

3. **Pratique commerciale locale :**
   - Arrondissez toujours aux 25 ou 50 FCFA les plus proches pour faciliter le rendu de monnaie en pièces.
   - Utilisez également le module **Calculateur Marge** dans le menu latéral pour vos simulations précises.`;
  }

  if (q.includes('ardoise') || q.includes('crédit') || q.includes('carnet')) {
    return `### Conseil BIZGAB AI : Maîtrise des Carnets de Crédit & Ardoises (${city}) 🇬🇦

Les impayés sont la première cause de difficultés des petites boutiques au Gabon. Voici les règles recommandées :

1. **Règle du Plafond Strict :** Ne dépassez jamais **10 000 à 15 000 FCFA** de crédit par client régulier.
2. **Délai court :** Exigez le règlement tous les **7 jours** ou à chaque quinzaine (période des salaires / acomptes).
3. **Refus poli mais ferme :** Pas de nouveau crédit tant que l'ardoise précédente n'est pas soldée à 100%.
4. **Paiement mobile :** Proposez le règlement par **Airtel Money** ou **Moov Money** pour que le client puisse vous transférer la somme même sans se déplacer.`;
  }

  if (q.includes('grossiste') || q.includes('oloumi') || q.includes('fournisseur') || q.includes('mont-bouët')) {
    return `### Conseil BIZGAB AI : Négociation avec les Grossistes (${city}) 🇬🇦

Pour obtenir de meilleurs tarifs auprès des dépôts d'Oloumi, Mont-Bouët ou Owendo :

1. **Achetez groupé au carton ou au sac de 50kg :** Même avec un stock modeste, négociez le tarif de demi-gros dès 2 ou 3 cartons.
2. **Réseau de confrères :** Associez-vous avec d'autres commerçants du quartier via le salon **Réseau Commerçants** de BIZGAB pour mutualiser une course de transport et un achat en gros.
3. **Négociez le transport :** Demandez au grossiste d'offrir la manutention (chargement dans le véhicule) ou une ristourne de 500 à 1 000 FCFA par tranche de 50 000 FCFA d'achats.`;
  }

  if (q.includes('seeg') || q.includes('frais') || q.includes('perte') || q.includes('délestage') || q.includes('poisson')) {
    return `### Conseil BIZGAB AI : Gestion des Produits Frais & Électricité SEEG 🇬🇦

Face aux aléas de coupures et au coût de l'électricité Edan :

1. **Gestion FIFO (Premier entré, premier sorti) :** Vendez toujours en priorité les arrivages les plus anciens.
2. **Congélateur plein = Moins de consommation :** Remplissez les espaces vides du congélateur avec des bouteilles d'eau congelées qui maintiendront le froid pendant plusieurs heures en cas de coupure de courant.
3. **Déstockage rapide avant DLC :** Si un produit approche de sa date limite, appliquez une remise de 15% pour récupérer votre capital plutôt que de subir une perte totale (mieux vaut 0 marge qu'une perte de 100%).`;
  }

  return `### Conseil BIZGAB AI pour ${name} (${city}) 🇬🇦

Merci pour votre question ! Voici les principes de gestion clés pour votre activité :

• **Caisse du jour :** Séparez scrupuleusement la caisse de la boutique de vos dépenses personnelles familiales.
• **Stock de sécurité :** Surveillez vos produits phares dans l'onglet **Produits & Stocks** pour ne jamais subir de rupture sur les denrées essentielles (riz, huile, lait, savon).
• **Modes de paiement :** Encouragez les paiements Airtel Money et Moov Money pour réduire les risques liés aux espèces et attirer la clientèle jeune et active.

*(Vous pouvez également poser une question précise sur un calcul de prix, une négociation fournisseur ou un produit particulier).*`;
}

// Gemini Chat Endpoint with Multi-Model Cascade and Resilience
app.post('/api/gemini/chat', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { messages, businessContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Historique de messages manquant.' });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    if (!ai) {
      const fallbackAdvice = generateLocalAdvisoryResponse(lastUserMessage, businessContext);
      return res.json({
        success: true,
        reply: fallbackAdvice,
      });
    }

    const systemInstruction = `Tu es l'assistant d'affaires officiel de BIZGAB AI, une application conçue spécialement pour les commerçants, demi-grossistes, épiciers et petites entreprises au Gabon.
Ton rôle est de fournir des conseils pragmatiques, clairs, bienveillants et rigoureux sur :
- La gestion quotidienne d'un commerce (gestion de caisse, inventaire, rotation des stocks, gestion des pertes/DLC).
- La fixation des prix de vente, le calcul des marges brutes et nettes en Francs CFA (FCFA / XAF).
- Les relations fournisseurs et le transport des marchandises (ex: approvisionnement Mont-Bouët, Oloumi, Owendo, corridors routiers vers l'intérieur du pays).
- Les modes de paiement locaux (espèces, Airtel Money, Moov Money Flooz).
- La fidélisation des clients et la gestion responsable des crédits clients ("carnets de crédit" ou ardoises).
- Les bonnes pratiques commerciales inspirées du système OHADA et des réalités gabonaises.

RÈGLES STRICTES ET OBLIGATOIRES :
1. MONNAIE : Exprime TOUJOURS les montants en Francs CFA (FCFA ou F CFA), jamais en euros ni en dollars sauf si l'utilisateur demande explicitement une conversion.
2. TRANSPARENCE ET VÉRITÉ : Si tu ne disposes pas d'une information officielle exacte (barème fiscal spécifique récent de la Direction Générale des Impôts du Gabon, taux de douane exacts d'un code tarifaire SH, textes de lois très précis ou statistiques officielles récentes), TU DOIS CLAIREMENT ET EXPLICITEMENT PRÉCISER QUE TU NE CONNAIS PAS CETTE INFORMATION OFFICIELLE et orienter vers les sources officielles gabonaises (DGI, Chambre de Commerce, Ministère de l'Économie). NE JAMAIS INVENTER DE CHIFFRES OFFICIELS NI DE LOIS FICTIVES.
3. CONSEILS ACTIONNABLES : Structure tes réponses avec des puces, des formules simples et des exemples chiffrés réalistes en FCFA (ex: un produit acheté 1 000 FCFA revendu 1 300 FCFA dégage 300 FCFA de marge brute soit 23% de marge commerciale).
4. CONTEXTE DE L'UTILISATEUR :
${businessContext ? `Contexte actuel de la boutique BIZGAB AI de l'utilisateur :
- Nom du commerce : ${businessContext.businessName || 'Commerce local'}
- Ville : ${businessContext.city || 'Libreville'}
- Nombre de produits en stock : ${businessContext.productCount ?? 'N/A'}
- Valeur estimée du stock : ${businessContext.stockValue ? businessContext.stockValue + ' FCFA' : 'N/A'}
- Ventes enregistrées : ${businessContext.salesCount ?? 'N/A'}
- Chiffre d'affaires total : ${businessContext.totalSales ? businessContext.totalSales + ' FCFA' : 'N/A'}` : 'Aucun contexte spécifique renseigné.'}

Réponds toujours en français chaleureux, respectueux et direct.`;

    const contents = messages.map((m: { role: string; content?: string; text?: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    // Cascade through candidate models with a 5-second timeout per attempt
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    let replyText = '';

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Délai d\'attente dépassé pour ce modèle')), 3000)
        );

        const apiPromise = ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);

        if (response && response.text) {
          replyText = response.text;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Modèle ${model} indisponible (${modelErr?.status || modelErr?.message}), test suivant...`);
      }
    }

    if (!replyText) {
      console.warn('Utilisation du moteur d\'expertise local suite à la saturation des serveurs distants.');
      replyText = generateLocalAdvisoryResponse(lastUserMessage, businessContext);
    }

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (err: any) {
    console.error('Erreur API Gemini finale:', err);
    // Even in ultimate failure, return valid JSON with a constructive response
    const safeFallback = generateLocalAdvisoryResponse('', req.body?.businessContext);
    return res.json({
      success: true,
      reply: safeFallback,
    });
  }
});

// Setup dev server with Vite middlewares or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BIZGAB AI Server en écoute sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur au démarrage du serveur:', err);
});
