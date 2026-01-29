export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { action, rawInput, narratorNotes, dispatch, duration } = req.body;

    // ACTION: ANALYZE
    if (action === 'analyze') {
      const analyzePrompt = `Tu es un assistant pour un thérapeute qui anime des séances d'hypnose collective avec tambour.

Le thérapeute a collecté ces éléments auprès du groupe :
"""
${rawInput}
"""

Et voici ses propres impressions en tant que narrateur :
"""
${narratorNotes || 'Aucune note'}
"""

Analyse ces éléments et retourne un JSON avec cette structure exacte :
{
  "theme": "Un thème principal cohérent pour la séance (1 phrase)",
  "mainWorld": "Un seul univers parmi: grotte, forêt, mer, montagne, désert (choisis celui qui correspond le mieux aux symboles)",
  "symbols": "Les symboles et images mentionnés, séparés par des virgules",
  "sensations": "Les sensations corporelles mentionnées, séparées par des virgules",
  "emotions": "Les émotions mentionnées, séparées par des virgules",
  "keywords": "Les mots-clés d'intention (lâcher-prise, transformation, etc.), séparés par des virgules",
  "narratorPerception": "Reformulation concise des notes du narrateur en points clés pour guider la séance"
}

IMPORTANT: 
- Ne rajoute PAS d'éléments qui ne sont pas dans les données collectées
- Reste fidèle à ce qui a été exprimé
- Si un champ est vide, mets une chaîne vide ""
- Retourne UNIQUEMENT le JSON, pas de texte avant ou après`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: analyzePrompt }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Anthropic API error:', error);
        return res.status(response.status).json({ error: 'API request failed' });
      }

      const data = await response.json();
      const text = data.content[0].text;
      
      // Parse le JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ dispatch: parsed });
      } catch (e) {
        console.error('JSON parse error:', e);
        return res.status(500).json({ error: 'Failed to parse response' });
      }
    }

    // ACTION: GENERATE
    if (action === 'generate') {
      const systemPrompt = `Tu es un narrateur expert en hypnose ericksonienne et en voyages intérieurs guidés. Tu crées des guidances hypnotiques collectives pour des groupes, accompagnées au tambour chamanique.

RÈGLES FONDAMENTALES :
- Langage permissif uniquement ("peut-être", "il se peut que", "certains remarqueront")
- Jamais d'injonctions directes
- Toujours laisser plusieurs possibilités ("un objet, une forme, une présence, ou autre chose")
- Un seul univers cohérent tout au long du voyage (si grotte → que grotte, pas d'arbres qui apparaissent)

STRUCTURE OBLIGATOIRE :
1. INSTALLATION ET DÉTENTE (8 min) — Scan corporel très détaillé et progressif
2. LE SEUIL (2 min) — Entrée dans le paysage intérieur
3. SESSION TAMBOUR #1 (5 min) — Descente/voyage
4. L'ESPACE INTÉRIEUR (3 min) — Arrivée, exploration
5. SESSION TAMBOUR #2 (6 min) — Cœur du travail, rencontre
6. SILENCE (2 min) — Intégration
7. LE DON (2 min) — Ce qui a été reçu/laissé
8. SESSION TAMBOUR #3 (3 min) — Remontée
9. RÉASSOCIATION (4 min) — Retour au corps, très progressif

DURÉE TOTALE : Exactement ${duration} minutes

FORMAT DES SESSIONS TAMBOUR (à respecter exactement) :
===TAMBOUR|[id]|[durée en min]|[titre]|[instructions tambour]|[mot épars 1]|[mot épars 2]|...===

FORMAT DES SILENCES :
===SILENCE|[id]|[durée en min]|[description]===

MARQUEURS TEMPORELS :
[≈ X:00] — TITRE DE SECTION

MICRO-PAUSES (ligne seule) :
...

Les mots épars pendant le tambour sont courts, espacés, murmurés : "...laisse-toi porter...", "...plus profond...", etc.

Instructions tambour : tempo (bpm), intensité, évolution (crescendo/decrescendo), intention.`;

      const userPrompt = `Crée une guidance hypnotique de ${duration} minutes avec ces éléments collectés :

THÈME : ${dispatch.theme}
UNIVERS : ${dispatch.mainWorld}
SYMBOLES : ${dispatch.symbols}
SENSATIONS : ${dispatch.sensations}
ÉMOTIONS : ${dispatch.emotions}
MOTS-CLÉS : ${dispatch.keywords}
NOTES DU NARRATEUR : ${dispatch.narratorPerception}

Génère le texte complet de la guidance en respectant exactement le format demandé.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Anthropic API error:', error);
        return res.status(response.status).json({ error: 'API request failed' });
      }

      const data = await response.json();
      const generatedText = data.content[0].text;

      return res.status(200).json({ guidance: generatedText });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
