// Base de données SQLite (module natif node:sqlite, Node >= 22.13)
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'escale-crm.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

-- Fiche client : champs du formulaire du site + "Nom de société/association"
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,                 -- Nom de société/association
  contact_name TEXT NOT NULL,        -- Votre nom
  email TEXT,                        -- Votre adresse e-mail
  phone TEXT,                        -- Téléphone
  event_duration TEXT,               -- Durée de l'événement
  participants TEXT,                 -- Nombre de participants
  services TEXT,                     -- Prestations attendues (séparées par des virgules)
  event_year TEXT,                   -- Date de votre événement : Année
  event_month TEXT,                  --                            Mois
  event_day TEXT,                    --                            Jour
  rgpd TEXT,                         -- RGPD
  message TEXT,                      -- Message éventuel
  extra_fields TEXT,                 -- Autres champs du formulaire (JSON) si le formulaire évolue
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manuel' CHECK (source IN ('formulaire','manuel')),
  email_message_id TEXT UNIQUE,      -- anti-doublon pour l'import des e-mails
  received_at TEXT,                  -- date de réception du formulaire
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,                          -- champ libre
  project_date TEXT,                         -- date de début (YYYY-MM-DD)
  project_end_date TEXT,                     -- date de fin
  quote_date TEXT,                           -- date du devis
  proposal_sent INTEGER NOT NULL DEFAULT 0,  -- proposition Escale envoyée
  proposal_sent_date TEXT,
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours','refuse','reporte','accepte')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES member_categories(id),
  town TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  positioned INTEGER NOT NULL DEFAULT 0,          -- Se positionne
  quote_received INTEGER NOT NULL DEFAULT 0,      -- Devis reçu
  quote_sent_to_client INTEGER NOT NULL DEFAULT 0,-- Devis transmis au client
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, member_id)
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('email','telephone','rencontre')),
  occurred_at TEXT NOT NULL,       -- date/heure de l'échange
  comment TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_client ON interactions(client_id);
`);

// --- Données initiales : catégories et membres Escale en Presqu'île ---
function seed() {
  const n = db.prepare('SELECT COUNT(*) AS n FROM member_categories').get().n;
  if (n > 0) return;
  const cats = ['Hébergement', 'Restauration & produits locaux', 'Activités, loisirs & patrimoine', 'Transport', 'Autre'];
  const insCat = db.prepare('INSERT INTO member_categories (name, sort_order) VALUES (?, ?)');
  const ids = {};
  cats.forEach((c, i) => { ids[c] = Number(insCat.run(c, i).lastInsertRowid); });

  const members = {
    'Hébergement': [
      ['Le Chevalier Gambette', 'Saint-Armel'], ['Hôtel Breizh du Golfe', 'Arzon'],
      ['Domaine de la Fontaine', 'Surzur'], ['Miramar La Cigale', 'Arzon'],
      ['La Croix du Sud', ''], ['La Pierre Bleue', ''], ["L'Abri-Côtier", ''],
      ['Manoir de Ker An Poul', ''],
    ],
    'Restauration & produits locaux': [
      ['Le Boucanier', ''], ['Bara Breizh', ''], ['Equinoxe', 'Pointe du Logeo'],
      ['Baudart-Lhéritier', ''], ['Malvern et Marcellin', ''],
    ],
    'Activités, loisirs & patrimoine': [
      ['Domaine de Suscinio', 'Sarzeau'], ["Celt'Aventures", 'Sarzeau'], ['Kerners Kayak', 'Arzon'],
      ['Krog E Barz', 'Port-Navalo'], ["Tch'îles", ''], ['Club Nautique du Rohu', ''],
      ['Golf Bluegreen Rhuys Kerver', ''], ["Le Vélo d'Ewen", ''],
      ['Escapade en Terre Iodée', ''], ['AVB', ''],
    ],
    'Transport': [['Le Passeur des Îles', '']],
  };
  const insM = db.prepare('INSERT INTO members (name, category_id, town) VALUES (?, ?, ?)');
  for (const [cat, list] of Object.entries(members)) {
    for (const [name, town] of list) insM.run(name, ids[cat], town || null);
  }
}
seed();

module.exports = db;
