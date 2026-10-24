<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/DJALUMO-AGRO_couleur-fond-sombre.svg">
    <img src="brand/DJALUMO-AGRO_couleur.svg" alt="Djalumo Agro" width="340">
  </picture>
</p>

<h3 align="center">L'intelligence décisionnelle agricole pour l'Afrique</h3>

<p align="center">
  <a href="https://djalumo-agro.vercel.app"><b>Site en ligne</b></a> ·
  <a href="https://djalumo-agro.vercel.app/planner">Planificateur de saison</a> ·
  <a href="https://djalumo-agro.vercel.app/field">Preuves terrain</a> ·
  <a href="docs/TECHNICAL.fr.md">Documentation technique</a> ·
  <a href="README.md">English</a>
</p>

<p align="center"><img src="docs/screenshots/hero.jpg" alt="Page d'accueil de Djalumo Agro : des champs africains aux marchés mondiaux" width="100%"></p>

Djalumo Agro transforme tout budget agricole, de 100 USD à plus d'un million, en un plan de saison chiffré et daté, puis relie la récolte aux marchés qui la paient : au Cameroun, en Afrique centrale et, par les ports de Douala et de Kribi, dans le monde entier.

Le projet est né d'un vrai pilote. De septembre 2024 à octobre 2025, j'ai conduit un pilote de production maraîchère à Foumbot, dans la région de l'Ouest du Cameroun. Chaque leçon difficile de cette saison, de l'eau comme coût caché au stress climatique et aux récoltes vendues sans emballage, est devenue une fonction de la plateforme.

| 12 | 162 | 73 | 17 | 2 |
| :---: | :---: | :---: | :---: | :---: |
| cultures dans le Planificateur de saison | sources référencées dans la base de connaissances | photographies terrain du pilote | corridors commerciaux sur la carte mondiale | langues, anglais et français |

## Le problème

Au Cameroun, un producteur ou un investisseur doit répondre à trois questions avant de planter : quoi cultiver, quelle surface son argent couvre réellement, et quand démarrer. Ces réponses viennent le plus souvent de l'habitude et du bouche-à-oreille. L'eau, la chaleur à la floraison, la pression des maladies et le prix à la récolte se découvrent pendant la saison, quand ils sont déjà des coûts.

## Ce que fait la plateforme

**Planificateur de saison.** On saisit un capital dans n'importe quelle devise, on choisit une culture, une situation en eau et une date de démarrage. Le planificateur donne la surface que couvre l'argent, un itinéraire technique daté, un budget ligne par ligne, une liste d'achats, le bilan hydrique, les risques de la période choisie, la trésorerie et quatre issues, de la bonne récolte à l'échec, chacune avec sa rentabilité et son prix d'équilibre. Il couvre les cultures à cycle court (tomate, haricot vert, poivron, piment, concombre, courgette), à cycle long (manioc, plantain, ananas) et les vergers (avocatier, cacaoyer, palmier à huile).

<p align="center"><img src="docs/screenshots/season-planner.jpg" alt="Planificateur de saison : verdict, chiffres clés et issues d'une saison de tomate" width="100%"></p>

**Corridors commerciaux mondiaux.** Une carte interactive suit la production depuis la zone de Foumbot jusqu'aux ports de Douala et de Kribi, puis vers l'Afrique centrale, de l'Ouest et de l'Est, l'Europe, le Moyen-Orient, la Chine, les États-Unis et l'Amérique du Sud. Les flux qui existent aujourd'hui et les corridors d'export visés sont présentés et légendés séparément.

<p align="center"><img src="docs/screenshots/world-map.jpg" alt="Carte mondiale interactive des corridors commerciaux depuis Foumbot" width="100%"></p>

**Preuves terrain.** Soixante-treize photographies, réunies en huit planches, de la plantation familiale du fondateur en 2021 à la relance du site principal du pilote en 2025, chacune avec sa légende, sa date et ce que la saison a appris.

<p align="center"><img src="docs/screenshots/field-evidence.jpg" alt="Preuves terrain : planche du pilote avec ses légendes" width="100%"></p>

**Rapport PDF premium.** Un visiteur peut demander un rapport de 12 à 15 pages sur son plan. Il est produit sur le serveur par le même moteur et n'est envoyé qu'après relecture et validation par l'équipe Djalumo Agro.

## Méthode : le cadre PACE

Le projet suit le cadre PACE du certificat professionnel Google Advanced Data Analytics.

| Étape | Ce qui a été fait |
| --- | --- |
| **Plan** (Planifier) | Formuler les décisions qu'un producteur ou un investisseur doit prendre avant une saison, à partir des problèmes rencontrés sur le terrain : marché, sol, climat, eau et prix. Définir les utilisateurs : petits producteurs dès 100 USD, coopératives, investisseurs de l'agro-industrie et acheteurs. |
| **Analyze** (Analyser) | Réunir et documenter 162 sources : fiches techniques et budgets du ministère de l'Agriculture du Cameroun (MINADER), méthodes de la FAO, guides d'instituts de recherche, enquêtes régionales sur le prix des intrants et relevés datés des prix de marché de 2017 à 2026. Construire un profil climatique mensuel de Foumbot et un indice saisonnier des prix. |
| **Construct** (Construire) | Bâtir un moteur de décision transparent : besoin en eau des cultures selon la méthode FAO-56 (évapotranspiration de référence de Hargreaves, coefficients culturaux, pluie fiable), réponse du rendement au déficit hydrique selon FAO-33, modèle de coûts à l'hectare, dimensionnement de la parcelle par dichotomie avec une réserve de 10 %, quatre issues pondérées par leur probabilité, analyse du point mort, trésorerie et délai de retour pour les cultures longues, et lecture des risques pour les douze mois de démarrage. |
| **Execute** (Exécuter) | Livrer un site bilingue de 14 pages avec le planificateur, la carte, les preuves terrain, des formulaires sécurisés, un backend PostgreSQL et des rapports PDF validés, couverts par des tests automatisés. Chaque chiffre affiché renvoie à sa source ; les valeurs sans source sont présentées comme des hypothèses. |

## Compétences mises en œuvre

* Collecte, documentation et nettoyage de données publiques, institutionnelles et de terrain
* Modélisation analytique : bilan hydrique, réponse du rendement, analyse de scénarios, point mort et trésorerie
* Visualisation de données : cartes et graphiques interactifs construits avec les projections géographiques D3
* Python pour les chaînes de traitement des données (base de connaissances, traitement des photos)
* JavaScript et Node.js, SQL et PostgreSQL, tests automatisés
* Vision produit et communication bilingue pour les producteurs, les partenaires et les investisseurs

## Honnêteté des données

Le planificateur ne présente jamais des données simulées comme réelles. Il affiche ses sources, signale les valeurs calculées et les hypothèses, et laisse un prix vide quand aucune référence fiable n'existe, en demandant au producteur un prix local plutôt que de le deviner. Aujourd'hui, le moteur repose sur des règles et des sources. Les modèles prédictifs viendront quand le pilote de 2027 aura produit nos propres données de terrain.

## Pensé pour le mobile

<img src="docs/screenshots/mobile.jpg" alt="Djalumo Agro sur un téléphone" width="200" align="right">

Beaucoup de producteurs accèdent à internet avec un téléphone d'entrée de gamme et un réseau lent. Le site n'utilise aucun framework au chargement, ne télécharge aucune police web et s'adapte aux petits écrans comme aux connexions lentes. Une version installable et une application Android sont les prochaines étapes.

<br clear="right">

## Feuille de route

| Quand | Étape |
| --- | --- |
| Fin 2026 | Nom de domaine propre, application web installable, application Android et test fermé sur Google Play |
| Début 2027 | Outils de collecte de données terrain, enquête de référence auprès des producteurs de Foumbot, relevé hebdomadaire des prix de marché |
| Mars 2027 | Relance du pilote de Foumbot, avec des données collectées saison après saison |
| Ensuite | Notebooks d'analyse en Python, premiers modèles prédictifs des rendements et des prix, nouvelles cultures et nouvelles régions |

## Technologies

Site statique généré à partir de modules JavaScript simples, fonctions serverless Node.js sur Vercel, validation Zod, PostgreSQL (Neon), projections géographiques D3 et TopoJSON, PDFKit, Python pour la préparation des données. L'architecture, les sources de données, les variables d'environnement et le déploiement sont décrits dans la [documentation technique](docs/TECHNICAL.fr.md).

## Auteur

**Franck Junior Djandja Tomwa**, fondateur et porteur du projet Djalumo Agro.\
Ingénieur en télécommunications · Analyste de données · Chargé des opérations internationales.\
Certificat professionnel Google Advanced Data Analytics (2026) et certificat professionnel Google Data Analytics (2025).

GitHub : [@franckdjandja](https://github.com/franckdjandja)

## Licence

Copyright © 2026 Franck Junior Djandja Tomwa. Tous droits réservés. Ce dépôt est public afin que le travail puisse être vu et évalué ; il n'est pas open source. Voir [LICENSE](LICENSE).
