/* ---------- v9 wording: the Offers page (work on written quote, no prices shown) and its quote request form ---------- */
(function () {
  const set = (lang, o) => {
    const T = I18N[lang];
    Object.assign(T.nav, o.nav);
    Object.assign(T.meta.pages, o.pages);
    Object.assign(T.form, o.form);
    Object.assign(T.seo, o.seo);
    T.offers = o.offers;
    T.privacy = Object.assign({}, T.privacy, { updated: o.privacyUpdated, body: T.privacy.body.map((b, i) => (i === 1 ? [b[0], o.privacyCollect] : b)) });
  };

  set('en', {
    nav: { offers: 'Offers' },
    pages: { offers: 'Offers' },
    seo: { offers: ['Offers: financial model, bankable plan · Djalumo Agro', 'Beyond the free Season Planner: an editable financial model, a review of your site, a bankable plan or project monitoring in Cameroon, on written quote.'] },
    privacyUpdated: 'Last updated 23 November 2026',
    privacyCollect: 'Only what you type into our forms: for a message, a demo or a quote request, your name, email, organization, country, optional phone number and message, and for a quote the offer, your profile, crop, budget range and timing; for the newsletter, your email address, preferred language and the date of your consent. The Season Planner runs in your browser and sends nothing, unless you ask for a PDF report: your name, email, optional phone number, profile, place, report language and the settings of your plan are then sent so that the report can be prepared, reviewed by our team and emailed to you.',
    form: {
      offer: 'Offer', profile: 'You are', crop: 'Crop or crops', budget: 'Budget of the project', timing: 'When do you want to start?', need: 'Your project or your need',
      offers: ['Essential', 'Expert', 'Bankable plan', 'Project monitoring', 'Institutions', 'Djalumo Pro (waiting list)'],
      profiles: ['Individual or new grower', 'Diaspora investor', 'Small or medium agricultural business', 'Cooperative or producer group', 'Large company or agro-industry', 'Bank, microfinance or insurer', 'Public institution or programme', 'International organisation or NGO', 'Other'],
      budgets: ['Under 5,000 USD', '5,000 to 25,000 USD', '25,000 to 100,000 USD', 'Over 100,000 USD', 'Not decided yet'],
      timings: ['Within a month', 'In one to three months', 'In three to six months', 'Later, or not decided'],
      sendQuote: 'Request the quote',
      okQuoteT: 'Request received.', okQuoteD: 'Thank you. You will receive a written quote, or our questions, within three working days.',
      againQuote: 'Send another request'
    },
    offers: {
      eyebrow: 'Offers',
      h1: 'When the free plan is not enough.',
      lead: 'The Season Planner and its PDF report stay free. For a decision that needs more, we prepare the work with you, on written quote. Every request is answered by the founder, in English or French.',
      howH: 'How a quote works',
      how: [
        ['Describe your project', 'Two minutes: the offer, the crop, the budget range and when you want to start.'],
        ['Receive a written quote', 'Within three working days: what we will deliver, by when, at what price, and the questions still open.'],
        ['Work starts with your agreement', 'Nothing is due before you accept the quote. You then send what we need: plan settings, soil analysis, photographs of the site.'],
        ['Delivery and walkthrough', 'The files arrive by email, dated and signed. From Expert upwards, a video call to go through them together.']
      ],
      listH: 'What we offer',
      listLead: 'Prices are given in each quote, for the scope agreed.',
      forL: 'For', getL: 'What you receive', timeL: 'Delivery',
      freeTag: 'Free', quoteTag: 'On quote', soonTag: 'Waiting list',
      free: { n: 'Discovery', w: 'Every visitor', d: ['The full Season Planner, at any scale', 'The PDF report of your plan, sent after review by the team'], t: 'Immediate, report after review', cta: 'Open the planner' },
      items: [
        { n: 'Essential', w: 'Project owners comparing options before they decide', d: ['An editable Excel financial model of your season: budget line by line, monthly cash flow and the four outcomes, from a good harvest to a failure', 'A comparison of up to three variants: crop, planting month or water option', 'Selling prices checked against dated sources, for the market you choose'], t: 'One week after your agreement' },
        { n: 'Expert', w: 'Decided projects, before inputs or equipment are bought', d: ['Everything in Essential', 'The plan adjusted to your actual site: soil analysis, water, access, labour', 'A one hour video call to review the choices', 'A report reviewed and signed by Djalumo Agro'], t: 'Two weeks after the documents are received' },
        { n: 'Bankable plan', w: 'Loan applications, partners, diaspora investors', d: ['Everything in Expert', 'A three year plan with monthly cash flow', 'Risks and guarantees analysed, in the form lenders expect', 'A summary in English and French', 'Preparation of your first meeting with the lender'], t: 'Three weeks after the documents are received' },
        { n: 'Project monitoring', w: 'Investors who cannot be on site', d: ['A monthly visit by our field team', 'Dated and located photographs', 'Actual spending compared with the budget, with an alert when they diverge', 'A monthly report to the investor'], t: 'Every month of the season', note: 'Available in West Cameroon, within a day’s drive of Foumbot.' },
        { n: 'Institutions', w: 'Banks, microfinance institutions, cooperatives, programmes and public bodies', d: ['Reference costs and yields by region, with their sources', 'Review of agricultural loan or grant files', 'Training for credit officers and field staff', 'Data partnerships'], t: 'Scope and schedule agreed together' },
        { n: 'Djalumo Pro', w: 'Analysts, investors and managers who follow African agriculture', d: ['A monthly market note', 'The library of verified facts, each with its dated source', 'The archive of past notes'], t: 'Opens in 2027', cta: 'Join the waiting list', soon: true }
      ],
      ctaQuote: 'Request a quote',
      rulesH: 'Two rules for every paid plan',
      rules: ['Each plan carries the date of its prices and the name of the person who reviewed it.', 'No offer promises a return. Each plan shows four outcomes with their likelihood, failure included.'],
      formH: 'Request a quote',
      formLead: 'We reply within three working days. Nothing is due before you accept the quote.',
      asideH: 'Good to know',
      aside: ['The legal structure of Djalumo Agro is being established. Until it is registered, each request is answered personally and the quote states when the work can start.', 'Your request stays private: it is used only to prepare the quote.', 'You can also ask a question first, through the contact page.'],
      plannerH: 'Need more than the report?',
      plannerSub: 'An editable financial model, a review of your site or a bankable plan, on written quote.',
      plannerBtn: 'See the offers',
      solutionsH: 'Work on written quote',
      solutionsLead: 'From an editable financial model to a bankable plan and project monitoring in West Cameroon. Prices are given in each quote.',
      fromPlan: (crop, cap, area, start) => 'From the Season Planner: ' + crop + ', capital ' + cap + (area ? ', about ' + area : '') + (start ? ', start ' + start : '') + '.\n\n'
    }
  });

  set('fr', {
    nav: { offers: 'Offres' },
    pages: { offers: 'Offres' },
    seo: { offers: ['Offres : modèle financier, plan bancable · Djalumo Agro', 'Au-delà du Planificateur gratuit : modèle financier modifiable, examen de votre terrain, plan bancable ou suivi de projet au Cameroun, sur devis écrit.'] },
    privacyUpdated: 'Dernière mise à jour le 23 novembre 2026',
    privacyCollect: 'Uniquement ce que vous saisissez dans nos formulaires : pour un message, une démonstration ou une demande de devis, votre nom, votre adresse électronique, votre organisation, votre pays, votre numéro de téléphone facultatif et votre message, et pour un devis l’offre, votre profil, la culture, l’ordre de grandeur du budget et le calendrier ; pour la lettre d’information, votre adresse électronique, votre langue et la date de votre consentement. Le Planificateur de saison fonctionne dans votre navigateur et n’envoie rien, sauf si vous demandez un rapport PDF : votre nom, votre adresse électronique, votre téléphone facultatif, votre profil, le lieu, la langue du rapport et les réglages de votre plan sont alors transmis pour que le rapport soit préparé, validé par notre équipe et envoyé par courrier électronique.',
    form: {
      offer: 'Offre', profile: 'Vous êtes', crop: 'Culture ou cultures', budget: 'Budget du projet', timing: 'Quand souhaitez-vous démarrer ?', need: 'Votre projet ou votre besoin',
      offers: ['Essentiel', 'Expert', 'Plan bancable', 'Suivi de projet', 'Institutions', 'Djalumo Pro (liste d’attente)'],
      profiles: ['Particulier ou nouveau producteur', 'Investisseur de la diaspora', 'Petite ou moyenne entreprise agricole', 'Coopérative ou groupement de producteurs', 'Grande entreprise ou agro-industrie', 'Banque, microfinance ou assureur', 'Institution publique ou programme', 'Organisation internationale ou ONG', 'Autre'],
      budgets: ['Moins de 5 000 USD', '5 000 à 25 000 USD', '25 000 à 100 000 USD', 'Plus de 100 000 USD', 'Pas encore décidé'],
      timings: ['Dans le mois', 'Dans un à trois mois', 'Dans trois à six mois', 'Plus tard, ou pas encore décidé'],
      sendQuote: 'Demander le devis',
      okQuoteT: 'Demande reçue.', okQuoteD: 'Merci. Vous recevrez un devis écrit, ou nos questions, sous trois jours ouvrés.',
      againQuote: 'Envoyer une autre demande'
    },
    offers: {
      eyebrow: 'Offres',
      h1: 'Quand le plan gratuit ne suffit plus.',
      lead: 'Le Planificateur de saison et son rapport PDF restent gratuits. Pour une décision qui demande davantage, nous préparons le travail avec vous, sur devis écrit. Chaque demande reçoit une réponse du fondateur, en français ou en anglais.',
      howH: 'Comment se passe un devis',
      how: [
        ['Décrivez votre projet', 'Deux minutes : l’offre, la culture, l’ordre de grandeur du budget et la date de démarrage souhaitée.'],
        ['Recevez un devis écrit', 'Sous trois jours ouvrés : ce que nous livrerons, dans quel délai, à quel prix, et les questions qui restent ouvertes.'],
        ['Le travail commence avec votre accord', 'Rien n’est dû avant l’acceptation du devis. Vous envoyez ensuite les éléments utiles : réglages du plan, analyse de sol, photos du terrain.'],
        ['Livraison et restitution', 'Les fichiers arrivent par courrier électronique, datés et signés. À partir de l’offre Expert, un appel en visio pour les parcourir ensemble.']
      ],
      listH: 'Nos offres',
      listLead: 'Les prix figurent dans chaque devis, pour le périmètre convenu.',
      forL: 'Pour', getL: 'Ce que vous recevez', timeL: 'Délai',
      freeTag: 'Gratuit', quoteTag: 'Sur devis', soonTag: 'Liste d’attente',
      free: { n: 'Découverte', w: 'Tous les visiteurs', d: ['Le Planificateur de saison complet, à toute échelle', 'Le rapport PDF de votre plan, envoyé après validation par l’équipe'], t: 'Immédiat, rapport après validation', cta: 'Ouvrir le planificateur' },
      items: [
        { n: 'Essentiel', w: 'Porteurs de projet qui comparent avant de décider', d: ['Un modèle financier Excel modifiable de votre saison : budget poste par poste, trésorerie mois par mois et les quatre issues, de la bonne récolte à l’échec', 'La comparaison de trois variantes au plus : culture, mois de plantation ou option d’eau', 'Des prix de vente vérifiés auprès de sources datées, pour le marché que vous choisissez'], t: 'Une semaine après votre accord' },
        { n: 'Expert', w: 'Projets décidés, avant l’achat des intrants ou du matériel', d: ['Tout le contenu de l’offre Essentiel', 'Le plan ajusté à votre terrain réel : analyse de sol, eau, accès, main-d’œuvre', 'Un entretien d’une heure en visio pour revoir les choix', 'Un rapport revu et signé par Djalumo Agro'], t: 'Deux semaines après réception des documents' },
        { n: 'Plan bancable', w: 'Demandes de crédit, associés, investisseurs de la diaspora', d: ['Tout le contenu de l’offre Expert', 'Un plan sur trois ans avec la trésorerie mensuelle', 'L’analyse des risques et des garanties, dans la forme attendue par les financeurs', 'Un résumé en français et en anglais', 'La préparation de votre premier rendez-vous avec le financeur'], t: 'Trois semaines après réception des documents' },
        { n: 'Suivi de projet', w: 'Investisseurs qui ne peuvent pas être sur place', d: ['Une visite mensuelle de notre équipe de terrain', 'Des photos datées et localisées', 'Les dépenses réelles comparées au budget, avec une alerte en cas d’écart', 'Un rapport mensuel à l’investisseur'], t: 'Chaque mois de la saison', note: 'Disponible dans l’Ouest du Cameroun, à une journée de route de Foumbot au plus.' },
        { n: 'Institutions', w: 'Banques, microfinances, coopératives, programmes et organismes publics', d: ['Des coûts et rendements de référence par région, avec leurs sources', 'L’examen de dossiers de crédit ou de subvention agricoles', 'La formation des agents de crédit et de terrain', 'Des partenariats de données'], t: 'Périmètre et calendrier définis ensemble' },
        { n: 'Djalumo Pro', w: 'Analystes, investisseurs et cadres qui suivent l’agriculture africaine', d: ['Une note de marché mensuelle', 'La bibliothèque de faits vérifiés, chacun avec sa source datée', 'Les archives des notes'], t: 'Ouverture en 2027', cta: 'Rejoindre la liste d’attente', soon: true }
      ],
      ctaQuote: 'Demander un devis',
      rulesH: 'Deux règles pour chaque plan payant',
      rules: ['Chaque plan porte la date de ses prix et le nom de la personne qui l’a revu.', 'Aucune offre ne promet un rendement. Chaque plan montre quatre issues avec leur probabilité, y compris l’échec.'],
      formH: 'Demander un devis',
      formLead: 'Réponse sous trois jours ouvrés. Rien n’est dû avant l’acceptation du devis.',
      asideH: 'Bon à savoir',
      aside: ['La structure juridique de Djalumo Agro est en cours de constitution. D’ici son immatriculation, chaque demande reçoit une réponse personnelle et le devis précise la date de démarrage.', 'Votre demande reste privée : elle sert uniquement à préparer le devis.', 'Vous pouvez aussi poser une question d’abord, depuis la page Contact.'],
      plannerH: 'Besoin de plus que le rapport ?',
      plannerSub: 'Un modèle financier modifiable, l’examen de votre terrain ou un plan bancable, sur devis écrit.',
      plannerBtn: 'Voir les offres',
      solutionsH: 'Un travail sur devis écrit',
      solutionsLead: 'Du modèle financier modifiable au plan bancable et au suivi de projet dans l’Ouest du Cameroun. Les prix figurent dans chaque devis.',
      fromPlan: (crop, cap, area, start) => 'Plan du Planificateur de saison : ' + crop + ', capital ' + cap + (area ? ', environ ' + area : '') + (start ? ', démarrage en ' + start : '') + '.\n\n'
    }
  });
})();
