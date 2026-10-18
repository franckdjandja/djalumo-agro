/* AfriFarm Intelligent: bilingual content model. English is the reference version, French the second.
   Every string the interface shows lives here, so a third language (Swahili) is one more object. */
const I18N = {
en: {
  meta: {
    lang: 'en', locale: 'en-US',
    title: 'AfriFarm Intelligent · Agricultural decision intelligence for Africa',
    desc: 'AfriFarm Intelligent turns any budget into a costed Season Plan: what to grow, where, when, at what cost and at what risk. Climate, soil, market and context data, in English and French.',
    pages: { home: 'Agricultural decision intelligence for Africa', planner: 'Season Planner', platform: 'Platform', intelligence: 'Intelligence', solutions: 'Solutions', data: 'Data', impact: 'Impact', about: 'About', contact: 'Contact', demo: 'Request a demo', newsletter: 'Newsletter', privacy: 'Privacy policy', terms: 'Terms of use', admin: 'Team inbox', nf: 'Signal not found' }
  },
  nav: { home: 'Home', planner: 'Planner', platform: 'Platform', intelligence: 'Intelligence', solutions: 'Solutions', data: 'Data', impact: 'Impact', about: 'About', contact: 'Contact', demo: 'Request a demo', newsletter: 'Newsletter', menu: 'Menu', close: 'Close', skip: 'Skip to content', lang: 'Language' },
  badge: { demo: 'Demo · illustrative', real: 'Sourced data', plan: 'Planned', mvp: 'MVP', v2: 'Version 2', v3: 'Version 3', v4: 'Version 4', field: 'Field record' },
  cta: { explore: 'Explore the platform', demo: 'Request a demo', contact: 'Contact the team', simulate: 'Simulate', more: 'Learn more', back: 'Return to AfriFarm Intelligent', read: 'Read the field evidence', sim: 'Open the Season Simulator' },

  home: {
    eyebrow: 'Agricultural decision intelligence · Africa',
    h1: 'Decide the season before you plant it.',
    lead: 'AfriFarm Intelligent turns any budget, from 100 USD to more than 1 million, into a costed Season Plan: what to grow, on what area, from which date, at what cost and at what risk. Built on climate, soil, market and context data, in English and French.',
    tryLabel: 'Season Simulator · enter a capital',
    tryAria: 'Capital amount',
    chips: ['Pilot zone · Foumbot, Cameroon', 'MVP crop · Tomato', 'Stage · Design and field validation', 'English · French'],
    readTitle: 'System status',
    readSteps: ['Terrain', 'Agricultural zones', 'Data signals', 'Intelligence layer'],
    readLines: [['Pilot zone', 'Foumbot, West Cameroon'], ['Position', '5.50° N · 10.63° E'], ['Layers', 'climate · soil · market · context'], ['Planned', 'Rwanda · Kenya, Version 4']],
    vizAlt: 'Animated map of Africa drawn as a grid of data points. Cameroon is highlighted as the pilot country, a signal pulses at Foumbot, and dashed arcs point to Kigali and Nairobi as planned expansion.',
    tags: { pilot: 'Foumbot · pilot', kigali: 'Kigali · planned', nairobi: 'Nairobi · planned' },

    pEyebrow: '01 · The problem',
    pH: 'Capital is committed before the decisive facts are known.',
    pLead: 'A farmer spends most of a season’s capital in its first weeks, on land, seed, fertilizer and labour. Five factors then decide the outcome, and none of them is known with confidence at the moment of planting.',
    factors: [
      { k: 'Climate', t: 'When to plant, whether to irrigate', d: 'Missing: the local rainfall and temperature outlook for the weeks of flowering and harvest.', m: 'Heat or drought at flowering, disease in wet weeks, crop loss.' },
      { k: 'Soil and site', t: 'Which crop suits the plot', d: 'Missing: affordable soil information and an objective view of water, roads and wildlife.', m: 'Poor establishment, wasted inputs, crop damage.' },
      { k: 'Market', t: 'When to harvest, where to sell', d: 'Missing: price trends by market and by week, and visibility on competing supply.', m: 'Harvesting into a glut, selling below cost.' },
      { k: 'Capital', t: 'How much land the budget can carry', d: 'Missing: a costed plan matching area, inputs and reserve to the money available.', m: 'Money runs out before harvest.' },
      { k: 'Context', t: 'Whether the season window is safe', d: 'Missing: a calendar of elections, holidays, road and security conditions.', m: 'Markets closed or buyers absent at harvest.' }
    ],
    consequence: 'Consequence',
    stats: [
      { v: '7.2', u: 'M ha', l: 'arable land in Cameroon' },
      { v: '1.8', u: 'M ha', l: 'actually cultivated, about one quarter' },
      { v: '<33,000', u: 'ha', l: 'irrigated, out of 240,000 ha irrigable' },
      { v: '≈60', u: '%', l: 'of the population works in agriculture' }
    ],
    statsSrc: 'Sources: Ministry of Agriculture and Rural Development figures reported by <a href="https://www.businessincameroon.com/in-focus/an-unused-land-potential" target="_blank" rel="noopener">Business in Cameroon</a>; <a href="https://www.worldbank.org/en/country/cameroon/overview" target="_blank" rel="noopener">World Bank, Cameroon overview</a>.',
    pClose: 'The constraint is not land or labour. It is the quality of the decisions made before planting.',

    hEyebrow: '02 · How it works',
    hH: 'Raw data in. A decision out.',
    hLead: 'Public archives and field records are scattered, technical and rarely available in French. AfriFarm translates them into one decision for a specific plot, crop, date and budget.',
    steps: [
      { t: 'Data', d: 'Climate, soil, crop, market and context, from public archives and field records.' },
      { t: 'Intelligence', d: 'An agronomic reference base structures the data by crop, stage and zone.' },
      { t: 'Prediction', d: 'Models estimate climate risk, disease pressure, yield and price as ranges.' },
      { t: 'Decision', d: 'The Season Plan sizes the area to the capital and ranks the planting windows.' },
      { t: 'Action', d: 'Alerts and the season log guide the work; real results sharpen the next plan.' }
    ],

    sEyebrow: '03 · Season Planner',
    sH: 'Your capital, one costed season.',
    sLead: 'Capital, crop, water and start date: the planner sizes the plot, splits the budget along the standard itinerary and estimates the return from a good harvest to a failure.',

    mEyebrow: '04 · Geographic intelligence',
    mH: 'One pilot zone. A continental data foundation.',
    mLead: 'Public climate and soil datasets already cover the whole continent. Field data starts in Foumbot, West Cameroon, and expands release by release. Select a country to see what exists today.',

    tEyebrow: '05 · Any budget',
    tH: 'From 100 USD to more than 1 million. One engine.',
    tLead: 'The tiers describe the depth of the plan, not separate products. A farmer who starts at 500 USD keeps the same account, history and data when the farm grows to 50,000 USD.',

    eEyebrow: '06 · Field evidence',
    eH: 'Designed from a real pilot, not from a slide.',
    eLead: 'Between September 2024 and October 2025, the founder’s pilot farm ran four production phases in Foumbot. Each loss traces back to a factor that data could have anticipated.',

    cH: 'Bring AfriFarm to your farms, portfolio or programme.',
    cLead: 'Pilot participation in Foumbot from March 2027, data partnerships, investment and institutional collaboration.'
  },

  planner: {
    eyebrow: 'Season Planner',
    title: 'Season Planner',
    h1: 'Your capital, turned into a costed season.',
    lead: 'Enter your capital, your crop, your water situation and your start date. The planner sizes the plot, follows the standard technical itinerary step by step, splits the budget line by line and estimates the return in four outcomes, from a good harvest to a failure.',
    badge: 'Reference data · v2',
    inputsT: 'Your season',
    capital: 'Capital available', capitalHint: 'Minimum 100 USD, in any currency',
    currency: 'Currency',
    approach: 'Approach', budgetFirst: 'Budget first', areaFirst: 'Area first',
    area: 'Area to plant (ha)',
    crop: 'Crop',
    waterT: 'Water on the plot',
    water: {
      rainfed: ['Rain only', 'No water source or equipment'],
      manual: ['Water source, manual watering', 'Well, river or tank, with watering cans'],
      existing: ['Irrigation already in place', 'Pump or drip system you already own'],
      pump: ['Install a motor pump', 'Petrol pump, water basins and watering cans, bought this season'],
      drip: ['Install drip irrigation', 'Installed drip kit and a motor pump, bought this season']
    },
    start: 'Start date', startHint: 'Sowing, or nursery sowing for transplanted crops',
    advanced: 'More options',
    land: 'Land', landRent: 'Rented for the season', landOwn: 'Own land',
    market: 'Where you sell', marketLocal: 'Local market (Foumbot, Bafoussam)', marketCity: 'City wholesale (Douala, Yaoundé)',
    family: 'Labour done by the family', familyHint: 'Unpaid family work reduces the cash needed; the work still has to be done',
    ownTools: 'I already own basic tools and a sprayer',
    price: 'Selling price you expect (FCFA/kg)', pricePh: 'Your local price', priceOptional: 'Optional: leave empty to use this reference, adjusted to your harvest months.',
    kBreakEven: 'Break even price', atAvgYield: 'At the average yield',
    enterPrice: 'Enter your expected selling price in the form to see the four outcomes and the return.',
    unpricedNote: (list) => 'No sourced price was found for: ' + list + '. These lines keep their quantity but count as zero in the budget: get a local quote before committing.',
    toQuote: 'Quote',
    unusedCapital: (v) => 'About ' + v + ' of your capital stays unused with this water option.',
    states: {
      below_min: (min) => 'The capital is below the minimum of 100 USD (' + min + '). A real plot starts from this amount.',
      upfront_exceeds: () => 'The capital does not cover the equipment of the water option chosen. Choose another water option or raise the capital.',
      manual_limit: (min, max) => 'Manual watering is realistic up to about ' + max + ': the plan stops there. For a larger plot, choose a motor pump or drip irrigation.',
      needs_price: (min, max, be) => 'No published farm gate price exists for this crop in Cameroon, so AfriFarm does not guess one. Enter the price you expect, in FCFA per kg, to see the four outcomes. At the average yield, the season breaks even from about ' + be + ' FCFA/kg.'
    },
    upfrontHint: 'With a small capital: if you can borrow a sprayer and basic tools, tick “I already own basic tools and a sprayer” under More options; start with manual watering or rain fed planting in the rainy season, then invest in equipment from the first season profits.',
    kArea: 'Plot the capital carries', plants: (n) => n + ' plants', kRequired: 'Capital required', kBudget: 'Season budget', inclReserve: 'Includes a 10% contingency reserve',
    kMargin: 'Average outcome margin', roiAvg: (p) => 'Return ' + p + ' on the costs of the season', kSeason: 'Season length',
    compactNote: 'Average outcome shown. The full plan details the budget line by line, the technical itinerary, the shopping list, the water balance and the risks.',
    openFull: 'Open the full Season Plan',
    tabs: { return: 'Return', budget: 'Budget', itinerary: 'Technical itinerary', shopping: 'Shopping list', water: 'Water and risks', sources: 'Sources' },
    scen: {
      good: ['Good harvest', 'Good practice yield and a firm price at harvest.'],
      average: ['Average harvest', 'Typical yield for the zone and the usual price for the harvest months.'],
      poor: ['Poor harvest', 'Low farmer yield and a weak price.'],
      failure: ['Failure', 'Most of the crop lost (disease, climate, market closure): only a small part is sold.']
    },
    weight: (n) => 'about ' + n + '%', roi: 'Return',
    yieldL: 'Yield', priceL: 'Price', soldL: 'Sold', revenueL: 'Revenue', costsL: 'Season costs',
    chartMargins: 'Margin by outcome', perSeason: 'One season',
    breakEvenT: 'Break even', beYield: 'Yield needed at the average price', bePrice: 'Price needed at the average yield',
    expected: 'Risk weighted margin', expectedNote: 'Indicative weights by outcome, adjusted to the risks of your window. They will be replaced by measured frequencies once seasons are recorded.',
    scenNote: '<b>How outcomes are built.</b> Yields come from published references for each crop and season (rainy or dry), adjusted by the water your option supplies (FAO-33 yield response to water). The price is the one you enter; without it, the Cameroon reference adjusted to the months you harvest. Good and poor outcomes move the price by about 20%, the usual spread seen within one market in one month. Costs of equipment that lasts several seasons are spread over its lifespan in the margin; the full purchase is in the budget.',
    cats: { land: 'Land', land_preparation: 'Land preparation', seed: 'Seeds', nursery: 'Nursery', fertilizer: 'Fertilizers', amendment: 'Organic manure and amendments', foliar: 'Foliar feeds and biostimulants', fungicide: 'Fungicides', insecticide: 'Insecticides', herbicide: 'Herbicides', stakes: 'Stakes', trellis: 'Trellis', irrigation: 'Irrigation running costs', labour: 'Labour', advice: 'Agronomist', harvest: 'Harvest, packaging and transport', equipment: 'Equipment bought up front', reserve: 'Contingency reserve (10%)', tools: 'Tools', ppe: 'Protective equipment', packaging: 'Packaging', transport: 'Transport', fuel: 'Fuel', other: 'Other' },
    lifeSeasons: (n) => 'lasts about ' + n + ' seasons',
    totalBudget: 'Total season budget',
    th: { line: 'Line', qty: 'Quantity', unitPrice: 'Unit price (FCFA)', src: 'Source', total: 'Total', item: 'Item', cat: 'Category', need: 'Quantity needed', packs: 'To buy', cost: 'Cost', block: 'Data', conf: 'Confidence', note: 'What it rests on' },
    budgetNote: 'Quantities follow the standard itinerary for your area. Harvest, packaging and transport lines are sized on the average outcome. Unit prices are Cameroon market references; check them with your local supplier.',
    apps: (n) => n + ' applications', labourDays: (n) => n + ' person days of work',
    shopNote: 'Quantities are rounded up to the packs usually sold. Equipment bought up front is listed last.',
    waterChart: 'Crop water need and rainfall', waterSub: 'mm per month, field period', rainEff: 'dependable rain', deficit: 'deficit', cropNeed: 'crop need (ETc)',
    waterVolume: (m3, mm) => 'Water to supply over the season: about ' + m3 + ' m³ (' + mm + ' mm of crop deficit, after application losses).',
    risksT: 'Risks for this window',
    riskNames: { water: 'Water stress', heat: 'Heat at flowering', disease: 'Disease pressure', market: 'Market at harvest', context: 'Context' },
    riskText: {
      water: (cov, def, opt) => 'Water covers about ' + cov + '% of the crop need. Rain leaves a deficit of ' + def + ' mm' + (opt === 'rainfed' ? '; without irrigation the yield falls accordingly.' : '; your water option covers it.'),
      heat: (months, t, thr) => 'Flowering falls in ' + months + ', with average maxima near ' + t + '°C. Fruit set suffers above about ' + thr + '°C.',
      disease: (mm, note) => 'Up to ' + mm + ' mm of rain per month from flowering to the end of harvest. ' + note,
      market: (months, idx) => 'Harvest in ' + months + ': the usual price is about ' + idx + '% of the yearly average.',
      context: 'Check elections, holidays and road conditions for your harvest weeks. The context calendar arrives with the MVP.'
    },
    check: 'Check',
    windowsT: 'Start month comparison', riskScore: 'risk score', bestLine: (m) => 'Lowest risk start month with your water option: ' + m + '. Select a month to compare.',
    levels: ['Low', 'Medium', 'High'],
    conf: { high: 'High', medium: 'Medium', low: 'Low' },
    assumptionsT: 'Assumptions', sourcesT: 'Sources used for this plan',
    engineError: 'The plan could not be computed with these inputs. Check the capital and the date.'
  },
  sim: {
    badge: 'Demo · illustrative data',
    capital: 'Capital', currency: 'Currency',
    approach: 'Approach', budgetFirst: 'Budget first', cropFirst: 'Crop first',
    crop: 'Crop', area: 'Area requested', areaUnit: 'ha',
    month: 'Start month', monthHint: 'Sowing, or nursery for transplanted crops',
    irrig: 'Irrigation available on site', equip: 'Add irrigation equipment (pilot reference USD 5,000)',
    crops: { tomato: 'Tomato', cucumber: 'Cucumber', greenbean: 'Green bean', zucchini: 'Zucchini', pepper: 'Pepper' },
    cropTag: { tomato: 'MVP', other: 'V2' },
    kArea: 'Feasible area', kTier: 'Budget tier', kCycle: 'Season length',
    weeks: 'weeks', capitalUsd: 'Capital in USD',
    calT: 'Crop calendar', calS: 'From the planting window you chose',
    nursery: 'Nursery', growth: 'Field growth', harvest: 'Harvest', flowering: 'Flowering',
    budT: 'Budget allocation', budS: 'Variable costs follow the pilot workbook split',
    lines: { seeds: 'Seeds', labour: 'Labour', fert: 'Fertilizers', pack: 'Packaging', protect: 'Crop protection', rent: 'Land rental', agro: 'Agronomist', equip: 'Equipment', reserve: 'Contingency reserve', free: 'Unallocated' },
    riskT: 'Start month risk', riskS: 'Simplified seasonal rules · West Cameroon highlands',
    rows: { water: 'Water stress', disease: 'Disease pressure', heat: 'Heat at flowering', all: 'Overall' },
    lv: ['Low', 'Medium', 'High'],
    best: 'Best', yours: 'Selected',
    bestLine: (b, s) => b === s ? 'Your start month is the lowest risk window under these rules.' : 'Lowest risk start month under these rules: ' + b + '.',
    confT: 'Confidence index', confV: 'Low',
    confD: 'One pilot budget, simplified seasonal rules, no trained model. In the product, every figure states whether it rests on local data, regional data or expert opinion.',
    lockT: 'Yield and revenue ranges', lockD: 'Shown only once the yield and price models beat their baselines on years they have never seen (roadmap Phase 2). Never a single number.',
    scen: ['Pessimistic', 'Median', 'Optimistic'],
    assume: '<b>Demo assumptions.</b> Reference variable cost of USD 10,000 per hectare per cycle, from the Cam_Agri For Africa budget workbook (1 ha); same reference for every crop until the grower survey; 10% contingency reserve; fixed indicative exchange rates, not live; crop cycles from the founder’s production plan, tomato from a general agronomic reference. The production engine replaces each assumption with local data and trained models.',
    feasibleOk: 'The capital carries the requested area.',
    feasibleNo: (a, k) => 'The capital carries ' + a + ' only. About ' + k + ' would be needed for the area requested.',
    feasibleNeg: 'The capital does not cover the equipment and the reserve. Remove the equipment or raise the capital.',
    tooSmall: 'Below the Starter range: the plan would be a seed tray, not a plot.',
    scale: [ [50, 'Nursery bed or kitchen garden scale'], [1000, 'Market garden plot'], [10000, 'Smallholder plot'], [100000, 'Family or commercial farm'], [Infinity, 'Commercial scale: several staggered blocks recommended'] ],
    tiers: ['Starter', 'Smallholder', 'Commercial', 'Industrial'],
    approx: 'about',
    firstHarvest: 'First harvest',
    tt: (m, f, h) => 'Start ' + m + ' · flowering ' + f + ' · harvest from ' + h
  },

  tiers: [
    { n: 'Starter', r: '100 to 1,000 USD', d: 'The crop and plot size the budget can carry, an affordable input list, a nursery and planting calendar, and a clear warning when the budget is too small.', w: 'Household, student, new grower' },
    { n: 'Smallholder', r: '1,000 to 10,000 USD', d: 'A full Season Plan for one to a few hectares: water plan, pest calendar, sales plan, margin in three scenarios.', w: 'Family farm, young agripreneur' },
    { n: 'Commercial', r: '10,000 to 100,000 USD', d: 'Several crops and staggered plantings, irrigation and equipment sizing, packaging and logistics options, labour plan.', w: 'Commercial farm, cooperative, diaspora investor' },
    { n: 'Industrial', r: '100,000 to 1,000,000+ USD', d: 'A portfolio of sites and crops, supply forecasts for buyers and processors, risk reports for lenders and insurers, API access.', w: 'Agribusiness, investor, processor' }
  ],

  map: {
    layers: 'Layers', lPublic: 'Public data coverage', lPilot: 'Pilot zone', lPlan: 'Planned expansion',
    select: 'Select a country', selectAria: 'Choose a country to inspect',
    hint: 'Hover or tap a country. Zoom with the buttons, a double click, a pinch or Ctrl and scroll; drag to pan.',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset view',
    kStatus: 'Status', kField: 'Field data', kPublic: 'Public layers', kNext: 'Next',
    stPilot: 'Pilot zone · MVP', stPlan: 'Planned · Version 4', stPublic: 'Public data only',
    publicLayers: 'Climate history since 1981, rainfall at about 5 km, soil at 250 m, production statistics since 1961',
    fieldCm: 'Cam_Agri For Africa pilot: four phases, Sept 2024 to Oct 2025, 97 field photographs, real cost lines',
    nextCm: 'Survey of 30 to 50 tomato growers in Foumbot; field pilot with 30 growers from March 2027',
    fieldNone: 'None yet',
    nextPlan: 'Version 4 opens Central, West and East Africa, starting with Rwanda and Kenya, once the model is sustainable in Cameroon.',
    nextNone: 'Expansion follows the release gates of the roadmap.',
    pilotLabel: 'Foumbot · pilot zone',
    loading: 'Initialising geographic layers',
    scaleNote: 'Natural Earth projection · boundaries are indicative'
  },

  ev: [
    { img: 'clearing', p: 'Phase 1 · Sept to Oct 2024', t: 'Launch on 1 ha', d: 'Strong early growth; extreme heat yellowed the cucumbers at harvest; pump irrigation costly and insufficient.', r: 'Partial harvest, negative result' },
    { img: 'bulk-sacks', p: 'Phase 2 · Nov 2024 to Mar 2025', t: 'Secondary marshy site', d: 'Heat at flowering without automated irrigation destroyed the pepper; bulk sales in 50 kg sacks.', r: 'Costs covered at best' },
    { img: 'tomato-rows', p: 'Phase 3 · Apr to Jul 2025', t: 'Staked tomato', d: 'Whitefly pressure and fruit rot, partly controlled; good quality but low local prices.', r: 'No profit' },
    { img: 'harvest-2025', p: 'Phase 4 · Aug to Oct 2025', t: 'Relaunch of the main site', d: 'Good growth and a harvest from mid October; an election crisis then closed markets and transport.', r: 'Total commercial loss' }
  ],

  newsletter: {
    eyebrow: 'Newsletter',
    h: 'Stay ahead of agricultural intelligence.',
    d: 'Field notes from Foumbot, model progress, data sources and release news. Occasional, in English or French. Unsubscribe at any time.',
    email: 'Email address', ph: 'you@organisation.com', btn: 'Subscribe',
    consent: 'I agree to receive AfriFarm Intelligent updates and accept the privacy policy.',
    okT: 'You’re in.', okD: 'You’ll receive AfriFarm Intelligent updates and insights.',
    dupT: 'Already subscribed.', dupD: 'This address is already on the list. Nothing else to do.',
    langPref: 'Preferred language'
  },

  platform: {
    eyebrow: 'Platform',
    h1: 'One engine. Four products. Every budget.',
    lead: 'AfriFarm Intelligent is delivered as four products sharing one engine, one account and one data model, so that each user reaches the platform through the channel that suits them.',
    waysH: 'Two ways in, the same answer.',
    ways: [
      { k: 'Budget first', q: '“I have this amount. What should I do?”', d: 'The platform ranks the crops and planting windows that fit the capital, the location and the season, and explains why.' },
      { k: 'Crop first', q: '“I want to grow tomatoes on one hectare in March.”', d: 'The platform checks whether the capital is sufficient, builds the plan and proposes a better window or a smaller area when the risk or the cost is too high.' }
    ],
    currency: 'Capital can be entered in CFA franc, US dollar, euro, Rwandan franc, Kenyan shilling, naira or any other currency, converted at the day’s rate.',
    planEyebrow: 'The Season Plan',
    planH: 'Ten answers before a single seed is bought.',
    planLead: 'Every answer is expressed as a range with the evidence behind it. In the demo on the home page, the outputs marked live are computed in your browser.',
    live: 'Live in demo',
    plan: [
      ['Feasibility', 'The area the capital can carry, or an explicit warning that it cannot carry the area requested.', 1],
      ['Crop calendar', 'Nursery, transplanting, first and last harvest dates, total cycle length.', 1],
      ['Input package and budget', 'Seeds, fertilizer, crop protection, labour, irrigation, transport, packaging and expert support, against the capital.', 1],
      ['Water plan', 'Crop water needs against expected rainfall, week by week, with the irrigation required and its cost.', 0],
      ['Yield and revenue ranges', 'Pessimistic, median and optimistic. Never a single number.', 0],
      ['Market outlook at harvest', 'Expected price trend and risk of a glut in the harvest weeks.', 0],
      ['Sales and packaging plan', 'Buyer channel, packaging format and the price difference it makes.', 0],
      ['Risk map', 'Climate, pests and diseases, wildlife, market, logistics and context, each rated with its mitigation.', 1],
      ['Best window', 'The safest and most profitable planting dates, compared with the date requested.', 1],
      ['Confidence index', 'What each figure rests on (local data, regional data, expert opinion) and how reliable it is.', 1]
    ],
    prodEyebrow: 'Product suite',
    prodH: 'Four channels, one account.',
    prodCols: ['Product', 'Users', 'Purpose', 'Release'],
    products: [
      ['AfriFarm Mobile', 'Farmers in the field', 'Season Simulator, season log and alerts; works offline. Android first, iOS next.', 'mvp'],
      ['AfriFarm Web', 'Investors, cooperatives, agribusinesses', 'Full planning dashboard, portfolio of plots and seasons, reports.', 'mvp'],
      ['AfriFarm Alerts', 'Every farmer, including basic phones', 'Weather, heat, disease and market alerts by WhatsApp and SMS; simple queries.', 'v2'],
      ['AfriFarm Pro and API', 'Banks, insurers, buyers, public institutions', 'Aggregated supply forecasts and season risk profiles, with farmer consent; data services.', 'v3']
    ],
    modEyebrow: 'Modules',
    modH: 'Nine modules, released behind strict gates.',
    modules: [
      ['Season Simulator', 'Budget first or crop first planning, Season Plan with ranges and confidence index, context risk calendar.', 'mvp'],
      ['Climate and weather', '40 years of local history, forecasts for the next 10 days, heat and rainfall alerts.', 'mvp'],
      ['Crop health', 'Pest and disease risk by crop stage (late blight, whiteflies, caterpillars), treatment calendar.', 'mvp'],
      ['Season log', 'Operations, expenses, harvests, sales and photos, entered in seconds.', 'mvp'],
      ['Markets and prices', 'Prices by market (Foumbot, Bafoussam, Douala, Yaoundé and beyond), seasonality, community price reports.', 'v2'],
      ['Sales, packaging and logistics', 'Buyer connections including traders from the subregion, packaging formats, transport estimates.', 'v2'],
      ['Soil and site', 'Satellite soil data, laboratory test interpretation, fertilization advice, site score.', 'v2'],
      ['Experts and community', 'Paid consultations with verified agronomists, moderated forums by crop and zone.', 'v2'],
      ['Context watch', 'Regional economic, social and security alerts, context risk rating in real time.', 'v3']
    ],
    cycleEyebrow: 'Season lifecycle',
    cycleH: 'Before, during and after the season.',
    cycle: [
      ['Before planting', 'The Season Plan supports the decision: area, calendar, budget, risks and best window.'],
      ['During the season', 'The plan becomes a live dashboard: weather, heat and disease alerts, operation reminders, actual costs.'],
      ['After harvest', 'The farmer compares plan and reality. Results feed the database and sharpen the next predictions for every user.']
    ],
    prinEyebrow: 'Design principles',
    prinH: 'Built for the field, not for the demo room.',
    principles: [
      ['Bilingual by design', 'Every screen exists in English and French from the first release; local languages follow.'],
      ['Offline first', 'The mobile application works without network and synchronises when a signal returns.'],
      ['Light on data', 'Small payloads, large icons and minimal typing, for basic phones and slow networks.'],
      ['Honest numbers', 'Every prediction is shown with its range and its level of confidence.']
    ]
  },

  intel: {
    eyebrow: 'Intelligence',
    h1: 'Four layers of knowledge. No black box.',
    lead: 'The engine combines an agronomic reference base, machine learning models, expert validation and proprietary season data. This combination, rather than machine learning alone, makes predictions credible from the first day and more accurate with every season.',
    archEyebrow: 'Architecture',
    archH: 'From seven data domains to a decision on one plot.',
    archLead: 'Select any component to see its role, its technology and its release. The technical core, from data collection to models and API, is written in Python.',
    cols: ['Data', 'Intelligence engine', 'Intelligence', 'Decisions'],
    layersEyebrow: 'Knowledge layers',
    layersH: 'Why the predictions can be trusted on day one.',
    layerCols: ['Layer', 'Role', 'Source of reliability', 'Available'],
    layers: [
      ['Agronomic reference base', 'Cycle lengths, water needs, temperature thresholds, crop management, standard costs per crop and zone.', 'Established research (FAO and national institutes), validated by agronomists.', 'mvp'],
      ['Statistical and machine learning models', 'Climate risk, pest and disease risk, yield, harvest price, best window.', 'Trained and tested on historical data with measured error.', 'mvp'],
      ['Expert validation', 'Review of cases the models cover poorly, local calibration.', 'Agronomists who know each zone.', 'v2'],
      ['Proprietary season data', 'Actual costs, yields, prices and incidents recorded by users.', 'Local, recent and unique to AfriFarm.', 'grow']
    ],
    grow: 'Grows each season',
    modelsEyebrow: 'Models',
    modelsH: 'Five questions, five models, five success metrics.',
    modelCols: ['Question', 'Method', 'Training data', 'Success metric'],
    models: [
      ['How likely are excess rain, heat at flowering or drought for this date and place?', 'Classification: logistic baseline, gradient boosting', '40 years of daily weather; agronomic thresholds by crop stage', 'Recall on adverse seasons, ROC AUC'],
      ['How favourable will conditions be for late blight, whiteflies or caterpillars?', 'Agronomic risk index, then supervised classification', 'Weather, crop stage, incidents reported by users', 'Precision and recall on reported outbreaks'],
      ['What range of yield can this season deliver?', 'Regression: regularised linear baseline, random forest, XGBoost, with prediction intervals', 'Yield series with climate, then season logs at plot level', 'MAE and RMSE against a historical baseline'],
      ['What price is likely in the harvest weeks, in which market?', 'Seasonal time series models and gradient boosting', 'Market price series and field price surveys', 'Mean absolute percentage error'],
      ['Which option offers the best margin for an acceptable risk within this budget?', 'Constrained optimisation over the model outputs', 'Outputs of the models above and the cost base', 'Margin at risk, user validation']
    ],
    modelNames: ['Climate risk of a planting window', 'Pest and disease risk', 'Expected yield', 'Harvest price', 'Best crop and window'],
    xaiEyebrow: 'Explainable by design',
    xaiH: 'No prediction without its drivers and its uncertainty.',
    xaiLead: 'Feature attributions (SHAP) explain each estimate, and prediction intervals replace single numbers. This transparency builds trust with farmers and is a prerequisite for lenders and insurers.',
    xaiCard: 'Risk flag',
    xaiFlag: 'High risk',
    xaiText: 'In most of the last 40 years, heavy rain fell during flowering for this planting date.',
    xaiDrivers: 'Drivers of this flag',
    xaiNote: 'Illustrative layout of an explanation. Directions only; no model output is shown.',
    drivers: [['Rainfall during flowering', 1], ['Relative humidity at fruit set', 1], ['Disease history in the zone', 1], ['Irrigation control on the plot', -1]],
    raises: 'raises risk', lowers: 'lowers risk',
    paceEyebrow: 'Scientific method',
    paceH: 'Plan. Analyze. Construct. Execute.',
    paceLead: 'Model development follows the PACE framework of the Google Advanced Data Analytics Professional Certificate held by the founder. Every model is compared with a simple baseline, validated in chronological order on years it has never seen, and audited for its errors by zone, crop and season before release.',
    pace: [['Plan', 'Define the decision, the users, the success metric and the ethical limits.'], ['Analyze', 'Audit sources, clean data, explore patterns by zone, crop and season.'], ['Construct', 'Build baselines and models, validate on unseen years, explain with SHAP.'], ['Execute', 'Release behind a gate, monitor errors, retrain as seasons are recorded.']],
    raiEyebrow: 'Responsible AI',
    raiH: 'Principles that hold under pressure.',
    rai: ['Predictions support decisions and never replace them.', 'Uncertainty is always shown.', 'No score is used automatically to exclude a farmer from credit or insurance.', 'Underrepresented zones and profiles are monitored explicitly.', 'Farmers can see, correct and export their own data.']
  },

  arch: {
    nodes: {
      weather: ['Weather', 'Daily rainfall, temperature, humidity and radiation since 1981 (NASA POWER), hourly reanalysis (ERA5-Land) and forecasts for the next 10 days.', 'MVP'],
      satellite: ['Satellite', 'Sentinel-2 vegetation index of plots every few days through Google Earth Engine; rainfall estimates at about 5 km (CHIRPS).', 'Version 2'],
      soil: ['Soil', 'pH, organic carbon, texture and nitrogen at 250 m (SoilGrids), verified by reference laboratory tests on selected plots.', 'Version 2'],
      crop: ['Crop', 'Cycle lengths, water needs, temperature thresholds and sensitive stages by crop, from the agronomic reference base.', 'MVP'],
      ops: ['Operations', 'The season log: operations, expenses, harvests, sales and photos entered by users, plan against reality.', 'MVP'],
      markets: ['Markets', 'Weekly price readings in Foumbot and Bafoussam by a paid correspondent, then by the community; public price series.', 'Version 2'],
      history: ['Historical', 'Production and yields since 1961 (FAOSTAT), the Cam_Agri For Africa pilot as founding dataset, a context calendar.', 'MVP'],
      ref: ['Agronomic base', 'Reference knowledge validated by agronomists: the floor of reliability from day one.', 'MVP'],
      ml: ['ML models', 'Python, pandas, scikit-learn, XGBoost, statsmodels; versioned and compared in MLflow.', 'MVP'],
      expert: ['Expert validation', 'Agronomists review the cases the models cover poorly and calibrate locally.', 'Version 2'],
      seasons: ['Season data', 'Real costs, yields and prices from every recorded season: the proprietary advantage.', 'Grows each season'],
      analytics: ['Analytics', 'Data pipelines and quality checks, scheduled daily; PostgreSQL with PostGIS for plots and maps.', 'MVP'],
      ai: ['AI', 'Classification and regression models with SHAP explanations and prediction intervals.', 'MVP'],
      predict: ['Prediction', 'Climate risk, disease pressure, yield and harvest price, each as a range with a confidence index.', 'Progressive'],
      optim: ['Optimization', 'Constrained optimisation: the best crop and window for an acceptable risk within the budget.', 'Version 2'],
      plan: ['Season Plan', 'Feasible area, calendar, budget, water plan, risks, best window and confidence, through a FastAPI service.', 'MVP'],
      alerts: ['Alerts', 'Weather, heat, disease and market alerts by app, WhatsApp and SMS.', 'Version 2'],
      dash: ['Dashboards', 'Live season dashboards for farmers; portfolio views for investors and cooperatives (React, Next.js).', 'MVP'],
      api: ['API', 'Aggregated, consented data services for banks, insurers, buyers and public institutions.', 'Version 3']
    },
    hint: 'Select a component',
    rel: 'Release'
  },

  solutions: {
    eyebrow: 'Solutions',
    h1: 'For everyone who commits capital to a season.',
    lead: 'The farmer is the first user and the source of the data. Institutions that need reliable agricultural information are the customers who will pay the most.',
    who: 'Who benefits', whoH: 'Seven stakeholders, one shared engine.',
    need: 'Need', value: 'Value delivered', model: 'Revenue model', ask: 'A typical question',
    personas: [
      ['Smallholder', 'A safe season and a decent margin', 'Season Plan, alerts and records', 'Free basic plan; affordable premium subscription', 'I have 300,000 FCFA. What can I plant in March, and how much land should I prepare?'],
      ['Investor and diaspora', 'Confidence before investing', 'Full simulation, expert review, monitoring dashboard', 'Premium subscription, paid reports', 'Is 50,000 USD enough for a commercial tomato season near Foumbot, and what could go wrong?'],
      ['Cooperative', 'Coordinated volumes and timing', 'Aggregated view of the members’ seasons', 'Organisation licence', 'How do we stagger our members’ plantings to avoid selling into the same glut?'],
      ['Agribusiness and buyer', 'Predictable supply and quality', 'Supply forecasts by zone and month, verified growers', 'Enterprise licence, connection fees', 'Which volumes can we expect from the West region in August, and from whom?'],
      ['Bank and insurer', 'Measurable agricultural risk', 'Season risk profiles and grower history, with consent', 'Data and API licence', 'What is the climate and context risk of this season loan before we disburse?'],
      ['Agronomist', 'Clients and visibility', 'A marketplace for paid consultations', 'Commission on consultations', 'Which growers in my zone need a field visit before flowering?'],
      ['Public institution', 'Evidence for policy and programmes', 'Aggregated production and risk analytics', 'Programme contracts and licences', 'Where should support target irrigation investment next season?']
    ],
    tiersEyebrow: 'Budget tiers',
    tiersH: 'The depth of the plan grows with the capital.',
    posEyebrow: 'Positioning',
    posH: 'A distinct place in agricultural technology.',
    posCols: ['', 'Global farm management platforms', 'Single link digital services', 'AfriFarm Intelligent'],
    pos: [
      ['Starting point', 'Machinery and sensor data', 'One link: advice, credit or market access', 'The user’s capital'],
      ['Designed for', 'Mechanised, equipped farms', 'One step of the value chain', 'Any budget, from 100 USD'],
      ['Integration', 'Farm operations', 'Single domain', 'Climate, soil, market and context in one costed plan'],
      ['Languages', 'Mostly English', 'Varies', 'English and French from the first screen']
    ]
  },

  data: {
    eyebrow: 'Data',
    h1: 'Public data on day one. Field data that compounds.',
    lead: 'Climate and soil can be covered from day one with free public data. Market prices and real season results cannot, and their systematic collection is AfriFarm’s lasting competitive advantage.',
    landEyebrow: 'Context',
    landH: 'Land and water are available. Reliable decisions are not.',
    landLead: 'Cameroon, the pilot country, cultivates about one hectare in four of its arable land and irrigates less than one hectare in seven of its irrigable potential.',
    landA: 'Arable land', landB: 'Cultivated', landC: 'Irrigable potential', landD: 'Irrigated (upper bound)',
    landT1: 'Land, million hectares', landT2: 'Irrigation, thousand hectares',
    landSrc: 'Source: Ministry of Agriculture and Rural Development (MINADER), reported by Business in Cameroon. The irrigated figure is a reported upper bound (fewer than 33,000 ha).',
    covEyebrow: 'Temporal coverage',
    covH: 'Decades of history behind every Season Plan.',
    covLead: 'Start year of each public source in the data foundation. Longer histories mean better estimates of how often a planting window fails.',
    covNote: 'Start years as published by each provider. SoilGrids is a static map, shown at its current release.',
    srcEyebrow: 'Public data foundation',
    srcH: 'Nine sources, each audited before use.',
    srcCols: ['Domain', 'Source', 'Coverage and use', 'Status'],
    sources: [
      ['Daily weather history', 'NASA POWER', 'https://power.larc.nasa.gov/', 'Rainfall, temperature, humidity, radiation since 1981; direct Python access', 'Free; to be confirmed in the data audit'],
      ['Rainfall, fine resolution', 'CHIRPS, UCSB', 'https://www.chc.ucsb.edu/data/chirps', 'Rainfall at about 5 km since 1981', 'Free; to be confirmed'],
      ['Reference reanalysis', 'ERA5-Land, Copernicus', 'https://cds.climate.copernicus.eu/', 'Hourly variables at about 9 km', 'Free with registration'],
      ['Soil', 'SoilGrids, ISRIC', 'https://soilgrids.org/', 'pH, organic carbon, texture, nitrogen at 250 m', 'Free, CC BY licence'],
      ['Vegetation', 'Sentinel-2 via Google Earth Engine', 'https://earthengine.google.com/', 'Vegetation index of plots every few days', 'Free for research; commercial terms apply'],
      ['Production and yields', 'FAOSTAT', 'https://www.fao.org/faostat/', 'Area, production and yield by crop, country and year since 1961', 'Free'],
      ['Food prices', 'WFP prices for Cameroon, HDX', 'https://data.humdata.org/dataset/wfp-food-prices-for-cameroon', 'Market prices 2005 to 2024, mainly northern regions', 'Tomato and West region coverage to be verified'],
      ['National statistics', 'National Institute of Statistics, MINADER', '', 'Production by region', 'Availability to be verified'],
      ['Security context', 'ACLED', 'https://acleddata.com/', 'Geolocated events by region', 'Commercial licence to be verified']
    ],
    propEyebrow: 'Proprietary data',
    propH: 'The data no competitor can copy.',
    prop: [
      ['The Cam_Agri For Africa pilot', 'Four documented phases, real cost lines, dated incidents and 97 field photographs, structured as the founding dataset.'],
      ['Grower survey', '30 to 50 tomato growers in Foumbot interviewed on their recent seasons: yield, costs, losses, selling prices.'],
      ['Field price survey', 'Two to three price readings per week on the Foumbot and Bafoussam markets, by a paid correspondent, then by the community.'],
      ['Reference soil tests', 'Laboratory analyses on selected plots to verify satellite soil data on the ground.'],
      ['The season log', 'Every active user records one complete season per cycle, plan against reality.']
    ],
    flyH: 'The data flywheel',
    fly: ['Growers plan seasons', 'Season logs record reality', 'Models retrain on new seasons', 'Ranges narrow, plans improve'],
    flyNote: 'Public data can be copied by any competitor; years of seasons recorded in Foumbot and beyond cannot.',
    govEyebrow: 'Governance',
    govH: 'Farmers own their data.',
    gov: ['Individual records are used only with explicit consent.', 'Data is never sold.', 'Third parties receive only aggregated and anonymised data.', 'Every source is listed in a licence register.', 'Compliance with Cameroon’s personal data legislation and the rules of each new country of operation.']
  },

  impact: {
    eyebrow: 'Impact',
    h1: 'Measured outcomes, not promised ones.',
    lead: 'AfriFarm will report impact from the March 2027 field pilot onward. Until then, this page shows what will be measured and the field evidence the platform is built on.',
    kpiEyebrow: 'What we will measure',
    kpiH: 'Six indicators, published from the first pilot season.',
    kpiBase: 'Baseline set during the 2027 pilot',
    kpis: [
      ['Prediction accuracy', 'Gap between predicted and actual yield, cost and price, per season.', 'Proves the engine works and guides retraining.'],
      ['Season completion', 'Share of planned seasons fully recorded up to harvest.', 'Measures engagement and data quality.'],
      ['Plan adoption', 'Share of users who follow the recommended window and package.', 'Measures trust in the recommendations.'],
      ['Farmer outcome', 'Margin per hectare compared with the grower’s previous seasons.', 'Measures real economic impact.'],
      ['Alert usefulness', 'Share of alerts rated useful by farmers.', 'Keeps alerts relevant and rare.'],
      ['Paying customers', 'Premium subscribers and institutional licences.', 'Measures financial sustainability.']
    ],
    pilotEyebrow: 'The pilot',
    pilotH: 'Four phases. Four lessons paid in full.',
    pilotLead: 'The pilot was launched with USD 5,000 of the founder’s own capital, then sustained by season revenues and personal savings. Every phase lost money or broke even.',
    lessonsEyebrow: 'From lesson to requirement',
    lessonsH: 'Each field problem became a product requirement.',
    prob: 'Field problem', req: 'AfriFarm requirement',
    lessons: [
      ['Heat at flowering', 'Cucumbers yellowed, pepper lost', 'Climate risk score for each planting window, heat alerts, irrigation need in every Season Plan'],
      ['Costly, insufficient irrigation', 'Manual pumping from a marshy source', 'Water budget and irrigation cost line, with equipment options sized to the budget'],
      ['Pest pressure', 'Whiteflies, caterpillars, fruit rot', 'Pest and disease risk calendar by crop stage, alerts, photo diagnosis in a later release'],
      ['Site exposure', 'Monkeys, remote site, expensive transport', 'Site score: water, road access, wildlife exposure, distance to market'],
      ['Bulk sales', '50 kg sacks at low prices', 'Sales and packaging plan: channel, format, price per kilogram against bulk'],
      ['Markets closed', 'An election crisis at harvest time', 'Context risk calendar (elections, holidays, roads, security) from the first release']
    ],
    photosEyebrow: 'Field record',
    photosH: 'What the pilot looked like.',
    photos: [
      ['pump', 'Water, the hidden cost', 'Motor pump drawing from a marshy source.'],
      ['heat-damage', 'Climate stress', 'Cucumbers yellowed by heat, left unmarketable.'],
      ['cucumber-field', 'Crop development', 'Ridged and staked cucumber rows, main site, 2024.'],
      ['nursery', 'Professionalised nursery', 'Seedlings under insect netting, secondary site, 2025.']
    ],
    goalH: 'The intended impact',
    goal: 'Every season planned with AfriFarm aims at fewer failed harvests, better use of scarce capital and water, and higher income for the farmer. At scale, the same data helps lenders finance agriculture with less risk and helps public institutions target support, contributing to food security and to dignified rural employment for young Africans.'
  },

  about: {
    eyebrow: 'About',
    h1: 'From a father’s field in Foumbot to an intelligence platform.',
    lead: 'AfriFarm Intelligent is the outcome of more than ten years of work, from a family farming tradition to a documented, photographed and costed field pilot.',
    leadEyebrow: 'Project leader',
    name: 'Franck Junior Djandja Tomwa',
    titles: ['Telecommunications Engineer', 'Data Analyst', 'International Operations Manager'],
    base: 'Based in Kigali, Rwanda · Pilot zone in Foumbot, Cameroon',
    photoAlt: 'Franck Junior Djandja Tomwa holding ripe tomatoes between staked rows, Foumbot area, 2025',
    story: [
      'The project starts with the founder’s father, a farmer in the Foumbot area who taught him the craft of the land, including the production of excellent seed from his own harvests.',
      'In September 2021, before travelling to Kigali to present his vision of an industrialised African agriculture driven by technology, the founder spent time on his father’s plantation, where tomato, eggplant and cucumber were grown on plots at different stages.',
      'From that heritage came Cam_Agri For Africa, a commercial farming pilot run between September 2024 and October 2025. It did not fail for lack of land, labour or commitment. It failed because each critical decision was taken without the information that would have changed it. AfriFarm Intelligent exists to supply that information, for any budget, before capital is committed.'
    ],
    convEyebrow: 'Convictions',
    convH: 'Four convictions behind the work.',
    conv: [['Africa must feed itself.', 'Food security begins with productive, profitable local farms.'], ['Agriculture can offer dignified work.', 'A real alternative to emigration for young Africans.'], ['Farming is a business.', 'Run with numbers, plans and measured risk.'], ['Cameroon is the right start.', 'Arable land, the ports of Douala and Kribi, and buyers from Gabon and Equatorial Guinea.']],
    mileEyebrow: 'Milestones',
    mileH: 'Ten years of work, in six moments.',
    miles: [
      ['September 2021', 'Visit to the father’s plantation', 'Tomato, eggplant and cucumber; then Kigali, to present the vision to entrepreneurs.'],
      ['September 2024', 'Cam_Agri For Africa pilot launched', 'Main site of 1 ha, USD 5,000 of own capital; heat, water and packaging problems.'],
      ['Nov 2024 to Jul 2025', 'Secondary marshy site', 'Cucumber, pepper and zucchini, then staked tomato; pests and low prices.'],
      ['Aug to Oct 2025', 'Relaunch of the main site', 'Good crop, but an election crisis closed markets at harvest: total commercial loss.'],
      ['September 2026', 'Advanced data analytics certification', 'Google Advanced Data Analytics Professional Certificate: Python, machine learning.'],
      ['October 2026', 'AfriFarm Intelligent designed', 'A decision platform for any budget, in English and French.']
    ],
    roadEyebrow: 'Roadmap',
    roadH: 'Five phases and four gates to the March 2027 pilot.',
    roadLead: 'A gate opens only when its criterion is met. Durations assume 10 to 15 hours of work per week and will be revised once the team is in place.',
    now: 'Current',
    road: [
      ['Phase 0', 'Framing', 1, 2, 'Founder decisions, structured pilot dataset, report approved in English and French, GitHub repository.', 'MVP scope approved by the founder'],
      ['Phase 1', 'Field validation', 3, 6, 'Survey of 30 to 50 Foumbot growers, market price readings, data audit, paper mockups tested with 10 growers.', 'Need confirmed and willingness to pay measured'],
      ['Phase 2', 'Data and models', 7, 14, 'Certificate PACE project: pipelines, exploration, climate risk, disease risk and yield models, error analysis, published on GitHub.', 'Each model beats its baseline on unseen years'],
      ['Phase 3', 'Prototype', 15, 20, 'Bilingual Season Simulator connected to the models, tested with 10 growers in Foumbot.', '10 growers rate the Season Plan useful'],
      ['Phase 4', 'MVP pilot', 21, 32, 'Android and web applications, season log, alerts; 30 growers followed over a full season from March 2027.', 'Season completed and plan rated useful']
    ],
    gate: 'Gate', week: 'Week', roadHl: 'Highlighted: Phase 2, the advanced data analytics project (PACE), published on GitHub. Diamonds mark the gates.',
    expEyebrow: 'Expansion',
    expH: 'Crop by crop, region by region.',
    expCols: ['Release', 'Crops', 'Geography', 'Criterion to move on'],
    exp: [
      ['MVP', 'Tomato', 'Foumbot and surroundings', '30 active growers complete a season and rate the Season Plan useful'],
      ['Version 2', 'Adds cucumber, green beans, zucchini, pepper', 'Noun division and Bafoussam', 'Yield predictions measured against a real season; first paying subscribers'],
      ['Version 3', 'Adds maize, sorghum and other staple crops', 'West region, then other regions of Cameroon', 'At least one partnership signed with a financial institution'],
      ['Version 4', 'Broad crop catalogue', 'Central, West and East Africa, starting with Rwanda and Kenya', 'Sustainable business model in Cameroon']
    ],
    refH: 'The reference farm',
    ref: 'In parallel, and subject to financing of at least USD 100,000, the Cam_Agri For Africa farm will be relaunched as AfriFarm’s reference site, where every recommendation is tested at commercial scale with automated irrigation, transport and packaging. USD 20,000 would allow only a partial review.'
  },

  contact: {
    eyebrow: 'Contact',
    h1: 'Talk to AfriFarm Intelligent.',
    lead: 'Partnerships, pilot participation, investment or data collaboration. Tell us what you are working on, in English or French.',
    nextH: 'What happens next',
    next: ['Your message is stored securely with its timestamp.', 'The project team reads every message.', 'You receive a reply by email, in the language you wrote in.'],
    whereH: 'Where we work',
    where: [['Project base', 'Kigali, Rwanda'], ['Pilot zone', 'Foumbot, Noun division, West Cameroon'], ['Languages', 'English, French']],
    demoH: 'Prefer a walkthrough?', demoD: 'Request a guided demo of the Season Simulator with your own numbers.'
  },

  demo: {
    eyebrow: 'Request a demo',
    h1: 'See the Season Simulator with your own numbers.',
    lead: 'A guided walkthrough of the Season Simulator, the data foundation and the roadmap, adapted to your crops, budget and region.',
    coversH: 'What the walkthrough covers',
    covers: ['The Season Simulator applied to your capital, crop and zone', 'The data foundation and how each figure is sourced', 'The models, their success metrics and the release gates', 'Pilot participation in Foumbot from March 2027'],
    stageH: 'Stage of the product',
    stage: 'AfriFarm Intelligent is in its design and field validation phase. The walkthrough presents the current prototype and the plan, never a finished product.'
  },

  nl: {
    eyebrow: 'Newsletter',
    h1: 'Stay ahead of agricultural intelligence.',
    lead: 'Field notes from the Foumbot pilot, model progress, data sources and release news, in English or French.',
    getH: 'What you receive',
    get: ['Field notes from the 2027 Foumbot pilot', 'Model results against their baselines, published openly', 'New data sources, crops and regions as they open', 'Release news for AfriFarm Mobile, Web and Alerts'],
    privH: 'What we keep', priv: 'Your email address, your language and the date of your consent. Nothing else. Every message contains an unsubscribe link.'
  },

  form: {
    name: 'Full name', email: 'Email', workEmail: 'Work email', org: 'Organization', country: 'Country', phone: 'Phone', optional: 'optional',
    orgType: 'Organization type', subject: 'Subject', message: 'Message', role: 'Role', interest: 'Main interest', scale: 'Scale of operation', method: 'Preferred contact method',
    choose: 'Choose…',
    orgTypes: ['Farm or grower', 'Cooperative or producer group', 'Agribusiness, processor or buyer', 'Bank, microfinance or insurer', 'Investor', 'Public institution', 'Development partner or NGO', 'Research or university', 'Media', 'Other'],
    subjects: ['Partnership', 'Pilot participation', 'Investment', 'Data collaboration', 'Media', 'Other'],
    interests: ['Season planning for my farm', 'Investment evaluation', 'Cooperative planning', 'Supply forecasting', 'Agricultural risk for lending or insurance', 'Public programme', 'Foumbot field pilot 2027'],
    scales: ['Under 1 ha', '1 to 10 ha', '10 to 100 ha', 'Over 100 ha', 'Not applicable'],
    methods: ['Email', 'Phone', 'WhatsApp'],
    phoneNeeded: 'Phone number for the call or WhatsApp',
    consent: 'I agree that AfriFarm Intelligent stores this information to answer my request, as described in the privacy policy.',
    why: 'We ask only for what we need to reply. Your details are never sold or shared.',
    send: 'Send message', sendDemo: 'Request the demo', sending: 'Sending…',
    chars: (n, m) => n + ' / ' + m,
    err: {
      required: 'This field is required.', email: 'Enter a valid email address, for example name@domain.com.',
      min: n => 'Please write at least ' + n + ' characters.', max: n => 'Please keep it under ' + n + ' characters.',
      phone: 'Enter a valid phone number, with country code.', consent: 'Please accept to continue.', check: 'Please check this field.',
      summary: n => n === 1 ? 'One field needs attention.' : n + ' fields need attention.'
    },
    okT: 'Message received.', okD: 'Thank you for reaching out to AfriFarm Intelligent. Our team will review your message and get back to you.',
    okDemoT: 'Demo request received.', okDemoD: 'Thank you. The team will contact you by your preferred method to schedule the walkthrough.',
    preT: 'Preview link: nothing was sent.', preD: 'This private preview stores submissions only for accounts the owner has authorised. Your message was not stored. The public deployment of this site will deliver it directly to the team.',
    badT: 'Something went wrong.', badD: 'Something went wrong while sending your message. Please try again. Your text has been kept.',
    quotaD: 'The inbox is full for now. Please try again later.',
    waitD: 'Please wait a minute before sending another request.',
    challengeD: 'Please complete the security check, then send again.',
    again: 'Send another message', edit: 'Back to the form', retry: 'Try again',
    previewShort: 'Preview link: submissions are stored only for authorised accounts.', previewBanner: 'Preview mode', previewText: 'On this private link, submissions are stored only for authorised accounts. The public deployment stores every submission.',
    hp: 'Leave this field empty'
  },

  admin: {
    h1: 'Team inbox', lead: 'Submissions stored by this page. Visible to the owner only.',
    denied: 'This area is restricted to the owner of this site.',
    tabs: { inquiries: 'Contact', demoRequests: 'Demo requests', subscribers: 'Subscribers' },
    empty: 'No submissions yet.', loading: 'Loading submissions', status: 'Status', date: 'Date',
    statuses: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'], error: 'We couldn’t load this information. Please try again.', refresh: 'Refresh'
  },

  privacy: {
    h1: 'Privacy policy', updated: 'Last updated 4 October 2026',
    body: [
      ['Who we are', 'AfriFarm Intelligent is an agricultural decision intelligence initiative led by Franck Junior Djandja Tomwa, based in Kigali, Rwanda, with a pilot zone in Foumbot, Cameroon. The legal structure of the initiative is being established; this policy will name it once registered.'],
      ['What we collect', 'Only what you type into our forms: for a message or a demo request, your name, email, organization, country, optional phone number and message; for the newsletter, your email address, preferred language and the date of your consent. The Season Simulator runs in your browser and sends nothing.'],
      ['Why we collect it', 'To answer your message, organise a demo you requested, or send the newsletter you subscribed to. We never sell personal data and never use it for advertising.'],
      ['Where it is stored', 'On this preview link, submissions are kept in storage attached to this page and readable only by its owner. On the public deployment, they are stored in a managed database with encryption in transit and at rest, and access by role.'],
      ['Cookies and analytics', 'This site sets no tracking cookies and sends no analytics. Your language choice may be remembered in your own browser. If analytics are added later, they will be privacy respecting and announced here before activation.'],
      ['How long we keep it', 'Messages and demo requests are kept for up to 24 months after the last exchange. Newsletter data is kept until you unsubscribe, after which only the unsubscription date is retained to honour your choice.'],
      ['Your rights', 'You can ask to access, correct, export or delete your data at any time through the contact form. We will answer within 30 days.'],
      ['Applicable law', 'We apply Rwanda’s law relating to the protection of personal data and privacy, Cameroon’s personal data legislation, and the rules of each new country of operation.']
    ]
  },
  terms: {
    h1: 'Terms of use', updated: 'Last updated 4 October 2026',
    body: [
      ['Purpose of this site', 'This site presents AfriFarm Intelligent, an agricultural decision platform in its design and field validation phase.'],
      ['Demonstrations', 'The Season Simulator on this site is a demonstration. It uses illustrative assumptions clearly labelled on screen and is not agronomic, financial or investment advice. No outcome is guaranteed.'],
      ['Data and sources', 'Figures cited from third parties are attributed to their sources. Field photographs belong to the project leader and may not be reused without permission.'],
      ['Intellectual property', 'The name AfriFarm Intelligent, the content, design and code of this site are protected. You may link to any page.'],
      ['Liability', 'We take care to keep information accurate and current, but provide this site as is. Decisions made from it remain the responsibility of the user.'],
      ['Contact', 'Questions about these terms can be sent through the contact form.']
    ]
  },
  nf: { code: 'Error 404 · no signal', h1: 'Signal not found.', lead: 'The page you are looking for does not exist or has moved. The rest of the intelligence layer is online.' },
  footer: {
    tag: 'Agricultural intelligence for an Africa that decides with data.',
    cols: ['Product', 'Company', 'Engage', 'Legal'],
    nlH: 'Field notes, in your inbox',
    rights: '© 2026 AfriFarm Intelligent. Project led by Franck Junior Djandja Tomwa.',
    place: 'Kigali · Foumbot',
    status: 'Design and field validation phase',
    noTrack: 'No tracking cookies'
  },
  months: null
},

fr: {
  meta: {
    lang: 'fr', locale: 'fr-FR',
    title: 'AfriFarm Intelligent · Intelligence décisionnelle agricole pour l’Afrique',
    desc: 'AfriFarm Intelligent transforme tout budget en un Plan de saison chiffré : quoi cultiver, où, quand, à quel coût et avec quel risque. Données climatiques, pédologiques, de marché et de contexte, en anglais et en français.',
    pages: { home: 'Intelligence décisionnelle agricole pour l’Afrique', planner: 'Planificateur de saison', platform: 'Plateforme', intelligence: 'Intelligence', solutions: 'Solutions', data: 'Données', impact: 'Impact', about: 'À propos', contact: 'Contact', demo: 'Demander une démo', newsletter: 'Lettre d’information', privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation', admin: 'Boîte de réception', nf: 'Signal introuvable' }
  },
  nav: { home: 'Accueil', planner: 'Planificateur', platform: 'Plateforme', intelligence: 'Intelligence', solutions: 'Solutions', data: 'Données', impact: 'Impact', about: 'À propos', contact: 'Contact', demo: 'Demander une démo', newsletter: 'Lettre d’information', menu: 'Menu', close: 'Fermer', skip: 'Aller au contenu', lang: 'Langue' },
  badge: { demo: 'Démo · illustratif', real: 'Données sourcées', plan: 'Prévu', mvp: 'MVP', v2: 'Version 2', v3: 'Version 3', v4: 'Version 4', field: 'Relevé terrain' },
  cta: { explore: 'Explorer la plateforme', demo: 'Demander une démo', contact: 'Contacter l’équipe', simulate: 'Simuler', more: 'En savoir plus', back: 'Retour à AfriFarm Intelligent', read: 'Voir les preuves terrain', sim: 'Ouvrir le Simulateur de saison' },

  home: {
    eyebrow: 'Intelligence décisionnelle agricole · Afrique',
    h1: 'Décidez la saison avant de la planter.',
    lead: 'AfriFarm Intelligent transforme tout budget, de 100 USD à plus d’un million, en un Plan de saison chiffré : quoi cultiver, sur quelle surface, à partir de quelle date, à quel coût et avec quel risque. Fondé sur des données climatiques, pédologiques, de marché et de contexte, en anglais et en français.',
    tryLabel: 'Simulateur de saison · saisissez un capital',
    tryAria: 'Montant du capital',
    chips: ['Zone pilote · Foumbot, Cameroun', 'Culture MVP · Tomate', 'Étape · Conception et validation terrain', 'Anglais · Français'],
    readTitle: 'État du système',
    readSteps: ['Relief', 'Zones agricoles', 'Signaux de données', 'Couche d’intelligence'],
    readLines: [['Zone pilote', 'Foumbot, Ouest Cameroun'], ['Position', '5,50° N · 10,63° E'], ['Couches', 'climat · sol · marché · contexte'], ['Prévu', 'Rwanda · Kenya, version 4']],
    vizAlt: 'Carte animée de l’Afrique dessinée comme une grille de points de données. Le Cameroun est mis en évidence comme pays pilote, un signal pulse à Foumbot, et des arcs en pointillés désignent Kigali et Nairobi comme expansion prévue.',
    tags: { pilot: 'Foumbot · pilote', kigali: 'Kigali · prévu', nairobi: 'Nairobi · prévu' },

    pEyebrow: '01 · Le problème',
    pH: 'Le capital est engagé avant que les faits décisifs soient connus.',
    pLead: 'Un agriculteur dépense l’essentiel du capital d’une saison dès les premières semaines : terre, semences, engrais, main d’œuvre. Cinq facteurs décident ensuite du résultat, et aucun n’est connu avec certitude au moment de planter.',
    factors: [
      { k: 'Climat', t: 'Quand planter, avec quelle irrigation', d: 'Manque : les prévisions locales de pluie et de température pour les semaines de floraison et de récolte.', m: 'Chaleur ou sécheresse à la floraison, maladies en semaines humides, perte de récolte.' },
      { k: 'Sol et site', t: 'Quelle culture convient à la parcelle', d: 'Manque : une information abordable sur le sol et une vue objective de l’eau, des routes et de la faune.', m: 'Mauvaise installation, intrants gaspillés, dégâts aux cultures.' },
      { k: 'Marché', t: 'Quand récolter, où vendre', d: 'Manque : les tendances de prix par marché et par semaine, et la visibilité sur l’offre concurrente.', m: 'Récolter pendant une surproduction, vendre à perte.' },
      { k: 'Capital', t: 'Quelle surface le budget peut porter', d: 'Manque : un plan chiffré qui ajuste surface, intrants et réserve au capital disponible.', m: 'L’argent manque avant la récolte.' },
      { k: 'Contexte', t: 'Si la fenêtre de saison est sûre', d: 'Manque : un calendrier des élections, des fêtes, des routes et de la sécurité.', m: 'Marchés fermés ou acheteurs absents à la récolte.' }
    ],
    consequence: 'Conséquence',
    stats: [
      { v: '7,2', u: 'M ha', l: 'de terres arables au Cameroun' },
      { v: '1,8', u: 'M ha', l: 'réellement cultivés, environ un quart' },
      { v: '<33 000', u: 'ha', l: 'irrigués, sur 240 000 ha irrigables' },
      { v: '≈60', u: '%', l: 'de la population travaille dans l’agriculture' }
    ],
    statsSrc: 'Sources : chiffres du ministère de l’Agriculture et du Développement rural rapportés par <a href="https://www.businessincameroon.com/in-focus/an-unused-land-potential" target="_blank" rel="noopener">Business in Cameroon</a> ; <a href="https://www.worldbank.org/en/country/cameroon/overview" target="_blank" rel="noopener">Banque mondiale, présentation du Cameroun</a>.',
    pClose: 'La contrainte n’est ni la terre ni la main d’œuvre. C’est la qualité des décisions prises avant de planter.',

    hEyebrow: '02 · Fonctionnement',
    hH: 'Des données brutes en entrée. Une décision en sortie.',
    hLead: 'Les archives publiques et les relevés de terrain sont dispersés, techniques et rarement disponibles en français. AfriFarm les traduit en une décision pour une parcelle, une culture, une date et un budget précis.',
    steps: [
      { t: 'Données', d: 'Climat, sol, culture, marché et contexte, issus d’archives publiques et de relevés de terrain.' },
      { t: 'Intelligence', d: 'Une base de référence agronomique structure les données par culture, stade et zone.' },
      { t: 'Prédiction', d: 'Des modèles estiment le risque climatique, la pression des maladies, le rendement et le prix en fourchettes.' },
      { t: 'Décision', d: 'Le Plan de saison ajuste la surface au capital et classe les fenêtres de plantation.' },
      { t: 'Action', d: 'Les alertes et le journal de saison guident le travail ; les résultats réels affinent le plan suivant.' }
    ],

    sEyebrow: '03 · Planificateur de saison',
    sH: 'Votre capital, une saison chiffrée.',
    sLead: 'Capital, culture, eau et date de démarrage : le planificateur dimensionne la parcelle, répartit le budget selon l’itinéraire standard et estime le retour de la bonne récolte à l’échec.',

    mEyebrow: '04 · Intelligence géographique',
    mH: 'Une zone pilote. Un socle de données continental.',
    mLead: 'Les jeux de données publics sur le climat et les sols couvrent déjà tout le continent. Les données de terrain commencent à Foumbot, dans l’Ouest du Cameroun, et s’étendent version après version. Sélectionnez un pays pour voir ce qui existe aujourd’hui.',

    tEyebrow: '05 · Tout budget',
    tH: 'De 100 USD à plus d’un million. Un seul moteur.',
    tLead: 'Les niveaux décrivent la profondeur du plan, pas des produits distincts. Un agriculteur qui commence avec 500 USD garde le même compte, le même historique et les mêmes données quand l’exploitation atteint 50 000 USD.',

    eEyebrow: '06 · Preuves terrain',
    eH: 'Conçu à partir d’un vrai pilote, pas d’une présentation.',
    eLead: 'Entre septembre 2024 et octobre 2025, la ferme pilote du fondateur a mené quatre phases de production à Foumbot. Chaque perte renvoie à un facteur que les données auraient pu anticiper.',

    cH: 'Faites entrer AfriFarm dans vos fermes, votre portefeuille ou votre programme.',
    cLead: 'Participation au pilote de Foumbot dès mars 2027, partenariats de données, investissement et collaboration institutionnelle.'
  },

  planner: {
    eyebrow: 'Planificateur de saison',
    title: 'Planificateur de saison',
    h1: 'Votre capital, transformé en saison chiffrée.',
    lead: 'Saisissez votre capital, votre culture, votre situation en eau et votre date de démarrage. Le planificateur dimensionne la parcelle, suit l’itinéraire technique standard étape par étape, répartit le budget ligne par ligne et estime le retour sur investissement selon quatre issues, de la bonne récolte à l’échec.',
    badge: 'Données de référence · v2',
    inputsT: 'Votre saison',
    capital: 'Capital disponible', capitalHint: 'Minimum 100 USD, dans toute devise',
    currency: 'Devise',
    approach: 'Approche', budgetFirst: 'Budget d’abord', areaFirst: 'Surface d’abord',
    area: 'Surface à planter (ha)',
    crop: 'Culture',
    waterT: 'Eau sur la parcelle',
    water: {
      rainfed: ['Pluie uniquement', 'Ni source d’eau ni équipement'],
      manual: ['Source d’eau, arrosage manuel', 'Puits, rivière ou citerne, avec des arrosoirs'],
      existing: ['Irrigation déjà en place', 'Motopompe ou goutte à goutte que vous possédez'],
      pump: ['Installer une motopompe', 'Motopompe essence, bassins et arrosoirs, achetés cette saison'],
      drip: ['Installer un goutte à goutte', 'Kit goutte à goutte installé et motopompe, achetés cette saison']
    },
    start: 'Date de démarrage', startHint: 'Semis, ou semis en pépinière pour les cultures repiquées',
    advanced: 'Plus d’options',
    land: 'Terrain', landRent: 'Loué pour la saison', landOwn: 'Terrain personnel',
    market: 'Lieu de vente', marketLocal: 'Marché local (Foumbot, Bafoussam)', marketCity: 'Gros en ville (Douala, Yaoundé)',
    family: 'Travail assuré par la famille', familyHint: 'Le travail familial non payé réduit les liquidités nécessaires ; le travail reste à faire',
    ownTools: 'Je possède déjà les outils de base et un pulvérisateur',
    price: 'Prix de vente attendu (FCFA/kg)', pricePh: 'Votre prix local', priceOptional: 'Facultatif : laissez vide pour utiliser cette référence, ajustée à vos mois de récolte.',
    kBreakEven: 'Prix d’équilibre', atAvgYield: 'Au rendement moyen',
    enterPrice: 'Saisissez votre prix de vente attendu dans le formulaire pour voir les quatre issues et la rentabilité.',
    unpricedNote: (list) => 'Aucun prix sourcé n’a été trouvé pour : ' + list + '. Ces lignes gardent leur quantité mais comptent pour zéro dans le budget : demandez un devis local avant de vous engager.',
    toQuote: 'Devis',
    unusedCapital: (v) => 'Environ ' + v + ' de votre capital reste inutilisé avec cette option d’eau.',
    states: {
      below_min: (min) => 'Le capital est inférieur au minimum de 100 USD (' + min + '). Une vraie parcelle commence à partir de ce montant.',
      upfront_exceeds: () => 'Le capital ne couvre pas l’équipement de l’option d’eau choisie. Choisissez une autre option ou augmentez le capital.',
      manual_limit: (min, max) => 'L’arrosage manuel reste réaliste jusqu’à environ ' + max + ' : le plan s’arrête là. Pour une parcelle plus grande, choisissez une motopompe ou le goutte à goutte.',
      needs_price: (min, max, be) => 'Aucun prix bord champ n’est publié pour cette culture au Cameroun : AfriFarm n’en invente pas. Saisissez le prix que vous comptez obtenir, en FCFA par kg, pour voir les quatre issues. Au rendement moyen, la saison est à l’équilibre à partir d’environ ' + be + ' FCFA/kg.'
    },
    upfrontHint: 'Avec un petit capital : si vous pouvez emprunter un pulvérisateur et des outils, cochez « Je possède déjà les outils de base et un pulvérisateur » dans Plus d’options ; commencez par l’arrosage manuel ou une culture pluviale en saison des pluies, puis investissez dans l’équipement avec les bénéfices de la première saison.',
    kArea: 'Parcelle que le capital couvre', plants: (n) => n + ' plants', kRequired: 'Capital nécessaire', kBudget: 'Budget de la saison', inclReserve: 'Réserve de précaution de 10 % comprise',
    kMargin: 'Marge, issue moyenne', roiAvg: (p) => 'Rentabilité ' + p + ' sur les coûts de la saison', kSeason: 'Durée de la saison',
    compactNote: 'Issue moyenne affichée. Le plan complet détaille le budget ligne par ligne, l’itinéraire technique, la liste d’achats, le bilan hydrique et les risques.',
    openFull: 'Ouvrir le Plan de saison complet',
    tabs: { return: 'Rentabilité', budget: 'Budget', itinerary: 'Itinéraire technique', shopping: 'Liste d’achats', water: 'Eau et risques', sources: 'Sources' },
    scen: {
      good: ['Bonne récolte', 'Rendement de bonnes pratiques et prix ferme à la récolte.'],
      average: ['Récolte moyenne', 'Rendement courant dans la zone et prix habituel des mois de récolte.'],
      poor: ['Mauvaise récolte', 'Rendement paysan faible et prix bas.'],
      failure: ['Échec', 'L’essentiel de la culture perdu (maladie, climat, fermeture des marchés) : seule une petite part est vendue.']
    },
    weight: (n) => 'environ ' + n + ' %', roi: 'Rentabilité',
    yieldL: 'Rendement', priceL: 'Prix', soldL: 'Vendu', revenueL: 'Recettes', costsL: 'Coûts de la saison',
    chartMargins: 'Marge selon l’issue', perSeason: 'Une saison',
    breakEvenT: 'Seuil de rentabilité', beYield: 'Rendement nécessaire au prix moyen', bePrice: 'Prix nécessaire au rendement moyen',
    expected: 'Marge pondérée par le risque', expectedNote: 'Pondérations indicatives par issue, ajustées aux risques de votre fenêtre. Elles seront remplacées par des fréquences mesurées dès que des saisons seront enregistrées.',
    scenNote: '<b>Construction des issues.</b> Les rendements proviennent des références publiées pour chaque culture et chaque saison (pluies ou sèche), ajustés à l’eau fournie par votre option (réponse du rendement à l’eau, FAO-33). Le prix est celui que vous saisissez ; sans lui, la référence camerounaise ajustée à vos mois de récolte. Les issues bonne et faible déplacent le prix d’environ 20 %, l’écart habituel observé sur un même marché au cours d’un mois. Le coût d’un équipement qui dure plusieurs saisons est réparti sur sa durée de vie dans la marge ; l’achat complet figure au budget.',
    cats: { land: 'Terrain', land_preparation: 'Préparation du sol', seed: 'Semences', nursery: 'Pépinière', fertilizer: 'Engrais', amendment: 'Fumure organique et amendements', foliar: 'Engrais foliaires et biostimulants', fungicide: 'Fongicides', insecticide: 'Insecticides', herbicide: 'Herbicides', stakes: 'Tuteurs', trellis: 'Palissage', irrigation: 'Fonctionnement de l’irrigation', labour: 'Main d’œuvre', advice: 'Agronome', harvest: 'Récolte, emballage et transport', equipment: 'Équipement acheté au départ', reserve: 'Réserve de précaution (10 %)', tools: 'Outils', ppe: 'Équipement de protection', packaging: 'Emballage', transport: 'Transport', fuel: 'Carburant', other: 'Autres' },
    lifeSeasons: (n) => 'dure environ ' + n + ' saisons',
    totalBudget: 'Budget total de la saison',
    th: { line: 'Ligne', qty: 'Quantité', unitPrice: 'Prix unitaire (FCFA)', src: 'Source', total: 'Total', item: 'Article', cat: 'Catégorie', need: 'Quantité nécessaire', packs: 'À acheter', cost: 'Coût', block: 'Donnée', conf: 'Confiance', note: 'Fondement' },
    budgetNote: 'Les quantités suivent l’itinéraire standard pour votre surface. Les lignes de récolte, d’emballage et de transport sont calculées sur l’issue moyenne. Les prix unitaires sont des références du marché camerounais ; vérifiez les auprès de votre fournisseur.',
    apps: (n) => n + ' applications', labourDays: (n) => n + ' jours de travail',
    shopNote: 'Quantités arrondies aux conditionnements habituels. L’équipement acheté au départ figure en dernier.',
    waterChart: 'Besoin en eau de la culture et pluie', waterSub: 'mm par mois, période au champ', rainEff: 'pluie fiable', deficit: 'déficit', cropNeed: 'besoin de la culture (ETc)',
    waterVolume: (m3, mm) => 'Eau à apporter sur la saison : environ ' + m3 + ' m³ (' + mm + ' mm de déficit de la culture, pertes d’application comprises).',
    risksT: 'Risques de cette fenêtre',
    riskNames: { water: 'Stress hydrique', heat: 'Chaleur à la floraison', disease: 'Pression des maladies', market: 'Marché à la récolte', context: 'Contexte' },
    riskText: {
      water: (cov, def, opt) => 'L’eau couvre environ ' + cov + ' % du besoin de la culture. La pluie laisse un déficit de ' + def + ' mm' + (opt === 'rainfed' ? ' ; sans irrigation, le rendement baisse d’autant.' : ' ; votre option d’eau le couvre.'),
      heat: (months, t, thr) => 'La floraison tombe en ' + months + ', avec des maximales moyennes proches de ' + t + ' °C. La nouaison souffre au delà d’environ ' + thr + ' °C.',
      disease: (mm, note) => 'Jusqu’à ' + mm + ' mm de pluie par mois de la floraison à la fin de la récolte. ' + note,
      market: (months, idx) => 'Récolte en ' + months + ' : le prix habituel est d’environ ' + idx + ' % de la moyenne annuelle.',
      context: 'Vérifiez élections, fêtes et état des routes pour vos semaines de récolte. Le calendrier de contexte arrive avec le MVP.'
    },
    check: 'À vérifier',
    windowsT: 'Comparaison des mois de démarrage', riskScore: 'score de risque', bestLine: (m) => 'Mois de démarrage le moins risqué avec votre option d’eau : ' + m + '. Sélectionnez un mois pour comparer.',
    levels: ['Faible', 'Moyen', 'Élevé'],
    conf: { high: 'Élevée', medium: 'Moyenne', low: 'Faible' },
    assumptionsT: 'Hypothèses', sourcesT: 'Sources utilisées pour ce plan',
    engineError: 'Le plan ne peut pas être calculé avec ces données. Vérifiez le capital et la date.'
  },
  sim: {
    badge: 'Démo · données illustratives',
    capital: 'Capital', currency: 'Devise',
    approach: 'Approche', budgetFirst: 'Budget d’abord', cropFirst: 'Culture d’abord',
    crop: 'Culture', area: 'Surface souhaitée', areaUnit: 'ha',
    month: 'Mois de démarrage', monthHint: 'Semis, ou pépinière pour les cultures repiquées',
    irrig: 'Irrigation disponible sur le site', equip: 'Ajouter un équipement d’irrigation (référence pilote 5 000 USD)',
    crops: { tomato: 'Tomate', cucumber: 'Concombre', greenbean: 'Haricot vert', zucchini: 'Courgette', pepper: 'Poivron' },
    cropTag: { tomato: 'MVP', other: 'V2' },
    kArea: 'Surface réalisable', kTier: 'Niveau de budget', kCycle: 'Durée de saison',
    weeks: 'semaines', capitalUsd: 'Capital en USD',
    calT: 'Calendrier cultural', calS: 'À partir de la fenêtre choisie',
    nursery: 'Pépinière', growth: 'Croissance au champ', harvest: 'Récolte', flowering: 'Floraison',
    budT: 'Répartition du budget', budS: 'Les coûts variables suivent la répartition du classeur pilote',
    lines: { seeds: 'Semences', labour: 'Main d’œuvre', fert: 'Engrais', pack: 'Emballage', protect: 'Protection des cultures', rent: 'Location du terrain', agro: 'Agronome', equip: 'Équipement', reserve: 'Réserve de précaution', free: 'Non alloué' },
    riskT: 'Risque par mois de démarrage', riskS: 'Règles saisonnières simplifiées · hauts plateaux de l’Ouest Cameroun',
    rows: { water: 'Stress hydrique', disease: 'Maladies', heat: 'Chaleur floraison', all: 'Global' },
    lv: ['Faible', 'Moyen', 'Élevé'],
    best: 'Optimal', yours: 'Choisi',
    bestLine: (b, s) => b === s ? 'Votre mois de démarrage est la fenêtre la moins risquée selon ces règles.' : 'Mois de démarrage le moins risqué selon ces règles : ' + b + '.',
    confT: 'Indice de confiance', confV: 'Faible',
    confD: 'Un seul budget pilote, des règles saisonnières simplifiées, aucun modèle entraîné. Dans le produit, chaque chiffre indique s’il repose sur des données locales, régionales ou un avis d’expert.',
    lockT: 'Fourchettes de rendement et de revenu', lockD: 'Affichées seulement quand les modèles de rendement et de prix battent leur référence sur des années jamais vues (phase 2 de la feuille de route). Jamais un chiffre unique.',
    scen: ['Pessimiste', 'Médian', 'Optimiste'],
    assume: '<b>Hypothèses de la démo.</b> Coût variable de référence de 10 000 USD par hectare et par cycle, issu du classeur budgétaire de Cam_Agri For Africa (1 ha) ; même référence pour toutes les cultures jusqu’à l’enquête producteurs ; réserve de précaution de 10 % ; taux de change indicatifs fixes, non actualisés ; cycles issus du plan de production du fondateur, tomate selon une référence agronomique générale. Le moteur de production remplace chaque hypothèse par des données locales et des modèles entraînés.',
    feasibleOk: 'Le capital couvre la surface demandée.',
    feasibleNo: (a, k) => 'Le capital ne couvre que ' + a + '. Il faudrait environ ' + k + ' pour la surface demandée.',
    feasibleNeg: 'Le capital ne couvre pas l’équipement et la réserve. Retirez l’équipement ou augmentez le capital.',
    tooSmall: 'En dessous du niveau Démarrage : le plan serait une caissette de semis, pas une parcelle.',
    scale: [ [50, 'Échelle d’une pépinière ou d’un potager'], [1000, 'Parcelle maraîchère'], [10000, 'Parcelle de petit exploitant'], [100000, 'Exploitation familiale ou commerciale'], [Infinity, 'Échelle commerciale : plusieurs blocs échelonnés recommandés'] ],
    tiers: ['Démarrage', 'Petit exploitant', 'Commercial', 'Industriel'],
    approx: 'environ',
    firstHarvest: 'Première récolte',
    tt: (m, f, h) => 'Démarrage ' + m + ' · floraison ' + f + ' · récolte dès ' + h
  },

  tiers: [
    { n: 'Démarrage', r: '100 à 1 000 USD', d: 'La culture et la surface que le budget peut porter, une liste d’intrants abordable, un calendrier de pépinière et de plantation, et une alerte claire quand le budget est insuffisant.', w: 'Ménage, étudiant, nouveau producteur' },
    { n: 'Petit exploitant', r: '1 000 à 10 000 USD', d: 'Un Plan de saison complet pour un à quelques hectares : plan d’eau, calendrier phytosanitaire, plan de vente, marge en trois scénarios.', w: 'Exploitation familiale, jeune agripreneur' },
    { n: 'Commercial', r: '10 000 à 100 000 USD', d: 'Plusieurs cultures et plantations échelonnées, dimensionnement de l’irrigation et des équipements, options d’emballage et de logistique, plan de main d’œuvre.', w: 'Ferme commerciale, coopérative, investisseur de la diaspora' },
    { n: 'Industriel', r: '100 000 à plus de 1 000 000 USD', d: 'Un portefeuille de sites et de cultures, des prévisions d’approvisionnement pour acheteurs et transformateurs, des rapports de risque pour prêteurs et assureurs, un accès API.', w: 'Entreprise agroalimentaire, investisseur, transformateur' }
  ],

  map: {
    layers: 'Couches', lPublic: 'Couverture des données publiques', lPilot: 'Zone pilote', lPlan: 'Expansion prévue',
    select: 'Sélectionnez un pays', selectAria: 'Choisir un pays à examiner',
    hint: 'Survolez ou touchez un pays. Zoomez avec les boutons, un double clic, un pincement ou Ctrl et la molette ; glissez pour vous déplacer.',
    zoomIn: 'Zoom avant', zoomOut: 'Zoom arrière', reset: 'Réinitialiser la vue',
    kStatus: 'Statut', kField: 'Données terrain', kPublic: 'Couches publiques', kNext: 'Suite',
    stPilot: 'Zone pilote · MVP', stPlan: 'Prévu · version 4', stPublic: 'Données publiques uniquement',
    publicLayers: 'Historique climatique depuis 1981, pluie à environ 5 km, sols à 250 m, statistiques de production depuis 1961',
    fieldCm: 'Pilote Cam_Agri For Africa : quatre phases, sept. 2024 à oct. 2025, 97 photographies de terrain, coûts réels',
    nextCm: 'Enquête auprès de 30 à 50 producteurs de tomate à Foumbot ; pilote terrain avec 30 producteurs dès mars 2027',
    fieldNone: 'Aucune pour l’instant',
    nextPlan: 'La version 4 ouvre l’Afrique centrale, de l’Ouest et de l’Est, en commençant par le Rwanda et le Kenya, une fois le modèle viable au Cameroun.',
    nextNone: 'L’expansion suit les jalons de la feuille de route.',
    pilotLabel: 'Foumbot · zone pilote',
    loading: 'Initialisation des couches géographiques',
    scaleNote: 'Projection Natural Earth · frontières indicatives'
  },

  ev: [
    { img: 'clearing', p: 'Phase 1 · sept. à oct. 2024', t: 'Lancement sur 1 ha', d: 'Forte croissance initiale ; une chaleur extrême a jauni les concombres à la récolte ; irrigation par motopompe coûteuse et insuffisante.', r: 'Récolte partielle, résultat négatif' },
    { img: 'bulk-sacks', p: 'Phase 2 · nov. 2024 à mars 2025', t: 'Site secondaire marécageux', d: 'La chaleur à la floraison, sans irrigation automatisée, a détruit le poivron ; ventes en vrac en sacs de 50 kg.', r: 'Coûts couverts au mieux' },
    { img: 'tomato-rows', p: 'Phase 3 · avr. à juil. 2025', t: 'Tomate tuteurée', d: 'Pression des mouches blanches et pourriture des fruits, en partie maîtrisées ; bonne qualité mais prix locaux bas.', r: 'Aucun bénéfice' },
    { img: 'harvest-2025', p: 'Phase 4 · août à oct. 2025', t: 'Relance du site principal', d: 'Bonne croissance et récolte dès le milieu d\u2019octobre ; une crise électorale a ensuite fermé marchés et transports.', r: 'Perte commerciale totale' }
  ],

  newsletter: {
    eyebrow: 'Lettre d’information',
    h: 'Gardez une longueur d’avance en intelligence agricole.',
    d: 'Notes de terrain de Foumbot, progrès des modèles, sources de données et nouvelles versions. Ponctuelle, en anglais ou en français. Désinscription à tout moment.',
    email: 'Adresse électronique', ph: 'vous@organisation.com', btn: 'S’abonner',
    consent: 'J’accepte de recevoir les actualités d’AfriFarm Intelligent et la politique de confidentialité.',
    okT: 'C’est fait.', okD: 'Vous recevrez les actualités et analyses d’AfriFarm Intelligent.',
    dupT: 'Déjà inscrit.', dupD: 'Cette adresse figure déjà sur la liste. Rien d’autre à faire.',
    langPref: 'Langue préférée'
  },

  platform: {
    eyebrow: 'Plateforme',
    h1: 'Un moteur. Quatre produits. Tous les budgets.',
    lead: 'AfriFarm Intelligent se présente sous forme de quatre produits qui partagent un moteur, un compte et un modèle de données, afin que chaque utilisateur accède à la plateforme par le canal qui lui convient.',
    waysH: 'Deux portes d’entrée, la même réponse.',
    ways: [
      { k: 'Budget d’abord', q: '« J’ai ce montant. Que faire ? »', d: 'La plateforme classe les cultures et les fenêtres de plantation adaptées au capital, au lieu et à la saison, et explique pourquoi.' },
      { k: 'Culture d’abord', q: '« Je veux cultiver de la tomate sur un hectare en mars. »', d: 'La plateforme vérifie si le capital suffit, construit le plan et propose une meilleure fenêtre ou une surface plus petite quand le risque ou le coût est trop élevé.' }
    ],
    currency: 'Le capital peut être saisi en franc CFA, dollar américain, euro, franc rwandais, shilling kényan, naira ou toute autre devise, converti au cours du jour.',
    planEyebrow: 'Le Plan de saison',
    planH: 'Dix réponses avant l’achat de la première semence.',
    planLead: 'Chaque réponse est exprimée en fourchette, avec les éléments qui la fondent. Dans la démo de la page d’accueil, les sorties marquées « en direct » sont calculées dans votre navigateur.',
    live: 'En direct dans la démo',
    plan: [
      ['Faisabilité', 'La surface que le capital peut porter, ou une alerte explicite indiquant qu’il ne peut pas porter la surface demandée.', 1],
      ['Calendrier cultural', 'Pépinière, repiquage, dates de première et dernière récolte, durée totale du cycle.', 1],
      ['Intrants et budget', 'Semences, engrais, protection des cultures, main d’œuvre, irrigation, transport, emballage et appui d’experts, comparés au capital.', 1],
      ['Plan d’eau', 'Besoins en eau de la culture face aux pluies attendues, semaine par semaine, avec l’irrigation nécessaire et son coût.', 0],
      ['Fourchettes de rendement et de revenu', 'Pessimiste, médiane et optimiste. Jamais un chiffre unique.', 0],
      ['Perspectives de marché à la récolte', 'Tendance de prix attendue et risque de surproduction pendant les semaines de récolte.', 0],
      ['Plan de vente et d’emballage', 'Canal d’achat, format d’emballage et différence de prix qu’il apporte.', 0],
      ['Carte des risques', 'Climat, ravageurs et maladies, faune, marché, logistique et contexte, chacun évalué avec sa mesure d’atténuation.', 1],
      ['Meilleure fenêtre', 'Les dates de plantation les plus sûres et les plus rentables, comparées à la date demandée.', 1],
      ['Indice de confiance', 'Ce sur quoi repose chaque chiffre (données locales, régionales, avis d’expert) et sa fiabilité.', 1]
    ],
    prodEyebrow: 'Gamme de produits',
    prodH: 'Quatre canaux, un seul compte.',
    prodCols: ['Produit', 'Utilisateurs', 'Rôle', 'Version'],
    products: [
      ['AfriFarm Mobile', 'Agriculteurs au champ', 'Simulateur de saison, journal de saison et alertes ; fonctionne hors ligne. Android d’abord, iOS ensuite.', 'mvp'],
      ['AfriFarm Web', 'Investisseurs, coopératives, entreprises agroalimentaires', 'Tableau de bord complet, portefeuille de parcelles et de saisons, rapports.', 'mvp'],
      ['AfriFarm Alertes', 'Tous les agriculteurs, y compris sur téléphone simple', 'Alertes météo, chaleur, maladies et marché par WhatsApp et SMS ; requêtes simples.', 'v2'],
      ['AfriFarm Pro et API', 'Banques, assureurs, acheteurs, institutions publiques', 'Prévisions d’approvisionnement agrégées et profils de risque de saison, avec le consentement des agriculteurs ; services de données.', 'v3']
    ],
    modEyebrow: 'Modules',
    modH: 'Neuf modules, publiés derrière des jalons stricts.',
    modules: [
      ['Simulateur de saison', 'Planification budget d’abord ou culture d’abord, Plan de saison avec fourchettes et indice de confiance, calendrier des risques de contexte.', 'mvp'],
      ['Climat et météo', '40 ans d’historique local, prévisions à 10 jours, alertes de chaleur et de pluie.', 'mvp'],
      ['Santé des cultures', 'Risque de ravageurs et de maladies par stade (mildiou, mouches blanches, chenilles), calendrier de traitement.', 'mvp'],
      ['Journal de saison', 'Opérations, dépenses, récoltes, ventes et photos, saisies en quelques secondes.', 'mvp'],
      ['Marchés et prix', 'Prix par marché (Foumbot, Bafoussam, Douala, Yaoundé et d\u2019autres), saisonnalité, relevés communautaires.', 'v2'],
      ['Vente, emballage et logistique', 'Mise en relation avec les acheteurs, dont les commerçants des pays voisins, formats d’emballage, estimation du transport.', 'v2'],
      ['Sol et site', 'Données de sol par satellite, interprétation d’analyses de laboratoire, conseil de fertilisation, score de site.', 'v2'],
      ['Experts et communauté', 'Consultations payantes avec des agronomes vérifiés, forums modérés par culture et par zone.', 'v2'],
      ['Veille de contexte', 'Alertes économiques, sociales et sécuritaires régionales, risque de contexte en temps réel.', 'v3']
    ],
    cycleEyebrow: 'Cycle de saison',
    cycleH: 'Avant, pendant et après la saison.',
    cycle: [
      ['Avant de planter', 'Le Plan de saison éclaire la décision : surface, calendrier, budget, risques et meilleure fenêtre.'],
      ['Pendant la saison', 'Le plan devient un tableau de bord vivant : alertes météo, chaleur et maladies, rappels d’opérations, coûts réels.'],
      ['Après la récolte', 'L’agriculteur compare le plan et la réalité. Les résultats nourrissent la base et affinent les prochaines prédictions pour tous.']
    ],
    prinEyebrow: 'Principes de conception',
    prinH: 'Conçu pour le champ, pas pour la salle de démonstration.',
    principles: [
      ['Bilingue par conception', 'Chaque écran existe en anglais et en français dès la première version ; les langues locales suivront.'],
      ['Hors ligne d’abord', 'L’application mobile fonctionne sans réseau et se synchronise au retour du signal.'],
      ['Économe en données', 'Échanges légers, grandes icônes et peu de saisie, pour les téléphones simples et les réseaux lents.'],
      ['Des chiffres honnêtes', 'Chaque prédiction est affichée avec sa fourchette et son niveau de confiance.']
    ]
  },

  intel: {
    eyebrow: 'Intelligence',
    h1: 'Quatre couches de connaissance. Aucune boîte noire.',
    lead: 'Le moteur combine une base de référence agronomique, des modèles d’apprentissage automatique, une validation par des experts et des données de saison propriétaires. C’est cette combinaison, et non l’apprentissage automatique seul, qui rend les prédictions crédibles dès le premier jour et plus précises à chaque saison.',
    archEyebrow: 'Architecture',
    archH: 'De sept domaines de données à une décision sur une parcelle.',
    archLead: 'Sélectionnez un composant pour voir son rôle, sa technologie et sa version. Le cœur technique, de la collecte des données aux modèles et à l’API, est écrit en Python.',
    cols: ['Données', 'Moteur d’intelligence', 'Intelligence', 'Décisions'],
    layersEyebrow: 'Couches de connaissance',
    layersH: 'Pourquoi les prédictions sont fiables dès le premier jour.',
    layerCols: ['Couche', 'Rôle', 'Source de fiabilité', 'Disponible'],
    layers: [
      ['Base de référence agronomique', 'Durées de cycle, besoins en eau, seuils de température, conduite des cultures, coûts standard par culture et par zone.', 'Recherche établie (FAO et instituts nationaux), validée par des agronomes.', 'mvp'],
      ['Modèles statistiques et d’apprentissage automatique', 'Risque climatique, risque de ravageurs et de maladies, rendement, prix à la récolte, meilleure fenêtre.', 'Entraînés et testés sur des données historiques, avec une erreur mesurée.', 'mvp'],
      ['Validation par des experts', 'Revue des cas que les modèles couvrent mal, calibrage local.', 'Des agronomes qui connaissent chaque zone.', 'v2'],
      ['Données de saison propriétaires', 'Coûts, rendements, prix et incidents réels enregistrés par les utilisateurs.', 'Locales, récentes et propres à AfriFarm.', 'grow']
    ],
    grow: 'S’enrichit à chaque saison',
    modelsEyebrow: 'Modèles',
    modelsH: 'Cinq questions, cinq modèles, cinq métriques de succès.',
    modelCols: ['Question', 'Méthode', 'Données d’entraînement', 'Métrique de succès'],
    models: [
      ['Quelle probabilité d’excès de pluie, de chaleur à la floraison ou de sécheresse pour cette date et ce lieu ?', 'Classification : référence logistique, gradient boosting', '40 ans de météo journalière ; seuils agronomiques par stade', 'Rappel sur les saisons défavorables, ROC AUC'],
      ['Quelle sera la pression du mildiou, des mouches blanches ou des chenilles ?', 'Indice de risque agronomique, puis classification supervisée', 'Météo, stade de la culture, incidents signalés par les utilisateurs', 'Précision et rappel sur les foyers signalés'],
      ['Quelle fourchette de rendement attendre de cette saison ?', 'Régression : référence linéaire régularisée, forêt aléatoire, XGBoost, avec intervalles de prédiction', 'Séries de rendement avec le climat, puis journaux de saison à la parcelle', 'MAE et RMSE face à une référence historique'],
      ['Quel prix est probable pendant les semaines de récolte, sur quel marché ?', 'Modèles de séries temporelles saisonnières et gradient boosting', 'Séries de prix de marché et relevés de prix de terrain', 'Erreur absolue moyenne en pourcentage'],
      ['Quelle option offre la meilleure marge pour un risque acceptable avec ce budget ?', 'Optimisation sous contraintes sur les sorties des modèles', 'Sorties des modèles précédents et base de coûts', 'Marge à risque, validation par l’utilisateur']
    ],
    modelNames: ['Risque climatique d’une fenêtre de plantation', 'Risque de ravageurs et de maladies', 'Rendement attendu', 'Prix à la récolte', 'Meilleure culture et fenêtre'],
    xaiEyebrow: 'Explicable par conception',
    xaiH: 'Aucune prédiction sans ses facteurs et son incertitude.',
    xaiLead: 'Les attributions de variables (SHAP) expliquent chaque estimation, et des intervalles de prédiction remplacent les chiffres uniques. Cette transparence crée la confiance des agriculteurs et conditionne celle des prêteurs et des assureurs.',
    xaiCard: 'Alerte de risque',
    xaiFlag: 'Risque élevé',
    xaiText: 'Au cours de la plupart des 40 dernières années, de fortes pluies sont tombées pendant la floraison pour cette date de plantation.',
    xaiDrivers: 'Facteurs de cette alerte',
    xaiNote: 'Présentation illustrative d’une explication. Directions uniquement ; aucune sortie de modèle n’est affichée.',
    drivers: [['Pluie pendant la floraison', 1], ['Humidité relative à la nouaison', 1], ['Historique des maladies dans la zone', 1], ['Maîtrise de l’irrigation sur la parcelle', -1]],
    raises: 'augmente le risque', lowers: 'réduit le risque',
    paceEyebrow: 'Méthode scientifique',
    paceH: 'Planifier. Analyser. Construire. Exécuter.',
    paceLead: 'Le développement des modèles suit le cadre PACE du Google Advanced Data Analytics Professional Certificate obtenu par le fondateur. Chaque modèle est comparé à une référence simple, validé dans l’ordre chronologique sur des années jamais vues, et audité pour ses erreurs par zone, culture et saison avant sa mise en service.',
    pace: [['Planifier', 'Définir la décision, les utilisateurs, la métrique de succès et les limites éthiques.'], ['Analyser', 'Auditer les sources, nettoyer les données, explorer les tendances par zone, culture et saison.'], ['Construire', 'Bâtir des références et des modèles, valider sur des années jamais vues, expliquer avec SHAP.'], ['Exécuter', 'Publier derrière un jalon, surveiller les erreurs, réentraîner au fil des saisons enregistrées.']],
    raiEyebrow: 'IA responsable',
    raiH: 'Des principes qui tiennent sous pression.',
    rai: ['Les prédictions éclairent les décisions et ne les remplacent jamais.', 'L’incertitude est toujours affichée.', 'Aucun score n’est utilisé automatiquement pour exclure un agriculteur du crédit ou de l’assurance.', 'Les zones et profils moins représentés sont suivis explicitement.', 'Les agriculteurs peuvent consulter, corriger et exporter leurs propres données.']
  },

  arch: {
    nodes: {
      weather: ['Météo', 'Pluie, température, humidité et rayonnement journaliers depuis 1981 (NASA POWER), réanalyse horaire (ERA5-Land) et prévisions à 10 jours.', 'MVP'],
      satellite: ['Satellite', 'Indice de végétation Sentinel-2 des parcelles tous les quelques jours via Google Earth Engine ; estimations de pluie à environ 5 km (CHIRPS).', 'Version 2'],
      soil: ['Sol', 'pH, carbone organique, texture et azote à 250 m (SoilGrids), vérifiés par des analyses de laboratoire de référence.', 'Version 2'],
      crop: ['Culture', 'Durées de cycle, besoins en eau, seuils de température et stades sensibles par culture, issus de la base de référence agronomique.', 'MVP'],
      ops: ['Opérations', 'Le journal de saison : opérations, dépenses, récoltes, ventes et photos saisies par les utilisateurs, plan contre réalité.', 'MVP'],
      markets: ['Marchés', 'Relevés de prix hebdomadaires à Foumbot et Bafoussam par un correspondant rémunéré, puis par la communauté ; séries de prix publiques.', 'Version 2'],
      history: ['Historique', 'Production et rendements depuis 1961 (FAOSTAT), le pilote Cam_Agri For Africa comme jeu de données fondateur, un calendrier de contexte.', 'MVP'],
      ref: ['Base agronomique', 'Connaissances de référence validées par des agronomes : le socle de fiabilité dès le premier jour.', 'MVP'],
      ml: ['Modèles ML', 'Python, pandas, scikit-learn, XGBoost, statsmodels ; versionnés et comparés dans MLflow.', 'MVP'],
      expert: ['Validation experte', 'Des agronomes revoient les cas mal couverts par les modèles et calibrent localement.', 'Version 2'],
      seasons: ['Données de saison', 'Coûts, rendements et prix réels de chaque saison enregistrée : l’avantage propriétaire.', 'S’enrichit à chaque saison'],
      analytics: ['Analytique', 'Pipelines de données et contrôles de qualité quotidiens ; PostgreSQL avec PostGIS pour les parcelles et les cartes.', 'MVP'],
      ai: ['IA', 'Modèles de classification et de régression avec explications SHAP et intervalles de prédiction.', 'MVP'],
      predict: ['Prédiction', 'Risque climatique, pression des maladies, rendement et prix à la récolte, chacun en fourchette avec un indice de confiance.', 'Progressif'],
      optim: ['Optimisation', 'Optimisation sous contraintes : la meilleure culture et la meilleure fenêtre pour un risque acceptable dans le budget.', 'Version 2'],
      plan: ['Plan de saison', 'Surface réalisable, calendrier, budget, plan d’eau, risques, meilleure fenêtre et confiance, via un service FastAPI.', 'MVP'],
      alerts: ['Alertes', 'Alertes météo, chaleur, maladies et marché par application, WhatsApp et SMS.', 'Version 2'],
      dash: ['Tableaux de bord', 'Tableaux de bord de saison pour les agriculteurs ; vues de portefeuille pour investisseurs et coopératives (React, Next.js).', 'MVP'],
      api: ['API', 'Services de données agrégées et consenties pour banques, assureurs, acheteurs et institutions publiques.', 'Version 3']
    },
    hint: 'Sélectionnez un composant',
    rel: 'Version'
  },

  solutions: {
    eyebrow: 'Solutions',
    h1: 'Pour tous ceux qui engagent du capital dans une saison.',
    lead: 'L’agriculteur est le premier utilisateur et la source des données. Les institutions qui ont besoin d’une information agricole fiable sont les clients qui paieront le plus.',
    who: 'Bénéficiaires', whoH: 'Sept profils, un moteur commun.',
    need: 'Besoin', value: 'Valeur apportée', model: 'Modèle de revenu', ask: 'Une question typique',
    personas: [
      ['Petit exploitant', 'Une saison sûre et une marge correcte', 'Plan de saison, alertes et registres', 'Offre de base gratuite ; abonnement premium abordable', 'J’ai 300 000 FCFA. Que planter en mars, et sur quelle surface ?'],
      ['Investisseur et diaspora', 'La confiance avant d’investir', 'Simulation complète, revue d’expert, tableau de suivi', 'Abonnement premium, rapports payants', '50 000 USD suffisent pour une saison commerciale de tomate près de Foumbot ? Quels sont les risques ?'],
      ['Coopérative', 'Des volumes et un calendrier coordonnés', 'Vue agrégée des saisons des membres', 'Licence organisation', 'Comment échelonner les plantations de nos membres pour éviter de vendre tous pendant la même surproduction ?'],
      ['Agroalimentaire et acheteur', 'Un approvisionnement et une qualité prévisibles', 'Prévisions d’approvisionnement par zone et par mois, producteurs vérifiés', 'Licence entreprise, frais de mise en relation', 'Quels volumes attendre de la région de l’Ouest en août, et de qui ?'],
      ['Banque et assureur', 'Un risque agricole mesurable', 'Profils de risque de saison et historique du producteur, avec consentement', 'Licence de données et d’API', 'Quel est le risque climatique et de contexte de ce prêt de campagne avant décaissement ?'],
      ['Agronome', 'Des clients et de la visibilité', 'Une place de marché de consultations payantes', 'Commission sur les consultations', 'Quels producteurs de ma zone ont besoin d’une visite avant la floraison ?'],
      ['Institution publique', 'Des preuves pour les politiques et programmes', 'Analyses agrégées de production et de risque', 'Contrats de programme et licences', 'Où cibler l’investissement en irrigation la saison prochaine ?']
    ],
    tiersEyebrow: 'Niveaux de budget',
    tiersH: 'La profondeur du plan grandit avec le capital.',
    posEyebrow: 'Positionnement',
    posH: 'Une place distincte dans la technologie agricole.',
    posCols: ['', 'Plateformes mondiales de gestion d’exploitation', 'Services numériques sur un seul maillon', 'AfriFarm Intelligent'],
    pos: [
      ['Point de départ', 'Données des machines et capteurs', 'Un maillon : conseil, crédit ou accès au marché', 'Le capital de l’utilisateur'],
      ['Conçu pour', 'Exploitations mécanisées et équipées', 'Une étape de la chaîne de valeur', 'Tout budget, dès 100 USD'],
      ['Intégration', 'Opérations de l’exploitation', 'Un seul domaine', 'Climat, sol, marché et contexte dans un plan chiffré'],
      ['Langues', 'Surtout l’anglais', 'Variable', 'Anglais et français dès le premier écran']
    ]
  },

  data: {
    eyebrow: 'Données',
    h1: 'Des données publiques dès le premier jour. Des données terrain qui s’accumulent.',
    lead: 'Le climat et les sols peuvent être couverts dès le premier jour grâce à des données publiques gratuites. Les prix de marché et les résultats réels des saisons ne le peuvent pas, et leur collecte systématique est l’avantage concurrentiel durable d’AfriFarm.',
    landEyebrow: 'Contexte',
    landH: 'La terre et l’eau sont là. Les décisions fiables, non.',
    landLead: 'Le Cameroun, pays pilote, cultive environ un hectare sur quatre de ses terres arables et irrigue moins d’un hectare sur sept de son potentiel irrigable.',
    landA: 'Terres arables', landB: 'Cultivées', landC: 'Potentiel irrigable', landD: 'Irriguées (borne haute)',
    landT1: 'Terres, millions d’hectares', landT2: 'Irrigation, milliers d’hectares',
    landSrc: 'Source : ministère de l’Agriculture et du Développement rural (MINADER), rapporté par Business in Cameroon. Le chiffre irrigué est une borne haute rapportée (moins de 33 000 ha).',
    covEyebrow: 'Profondeur temporelle',
    covH: 'Des décennies d’historique derrière chaque Plan de saison.',
    covLead: 'Année de départ de chaque source publique du socle de données. Plus l’historique est long, mieux on estime la fréquence d’échec d’une fenêtre de plantation.',
    covNote: 'Années de départ publiées par chaque fournisseur. SoilGrids est une carte statique, présentée à sa version actuelle.',
    srcEyebrow: 'Socle de données publiques',
    srcH: 'Neuf sources, chacune auditée avant usage.',
    srcCols: ['Domaine', 'Source', 'Couverture et usage', 'Statut'],
    sources: [
      ['Historique météo journalier', 'NASA POWER', 'https://power.larc.nasa.gov/', 'Pluie, température, humidité, rayonnement depuis 1981 ; accès direct en Python', 'Gratuit ; à confirmer lors de l’audit'],
      ['Pluie, haute résolution', 'CHIRPS, UCSB', 'https://www.chc.ucsb.edu/data/chirps', 'Pluie à environ 5 km depuis 1981', 'Gratuit ; à confirmer'],
      ['Réanalyse de référence', 'ERA5-Land, Copernicus', 'https://cds.climate.copernicus.eu/', 'Variables horaires à environ 9 km', 'Gratuit avec inscription'],
      ['Sols', 'SoilGrids, ISRIC', 'https://soilgrids.org/', 'pH, carbone organique, texture, azote à 250 m', 'Gratuit, licence CC BY'],
      ['Végétation', 'Sentinel-2 via Google Earth Engine', 'https://earthengine.google.com/', 'Indice de végétation des parcelles tous les quelques jours', 'Gratuit pour la recherche ; conditions commerciales applicables'],
      ['Production et rendements', 'FAOSTAT', 'https://www.fao.org/faostat/', 'Surface, production et rendement par culture, pays et année depuis 1961', 'Gratuit'],
      ['Prix alimentaires', 'Prix du PAM pour le Cameroun, HDX', 'https://data.humdata.org/dataset/wfp-food-prices-for-cameroon', 'Prix de marché 2005 à 2024, surtout régions septentrionales', 'Couverture tomate et région de l’Ouest à vérifier'],
      ['Statistiques nationales', 'Institut national de la statistique, MINADER', '', 'Production par région', 'Disponibilité à vérifier'],
      ['Contexte sécuritaire', 'ACLED', 'https://acleddata.com/', 'Événements géolocalisés par région', 'Licence commerciale à vérifier']
    ],
    propEyebrow: 'Données propriétaires',
    propH: 'Les données qu’aucun concurrent ne peut copier.',
    prop: [
      ['Le pilote Cam_Agri For Africa', 'Quatre phases documentées, des coûts réels, des incidents datés et 97 photographies de terrain, structurés comme jeu de données fondateur.'],
      ['Enquête producteurs', '30 à 50 producteurs de tomate de Foumbot interrogés sur leurs saisons récentes : rendement, coûts, pertes, prix de vente.'],
      ['Relevé des prix de terrain', 'Deux à trois relevés de prix par semaine sur les marchés de Foumbot et de Bafoussam, par un correspondant rémunéré, puis par la communauté.'],
      ['Analyses de sol de référence', 'Analyses de laboratoire sur des parcelles choisies pour vérifier au sol les données satellitaires.'],
      ['Le journal de saison', 'Chaque utilisateur actif enregistre une saison complète par cycle, plan contre réalité.']
    ],
    flyH: 'Le volant de données',
    fly: ['Les producteurs planifient', 'Les journaux enregistrent la réalité', 'Les modèles se réentraînent', 'Les fourchettes se resserrent'],
    flyNote: 'Les données publiques peuvent être copiées par n’importe quel concurrent ; des années de saisons enregistrées à Foumbot puis ailleurs, non.',
    govEyebrow: 'Gouvernance',
    govH: 'Les agriculteurs sont propriétaires de leurs données.',
    gov: ['Les données individuelles ne sont utilisées qu’avec un consentement explicite.', 'Les données ne sont jamais vendues.', 'Les tiers ne reçoivent que des données agrégées et anonymisées.', 'Chaque source figure dans un registre des licences.', 'Conformité à la législation camerounaise sur les données personnelles et aux règles de chaque nouveau pays d’opération.']
  },

  impact: {
    eyebrow: 'Impact',
    h1: 'Des résultats mesurés, pas promis.',
    lead: 'AfriFarm publiera son impact à partir du pilote terrain de mars 2027. D’ici là, cette page présente ce qui sera mesuré et les preuves terrain sur lesquelles la plateforme est construite.',
    kpiEyebrow: 'Ce que nous mesurerons',
    kpiH: 'Six indicateurs, publiés dès la première saison pilote.',
    kpiBase: 'Référence établie pendant le pilote 2027',
    kpis: [
      ['Précision des prédictions', 'Écart entre rendement, coût et prix prévus et réels, par saison.', 'Prouve que le moteur fonctionne et oriente le réentraînement.'],
      ['Saisons complétées', 'Part des saisons planifiées enregistrées jusqu’à la récolte.', 'Mesure l’engagement et la qualité des données.'],
      ['Adoption du plan', 'Part des utilisateurs qui suivent la fenêtre et les intrants recommandés.', 'Mesure la confiance dans les recommandations.'],
      ['Résultat de l’agriculteur', 'Marge par hectare comparée aux saisons précédentes du producteur.', 'Mesure l’impact économique réel.'],
      ['Utilité des alertes', 'Part des alertes jugées utiles par les agriculteurs.', 'Garde les alertes pertinentes et rares.'],
      ['Clients payants', 'Abonnés premium et licences institutionnelles.', 'Mesure la viabilité financière.']
    ],
    pilotEyebrow: 'Le pilote',
    pilotH: 'Quatre phases. Quatre leçons payées au prix fort.',
    pilotLead: 'Le pilote a été lancé avec 5 000 USD de fonds propres du fondateur, puis soutenu par les revenus des saisons et son épargne personnelle. Chaque phase a perdu de l’argent ou a tout juste équilibré ses coûts.',
    lessonsEyebrow: 'De la leçon à l’exigence',
    lessonsH: 'Chaque problème de terrain est devenu une exigence produit.',
    prob: 'Problème de terrain', req: 'Exigence AfriFarm',
    lessons: [
      ['Chaleur à la floraison', 'Concombres jaunis, poivron perdu', 'Score de risque climatique par fenêtre, alertes de chaleur, besoin d’irrigation dans chaque Plan de saison'],
      ['Irrigation coûteuse et insuffisante', 'Pompage manuel depuis une source marécageuse', 'Budget d’eau et ligne de coût d’irrigation, avec options d’équipement adaptées au budget'],
      ['Pression des ravageurs', 'Mouches blanches, chenilles, pourriture des fruits', 'Calendrier des risques par stade, alertes, diagnostic par photo dans une version ultérieure'],
      ['Exposition du site', 'Singes, site isolé, transport coûteux', 'Score de site : eau, accès routier, exposition à la faune, distance au marché'],
      ['Ventes en vrac', 'Sacs de 50 kg à bas prix', 'Plan de vente et d’emballage : canal, format, prix au kilo comparé au vrac'],
      ['Marchés fermés', 'Une crise électorale au moment de la récolte', 'Calendrier des risques de contexte (élections, fêtes, routes, sécurité) dès la première version']
    ],
    photosEyebrow: 'Relevé terrain',
    photosH: 'À quoi ressemblait le pilote.',
    photos: [
      ['pump', 'L’eau, le coût caché', 'Motopompe puisant dans une source marécageuse.'],
      ['heat-damage', 'Stress climatique', 'Concombres jaunis par la chaleur, invendables.'],
      ['cucumber-field', 'Développement des cultures', 'Rangs de concombre buttés et tuteurés, site principal, 2024.'],
      ['nursery', 'Pépinière professionnalisée', 'Plants sous filet de protection contre les insectes, site secondaire, 2025.']
    ],
    goalH: 'L’impact visé',
    goal: 'Chaque saison planifiée avec AfriFarm vise moins de récoltes perdues, un meilleur usage d’un capital et d’une eau rares, et un revenu plus élevé pour l’agriculteur. À grande échelle, les mêmes données aident les prêteurs à financer l’agriculture avec moins de risque et les institutions publiques à cibler leur appui, au service de la sécurité alimentaire et d’un emploi rural digne pour les jeunes Africains.'
  },

  about: {
    eyebrow: 'À propos',
    h1: 'Du champ d’un père à Foumbot à une plateforme d’intelligence.',
    lead: 'AfriFarm Intelligent est le fruit de plus de dix ans de travail, d’une tradition agricole familiale à un pilote de terrain documenté, photographié et chiffré.',
    leadEyebrow: 'Porteur du projet',
    name: 'Franck Junior Djandja Tomwa',
    titles: ['Ingénieur en télécommunications', 'Analyste de données', 'Chargé des opérations internationales'],
    base: 'Basé à Kigali, Rwanda · Zone pilote à Foumbot, Cameroun',
    photoAlt: 'Franck Junior Djandja Tomwa tenant des tomates mûres entre des rangs tuteurés, région de Foumbot, 2025',
    story: [
      'Le projet commence avec le père du fondateur, agriculteur dans la région de Foumbot, qui lui a transmis le métier de la terre, y compris la production d’excellentes semences à partir de ses propres récoltes.',
      'En septembre 2021, avant de se rendre à Kigali pour présenter sa vision d’une agriculture africaine industrialisée et portée par la technologie, le fondateur a séjourné sur la plantation de son père, où tomate, aubergine et concombre poussaient sur des parcelles à différents stades.',
      'De cet héritage est né Cam_Agri For Africa, un pilote agricole commercial mené de septembre 2024 à octobre 2025. Il n’a pas échoué faute de terre, de main d’œuvre ou d’engagement. Il a échoué parce que chaque décision critique a été prise sans l’information qui l’aurait changée. AfriFarm Intelligent existe pour fournir cette information, pour tout budget, avant que le capital ne soit engagé.'
    ],
    convEyebrow: 'Convictions',
    convH: 'Quatre convictions derrière ce travail.',
    conv: [['L’Afrique doit assurer sa propre alimentation.', 'La sécurité alimentaire commence par des fermes locales productives et rentables.'], ['L’agriculture peut offrir un travail digne.', 'Une vraie alternative à l’émigration pour les jeunes Africains.'], ['L’agriculture est une entreprise.', 'Menée avec des chiffres, des plans et un risque mesuré.'], ['Le Cameroun est le bon point de départ.', 'Des terres arables, les ports de Douala et de Kribi, et des acheteurs du Gabon et de Guinée équatoriale.']],
    mileEyebrow: 'Jalons',
    mileH: 'Dix ans de travail, en six moments.',
    miles: [
      ['Septembre 2021', 'Visite de la plantation du père', 'Tomate, aubergine et concombre ; puis Kigali, pour présenter la vision à des entrepreneurs.'],
      ['Septembre 2024', 'Lancement du pilote Cam_Agri For Africa', 'Site principal de 1 ha, 5 000 USD de fonds propres ; problèmes de chaleur, d’eau et d’emballage.'],
      ['Nov. 2024 à juil. 2025', 'Site secondaire marécageux', 'Concombre, poivron et courgette, puis tomate tuteurée ; ravageurs et prix bas.'],
      ['Août à oct. 2025', 'Relance du site principal', 'Belle culture, mais une crise électorale a fermé les marchés à la récolte : perte commerciale totale.'],
      ['Septembre 2026', 'Certification en analyse de données avancée', 'Google Advanced Data Analytics Professional Certificate : Python, apprentissage automatique.'],
      ['Octobre 2026', 'Conception d’AfriFarm Intelligent', 'Une plateforme de décision pour tout budget, en anglais et en français.']
    ],
    roadEyebrow: 'Feuille de route',
    roadH: 'Cinq phases et quatre jalons jusqu’au pilote de mars 2027.',
    roadLead: 'Un jalon ne s’ouvre que lorsque son critère est atteint. Les durées supposent 10 à 15 heures de travail par semaine et seront révisées une fois l’équipe en place.',
    now: 'En cours',
    road: [
      ['Phase 0', 'Cadrage', 1, 2, 'Décisions du fondateur, jeu de données pilote structuré, rapport approuvé en anglais et en français, dépôt GitHub.', 'Périmètre du MVP approuvé par le fondateur'],
      ['Phase 1', 'Validation terrain', 3, 6, 'Enquête auprès de 30 à 50 producteurs de Foumbot, relevés de prix, audit des données, maquettes papier testées avec 10 producteurs.', 'Besoin confirmé et disposition à payer mesurée'],
      ['Phase 2', 'Données et modèles', 7, 14, 'Projet PACE du certificat : pipelines, exploration, modèles de risque climatique, de maladies et de rendement, analyse des erreurs, publié sur GitHub.', 'Chaque modèle bat sa référence sur des années jamais vues'],
      ['Phase 3', 'Prototype', 15, 20, 'Simulateur de saison bilingue connecté aux modèles, testé avec 10 producteurs à Foumbot.', '10 producteurs jugent le Plan de saison utile'],
      ['Phase 4', 'Pilote MVP', 21, 32, 'Applications Android et web, journal de saison, alertes ; 30 producteurs suivis sur une saison complète dès mars 2027.', 'Saison complétée et plan jugé utile']
    ],
    gate: 'Jalon', week: 'Semaine', roadHl: 'En surbrillance : la phase 2, projet d’analyse de données avancée (PACE), publié sur GitHub. Les losanges marquent les jalons.',
    expEyebrow: 'Expansion',
    expH: 'Culture par culture, région par région.',
    expCols: ['Version', 'Cultures', 'Géographie', 'Critère de passage'],
    exp: [
      ['MVP', 'Tomate', 'Foumbot et ses environs', '30 producteurs actifs complètent une saison et jugent le Plan de saison utile'],
      ['Version 2', 'Ajoute concombre, haricot vert, courgette, poivron', 'Département du Noun et Bafoussam', 'Prédictions de rendement mesurées sur une saison réelle ; premiers abonnés payants'],
      ['Version 3', 'Ajoute maïs, sorgho et autres cultures vivrières', 'Région de l’Ouest, puis autres régions du Cameroun', 'Au moins un partenariat signé avec une institution financière'],
      ['Version 4', 'Large catalogue de cultures', 'Afrique centrale, de l’Ouest et de l’Est, en commençant par le Rwanda et le Kenya', 'Modèle économique viable au Cameroun']
    ],
    refH: 'La ferme de référence',
    ref: 'En parallèle, et sous réserve d’un financement d’au moins 100 000 USD, la ferme Cam_Agri For Africa sera relancée comme site de référence d’AfriFarm, où chaque recommandation est testée à l’échelle commerciale avec irrigation automatisée, transport et emballage. 20 000 USD ne permettraient qu’une relance partielle.'
  },

  contact: {
    eyebrow: 'Contact',
    h1: 'Parlez à AfriFarm Intelligent.',
    lead: 'Partenariats, participation au pilote, investissement ou collaboration sur les données. Présentez votre projet, en anglais ou en français.',
    nextH: 'La suite',
    next: ['Votre message est enregistré de façon sécurisée, avec son horodatage.', 'L’équipe du projet lit chaque message.', 'Vous recevez une réponse par courriel, dans la langue de votre message.'],
    whereH: 'Où nous travaillons',
    where: [['Base du projet', 'Kigali, Rwanda'], ['Zone pilote', 'Foumbot, département du Noun, Ouest Cameroun'], ['Langues', 'Anglais, français']],
    demoH: 'Vous préférez une présentation ?', demoD: 'Demandez une démonstration guidée du Simulateur de saison avec vos propres chiffres.'
  },

  demo: {
    eyebrow: 'Demander une démo',
    h1: 'Voyez le Simulateur de saison avec vos propres chiffres.',
    lead: 'Une présentation guidée du Simulateur de saison, du socle de données et de la feuille de route, adaptée à vos cultures, à votre budget et à votre région.',
    coversH: 'Ce que couvre la présentation',
    covers: ['Le Simulateur de saison appliqué à votre capital, votre culture et votre zone', 'Le socle de données et la source de chaque chiffre', 'Les modèles, leurs métriques de succès et les jalons de mise en service', 'La participation au pilote de Foumbot dès mars 2027'],
    stageH: 'Stade du produit',
    stage: 'AfriFarm Intelligent est en phase de conception et de validation terrain. La présentation montre le prototype actuel et le plan, jamais un produit fini.'
  },

  nl: {
    eyebrow: 'Lettre d’information',
    h1: 'Gardez une longueur d’avance en intelligence agricole.',
    lead: 'Notes de terrain du pilote de Foumbot, progrès des modèles, sources de données et nouvelles versions, en anglais ou en français.',
    getH: 'Ce que vous recevez',
    get: ['Les notes de terrain du pilote 2027 à Foumbot', 'Les résultats des modèles face à leurs références, publiés ouvertement', 'Les nouvelles sources de données, cultures et régions dès leur ouverture', 'Les nouveautés d’AfriFarm Mobile, Web et Alertes'],
    privH: 'Ce que nous conservons', priv: 'Votre adresse électronique, votre langue et la date de votre consentement. Rien d’autre. Chaque envoi contient un lien de désinscription.'
  },

  form: {
    name: 'Nom complet', email: 'Adresse électronique', workEmail: 'Adresse électronique professionnelle', org: 'Organisation', country: 'Pays', phone: 'Téléphone', optional: 'facultatif',
    orgType: 'Type d’organisation', subject: 'Objet', message: 'Message', role: 'Fonction', interest: 'Intérêt principal', scale: 'Taille de l’activité', method: 'Moyen de contact préféré',
    choose: 'Choisir…',
    orgTypes: ['Exploitation ou producteur', 'Coopérative ou groupement', 'Entreprise agroalimentaire, transformateur ou acheteur', 'Banque, microfinance ou assureur', 'Investisseur', 'Institution publique', 'Partenaire de développement ou ONG', 'Recherche ou université', 'Média', 'Autre'],
    subjects: ['Partenariat', 'Participation au pilote', 'Investissement', 'Collaboration sur les données', 'Média', 'Autre'],
    interests: ['Planifier la saison de mon exploitation', 'Évaluer un investissement', 'Planification de coopérative', 'Prévision d’approvisionnement', 'Risque agricole pour le crédit ou l’assurance', 'Programme public', 'Pilote terrain de Foumbot 2027'],
    scales: ['Moins de 1 ha', '1 à 10 ha', '10 à 100 ha', 'Plus de 100 ha', 'Sans objet'],
    methods: ['Courriel', 'Téléphone', 'WhatsApp'],
    phoneNeeded: 'Numéro pour l’appel ou WhatsApp',
    consent: 'J’accepte qu’AfriFarm Intelligent conserve ces informations pour répondre à ma demande, comme décrit dans la politique de confidentialité.',
    why: 'Nous ne demandons que le nécessaire pour vous répondre. Vos données ne sont jamais vendues ni partagées.',
    send: 'Envoyer le message', sendDemo: 'Demander la démo', sending: 'Envoi…',
    chars: (n, m) => n + ' / ' + m,
    err: {
      required: 'Ce champ est obligatoire.', email: 'Saisissez une adresse électronique valide, par exemple nom@domaine.com.',
      min: n => 'Veuillez écrire au moins ' + n + ' caractères.', max: n => 'Veuillez rester sous ' + n + ' caractères.',
      phone: 'Saisissez un numéro valide, avec l’indicatif du pays.', consent: 'Veuillez accepter pour continuer.', check: 'Veuillez vérifier ce champ.',
      summary: n => n === 1 ? 'Un champ demande votre attention.' : n + ' champs demandent votre attention.'
    },
    okT: 'Message reçu.', okD: 'Merci d’avoir contacté AfriFarm Intelligent. Notre équipe va étudier votre message et reviendra vers vous.',
    okDemoT: 'Demande de démo reçue.', okDemoD: 'Merci. L’équipe vous contactera par le moyen choisi pour planifier la présentation.',
    preT: 'Lien d’aperçu : rien n’a été envoyé.', preD: 'Cet aperçu privé n’enregistre les envois que pour les comptes autorisés par le propriétaire. Votre message n’a pas été enregistré. Le déploiement public de ce site le transmettra directement à l’équipe.',
    badT: 'Un problème est survenu.', badD: 'Un problème est survenu lors de l’envoi de votre message. Veuillez réessayer. Votre texte a été conservé.',
    quotaD: 'La boîte de réception est pleine pour le moment. Veuillez réessayer plus tard.',
    waitD: 'Veuillez patienter une minute avant d’envoyer une autre demande.',
    challengeD: 'Veuillez valider la vérification de sécurité, puis renvoyer.',
    again: 'Envoyer un autre message', edit: 'Revenir au formulaire', retry: 'Réessayer',
    previewShort: 'Lien d’aperçu : les envois ne sont enregistrés que pour les comptes autorisés.', previewBanner: 'Mode aperçu', previewText: 'Sur ce lien privé, les envois ne sont enregistrés que pour les comptes autorisés. Le déploiement public enregistre chaque envoi.',
    hp: 'Laissez ce champ vide'
  },

  admin: {
    h1: 'Boîte de réception', lead: 'Envois enregistrés par cette page. Visibles par le propriétaire uniquement.',
    denied: 'Cet espace est réservé au propriétaire du site.',
    tabs: { inquiries: 'Contact', demoRequests: 'Démos', subscribers: 'Abonnés' },
    empty: 'Aucun envoi pour l’instant.', loading: 'Chargement des envois', status: 'Statut', date: 'Date',
    statuses: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'], error: 'Impossible de charger ces informations. Veuillez réessayer.', refresh: 'Actualiser'
  },

  privacy: {
    h1: 'Politique de confidentialité', updated: 'Dernière mise à jour : 4 octobre 2026',
    body: [
      ['Qui nous sommes', 'AfriFarm Intelligent est une initiative d’intelligence décisionnelle agricole portée par Franck Junior Djandja Tomwa, basée à Kigali, au Rwanda, avec une zone pilote à Foumbot, au Cameroun. La structure juridique de l’initiative est en cours de création ; cette politique la nommera une fois enregistrée.'],
      ['Ce que nous collectons', 'Uniquement ce que vous saisissez dans nos formulaires : pour un message ou une demande de démo, vos nom, adresse électronique, organisation, pays, téléphone facultatif et message ; pour la lettre d’information, votre adresse électronique, votre langue et la date de votre consentement. Le Simulateur de saison fonctionne dans votre navigateur et n’envoie rien.'],
      ['Pourquoi', 'Pour répondre à votre message, organiser une démo demandée, ou envoyer la lettre à laquelle vous êtes abonné. Nous ne vendons jamais de données personnelles et ne les utilisons jamais à des fins publicitaires.'],
      ['Où elles sont conservées', 'Sur ce lien d’aperçu, les envois sont conservés dans un stockage rattaché à cette page et lisible par son seul propriétaire. Sur le déploiement public, ils sont conservés dans une base de données gérée, chiffrée en transit et au repos, avec un accès par rôle.'],
      ['Cookies et mesure d’audience', 'Ce site ne dépose aucun cookie de suivi et n’envoie aucune mesure d’audience. Votre choix de langue peut être mémorisé dans votre propre navigateur. Si une mesure d’audience est ajoutée, elle respectera la vie privée et sera annoncée ici avant activation.'],
      ['Durée de conservation', 'Les messages et demandes de démo sont conservés jusqu’à 24 mois après le dernier échange. Les données de la lettre sont conservées jusqu’à votre désinscription, après laquelle seule la date de désinscription est gardée pour respecter votre choix.'],
      ['Vos droits', 'Vous pouvez demander l’accès, la rectification, l’export ou la suppression de vos données à tout moment via le formulaire de contact. Nous répondons sous 30 jours.'],
      ['Droit applicable', 'Nous appliquons la loi rwandaise relative à la protection des données à caractère personnel et de la vie privée, la législation camerounaise sur les données personnelles, et les règles de chaque nouveau pays d’opération.']
    ]
  },
  terms: {
    h1: 'Conditions d’utilisation', updated: 'Dernière mise à jour : 4 octobre 2026',
    body: [
      ['Objet du site', 'Ce site présente AfriFarm Intelligent, une plateforme de décision agricole en phase de conception et de validation terrain.'],
      ['Démonstrations', 'Le Simulateur de saison de ce site est une démonstration. Il utilise des hypothèses illustratives clairement signalées à l’écran et ne constitue pas un conseil agronomique, financier ou d’investissement. Aucun résultat n’est garanti.'],
      ['Données et sources', 'Les chiffres de tiers sont attribués à leurs sources. Les photographies de terrain appartiennent au porteur du projet et ne peuvent être réutilisées sans autorisation.'],
      ['Propriété intellectuelle', 'Le nom AfriFarm Intelligent, le contenu, le design et le code de ce site sont protégés. Vous pouvez créer un lien vers n’importe quelle page.'],
      ['Responsabilité', 'Nous veillons à l’exactitude et à l’actualité des informations, mais ce site est fourni en l’état. Les décisions prises à partir de ce site restent sous la responsabilité de l’utilisateur.'],
      ['Contact', 'Les questions sur ces conditions peuvent être envoyées via le formulaire de contact.']
    ]
  },
  nf: { code: 'Erreur 404 · aucun signal', h1: 'Signal introuvable.', lead: 'La page que vous cherchez n’existe pas ou a été déplacée. Le reste de la couche d’intelligence est en ligne.' },
  footer: {
    tag: 'L’intelligence agricole pour une Afrique qui décide avec les données.',
    cols: ['Produit', 'Entreprise', 'Échanger', 'Légal'],
    nlH: 'Notes de terrain, dans votre boîte',
    rights: '© 2026 AfriFarm Intelligent. Projet porté par Franck Junior Djandja Tomwa.',
    place: 'Kigali · Foumbot',
    status: 'Phase de conception et de validation terrain',
    noTrack: 'Aucun cookie de suivi'
  },
  months: null
}
};
