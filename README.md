<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/DJALUMO-AGRO_couleur-fond-sombre.svg">
    <img src="brand/DJALUMO-AGRO_couleur.svg" alt="Djalumo Agro" width="340">
  </picture>
</p>

<h3 align="center">Agricultural decision intelligence for Africa</h3>

<p align="center">
  <a href="https://djalumo-agro.vercel.app"><b>Live site</b></a> ·
  <a href="https://djalumo-agro.vercel.app/planner">Season Planner</a> ·
  <a href="https://djalumo-agro.vercel.app/field">Field evidence</a> ·
  <a href="docs/TECHNICAL.md">Technical documentation</a> ·
  <a href="README.fr.md">Français</a>
</p>

<p align="center"><img src="docs/screenshots/hero.jpg" alt="Djalumo Agro home page: from African fields to world markets" width="100%"></p>

Djalumo Agro turns any farming budget, from 100 USD to more than 1 million, into a costed and dated season plan, then connects the harvest to the markets that pay for it: in Cameroon, across Central Africa and, through the ports of Douala and Kribi, to the world.

The project grows out of a real pilot. From September 2024 to October 2025, I ran a vegetable production pilot in Foumbot, in the West region of Cameroon. Every hard lesson of that season, from water as a hidden cost to climate stress and harvests sold without packaging, became a feature of the platform.

| 12 | 162 | 73 | 17 | 2 |
| :---: | :---: | :---: | :---: | :---: |
| crops in the Season Planner | referenced sources in the knowledge base | field photographs from the pilot | trade corridors on the world map | languages, English and French |

## The problem

A grower or an investor in Cameroon has to answer three questions before planting: what to grow, how much land the money really covers, and when to start. These answers usually come from habit and word of mouth. Water, heat at flowering, disease pressure and the price at harvest are discovered during the season, when they are already costs.

## What the platform does

**Season Planner.** Enter a capital in any currency, choose a crop, a water situation and a start date. The planner returns the plot size the money covers, a dated technical itinerary, a line by line budget, a shopping list, the water balance, the risks of the chosen window, the cash flow and four outcomes from a good harvest to a failure, each with its return and break even price. It covers short cycle crops (tomato, green bean, sweet pepper, chili pepper, cucumber, zucchini), long cycle crops (cassava, plantain, pineapple) and orchards (avocado, cocoa, oil palm).

<p align="center"><img src="docs/screenshots/season-planner.jpg" alt="Season Planner: verdict, key figures and outcomes for a tomato season" width="100%"></p>

**World trade corridors.** An interactive map follows the produce from the Foumbot production zone to the ports of Douala and Kribi, then to Central, West and East Africa, Europe, the Middle East, China, the United States and South America. Flows that exist today and export corridors that are targeted are shown and labelled separately.

<p align="center"><img src="docs/screenshots/world-map.jpg" alt="Interactive world map of trade corridors from Foumbot" width="100%"></p>

**Field evidence.** Seventy-three photographs, grouped in eight plates from the founder's family plantation in 2021 to the relaunch of the main pilot site in 2025, each with its caption, its date and what the season taught.

<p align="center"><img src="docs/screenshots/field-evidence.jpg" alt="Field evidence: plate of the pilot with captions" width="100%"></p>

**Premium PDF report.** A visitor can request a 12 to 15 page report of their plan. It is generated on the server from the same engine and sent only after review and approval by the Djalumo Agro team.

## Method: the PACE framework

The project follows the PACE framework of the Google Advanced Data Analytics Professional Certificate.

| Stage | What was done |
| --- | --- |
| **Plan** | Framed the decisions a grower or investor must take before a season, from the pilot's field problems: market, soil, climate, water and price. Defined the users: smallholders from 100 USD, cooperatives, agribusiness investors and buyers. |
| **Analyze** | Collected and documented 162 sources: Cameroon Ministry of Agriculture (MINADER) data sheets and budgets, FAO methods, research institute guides, regional input price surveys and dated market price observations from 2017 to 2026. Built a monthly climate profile of Foumbot and a seasonal price index. |
| **Construct** | Built a transparent decision engine: crop water need with the FAO-56 method (Hargreaves reference evapotranspiration, crop coefficients, dependable rainfall), yield response to water deficit with FAO-33, a cost model per hectare, plot sizing by bisection under a 10% reserve, four probability weighted outcomes, break even analysis, cash flow and payback for long cycle crops, and a risk reading for all twelve start months. |
| **Execute** | Shipped a bilingual website of 14 pages with the planner, the map, the field evidence, secure forms, a PostgreSQL backend and approved PDF reports, covered by automated tests. Every figure on screen links to its source; values without a source are labelled as assumptions. |

## Skills demonstrated

* Data collection, documentation and cleaning from public, institutional and field sources
* Analytical modelling: water balance, yield response, scenario analysis, break even and cash flow
* Data visualization: interactive maps and charts built with D3 geographic projections
* Python for the data pipelines (knowledge base build, photo processing)
* JavaScript and Node.js, SQL and PostgreSQL, automated testing
* Product thinking and bilingual communication for farmers, partners and investors

## Data honesty

The planner never presents simulated data as real. It shows its sources, labels derived values and assumptions, and leaves a price empty when no reliable reference exists, asking the grower for a local quote instead of guessing. Today the engine is rule based and source driven. Predictive models will come once the 2027 pilot has produced field data of our own.

## Built for mobile

<img src="docs/screenshots/mobile.jpg" alt="Djalumo Agro on a phone" width="200" align="right">

Many growers reach the internet on an entry level phone and a slow network. The site has no framework runtime, loads no web font and adapts to small screens and slow networks. An installable version and an Android application are the next steps.

<br clear="right">

## Roadmap

| When | Milestone |
| --- | --- |
| Late 2026 | Own domain, installable web app, Android application and closed test on Google Play |
| Early 2027 | Field data collection tools, baseline survey of growers in Foumbot, weekly market prices |
| March 2027 | Relaunch of the Foumbot pilot, with data collected season by season |
| Next | Python analysis notebooks, first predictive models for yields and prices, more crops and regions |

## Technology

Static site generated from plain JavaScript modules, Node.js serverless functions on Vercel, Zod validation, PostgreSQL (Neon), D3 geographic projections and TopoJSON, PDFKit, Python for data preparation. Architecture, data sources, environment variables and deployment are described in the [technical documentation](docs/TECHNICAL.md).

## Author

**Franck Junior Djandja Tomwa**, founder and project lead of Djalumo Agro.\
Telecommunications Engineer · Data Analyst · International Operations.\
Google Advanced Data Analytics Professional Certificate (2026) and Google Data Analytics Professional Certificate (2025).

GitHub: [@franckdjandja](https://github.com/franckdjandja)

## Licence

Copyright © 2026 Franck Junior Djandja Tomwa. All rights reserved. This repository is public so that the work can be seen and assessed; it is not open source. See [LICENSE](LICENSE).
