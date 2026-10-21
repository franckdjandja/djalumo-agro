# Djanova Agro · Site web et plateforme de formulaires

[English](README.md) · **Français**

La vitrine numérique de Djanova Agro, plateforme d’intelligence décisionnelle agricole qui transforme tout budget, de 100 USD à plus d’un million, en un Plan de saison chiffré. Le site est bilingue (anglais d’abord, français ensuite), fonctionne sur les réseaux mobiles lents et dispose d’un vrai backend pour les demandes de contact, de démo et la lettre d’information.

Porteur du projet : Franck Junior Djandja Tomwa · Zone pilote : Foumbot, Ouest Cameroun.

## Contenu

| Domaine | Rôle |
| --- | --- |
| Site | 14 pages (Accueil, Planificateur de saison, Preuves terrain, Plateforme, Intelligence, Solutions, Données, Impact, À propos, Contact, Demander une démo, Lettre d’information, Confidentialité, Conditions) et une page 404, adresses propres, anglais et français |
| Carte mondiale des corridors | Pièce centrale de l’accueil : carte du monde en points avec des flux animés depuis la zone de production de Foumbot vers les ports de Douala et de Kribi, puis vers l’Afrique centrale, de l’Ouest et de l’Est, l’Europe, le Moyen-Orient, la Chine, les États-Unis et l’Amérique du Sud. Filtre par corridor, détails au survol, zoom et déplacement, distances maritimes, encart « du champ au port » sur le Cameroun et quatre chiffres sourcés sur les ports et l’export |
| Preuves terrain | 73 photographies du pilote en 8 planches (planches, légendes et lectures du rapport), chaque planche reliée à sa phase, à son problème terrain et à la fonction correspondante du Planificateur ; archives terrain, dates issues des métadonnées, visionneuse plein écran au clavier et au balayage |
| Planificateur de saison v2 | En entrée : capital (dès 100 USD, six devises), culture, situation en eau et date de démarrage. En sortie : taille de la parcelle, itinéraire technique daté, budget ligne par ligne, liste d’achats, bilan hydrique, risques, comparaison des mois de démarrage et quatre issues (bonne, moyenne, faible, échec). Chaque chiffre renvoie à sa source |
| Carte des données en Afrique | Page Données : carte de l’Afrique avec couches (couverture des données publiques, zone pilote, expansion prévue), survol, sélection, zoom, déplacement, pincement |
| Graphiques | Chiffres sourcés des terres et de l’irrigation au Cameroun, profondeur temporelle des données publiques, feuille de route avec jalons, explorateur d’architecture |
| Formulaires | Contact, demande de démo, lettre d’information : validation côté client et serveur, pot de miel, piège temporel, limitation de débit, Cloudflare Turnstile en option, consentement |
| Backend | `POST /api/contact`, `POST /api/demo`, `POST /api/newsletter`, `GET /api/unsubscribe`, `GET /api/health` |
| Base de données | Schéma PostgreSQL avec statuts, horodatages, index, table d’audit et table des comptes administrateurs, prêt pour un futur `/admin` |
| Courriels | Couche de notification pour Resend ou Brevo, sélectionnée par variable d’environnement |
| Mesure d’audience | Couche d’événements indépendante du fournisseur ; adaptateurs Plausible ou GA4 activés seulement s’ils sont configurés |

## Technologies

Site statique généré à partir de modules JavaScript simples (aucun framework au chargement, environ 270 Ko compressés, données cartographiques et base de connaissances du Planificateur comprises), fonctions serverless Node 20, validation Zod, pilote `postgres` avec requêtes paramétrées. Hébergement cible : Vercel (tout hébergeur Node fonctionne avec `scripts/serve.mjs`).

La plateforme produit proprement dite (modèles, API, application mobile) suit l’architecture du rapport produit : Python, FastAPI, PostgreSQL avec PostGIS, Flutter et Next.js. Ce dépôt est le site de l’entreprise.

## Structure du dépôt

```
api/                 points d’accès serverless (un fichier par route)
lib/                 configuration, validation, sécurité, base de données, e-mails, synchronisation newsletter, gestionnaires
db/schema.sql        schéma PostgreSQL (rejouable)
site/src/            sources du site : i18n.js et i18n-v3.js (tout le contenu, EN et FR), core.js, viz.js, world.js (carte des corridors),
                     field.js (preuves terrain et visionneuse), pages.js, analytics.js, styles.css
site/src/engine.cjs  moteur du Planificateur (fonctions pures, exécutées dans le navigateur et dans les tests Node)
site/src/planner.js  interface du Planificateur
site/data/kb.json    base de connaissances lue par le moteur (générée, ne pas modifier à la main)
data/research/       notes de recherche par culture et sur les coûts au Cameroun, avec toutes les sources
scripts/kb/          build_kb.py : transforme les notes de recherche en site/data/kb.json
site/template.html   gabarit HTML, métadonnées, données structurées
site/geo.json        géométrie de l’Afrique générée par scripts/geo.mjs
site/geo-world.json  carte du monde en points, corridors et encart Cameroun générés par scripts/geo-world.mjs
site/img/field/      73 photographies de terrain en deux tailles (WebP), produites par scripts/photos/build_photos.py
site/data/photos.json  dimensions, planche, lettre et date de chaque photographie (générées)
data/field/          manifest.json : fichier d’origine, planche et lettre de chaque photographie
site/img/            autres photographies optimisées (WebP)
site/build.mjs       construction : production (public/) ou aperçu en un seul fichier (dist-artifact/)
scripts/             migrate.mjs, serve.mjs, geo.mjs, geo-world.mjs, photos/
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
| `CONTACT_NOTIFICATION_EMAIL` | serveur | Destinataires de « New Djanova Agro website inquiry » et « New Demo Request » |
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

`window.DjanovaAnalytics` met en file les événements : `page_view`, `cta_click`, `planner_run`, `planner_tab`, `planner_window`, `map_select`, `map_layer`, `arch_select`, `persona_select`, `form_submitted`, `form_invalid`, `form_error`, `language_change`. Rien n’est envoyé tant qu’aucun fournisseur n’est configuré. Pour en brancher un autre :

```js
DjanovaAnalytics.use({ track: (e) => monFournisseur.capture(e.name, e.props) });
```

En activant un fournisseur, ajouter son domaine à la politique de sécurité du contenu dans `vercel.json` et utiliser un bandeau de consentement là où la loi l’exige (GA4 dans l’Union européenne, par exemple). Plausible n’utilise pas de cookies.

## Tests

```bash
npm test                                                   # tests de validation et des points d’accès
TEST_DATABASE_URL=postgres://... npm test                  # ajoute les tests d’intégration PostgreSQL
```

## Version d’aperçu en un seul fichier

`npm run build:artifact` produit une version du site en un seul fichier, utilisée pour les aperçus privés. Dans cette version, les formulaires sont enregistrés dans le stockage propre de l’aperçu au lieu de `/api`.

## Planificateur de saison : méthode et données

Le planificateur répond à une question pour un producteur ou un investisseur : que devient ce capital en une saison de cette culture, ici, à partir de cette date ?

**Méthode, dans l’ordre** (`site/src/engine.cjs`) :

1. Calendrier : pépinière, repiquage ou semis direct, floraison, première et dernière récolte.
2. Bilan hydrique (FAO-56) : évapotranspiration de référence par Hargreaves à partir du climat mensuel de Foumbot, coefficients culturaux sur quatre stades, pluie efficace (formule FAO/AGLW), besoin d’irrigation.
3. Réponse du rendement à l’eau (FAO-33) : le rendement baisse avec la part du besoin que l’option d’eau choisie ne couvre pas.
4. Saison : une culture dont le besoin est surtout couvert par la pluie utilise les références de saison des pluies ; sinon celles de saison sèche irriguée.
5. Coûts par hectare selon l’itinéraire standard : intrants × prix unitaires, main d’œuvre × salaire, services, coûts de l’eau. L’équipement qui dure plusieurs saisons est acheté au départ et réparti sur sa durée de vie dans la marge.
6. Dimensionnement : la plus grande parcelle dont les coûts et l’équipement tiennent dans le capital après une réserve de 10 % (bissection exacte), ou le capital nécessaire pour une surface donnée.
7. Quatre issues, d’une bonne récolte à l’échec, avec rentabilité sur les coûts, rendement et prix d’équilibre, et marge pondérée par les risques.
8. Risques de la période : eau, chaleur à la floraison, pression des maladies selon la pluie, niveau de prix à la récolte ; le même calcul pour les douze mois de démarrage.

**Données** (`data/research/`, intégrées à `site/data/kb.json` par `scripts/kb/build_kb.py`) :

| Culture | Itinéraire | Rendements | Prix à la récolte |
| --- | --- | --- | --- |
| Tomate | Fiche et budget MINADER 2024 pour le Cameroun, essais à Dschang et à l’Est | Fourchettes MINADER par saison | 275 FCFA/kg bord champ (Dschang 2024), indice saisonnier tiré d’observations de marché datées 2017 à 2026 |
| Haricot vert, poivron, concombre, courgette | Fiche camerounaise et enquête de Foumbot pour le poivron ; guides COLEAD, PROTA, AVRDC, du Kenya et du Bénin | Moyennes nationales du Cameroun quand elles existent, références régionales sinon | Aucun prix bord champ publié au Cameroun : le producteur saisit son prix attendu et voit d’abord le prix d’équilibre |

Les prix des intrants viennent du budget tomate du MINADER 2024, de l’enquête du MINADER sur les marchés d’intrants de la Région de l’Ouest (Foumbot, 4e trimestre 2022), des prix du carburant en vigueur en octobre 2026 et, faute de prix camerounais, d’annonces signalées des marchés voisins. Les taux de change sont ceux de la BCEAO au 16 octobre 2026.

**Règles.** Chaque valeur porte les identifiants de ses sources, affichés à l’écran à côté de chaque ligne de budget et de chaque étape. Les valeurs calculées sont signalées comme dérivées. Les valeurs sans source sont des hypothèses de Djanova Agro, listées dans l’onglet Sources. Un prix manquant n’est jamais deviné : la ligne garde sa quantité, coûte zéro et est signalée pour un devis local. La confiance est indiquée par culture et par bloc de données.

Pour mettre les données à jour : modifier ou compléter les notes de recherche, ajuster `scripts/kb/build_kb.py`, puis lancer `python3 scripts/kb/build_kb.py` et `npm test`.

## Système graphique (v4) et carte mondiale

L’interface adopte une lecture émeraude épurée : une page vert émeraude clair (`#EDF6F1`), des bandeaux émeraude profond (`#0A3D2E`) pour l’en-tête, les ouvertures de page, la carte de la lettre d’information et le pied de page, des surfaces blanches aux ombres douces, et un seul accent doré pour la zone de production. Aucune étiquette, aucun numéro ni aucun trait au-dessus des titres. La police est celle de chaque plateforme : SF Pro sur les appareils Apple, Segoe UI sous Windows, Roboto sous Android ; le site se lit comme une application native et ne charge aucune police web. Tous les jetons sont en tête de `site/src/styles.css`.

La carte mondiale (`site/src/world.js`) dessine les terres en points à partir de Natural Earth 1:110m ; les points sont des traits de longueur nulle, ils gardent donc leur taille à tout niveau de zoom, et les contours apparaissent quand on zoome. Les corridors sont de deux natures, signalées partout : **flux actuels** (Cameroun et Afrique centrale, flux de marché documentés) et **corridors d’export visés** (l’objectif de Djanova Agro, pas des ventes actuelles). Les routes maritimes suivent des points de passage indicatifs sur les routes habituelles (golfe de Guinée, Canaries, Gibraltar ou la Manche, cap de Bonne-Espérance, canal du Mozambique, détroit de Malacca) ; les distances sont des longueurs orthodromiques entre ces points et les jours de mer supposent 14 nœuds, hors escales et transbordements. Régénérer avec `npm run geo:world`.

Chiffres sourcés de la carte : trafic des ports du Cameroun en 2025 et part de Douala (ministère des Transports via EcoMatin, janvier 2026), tirant d’eau de Kribi (WFP Logistics Cluster), exportations de bananes en 2024 (Assobacam via Business in Cameroon), flux régionaux de légumes vers le Gabon, la Guinée équatoriale, la Centrafrique et le Tchad (Afrik.com, octobre 2026) et corridor Transcameroun (Business in Cameroon, mai 2026).

## Preuves terrain (v3)

`data/field/manifest.json` relie chacune des 73 photographies à son fichier d’origine, à sa planche et à sa lettre. Les huit planches et leurs légendes viennent du Rapport de concept et de conception produit ; les photographies d’archives ont leur propre légende. Les phases sont attribuées d’après les descriptions du fondateur ; les dates proviennent des métadonnées des fichiers lorsqu’elles y figurent et sont présentées comme telles. Pour reconstruire les images à partir des originaux : `npm run photos -- <dossier des originaux>`.

## Honnêteté des données

Le site ne présente jamais de données simulées comme réelles. Le Planificateur de saison affiche ses sources, ses valeurs dérivées et ses hypothèses, et laisse le prix vide quand aucune référence fiable n’existe. Les taux de change sont fixes, pas en temps réel. Les statistiques citées renvoient à leurs sources.

## Avant la mise en ligne

* Confirmer les coordonnées à publier (adresse électronique, téléphone), le cas échéant.
* Créer la structure juridique et la nommer dans la politique de confidentialité.
* Valider le registre et les légendes des photographies.

© 2026 Djanova Agro. Tous droits réservés.
