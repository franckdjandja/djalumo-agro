# AfriFarm Intelligent · Site web et plateforme de formulaires

[English](README.md) · **Français**

La vitrine numérique d’AfriFarm Intelligent, plateforme d’intelligence décisionnelle agricole qui transforme tout budget, de 10 USD à plus d’un million, en un Plan de saison chiffré. Le site est bilingue (anglais d’abord, français ensuite), fonctionne sur les réseaux mobiles lents et dispose d’un vrai backend pour les demandes de contact, de démo et la lettre d’information.

Porteur du projet : Franck Junior Djandja Tomwa · Zone pilote : Foumbot, Ouest Cameroun.

## Contenu

| Domaine | Rôle |
| --- | --- |
| Site | 12 pages (Accueil, Plateforme, Intelligence, Solutions, Données, Impact, À propos, Contact, Demander une démo, Lettre d’information, Confidentialité, Conditions) et une page 404, adresses propres, anglais et français |
| Simulateur de saison | Démo interactive : capital en six devises, budget d’abord ou culture d’abord, calendrier cultural, répartition du budget, carte des risques par mois de démarrage, indice de confiance. Clairement signalée comme illustrative |
| Carte géographique | Carte de l’Afrique avec couches (couverture des données publiques, zone pilote, expansion prévue), survol, sélection, zoom, déplacement, pincement |
| Graphiques | Chiffres sourcés des terres et de l’irrigation au Cameroun, profondeur temporelle des données publiques, feuille de route avec jalons, explorateur d’architecture |
| Formulaires | Contact, demande de démo, lettre d’information : validation côté client et serveur, pot de miel, piège temporel, limitation de débit, Cloudflare Turnstile en option, consentement |
| Backend | `POST /api/contact`, `POST /api/demo`, `POST /api/newsletter`, `GET /api/unsubscribe`, `GET /api/health` |
| Base de données | Schéma PostgreSQL avec statuts, horodatages, index, table d’audit et table des comptes administrateurs, prêt pour un futur `/admin` |
| Courriels | Couche de notification pour Resend ou Brevo, sélectionnée par variable d’environnement |
| Mesure d’audience | Couche d’événements indépendante du fournisseur ; adaptateurs Plausible ou GA4 activés seulement s’ils sont configurés |

## Technologies

Site statique généré à partir de modules JavaScript simples (aucun framework au chargement, environ 150 Ko compressés, données cartographiques comprises), fonctions serverless Node 20, validation Zod, pilote `postgres` avec requêtes paramétrées. Hébergement cible : Vercel (tout hébergeur Node fonctionne avec `scripts/serve.mjs`).

La plateforme produit proprement dite (modèles, API, application mobile) suit l’architecture du rapport produit : Python, FastAPI, PostgreSQL avec PostGIS, Flutter et Next.js. Ce dépôt est le site de l’entreprise.

## Structure du dépôt

```
api/                 points d’accès serverless (un fichier par route)
lib/                 configuration, validation, sécurité, base de données, e-mails, synchronisation newsletter, gestionnaires
db/schema.sql        schéma PostgreSQL (rejouable)
site/src/            sources du site : i18n.js (tout le contenu, EN et FR), core.js, viz.js, pages.js, analytics.js, styles.css
site/template.html   gabarit HTML, métadonnées, données structurées
site/geo.json        géométrie de l’Afrique générée par scripts/geo.mjs
site/img/            photographies de terrain optimisées (WebP)
site/build.mjs       construction : production (public/) ou aperçu en un seul fichier (dist-artifact/)
scripts/             migrate.mjs, serve.mjs, geo.mjs
tests/               tests unitaires, tests des points d’accès, tests d’intégration PostgreSQL
```

## Lancer en local

```bash
npm install
cp .env.example .env            # renseigner au minimum DATABASE_URL
npm run db:migrate              # crée les tables
npm run build                   # génère public/
node --env-file=.env scripts/serve.mjs   # http://localhost:3000
```

Avec l’outil Vercel, `npm run dev` remplace `scripts/serve.mjs`.

## Déployer

1. Importer le dépôt dans Vercel. La commande de construction et le dossier de sortie sont définis dans `vercel.json`. Le site est en ligne à l’adresse `votre-projet.vercel.app`, détectée automatiquement, sans `SITE_URL`.
2. Dans le projet Vercel, ouvrir Storage et créer une base PostgreSQL Neon reliée au projet. Elle fournit `DATABASE_URL`.
3. Redéployer : chaque construction applique `db/schema.sql` automatiquement (rejouable), les tables sont donc créées sans aucune manipulation.
4. Ajouter les variables facultatives de `.env.example` (courriels, Turnstile, `RATE_LIMIT_SALT`). Avec votre propre domaine, régler aussi `SITE_URL` et `ALLOWED_ORIGINS`.
5. Vérifier `https://votre-domaine/api/health` : la réponse doit contenir `"database":"ok"`.

## Variables d’environnement

| Variable | Utilisée par | Rôle |
| --- | --- | --- |
| `SITE_URL` | construction, serveur | Adresses canoniques, plan du site, liens de désinscription |
| `DATABASE_URL` | serveur | Connexion PostgreSQL |
| `ALLOWED_ORIGINS` | serveur | Origines autorisées à envoyer vers `/api` |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | serveur | Notifications (`resend`, `brevo`, `console`, `none`) |
| `CONTACT_NOTIFICATION_EMAIL` | serveur | Destinataires de « New AfriFarm website inquiry » et « New Demo Request » |
| `NEWSLETTER_NOTIFY`, `NEWSLETTER_SEND_CONFIRMATION` | serveur | Alerte interne et confirmation à l’abonné, en option |
| `NEWSLETTER_PROVIDER`, `NEWSLETTER_PROVIDER_KEY`, `NEWSLETTER_LIST_ID` | serveur | Synchronisation optionnelle avec Brevo ou Mailchimp |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | construction / serveur | Vérification Cloudflare Turnstile |
| `RATE_LIMIT_SALT` | serveur | Sel du hachage des clients (aucune adresse IP brute n’est stockée) |
| `FORM_MIN_FILL_MS` | serveur | Seuil du piège temporel |
| `ANALYTICS_PROVIDER`, `ANALYTICS_ID` | construction | `plausible` (domaine) ou `ga4` (identifiant de mesure) |

Les secrets ne sont lus que sur le serveur. Le navigateur ne reçoit que `SITE_URL`, la clé publique Turnstile et les réglages de mesure d’audience.

## Cycle d’une requête

`méthode → origine → type de contenu → taille (16 Ko) → limitation de débit → validation du schéma → pot de miel et piège temporel → Turnstile → base de données → notification → réponse`

* Les erreurs de validation renvoient `422` avec le nom des champs invalides ; le formulaire les signale.
* Les robots qui remplissent le pot de miel ou envoient trop vite reçoivent un `200` normal et rien n’est stocké.
* Limites : 5 demandes de contact ou de démo et 8 inscriptions par client et par tranche de 10 minutes, partagées entre instances via PostgreSQL.
* Un courriel en échec ne fait jamais perdre un envoi : l’enregistrement est stocké d’abord.
* Les erreurs n’exposent jamais d’informations internes : `{"status":"error","error":"server_error"}`.

## Base de données

Tables : `contact_inquiries`, `demo_requests`, `newsletter_subscribers`, `rate_limits`, `admin_users`, `submission_events`. Statuts : `NEW`, `CONTACTED`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`. Les listes déroulantes sont stockées sous forme de codes indépendants de la langue (par exemple `subject = PILOT`, `interest = FOUMBOT_PILOT`), prêts pour un CRM ou un tableau d’administration.

### Préparation de l’administration

Un futur espace `/admin` demandera : une authentification par un fournisseur d’identité (Auth.js, Clerk ou Supabase Auth) reliée à `admin_users`, des requêtes de liste et de filtre sur les colonnes indexées `status` et `created_at`, un export CSV, et l’écriture des changements de statut dans `submission_events`. Aucun point d’accès public ne lit les envois aujourd’hui.

## Contenu et langues

Chaque texte visible se trouve dans `site/src/i18n.js`, en deux objets parallèles : `en` (référence) et `fr`. Pour ajouter le swahili, copier l’objet `en` sous le nom `sw`, le traduire et ajouter un bouton au sélecteur de langue. Les modèles de contenu (solutions, modules, sources de données, indicateurs, feuille de route, jalons) sont des tableaux du même fichier et pourront plus tard venir d’un CMS sans tête.

## Mesure d’audience

`window.AfriFarmAnalytics` met en file les événements : `page_view`, `cta_click`, `sim_run`, `sim_window`, `map_select`, `map_layer`, `arch_select`, `persona_select`, `form_submitted`, `form_invalid`, `form_error`, `language_change`. Rien n’est envoyé tant qu’aucun fournisseur n’est configuré. Pour en brancher un autre :

```js
AfriFarmAnalytics.use({ track: (e) => monFournisseur.capture(e.name, e.props) });
```

En activant un fournisseur, ajouter son domaine à la politique de sécurité du contenu dans `vercel.json` et utiliser un bandeau de consentement là où la loi l’exige (GA4 dans l’Union européenne, par exemple). Plausible n’utilise pas de cookies.

## Tests

```bash
npm test                                                   # tests de validation et des points d’accès
TEST_DATABASE_URL=postgres://... npm test                  # ajoute les tests d’intégration PostgreSQL
```

## Version d’aperçu en un seul fichier

`npm run build:artifact` produit une version du site en un seul fichier, utilisée pour les aperçus privés. Dans cette version, les formulaires sont enregistrés dans le stockage propre de l’aperçu au lieu de `/api`.

## Honnêteté des données

Le site ne présente jamais de données simulées comme réelles. Le Simulateur de saison utilise le classeur budgétaire du pilote (10 000 USD par hectare et par cycle), des règles saisonnières simplifiées et des taux de change indicatifs fixes, tous indiqués à l’écran. Les fourchettes de rendement et de revenu restent verrouillées tant que les modèles ne battent pas leur référence sur des années jamais vues. Les statistiques citées renvoient à leurs sources.

## Avant la mise en ligne

* Confirmer les coordonnées à publier (adresse électronique, téléphone), le cas échéant.
* Créer la structure juridique et la nommer dans la politique de confidentialité.
* Valider le registre et les légendes des photographies.

© 2026 AfriFarm Intelligent. Tous droits réservés.
