# CRM Escale en Presqu'île

Application web multi-utilisateur de suivi des demandes clients et des projets pour l'association **Escale en Presqu'île**.

## Fonctionnalités

| Écran | Contenu |
|---|---|
| **Suivi des projets** | Liste de tous les projets, filtres *En cours / Accepté / Refusé / Reporté*, filtre de période sur la **date du projet** ou la **date du devis**, recherche, compteurs de membres positionnés / devis reçus / devis transmis. |
| **Calendrier** | Vue mensuelle, projets placés sur leurs dates avec un code couleur : 🟡 à traiter, 🟠 devis envoyés, 🔴 proposition refusée, 🟢 devis signé (⚪ gris : reporté). |
| **Fiches clients** | Création automatique depuis les e-mails du formulaire du site, création manuelle, import d'un e-mail par copier-coller. Tous les champs du formulaire + **Nom de société/association** + notes internes. |
| **Fiche client** | Champs modifiables, projets du client, **historique des échanges** (e-mail, téléphone, rencontre) horodatés et commentés. |
| **Projet** | **Description du projet** (champ libre), dates, date du devis, **proposition Escale envoyée** (+ date), **statut** (en cours, refusé, reporté, accepté), liste des **membres triés par type d'activité** avec la case *Se positionne* et les interrupteurs *Devis reçu* / *Devis transmis au client*. |
| **Répertoire contacts** | Tous les contacts clients, liens e-mail / téléphone, export CSV (Excel). |
| **Membres Escale** | Ajouter, modifier, désactiver ou supprimer des membres ; gérer les types d'activité. Pré-rempli avec les 24 membres. |
| **Utilisateurs** | Réservé aux administrateurs : création, suppression, rôle, réinitialisation du mot de passe. |

### Code couleur (calcul automatique)

1. Statut **Refusé** → rouge
2. Statut **Accepté** → vert (devis signé)
3. Statut **Reporté** → gris
4. Sinon, si la *proposition Escale* est envoyée **ou** qu'un devis a été transmis au client → orange
5. Sinon → jaune (à traiter)

## Technologie

- **Node.js ≥ 22.13** + **Express** : serveur et API
- **SQLite** (module `node:sqlite` intégré à Node) : un seul fichier de base de données, aucun serveur à administrer, sauvegarde par simple copie du fichier
- Interface en HTML / CSS / JavaScript sans framework
- Import Gmail par **IMAP** (`imapflow` + `mailparser`)
- Mots de passe hachés (scrypt), sessions par cookie HttpOnly

## Installation locale

```bash
cd escale-crm
npm install
cp .env.example .env    # puis compléter le fichier
npm start
```

Ouvrir http://localhost:3000. Au premier démarrage, un compte administrateur est créé avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` (sinon un mot de passe aléatoire s'affiche dans la console).

## Import automatique des formulaires Gmail

L'application lit la boîte Gmail en IMAP toutes les 5 minutes et crée une fiche client + un projet pour chaque e-mail **« Nouvel envoi de formulaire »** envoyé par `info@escaleenpresquile.bzh`. Un e-mail n'est jamais importé deux fois.

1. Activer la validation en deux étapes sur le compte Google.
2. Créer un **mot de passe d'application** : https://myaccount.google.com/apppasswords
3. Renseigner dans `.env` : `IMAP_USER` (l'adresse Gmail) et `IMAP_PASSWORD` (le mot de passe d'application).
4. `IMAP_SINCE=2026-01-01` permet de reprendre l'historique des demandes au premier lancement.

Champs reconnus : nom, e-mail, téléphone, durée, nombre de participants, prestations attendues, date (année / mois / jour), RGPD, message, société. Si le formulaire du site évolue, les nouveaux champs sont conservés dans « Autres champs du formulaire » de la fiche. La date de l'événement devient la date du projet, la durée (« 2 jours ») sa date de fin.

Le bouton **↻ Vérifier la boîte mail** (écran Fiches clients) lance une vérification immédiate.

## Mise en ligne

L'application a besoin d'un serveur Node.js qui tourne en continu avec un disque persistant (GitHub Pages ne convient pas : il ne sert que des fichiers statiques).

**Avec Docker** (VPS OVH, Scaleway, Hetzner, NAS Synology…) :

```bash
cp .env.example .env    # compléter, avec COOKIE_SECURE=true derrière HTTPS
docker compose up -d --build
```

La base est dans `./data/escale-crm.sqlite` : **sauvegardez ce fichier régulièrement**. Placez l'application derrière un reverse proxy HTTPS (Caddy, Nginx, Traefik).

Autres hébergeurs possibles : Railway, Render ou Fly.io avec un volume persistant monté sur `/data`.

## Tests

```bash
npm test
```
