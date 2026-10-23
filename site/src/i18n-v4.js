/* v4 content: the Season Planner for long cycles, successive cycles and orchards, the cash flow, the crop
   comparison and the PDF report request. English is the reference, French the second version. Merged into
   I18N key by key, like i18n-v3.js. */
(function () {
  const merge = (cur, add) => { Object.keys(add).forEach((k) => { const v = add[k]; if (v && typeof v === 'object' && !Array.isArray(v) && cur[k] && typeof cur[k] === 'object' && !Array.isArray(cur[k])) merge(cur[k], v); else cur[k] = v; }); return cur; };
  const add = (lang, o) => merge(I18N[lang], o);

  add('en', {
    sim: { crops: { cassava: 'Cassava', plantain: 'Plantain', avocado: 'Avocado' } },
    planner: {
      groups: { season: ['Short cycle', '3 to 6 months'], long: ['Long cycle', '12 to 36 months'], orchard: ['Orchard', 'several years'] },
      dur: { months: (n) => n + ' months', years: (n) => n + ' years', range: (a, b) => a + ' to ' + b, monthsRange: (a, b) => a + ' to ' + b + ' months' },
      cashNoPrice: 'No selling price yet: this curve shows the costs only. Enter your expected price to see the sales and the payback month.',
      product: 'Sold as', productRatio: (r) => 'About ' + r + ' kg of product from 1 kg of fresh roots.',
      priceUnit: (u) => 'Selling price you expect (FCFA per ' + u + ')',
      kNeed: 'Capital needed', kNeedSub: 'Deepest cash need of the plan, with a 10% reserve',
      kHorizon: 'Plan length', payback: (m) => 'Pays back in month ' + m, noPayback: 'Does not pay back within the plan',
      kMarginH: (d) => 'Average margin over ' + d, perYear: (v) => v + ' a year on average', roiH: (p) => 'Return ' + p + ' on the costs of the plan',
      kBreakEvenU: (u) => 'Break even price per ' + u,
      overPlan: 'Over the plan', yieldCycle: 'Yield per harvest', yieldYear: 'Yield per productive year', priceU: (u) => 'Price per ' + u, soldU: 'Sold',
      costsPlan: 'Costs of the plan', marginYear: 'Margin per year',
      needsPriceU: (be, u) => 'Djalumo Agro does not choose a selling price for you on this crop: prices vary too much between basins and seasons. Enter the price you expect per ' + u + ' to see the four outcomes. At the average yield, the plan breaks even from about ' + be + ' FCFA per ' + u + '.',
      tabs: { cashflow: 'Cash flow', compare: 'Compare crops' },
      cashT: 'Cash position month by month', cashSub: 'average outcome', cashOut: 'Costs', cashIn: 'Sales', cashCum: 'Cumulative position',
      peakL: 'Deepest cash need', peakAt: (m) => 'reached in ' + m, paybackL: 'Back above zero', endL: 'Position at the end of the plan', never: 'Not within the plan',
      yearT: 'Year by year', th: { year: 'Year', costs: 'Costs', sales: 'Sales', net: 'Net', cum: 'Cumulative', crop: 'Crop', cycle: 'Length', area: 'Plot covered', needHa: 'Capital per ha', breakEven: 'Break even price', risk: 'Risk', best: 'Best start', marginMonth: 'Margin per month' },
      yearN: (n) => 'Year ' + n,
      cashNote: 'Each cost is placed at the date of its step, water costs in the months that need water, equipment at the start, and each sale over its harvest weeks. The deepest point of the curve is the cash you must have before the sales arrive.',
      compareT: 'Which crop for this start date?', compareSub: 'Same capital, start date and water option for every crop',
      compareNote: 'The break even price needs no assumption on the market: compare it with the prices you know. The wider the gap, the safer the crop. Margins appear for the crops whose price you entered, or that have a Cameroon reference.',
      simulate: 'Simulate', perUnit: (u) => 'FCFA per ' + u,
      occurrences: (n, e) => n + ' times, every ' + e + ' months', harvestShare: (p) => p + '% of the mature yield',
      shopFirstYear: 'Purchases for the first twelve months: establishment and first year care. Quantities are rounded up to the packs usually sold; equipment is listed last.',
      totalNeed: 'Capital needed: deepest cash need and reserve', horizonCosts: 'Total costs over the plan',
      budgetNoteLong: 'Quantities cover the whole plan for your area. Harvest, processing and transport lines are sized on the average outcome. Sales of the first harvests pay part of the later costs, so the capital needed is lower than the total costs.',
      heatNA: 'No heat sensitive flowering stage is modelled for this crop.',
      waterSubLong: 'mm per month, first year in the field', yearShort: (n) => 'Yr ' + n, trees: (n) => n + ' plants',
      cats: { processing: 'Processing', planting: 'Planting material' }, buys: (n) => 'bought ' + n + ' times over the plan',
      riskLevel: ['Low', 'Medium', 'High'], current: 'current',
      waterLong: (est, cov, opt) => 'Over the first three months after planting, water covers about ' + est + '% of the young crop need; over a year about ' + cov + '%' + (opt === 'rainfed' ? '. Plant at the start of the rains.' : '; your water option covers the gap.'),
      choosePlant: 'Planting date', choosePlantHint: 'Planting date in the field, at the start of the rains for long crops',
      report: {
        cta: 'Get the full report (PDF)', ctaSub: 'A professional report of this plan, sent by email after review by the Djalumo Agro team.',
        title: 'Request your report', intro: 'Your plan is kept exactly as you set it. We confirm your email address, then the Djalumo Agro team reviews the request and sends the PDF report.',
        name: 'Full name', email: 'Email', phone: 'WhatsApp or phone (optional)', profile: 'You are', place: 'Town and region of the project', lang: 'Report language',
        profiles: { farmer: 'Farmer', coop: 'Cooperative or group', investor: 'Investor', diaspora: 'Diaspora project', student: 'Student or researcher', other: 'Other' },
        consent: 'I agree that Djalumo Agro stores this information to prepare and send my report, as described in the privacy policy.',
        send: 'Send my request', sending: 'Sending...', cancel: 'Cancel',
        okT: 'Request received', okD: 'Check your inbox: click the link we sent to confirm your address. Your report is then reviewed and sent by email.',
        errD: 'The request could not be sent. Check your connection and try again.', invalid: 'Check the highlighted fields.'
      }
    }
  });

  add('fr', {
    sim: { crops: { cassava: 'Manioc', plantain: 'Banane plantain', avocado: 'Avocat' } },
    planner: {
      groups: { season: ['Cycle court', '3 à 6 mois'], long: ['Cycle long', '12 à 36 mois'], orchard: ['Verger', 'plusieurs années'] },
      dur: { months: (n) => n + ' mois', years: (n) => n + ' ans', range: (a, b) => a + ' à ' + b, monthsRange: (a, b) => a + ' à ' + b + ' mois' },
      cashNoPrice: 'Pas encore de prix de vente : cette courbe ne montre que les dépenses. Saisissez votre prix attendu pour voir les ventes et le mois de retour au dessus de zéro.',
      product: 'Vendu en', productRatio: (r) => 'Environ ' + r + ' kg de produit pour 1 kg de racines fraîches.',
      priceUnit: (u) => 'Prix de vente attendu (FCFA par ' + u + ')',
      kNeed: 'Capital nécessaire', kNeedSub: 'Besoin de trésorerie le plus profond du plan, avec 10 % de réserve',
      kHorizon: 'Durée du plan', payback: (m) => 'Retour sur investissement au mois ' + m, noPayback: 'Pas de retour sur investissement dans la durée du plan',
      kMarginH: (d) => 'Marge moyenne sur ' + d, perYear: (v) => v + ' par an en moyenne', roiH: (p) => 'Rentabilité ' + p + ' sur les coûts du plan',
      kBreakEvenU: (u) => 'Prix d’équilibre par ' + u,
      overPlan: 'Sur la durée du plan', yieldCycle: 'Rendement par récolte', yieldYear: 'Rendement par année productive', priceU: (u) => 'Prix par ' + u, soldU: 'Vendu',
      costsPlan: 'Coûts du plan', marginYear: 'Marge par an',
      needsPriceU: (be, u) => 'Djalumo Agro ne fixe pas de prix de vente à votre place pour cette culture : les prix varient trop d’un bassin et d’une saison à l’autre. Saisissez le prix attendu par ' + u + ' pour voir les quatre issues. Au rendement moyen, le plan s’équilibre à partir d’environ ' + be + ' FCFA par ' + u + '.',
      tabs: { cashflow: 'Trésorerie', compare: 'Comparer les cultures' },
      cashT: 'Trésorerie mois par mois', cashSub: 'issue moyenne', cashOut: 'Dépenses', cashIn: 'Ventes', cashCum: 'Position cumulée',
      peakL: 'Besoin de trésorerie le plus profond', peakAt: (m) => 'atteint en ' + m, paybackL: 'Retour au dessus de zéro', endL: 'Position à la fin du plan', never: 'Pas dans la durée du plan',
      yearT: 'Année par année', th: { year: 'Année', costs: 'Dépenses', sales: 'Ventes', net: 'Solde', cum: 'Cumul', crop: 'Culture', cycle: 'Durée', area: 'Parcelle couverte', needHa: 'Capital par ha', breakEven: 'Prix d’équilibre', risk: 'Risque', best: 'Meilleur départ', marginMonth: 'Marge par mois' },
      yearN: (n) => 'Année ' + n,
      cashNote: 'Chaque dépense est placée à la date de son étape, l’eau dans les mois qui en manquent, le matériel au départ, et chaque vente sur ses semaines de récolte. Le point le plus bas de la courbe est la trésorerie qu’il faut avoir avant l’arrivée des ventes.',
      compareT: 'Quelle culture pour cette date de départ ?', compareSub: 'Même capital, même date de départ et même option d’eau pour toutes les cultures',
      compareNote: 'Le prix d’équilibre ne suppose rien sur le marché : comparez le aux prix que vous connaissez. Plus l’écart est grand, plus la culture est sûre. Les marges s’affichent pour les cultures dont vous avez saisi le prix, ou qui ont une référence camerounaise.',
      simulate: 'Simuler', perUnit: (u) => 'FCFA par ' + u,
      occurrences: (n, e) => n + ' fois, tous les ' + e + ' mois', harvestShare: (p) => p + ' % du rendement adulte',
      shopFirstYear: 'Achats des douze premiers mois : installation et entretien de la première année. Quantités arrondies aux conditionnements habituels ; le matériel figure en dernier.',
      totalNeed: 'Capital nécessaire : besoin de trésorerie le plus profond et réserve', horizonCosts: 'Coûts totaux sur la durée du plan',
      budgetNoteLong: 'Les quantités couvrent toute la durée du plan pour votre surface. Les lignes de récolte, de transformation et de transport sont calculées sur l’issue moyenne. Les ventes des premières récoltes paient une partie des coûts suivants : le capital nécessaire est donc inférieur aux coûts totaux.',
      heatNA: 'Aucun stade de floraison sensible à la chaleur n’est modélisé pour cette culture.',
      waterSubLong: 'mm par mois, première année au champ', yearShort: (n) => 'An ' + n, trees: (n) => n + ' plants',
      cats: { processing: 'Transformation', planting: 'Matériel de plantation' }, buys: (n) => 'acheté ' + n + ' fois sur la durée du plan',
      riskLevel: ['Faible', 'Moyen', 'Élevé'], current: 'actuelle',
      waterLong: (est, cov, opt) => 'Pendant les trois premiers mois après la plantation, l’eau couvre environ ' + est + ' % des besoins de la jeune culture ; sur l’année environ ' + cov + ' %' + (opt === 'rainfed' ? '. Plantez au début des pluies.' : ' ; votre option d’eau comble l’écart.'),
      choosePlant: 'Date de plantation', choosePlantHint: 'Date de mise en place au champ, au début des pluies pour les cultures longues',
      report: {
        cta: 'Recevoir le rapport complet (PDF)', ctaSub: 'Un rapport professionnel de ce plan, envoyé par e-mail après validation par l’équipe Djalumo Agro.',
        title: 'Demander votre rapport', intro: 'Votre plan est conservé tel que vous l’avez réglé. Nous confirmons votre adresse e-mail, puis l’équipe Djalumo Agro étudie la demande et vous envoie le rapport PDF.',
        name: 'Nom complet', email: 'E-mail', phone: 'WhatsApp ou téléphone (facultatif)', profile: 'Vous êtes', place: 'Ville et région du projet', lang: 'Langue du rapport',
        profiles: { farmer: 'Agriculteur', coop: 'Coopérative ou groupement', investor: 'Investisseur', diaspora: 'Projet de la diaspora', student: 'Étudiant ou chercheur', other: 'Autre' },
        consent: 'J’accepte que Djalumo Agro conserve ces informations pour préparer et envoyer mon rapport, comme décrit dans la politique de confidentialité.',
        send: 'Envoyer ma demande', sending: 'Envoi...', cancel: 'Annuler',
        okT: 'Demande reçue', okD: 'Consultez votre boîte de réception : cliquez sur le lien envoyé pour confirmer votre adresse. Votre rapport est ensuite étudié puis envoyé par e-mail.',
        errD: 'La demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.', invalid: 'Vérifiez les champs signalés.'
      }
    }
  });
})();
