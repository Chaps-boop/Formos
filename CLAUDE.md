# 🚀 Cent pas vers un autre avenir - Documentation

## 📋 Vue d'ensemble du projet

**Plateforme interactive web pour l'exploration de reconversion professionnelle**

Cette application aide les utilisateurs à découvrir leurs talents, compétences et valeurs à travers un parcours de 100 étapes ludiques et personnalisées, conduisant à des recommandations de carrière adaptées.

## 🎯 Objectif

Créer un site web moderne, ludique et interactif permettant à un utilisateur inscrit de :
1. Réaliser un bilan de compétences en 100 petites étapes
2. Découvrir ses vraies forces et talents cachés
3. Clarifier ses valeurs et motivations
4. Trouver des pistes concrètes de reconversion

## 🏗️ Architecture

### Structure des fichiers

```
Formos/
├── index.html              # Page HTML5 principale (7.4 KB)
├── styles.css              # Feuille de styles élégante (14 KB)
├── script.js               # Logique interactive (18 KB)
├── data.json               # Base de données des 100 étapes (43 KB)
├── README.md               # Documentation utilisateur
├── CLAUDE.md               # Ce fichier (doc développeur)
└── .github/
    └── workflows/
        └── deploy.yml      # Workflow GitHub Actions
```

### Technologie

- **Frontend** : HTML5 + CSS3 + JavaScript vanilla
- **Persistance** : LocalStorage (pas de backend requis)
- **Déploiement** : GitHub Pages + Actions
- **CDN** : Google Fonts pour les polices

## 📊 Données

### data.json - Structure

```json
{
  "modules": [6 modules thématiques],
  "steps": [100 étapes interactives],
  "onboarding": [7 questions de profilage],
  "recommendations": [5 métiers recommandés],
  "challenges": [10 défis quotidiens]
}
```

### Modules (6)

1. **Profilage** (15 étapes) - Qui suis-je vraiment ?
2. **Compétences** (20 étapes) - Mes talents
3. **Valeurs** (20 étapes) - Ce qui m'anime
4. **Expériences** (20 étapes) - Mon parcours
5. **Personnalité** (15 étapes) - Comment je fonctionne
6. **Exploration** (10 étapes) - Vers quel avenir

### Types d'exercices

- `reflection` : Questions ouvertes
- `quiz` : Choix multiples
- `slider` : Évaluation d'intensité
- `checklist` : Sélection multiple
- `ranking` : Classement par priorité

## 🎨 Design et UX

### Palette de couleurs

```css
--primary: #6366f1     /* Indigo */
--secondary: #ec4899   /* Rose */
--accent: #f59e0b      /* Ambre */
--success: #10b981     /* Vert */
--bg-light: #f8fafc    /* Gris très clair */
--bg-white: #ffffff    /* Blanc */
--text-dark: #1e293b   /* Bleu très foncé */
--text-gray: #64748b   /* Gris */
```

### Typographie

- **Font** : Inter (Google Fonts)
- **Sizes** : 12px → 48px (type scale)
- **Weights** : 400 (normal), 500, 600, 700 (bold)

### Layout

- **Desktop** : Sidebar (280px) + Main (1fr)
- **Mobile** : Full width, stack vertical
- **Breakpoint** : 768px

### Thème

- Thème clair/sombre automatique
- Détecte `prefers-color-scheme`
- Transitions fluides
- Contraste WCAG AA

## 🔄 Flux utilisateur

### 1. Écran d'accueil
- Présentation du projet
- Bouton "Commencer"
- Animation de bienvenue

### 2. Profilage (7 questions)
- Prénom, âge, situation
- Expérience, secteur
- Motivation, contraintes
- Sauvegarde en `userProfile`

### 3. Parcours des 100 étapes
- Navigation lineaire ou adaptative
- Affichage dynamique selon le type
- Sauvegarde des réponses
- Barre de progression
- Défis quotidiens

### 4. Résultats finaux
- Profil synthétisé
- 5 métiers recommandés
- Plans d'action
- Possibilité d'export

## 💻 Code clé

### État global (script.js)

```javascript
let state = {
  currentStep: 0,                // Étape actuelle (0-99)
  currentOnboardingStep: 0,      // Question de profilage
  userProfile: {},               // Réponses au profilage
  userResponses: {},             // Réponses aux étapes
  stepAnswers: {}                // Détail des réponses
}
```

### Fonctions principales

| Fonction | Rôle |
|----------|------|
| `startJourney()` | Lance le profilage |
| `renderStep()` | Affiche l'étape actuelle |
| `nextStep()` | Avance à l'étape suivante |
| `showResults()` | Affiche les résultats finaux |
| `saveProgress()` | Sauvegarde en localStorage |

### LocalStorage

Clé : `centPasState`

```javascript
{
  currentStep: number,
  userProfile: object,
  userResponses: object,
  stepAnswers: object
}
```

## 🎮 Gamification

### Barre de progression
- Visuelle : gradient bleu→rose
- Calcul : `(currentStep / 100) * 100`
- Mise à jour : À chaque étape

### Défis quotidiens
- Change chaque jour via `new Date().getDate()`
- 10 défis rotatifs
- Inspirants et motivants

### Système de scoring (prêt)
- Scores invisibles par compétence
- Scoring par réponse (data.json)
- Calcul adaptatif pour recommandations

## 🔌 Intégrations possibles

### Backend (futur)

```javascript
// Sauvegarder en base
POST /api/user/progress
  { userProfile, userResponses, stepAnswers }

// Récupérer en base
GET /api/user/:id/progress
```

### Export PDF

```javascript
// html2pdf intégrable
import html2pdf from 'html2pdf'
html2pdf(results, { filename: 'bilan.pdf' })
```

### Authentification

```javascript
// OAuth2 ou JWT
const token = await loginUser(email, password)
localStorage.setItem('token', token)
```

## 📱 Responsive

### Points de rupture

| Device | Width | Breakpoint |
|--------|-------|-----------|
| Mobile | <480px | Single column |
| Tablet | 480-768px | Adaptive |
| Desktop | >768px | Sidebar + Main |

### Test mobile

```bash
# Ouvrir dans Chrome DevTools
F12 → Ctrl+Shift+M
```

## 🧪 Validation

### JSON

```bash
python3 -m json.tool data.json
```

### HTML

```bash
grep -c "id=\"" index.html  # Vérifier les IDs
```

### Workflow

Le workflow GitHub Actions valide automatiquement à chaque push.

## 🚀 Déploiement

### GitHub Pages

```bash
git push origin main
# → Workflow déclenché automatiquement
# → Site déployé en 30-60 secondes
```

URL : `https://chaps-boop.github.io/Formos/`

### Configuration requise

✅ GitHub Pages activé dans Settings → Pages
✅ Branch : `main`
✅ Folder : `/ (root)`

## 📈 Performance

| Métrique | Valeur |
|----------|--------|
| Size (HTML) | 7.4 KB |
| Size (CSS) | 14 KB |
| Size (JS) | 18 KB |
| Size (JSON) | 43 KB |
| **Total** | **~83 KB** |
| Load time | <1s (local) |
| Interaction | Immédiate |

## 🔐 Sécurité

- ✅ Pas de backend (pas de vulnérabilité serveur)
- ✅ Zéro tracking
- ✅ LocalStorage uniquement (données privées)
- ✅ Compatible RGPD
- ✅ CSP : Google Fonts seulement

## 🐛 Débogage

### Console

```javascript
console.log(state)           // Afficher l'état
localStorage.clear()          // Réinitialiser
```

### Devtools

- F12 → Application → LocalStorage
- Voir l'état sauvegardé
- Modifier et tester

## 📚 Ressources

- [MDN - LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [JavaScript vanilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🎯 Prochaines étapes

1. ✅ Site de base fonctionnel
2. ⬜ Export PDF avancé
3. ⬜ Backend pour persistance serveur
4. ⬜ Authentification utilisateur
5. ⬜ Graphiques interactifs
6. ⬜ Support multilingue
7. ⬜ Mode groupe/équipe

## 📝 Notes

- Les données sont 100% côté client
- Aucune API requise
- Peut fonctionner offline (après premier load)
- Idéal pour un MVP rapide

---

**Dernière mise à jour** : Septembre 2026
**Branche principale** : `main`
**Déploiement** : GitHub Pages automatique
