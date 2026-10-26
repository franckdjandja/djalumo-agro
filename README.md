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
  <a href="README.fr.md">Version française</a>
</p>

<p align="center"><img src="docs/screenshots/hero.jpg" alt="Djalumo Agro home page" width="100%"></p>

## Overview

Djalumo Agro turns a farming budget, from 100 USD to more than one million, into a season plan with its costs, its calendar and its expected results. It then connects the harvest to the markets that pay for it: in Cameroon, across Central Africa and, through the ports of Douala and Kribi, to the rest of the world.

The project grows out of a real season. From September 2024 to October 2025, its founder ran a vegetable production pilot in Foumbot, in the West region of Cameroon. Each difficulty met in the field, from the hidden cost of water to climate stress and harvests sold without packaging, became a feature of the platform.

Today the platform covers 12 crops, relies on 187 referenced sources, documents the pilot with 73 field photographs and maps 17 trade corridors, in English and in French.

## The problem

Before planting, a grower or an investor in Cameroon has to answer three questions: what to grow, how much land the available money really covers, and when to start. These answers usually come from habit and advice between neighbours. Water needs, heat at flowering, disease pressure and the price at harvest are discovered during the season, when they have already become costs.

## What the platform does

**Season Planner.** The user enters a capital in any currency and chooses a crop, a water situation and a start date. The planner returns the plot size that the money covers, a dated technical itinerary, a detailed budget, a shopping list, the water balance, the risks of the chosen period, the cash flow and four possible outcomes, from a good harvest to a failure, each with its return and the price needed to break even. It covers crops with a short cycle (tomato, green bean, sweet pepper, chili pepper, cucumber and zucchini), crops with a long cycle (cassava, plantain and pineapple) and orchards (avocado, cocoa and oil palm). The six short cycle crops can also be planned under a greenhouse, and tomato under a net house: a new structure is sized in modules of 240 m² with its cost and the climate under the cover, while a structure already built is not bought again and only its upkeep and the repairs chosen are counted. Land preparation is done by hand or with hired machines, and the planner suggests machines when the area would need too many workers on the same day.

<p align="center"><img src="docs/screenshots/season-planner.jpg" alt="Season Planner results for a tomato season" width="100%"></p>

**World trade corridors.** An interactive map follows the produce from the Foumbot production zone to the ports of Douala and Kribi, then to Central, West and East Africa, Europe, the Middle East, China, the United States and South America. Existing flows and targeted export corridors are shown and labelled separately.

<p align="center"><img src="docs/screenshots/world-map.jpg" alt="Interactive world map of the trade corridors from Foumbot" width="100%"></p>

**Field evidence.** The pilot is documented by 73 photographs arranged in eight plates, from the family plantation in 2021 to the relaunch of the main pilot site in 2025. Each plate gives its captions, its dates and the lesson drawn from the season.

<p align="center"><img src="docs/screenshots/field-evidence.jpg" alt="Field evidence plate with the founder at the tomato harvest" width="100%"></p>

**PDF report.** A visitor can request a report of 12 to 15 pages on their plan. The report is produced on the server by the same engine and is sent only after review and approval by the Djalumo Agro team.

## Method

The project follows the PACE framework (Plan, Analyze, Construct, Execute) taught in the Google Advanced Data Analytics Professional Certificate.

| Stage | Work carried out |
| --- | --- |
| **Plan** | Defined the decisions a grower or an investor must take before a season, starting from the problems met in the pilot: market, soil, climate, water and price. Identified the users: smallholders starting from 100 USD, cooperatives, agribusiness investors and buyers. |
| **Analyze** | Collected and documented 187 sources: data sheets and budgets of the Cameroon Ministry of Agriculture (MINADER), FAO methods, guides from research institutes, regional surveys of input prices and dated market price observations from 2017 to 2026. Built a monthly climate profile of Foumbot and a seasonal price index. |
| **Construct** | Built a transparent decision engine: crop water needs following FAO Irrigation and Drainage Paper 56 (Hargreaves reference evapotranspiration, crop coefficients and dependable rainfall), yield response to water deficit following FAO Paper 33, a cost model per hectare, plot sizing that keeps a 10% reserve, four outcomes weighted by their probability, the price and yield needed to break even, cash flow and payback for crops with a long cycle, and a risk reading for each of the twelve possible start months. |
| **Execute** | Delivered a bilingual website of 14 pages with the planner, the map, the field evidence, secure forms, a PostgreSQL backend and PDF reports subject to approval, all covered by automated tests. Every figure on screen links to its source, and any value without a source is labelled as an assumption. |

## Skills applied

* Collection, documentation and cleaning of data from public, institutional and field sources
* Analytical modelling: water balance, yield response, scenario analysis, profitability thresholds and cash flow
* Data visualization: interactive maps and charts built with D3 geographic projections
* Python for data preparation: knowledge base generation and photo processing
* JavaScript and Node.js, SQL and PostgreSQL, automated testing
* Product design and bilingual communication for farmers, partners and investors

## Transparency of the figures

The planner never presents simulated data as real. It shows its sources, identifies derived values and assumptions, and leaves a price empty when no reliable reference exists, asking the grower for a local quote rather than estimating one. The engine currently applies documented agronomic and financial rules to sourced data. Predictive models will follow once the 2027 pilot has produced field data of its own.

## Designed for field conditions

Many growers go online with a basic smartphone and a slow connection. The site therefore loads no framework and no web font, and adapts to small screens and weak networks.

**Android application.** The same platform is packaged as an Android application that works without a connection: the Season Planner, the trade corridor map and the field evidence are stored on the phone, and only the forms and the report requests use the network. A test build is produced automatically for every change and published in the [releases](https://github.com/franckdjandja/djalumo-agro/releases) of this repository.

<p align="center"><img src="docs/screenshots/mobile.jpg" alt="Djalumo Agro on a smartphone" width="260"></p>

## Roadmap

| Period | Milestone |
| --- | --- |
| Late 2026 | Own domain name, installable web application, Android application and closed test on Google Play |
| Early 2027 | Field data collection tools, baseline survey of growers in Foumbot and weekly market prices |
| March 2027 | Relaunch of the Foumbot pilot, with data collected season after season |
| Next | Python analysis notebooks, first predictive models for yields and prices, new crops and new regions |

## Technology

The website is generated from plain JavaScript modules and served with Node.js serverless functions on Vercel. It uses Zod for validation, PostgreSQL (Neon) for storage, D3 geographic projections and TopoJSON for the maps, PDFKit for the reports and Python for data preparation. Architecture, data sources, configuration and deployment are described in the [technical documentation](docs/TECHNICAL.md).

## Author

**Franck Junior Djandja Tomwa**, founder and project lead of Djalumo Agro. Telecommunications engineer and data analyst, in charge of international operations. Holder of the Google Advanced Data Analytics Professional Certificate (2026) and of the Google Data Analytics Professional Certificate (2025).

GitHub: [franckdjandja](https://github.com/franckdjandja)

## Licence

Copyright © 2026 Franck Junior Djandja Tomwa. All rights reserved. This repository is public so that the work can be seen and assessed; it is not open source. The terms are set out in the [licence](LICENSE.md).
