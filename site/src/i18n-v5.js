/* ---------- Planner v4 wording: first harvests, plan length, one currency for every amount, plain language verdict ---------- */
(function () {
  const yearsEn = (m) => { const h = Math.round(m / 6) / 2; return (h % 1 ? String(h) : String(h | 0)) + ' years'; };
  const yearsFr = (m) => { const h = Math.round(m / 6) / 2, n = Math.floor(h); return n + (n > 1 ? ' ans' : ' an') + (h % 1 ? ' et demi' : ''); };
  const merge = (lang, o) => { const P = I18N[lang].planner; Object.keys(o).forEach(k => { P[k] = (P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) && typeof o[k] === 'object' && !Array.isArray(o[k])) ? Object.assign({}, P[k], o[k]) : o[k]; }); };
  merge('en', {
    badge: '',
    water: { pump: ['Install a motor pump', 'Petrol motor pump, water tanks and watering cans, bought at the start'], drip: ['Install drip irrigation', 'Drip kit installed and a motor pump, bought at the start'] },
    when: (m) => m < 24 ? m + ' months' : yearsEn(m),
    chipSeason: (m) => m + ' month cycle',
    chipLong: (t) => 'harvest from ' + t,
    groupSub: { season: (a, b) => a === b ? a + ' month cycles' : a + ' to ' + b + ' month cycles', long: (a, b) => a === b ? 'first harvest in ' + a : 'first harvest in ' + a + ' to ' + b, orchard: (a, b) => a === b ? 'first harvest in ' + a : 'first harvest in ' + a.replace(/ years?$/, '') + ' to ' + b },
    horizonL: 'Length of the plan',
    horizonHint: { ratoon: 'The successor suckers give a new harvest about every 10 months: two or three cycles include these harvests.', orchard: 'Costs and sales are counted over this length; the trees keep producing well beyond it.' },
    horizonCycles: (n, m) => n + (n > 1 ? ' cycles · ' : ' cycle · ') + m + ' months',
    horizonYears: (n) => n + ' years',
    priceIn: (cur, u) => 'Selling price you expect (' + cur + ' per ' + u + ')',
    perUnit: (u) => 'per ' + u,
    status: { good: 'Profitable', thin: 'Profitable but thin', loss: 'Loss at this price', price: 'Enter a selling price' },
    vSize: (cap, area, plants) => 'With ' + cap + ', the plan covers ' + area + (plants ? ' (' + plants + ' plants)' : '') + '.',
    vSizeArea: (area, cap) => 'For ' + area + ', the plan needs a capital of ' + cap + '.',
    vHarvestLong: (d, w) => 'First harvest expected around ' + d + ', ' + w + ' after planting.',
    vHarvestSeason: (a, b) => 'Harvest from ' + a + ' to ' + b + '.',
    vMargin: (p, u, m, d, roi) => 'At ' + p + ' per ' + u + ', the average margin is ' + m + ' over ' + d + ', ' + roi + ' on the costs.',
    vLoss: (p, u, m, d, be) => 'At ' + p + ' per ' + u + ', the plan loses ' + m + ' over ' + d + ': you need at least ' + be + ' per ' + u + ' to break even.',
    vPayback: (n, d) => 'Your money comes back in month ' + n + ' (' + d + ').',
    vNoPayback: (more) => 'The capital is not recovered within the plan' + (more ? ': try a longer plan.' : '.'),
    vNoPrice: (be, u) => 'Enter your selling price to see the margin. The plan breaks even from ' + be + ' per ' + u + '.',
    tline: { start: 'Start', plant: 'Planting', first: 'First harvest', last: 'Last harvest', end: 'End of plan', payback: 'Money back' },
    k: { area: 'Plot', capital: 'Capital needed', budget: 'Season budget', margin: 'Average margin', breakEven: 'Break even price', first: 'First harvest', payback: 'Money back' },
    kSub: { capital: 'peak cash need and 10% reserve', budget: 'including a 10% reserve', breakEven: (u) => 'per ' + u + ', at the average yield', first: (w) => w + ' after planting', payback: (n) => 'month ' + n + ' of the plan', never: 'not within the plan', marginLong: (v) => v + ' a year on average', marginSeason: (p) => p + ' on the costs' },
    th: { unitPrice: 'Unit price' },
    priceLabel: 'Price',
    dataAsOf: (d) => 'Data updated on ' + d,
    report: { cta: 'Request the full report (PDF)', ctaSub: 'A professional 12 to 15 page report of this plan, sent to you by email after review by the Djalumo Agro team.', unavailable: 'Report sending is being switched on. Please try again in a few days, or use the Contact page.' }
  });
  merge('fr', {
    badge: '',
    water: { pump: ['Installer une motopompe', 'Motopompe essence, bassins et arrosoirs, achetés au départ'], drip: ['Installer un goutte à goutte', 'Kit goutte à goutte installé et motopompe, achetés au départ'] },
    when: (m) => m < 24 ? m + ' mois' : yearsFr(m),
    chipSeason: (m) => 'cycle de ' + m + ' mois',
    chipLong: (t) => 'récolte dès ' + t,
    groupSub: { season: (a, b) => a === b ? 'cycles de ' + a + ' mois' : 'cycles de ' + a + ' à ' + b + ' mois', long: (a, b) => a === b ? '1re récolte en ' + a : '1re récolte en ' + a + ' à ' + b, orchard: (a, b) => a === b ? '1re récolte en ' + a : '1re récolte entre ' + a + ' et ' + b },
    horizonL: 'Durée du plan',
    horizonHint: { ratoon: 'Les rejets successeurs donnent une nouvelle récolte environ tous les 10 mois : 2 ou 3 cycles incluent ces récoltes.', orchard: 'Les coûts et les ventes sont comptés sur cette durée ; les arbres continuent de produire bien au-delà.' },
    horizonCycles: (n, m) => n + (n > 1 ? ' cycles · ' : ' cycle · ') + m + ' mois',
    horizonYears: (n) => n + ' ans',
    priceIn: (cur, u) => 'Prix de vente attendu (' + cur + ' par ' + u + ')',
    perUnit: (u) => 'par ' + u,
    status: { good: 'Rentable', thin: 'Rentable mais fragile', loss: 'Déficitaire à ce prix', price: 'Prix de vente à saisir' },
    vSize: (cap, area, plants) => 'Avec ' + cap + ', le plan couvre ' + area + (plants ? ' (' + plants + ' plants)' : '') + '.',
    vSizeArea: (area, cap) => 'Pour ' + area + ', le plan demande un capital de ' + cap + '.',
    vHarvestLong: (d, w) => 'Première récolte attendue vers ' + d + ', ' + w + ' après la plantation.',
    vHarvestSeason: (a, b) => 'Récolte du ' + a + ' au ' + b + '.',
    vMargin: (p, u, m, d, roi) => 'Au prix de ' + p + ' par ' + u + ', la marge moyenne atteint ' + m + ' sur ' + d + ', soit ' + roi + ' des coûts.',
    vLoss: (p, u, m, d, be) => 'Au prix de ' + p + ' par ' + u + ', le plan perd ' + m + ' sur ' + d + ' : il faut vendre au moins ' + be + ' par ' + u + ' pour équilibrer.',
    vPayback: (n, d) => 'Votre argent est récupéré au mois ' + n + ' (' + d + ').',
    vNoPayback: (more) => 'La mise n’est pas récupérée dans la durée du plan' + (more ? ' : essayez une durée plus longue.' : '.'),
    vNoPrice: (be, u) => 'Saisissez votre prix de vente pour voir la marge. Le plan s’équilibre à partir de ' + be + ' par ' + u + '.',
    tline: { start: 'Début', plant: 'Plantation', first: '1re récolte', last: 'Dernière récolte', end: 'Fin du plan', payback: 'Mise récupérée' },
    k: { area: 'Parcelle', capital: 'Capital nécessaire', budget: 'Budget de la saison', margin: 'Marge moyenne', breakEven: 'Prix d’équilibre', first: 'Première récolte', payback: 'Mise récupérée' },
    kSub: { capital: 'pic de trésorerie et réserve de 10 %', budget: 'réserve de 10 % comprise', breakEven: (u) => 'par ' + u + ', au rendement moyen', first: (w) => w + ' après la plantation', payback: (n) => 'mois ' + n + ' du plan', never: 'pas dans la durée du plan', marginLong: (v) => v + ' par an en moyenne', marginSeason: (p) => p + ' des coûts' },
    th: { unitPrice: 'Prix unitaire' },
    priceLabel: 'Prix',
    dataAsOf: (d) => 'Données à jour au ' + d,
    report: { cta: 'Demander le rapport complet (PDF)', ctaSub: 'Un rapport professionnel de 12 à 15 pages sur ce plan, envoyé par courrier électronique après validation par l’équipe Djalumo Agro.', unavailable: 'L’envoi des rapports est en cours d’activation. Réessayez dans quelques jours, ou passez par la page Contact.' }
  });
  ['en', 'fr'].forEach(l => { const c = I18N[l].planner.cats; c.growth_regulator = l === 'fr' ? 'Induction florale' : 'Flower induction'; });
  I18N.en.sim.crops = Object.assign({}, I18N.en.sim.crops, { pineapple: 'Pineapple', cocoa: 'Cocoa', oil_palm: 'Oil palm' });
  I18N.fr.sim.crops = Object.assign({}, I18N.fr.sim.crops, { pineapple: 'Ananas', cocoa: 'Cacao', oil_palm: 'Palmier à huile' });
})();
