/* ---------- Planner v7 wording: production under cover (net house, greenhouse) and hired machines for land preparation ---------- */
(function () {
  const merge = (lang, o) => { const P = I18N[lang].planner; Object.keys(o).forEach(k => { P[k] = (P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) && typeof o[k] === 'object' && !Array.isArray(o[k])) ? Object.assign({}, P[k], o[k]) : o[k]; }); };
  const plural = (n, one, many) => n + ' ' + (n > 1 ? many : one);
  merge('en', {
    system: 'Production system',
    systems: { open: 'Open field', net: 'Net house', greenhouse: 'Greenhouse' },
    systemOpenHint: 'In the ground, under the sun and the rain.',
    areaCover: 'Area under cover (m²)',
    areaCoverHint: (m) => 'Structures are built in modules of ' + m + ' m²; the plan rounds up to whole modules.',
    coverWater: 'A greenhouse keeps the rain off the crop, so it is watered by drip: the drip kit and a motor pump are included in the plan.',
    fieldWork: 'Land preparation',
    fieldWorkOpts: { hand: 'By hand', hire: 'With hired machines' },
    fieldWorkHint: (ref) => 'Reference for the machine work of this crop: ' + ref + ' per hectare, a low confidence price from one Cameroon budget.',
    coverHand: 'Inside a greenhouse or a net house, the land is prepared by hand.',
    quote: (cur) => 'Your quote for the machine work (' + cur + ' per hectare)',
    quoteHint: 'Optional. Ask CENEEMA or a tractor owner near you; your quote replaces the reference.',
    fwSuggest: (area, n, from) => 'Preparing ' + area + ' by hand needs about ' + n + ' workers on the same day at the busiest step. From about ' + from + ', hired machines are worth considering.',
    fwSwitch: 'Plan with hired machines',
    fwHired: (n, price) => 'Hired machines prepare the land at about ' + price + ' per hectare; about ' + plural(n, 'worker', 'workers') + ' a day remain at the busiest step. This price is a low confidence reference: enter your own quote under More options.',
    fwStillHand: 'The steps machines cannot do, such as planting holes, still set the number of workers.',
    coverFact: (label, n, mod, m2, weeks) => label + ' of ' + m2 + ' m², ' + plural(n, 'module', 'modules') + ' of ' + mod + ' m², built in about ' + plural(weeks, 'week', 'weeks') + '.',
    coverCharge: (cost, charged) => 'The structure costs ' + cost + ' up front; this plan is charged ' + charged + ', the share of its life it uses.',
    coverClimate: (dT) => 'Inside, days are about ' + dT + '°C warmer than outside: a gain in the cool months, a risk for flowering in the hot ones.',
    coverLow: 'Structure prices come from a builder in Côte d’Ivoire and yields from trials in East and West Africa: get a quote from a builder in Cameroon before committing.',
    states: {
      below_module: (min, label, mod) => 'One ' + label.toLowerCase() + ' module of ' + mod + ' m² needs a capital of about ' + min + ', with its watering and tools. Raise the capital, or choose the open field in the form.'
    },
    cats: { structure: 'Structure (greenhouse or net house)', machinery: 'Hired machines' },
    riskText: {
      heatInside: (dT) => ' These temperatures include about ' + dT + '°C of warming under the cover.',
      heatLong: (p) => ' The crop keeps flowering through its harvest; ' + p + '% of these months reach the limit.',
      diseaseRoof: ' The plastic roof keeps the rain off the leaves and lowers this risk by one level; humidity and soil diseases remain.'
    },
    waterRoof: 'Under the plastic roof no rain reaches the crop: the drip supplies all of its water.',
    systemsT: 'Which production system for this crop?',
    systemsSub: (mode) => mode === 'crop' ? 'Same area, start date and price in each system' : 'Same capital, start date and price in each system',
    systemsNote: 'A cover raises the yield per square metre, but its structure is a large cost paid before the first harvest. Compare the break even prices: a cover pays when you can sell above its break even price, for example out of season.',
    sysFrom: (v) => 'from ' + v,
    sysPick: 'Plan this system',
    th: { system: 'System', capitalNeed: 'Capital', yieldAvg: 'Average yield', margin: 'Average margin' },
    budgetCoverNote: (su) => 'The structure is listed at its full price. In the margin, the plan is charged ' + plural(su, 'season', 'seasons') + ' of its life, like the other equipment.'
  });
  merge('fr', {
    system: 'Système de production',
    systems: { open: 'Plein champ', net: 'Maison filet', greenhouse: 'Serre' },
    systemOpenHint: 'En pleine terre, sous le soleil et la pluie.',
    areaCover: 'Surface sous abri (m²)',
    areaCoverHint: (m) => 'Les structures se construisent en modules de ' + m + ' m² ; le plan arrondit au module supérieur.',
    coverWater: 'Une serre protège la culture de la pluie : elle est donc arrosée au goutte à goutte, et le kit goutte à goutte ainsi qu’une motopompe sont compris dans le plan.',
    fieldWork: 'Préparation du terrain',
    fieldWorkOpts: { hand: 'À la main', hire: 'Avec des machines louées' },
    fieldWorkHint: (ref) => 'Référence pour le travail mécanisé de cette culture : ' + ref + ' par hectare, un prix peu fiable tiré d’un seul budget camerounais.',
    coverHand: 'Dans une serre ou une maison filet, le terrain se prépare à la main.',
    quote: (cur) => 'Votre devis pour le travail mécanisé (' + cur + ' par hectare)',
    quoteHint: 'Facultatif. Demandez au CENEEMA ou à un propriétaire de tracteur près de chez vous ; votre devis remplace la référence.',
    fwSuggest: (area, n, from) => 'Préparer ' + area + ' à la main demande environ ' + n + ' ouvriers le même jour à l’étape la plus chargée. À partir d’environ ' + from + ', la location de machines mérite d’être étudiée.',
    fwSwitch: 'Planifier avec des machines louées',
    fwHired: (n, price) => 'Des machines louées préparent le terrain pour environ ' + price + ' par hectare ; il reste environ ' + plural(n, 'ouvrier', 'ouvriers') + ' par jour à l’étape la plus chargée. Ce prix est une référence peu fiable : saisissez votre devis dans Plus d’options.',
    fwStillHand: 'Les étapes que les machines ne font pas, comme les trous de plantation, fixent encore le nombre d’ouvriers.',
    coverFact: (label, n, mod, m2, weeks) => label + ' de ' + m2 + ' m², ' + plural(n, 'module', 'modules') + ' de ' + mod + ' m², construite en ' + plural(weeks, 'semaine', 'semaines') + ' environ.',
    coverCharge: (cost, charged) => 'La structure coûte ' + cost + ' au départ ; ce plan en supporte ' + charged + ', la part de sa durée de vie qu’il utilise.',
    coverClimate: (dT) => 'À l’intérieur, les journées sont plus chaudes d’environ ' + dT + ' °C qu’à l’extérieur : un gain pendant les mois frais, un risque pour la floraison pendant les mois chauds.',
    coverLow: 'Les prix des structures viennent d’un constructeur de Côte d’Ivoire et les rendements d’essais en Afrique de l’Est et de l’Ouest : demandez un devis à un constructeur au Cameroun avant de vous engager.',
    states: {
      below_module: (min, label, mod) => 'Un module de ' + label.toLowerCase() + ' de ' + mod + ' m² demande un capital d’environ ' + min + ', avec son arrosage et ses outils. Augmentez le capital, ou choisissez le plein champ dans le formulaire.'
    },
    cats: { structure: 'Structure (serre ou maison filet)', machinery: 'Location de machines' },
    riskText: {
      heatInside: (dT) => ' Ces températures incluent environ ' + dT + ' °C de réchauffement sous l’abri.',
      heatLong: (p) => ' La culture continue de fleurir pendant sa récolte ; ' + p + ' % de ces mois atteignent la limite.',
      diseaseRoof: ' Le toit en plastique garde les feuilles au sec et baisse ce risque d’un niveau ; l’humidité et les maladies du sol demeurent.'
    },
    waterRoof: 'Sous le toit en plastique, aucune pluie n’atteint la culture : le goutte à goutte apporte toute son eau.',
    systemsT: 'Quel système de production pour cette culture ?',
    systemsSub: (mode) => mode === 'crop' ? 'Même surface, même date de départ et même prix dans chaque système' : 'Même capital, même date de départ et même prix dans chaque système',
    systemsNote: 'Un abri augmente le rendement par mètre carré, mais sa structure est une lourde dépense payée avant la première récolte. Comparez les prix d’équilibre : un abri est rentable quand vous pouvez vendre plus cher que son prix d’équilibre, par exemple hors saison.',
    sysFrom: (v) => 'dès ' + v,
    sysPick: 'Planifier ce système',
    th: { system: 'Système', capitalNeed: 'Capital', yieldAvg: 'Rendement moyen', margin: 'Marge moyenne' },
    budgetCoverNote: (su) => 'La structure figure à son prix complet. Dans la marge, le plan supporte ' + plural(su, 'saison', 'saisons') + ' de sa durée de vie, comme pour les autres équipements.'
  });
})();
