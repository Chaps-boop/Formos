# 🚀 Cent pas vers un autre avenir

**Une plateforme ludique et interactive pour explorer votre reconversion professionnelle en 100 étapes.**

## 📖 À propos

"Cent pas vers un autre avenir" est un site web dédié aux personnes en quête de reconversion professionnelle. À travers un parcours de 100 étapes ludiques et personnalisées, les utilisateurs découvrent :

- ✨ Leurs véritables compétences et talents cachés
- 💡 Leurs valeurs fondamentales et ce qui les motive
- 🎯 Des pistes de reconversion alignées avec leur personnalité
- 📋 Un plan d'action concret pour leur transition

## 🎮 Caractéristiques principales

### Interface moderne et responsive
- Design élégant avec thème clair/sombre automatique
- Optimisé pour mobile, tablette et desktop
- Animations fluides et transitions agréables

### 100 étapes interactives réparties en 6 modules
1. 🔍 **Qui suis-je vraiment ?** (15 étapes) - Profilage personnalité et valeurs
2. 💪 **Mes compétences** (20 étapes) - Découverte des talents
3. 💎 **Mes valeurs** (20 étapes) - Clarification du sens
4. 🎯 **Mes expériences** (20 étapes) - Apprentissages du parcours
5. 🧠 **Ma personnalité** (15 étapes) - Style de fonctionnement
6. 🚀 **Explorer l'avenir** (10 étapes) - Reconversion

### Gamification engageante
- Barre de progression visuelle en temps réel
- Défis quotidiens qui changent chaque jour
- Sauvegarde automatique du parcours
- Système de scoring intelligent et adaptatif

### Types d'exercices variés
- ✍️ Réflexions ouvertes pour l'auto-connaissance
- 🧩 Quiz avec options multiples
- 📊 Sliders pour évaluer l'intensité
- ☑️ Checklists pour sélections multiples
- 🏆 Classements par ordre de priorité

### Résultats personnalisés
- Profil synthétisé avec points forts et valeurs
- 5 métiers recommandés basés sur le profil
- Plans d'action détaillés pour chaque recommandation
- Export de résultats (PDF prêt à intégrer)

## 🛠️ Stack technique

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Data** : JSON structuré avec 100 étapes et algorithmes
- **Storage** : LocalStorage pour la persistance
- **Déploiement** : GitHub Pages (gratuit et facile)

## 📁 Structure des fichiers

```
.
├── index.html          # Page principale HTML5
├── styles.css          # Feuille de styles moderne
├── script.js           # Logique JavaScript interactive
├── data.json           # Base de données des 100 étapes
├── README.md           # Ce fichier
└── .github/
    └── workflows/
        └── deploy.yml  # Workflow de déploiement automatique
```

## 🚀 Démarrage rapide

### Localement
1. Clonez le repository :
```bash
git clone https://github.com/Chaps-boop/Formos.git
cd Formos
```

2. Lancez un serveur local :
```bash
python3 -m http.server 8000
```

3. Ouvrez votre navigateur : `http://localhost:8000`

### En ligne
Le site est automatiquement publié via GitHub Pages à chaque commit sur `main` :

👉 **[Accéder au site en direct](https://chaps-boop.github.io/Formos/)**

## 📝 Comment utiliser le site

1. **Cliquez sur "Commencer mon parcours"**
2. **Complétez le profilage initial** (7 questions personnalisées)
3. **Parcourez les 100 étapes** à votre rythme
   - Les étapes prennent 2-3 minutes chacune
   - Vous pouvez faire une pause et reprendre plus tard
4. **Sauvegardez votre progression** avec le bouton 💾
5. **Découvrez vos résultats** avec recommandations et plan d'action

## 🔄 Workflow GitHub Actions

Un workflow automatique est configuré pour :
- ✅ Tester la validité du JSON
- ✅ Déployer automatiquement sur GitHub Pages à chaque push sur `main`
- ✅ Générer des rapports de déploiement

Consultez `.github/workflows/deploy.yml` pour les détails.

## 📊 Données et contenu

### Profilage initial (7 questions)
- Prénom et informations personnelles
- Situation actuelle (salarié, cadre, demandeur d'emploi, etc.)
- Années d'expérience
- Secteur d'activité actuel
- Motivation pour la reconversion
- Contraintes (géographiques, familiales, financières)

### 100 étapes structurées
Chaque étape contient :
- Un titre descriptif
- Une question ou exercice ludique
- Un contexte d'apprentissage
- Un scoring invisible pour l'algorithme adaptatif

### 5 métiers recommandés
Basés sur :
- Compétences identifiées
- Valeurs alignées
- Personnalité et style d'apprentissage
- Compatibilité calculée
- Salaire moyen et potentiel de croissance

### 10 défis quotidiens
Motivants et amusants pour maintenir l'engagement :
- Défi qui change chaque jour
- Lié aux apprentissages du parcours
- Prend 5 minutes maximum

## 🎨 Design et UX

### Palette de couleurs
- **Primaire** : Indigo (#6366f1)
- **Secondaire** : Rose (#ec4899)
- **Accent** : Ambre (#f59e0b)
- **Succès** : Vert (#10b981)

### Typographie
- Police : Inter (Google Fonts)
- Hiérarchie claire et lisible
- Optimisée pour tous les appareils

### Thème automatique
- Détecte automatiquement le thème clair/sombre du système
- Contraste optimisé pour chaque thème
- Transitions fluides

## 📱 Responsive design

- **Desktop** : Sidebar + contenu principal en 2 colonnes
- **Tablette** : Layout adaptatif
- **Mobile** : Stack vertical pour lisibilité maximale

## 💾 Persistance des données

Le site utilise **LocalStorage** pour :
- Sauvegarder automatiquement le profilage
- Conserver les réponses aux étapes
- Maintenir la progression (numéro d'étape)
- Permettre de reprendre où l'utilisateur a quitté

**Aucune donnée n'est envoyée à un serveur** - tout reste local et privé.

## 🔐 Confidentialité

- ✅ Zéro tracking
- ✅ Zéro serveur requis
- ✅ Données stockées localement uniquement
- ✅ Compatible RGPD

## 🚀 Déploiement

### GitHub Pages (automatique)
Le site est déployé automatiquement à chaque commit sur `main` via Actions GitHub.

URL : `https://chaps-boop.github.io/Formos/`

### Autres plateformes
Vous pouvez copier les 4 fichiers (index.html, styles.css, script.js, data.json) sur n'importe quel serveur web.

## 📈 Statistiques du site

- **Fichiers** : 4 (HTML, CSS, JS, JSON)
- **Taille totale** : ~83 KB
- **Étapes** : 100
- **Modules** : 6
- **Questions de profilage** : 7
- **Métiers recommandés** : 5
- **Défis quotidiens** : 10
- **Aucune dépendance externe** (sauf Google Fonts)

## 🛣️ Feuille de route

- [ ] Export PDF avec html2pdf
- [ ] Authentification utilisateur optionnelle
- [ ] Sauvegarde en base de données
- [ ] API backend pour recommandations avancées
- [ ] Graphiques interactifs pour les résultats
- [ ] Mode groupe/équipe
- [ ] Intégration avec LinkedIn
- [ ] Support multilingue

## 🤝 Contribution

Les contributions sont bienvenues ! Pour proposer des améliorations :

1. Créez une branche : `git checkout -b feature/ma-feature`
2. Committez vos changements : `git commit -m "Ajout de ma feature"`
3. Poussez vers la branche : `git push origin feature/ma-feature`
4. Ouvrez une Pull Request

## 📧 Contact et support

Pour toute question ou suggestion, consultez les issues GitHub du projet.

## 📄 Licence

Ce projet est open source. Libre d'utilisation et de modification.

---

**Créé avec ❤️ pour l'orientation et la reconversion professionnelle**

*"Cent pas vers un autre avenir"* - Votre parcours commence ici. 🚀
