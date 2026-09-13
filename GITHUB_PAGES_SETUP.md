# 🚀 Configuration GitHub Pages

## 3 étapes simples pour publier votre site

### Étape 1️⃣ : Accéder aux paramètres

1. Allez sur votre repo GitHub : **https://github.com/Chaps-boop/Formos**
2. Cliquez sur l'onglet **Settings** (⚙️)
3. Dans le menu gauche, cherchez **Pages** ou allez directement à :
   👉 https://github.com/Chaps-boop/Formos/settings/pages

### Étape 2️⃣ : Configurer GitHub Pages

Vous devriez voir cette interface :

```
Build and deployment
    Source
    [ Deploy from a branch ] ← Sélectionnez ceci

    Branch
    [ main ]  [ / (root) ]  ← Sélectionnez main + root
    
    [Save]  ← Cliquez ici
```

**Configuration correcte :**
- **Source** : Deploy from a branch
- **Branch** : `main`
- **Folder** : `/ (root)`

### Étape 3️⃣ : Vérifier le déploiement

1. Attendez **1-2 minutes** pour le déploiement initial
2. Rechargez la page Settings → Pages
3. Vous devriez voir :
   
   ✅ "Your site is live at **https://chaps-boop.github.io/Formos/**"

### ✨ C'est tout !

Votre site est maintenant en ligne et déployé automatiquement à chaque push sur `main`.

---

## 📊 Suivi des déploiements

### Voir l'état du workflow

1. Allez à l'onglet **Actions** : https://github.com/Chaps-boop/Formos/actions
2. Cherchez le workflow **"Deploy to GitHub Pages"**
3. Chaque commit sur `main` déclenche un déploiement
4. Vous verrez ✅ ou ❌ selon le statut

### Dépanner si ça ne marche pas

**Problème** : "Your site is not published"
- Vérifiez que `main` est bien configuré (pas `master`)
- Attendez 2-3 minutes après le push

**Problème** : "Page not found"
- Vérifiez que le folder est `/ (root)` et non `/docs`
- Vérifiez que tous les fichiers HTML/CSS/JS sont pushés

**Problème** : Les styles/JS ne se chargent pas
- Vérifiez que vous accédez à : `https://chaps-boop.github.io/Formos/`
- Pas à `https://Formos.github.io/` ou autre

---

## 🔄 Workflow automatique

Chaque fois que vous pushez du code :

```
git push origin main
  ↓
GitHub Actions déclenché
  ↓
✓ Validation JSON
✓ Validation HTML
✓ Déploiement
  ↓
Site mis à jour en direct
```

Pas d'intervention requise ! 🎉

---

## 📚 Plus d'infos

- [GitHub Pages - Official Docs](https://docs.github.com/en/pages)
- [Troubleshooting GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-common-issues-with-github-pages)

---

**Besoin d'aide ?**
Consultez les Actions GitHub pour voir les logs d'erreur détaillés.
