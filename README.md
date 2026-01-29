# Le Cercle — Guidance Augmentée

Application de génération de guidances hypnotiques collectives avec accompagnement tambour.

## Déploiement sur Vercel

### 1. Préparer le projet

Le projet est prêt. Structure :
```
le-cercle-vercel/
├── api/
│   └── generate.js      # Fonction serverless (appelle Anthropic)
├── public/
│   └── index.html       # L'application React
├── package.json
├── vercel.json
└── README.md
```

### 2. Déployer sur Vercel

**Option A : Via le site Vercel**
1. Va sur https://vercel.com
2. Connecte-toi (ou crée un compte)
3. Clique "Add New..." → "Project"
4. Importe depuis GitHub (ou upload le dossier)
5. Clique "Deploy"

**Option B : Via la CLI**
```bash
npm i -g vercel
cd le-cercle-vercel
vercel
```

### 3. Configurer la clé API (IMPORTANT)

1. Dans Vercel, va dans ton projet
2. Clique "Settings" → "Environment Variables"
3. Ajoute une variable :
   - **Name** : `ANTHROPIC_API_KEY`
   - **Value** : ta clé API (commence par `sk-ant-...`)
4. Clique "Save"
5. **Redéploie** le projet pour que la variable soit prise en compte

### 4. Utiliser l'application

Ouvre l'URL de ton projet (genre `https://le-cercle-xxx.vercel.app`)

Ta clé API est sécurisée côté serveur, jamais exposée au navigateur.

## Coût estimé

~0.02-0.05€ par guidance générée (Claude Sonnet)
Soit ~5-10€ pour 100 guidances.

## Support

Pour obtenir une clé API Anthropic : https://console.anthropic.com
