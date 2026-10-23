// Wording of the PDF report and of the report emails, English and French.
// House rules: plain sentences, no long dashes, no dash bullets.

export const PROFILES = ['farmer', 'coop', 'investor', 'diaspora', 'student', 'other'];

export const T = {
  en: {
    kicker: 'Crop plan and financial study',
    headerTitle: 'Crop plan and financial study',
    preparedFor: 'Prepared for',
    reportNo: 'Report no.',
    issued: 'Issued on',
    dataVersion: 'Data updated on',
    dataVersionV: (v, d) => 'version ' + v + ' of ' + d,
    tagline: 'Rooted in Africa. Grown by light.',
    confidential: (name) => 'Personal document prepared for ' + name + ' from the settings entered in the Djalumo Agro simulator. Please do not circulate without consent.',
    footer: (name, ref) => 'Djalumo Agro  ·  Prepared for ' + name + '  ·  Report ' + ref,
    page: (i, n) => 'Page ' + i + ' of ' + n,
    profiles: { farmer: 'Farmer', coop: 'Cooperative or group', investor: 'Investor', diaspora: 'Diaspora project', student: 'Student or researcher', other: 'Project holder' },
    s: {
      summary: 'Summary', next: 'Before you start', inputs: 'Settings and assumptions', outcomes: 'The four outcomes', budget: 'Detailed budget',
      cash: 'Cash flow', itinerary: 'Dated technical itinerary', shopping: 'Shopping list', water: 'Water, climate and risks', sources: 'Sources, method and limits'
    },
    tiles: {
      area: 'Plot', plants: (n) => n + ' plants', capital: 'Capital needed', capitalSub: 'peak cash need and 10% reserve', budget: 'Season budget', budgetSub: 'including the 10% reserve',
      margin: 'Average margin', marginSeason: 'one season', marginPlan: (d) => 'over ' + d, breakEven: 'Break even price', breakEvenSub: 'at the average yield',
      payback: 'Payback', paybackSub: 'cumulative position turns positive', neverSub: 'the cumulative position stays negative', never: 'not within the plan', length: 'Plan length', season: 'Season length', best: 'Lowest risk start', bestSub: (s) => 'risk score ' + s + ' out of 8',
      perYear: (v) => v + ' a year on average', roi: (p) => p + ' on the costs'
    },
    dur: { months: (n) => n + ' months', years: (n) => n + ' years', weeks: (n) => n + ' weeks', yearsHalf: (m) => { const h = Math.round(m / 6) / 2; return (h % 1 ? String(h) : String(h | 0)) + ' years'; } },
    intro: (c) => 'This report prices ' + c.cropPhrase + ' project on ' + c.area + (c.plants ? ' (' + c.plants + ' plants)' : '') + (c.place ? ' in ' + c.place : '') + '. ' +
      (c.long ? 'Planting is set for ' + c.start + ' and the plan runs for ' + c.duration + '.' : 'The season starts on ' + c.start + ' and the last harvest ends on ' + c.end + '.') +
      ' ' + (c.mode === 'crop' ? 'The area was chosen first; the plan needs a capital of ' + c.capital + '.' : 'The plan is sized for an available capital of ' + c.capital + '.') +
      (c.first ? ' The first harvest is expected around ' + c.first.date + ', ' + c.first.when + ' after planting.' : '') +
      (c.product ? ' The harvest is sold as ' + c.product + '.' : ''),
    resultPriced: (c) => 'At the average yield and a price of ' + c.price + ' per ' + c.unit + ', the margin ' + (c.long ? 'over the plan' : 'for the season') + ' comes to ' + c.margin + ', a return of ' + c.roi + ' on the costs. The plan breaks even at ' + c.be + ' per ' + c.unit + '.',
    resultCash: (c) => 'Cash is lowest at ' + c.peak + ' in ' + c.peakMonth + (c.payback ? ' and the cumulative position turns positive in ' + c.payback + '.' : '; the cumulative position does not turn positive within the plan.'),
    resultUnpriced: (c) => 'No selling price was entered, so the report gives the break even price instead: ' + c.be + ' per ' + c.unit + ' at the average yield. Compare it with the prices buyers offer in your area.',
    resultRisk: (c) => 'The main point to watch is ' + c.risk + ' (' + c.level + ' level).',
    resultLowRisk: 'No risk reaches the medium level for this start date.',
    next: {
      price: (u) => 'Check the price per ' + u + ' with at least two buyers in your area before committing the capital.',
      quotes: (list) => 'Ask for a local quote for the lines the reference data does not price: ' + list + '.',
      water: (p) => 'Plan a backup water source: in the first months the chosen option covers about ' + p + ' of the crop needs.',
      best: (m, s, cur) => 'The lowest risk start month is ' + m + ' (score ' + s + ' out of 8); the chosen start scores ' + cur + '.',
      cash: (v, d) => 'Keep ' + v + ' available before the first sales, expected from ' + d + '.',
      soil: 'Have the soil analysed before the basal dressing, and adjust the doses in this plan to the result.',
      inputs: 'Buy seed, planting material and crop protection products from approved dealers, and keep the receipts.'
    },
    inputs: {
      capital: 'Available capital', mode: 'Approach', modeBudget: 'Budget first: the area follows the capital', modeArea: 'Area first: the capital follows the area', area: 'Area requested',
      crop: 'Crop', product: 'Product sold', ratio: (r) => r + ' of product per tonne of fresh harvest', price: 'Selling price', priceUser: 'entered by you', priceRef: 'Cameroon reference adjusted to the harvest months', priceNone: 'not entered',
      water: 'Water on the plot', start: 'Start date', startLong: 'Planting date', land: 'Land', market: 'Market', marketLocal: 'Local market', marketCity: 'City market',
      family: 'Family labour', familyV: (p) => p + ' of the labour days unpaid', tools: 'Own tools', yes: 'Yes', no: 'No', currency: 'Report currency', fx: (c, r) => 'conversion rate used: 1 ' + c + ' = ' + r + ' FCFA',
      location: 'Reference climate', locationV: 'Foumbot, West Cameroon (modelled 1991 to 2021)'
    },
    th: {
      outcome: 'Outcome', weight: 'Weight', yield: 'Yield', price: 'Price', sold: 'Sold', revenue: 'Sales', costs: 'Costs', margin: 'Margin', roi: 'Return',
      line: 'Line', qty: 'Quantity', unitPrice: 'Unit price', total: 'Total', src: 'Sources', year: 'Year', month: 'Month', net: 'Net', cum: 'Cumulative',
      dates: 'Dates', task: 'Operation', inputs: 'Inputs and labour', item: 'Item', category: 'Category', need: 'Need', packs: 'To buy', cost: 'Cost',
      etc: 'Crop need', rain: 'Useful rain', deficit: 'Deficit', risk: 'Risk', level: 'Level', detail: 'Detail', score: 'Score', start: 'Start'
    },
    outcomeNote: 'Yields come from the published references for this crop, adjusted to the water your option provides (FAO-33 yield response). The good and poor outcomes move the price by about 17%, the usual gap on one market within a month. The weights are indicative.',
    perUnit: (u) => 'per ' + u,
    yieldYear: 'per productive year', yieldCycle: 'per cycle',
    budgetNote: 'Quantities cover the whole plan for your area. Harvest, processing and transport lines follow the average outcome. Equipment that lasts several seasons is bought at the start; its life is shown in the line.',
    budgetNoteLong: 'Quantities cover the whole plan for your area. Early sales pay part of the later costs, so the capital needed is lower than the total cost of the plan.',
    toQuote: 'local quote', grand: 'Total cost of the plan', grandSeason: 'Season budget with reserve', reserve: 'Precautionary reserve (10%)', capitalNeeded: 'Capital needed: deepest cash need and reserve',
    bought: (n) => 'bought ' + n + ' times', lasts: (n) => 'lasts ' + n + ' seasons',
    cashIntro: 'Each cost is placed on the date of its step, water costs in the months that need water, equipment at the start and each sale over its harvest weeks. The lowest point of the curve is the cash to hold before sales arrive.',
    cashUnpriced: 'No selling price was entered: the curve shows the costs only.',
    cashLegend: ['Costs', 'Sales', 'Cumulative position'],
    peak: 'Deepest cash need', paybackL: 'Cumulative position positive from', endL: 'Position at the end of the plan', never: 'not within the plan',
    yearN: (n) => 'Year ' + n,
    occurrences: (n, e) => n + ' times, every ' + e + ' months',
    labourDays: (d) => d + ' labour days',
    harvestShare: (p) => p + ' of the adult yield',
    shopFirstYear: 'This list covers the first twelve months: establishment and first year care. Later purchases are in the budget.',
    shopSeason: 'Quantities are rounded up to the packs sold. Equipment is listed at the end.',
    waterIntro: (c) => 'The water balance follows FAO-56: reference evapotranspiration from the Foumbot climatology, crop coefficients by stage and useful rain. ' + c,
    waterCover: (p) => 'Your water option covers about ' + p + ' of the crop needs over the period shown.',
    waterVolume: (m3) => 'Irrigation water to bring: about ' + m3 + ' m³ for your area.',
    waterVolumePlan: (m3, y) => 'Irrigation water to bring: about ' + m3 + ' m³ over the plan for your area, or ' + y + ' m³ a year.',
    windowsLegend: 'Outlined: lowest risk start. Underlined: the start you chose.',
    waterOpt: { rainfed: 'Rain only, no water source or equipment', manual: 'Hand watering from a water source (well, river or tank)', existing: 'Irrigation already in place (motor pump or drip)', pump: 'Petrol motor pump, water tanks and watering cans bought at the start', drip: 'Drip kit and motor pump bought at the start' },
    landRent: 'Rented for the season', landRentLong: 'Rented for the length of the plan', landOwn: 'Own land',
    days: 'days', yieldUnitYear: 't/ha/year', yieldUnitCycle: 't/ha/cycle', yieldUnit: 't/ha', roiSub: (p) => 'return ' + p, perYearShort: (v) => v + ' a year',
    windowsIntro: 'Risk score by start month (0 is best, 8 is worst), with the same capital and water option.',
    risksIntro: 'Each risk is scored from the climate data, the crop calendar and the usual prices of the harvest months.',
    heatNA: 'This crop has no published heat threshold at flowering; the risk is not scored.',
    sourcesIntro: 'Every figure in this report comes from a dated public source or from a documented assumption. The references cited in this plan are listed below.',
    confidenceT: 'Confidence by block', assumptionsT: 'Assumptions',
    disclaimer: 'This report is a planning aid built from public references and from the settings you entered. It is not a guarantee of yield, price or profit. Weather, pests, input quality, prices and the work done on the plot change the result. Check the prices and quotes locally before committing money. Djalumo Agro is not responsible for decisions taken on the basis of this document.',
    method: 'Method: Djalumo Agro simulator, engine version 3 (FAO-56 water balance, FAO-33 yield response, monthly cash flow).',
    levels: ['Low', 'Medium', 'High'],
    conf: { high: 'High', medium: 'Medium', low: 'Low' },
    monthsAll: 'Month'
  },
  fr: {
    kicker: 'Plan de culture et étude financière',
    headerTitle: 'Plan de culture et étude financière',
    preparedFor: 'Préparé pour',
    reportNo: 'Rapport n°',
    issued: 'Émis le',
    dataVersion: 'Données à jour au',
    dataVersionV: (v, d) => 'version ' + v + ' du ' + d,
    tagline: 'Enraciné en Afrique, porté par la lumière.',
    confidential: (name) => 'Document personnel établi pour ' + name + ' à partir des réglages saisis dans le simulateur Djalumo Agro. Merci de ne pas le diffuser sans accord.',
    footer: (name, ref) => 'Djalumo Agro  ·  Préparé pour ' + name + '  ·  Rapport ' + ref,
    page: (i, n) => 'Page ' + i + ' sur ' + n,
    profiles: { farmer: 'Agriculteur', coop: 'Coopérative ou groupement', investor: 'Investisseur', diaspora: 'Projet de la diaspora', student: 'Étudiant ou chercheur', other: 'Porteur de projet' },
    s: {
      summary: 'Synthèse', next: 'Avant de démarrer', inputs: 'Réglages et hypothèses', outcomes: 'Les quatre issues', budget: 'Budget détaillé',
      cash: 'Trésorerie', itinerary: 'Itinéraire technique daté', shopping: 'Liste d’achats', water: 'Eau, climat et risques', sources: 'Sources, méthode et limites'
    },
    tiles: {
      area: 'Parcelle', plants: (n) => n + ' plants', capital: 'Capital nécessaire', capitalSub: 'pic de trésorerie et réserve de 10 %', budget: 'Budget de la saison', budgetSub: 'réserve de 10 % comprise',
      margin: 'Marge moyenne', marginSeason: 'sur une saison', marginPlan: (d) => 'sur ' + d, breakEven: 'Prix d’équilibre', breakEvenSub: 'au rendement moyen',
      payback: 'Retour sur investissement', paybackSub: 'position cumulée redevenue positive', neverSub: 'la position cumulée reste négative', never: 'pas dans la durée du plan', length: 'Durée du plan', season: 'Durée de la saison', best: 'Départ le moins risqué', bestSub: (s) => 'score de risque ' + s + ' sur 8',
      perYear: (v) => v + ' par an en moyenne', roi: (p) => p + ' sur les coûts'
    },
    dur: { months: (n) => n + ' mois', years: (n) => n + ' ans', weeks: (n) => n + ' semaines', yearsHalf: (m) => { const h = Math.round(m / 6) / 2, n = Math.floor(h); return n + (n > 1 ? ' ans' : ' an') + (h % 1 ? ' et demi' : ''); } },
    intro: (c) => 'Ce rapport chiffre un projet ' + c.cropPhrase + ' sur ' + c.area + (c.plants ? ' (' + c.plants + ' plants)' : '') + (c.place ? ', à ' + c.place : '') + '. ' +
      (c.long ? 'La plantation est prévue le ' + c.start + ' et le plan court sur ' + c.duration + '.' : 'La saison démarre le ' + c.start + ' et la dernière récolte se termine le ' + c.end + '.') +
      ' ' + (c.mode === 'crop' ? 'La surface a été fixée d’abord ; le plan demande un capital de ' + c.capital + '.' : 'Le plan est dimensionné pour un capital disponible de ' + c.capital + '.') +
      (c.first ? ' La première récolte est attendue vers ' + c.first.date + ', ' + c.first.when + ' après la plantation.' : '') +
      (c.product ? ' La récolte est vendue sous forme de ' + c.product + '.' : ''),
    resultPriced: (c) => 'Au rendement moyen et au prix de ' + c.price + ' par ' + c.unit + ', la marge ' + (c.long ? 'sur la durée du plan' : 'de la saison') + ' atteint ' + c.margin + ', soit une rentabilité de ' + c.roi + ' sur les coûts engagés. Le plan s’équilibre à ' + c.be + ' par ' + c.unit + '.',
    resultCash: (c) => 'La trésorerie descend au plus bas à ' + c.peak + ' en ' + c.peakMonth + (c.payback ? ' et la position cumulée redevient positive en ' + c.payback + '.' : ' ; la position cumulée ne redevient pas positive dans la durée du plan.'),
    resultUnpriced: (c) => 'Aucun prix de vente n’a été saisi : le rapport donne donc le prix d’équilibre, soit ' + c.be + ' par ' + c.unit + ' au rendement moyen. Comparez ce prix à ceux que proposent les acheteurs de votre zone.',
    resultRisk: (c) => 'Le principal point de vigilance est : ' + c.risk + ' (niveau ' + c.level + ').',
    resultLowRisk: 'Aucun risque n’atteint le niveau moyen pour cette date de départ.',
    next: {
      price: (u) => 'Vérifier le prix par ' + u + ' auprès d’au moins deux acheteurs de la zone avant d’engager le capital.',
      quotes: (list) => 'Demander un devis local pour les lignes que les données de référence ne chiffrent pas : ' + list + '.',
      water: (p) => 'Prévoir une source d’eau d’appoint : dans les premiers mois, l’option choisie couvre environ ' + p + ' des besoins de la culture.',
      best: (m, s, cur) => 'Le mois de départ le moins risqué est ' + m + ' (score ' + s + ' sur 8) ; le départ choisi obtient ' + cur + '.',
      cash: (v, d) => 'Garder ' + v + ' disponibles avant les premières ventes, attendues à partir du ' + d + '.',
      soil: 'Faire analyser le sol avant la fumure de fond et ajuster les doses de ce plan au résultat.',
      inputs: 'Acheter semences, plants et produits de traitement chez des revendeurs agréés, et garder les factures.'
    },
    inputs: {
      capital: 'Capital disponible', mode: 'Approche', modeBudget: 'Budget d’abord : la surface suit le capital', modeArea: 'Surface d’abord : le capital suit la surface', area: 'Surface demandée',
      crop: 'Culture', product: 'Produit vendu', ratio: (r) => r + ' de produit par tonne de récolte fraîche', price: 'Prix de vente', priceUser: 'saisi par vous', priceRef: 'référence camerounaise ajustée aux mois de récolte', priceNone: 'non saisi',
      water: 'Eau sur la parcelle', start: 'Date de départ', startLong: 'Date de plantation', land: 'Terrain', market: 'Marché', marketLocal: 'Marché local', marketCity: 'Marché urbain',
      family: 'Main d’œuvre familiale', familyV: (p) => p + ' des journées de travail non payées', tools: 'Outils personnels', yes: 'Oui', no: 'Non', currency: 'Devise du rapport', fx: (c, r) => 'taux de conversion utilisé : 1 ' + c + ' = ' + r + ' FCFA',
      location: 'Climat de référence', locationV: 'Foumbot, Ouest Cameroun (modélisé 1991 à 2021)'
    },
    th: {
      outcome: 'Issue', weight: 'Poids', yield: 'Rendement', price: 'Prix', sold: 'Vendu', revenue: 'Recettes', costs: 'Coûts', margin: 'Marge', roi: 'Rentabilité',
      line: 'Ligne', qty: 'Quantité', unitPrice: 'Prix unitaire', total: 'Total', src: 'Sources', year: 'Année', month: 'Mois', net: 'Solde', cum: 'Cumul',
      dates: 'Dates', task: 'Opération', inputs: 'Intrants et travail', item: 'Article', category: 'Catégorie', need: 'Besoin', packs: 'À acheter', cost: 'Coût',
      etc: 'Besoin de la culture', rain: 'Pluie utile', deficit: 'Déficit', risk: 'Risque', level: 'Niveau', detail: 'Détail', score: 'Score', start: 'Départ'
    },
    outcomeNote: 'Les rendements viennent des références publiées pour cette culture, ajustés à l’eau que fournit votre option (réponse du rendement à l’eau, FAO-33). Les issues bonne et faible déplacent le prix d’environ 17 %, l’écart habituel sur un même marché au cours d’un mois. Les poids sont indicatifs.',
    perUnit: (u) => 'par ' + u,
    yieldYear: 'par année productive', yieldCycle: 'par cycle',
    budgetNote: 'Les quantités couvrent tout le plan pour votre surface. Les lignes de récolte, de transformation et de transport suivent l’issue moyenne. Le matériel qui dure plusieurs saisons est acheté au départ ; sa durée de vie figure dans la ligne.',
    budgetNoteLong: 'Les quantités couvrent tout le plan pour votre surface. Les premières ventes paient une partie des coûts suivants : le capital nécessaire est donc inférieur au coût total du plan.',
    toQuote: 'devis local', grand: 'Coût total du plan', grandSeason: 'Budget de la saison avec réserve', reserve: 'Réserve de précaution (10 %)', capitalNeeded: 'Capital nécessaire : besoin de trésorerie le plus profond et réserve',
    bought: (n) => 'acheté ' + n + ' fois', lasts: (n) => 'dure ' + n + ' saisons',
    cashIntro: 'Chaque dépense est placée à la date de son étape, l’eau dans les mois qui en manquent, le matériel au départ et chaque vente sur ses semaines de récolte. Le point le plus bas de la courbe est la trésorerie à réunir avant l’arrivée des ventes.',
    cashUnpriced: 'Aucun prix de vente n’a été saisi : la courbe ne montre que les dépenses.',
    cashLegend: ['Dépenses', 'Ventes', 'Position cumulée'],
    peak: 'Besoin de trésorerie le plus profond', paybackL: 'Position cumulée positive à partir de', endL: 'Position à la fin du plan', never: 'pas dans la durée du plan',
    yearN: (n) => 'Année ' + n,
    occurrences: (n, e) => n + ' fois, tous les ' + e + ' mois',
    labourDays: (d) => d + ' jours de travail',
    harvestShare: (p) => p + ' du rendement adulte',
    shopFirstYear: 'Cette liste couvre les douze premiers mois : mise en place et entretien de la première année. Les achats suivants figurent au budget.',
    shopSeason: 'Les quantités sont arrondies aux conditionnements vendus. Le matériel figure en fin de liste.',
    waterIntro: (c) => 'Le bilan hydrique suit la méthode FAO-56 : évapotranspiration de référence tirée de la climatologie de Foumbot, coefficients culturaux par stade et pluie utile. ' + c,
    waterCover: (p) => 'Votre option d’eau couvre environ ' + p + ' des besoins de la culture sur la période présentée.',
    waterVolume: (m3) => 'Eau d’irrigation à apporter : environ ' + m3 + ' m³ pour votre surface.',
    waterVolumePlan: (m3, y) => 'Eau d’irrigation à apporter : environ ' + m3 + ' m³ sur la durée du plan pour votre surface, soit ' + y + ' m³ par an.',
    windowsLegend: 'Encadré : départ le moins risqué. Souligné : départ choisi.',
    waterOpt: { rainfed: 'Pluie uniquement, sans source d’eau ni équipement', manual: 'Arrosage manuel depuis une source d’eau (puits, rivière ou citerne)', existing: 'Irrigation déjà en place (motopompe ou goutte à goutte)', pump: 'Motopompe à essence, bassins et arrosoirs achetés au départ', drip: 'Kit goutte à goutte et motopompe achetés au départ' },
    landRent: 'Loué pour la saison', landRentLong: 'Loué pour la durée du plan', landOwn: 'Terrain personnel',
    days: 'jours', yieldUnitYear: 't/ha/an', yieldUnitCycle: 't/ha/cycle', yieldUnit: 't/ha', roiSub: (p) => 'rentabilité ' + p, perYearShort: (v) => v + ' par an',
    windowsIntro: 'Score de risque selon le mois de départ (0 est le meilleur, 8 le moins bon), avec le même capital et la même option d’eau.',
    risksIntro: 'Chaque risque est évalué à partir des données climatiques, du calendrier de la culture et des prix habituels des mois de récolte.',
    heatNA: 'Aucun seuil de chaleur à la floraison n’est publié pour cette culture ; le risque n’est pas évalué.',
    sourcesIntro: 'Chaque chiffre de ce rapport vient d’une source publique datée ou d’une hypothèse documentée. Les références citées dans ce plan sont listées à la suite.',
    confidenceT: 'Confiance par bloc', assumptionsT: 'Hypothèses',
    disclaimer: 'Ce rapport est une aide à la décision construite à partir de références publiques et des réglages que vous avez saisis. Il ne garantit ni rendement, ni prix, ni bénéfice. La météo, les ravageurs, la qualité des intrants, les prix et le travail réalisé sur la parcelle modifient le résultat. Vérifiez les prix et les devis localement avant d’engager de l’argent. Djalumo Agro ne peut être tenu responsable des décisions prises sur la base de ce document.',
    method: 'Méthode : simulateur Djalumo Agro, moteur version 3 (bilan hydrique FAO-56, réponse du rendement FAO-33, trésorerie mensuelle).',
    levels: ['faible', 'moyen', 'élevé'],
    conf: { high: 'Élevée', medium: 'Moyenne', low: 'Faible' },
    monthsAll: 'Mois'
  }
};
