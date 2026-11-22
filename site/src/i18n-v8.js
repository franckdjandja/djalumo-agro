/* ---------- v8 wording: Insights (every publication archived as a dated article) and the Season Planner demonstration ---------- */
(function () {
  const set = (lang, o) => {
    const T = I18N[lang];
    Object.assign(T.nav, o.nav);
    Object.assign(T.cta, o.cta);
    Object.assign(T.meta.pages, o.pages);
    T.demo = Object.assign({}, T.demo, o.demo);
    T.insights = o.insights;
  };
  set('en', {
    nav: { insights: 'Insights', demo: 'See the demo' },
    cta: { demo: 'See the demo' },
    pages: { insights: 'Insights', demo: 'Demo' },
    demo: {
      eyebrow: 'Demo',
      h1: 'The Season Planner, step by step.',
      lead: 'Two minutes to see how a project is entered and how its plan is read. For your own capital, crop and region, request a guided session below.',
      videoH: 'Watch the demonstration',
      videoNote: 'Two minutes, without sound. The example: 500,000 USD of open-field tomato in West Cameroon, planted in December 2026.',
      videoLabel: 'Demonstration of the Season Planner',
      stepsH: 'Five steps to a costed season',
      steps: [
        ['Enter the capital', 'Type the amount you intend to commit and its currency. The planner works at any scale, from a pilot plot to a project above 1 million USD. You can also start from the area instead.'],
        ['Choose the crop and the system', 'Twelve crops are modelled. Choose open field, net house or greenhouse; a structure you already own is not bought again.'],
        ['Say what you already have', 'Water on the plot, land, tools, family labour. The plan only buys what is missing, so the same capital covers more ground.'],
        ['Pick the start date', 'The planner checks the month against heat at flowering, the rains and disease, and compares it with the other months of the year.'],
        ['Read the plan', 'The area your capital carries, the budget line by line, the break-even price and yield, four outcomes with their likelihood, the technical itinerary, the shopping list, water and risks. A full PDF report can be requested, reviewed by our team.']
      ],
      open: 'Open the Season Planner',
      sessionH: 'Request a guided session',
      sessionLead: 'We walk through the planner with your own numbers and answer your questions on the data and the method.',
      watch: 'Watch the two-minute demo'
    },
    insights: {
      h1: 'Insights',
      lead: 'Every publication of Djalumo Agro, dated and sourced: figures from the Season Planner, the field record from Foumbot and our reading of agricultural investment in Africa.',
      crumb: 'Insights',
      read: 'Read the article',
      sources: 'Sources',
      published: 'Published',
      linkedin: 'Follow Djalumo Agro on LinkedIn',
      more: 'More insights',
      all: 'All insights',
      latest: 'Latest',
      related: { field: ['The field record', 'Read the full record from Foumbot, plate by plate.'], planner: ['The Season Planner', 'Turn a capital into a costed season, at any scale.'], about: ['About Djalumo Agro', 'The project, its founder and its stage.'], home: ['Djalumo Agro', 'Agricultural decision intelligence for Africa.'] },
      seo: ['Insights · Djalumo Agro', 'Dated, sourced analyses of agricultural investment in Africa: Season Planner figures, field notes from Foumbot and the week in agriculture.']
    }
  });
  set('fr', {
    nav: { insights: 'Actualités', demo: 'Voir la démo' },
    cta: { demo: 'Voir la démo' },
    pages: { insights: 'Actualités', demo: 'Démo' },
    demo: {
      eyebrow: 'Démo',
      h1: 'Le Planificateur de saison, pas à pas.',
      lead: 'Deux minutes pour voir comment un projet se saisit et comment son plan se lit. Pour votre propre capital, votre culture et votre région, demandez une séance guidée plus bas.',
      videoH: 'Voir la démonstration',
      videoNote: 'Deux minutes, sans son. L’exemple : 500 000 USD de tomate en plein champ dans l’Ouest du Cameroun, plantée en décembre 2026.',
      videoLabel: 'Démonstration du Planificateur de saison',
      stepsH: 'Cinq étapes vers une saison chiffrée',
      steps: [
        ['Saisir le capital', 'Indiquez le montant que vous comptez engager et sa devise. Le planificateur travaille à toute échelle, de la parcelle pilote au projet de plus d’un million de dollars. Vous pouvez aussi partir de la surface.'],
        ['Choisir la culture et le système', 'Douze cultures sont modélisées. Choisissez plein champ, ombrière ou serre ; une structure que vous possédez déjà n’est pas rachetée.'],
        ['Dire ce que vous avez déjà', 'L’eau sur la parcelle, le terrain, les outils, la main-d’œuvre familiale. Le plan n’achète que ce qui manque, et le même capital couvre plus de surface.'],
        ['Choisir la date de départ', 'Le planificateur confronte le mois à la chaleur à la floraison, aux pluies et aux maladies, et le compare aux autres mois de l’année.'],
        ['Lire le plan', 'La surface que porte votre capital, le budget ligne par ligne, le prix et le rendement d’équilibre, quatre issues avec leur probabilité, l’itinéraire technique, la liste d’achats, l’eau et les risques. Un rapport PDF complet peut être demandé, relu par notre équipe.']
      ],
      open: 'Ouvrir le Planificateur de saison',
      sessionH: 'Demander une séance guidée',
      sessionLead: 'Nous parcourons le planificateur avec vos propres chiffres et répondons à vos questions sur les données et la méthode.',
      watch: 'Voir la démo en deux minutes'
    },
    insights: {
      h1: 'Actualités et analyses',
      lead: 'Chaque publication de Djalumo Agro, datée et sourcée : les chiffres du Planificateur de saison, le relevé terrain de Foumbot et notre lecture de l’investissement agricole en Afrique.',
      crumb: 'Actualités',
      read: 'Lire l’article',
      sources: 'Sources',
      published: 'Publié le',
      linkedin: 'Suivre Djalumo Agro sur LinkedIn',
      more: 'Autres articles',
      all: 'Toutes les actualités',
      latest: 'Dernier article',
      related: { field: ['Le relevé terrain', 'Le relevé complet de Foumbot, planche par planche.'], planner: ['Le Planificateur de saison', 'Transformer un capital en saison chiffrée, à toute échelle.'], about: ['À propos de Djalumo Agro', 'Le projet, son fondateur et son stade.'], home: ['Djalumo Agro', 'L’intelligence agricole au service de la décision, pour l’Afrique.'] },
      seo: ['Actualités et analyses · Djalumo Agro', 'Analyses datées et sourcées de l’investissement agricole en Afrique : chiffres du Planificateur de saison, relevé terrain de Foumbot et l’essentiel de la semaine.']
    }
  });
  I18N.en.seo.insights = I18N.en.insights.seo;
  I18N.fr.seo.insights = I18N.fr.insights.seo;
  I18N.en.seo.demo = ['Season Planner demo · Djalumo Agro', 'Watch how a project is entered in the Season Planner and how its plan is read: capital, crop, water, start date, break-even price and four outcomes.'];
  I18N.fr.seo.demo = ['Démonstration du Planificateur de saison · Djalumo Agro', 'Voyez comment un projet se saisit dans le Planificateur de saison et comment son plan se lit : capital, culture, eau, date, prix d’équilibre et quatre issues.'];
})();
