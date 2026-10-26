#!/usr/bin/env python3
"""Djalumo Agro · knowledge base builder.

Builds site/data/kb.json, the reference data read by the Season Planner engine (site/src/engine.cjs).

Rules applied to every value:
  * Each figure carries the ids of the sources it rests on (data/research/*.json hold the full research notes).
  * A value computed from sourced figures (unit conversion, per 100 m2 to per ha, midpoint of a range) is
    labelled "derived" in its basis note.
  * A value that rests on no source is a Djalumo Agro assumption: it is listed in ASSUMPTIONS and shown in the
    interface. No price or yield is invented: a missing price stays null, the line keeps its quantity and the
    planner asks for a local quote.

Run:  python3 scripts/kb/build_kb.py
"""
import json
import os
import re
import statistics

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESEARCH = os.path.join(ROOT, 'data', 'research')
OUT = os.path.join(ROOT, 'site', 'data', 'kb.json')


def L(en, fr):
    return {'en': en, 'fr': fr}


# ---------------------------------------------------------------- sources
# Each research file numbers its sources from S1; they get a prefix here and identical URLs are merged.
PREFIX = {'tomato': 'T', 'pepper': 'P', 'greenbean': 'G', 'cucumber': 'CU', 'zucchini': 'Z', 'chili': 'CH', 'cassava': 'CA', 'plantain': 'PL', 'avocado': 'AV', 'pineapple': 'AN', 'cocoa': 'CC', 'oil_palm': 'OP', 'costs': 'C', 'protected': 'PR', 'machinery': 'MA'}
SOURCES = {}
ALIAS = {}
_url_owner = {}


def _norm(url):
    u = (url or '').strip().lower()
    u = re.sub(r'^https?://(www\.)?', '', u)
    return u.rstrip('/')


def load_research():
    data = {}
    for name, pre in PREFIX.items():
        with open(os.path.join(RESEARCH, name + '.json'), encoding='utf-8') as f:
            d = json.load(f)
        data[name] = d
        for s in d.get('sources', []):
            sid = s['id']
            num = re.sub(r'^[A-Z]+', '', sid)
            gid = pre + num
            key = _norm(s.get('url'))
            if key and key in _url_owner:
                ALIAS[gid] = _url_owner[key]
                continue
            if key:
                _url_owner[key] = gid
            SOURCES[gid] = {'title': s.get('title'), 'publisher': s.get('publisher'), 'year': s.get('year'), 'url': s.get('url')}
    return data


METHOD_SOURCES = {
    'M6': {'title': 'Crop information: Banana (yield response factor ky 1.2 to 1.35)', 'publisher': 'FAO Land and Water', 'year': None, 'url': 'https://www.fao.org/land-water/databases-and-software/crop-information/banana/fr/'},
    'M1': {'title': 'Crop evapotranspiration: guidelines for computing crop water requirements (FAO Irrigation and Drainage Paper 56)', 'publisher': 'FAO (Allen R.G., Pereira L.S., Raes D., Smith M.)', 'year': 1998, 'url': 'https://www.fao.org/4/x0490e/x0490e00.htm'},
    'M2': {'title': 'CROPWAT: dependable rainfall (FAO/AGLW formula) and irrigation planning', 'publisher': 'FAO Land and Water', 'year': None, 'url': 'https://www.fao.org/land-water/databases-and-software/cropwat/en/'},
    'M3': {'title': 'Crop yield response to water (FAO Irrigation and Drainage Paper 66)', 'publisher': 'FAO (Steduto P., Hsiao T.C., Fereres E., Raes D.)', 'year': 2012, 'url': 'https://www.fao.org/4/i2800e/i2800e.pdf'},
    'M4': {'title': 'Crop information: Bean', 'publisher': 'FAO Land and Water', 'year': None, 'url': 'https://www.fao.org/land-water/databases-and-software/crop-information/bean'},
    'M5': {'title': 'Crop information: Pepper', 'publisher': 'FAO Land and Water', 'year': None, 'url': 'https://www.fao.org/land-water/databases-and-software/crop-information/pepper'},
    'M6': {'title': 'Crop information: Watermelon', 'publisher': 'FAO Land and Water', 'year': None, 'url': 'https://www.fao.org/land-water/databases-and-software/crop-information/watermelon'},
    'M7': {'title': 'Irrigation Water Management: Irrigation Scheduling (Training manual 4), field application efficiencies', 'publisher': 'FAO (Brouwer C., Prins K., Heibloem M.)', 'year': 1989, 'url': 'https://www.fao.org/4/t7202e/t7202e00.htm'},
}


def src(*ids):
    out = []
    for i in ids:
        g = ALIAS.get(i, i)
        if g not in SOURCES and g not in METHOD_SOURCES:
            raise KeyError('Unknown source ' + i)
        if g not in out:
            out.append(g)
    return out


# ---------------------------------------------------------------- shared parameters
# Exchange rates per 1 USD, 16 October 2026: XAF from the BCEAO reference rate (C38, same parity as XOF),
# EUR derived from the fixed 655.957 XAF peg, RWF (C45), KES (C43), NGN official (C46).
FX = {'USD': 1, 'XAF': 582.92, 'EUR': round(582.92 / 655.957, 4), 'RWF': 1475.9, 'KES': 129.85, 'NGN': 1332.47}
SEASONS_PER_YEAR = 2  # MINADER budgets two campaigns a year on the same hectare (T1)


def life(years):
    return int(years * SEASONS_PER_YEAR)


def build_items():
    I = {}

    def item(key, en, fr, price, category, unit, sources, pack=None, life_seasons=None, basis=None):
        d = {'label': L(en, fr), 'price': price, 'category': category, 'unit': unit, 'src': sources}
        if pack:
            d['pack'] = {'size': pack[0], 'label': L(pack[1], pack[2])}
        if life_seasons:
            d['life_seasons'] = life_seasons
        if basis:
            d['basis'] = basis
        I[key] = d

    npk_kg = 26000 / 50  # 26,000 XAF per 50 kg bag, MINADER PARPAC budget Oct 2024
    k2so4_kg = 32500 / 50
    # Seeds
    item('seed_tomato', 'Tomato seed (MINADER reference price)', 'Semence de tomate (prix de référence MINADER)', 20000 / 100, 'seed', 'g', src('C3'), (100, '100 g bag', 'sachet de 100 g'),
         basis='20,000 XAF per 100 g bag (C3). Variety not stated; hybrid F1 seed usually costs more per gram.')
    item('seed_greenbean', 'Green bean seed, dwarf type (Abidjan listing price)', 'Semence d’haricot vert nain (prix d’annonce à Abidjan)', 22500, 'seed', 'kg', src('C64'), (1, '1 kg pack', 'paquet de 1 kg'),
         basis='No Cameroon price found. Cora, 22,500 FCFA per kg, Abidjan listing 2026 (C64).')
    item('seed_pepper', 'Sweet pepper seed, open pollinated (Nigeria listing price)', 'Semence de poivron, variété fixée (prix d’annonce au Nigeria)', round(3281 / 100, 1), 'seed', 'g', src('C60', 'C46', 'C38'), (100, '100 g pack', 'sachet de 100 g'),
         basis='No Cameroon price found. California Wonder, NGN 7,500 per 100 g (C60), converted at the October 2026 rates (C46, C38). F1 hybrids cost far more (about 23 FCFA per seed).')
    item('seed_chili', 'Chili pepper seed, Big Sun (Senegal listing price)', 'Semence de piment Big Sun (prix d’annonce au Sénégal)', round(30500 / 50), 'seed', 'g', src('CH8', 'CH7'), (50, '50 g box', 'boîte de 50 g'),
         basis='No Cameroon price found. Technisem Big Sun, 30,500 FCFA per 50 g box at Tropicasem, Senegal, 2026 (CH8); 30,000 FCFA at another Senegal seller (CH7). The CFA franc of West and Central Africa share one parity. Cheaper open varieties (Bombardier, 26,500 FCFA per 50 g) and dearer F1 hybrids (Avenir F1, 91,200 FCFA) exist (CH8).')
    item('cassava_cutting', 'Cassava cuttings, improved variety', 'Boutures de manioc, variété améliorée', 25, 'planting', 'unit', src('CA8', 'CA2'), (1000, 'lot of 1,000 cuttings', 'lot de 1 000 boutures'),
         basis='25 FCFA a cutting at a multiplication site, 50 FCFA from retailers (CA8). Cross check: selected cuttings for 1 ha cost 260,000 FCFA in the CTA and ISF Cameroon budget (CA2).')
    item('plantain_pif', 'Plantain PIF plant, ready to plant', 'Plant PIF de bananier plantain, prêt à planter', 200, 'planting', 'unit', src('PL7'),
         basis='Ready to plant PIF plants offered at 200 FCFA in Cameroon (2022); other offers 150 to 250 FCFA, suckers about 100 FCFA (PL7).')
    item('avocado_grafted', 'Grafted avocado plant', 'Plant d’avocatier greffé', round(3 * FX['XAF']), 'planting', 'unit', src('AV8', 'C38'),
         basis='3 USD a grafted plant in a 2022 offer by a Cameroon nursery, converted at the October 2026 rate (AV8, C38); an older Yaoundé nursery listed 1,000 to 2,000 FCFA (AV8).')
    item('pineapple_sucker', 'Pineapple sucker (rejet), 300 to 500 g', 'Rejet d’ananas, 300 à 500 g', 7, 'planting', 'unit', src('AN3'), (1000, 'lot of 1,000 suckers', 'lot de 1 000 rejets'),
         basis='No Cameroon price found. 7 FCFA a sucker in a Benin budget (AN3). Suckers are often taken from an older field at the cost of the labour only.')
    item('ethephon', 'Ethephon (Ethrel type) for flower induction', 'Éthéphon (type Ethrel) pour l’induction florale', None, 'growth_regulator', 'l', src('AN1'),
         basis='No price found: to quote locally. Dose 6 to 10 ml per 10 L of water, 10 L for 200 plants (AN1).')
    item('cocoa_seedling', 'Improved cocoa seedling (hybrid)', 'Plant de cacaoyer amélioré (hybride)', 200, 'planting', 'unit', src('CC2'),
         basis='150 to 250 FCFA a seedling in Cameroon (CC2), midpoint.')
    item('shade_trees', 'Shade trees and temporary shade (per ha)', 'Arbres d’ombrage et ombrage temporaire (par ha)', 125000, 'planting', 'ha', src('CC3'),
         basis='50,000 to 200,000 FCFA per ha for shade trees in Cameroon (CC3), midpoint.')
    item('palm_seedling', 'Selected oil palm seedling (tenera)', 'Plant sélectionné de palmier à huile (tenera)', 2000, 'planting', 'unit', src('OP1'),
         basis='2,000 FCFA a seedling in the MINADER budget (OP1).')
    item('kcl', 'Potassium chloride', 'Chlorure de potassium', 600, 'fertilizer', 'kg', src('OP1'), (50, '50 kg bag', 'sac de 50 kg'), basis='600 FCFA/kg in the MINADER oil palm budget (OP1).')
    item('kieserite', 'Kieserite (magnesium sulphate)', 'Kiesérite (sulfate de magnésium)', 700, 'fertilizer', 'kg', src('OP1'), (50, '50 kg bag', 'sac de 50 kg'), basis='700 FCFA/kg in the MINADER oil palm budget (OP1).')
    item('mucuna_seed', 'Mucuna seed for cover crop', 'Semence de mucuna pour plante de couverture', 1000, 'seed', 'kg', src('OP1'), basis='12 kg at 1,000 FCFA in the MINADER oil palm budget (OP1).')
    item('rodent_guard', 'Rodent guard (galvanized mesh) for a young palm', 'Manchon grillagé contre les rongeurs pour jeune palmier', None, 'planting', 'unit', src('OP1'),
         basis='Recommended by MINADER (OP1); no price given: to quote locally.')
    kes = FX['XAF'] / FX['KES']  # XAF per Kenyan shilling, derived from the two USD rates
    item('seed_cucumber', 'Cucumber seed, open pollinated (Abidjan listing price)', 'Semence de concombre, variété fixée (prix d’annonce à Abidjan)', round(15500 / 50 * 1000), 'seed', 'kg', src('C63'), (0.05, '50 g pack', 'sachet de 50 g'),
         basis='No Cameroon price found. Marketer, 15,500 FCFA per 50 g, Abidjan listing 2026 (C63). A bulk Nairobi listing is cheaper (KES 1,000 per 100 g, CU46).')
    item('seed_zucchini', 'Zucchini seed (Kenya listing price)', 'Semence de courgette (prix d’annonce au Kenya)', round(900 / 100 * kes * 1000), 'seed', 'kg', src('Z24', 'C38', 'C43'), (0.1, '100 g pack', 'sachet de 100 g'),
         basis='No Cameroon price found. KES 900 per 100 g in Nairobi (Z24), converted at the October 2026 rates (C38, C43).')
    item('nursery_shade', 'Nursery shade structure', 'Ombrière de pépinière', 20000, 'nursery', 'unit', src('C3'))
    # Fertilizers and amendments
    item('npk_20_10_10', 'NPK 20-10-10', 'NPK 20-10-10', npk_kg, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='26,000 XAF per 50 kg bag (C3, 2024). West region retail Q4 2022: 33,650 to 34,950 per bag (C1).')
    for key, f in [('npk_15_15_15', '15-15-15'), ('npk_11_22_16', '11-22-16'), ('npk_15_12_24', '15-12-24'), ('npk_12_14_19', '12-14-19 + 5 MgO'), ('npk_10_10_20', '10-10-20')]:
        item(key, 'NPK ' + f + ' (price of NPK 20-10-10 used)', 'NPK ' + f + ' (prix du NPK 20-10-10 utilisé)', npk_kg, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'),
             basis='No Cameroon price for this formula (C1 gap); the MINADER NPK 20-10-10 price is used as a proxy.')
    item('dap', 'DAP 18-46-0 (price of NPK 20-10-10 used)', 'DAP 18-46-0 (prix du NPK 20-10-10 utilisé)', npk_kg, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='No Cameroon DAP price found; the MINADER NPK 20-10-10 price is used as a proxy.')
    item('urea', 'Urea 46% N', 'Urée 46 % N', 758, 'fertilizer', 'kg', src('C1', 'C2'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='Foumbot market average, Q4 2022 (C1). Latest survey covering Foumbot.')
    item('can', 'Calcium ammonium nitrate (price of ammonium sulphate used)', 'Ammonitrate calcique (prix du sulfate d’ammonium utilisé)', 553, 'fertilizer', 'kg', src('C1', 'C2'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='No CAN price found; Foumbot ammonium sulphate average, Q4 2022 (C1) used as a proxy.')
    item('k2so4', 'Potassium sulphate', 'Sulfate de potassium', k2so4_kg, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'))
    item('calcium_nitrate', 'Calcium nitrate', 'Nitrate de calcium', 13500 / 50, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='13,500 XAF per 50 kg bag in the MINADER budget (C3); looks low, to confirm locally.')
    item('poultry_manure', 'Poultry manure', 'Fiente de volaille', 4000 / 50, 'amendment', 'kg', src('C84'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='4,000 FCFA per 50 kg bag, Yaoundé classified listing 2026 (C84).')
    item('farmyard_manure', 'Compost or farmyard manure', 'Compost ou fumier', 3000 / 1000, 'amendment', 't' if False else 'kg', src('C16'), (1000, 'tonne', 'tonne'),
         basis='3,000 XAF per tonne for a producer supplied amendment, 2013, another region (C16); low confidence, transport not included.')
    # Crop protection
    item('glyphosate', 'Glyphosate herbicide', 'Herbicide glyphosate', 6500, 'herbicide', 'l', src('C3'), (1, '1 L can', 'bidon de 1 L'))
    item('mancozeb', 'Mancozeb 80 WP fungicide', 'Fongicide mancozèbe 80 WP', 2500, 'fungicide', 'kg', src('C3'), (1, '1 kg bag', 'sachet de 1 kg'))
    item('metalaxyl_mz', 'Metalaxyl based fungicide (Ridomil type)', 'Fongicide à base de métalaxyl (type Ridomil)', 10000, 'fungicide', 'kg', src('C3'), (0.1, '100 g sachet', 'sachet de 100 g'),
         basis='1,000 XAF per 100 g sachet (C3).')
    item('deltamethrin', 'Deltamethrin insecticide (Decis type), pack', 'Insecticide deltaméthrine (type Decis), conditionnement', 16000, 'insecticide', 'pack', src('C3'),
         basis='16,000 XAF per pack in the MINADER budget (C3); pack size ambiguous.')
    item('insecticide_l', 'Insecticide, liquid (West region average price)', 'Insecticide liquide (prix moyen Région de l’Ouest)', round((5492 + 7667) / 2), 'insecticide', 'l', src('C1', 'C2'), (1, '1 L can', 'bidon de 1 L'),
         basis='Midpoint of West region town averages 5,492 to 7,667 XAF per litre, Q4 2022 (C1, derived).')
    item('fungicide_l', 'Fungicide, liquid (West region average price)', 'Fongicide liquide (prix moyen Région de l’Ouest)', round((6671 + 7333) / 2), 'fungicide', 'l', src('C1', 'C2'), (1, '1 L can', 'bidon de 1 L'),
         basis='Midpoint of West region town averages 6,671 to 7,333 XAF per litre, Q4 2022 (C1, derived).')
    # Stakes and trellis
    item('stake', 'Stakes (bamboo or wood)', 'Tuteurs (bambou ou bois)', None, 'stakes', 'stake', src('T1'),
         basis='Quantity norm 25,000 per ha (T1); no price found, ask for a local quote.')
    item('twine', 'Twine', 'Ficelle', 3000, 'stakes', 'roll', src('C3'))
    item('trellis_set', 'Trellis posts, wire and twine (per ha set)', 'Poteaux, fil et ficelle de palissage (lot par ha)', None, 'trellis', 'set', src('CU24', 'CU7'),
         basis='Quantities derived from row spacing (CU24, CU7); no price found.')
    # Packaging and fuel
    item('crate', 'Harvest crate or basket', 'Cageot ou panier de récolte', 300, 'packaging', 'unit', src('C3'))
    item('fuel_petrol', 'Petrol (super) for the pump', 'Essence (super) pour la motopompe', 840, 'fuel', 'l', src('C32', 'C34', 'C35'),
         basis='840 XAF per litre since 3 Feb 2024, still in force in Oct 2026 (C32, C35).')
    # Water equipment
    item('motor_pump', 'Petrol motor pump', 'Motopompe à essence', 200000, 'irrigation', 'unit', src('C3'), life_seasons=life(5))
    item('water_basins', 'Water reserve points (basins)', 'Points de réserve d’eau (bassins)', 300000, 'irrigation', 'ha', src('C3'), life_seasons=life(3))
    item('watering_can', 'Watering can', 'Arrosoir', 6000, 'irrigation', 'unit', src('C3'), life_seasons=life(3))
    item('drip_kit', 'Drip irrigation kit, installed', 'Kit goutte à goutte, installé', 2375360, 'irrigation', 'ha', src('C74'), life_seasons=life(3),
         basis='1 ha kit 2,375,360 FCFA, Benin installer price list 2020 (C74); small kits cost up to 4.1 million per ha equivalent. Life taken as the 3 year warranty.')
    # Tools and protective equipment
    item('sprayer', 'Knapsack sprayer 16 L', 'Pulvérisateur à dos 16 L', 45000, 'tools', 'unit', src('C3'), life_seasons=life(3))
    item('wheelbarrow', 'Wheelbarrow', 'Brouette', 30000, 'tools', 'unit', src('C3'), life_seasons=life(2))
    item('push_cart', 'Push cart', 'Pousse pousse', 85000, 'tools', 'unit', src('C3'), life_seasons=life(5))
    item('small_tools', 'Small tools set (hoes, machetes, rake, spade, bucket, tape)', 'Petit outillage (houes, machettes, râteau, pelle, seau, mètre)', 75500, 'tools', 'ha', src('T1', 'C3'), life_seasons=life(2),
         basis='75,500 XAF of small tools per ha in the MINADER budget (T1); scaled to the area.')
    item('ppe_kit', 'Spraying protection: boots, mask and goggles', 'Protection pour traitements : bottes, masque et lunettes', 6500 + 8500, 'ppe', 'unit', src('C76', 'C78', 'T4'), life_seasons=life(2),
         basis='Boots 6,500 FCFA (Douala listing, C76) plus mask and goggles kit 7,000 to 10,000 (C78, midpoint). Gloves and coverall not priced. In Foumbot, 100% of 100 surveyed tomato growers sprayed without protection (T4).')
    return I


def build_services():
    lab = 2500
    return {
        'labour_day': {'label': L('Farm labour', 'Main d’œuvre agricole'), 'price': lab, 'unit': 'person day', 'category': 'labour', 'src': src('C3'),
                       'basis': '2,500 XAF per person day, MINADER budget 2024 (C3). No Foumbot wage survey found; labour costs are rising (C18).'},
        'land_rent_season': {'label': L('Land rent for the season', 'Location du terrain pour la saison'), 'label_long': L('Land rent over the plan', 'Location du terrain sur la durée du plan'), 'price': 50000, 'unit': 'ha', 'category': 'land', 'src': src('C3'),
                             'basis': '50,000 XAF per ha (C3); no Foumbot observation found.'},
        'agronomist_visit': {'label': L('Agronomist follow up and support', 'Suivi et appui d’un agronome'), 'price': 50000, 'unit': 'ha season', 'category': 'advice', 'src': src('C3'),
                             'basis': 'Follow up and support, 50,000 XAF per ha per cycle (C3).'},
        'harvest_labour': {'label': L('Harvest labour (picking and carrying)', 'Main d’œuvre de récolte (cueillette et transport au bord du champ)')},
        'transport_local_kg': {'label': L('Transport and handling to the local market', 'Transport et manutention vers le marché local'), 'price': round(50000 / (800 * 20), 1), 'unit': 'kg', 'src': src('C3', 'T9'),
                               'basis': 'Derived: 50,000 XAF per ha cycle (C3) over 800 crates (C3) of 20 kg (T9).'},
        'transport_city_kg': {'label': L('Transport and charges to Douala or Yaoundé', 'Transport et frais vers Douala ou Yaoundé'), 'price': round((333 + 500) / 2 / 20, 1), 'unit': 'kg', 'src': src('C47', 'T9'),
                              'basis': 'Derived: 333 to 500 XAF per crate paid by a trader from Ntui (Centre) to Yaoundé (C47), crate of 20 kg (T9, assumption). Not used while city sales are not offered.'},
        'market_fee_rate': {'label': L('Market fees', 'Taxes de marché'), 'price': 0, 'src': [],
                            'basis': 'Not found separately (C47 includes them in transport charges); not added.'},
        'nursery_prep_m2': {'label': L('Nursery soil preparation', 'Préparation du sol de pépinière'), 'price': 500, 'unit': 'm2', 'category': 'nursery', 'src': src('C3')},
        'nursery_disinfection_m2': {'label': L('Nursery soil disinfection', 'Désinfection du sol de pépinière'), 'price': 1000, 'unit': 'm2', 'category': 'nursery', 'src': src('C3')},
    }


def build_water():
    surface_eff = 0.6  # FAO field application efficiency, surface methods (M7); watering cans and hoses are treated as surface application
    return {
        'fuel_l_per_m3': 0.042,
        'src_fuel': src('C25', 'C26', 'C27', 'C28'),
        'fuel_basis': 'Derived from 2 inch pump specifications: 1.0 to 1.5 L per hour at about 36 m3 per hour (C25 to C28), upper value. Field use is higher with lift and hose friction, so this is a floor.',
        'maintenance_label': L('Pump maintenance', 'Entretien de la motopompe'),
        'options': {
            'rainfed': {'covers': 0, 'efficiency': 1},
            'manual': {'covers': 1, 'efficiency': surface_eff, 'm3_per_person_day': 6, 'labour_label': L('Watering by hand (Djalumo Agro assumption: 6 m³ per person day)', 'Arrosage manuel (hypothèse Djalumo Agro : 6 m³ par jour de travail)'),
                       'capex': [{'item': 'watering_can', 'qty_per_ha': 8, 'discrete': True}], 'max_area_ha': 0.25, 'src': src('M7', 'C3')},
            'existing': {'covers': 1, 'efficiency': surface_eff, 'fuel': True, 'labour_days_per_ha': 25, 'labour_src': src('C3'), 'labour_label': L('Watering', 'Arrosage'),
                         'maintenance_xaf_per_ha': 15000, 'maintenance_src': src('C3'), 'capex': [], 'src': src('M7', 'C3')},
            'pump': {'covers': 1, 'efficiency': surface_eff, 'fuel': True, 'labour_days_per_ha': 25, 'labour_src': src('C3'), 'labour_label': L('Watering', 'Arrosage'),
                     'maintenance_xaf_per_ha': 15000, 'maintenance_src': src('C3'),
                     'capex': [{'item': 'motor_pump', 'per': 'farm', 'ha_per_unit': 1}, {'item': 'water_basins', 'qty_per_ha': 1}, {'item': 'watering_can', 'qty_per_ha': 8, 'discrete': True}], 'src': src('M7', 'C3')},
            'drip': {'covers': 1, 'efficiency': 0.9, 'fuel': True, 'maintenance_xaf_per_ha': 15000, 'maintenance_src': src('C3'),
                     'capex': [{'item': 'drip_kit', 'qty_per_ha': 1}, {'item': 'motor_pump', 'per': 'farm', 'ha_per_unit': 1}], 'src': src('M7', 'C3')},
        }
    }


TOOLS_KIT = [
    {'item': 'sprayer', 'min': 1, 'per_ha': 2},
    {'item': 'ppe_kit', 'min': 1, 'per_ha': 2},
    {'item': 'small_tools', 'per_ha': 1, 'fractional': True, 'min': 0.1},
    {'item': 'wheelbarrow', 'min': 0, 'per_ha': 1, 'from_ha': 0.5},
    {'item': 'push_cart', 'min': 0, 'per_ha': 1, 'from_ha': 1},
]


# ---------------------------------------------------------------- crops
PHASES = {
    'prep': L('Land preparation', 'Préparation du terrain'),
    'nursery': L('Nursery', 'Pépinière'),
    'planting': L('Planting and basal feeding', 'Plantation et fumure de fond'),
    'care': L('Crop care', 'Entretien de la culture'),
    'protection': L('Crop protection', 'Protection de la culture'),
    'harvest': L('Harvest and sale', 'Récolte et vente'),
}


def step(id, phase, ref, day, en, fr, den, dfr, inputs=(), labour=0, services=(), sources=()):
    d = {'id': id, 'phase': phase, 'ref': ref, 'day': list(day), 'label': L(en, fr), 'detail': L(den, dfr), 'src': list(sources)}
    if inputs:
        d['inputs'] = [dict({'item': i[0], 'qty': i[1]}, **({'apps': i[2]} if i[2] and i[2] > 1 else {}), src=list(i[3])) for i in inputs]
    if labour:
        d['labour'] = labour
    if services:
        d['services'] = [{'key': k, 'qty': q} for k, q in services]
    return d


def kc_stages(lengths):
    """Cumulative ends of the initial, development and mid season stages as fractions (FAO-56 Table 11)."""
    t = float(sum(lengths))
    a = lengths[0] / t
    b = (lengths[0] + lengths[1]) / t
    c = (lengths[0] + lengths[1] + lengths[2]) / t
    return [round(a, 3), round(b, 3), round(c, 3)]


def yields(poor, good, average=None):
    avg = average if average is not None else round((poor + good) / 2, 2)
    return {'poor': poor, 'average': avg, 'good': good}


def tomato(R):
    T = R['tomato']
    # Seasonal price index from the dated observations: abundant months (December to March), transition
    # (April to June) and scarcity months (July to November) (T22 to T34); levels from the reference prices
    # quoted for abundant (7,000) and difficult (12,000) periods (T35), the transition at their midpoint.
    low, high = 7000, 12000
    mid = (low + high) / 2
    lo, hi = round(low / mid, 3), round(high / mid, 3)
    index = [lo, lo, lo, 1.0, 1.0, 1.0, hi, hi, hi, hi, hi, lo]
    rate_note = L('Late blight (Phytophthora infestans) is the main rainy season threat in the West highlands; unsprayed crops can lose all marketable fruit (T7, T8). Spray preventively and rotate active ingredients.',
                  'Le mildiou (Phytophthora infestans) est la principale menace de la saison des pluies sur les hauts plateaux de l’Ouest ; une culture non traitée peut perdre toute sa récolte commercialisable (T7, T8). Traiter en préventif et alterner les matières actives.')
    steps = [
        step('site', 'prep', 'field', (-50, -45), 'Plot choice, rotation and soil test', 'Choix de la parcelle, rotation et analyse de sol',
             'Avoid plots that carried tomato, pepper, eggplant or potato in the last 3 years; keep 5 years where bacterial wilt was seen. Well drained loam, pH 5 to 7. A soil test sets the final fertilizer rates.',
             'Éviter les parcelles ayant porté tomate, poivron, aubergine ou pomme de terre depuis 3 ans ; 5 ans si le flétrissement bactérien a été observé. Sol limoneux bien drainé, pH 5 à 7. Une analyse de sol fixe les doses finales d’engrais.',
             sources=src('T15', 'T13', 'T12', 'T3')),
        step('clear', 'prep', 'field', (-40, -30), 'Clearing, without burning', 'Défrichage, sans brûlis',
             'Clear by hand, then one glyphosate pass if weeds persist. MINADER advises against burning: it destroys the organic matter the crop needs. Paraquat, common in Foumbot, is highly hazardous and should not be used.',
             'Défricher à la main, puis un passage de glyphosate si les adventices persistent. Le MINADER déconseille le brûlis : il détruit la matière organique dont la culture a besoin. Le paraquat, courant à Foumbot, est très dangereux et ne doit pas être utilisé.',
             inputs=[('glyphosate', 4, 1, src('T1'))], labour=26, sources=src('T1', 'T4')),
        step('plough', 'prep', 'field', (-30, -15), 'Ploughing and ridging', 'Labour et billonnage',
             'Plough 30 to 50 cm deep without turning the soil over, then form ridges or beds; on slopes, keep grass strips across the slope. Indeterminate varieties go in double rows 50 cm apart.',
             'Labourer sur 30 à 50 cm sans retourner le sol, puis former billons ou planches ; en pente, garder des bandes enherbées en travers. Les variétés à croissance indéterminée se plantent en doubles rangs espacés de 50 cm.',
             labour=90, sources=src('T1', 'T10')),
        step('nursery', 'nursery', 'start', (0, 30), 'Nursery', 'Pépinière',
             'About 60 m² of nursery per hectare. Disinfect the beds (10 L of boiling water per m² works), sow in rows 20 cm apart, keep under shade and harden the seedlings 1 to 2 weeks before transplanting. The seed price is the MINADER one; F1 hybrid seed such as Cobra 26 F1 costs about 1,300 to 1,900 FCFA per gram in neighbouring markets.',
             'Environ 60 m² de pépinière par hectare. Désinfecter les planches (10 L d’eau bouillante par m² suffisent), semer en lignes espacées de 20 cm, garder sous ombrière et endurcir les plants 1 à 2 semaines avant le repiquage. Le prix de semence est celui du MINADER ; une semence hybride F1 comme Cobra 26 F1 coûte environ 1 300 à 1 900 FCFA le gramme dans les pays voisins.',
             inputs=[('seed_tomato', 300, 1, src('T1')), ('nursery_shade', 1, 1, src('T1'))], services=[('nursery_prep_m2', 60), ('nursery_disinfection_m2', 60)], sources=src('T1', 'T13', 'T15', 'C61', 'C51')),
        step('basal', 'planting', 'field', (-14, 0), 'Basal fertilization', 'Fumure de fond',
             'Poultry manure plus mineral NPK, worked into the ridges before transplanting. MINADER recommends 20 to 30 t of organic matter per ha; a 2024 Dschang trial reached 26 t/ha of tomato with 5 t of poultry manure. The MINADER text names NPK 10-10-20 for this dressing; its budget prices NPK 20-10-10, used here.',
             'Fiente de volaille et NPK minéral, incorporés aux billons avant le repiquage. Le MINADER recommande 20 à 30 t de matière organique par ha ; un essai de 2024 à Dschang a atteint 26 t/ha de tomate avec 5 t de fiente. Le texte du MINADER cite le NPK 10-10-20 pour cette fumure ; son budget chiffre le NPK 20-10-10, retenu ici.',
             inputs=[('poultry_manure', 5000, 1, src('T9')), ('npk_20_10_10', 400, 1, src('T1'))], labour=35, sources=src('T1', 'T2', 'T9', 'T14')),
        step('transplant', 'planting', 'field', (0, 2), 'Transplanting', 'Repiquage',
             'Transplant seedlings with 5 to 6 leaves at 80 × 50 cm, about 25,000 plants per ha, in the cool hours; replace missing plants in the following days.',
             'Repiquer les plants à 5 ou 6 feuilles à 80 × 50 cm, soit environ 25 000 plants par ha, aux heures fraîches ; remplacer les manquants les jours suivants.',
             labour=35, sources=src('T1')),
        step('water', 'care', 'field', (0, 125), 'Watering', 'Arrosage',
             'Water at cool hours: about 0.5 L per plant per day before fruiting and 1 L after, less at the end of the cycle. Drip saves water. The volume in your plan comes from the water balance.',
             'Arroser aux heures fraîches : environ 0,5 L par plant et par jour avant la fructification et 1 L après, moins en fin de cycle. Le goutte à goutte économise l’eau. Le volume de votre plan vient du bilan hydrique.',
             sources=src('T1', 'T12', 'T13')),
        step('stake', 'care', 'field', (10, 25), 'Staking and tying', 'Tuteurage et attachage',
             'One stake per plant: 2 m stakes for indeterminate varieties, 1.1 m for determinate ones, tied with twine in two passes.',
             'Un tuteur par plant : 2 m pour les variétés indéterminées, 1,1 m pour les déterminées, attachés à la ficelle en deux passages.',
             inputs=[('stake', 25000, 1, src('T1')), ('twine', 1, 1, src('T1'))], labour=30, sources=src('T1', 'T14')),
        step('top', 'care', 'field', (15, 80), 'Top dressing', 'Fumure d’entretien',
             'NPK 20-10-10 at 15, 30, 50 and 80 days after transplanting, about 8 g per plant each time, placed around the foot and covered.',
             'NPK 20-10-10 à 15, 30, 50 et 80 jours après le repiquage, environ 8 g par plant à chaque passage, au pied puis recouvert.',
             inputs=[('npk_20_10_10', 200, 4, src('T1'))], labour=6, sources=src('T1')),
        step('fruiting', 'care', 'field', (30, 80), 'Potassium and calcium for fruiting', 'Potassium et calcium pour la fructification',
             'Potassium sulphate for fruit quality and calcium nitrate against blossom end rot, as budgeted by MINADER (split not specified). No sourced rate was found for the foliar feeds and “vitamins” sold to growers; ask the agronomist before adding them.',
             'Sulfate de potassium pour la qualité des fruits et nitrate de calcium contre la nécrose apicale, comme dans le budget du MINADER (fractionnement non précisé). Aucune dose sourcée n’a été trouvée pour les engrais foliaires et « vitamines » vendus aux producteurs ; demander l’avis de l’agronome avant d’en ajouter.',
             inputs=[('k2so4', 500, 1, src('T1')), ('calcium_nitrate', 250, 1, src('T1'))], sources=src('T1', 'T3', 'T9')),
        step('weed', 'care', 'field', (14, 42), 'Weeding and earthing up', 'Sarclage et buttage',
             'Hand weeding at about 2, 4 and 6 weeks after transplanting, with earthing up.',
             'Sarclage manuel à environ 2, 4 et 6 semaines après le repiquage, avec buttage.',
             labour=15, sources=src('T1', 'T13', 'T14')),
        step('prune', 'care', 'field', (30, 90), 'Leaf removal and sanitation', 'Effeuillage et assainissement',
             'Remove lower and diseased leaves on indeterminate varieties to ventilate the crop; disinfect blades between plants.',
             'Retirer les feuilles basses et malades des variétés indéterminées pour aérer la culture ; désinfecter les lames entre les plants.',
             labour=15, sources=src('T1', 'T15')),
        step('protect', 'protection', 'field', (0, 125), 'Crop protection programme', 'Programme de protection',
             'Weekly scouting and preventive sprays: a metalaxyl based fungicide before flowering, mancozeb after, and an insecticide against fruit borers and the tomato leaf miner. Quantities follow the MINADER budget. Wear the protection kit and respect pre harvest intervals.',
             'Surveillance hebdomadaire et traitements préventifs : un fongicide à base de métalaxyl avant la floraison, du mancozèbe ensuite, et un insecticide contre les foreurs de fruits et la mineuse de la tomate. Les quantités suivent le budget du MINADER. Porter le kit de protection et respecter les délais avant récolte.',
             inputs=[('metalaxyl_mz', 20, 1, src('T1')), ('mancozeb', 80, 1, src('T1')), ('deltamethrin', 4, 1, src('T1'))], labour=30, sources=src('T1', 'T2', 'T4', 'T8', 'T19')),
        step('harvest', 'harvest', 'harvest', (0, 60), 'Harvest', 'Récolte',
             'Pick at least once a week by twisting the stalk: yellow pink for a delayed sale, orange red for a direct sale.',
             'Récolter au moins une fois par semaine en tournant le pédoncule : jaune rosé pour une vente différée, rouge orangé pour une vente directe.',
             sources=src('T1', 'T5', 'T14')),
        step('sell', 'harvest', 'harvest', (0, 60), 'Packing, transport and sale', 'Conditionnement, transport et vente',
             'Pack in crates of about 20 kg and keep in the shade. Prices swing from about 1,000 to 15,000 FCFA per crate within a year: plan sales outside the December to March glut where you can. Selling in Douala or Yaoundé can pay more but adds transport (333 to 500 FCFA per crate) and transit losses.',
             'Conditionner en cageots d’environ 20 kg et garder à l’ombre. Le prix varie d’environ 1 000 à 15 000 FCFA le cageot dans l’année : viser les ventes hors de la saturation de décembre à mars quand c’est possible. Vendre à Douala ou Yaoundé peut rapporter plus mais ajoute le transport (333 à 500 FCFA le cageot) et des pertes en route.',
             labour=2, sources=src('T1', 'T9', 'C47', 'T6')),
    ]
    return {
        'name': L('Tomato', 'Tomate'), 'release': 'cm', 'badge': L('Cameroon data', 'Données Cameroun'),
        'plants_per_ha': 25000, 'ky': 1.05, 'heat_c': 32, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 400, 'agronomist_visits': 1,
        'kc': {'ini': 0.6, 'mid': 1.15, 'end': 0.8, 'stages': kc_stages([30, 40, 40, 25])},
        'cycle': {'nursery_days': 30, 'to_first_harvest_days': 70, 'harvest_days': 60, 'flowering_before_harvest_days': 45},
        'yield_t_ha': {'wet': yields(10, 25), 'dry': yields(20, 50)},
        'price': {'reference_xaf_kg': 275, 'index': index, 'src': src('T9', 'T35', 'T22', 'T23', 'T25', 'T27', 'T28', 'T33'),
                  'note': L('Reference: 275 FCFA/kg at the farm gate (5,500 FCFA per 20 kg crate, Dschang, March to June 2024). Prices are lowest from December to March and highest from July to November.',
                            'Référence : 275 FCFA/kg bord champ (5 500 FCFA le cageot de 20 kg, Dschang, mars à juin 2024). Les prix sont au plus bas de décembre à mars et au plus haut de juillet à novembre.')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('T1', 'T9'),
        'disease_note': rate_note,
        'steps': steps,
        'src': src('T1', 'T12', 'T13', 'T9', 'T5', 'M1'),
        'basis': {
            'plants_per_ha': '25,000 plants per ha at 80 × 50 cm (T1).',
            'ky': 'FAO-33 yield response factor 1.05 (T12).',
            'heat_c': 'Flowers drop and fruit set is poor above 32 °C (T13).',
            'kc': 'FAO-56 Table 12: Kc ini 0.6, mid 1.15, end 0.7 to 0.9 (0.8 used); stage lengths 30/40/40/25 days, Table 11 (M1).',
            'cycle': 'Nursery 25 to 40 days (T1, 30 used); first harvest 60 to 80 days after transplanting (T1, 70 used); harvest over 2 to 3 months (T1, 60 days used); about 45 days from first flowers to first ripe fruit is a Djalumo Agro assumption to check in the pilot.',
            'yield_t_ha': 'MINADER per 100 m² ranges converted to t/ha: rainy season 10 to 25, dry season 20 to 50 (T1). Poor and good are the bounds, average the midpoint. The FAOSTAT national average (19.4 t/ha in 2024, T11) is not used: the series looks revised and MINADER cites about 11 t/ha.',
            'loss_pct': 'Local sale: transport to the grouping market 0.5% (T6) plus marketing 0.65% (T5), derived 1.15%. Selling in a city adds 5.0% (T6). Pre harvest losses are inside the yield ranges.',
            'harvest_kg_per_person_day': 'Derived: 40 person days of harvest per ha (T1) for 800 crates (T1) of 20 kg (T9).',
            'price': 'Reference 275 XAF/kg (T9); seasonal levels 7,000 and 12,000 per crate for abundant and difficult periods (T35); months from dated observations (T22 to T34).',
        },
        'confidence': [
            {'block': L('Technical itinerary and 1 ha budget', 'Itinéraire technique et budget de 1 ha'), 'level': 'high', 'note': L('MINADER 2024 data sheet for Cameroon, cross checked with trials in Dschang and East Cameroon.', 'Fiche MINADER 2024 pour le Cameroun, recoupée avec des essais à Dschang et à l’Est.')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('MINADER ranges by season; few on farm measurements in Foumbot.', 'Fourchettes MINADER par saison ; peu de mesures en exploitation à Foumbot.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'medium', 'note': L('Dated market observations 2017 to 2026; no monthly series for Foumbot; crate weights vary.', 'Observations datées 2017 à 2026 ; pas de série mensuelle pour Foumbot ; le poids du cageot varie.')},
            {'block': L('Input prices', 'Prix des intrants'), 'level': 'medium', 'note': L('MINADER budget 2024 and West region survey 2022; stakes and protection kit not priced.', 'Budget MINADER 2024 et enquête Région de l’Ouest 2022 ; tuteurs et kit de protection non chiffrés.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods; not station data.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56 ; pas de données de station.')},
        ],
    }


# Post harvest loss for a sale on the local market: transport to the grouping market 0.5% (T6) plus marketing
# 0.65% (T5). A sale in Douala or Yaoundé adds 5.0% of transport loss (T6).
LOCAL_LOSS = round(0.5 + 0.65, 2)

# Labour norms reused as proxies where a crop source gives none: MINADER tomato budget per ha (T1) and
# 3 person days per spray application (T2). Every use is named in the step sources and in ASSUMPTIONS.
PROXY_LAB = {'clear': 20, 'plough': 90, 'transplant': 35, 'stake': 30, 'fert': 6, 'weed': 15, 'prune': 15, 'manure': 35, 'spray': 3}

REGIONAL_CONF = lambda itin_note, yield_note, price_note: [
    {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': itin_note},
    {'block': L('Yields', 'Rendements'), 'level': 'low', 'note': yield_note},
    {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'low', 'note': price_note},
    {'block': L('Input prices', 'Prix des intrants'), 'level': 'medium', 'note': L('Cameroon references where they exist (MINADER 2024, West region survey 2022); proxies and gaps are named line by line.', 'Références camerounaises quand elles existent (MINADER 2024, enquête Région de l’Ouest 2022) ; les substituts et manques sont signalés ligne par ligne.')},
    {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56.')},
]
CUCURBIT_LABOUR = {'block': L('Labour', 'Main d’œuvre'), 'level': 'low', 'note': L('Philippine cucumber guide; harvest labour looks low for several weeks of picking.', 'Guide philippin du concombre ; la main d’œuvre de récolte paraît faible pour plusieurs semaines de cueillette.')}
NO_PRICE = L('No monthly farm gate price series is published for Cameroon: enter the price you expect to get.', 'Aucune série mensuelle de prix bord champ n’est publiée pour le Cameroun : saisissez le prix que vous comptez obtenir.')


def greenbean():
    sprays = 8  # midpoint of 4 to 12 sprays per cycle in Kenyan practice (G3)
    steps = [
        step('site', 'prep', 'field', (-60, -50), 'Plot choice and rotation', 'Choix de la parcelle et rotation',
             'Well drained soil, pH 6.0 to 7.5, at least 40 cm deep. No more than one bean crop in three years on the same soil; at least two years without legumes where rust or anthracnose are present.',
             'Sol bien drainé, pH 6,0 à 7,5, profond d’au moins 40 cm. Pas plus d’une culture de haricot en trois ans sur le même sol ; au moins deux ans sans légumineuse si la rouille ou l’anthracnose sont présentes.',
             sources=src('G1', 'G3')),
        step('clear', 'prep', 'field', (-35, -21), 'Clearing and stale seedbed', 'Défrichage et faux semis',
             'Clear by hand, then prepare the seedbed 2 to 4 weeks ahead and destroy the weeds that emerge. No source documents burning for this crop; it is not recommended.',
             'Défricher à la main, puis préparer le lit de semence 2 à 4 semaines avant et détruire les adventices qui lèvent. Aucune source ne documente le brûlis pour cette culture ; il n’est pas recommandé.',
             labour=20, sources=src('G1', 'G17')),
        step('plough', 'prep', 'field', (-21, -7), 'Ploughing and beds', 'Labour et planches',
             'Plough 30 to 50 cm, harrow, then form ridges about 70 cm apart or raised beds of two rows.',
             'Labourer sur 30 à 50 cm, herser, puis former des billons espacés d’environ 70 cm ou des planches de deux rangs.',
             labour=20, sources=src('G1', 'G17')),
        step('basal', 'planting', 'field', (-21, -7), 'Organic manure', 'Fumure organique',
             'Well decomposed manure or compost, 10 to 20 t per ha; fresh manure must go on at least 6 months ahead.',
             'Fumier ou compost bien décomposé, 10 à 20 t par ha ; un fumier frais doit être épandu au moins 6 mois avant.',
             inputs=[('farmyard_manure', 10000, 1, src('G1'))], labour=15, sources=src('G1', 'G17')),
        step('sow', 'planting', 'field', (0, 0), 'Sowing with DAP in the furrow', 'Semis avec DAP dans le sillon',
             'Direct sowing, one seed per hole at 30 × 15 cm, 2 to 5 cm deep, with DAP placed in the furrow. A seed dressing protects against bean fly and root rots.',
             'Semis direct, une graine par poquet à 30 × 15 cm, à 2 à 5 cm de profondeur, avec le DAP placé dans le sillon. Un traitement de semence protège contre la mouche du haricot et les pourritures racinaires.',
             inputs=[('seed_greenbean', 34, 1, src('G1')), ('dap', 198, 1, src('G2'))], labour=10, sources=src('G1', 'G2', 'G3', 'G17')),
        step('water', 'care', 'field', (0, 95), 'Watering', 'Arrosage',
             'About 35 mm a week until 10 days after emergence, then 50 mm a week to flowering; 300 to 800 mm per cycle in total.',
             'Environ 35 mm par semaine jusqu’à 10 jours après la levée, puis 50 mm par semaine jusqu’à la floraison ; 300 à 800 mm par cycle au total.',
             sources=src('G1', 'G2', 'G6')),
        step('weed', 'care', 'field', (14, 42), 'Weeding', 'Sarclage',
             'Weed two weeks after sowing, then every two weeks until the canopy closes.',
             'Sarcler deux semaines après le semis, puis toutes les deux semaines jusqu’à la fermeture du couvert.',
             labour=30, sources=src('G9', 'G17')),
        step('top', 'care', 'field', (14, 35), 'Top dressing', 'Fumure d’entretien',
             'Calcium ammonium nitrate at the first trifoliate leaf and again at the onset of flowering. Avoid excess nitrogen.',
             'Ammonitrate calcique au stade première feuille trifoliée, puis au début de la floraison. Éviter l’excès d’azote.',
             inputs=[('can', 99, 2, src('G2'))], labour=PROXY_LAB['fert'], sources=src('G2', 'G3', 'T1')),
        step('protect', 'protection', 'field', (7, 95), 'Crop protection', 'Protection de la culture',
             'Weekly scouting. Seed dressing first against bean fly; rust and anthracnose sprays from the third trifoliate leaf; thrips at flower bud stage; biological control against pod borers during harvest. Kenyan growers spray 4 to 12 times per cycle; the plan uses 8, half fungicide, half insecticide, at the tomato rates as proxies.',
             'Surveillance hebdomadaire. D’abord le traitement de semence contre la mouche du haricot ; traitements contre la rouille et l’anthracnose dès la troisième feuille trifoliée ; thrips au stade boutons floraux ; lutte biologique contre les foreurs de gousses pendant la récolte. Au Kenya, 4 à 12 traitements par cycle ; le plan en retient 8, moitié fongicide, moitié insecticide, aux doses de la tomate comme substitut.',
             inputs=[('mancozeb', 2.5, sprays // 2, src('T2')), ('insecticide_l', 1, sprays // 2, src('T2'))], labour=8, sources=src('G3', 'G17', 'T2')),
        step('harvest', 'harvest', 'harvest', (0, 45), 'Harvest', 'Récolte',
             'Pick every one to three days for 1.5 to 2 months; pods are ready 15 to 20 days after pod set. Picking is the largest labour item of the crop.',
             'Récolter tous les un à trois jours pendant 1,5 à 2 mois ; les gousses sont prêtes 15 à 20 jours après la nouaison. La cueillette est le premier poste de main d’œuvre de la culture.',
             sources=src('G1', 'G2', 'G18')),
        step('sell', 'harvest', 'harvest', (0, 45), 'Grading, packing and sale', 'Tri, conditionnement et vente',
             'Grade by pod size, keep cool and sell fast: 1 to 2 weeks of storage life at 7 to 8 °C, much less in the open.',
             'Trier selon le calibre, garder au frais et vendre vite : 1 à 2 semaines de conservation à 7 ou 8 °C, beaucoup moins à l’air libre.',
             labour=2, sources=src('G2', 'G11')),
    ]
    return {
        'name': L('Green bean', 'Haricot vert'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'),
        'plants_per_ha': round(10000 / (0.30 * 0.15)), 'ky': 1.15, 'heat_c': 30, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': round(14000 / (1290 / 8)), 'agronomist_visits': 1,
        'kc': {'ini': 0.5, 'mid': 1.05, 'end': 0.9, 'stages': kc_stages([20, 30, 30, 10])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 52, 'harvest_days': 45, 'flowering_before_harvest_days': 18},
        'yield_t_ha': {'wet': yields(4.0, 10.0, 5.3), 'dry': yields(7.4, 14.8)},
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed elsewhere: Abidjan retail 800 to 1,200 FCFA/kg (2024 to 2025).', 'Observé ailleurs : Abidjan au détail 800 à 1 200 FCFA/kg (2024 à 2025).'), 'src': src('G13', 'G14')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('G18'),
        'disease_note': L('Rust, anthracnose and halo blight thrive in cool, wet highland weather and leaf wetness (G1, G3).', 'La rouille, l’anthracnose et la graisse se développent par temps frais et humide d’altitude et feuillage mouillé (G1, G3).'),
        'steps': steps, 'src': src('G1', 'G2', 'G12', 'M1', 'M4'),
        'basis': {
            'plants_per_ha': 'One seed per hole at 30 × 15 cm (G2), derived 222,222 plants per ha, inside the 200,000 to 300,000 target for dwarf beans (G1).',
            'ky': 'FAO yield response factor for beans 1.15 (M4).',
            'heat_c': 'Flowers drop above 30 °C (G1).',
            'kc': 'FAO-56 green beans: Kc 0.5, 1.05, 0.9; stage lengths 20/30/30/10 days (M1).',
            'cycle': 'First pick typically 45 to 60 days after sowing (G1, G2), 52 used; picking over 1.5 to 2 months (G2, G7), 45 days used; pods ready 15 to 20 days after set (G1).',
            'yield_t_ha': 'Rainy season: poor 4.0 (G4), average 5.3 = Cameroon national average (G12), good 10 (G7). Dry season irrigated: 7.4 to 14.8 (G2), midpoint as average.',
            'harvest_kg_per_person_day': 'Derived: 14 t/ha harvested and packed in 1,290 hours, 8 hour days (G18, South Africa).',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': REGIONAL_CONF(L('Kenyan, COLEAD and Philippine guides; no Cameroon itinerary found.', 'Guides du Kenya, du COLEAD et des Philippines ; pas d’itinéraire camerounais trouvé.'),
                                    L('Cameroon national average plus Kenyan references.', 'Moyenne nationale du Cameroun et références du Kenya.'),
                                    L('No Cameroon price; you enter your own.', 'Pas de prix au Cameroun ; vous saisissez le vôtre.')),
    }


def pepper():
    field_days = 75 + 56
    sprays = field_days // 7  # weekly sprays, Foumbot practice (P4)
    steps = [
        step('nursery', 'nursery', 'start', (0, 42), 'Nursery', 'Pépinière',
             'Sow on raised beds or trays, feed seedlings lightly at two true leaves, protect against damping off and harden them before transplanting at 5 to 6 leaves. Foumbot growers keep seedlings about 6 weeks. The plan budgets 100 m² of nursery per ha, the low end of 100 to 300 m² derived from a pepper sheet.',
             'Semer sur planches surélevées ou plateaux, nourrir légèrement les plants à deux vraies feuilles, protéger contre la fonte des semis et endurcir avant le repiquage à 5 ou 6 feuilles. À Foumbot, les plants restent environ 6 semaines en pépinière. Le plan compte 100 m² de pépinière par ha, le bas de la fourchette de 100 à 300 m² calculée à partir d’une fiche du piment.',
             inputs=[('seed_pepper', 300, 1, src('P1', 'P3'))], services=[('nursery_prep_m2', 100), ('nursery_disinfection_m2', 100)], sources=src('P1', 'P2', 'P3', 'P4', 'P23', 'T1')),
        step('site', 'prep', 'field', (-60, -50), 'Plot choice and rotation', 'Choix de la parcelle et rotation',
             'No tomato, potato or eggplant on the plot for at least 3 years. Soil pH 6.0 to 7.0.',
             'Pas de tomate, pomme de terre ni aubergine sur la parcelle depuis au moins 3 ans. pH du sol 6,0 à 7,0.',
             sources=src('P2', 'P6', 'P3')),
        step('clear', 'prep', 'field', (-35, -14), 'Clearing and weed control', 'Défrichage et désherbage',
             'Clear, then a glyphosate burndown at least 15 days before transplanting if needed. Paraquat and 2,4-D are used in Foumbot; paraquat is highly hazardous.',
             'Défricher, puis un passage de glyphosate au moins 15 jours avant le repiquage si nécessaire. Le paraquat et le 2,4-D sont utilisés à Foumbot ; le paraquat est très dangereux.',
             inputs=[('glyphosate', 2.5, 1, src('P13'))], labour=PROXY_LAB['clear'], sources=src('P13', 'P4', 'T1')),
        step('plough', 'prep', 'field', (-30, -7), 'Deep ploughing and beds', 'Labour profond et planches',
             'Plough to about 30 cm a month before transplanting and form beds about 1 m wide.',
             'Labourer à environ 30 cm un mois avant le repiquage et former des planches d’environ 1 m de large.',
             labour=PROXY_LAB['plough'], sources=src('P3', 'P13', 'T1')),
        step('basal', 'planting', 'field', (-15, 0), 'Basal manure and fertilizer', 'Fumure de fond',
             'Well decomposed manure, then NPK and potassium sulphate in the planting holes a few days before transplanting (22 g NPK and 8 g potassium sulphate per hole in the Cameroon sheet).',
             'Fumier bien décomposé, puis NPK et sulfate de potassium dans les trous de plantation quelques jours avant le repiquage (22 g de NPK et 8 g de sulfate de potassium par trou dans la fiche camerounaise).',
             inputs=[('farmyard_manure', 10000, 1, src('P9')), ('npk_11_22_16', 440, 1, src('P3')), ('k2so4', 160, 1, src('P3'))], labour=PROXY_LAB['manure'], sources=src('P3', 'P9', 'T2')),
        step('transplant', 'planting', 'field', (0, 2), 'Transplanting', 'Repiquage',
             'Transplant at 1 m between rows and 0.5 m on the row, about 20,000 plants per ha, in the early morning or evening.',
             'Repiquer à 1 m entre les rangs et 0,5 m sur le rang, soit environ 20 000 plants par ha, tôt le matin ou le soir.',
             labour=PROXY_LAB['transplant'], sources=src('P3', 'P2', 'T1')),
        step('water', 'care', 'field', (0, field_days), 'Watering', 'Arrosage',
             '600 to 800 mm per cycle; about 2 mm a day early, 3 to 6 mm a day from flowering to harvest. Avoid evening overhead watering.',
             '600 à 800 mm par cycle ; environ 2 mm par jour au début, 3 à 6 mm par jour de la floraison à la récolte. Éviter l’aspersion le soir.',
             sources=src('P3', 'P13', 'P1')),
        step('stake', 'care', 'field', (0, 30), 'Staking', 'Tuteurage',
             'Stake within a month of transplanting: one stake every 1.5 m of row with string at two or three levels.',
             'Tuteurer dans le mois qui suit le repiquage : un tuteur tous les 1,5 m de rang avec de la ficelle sur deux ou trois niveaux.',
             inputs=[('stake', round(10000 / 1.5), 1, src('P13')), ('twine', 1, 1, src('T1'))], labour=PROXY_LAB['stake'], sources=src('P3', 'P13', 'T1')),
        step('top', 'care', 'field', (35, 45), 'Fertilizer at flowering', 'Fumure à la floraison',
             'At flowering, about 40 days after transplanting: 15 g NPK, 20 g potassium sulphate and 2 g urea per plant (Cameroon sheet).',
             'À la floraison, environ 40 jours après le repiquage : 15 g de NPK, 20 g de sulfate de potassium et 2 g d’urée par plant (fiche camerounaise).',
             inputs=[('npk_11_22_16', 300, 1, src('P3')), ('k2so4', 400, 1, src('P3')), ('urea', 40, 1, src('P3'))], labour=PROXY_LAB['fert'], sources=src('P3', 'T1')),
        step('weed', 'care', 'field', (14, 60), 'Weeding', 'Sarclage',
             'Weed every two weeks until flowering.', 'Sarcler toutes les deux semaines jusqu’à la floraison.',
             labour=PROXY_LAB['weed'], sources=src('P5', 'T1')),
        step('prune', 'care', 'field', (20, 45), 'Pruning and sanitation', 'Taille et assainissement',
             'Remove the first fruits at the first fork and the leaves below it; disinfect knives.',
             'Retirer les premiers fruits à la première bifurcation et les feuilles en dessous ; désinfecter les couteaux.',
             labour=PROXY_LAB['prune'], sources=src('P1', 'P6', 'T1')),
        step('protect', 'protection', 'field', (0, field_days), 'Crop protection', 'Protection de la culture',
             'Scout twice a week. Foumbot growers spray weekly, mostly mancozeb and cypermethrin, and report disease losses above 50%. The plan keeps weekly sprays at the tomato rates as proxies. Chlorpyrifos, still found in Foumbot, is banned in Cameroon.',
             'Surveiller deux fois par semaine. Les producteurs de Foumbot traitent chaque semaine, surtout au mancozèbe et à la cyperméthrine, et déclarent plus de 50 % de pertes par maladie. Le plan garde des traitements hebdomadaires aux doses de la tomate comme substitut. Le chlorpyrifos, encore trouvé à Foumbot, est interdit au Cameroun.',
             inputs=[('mancozeb', 2.5, sprays, src('T2')), ('insecticide_l', 1, sprays, src('T2'))], labour=PROXY_LAB['spray'] * sprays, sources=src('P4', 'P1', 'P6', 'T2')),
        step('harvest', 'harvest', 'harvest', (0, 56), 'Harvest', 'Récolte',
             'Pick at the mature green stage about twice a week with a clean knife; green fruit does not ripen after picking.',
             'Récolter au stade vert mûr environ deux fois par semaine avec un couteau propre ; le fruit vert ne mûrit plus après la cueillette.',
             sources=src('P2', 'P3', 'P13')),
        step('sell', 'harvest', 'harvest', (0, 56), 'Grading, packing and sale', 'Tri, conditionnement et vente',
             'Sort, grade and pack in crates in the shade. Foumbot growers keep peppers 7 to 15 days; in Bafou peppers sell in lots of 8 to 10 kg.',
             'Trier, calibrer et mettre en cageots à l’ombre. À Foumbot, les poivrons se gardent 7 à 15 jours ; à Bafou, ils se vendent par lots de 8 à 10 kg.',
             labour=2, sources=src('P2', 'P4', 'P16')),
    ]
    return {
        'name': L('Sweet pepper', 'Poivron'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'),
        'plants_per_ha': 20000, 'ky': 1.1, 'heat_c': 30, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': round(10000 / (1900 / 8)), 'agronomist_visits': 1,
        'kc': {'ini': 0.6, 'mid': 1.05, 'end': 0.9, 'stages': kc_stages([25, 35, 40, 20])},
        'cycle': {'nursery_days': 42, 'to_first_harvest_days': 75, 'harvest_days': 56, 'flowering_before_harvest_days': 42},
        'yield_t_ha': {'wet': yields(2.1, 12.6, 6.0), 'dry': yields(10.0, 28.0)},
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed: Bafou (West) 130 to 313 FCFA/kg, publication 2005.', 'Observé : Bafou (Ouest) 130 à 313 FCFA/kg, publication de 2005.'), 'src': src('P16')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('P25'),
        'disease_note': L('Anthracnose and phytophthora are favoured by the wet season; Foumbot growers report disease losses above 50% (P4, P6).', 'L’anthracnose et le phytophthora sont favorisés par la saison des pluies ; les producteurs de Foumbot déclarent plus de 50 % de pertes par maladie (P4, P6).'),
        'steps': steps, 'src': src('P3', 'P4', 'P1', 'P14', 'M1', 'M5'),
        'basis': {
            'plants_per_ha': '20,000 plants per ha at 1 m × 0.5 m (P3, Cameroon).',
            'ky': 'FAO yield response factor for pepper 1.1 (M5).',
            'heat_c': 'Flower drop from 28 to 30 °C (P1, P3); 30 used.',
            'kc': 'FAO-56 sweet peppers: Kc 0.6, 1.05, 0.9; stage lengths 25/35/40/20 days (M1).',
            'cycle': 'Nursery about 6 weeks in Foumbot (P4); first harvest 60 to 90 days after transplanting (P2, P3, P13), 75 used; harvest 6 to 10 weeks, 8 used; flowering to harvest 35 to 50 days (P1, P6), 42 used.',
            'yield_t_ha': 'Rainy season: poor 2.1 = Cameroon national average (P14; includes hot peppers and is likely an FAO estimate), average 6 = Cameroon sheet 5 to 7 (P3), good 12.6 (P8, Ghana open field). Dry season irrigated: 10 (P13) to 28 (P1), midpoint as average.',
            'harvest_kg_per_person_day': 'Derived from the chilli pages of a South African vegetable budget: 10 t/ha picked in 1,900 hours, 8 hour days (P25); sweet pepper fruits are larger, so this is conservative.',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': REGIONAL_CONF(L('Cameroon IFATI sheet and Foumbot survey, completed with AVRDC and Kenyan guides.', 'Fiche IFATI du Cameroun et enquête de Foumbot, complétées par les guides AVRDC et du Kenya.'),
                                    L('Cameroon sheet and national average; irrigated values from outside Cameroon.', 'Fiche camerounaise et moyenne nationale ; valeurs irriguées hors Cameroun.'),
                                    L('Only an old Bafou observation; you enter your own price.', 'Seulement une ancienne observation à Bafou ; vous saisissez votre prix.')),
    }


def chili():
    plants = 15625  # 80 cm x 80 cm (CH1, CH2), analyst arithmetic
    to_harvest, harvest_days = 90, 90
    field_days = to_harvest + harvest_days
    sprays = field_days // 7  # weekly in the rainy season (CH1)
    g = lambda grams: round(grams * plants / 1000)  # grams per plant to kg per ha
    steps = [
        step('nursery', 'nursery', 'start', (0, 42), 'Nursery', 'Pépinière',
             'Raised beds 1 m wide, rows 20 cm apart, seed 2 cm deep, shaded and watered daily. Poultry manure at 5 kg per m² two weeks before sowing, then NPK 20-10-10 at 50 g per metre of row two weeks after emergence. About 200 m² of nursery per ha; seedlings go out at 4 to 5 leaves after about 6 weeks. The plan budgets 500 g of Big Sun seed per ha, the seed company rate; the Cameroon sheets give about 1.5 kg.',
             'Planches surélevées de 1 m de large, lignes à 20 cm, graines à 2 cm de profondeur, à l’ombre et arrosées chaque jour. Fiente de volaille à 5 kg par m² deux semaines avant le semis, puis NPK 20-10-10 à 50 g par mètre de ligne deux semaines après la levée. Environ 200 m² de pépinière par ha ; les plants partent au champ à 4 ou 5 feuilles après environ 6 semaines. Le plan compte 500 g de semence Big Sun par ha, la dose du semencier ; les fiches camerounaises donnent environ 1,5 kg.',
             inputs=[('seed_chili', 500, 1, src('CH7')), ('poultry_manure', 1000, 1, src('CH1')), ('npk_20_10_10', 50, 1, src('CH1'))],
             services=[('nursery_prep_m2', 200), ('nursery_disinfection_m2', 200)], sources=src('CH1', 'CH2', 'CH7', 'CH10', 'T1')),
        step('site', 'prep', 'field', (-60, -50), 'Plot choice and rotation', 'Choix de la parcelle et rotation',
             'No tomato, pepper, potato or eggplant on the plot for at least 3 years. Well drained soil; chili grows up to 2,000 m with 600 to 1,250 mm of well spread rain.',
             'Pas de tomate, poivron, pomme de terre ni aubergine sur la parcelle depuis au moins 3 ans. Sol bien drainé ; le piment pousse jusqu’à 2 000 m avec 600 à 1 250 mm de pluie bien répartie.',
             sources=src('P2', 'P6', 'CH1')),
        step('clear', 'prep', 'field', (-35, -14), 'Clearing and weed control', 'Défrichage et désherbage',
             'Clear the plot, then a glyphosate burndown at least 15 days before transplanting if needed.',
             'Défricher la parcelle, puis un passage de glyphosate au moins 15 jours avant le repiquage si nécessaire.',
             inputs=[('glyphosate', 2.5, 1, src('P13'))], labour=PROXY_LAB['clear'], sources=src('P13', 'T1')),
        step('plough', 'prep', 'field', (-30, -7), 'Ploughing and planting holes', 'Labour et trouaison',
             'Plough, then dig holes 20 cm deep a week before transplanting, 80 cm apart in rows 80 cm apart.',
             'Labourer, puis creuser des trous de 20 cm de profondeur une semaine avant le repiquage, à 80 cm les uns des autres sur des lignes espacées de 80 cm.',
             labour=PROXY_LAB['plough'], sources=src('CH1', 'CH2', 'T1')),
        step('basal', 'planting', 'field', (-7, 0), 'Basal manure', 'Fumure de fond',
             '1 kg of poultry manure per hole a week before transplanting. The sheet also puts a carbofuran nematicide in the hole; carbofuran is a highly hazardous pesticide and is not budgeted.',
             '1 kg de fiente de volaille par trou une semaine avant le repiquage. La fiche ajoute un nématicide au carbofuran dans le trou ; le carbofuran est un pesticide très dangereux et n’est pas budgété.',
             inputs=[('poultry_manure', plants, 1, src('CH1', 'CH2'))], labour=PROXY_LAB['manure'], sources=src('CH1', 'CH2', 'T1')),
        step('transplant', 'planting', 'field', (0, 2), 'Transplanting', 'Repiquage',
             'Transplant at 80 cm × 80 cm, about 15,600 plants per ha, early in the morning or in the evening. The sheets print 13,750 plants per ha, which does not match their own spacing.',
             'Repiquer à 80 cm × 80 cm, soit environ 15 600 plants par ha, tôt le matin ou le soir. Les fiches indiquent 13 750 plants par ha, ce qui ne correspond pas à leur propre écartement.',
             labour=PROXY_LAB['transplant'], sources=src('CH1', 'CH2', 'CH7', 'T1')),
        step('fert1', 'care', 'field', (7, 14), 'First fertilizer', 'Premier engrais',
             'Two weeks after the basal manure: NPK 12-14-19 + 5 MgO at 15 g per plant (3 bottle caps), 10 cm from the stem.',
             'Deux semaines après la fumure de fond : NPK 12-14-19 + 5 MgO à 15 g par plant (3 capsules), à 10 cm du pied.',
             inputs=[('npk_12_14_19', g(15), 1, src('CH1'))], labour=PROXY_LAB['fert'], sources=src('CH1', 'T1')),
        step('fert2', 'care', 'field', (40, 50), 'Fertilizer at flowering', 'Engrais à la floraison',
             'At first flowering: NPK 12-14-19 + 5 MgO again, 15 g per plant.',
             'À la première floraison : de nouveau NPK 12-14-19 + 5 MgO, 15 g par plant.',
             inputs=[('npk_12_14_19', g(15), 1, src('CH1'))], labour=PROXY_LAB['fert'], sources=src('CH1', 'T1')),
        step('fert3', 'care', 'field', (60, field_days), 'Feeding at fruit set and during harvest', 'Fumure à la nouaison et pendant la récolte',
             'At first fruit set, then after the harvests: NPK 10-10-20 at one teaspoon per plant. The plan counts a teaspoon as 5 g and four applications: fruit set and one a month over three months of harvest.',
             'À la première nouaison, puis après les récoltes : NPK 10-10-20 à une cuillère à café par plant. Le plan compte 5 g par cuillère et quatre apports : la nouaison puis un par mois sur trois mois de récolte.',
             inputs=[('npk_10_10_20', g(5), 4, src('CH1'))], labour=PROXY_LAB['fert'] * 4, sources=src('CH1', 'T1')),
        step('water', 'care', 'field', (0, field_days), 'Watering', 'Arrosage',
             'Water regularly in the dry season, above all while fruits form: in the evening, at the foot of the plant, without wetting the leaves.',
             'Arroser régulièrement en saison sèche, surtout pendant la formation des fruits : le soir, au pied, sans mouiller les feuilles.',
             sources=src('CH1', 'CH2')),
        step('weed', 'care', 'field', (14, 75), 'Weeding', 'Sarclage',
             'Keep the rows clean until the canopy closes.', 'Garder les lignes propres jusqu’à la fermeture de la culture.',
             labour=PROXY_LAB['weed'], sources=src('CH9', 'T1')),
        step('protect', 'protection', 'field', (0, field_days), 'Crop protection', 'Protection de la culture',
             'Downy mildew and alternaria leaf spot thrive in heavy rain. Spray maneb and cypermethrin weekly in the rainy season and every two weeks in the dry season, alternating a copper fungicide with maneb, and treat after each harvest. The plan budgets weekly sprays at the tomato rates as proxies.',
             'Le mildiou et l’alternariose prospèrent sous les fortes pluies. Traiter au manèbe et à la cyperméthrine chaque semaine en saison des pluies et toutes les deux semaines en saison sèche, en alternant un fongicide cuprique avec le manèbe, et traiter après chaque récolte. Le plan compte des traitements hebdomadaires aux doses de la tomate comme substitut.',
             inputs=[('mancozeb', 2.5, sprays, src('T2')), ('insecticide_l', 1, sprays, src('T2'))], labour=PROXY_LAB['spray'] * sprays, sources=src('CH1', 'T2')),
        step('harvest', 'harvest', 'harvest', (0, harvest_days), 'Harvest', 'Récolte',
             'Pick mature fruit with its stalk once a week, in dry weather. Wear gloves: Big Sun and other chinense types are very hot.',
             'Cueillir les fruits mûrs avec leur pédoncule une fois par semaine, par temps sec. Porter des gants : le Big Sun et les autres types chinense sont très piquants.',
             sources=src('CH1', 'CH7', 'CH9')),
        step('sell', 'harvest', 'harvest', (0, harvest_days), 'Grading and sale', 'Tri et vente',
             'Sell fresh by bag of 50 or 100 kg to wholesalers, or dry the surplus: boil 30 to 40 minutes, then dry in the sun. Sauces and powder fetch 4 to 5 times the value of a raw kilogram.',
             'Vendre frais en sacs de 50 ou 100 kg aux grossistes, ou sécher le surplus : bouillir 30 à 40 minutes puis sécher au soleil. Sauces et poudre valent 4 à 5 fois un kilogramme brut.',
             labour=2, sources=src('CH1', 'CH3', 'CH4', 'CH5')),
    ]
    return {
        'name': L('Chili pepper', 'Piment'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'),
        'plants_per_ha': plants, 'ky': 1.1, 'heat_c': 35, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': round(10000 / (1900 / 8)), 'agronomist_visits': 1,
        'kc': {'ini': 0.6, 'mid': 1.05, 'end': 0.9, 'stages': kc_stages([25, 35, 40, 20])},
        'cycle': {'nursery_days': 42, 'to_first_harvest_days': to_harvest, 'harvest_days': harvest_days, 'flowering_before_harvest_days': 45},
        'yield_t_ha': {'wet': yields(2.1, 15.0), 'dry': yields(10.0, 20.0)},
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed in Yaoundé, wholesale by the bag: 900 to 1,200 FCFA/kg in June 2025 (rainy season, low prices), 400 FCFA/kg in August 2022, from 120 FCFA/kg in a glut to 1,000 FCFA/kg in a shortage in 2018. Farm gate prices are lower.',
                                'Observé à Yaoundé, en gros au sac : 900 à 1 200 FCFA/kg en juin 2025 (saison des pluies, prix bas), 400 FCFA/kg en août 2022, de 120 FCFA/kg en période d’abondance à 1 000 FCFA/kg en pénurie en 2018. Les prix bord champ sont plus bas.'),
                  'src': src('CH4', 'CH5', 'CH6')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('P25'),
        'disease_note': L('Downy mildew and alternaria leaf spot are favoured by heavy rain; anthracnose and phytophthora also hit peppers in the wet season (CH1, P6).', 'Le mildiou et l’alternariose sont favorisés par les fortes pluies ; l’anthracnose et le phytophthora frappent aussi les piments en saison des pluies (CH1, P6).'),
        'steps': steps, 'src': src('CH1', 'CH2', 'CH3', 'CH7', 'P14', 'M1', 'M5'),
        'basis': {
            'plants_per_ha': '80 cm × 80 cm (CH1, CH2) gives 15,625 plants per ha (derived); the sheets print 13,750. Technisem advises 15,000 to 17,000 (CH7).',
            'ky': 'FAO yield response factor for pepper 1.1 (M5).',
            'heat_c': 'Fruit set is best between 25 and 35 °C for Big Sun (CH7); optimum growth 20 to 30 °C (CH1). 35 used.',
            'kc': 'FAO-56 gives one set for peppers: Kc 0.6, 1.05, 0.9; stage lengths 25/35/40/20 days (M1).',
            'cycle': 'Nursery 35 to 50 days (CH1, CH2), 42 used; first harvest 3 to 4 months after transplanting (CH1, CH2) and 90 days for Big Sun (CH7), 90 used; harvest up to 4 months (CH1), 90 days used; flowering to harvest about 1.5 months (CH1), 45 used.',
            'yield_t_ha': 'Rainy season: poor 2.1 = Cameroon national average for chillies and peppers (P14), good 15 = top of 10 to 15 t/ha under good conditions (CH3), within 10 to 20 t/ha (CH2); average = midpoint. Dry season irrigated: 10 to 20 t/ha (CH2), the best yields come in the counter season (CH1).',
            'harvest_kg_per_person_day': 'Chilli pages of a South African vegetable budget: 10 t/ha picked in 1,900 hours, 8 hour days (P25). St Vincent gives about 62 kg per day (CH9).',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': REGIONAL_CONF(L('Cameroon sheet hosted by MINADER and a Cameroon technical sheet, completed with the seed company data and a Caribbean guide.', 'Fiche camerounaise publiée par le MINADER et fiche technique camerounaise, complétées par les données du semencier et un guide caribéen.'),
                                    L('Cameroon sheets give 10 to 20 t/ha against a national average near 2 t/ha.', 'Les fiches camerounaises donnent 10 à 20 t/ha contre une moyenne nationale proche de 2 t/ha.'),
                                    L('Only wholesale prices in Yaoundé, very volatile; you enter your own price.', 'Seulement des prix de gros à Yaoundé, très volatils ; vous saisissez votre prix.')),
    }


# ---------------------------------------------------------------- long cycles, successive cycles, orchards
def rec(id, phase, en, fr, den, dfr, every, first, last=None, inputs=(), labour=0, services=(), sources=(), qty_by_year=None, span=30):
    d = step(id, phase, 'field', (0, span), en, fr, den, dfr, inputs=inputs, labour=labour, services=services, sources=sources)
    d.update({'every_months': every, 'first_month': first, 'span_days': span})
    if last is not None:
        d['last_month'] = last
    if qty_by_year:
        d['qty_by_year'] = list(qty_by_year)
    del d['ref'], d['day']
    return d


def cassava():
    plants = 10000  # 1 m x 1 m (CA2, CA3)
    roots_lab_per_t = 20 / 2.5  # gari table: 20 person days per 2.5 t of roots (CA2)
    fuel_per_t_roots = 5000  # water and firewood per t of roots (CA2)
    steps = [
        step('site', 'prep', 'field', (-60, -45), 'Plot choice', 'Choix de la parcelle',
             'Deep, well drained soil, 1,000 to 1,500 mm of rain. On soils poor in humus plan 10 to 20 t of manure per ha. Plant at the start of the main rainy season.',
             'Sol profond et bien drainé, 1 000 à 1 500 mm de pluie. Sur sol pauvre en humus, prévoir 10 à 20 t de fumier par ha. Planter au début de la grande saison des pluies.',
             sources=src('CA1', 'CA3')),
        step('prep', 'prep', 'field', (-30, -7), 'Clearing and soil preparation', 'Défrichage et préparation du sol',
             'Clear, burn down regrowth if needed and prepare the soil (ridges or mounds). The Cameroon budget counts 50 person days per ha.',
             'Défricher, traiter les repousses si nécessaire et préparer le sol (billons ou buttes). Le budget camerounais compte 50 jours de travail par ha.',
             inputs=[('glyphosate', 0.8, 1, src('CA4'))], labour=50, sources=src('CA2', 'CA4')),
        step('manure', 'planting', 'field', (-21, -7), 'Organic manure', 'Fumure organique',
             'Spread 10 t of well decomposed manure per ha on poor soils, the low end of 10 to 20 t.',
             'Épandre 10 t de fumier bien décomposé par ha sur sol pauvre, le bas de la fourchette de 10 à 20 t.',
             inputs=[('farmyard_manure', 10000, 1, src('CA1'))], labour=PROXY_LAB['manure'], sources=src('CA1', 'T1')),
        step('cuttings', 'planting', 'field', (-3, 0), 'Cuttings', 'Boutures',
             'Cut 20 to 30 cm cuttings with 5 to 7 eyes from healthy 12 to 18 month stems of an improved variety; treat in hot water at 50 °C for 15 minutes or in a fungicide insecticide dip.',
             'Couper des boutures de 20 à 30 cm portant 5 à 7 yeux sur des tiges saines de 12 à 18 mois d’une variété améliorée ; traiter à l’eau chaude à 50 °C pendant 15 minutes ou dans un bain fongicide insecticide.',
             inputs=[('cassava_cutting', plants, 1, src('CA8', 'CA3'))], labour=5, sources=src('CA2', 'CA3', 'CA8')),
        step('plant', 'planting', 'field', (0, 5), 'Planting', 'Plantation',
             'Plant at 1 m × 1 m, about 10,000 plants per ha, and fill the gaps 3 to 5 weeks later.',
             'Planter à 1 m × 1 m, soit environ 10 000 plants par ha, et remplacer les manquants 3 à 5 semaines plus tard.',
             labour=15, sources=src('CA2', 'CA3')),
        step('fert', 'care', 'field', (45, 60), 'Mineral fertilizer', 'Engrais minéral',
             'Urea 100 kg and potassium sulphate 200 kg per ha. The sheet adds 100 kg of triple superphosphate, not budgeted for want of a Cameroon price.',
             'Urée 100 kg et sulfate de potassium 200 kg par ha. La fiche ajoute 100 kg de superphosphate triple, non budgété faute de prix camerounais.',
             inputs=[('urea', 100, 1, src('CA3')), ('k2so4', 200, 1, src('CA3'))], labour=PROXY_LAB['fert'], sources=src('CA3', 'T1')),
        step('weed', 'care', 'field', (21, 98), 'Three weedings', 'Trois sarclages',
             'Weed at 3 to 4, 7 to 9 and 12 to 14 weeks after planting; the crop then shades the weeds out.',
             'Sarcler à 3 à 4, 7 à 9 et 12 à 14 semaines après la plantation ; la culture étouffe ensuite les mauvaises herbes.',
             labour=20, sources=src('CA3', 'CA2')),
        step('protect', 'protection', 'field', (30, 150), 'Crop watch', 'Surveillance',
             'Treat the variegated grasshopper only above 12 larvae per m². Healthy cuttings are the main defence against mosaic. The plan budgets one insecticide treatment.',
             'Traiter contre le criquet puant seulement au delà de 12 larves par m². Des boutures saines sont la principale défense contre la mosaïque. Le plan compte un traitement insecticide.',
             inputs=[('insecticide_l', 1, 1, src('CA4'))], labour=PROXY_LAB['spray'], sources=src('CA3', 'CA4', 'T2')),
    ]
    rough = lambda en, fr: L(en, fr)
    return {
        'name': L('Cassava', 'Manioc'), 'release': 'regional', 'badge': L('Cameroon references', 'Références Cameroun'), 'profile': 'long',
        'plants_per_ha': plants, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 1000, 'agronomist_visits': 1, 'horizon_months': 15, 'first_harvest_months': 12,
        'kc': {'ini': 0.3, 'mid': 0.8, 'end': 0.3, 'stages': kc_stages([20, 40, 90, 60])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 365, 'harvest_days': 60, 'flowering_before_harvest_days': 0},
        'yield_t_ha': yields(8.0, 25.0, 16.0),
        'harvest_label': L('Harvest', 'Récolte'),
        'harvest_detail': L('Lift the roots from about 12 months, staggered over two months; roots spoil within two days, so sell or process them at once.', 'Arracher les racines à partir d’environ 12 mois, en étalant sur deux mois ; les racines s’abîment en deux jours, il faut les vendre ou les transformer aussitôt.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed: fresh roots 65 to 100 FCFA/kg at the farm gate and 70 to 105 FCFA/kg on markets in the East (survey published 2019).', 'Observé : racines fraîches 65 à 100 FCFA/kg bord champ et 70 à 105 FCFA/kg sur les marchés de l’Est (enquête publiée en 2019).'), 'src': src('CA4')},
        'products': {
            'fresh': {'label': L('Fresh roots', 'Racines fraîches'), 'ratio': 1},
            'cossettes': {'label': L('Cossettes (dried chips)', 'Cossettes'), 'ratio': 0.25,
                          'costs': [{'xaf_per_t': 20000, 'key': 'process_cossettes', 'label': L('Peeling, washing and drying, paid per tonne', 'Épluchage, lavage et séchage, payés à la tonne'), 'src': src('CA4')},
                                    {'xaf_per_t': 4000, 'key': 'process_water', 'label': L('Water for soaking', 'Eau de rouissage'), 'src': src('CA4')}],
                          'price': {'observed': L('Observed: processors sell at 160 to 200 FCFA/kg in the East (2019); 219 to 257 FCFA/kg in northern markets, late 2022.', 'Observé : les transformateurs vendent 160 à 200 FCFA/kg à l’Est (2019) ; 219 à 257 FCFA/kg sur les marchés du Nord fin 2022.'), 'src': src('CA4', 'CA9')},
                          'basis': '250 kg of cossettes per t of roots (CA2; 300 to 370 kg in CA5). Costs per t of roots in the East: labour 5,000, water 1,000 FCFA (CA4), divided by the ratio.', 'src': src('CA2', 'CA4', 'CA5')},
            'gari': {'label': L('Gari', 'Gari'), 'ratio': 0.25,
                     'costs': [{'labour_days_per_t': round(roots_lab_per_t / 0.25, 1), 'label': L('Gari making: peeling, grating, pressing, roasting', 'Fabrication du gari : épluchage, râpage, pressage, cuisson'), 'src': src('CA2')},
                               {'xaf_per_t': round(fuel_per_t_roots / 0.25), 'key': 'process_fuel', 'label': L('Water and firewood', 'Eau et bois de chauffe'), 'src': src('CA2')}],
                     'price': {'observed': L('Observed: 300 FCFA/kg in a Cameroon processing budget (2015).', 'Observé : 300 FCFA/kg dans un budget de transformation au Cameroun (2015).'), 'src': src('CA2')},
                     'basis': '200 to 300 kg of gari per t of roots (CA2), 250 used; 200 to 220 kg in CA5. Per t of roots: 20 person days per 2.5 t and 5,000 FCFA of water and firewood (CA2).', 'src': src('CA2', 'CA5')},
            'baton': {'label': L('Bâton (bobolo, miondo)', 'Bâton de manioc (bobolo, miondo)'), 'ratio': 0.48, 'unit': 'piece', 'unit_kg': 0.6, 'unit_label': L('piece', 'pièce'),
                      'costs': [{'labour_days_per_t': round(roots_lab_per_t / 0.48, 1), 'label': L('Retting, pounding, wrapping and steaming', 'Rouissage, pilage, emballage et cuisson'), 'src': src('CA2')},
                                {'xaf_per_t': round(fuel_per_t_roots / 0.48), 'key': 'process_fuel', 'label': L('Water and firewood', 'Eau et bois de chauffe'), 'src': src('CA2')}],
                      'price': {'observed': L('Observed in Douala, Saker market, 2022: bobolo 200 FCFA a piece, miondo 600 FCFA a stick.', 'Observé à Douala, marché Saker, 2022 : bobolo 200 FCFA la pièce, miondo 600 FCFA le bâton.'), 'src': src('CA7')},
                      'basis': 'About 48 kg of chikwangue per 100 kg of roots and pieces of about 600 g (CA6, Congo). Labour, water and firewood per t of roots taken from the gari budget (CA2) as a proxy; wrapping leaves are not budgeted.', 'src': src('CA6', 'CA2')},
        },
        'harvest_src': src('CA2'),
        'disease_note': L('Mosaic and mealybug are kept down by healthy cuttings of resistant varieties; the variegated grasshopper is treated above 12 larvae per m² (CA3).', 'La mosaïque et la cochenille sont limitées par des boutures saines de variétés résistantes ; le criquet puant est traité au delà de 12 larves par m² (CA3).'),
        'steps': steps, 'src': src('CA1', 'CA2', 'CA3', 'CA4', 'M1'),
        'basis': {
            'plants_per_ha': '1 m × 1 m, 10,000 plants per ha (CA2, CA3).',
            'kc': 'FAO-56 cassava, year 1: Kc 0.3, 0.8, 0.3; stage lengths 20/40/90/60 days (M1). No FAO yield response factor: water shortage raises the risk but does not cut the yield in the model.',
            'cycle': 'Harvest from 12 months (CA2, CA10), staggered over 60 days; horizon 15 months.',
            'yield_t_ha': 'Poor 8 = low end of typical yields 8 to 15 t/ha (CA2); average 16 = national yield (CA1); good 25 = low end of improved varieties 25 to 70 t/ha (CA2). An East Cameroon survey found 6.5 t/ha (CA4).',
            'labour': 'Soil preparation 50, cuttings 5, planting 15, upkeep 20 person days per ha from the CTA and ISF Cameroon budget (CA2); harvest 30 person days for 30 t, so 1,000 kg a day (CA2).',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': L('MINADER sheet and a Cameroon production budget, completed with a West African fertilizer sheet.', 'Fiche du MINADER et budget de production camerounais, complétés par une fiche ouest africaine pour la fumure.')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('National yield and Cameroon references; improved varieties can do far better.', 'Rendement national et références camerounaises ; les variétés améliorées peuvent faire beaucoup mieux.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'low', 'note': L('East Cameroon survey and northern market bulletin; you enter your own price.', 'Enquête à l’Est et bulletin des marchés du Nord ; vous saisissez votre prix.')},
            {'block': L('Processing', 'Transformation'), 'level': 'low', 'note': L('Conversion ratios from Cameroon and FAO references; the bâton ratio comes from a Congo study.', 'Taux de conversion issus de références camerounaises et de la FAO ; celui du bâton vient d’une étude au Congo.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56.')},
        ],
    }


def plantain():
    plants = 1666  # 3 m x 2 m (PL1)
    q = lambda grams: round(grams * plants / 1000)
    steps = [
        step('site', 'prep', 'field', (-60, -45), 'Plot choice', 'Choix de la parcelle',
             'Deep, well drained soil and about 200 mm of water a month. Plant before the end of August at the latest.',
             'Sol profond et bien drainé, environ 200 mm d’eau par mois. Planter au plus tard fin août.',
             sources=src('PL1')),
        step('clear', 'prep', 'field', (-40, -21), 'Clearing and weed control', 'Défrichage et désherbage',
             'Clear, then glyphosate at 4.5 L per ha against annual weeds (6 L for perennial weeds).',
             'Défricher, puis glyphosate à 4,5 L par ha contre les mauvaises herbes annuelles (6 L contre les vivaces).',
             inputs=[('glyphosate', 4.5, 1, src('PL1'))], labour=PROXY_LAB['clear'], sources=src('PL1', 'T1')),
        step('holes', 'prep', 'field', (-21, -7), 'Holes and manure', 'Trouaison et fumure',
             'Dig 60 × 60 × 60 cm holes at 3 m × 2 m, fill with about 40 cm of topsoil and 10 kg of compost or manure per hole.',
             'Creuser des trous de 60 × 60 × 60 cm à 3 m × 2 m, les remplir d’environ 40 cm de terre noire et de 10 kg de compost ou de fumier par trou.',
             inputs=[('farmyard_manure', plants * 10, 1, src('PL1'))], labour=PROXY_LAB['plough'] + PROXY_LAB['manure'], sources=src('PL1', 'T1')),
        step('plant', 'planting', 'field', (0, 5), 'Planting PIF plants', 'Plantation des plants PIF',
             'Plant healthy PIF plants, 1,666 per ha. PIF plants are free of weevils and nematodes when they leave the nursery.',
             'Planter des plants PIF sains, 1 666 par ha. Les plants PIF sortent de pépinière indemnes de charançons et de nématodes.',
             inputs=[('plantain_pif', plants, 1, src('PL7'))], labour=PROXY_LAB['transplant'], sources=src('PL1', 'PL7', 'T1')),
        step('start_feed', 'care', 'field', (30, 90), 'Starter fertilizer', 'Engrais de démarrage',
             'NPK 20-10-10 at 100 g per plant one to three months after planting.',
             'NPK 20-10-10 à 100 g par plant un à trois mois après la plantation.',
             inputs=[('npk_20_10_10', q(100), 1, src('PL1'))], labour=PROXY_LAB['fert'], sources=src('PL1', 'T1')),
    ]
    recurring = [
        rec('feed', 'care', 'Fertilizer rich in N and K', 'Engrais riche en N et K',
            'About 1 kg of complete fertilizer per plant a year in three applications, every four months. Potassium chloride, also listed by the sheet, is covered by this formula.',
            'Environ 1 kg d’engrais complet par plant et par an en trois apports, tous les quatre mois. Le chlorure de potassium, aussi cité par la fiche, est couvert par cette formule.',
            4, 3, inputs=[('npk_15_12_24', q(333), 1, src('PL1'))], labour=PROXY_LAB['fert'], sources=src('PL1', 'T1')),
        rec('manure', 'care', 'Yearly organic manure', 'Fumure organique annuelle',
            '10 t of compost or poultry manure per ha a year, the low end of 10 to 15 t.',
            '10 t de compost ou de fiente par ha et par an, le bas de la fourchette de 10 à 15 t.',
            12, 12, inputs=[('farmyard_manure', 10000, 1, src('PL1'))], labour=PROXY_LAB['manure'], sources=src('PL1', 'T1')),
        rec('weed_young', 'care', 'Weeding, first months', 'Sarclage, premiers mois',
            'Weed regularly during the first six months.', 'Sarcler régulièrement pendant les six premiers mois.',
            2, 1, 11, labour=PROXY_LAB['weed'], sources=src('PL1', 'T1')),
        rec('weed', 'care', 'Weeding', 'Sarclage', 'Keep the plantation clean once the canopy has closed.', 'Garder la bananeraie propre une fois la couverture fermée.',
            3, 12, labour=PROXY_LAB['weed'], sources=src('PL1', 'T1')),
        rec('desucker', 'care', 'Desuckering and leaf sanitation', 'Œilletonnage et effeuillage',
            'Every two months keep one vigorous successor sucker and remove diseased leaves; cut the male bud 7 to 10 days after the last hand.',
            'Tous les deux mois, garder un rejet successeur vigoureux et retirer les feuilles malades ; couper le bourgeon mâle 7 à 10 jours après la dernière main.',
            2, 4, labour=PROXY_LAB['prune'], sources=src('PL1', 'PL2', 'T1')),
        rec('prop', 'care', 'Propping at flowering', 'Tuteurage à la floraison',
            'Prop each plant from flowering so the bunch does not topple; toppling and theft are major losses on Cameroon farms.',
            'Tuteurer chaque plant dès la floraison pour que le régime ne verse pas ; la verse et le vol sont de grosses pertes dans les exploitations camerounaises.',
            10, 9, inputs=[('stake', plants, 1, src('PL1'))], labour=PROXY_LAB['stake'], sources=src('PL1', 'PL3', 'T1')),
        rec('weevil', 'protection', 'Weevil control', 'Lutte contre le charançon',
            'Two to four treatments a year in the rainy season. The sheet names chlorpyrifos and carbofuran: chlorpyrifos is banned in Cameroon and carbofuran is highly hazardous; neem powder is an alternative. The plan budgets three treatments of a registered insecticide.',
            'Deux à quatre traitements par an en saison des pluies. La fiche cite le chlorpyrifos et le carbofuran : le chlorpyrifos est interdit au Cameroun et le carbofuran est très dangereux ; la poudre de neem est une alternative. Le plan compte trois traitements d’un insecticide homologué.',
            4, 2, inputs=[('insecticide_l', 1, 1, src('T2'))], labour=PROXY_LAB['spray'], sources=src('PL1', 'T2')),
    ]
    return {
        'name': L('Plantain', 'Banane plantain'), 'release': 'regional', 'badge': L('Cameroon references', 'Références Cameroun'), 'profile': 'ratoon',
        'plants_per_ha': plants, 'ky': 1.2, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 1000, 'agronomist_visits': 1, 'horizon_months': 15,
        'horizon_options': [{'months': 15, 'cycles': 1}, {'months': 25, 'cycles': 2}, {'months': 36, 'cycles': 3}], 'first_harvest_months': 13,
        'kc': {'ini': 0.5, 'mid': 1.1, 'end': 1.0, 'stages': kc_stages([120, 90, 120, 60])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 380, 'harvest_days': 60, 'flowering_before_harvest_days': 80},
        'production': {'cycles': 3, 'interval_days': 300, 'factors': [1, 1, 1]},
        'yield_t_ha': yields(6.8, 25.0),
        'harvest_label': L('Harvest, cycle {n}', 'Récolte, cycle {n}'),
        'harvest_detail': L('Cut the bunch 70 days after flowering at physiological maturity, or 90 days for ripe fruit, and cut the stem at three quarters of its height.', 'Couper le régime 70 jours après la floraison à maturité physiologique, ou 90 jours pour un fruit mûr, et couper le pseudo tronc aux trois quarts de sa hauteur.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed in Yaoundé: usually 3,000 to 4,000 FCFA a bunch, 13,500 FCFA on average in the June 2025 shortage; a medium bunch was about 4,000 FCFA in 2016.', 'Observé à Yaoundé : habituellement 3 000 à 4 000 FCFA le régime, 13 500 FCFA en moyenne pendant la pénurie de juin 2025 ; un régime moyen valait environ 4 000 FCFA en 2016.'), 'src': src('PL5', 'PL6')},
        'products': {'fresh': {'label': L('Bunches', 'Régimes'), 'ratio': 1, 'unit': 'bunch', 'unit_kg': 11.6, 'unit_label': L('bunch', 'régime')}},
        'harvest_src': src('CA2'),
        'disease_note': L('Banana weevil and nematodes topple plants; leaf spot needs leaf removal; bunchy top plants are uprooted (PL1). On farms near Njombé only a third of the potential bunches were harvested (PL3).', 'Le charançon et les nématodes font verser les plants ; la cercosporiose impose l’effeuillage ; les plants atteints de bunchy top sont arrachés (PL1). Près de Njombé, seul un tiers des régimes potentiels a été récolté (PL3).'),
        'steps': steps, 'recurring': recurring, 'src': src('PL1', 'PL2', 'PL3', 'PL4', 'M1', 'M6'),
        'basis': {
            'plants_per_ha': '3 m × 2 m, 1,666 plants per ha (PL1).',
            'ky': 'FAO yield response factor for banana 1.2 to 1.35, 1.2 used (M6).',
            'kc': 'FAO-56 banana, first year: Kc 0.5, 1.1, 1.0; stage lengths 120/90/120/60 days (M1).',
            'cycle': 'Flowering about 10 months after planting, cycle 10 to 15 months (PL2); harvest 10 to 12 months after planting under irrigation (PL4, 2024); harvest 70 to 90 days after flowering (PL1): first bunches at 380 days (about 13 months), cut over two months. The plan covers one cycle (15 months) by default; the successor suckers give a second and third cycle, 300 days apart (Djalumo Agro assumption, no Cameroon figure found); clumps are kept three or four years (PL8).',
            'yield_t_ha': 'Per cycle. Poor 6.8 = mean yield on farms near Njombé (PL3; national about 7, PL9); good 25 = 15 kg bunches (PL4, Corne 1) on 1,666 plants (PL1), derived; average = midpoint. A bunch is counted at 11.6 kg, the farm mean (PL3).',
            'harvest_kg_per_person_day': 'No plantain figure found; the cassava harvest norm of the Cameroon budget (CA2) is used as a proxy for a bulky crop.',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6). Theft and toppling are inside the poor yield.',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': L('IFATI plantain sheet from Cameroon; labour norms are proxies.', 'Fiche plantain de l’IFATI au Cameroun ; les temps de travail sont des substituts.')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('Measured on Cameroon farms (CIRAD); the good level is derived.', 'Mesurés dans des exploitations camerounaises (CIRAD) ; le niveau bon est calculé.')},
            {'block': L('Cycles', 'Cycles'), 'level': 'low', 'note': L('The interval between successive harvests is an assumption.', 'L’intervalle entre récoltes successives est une hypothèse.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'low', 'note': L('Yaoundé market reports, very volatile; you enter your price per bunch.', 'Relevés des marchés de Yaoundé, très volatils ; vous saisissez votre prix par régime.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 and FAO-33 methods.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56 et FAO-33.')},
        ],
    }


def avocado():
    trees = 156  # 8 m x 8 m (AV7: 8 to 10 m), derived
    q = lambda grams: round(grams * trees / 1000, 1)
    steps = [
        step('site', 'prep', 'field', (-90, -60), 'Site and varieties', 'Site et variétés',
             'Soil at least 1 to 1.5 m deep, pH above 4.5 to 5, 1,200 to 1,600 mm of rain and about two dry months to trigger flowering. Choose grafted plants of known varieties (Pollock, Booth 7, Peterson, Hickson) and alternate varieties by row for pollination.',
             'Sol d’au moins 1 à 1,5 m de profondeur, pH au dessus de 4,5 à 5, 1 200 à 1 600 mm de pluie et environ deux mois secs pour déclencher la floraison. Choisir des plants greffés de variétés connues (Pollock, Booth 7, Peterson, Hickson) et alterner les variétés par ligne pour la pollinisation.',
             sources=src('AV3', 'AV1')),
        step('clear', 'prep', 'field', (-60, -35), 'Clearing', 'Défrichage', 'Clear the plot and mark the planting points 8 m apart.', 'Défricher la parcelle et piqueter les points de plantation à 8 m.',
             labour=PROXY_LAB['clear'], sources=src('AV7', 'T1')),
        step('holes', 'prep', 'field', (-30, -7), 'Holes and mounds', 'Trous et buttes',
             'Dig 60 × 60 × 60 cm holes a month ahead and fill them with topsoil, 20 kg of farmyard manure and 120 g of double superphosphate (DAP in the budget as the nearest phosphate); raise mounds 30 cm high with a 1 m base.',
             'Creuser les trous de 60 × 60 × 60 cm un mois à l’avance et les remplir de terre, de 20 kg de fumier et de 120 g de superphosphate double (DAP au budget comme phosphate le plus proche) ; former des buttes de 30 cm de haut sur 1 m de base.',
             inputs=[('farmyard_manure', trees * 20, 1, src('AV5')), ('dap', q(120), 1, src('AV5'))], labour=15, sources=src('AV5', 'AV3', 'AV6')),
        step('plant', 'planting', 'field', (0, 7), 'Planting grafted trees', 'Plantation des plants greffés',
             'Plant 156 grafted trees per ha at the start of the rains; remove the flowers of the first years so the tree builds its frame.',
             'Planter 156 plants greffés par ha au début des pluies ; retirer les fleurs des premières années pour que l’arbre forme sa charpente.',
             inputs=[('avocado_grafted', trees, 1, src('AV8'))], labour=13, sources=src('AV6', 'AV8')),
    ]
    yrs = lambda *v: list(v)
    recurring = [
        rec('feed_n', 'care', 'Nitrogen by tree age', 'Azote selon l’âge des arbres',
            'Calcium ammonium nitrate: 125 g per tree in years 1 to 3, 225 g in years 4 and 5, 450 g in years 6 and 7, 650 g in years 8 and 9, 900 g from year 10.',
            'Ammonitrate calcique : 125 g par arbre les années 1 à 3, 225 g les années 4 et 5, 450 g les années 6 et 7, 650 g les années 8 et 9, 900 g dès l’année 10.',
            12, 2, inputs=[('can', q(125), 1, src('AV5'))], sources=src('AV5'), qty_by_year=yrs(1, 1, 1, 1.8, 1.8, 3.6, 3.6, 5.2, 5.2, 7.2)),
        rec('feed_p', 'care', 'Phosphate by tree age', 'Phosphate selon l’âge des arbres',
            'Double superphosphate: 225 g per tree in years 1 to 3, 450 g in years 4 and 5, 650 g in years 6 to 9, 1 kg from year 10. DAP is used in the budget as the nearest phosphate.',
            'Superphosphate double : 225 g par arbre les années 1 à 3, 450 g les années 4 et 5, 650 g les années 6 à 9, 1 kg dès l’année 10. Le DAP est utilisé au budget comme phosphate le plus proche.',
            12, 2, inputs=[('dap', q(225), 1, src('AV5'))], sources=src('AV5'), qty_by_year=yrs(1, 1, 1, 2, 2, 2.89, 2.89, 2.89, 2.89, 4.44)),
        rec('feed_k', 'care', 'Potash from year 6', 'Potasse dès l’année 6',
            'Muriate of potash: 225 g per tree in years 6 and 7, 450 g in years 8 and 9, 635 g from year 10. Potassium sulphate is used in the budget, the potash form with a Cameroon price.',
            'Chlorure de potassium : 225 g par arbre les années 6 et 7, 450 g les années 8 et 9, 635 g dès l’année 10. Le sulfate de potassium est utilisé au budget, la forme de potasse ayant un prix camerounais.',
            12, 62, inputs=[('k2so4', q(225), 1, src('AV5'))], sources=src('AV5'), qty_by_year=yrs(0, 0, 0, 0, 0, 1, 1, 2, 2, 2.82)),
        rec('feed_om', 'care', 'Farmyard manure', 'Fumier',
            '15 kg per tree a year in years 1 to 5, 30 kg in years 6 to 9.', '15 kg par arbre et par an les années 1 à 5, 30 kg les années 6 à 9.',
            12, 2, inputs=[('farmyard_manure', trees * 15, 1, src('AV5'))], sources=src('AV5'), qty_by_year=yrs(1, 1, 1, 1, 1, 2, 2, 2, 2, 0)),
        rec('feed_work', 'care', 'Fertilizing work', 'Travail de fertilisation', 'Spread the fertilizers around the drip line of each tree.', 'Épandre les engrais autour de la projection de la couronne de chaque arbre.',
            12, 2, labour=1, sources=src('AV6'), qty_by_year=yrs(4, 6, 7, 4, 4, 4, 4, 4, 4, 4)),
        rec('mulch', 'care', 'Mulching and mounding', 'Paillage et buttage', 'Mulch the base of the trees and keep the mounds up.', 'Pailler le pied des arbres et entretenir les buttes.',
            12, 3, labour=15, sources=src('AV6')),
        rec('weed', 'care', 'Weeding', 'Désherbage', 'Keep the tree rows clean all year.', 'Garder les lignes d’arbres propres toute l’année.',
            12, 1, labour=24, sources=src('AV6')),
        rec('protect', 'protection', 'Pest and disease control', 'Protection phytosanitaire',
            'Copper fungicide against anthracnose and leaf spot from fruit set to harvest, a contact insecticide when needed. Mancozeb is used in the budget for the copper fungicide.',
            'Fongicide cuprique contre l’anthracnose et la cercosporiose de la nouaison à la récolte, insecticide de contact au besoin. Le mancozèbe est utilisé au budget pour le fongicide cuprique.',
            12, 6, inputs=[('insecticide_l', 1.5, 1, src('AV6')), ('mancozeb', 1, 1, src('AV6'))], labour=12, sources=src('AV6')),
        rec('prune', 'care', 'Pruning', 'Taille', 'Shape the trees and remove dead wood from the third year.', 'Former les arbres et retirer le bois mort dès la troisième année.',
            12, 24, labour=8, sources=src('AV6')),
    ]
    return {
        'name': L('Avocado', 'Avocat'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'), 'profile': 'orchard',
        'plants_per_ha': trees, 'loss_pct': 15, 'harvest_kg_per_person_day': round(13500 / 40), 'agronomist_visits': 1, 'horizon_months': 60,
        'horizon_options': [{'months': 36}, {'months': 60}, {'months': 120}], 'first_harvest_months': 28,
        'kc': {'ini': 0.85, 'mid': 0.85, 'end': 0.85, 'stages': [0.25, 0.5, 0.75]},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 0, 'harvest_days': 0, 'flowering_before_harvest_days': 0},
        'production': {'yield_by_year': [0, 0, 0.15, 0.35, 0.5, 0.75, 0.9, 1, 1, 1], 'harvest_months': [1, 2, 3, 4, 6, 7, 8]},
        'yield_t_ha': yields(7.5, 13.5, 10.0),
        'harvest_label': L('Harvest, year {n}', 'Récolte, année {n}'),
        'harvest_detail': L('Two harvests a year in Cameroon, February to May and July to September; fruit is sold by the 100 kg sack.', 'Deux récoltes par an au Cameroun, de février à mai et de juillet à septembre ; les fruits se vendent au sac de 100 kg.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed: traders buy a 100 kg sack at the field for 25,000 to 65,000 FCFA depending on the variety (2022); 10,000 to 60,000 FCFA depending on the period (2016); fruits retail at 100 to 500 FCFA.', 'Observé : les commerçants achètent le sac de 100 kg au champ 25 000 à 65 000 FCFA selon la variété (2022) ; 10 000 à 60 000 FCFA selon la période (2016) ; les fruits se vendent au détail 100 à 500 FCFA.'), 'src': src('AV2', 'AV1')},
        'products': {'fresh': {'label': L('Fruit, by the sack', 'Fruits, au sac'), 'ratio': 1, 'unit': 'sack', 'unit_kg': 100, 'unit_label': L('100 kg sack', 'sac de 100 kg')}},
        'harvest_src': src('AV6'),
        'disease_note': L('Anthracnose and leaf spot thrive in wet weather; root rot (phytophthora) on poorly drained soils (AV6).', 'L’anthracnose et la cercosporiose prospèrent par temps humide ; la pourriture des racines (phytophthora) sur sols mal drainés (AV6).'),
        'steps': steps, 'recurring': recurring, 'src': src('AV1', 'AV2', 'AV4', 'AV5', 'AV6', 'AV9', 'M1'),
        'basis': {
            'plants_per_ha': '8 m × 8 m, 156 trees per ha, within 8 to 10 m between trees (AV7); 120 trees at 9 m × 9 m (AV5), about 150 in the Trinidad model (AV6).',
            'kc': 'FAO-56 avocado without ground cover, mid season Kc 0.85 used through the year (M1). No FAO yield response factor: water shortage raises the risk, not the modelled yield.',
            'cycle': 'Grafted Hass trees reach production in 2.5 to 3 years (AV9, 2023); grafted trees bear from about year 3 (AV1, AV4); economic crop from year 6 (AV5). The first harvest falls about 27 to 30 months after planting depending on the planting month. Yield shares by year 0, 0, 15, 35, 50, 75, 90, then 100% are a Djalumo Agro assumption fitted to these points and to the young tree yields of AV5.',
            'yield_t_ha': 'Mature orchard, fresh fruit per year. Poor 7.5 = low end of 7.5 to 11 t/ha (AV5); average 10 = well kept orchards in Cameroon, more than 10 t/ha (AV1, AV2); good 13.5 = Trinidad model from year 4 (AV6).',
            'harvest_kg_per_person_day': '13,500 kg picked in 40 person days in the Trinidad model (AV6), derived.',
            'loss_pct': '15% post harvest loss in the Trinidad model (AV6).',
            'labour': 'Planting 13, mounding 15, weeding 24, pest control 12, pruning 8 from year 3 and fertilizing 4 to 7 person days per ha a year (AV6).',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': L('Kenya (KALRO) fertilizer schedule and Trinidad labour model, with Cameroon site and variety advice.', 'Calendrier de fumure du Kenya (KALRO) et modèle de travail de Trinidad, avec les conseils camerounais sur le site et les variétés.')},
            {'block': L('Yields', 'Rendements'), 'level': 'low', 'note': L('Cameroon level for mature orchards; the ramp by age is an assumption.', 'Niveau camerounais pour les vergers adultes ; la montée en production par âge est une hypothèse.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'low', 'note': L('Sack prices from Cameroon press, wide range; you enter your price per sack.', 'Prix au sac relevés par la presse camerounaise, fourchette large ; vous saisissez votre prix par sac.')},
            {'block': L('Export', 'Export'), 'level': 'low', 'note': L('Europe needs commercial varieties, certification and cold chain; this plan prices the local market.', 'L’Europe exige des variétés commerciales, une certification et une chaîne du froid ; ce plan chiffre le marché local.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56.')},
        ],
    }


def pineapple():
    plants = 55000  # twin rows 90 x 40 x 28 cm (AN2), low end of 55,000 to 77,000 in Cameroon (AN1)
    g = lambda grams: round(grams * plants / 1000)
    steps = [
        step('site', 'prep', 'field', (-60, -45), 'Plot and suckers', 'Parcelle et rejets',
             'Well drained soil, ridges in wet areas. Use suckers of 300 to 500 g and plant each block with one weight class so that the plants flower together.',
             'Sol bien drainé, billons en zone humide. Utiliser des rejets de 300 à 500 g et planter chaque bloc avec une seule classe de poids pour que les plants fleurissent ensemble.',
             sources=src('AN1', 'AN2')),
        step('clear', 'prep', 'field', (-45, -25), 'Clearing', 'Défrichage', 'Clear the plot and remove the stumps.', 'Défricher la parcelle et enlever les souches.',
             labour=PROXY_LAB['clear'], sources=src('T1')),
        step('beds', 'prep', 'field', (-25, -7), 'Ridges and twin rows', 'Billons et lignes jumelées',
             'Prepare ridges for twin rows: 90 cm between twin rows, 40 cm between the two lines, 28 cm between plants, about 55,000 plants per ha.',
             'Préparer des billons pour des lignes jumelées : 90 cm entre lignes jumelées, 40 cm entre les deux lignes, 28 cm entre plants, soit environ 55 000 plants par ha.',
             labour=PROXY_LAB['plough'], sources=src('AN2', 'T1')),
        step('plant', 'planting', 'field', (0, 10), 'Planting suckers', 'Plantation des rejets',
             'Plant 55,000 suckers per ha, sorted by weight.', 'Planter 55 000 rejets par ha, triés par poids.',
             inputs=[('pineapple_sucker', plants, 1, src('AN3'))], labour=55, sources=src('AN1', 'AN2', 'AN3')),
        step('fert1', 'care', 'field', (90, 100), 'First fertilizer', 'Premier apport d’engrais',
             'Three months after planting: 7.36 g of urea and 3.66 g of NPK per plant.', 'Trois mois après la plantation : 7,36 g d’urée et 3,66 g de NPK par plant.',
             inputs=[('urea', g(7.36), 1, src('AN3')), ('npk_15_15_15', g(3.66), 1, src('AN3'))], labour=PROXY_LAB['fert'], sources=src('AN3', 'T1')),
        step('fert2', 'care', 'field', (180, 190), 'Second fertilizer', 'Deuxième apport d’engrais',
             'Three months later: 3.67 g of urea and 7.33 g of NPK per plant.', 'Trois mois plus tard : 3,67 g d’urée et 7,33 g de NPK par plant.',
             inputs=[('urea', g(3.67), 1, src('AN3')), ('npk_15_15_15', g(7.33), 1, src('AN3'))], labour=PROXY_LAB['fert'], sources=src('AN3', 'T1')),
        step('fert3', 'care', 'field', (270, 280), 'Third fertilizer', 'Troisième apport d’engrais',
             'Three months later: 7.33 g of NPK and 10.16 g of potassium sulphate per plant.', 'Trois mois plus tard : 7,33 g de NPK et 10,16 g de sulfate de potassium par plant.',
             inputs=[('npk_15_15_15', g(7.33), 1, src('AN3')), ('k2so4', g(10.16), 1, src('AN3'))], labour=PROXY_LAB['fert'], sources=src('AN3', 'T1')),
        step('weed', 'care', 'field', (30, 240), 'Weeding', 'Désherbage', 'Weed every month until the canopy closes, six passes.', 'Désherber chaque mois jusqu’à la fermeture du couvert, six passages.',
             labour=PROXY_LAB['weed'] * 6, sources=src('AN2', 'T1')),
        step('tif', 'care', 'field', (245, 255), 'Flower induction', 'Induction florale (TIF)',
             'About eight months after planting, ethephon at 8 ml per 10 L of water, 10 L for 200 plants, applied at night and repeated three days later. The fruit is ripe about five months after induction.',
             'Environ huit mois après la plantation, éthéphon à 8 ml pour 10 L d’eau, 10 L pour 200 plants, appliqué de nuit et renouvelé trois jours plus tard. Le fruit est mûr environ cinq mois après l’induction.',
             inputs=[('ethephon', round(plants / 200 * 0.008, 2), 2, src('AN1', 'AN2'))], labour=16, sources=src('AN1', 'AN2')),
    ]
    return {
        'name': L('Pineapple', 'Ananas'), 'release': 'regional', 'badge': L('Cameroon references', 'Références Cameroun'), 'profile': 'long',
        'plants_per_ha': plants, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 400, 'agronomist_visits': 1, 'horizon_months': 16, 'first_harvest_months': 13,
        'kc': {'ini': 0.5, 'mid': 0.3, 'end': 0.3, 'stages': kc_stages([60, 120, 180, 95])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 410, 'harvest_days': 45, 'flowering_before_harvest_days': 160},
        'yield_t_ha': yields(15.5, 50.0, 31.0),
        'harvest_label': L('Harvest', 'Récolte'),
        'harvest_detail': L('Fruits ripen about five months after induction and are picked over six weeks; the suckers left on the stumps can start a second crop.', 'Les fruits mûrissent environ cinq mois après l’induction et se cueillent sur six semaines ; les rejets laissés sur les souches peuvent lancer une deuxième récolte.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed in Cameroon (2024): 400,000 to 600,000 FCFA a tonne wholesale, 100 to 400 FCFA a fruit at retail.', 'Observé au Cameroun (2024) : 400 000 à 600 000 FCFA la tonne en gros, 100 à 400 FCFA le fruit au détail.'), 'src': src('AN1')},
        'products': {'fresh': {'label': L('Fruit', 'Fruits'), 'ratio': 1, 'unit': 'fruit', 'unit_kg': 1.15, 'unit_label': L('fruit', 'fruit')}},
        'harvest_src': src('AN2'),
        'disease_note': L('Use healthy suckers sorted by weight on well drained soil; fruit weight falls at high density and on successive harvests (AN1, AN2).', 'Utiliser des rejets sains triés par poids sur sol bien drainé ; le poids des fruits baisse à forte densité et aux récoltes successives (AN1, AN2).'),
        'steps': steps, 'src': src('AN1', 'AN2', 'AN3', 'M1'),
        'basis': {
            'plants_per_ha': '55,000 plants per ha, twin rows 90 x 40 x 28 cm (AN2), low end of the 55,000 to 77,000 used in Cameroon (AN1).',
            'kc': 'FAO-56 pineapple without ground cover: Kc 0.5, 0.3, 0.3 (M1). No yield response factor: water shortage raises the risk, not the modelled yield.',
            'cycle': 'Flower induction 6 to 13 months after planting, fruit ripe about 160 days later, harvest 12 to 18 months after planting (AN1, AN2): induction at about 8 months, first fruits at about 13.5 months.',
            'yield_t_ha': 'Average 31 t/ha in Cameroon (AN1); good 50 t/ha (AN2, Togo); poor 15.5 = half the average, a Djalumo Agro assumption. Fruits of 1.15 kg on average (AN3).',
            'labour': 'Planting 55 person days (1,000 suckers a day), induction 16, harvest 400 kg a day: Djalumo Agro assumptions calibrated so that labour stays between the Togo (AN2) and Benin (AN3) budgets; other tasks use the tomato proxies (T1).',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': L('Cameroon market study and CTA and ISF Cameroun guide; fertilizer program from Benin.', 'Étude de marché camerounaise et guide CTA et ISF Cameroun ; programme d’engrais du Bénin.')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('Cameroon average 31 t/ha; the poor level is an assumption.', 'Moyenne camerounaise de 31 t/ha ; le niveau faible est une hypothèse.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'low', 'note': L('One 2024 Cameroon range; you enter your price per fruit.', 'Une fourchette camerounaise de 2024 ; vous saisissez votre prix par fruit.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56.')},
        ],
    }


def cocoa():
    trees = 1111  # 3 m x 3 m, within 850 to 1,300 plants per ha (CC4, CC3)
    steps = [
        step('site', 'prep', 'field', (-120, -90), 'Site and shade plan', 'Site et plan d’ombrage',
             'Forest soil, deep and well drained. Plan about 70% shade for young cocoa: keep useful trees, add shade trees and plant plantain as temporary shade.',
             'Sol forestier profond et bien drainé. Prévoir environ 70 % d’ombrage pour le jeune cacaoyer : garder les arbres utiles, ajouter des arbres d’ombrage et planter du plantain comme ombrage temporaire.',
             sources=src('CC4', 'CC5')),
        step('clear', 'prep', 'field', (-90, -60), 'Clearing and staking', 'Défrichage et piquetage', 'Clear the plot and mark the planting points 3 m apart.', 'Défricher la parcelle et piqueter les points de plantation à 3 m.',
             labour=PROXY_LAB['clear'] + 10, sources=src('T1')),
        step('shade', 'planting', 'field', (-60, -30), 'Shade trees', 'Arbres d’ombrage', 'Plant the shade trees and the temporary shade.', 'Planter les arbres d’ombrage et l’ombrage temporaire.',
             inputs=[('shade_trees', 1, 1, src('CC3'))], labour=15, sources=src('CC3', 'CC5')),
        step('holes', 'prep', 'field', (-30, -7), 'Holes', 'Trouaison', 'Dig 40 × 40 × 40 cm holes at 3 m × 3 m, 1,111 per ha.', 'Creuser des trous de 40 × 40 × 40 cm à 3 m × 3 m, soit 1 111 par ha.',
             labour=40, sources=src('CC2')),
        step('plant', 'planting', 'field', (0, 14), 'Planting improved seedlings', 'Plantation des plants améliorés',
             'Plant improved hybrid seedlings at the start of the rains, with 10% extra to replace losses.', 'Planter des plants hybrides améliorés au début des pluies, avec 10 % de plus pour remplacer les pertes.',
             inputs=[('cocoa_seedling', round(trees * 1.1), 1, src('CC2'))], labour=PROXY_LAB['transplant'], sources=src('CC1', 'CC2', 'T1')),
    ]
    yrs = lambda *v: list(v)
    recurring = [
        rec('weed', 'care', 'Weeding', 'Sarclage', 'Four weedings a year.', 'Quatre sarclages par an.', 3, 1, labour=PROXY_LAB['weed'], sources=src('CC2', 'T1')),
        rec('prune', 'care', 'Suckering and pruning', 'Égourmandage et taille', 'Remove the chupons every month; maintenance and sanitary pruning, never at leaf flush or flowering.', 'Retirer les gourmands chaque mois ; taille d’entretien et sanitaire, jamais pendant le renouvellement des feuilles ni la floraison.',
            1, 6, labour=3, sources=src('CC2', 'CC4')),
        rec('feed', 'care', 'Mineral fertilizer from year 4', 'Engrais minéral dès la 4e année', 'NPK 12-11-18 at 350 g per tree a year in two splits (NPK 12-14-19 in the budget, the nearest formula with a price).', 'NPK 12-11-18 à 350 g par arbre et par an en deux apports (NPK 12-14-19 au budget, la formule la plus proche ayant un prix).',
            6, 36, inputs=[('npk_12_14_19', round(trees * 0.175), 1, src('CC2'))], labour=PROXY_LAB['fert'], sources=src('CC2', 'T1')),
        rec('manure', 'care', 'Organic manure every three years', 'Fumure organique tous les trois ans', '5 t of manure or compost per ha every three years.', '5 t de fumier ou de compost par ha tous les trois ans.',
            36, 36, inputs=[('farmyard_manure', 5000, 1, src('CC2'))], labour=PROXY_LAB['manure'], sources=src('CC2', 'T1')),
        rec('fungi', 'protection', 'Black pod control', 'Lutte contre la pourriture brune',
            'Metalaxyl copper (Ridomil type) every three weeks in the risk period, June to October, six treatments a year from the first pods; no treatment in the 14 days before a harvest. Untreated trees lost a third to two thirds of their pods in Cameroon trials.',
            'Métalaxyl cuivre (type Ridomil) toutes les trois semaines pendant la période à risque, de juin à octobre, six traitements par an dès les premières cabosses ; aucun traitement dans les 14 jours avant une récolte. Sans traitement, un tiers à deux tiers des cabosses ont été perdues dans les essais camerounais.',
            12, 24, inputs=[('metalaxyl_mz', 0.5, 6, src('CC2'))], labour=PROXY_LAB['spray'] * 6, sources=src('CC2', 'CC4', 'CC6', 'T2'), span=120),
        rec('mirids', 'protection', 'Mirid control', 'Lutte contre les mirides', 'Two insecticide passes 21 days apart at leaf flush.', 'Deux passages d’insecticide à 21 jours d’intervalle au renouvellement des feuilles.',
            12, 12, inputs=[('insecticide_l', 1, 2, src('CC2'))], labour=PROXY_LAB['spray'] * 2, sources=src('CC2', 'CC4', 'T2')),
    ]
    return {
        'name': L('Cocoa', 'Cacao'), 'release': 'regional', 'badge': L('Cameroon references', 'Références Cameroun'), 'profile': 'orchard',
        'plants_per_ha': trees, 'loss_pct': 5, 'harvest_kg_per_person_day': 15, 'agronomist_visits': 1, 'horizon_months': 60,
        'horizon_options': [{'months': 60}, {'months': 120}], 'first_harvest_months': 30,
        'kc': {'ini': 1.0, 'mid': 1.05, 'end': 1.05, 'stages': [0.25, 0.5, 0.75]},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 0, 'harvest_days': 0, 'flowering_before_harvest_days': 0},
        'production': {'yield_by_year': [0, 0, 0.15, 0.4, 0.7, 0.9, 1, 1, 1, 1], 'harvest_months': [8, 9, 10, 11, 0]},
        'yield_t_ha': yields(0.3, 1.5, 0.8),
        'harvest_label': L('Cocoa campaign, year {n}', 'Campagne cacaoyère, année {n}'),
        'harvest_detail': L('Pick ripe pods, open them within 5 days, ferment 6 days with 3 turnings and sun dry 8 to 15 days down to 6 to 8% moisture. Sold as dry beans by the kg.', 'Cueillir les cabosses mûres, les écabosser sous 5 jours, fermenter 6 jours avec 3 brassages et sécher au soleil 8 à 15 jours jusqu’à 6 à 8 % d’humidité. Vendu en fèves sèches au kg.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed in 2026: ONCC minimum price 1,400 FCFA/kg in April (1,050 in January); 1,650 to 1,700 FCFA/kg at the farm gate in June; never above 2,000 FCFA in the 2025 to 2026 season.', 'Observé en 2026 : prix minimum ONCC 1 400 FCFA/kg en avril (1 050 en janvier) ; 1 650 à 1 700 FCFA/kg bord champ en juin ; jamais au delà de 2 000 FCFA sur la campagne 2025 à 2026.'), 'src': src('CC8', 'CC9')},
        'products': {'fresh': {'label': L('Dry beans', 'Fèves sèches'), 'ratio': 1}},
        'harvest_src': src('CC4'),
        'disease_note': L('Black pod (Phytophthora megakarya) is the main loss in wet months; mirids attack young shoots (CC2, CC6).', 'La pourriture brune (Phytophthora megakarya) est la principale perte des mois humides ; les mirides attaquent les jeunes pousses (CC2, CC6).'),
        'steps': steps, 'recurring': recurring, 'src': src('CC1', 'CC2', 'CC3', 'CC4', 'CC7', 'M1'),
        'basis': {
            'plants_per_ha': '3 m × 3 m, 1,111 trees per ha, within 850 to 1,100 (CC4) and 1,100 to 1,300 (CC3).',
            'kc': 'FAO-56 cocoa: Kc 1.0, 1.05, 1.05 (M1), used through the year.',
            'cycle': 'First yields 18 months after planting improved seedlings, a full crop after 2.5 to 3 years (CC1); SNK hybrids from 30 months (CC2). Yield shares 0, 0, 15, 40, 70, 90, then 100% follow the CC2 projection (250, 700, 1,200, then 1,800 kg/ha). The campaign runs from September (CC10).',
            'yield_t_ha': 'Dry beans. Poor 0.3 = unaided small farms (280 kg, CC7); average 0.8 = low end of well managed farms 0.8 to 1.5 t (CC3), above supported farms 0.5 to 0.6 t (CC7); good 1.5 (CC3); IRAD second generation varieties average 2 t (CC1).',
            'labour': 'Harvest, pod opening, fermentation and drying at 15 kg of dry beans per person day, suckering 3 person days a month, holes 40: Djalumo Agro assumptions; other tasks use the tomato proxies (T1, T2).',
            'protection': 'Six metalaxyl copper treatments of 0.5 kg per ha and two insecticide passes of 1 L per ha: doses are Djalumo Agro assumptions on the frequencies of CC2.',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'medium', 'note': L('ONCC 2025 manual and 2026 Cameroon guides; treatment doses are assumptions.', 'Manuel ONCC 2025 et guides camerounais de 2026 ; les doses de traitement sont des hypothèses.')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('EU value chain study and 2026 Cameroon guides; the ramp by age follows a projection.', 'Étude de chaîne de valeur de l’UE et guides camerounais de 2026 ; la montée en production suit une projection.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'medium', 'note': L('ONCC and market reports of 2026; you enter your price per kg.', 'Prix ONCC et relevés de marché de 2026 ; vous saisissez votre prix au kg.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods; cocoa grows mainly in the Centre, South and East.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56 ; le cacao se cultive surtout au Centre, au Sud et à l’Est.')},
        ],
    }


def oil_palm():
    palms = 143  # 9 m triangles (OP1)
    lab = lambda fcfa: round(fcfa / 2500, 1)  # MINADER budget amounts at 2,500 FCFA a person day (OP1)
    steps = [
        step('site', 'prep', 'field', (-120, -90), 'Site and seedlings', 'Site et plants', 'Deep, well drained soil. Order selected tenera seedlings: 160 for 143 palms, the rest to replace losses.', 'Sol profond et bien drainé. Commander des plants sélectionnés tenera : 160 pour 143 palmiers, le reste pour remplacer les pertes.',
             sources=src('OP1')),
        step('clear', 'prep', 'field', (-90, -60), 'Clearing', 'Défrichage', 'Clear and burn the debris: 20 and 4 person days per ha.', 'Défricher et brûler les débris : 20 et 4 jours de travail par ha.', labour=24, sources=src('OP1')),
        step('stake', 'prep', 'field', (-60, -45), 'Staking', 'Piquetage', 'Mark 9 m equilateral triangles, 143 points per ha.', 'Piqueter en triangles équilatéraux de 9 m, 143 points par ha.', labour=30, sources=src('OP1')),
        step('cover', 'planting', 'field', (-45, -30), 'Cover crop', 'Plante de couverture', 'Sow Mucuna as a cover crop, 12 kg per ha.', 'Semer du Mucuna en plante de couverture, 12 kg par ha.',
             inputs=[('mucuna_seed', 12, 1, src('OP1'))], labour=5, sources=src('OP1')),
        step('holes', 'prep', 'field', (-30, -7), 'Holes', 'Trouaison', 'Dig 40 × 40 × 40 cm holes, 200 FCFA a hole.', 'Creuser des trous de 40 × 40 × 40 cm, 200 FCFA le trou.', labour=lab(160 * 200), sources=src('OP1')),
        step('plant', 'planting', 'field', (0, 14), 'Planting and rodent guards', 'Plantation et manchons', 'Carry and plant the seedlings (300 FCFA a palm) and fix a galvanized mesh guard against rodents.', 'Transporter et planter les plants (300 FCFA le palmier) et fixer un manchon grillagé contre les rongeurs.',
             inputs=[('palm_seedling', 160, 1, src('OP1')), ('rodent_guard', palms, 1, src('OP1'))], labour=lab(160 * 300), sources=src('OP1')),
    ]
    adult = [0, 0, 0, 1, 1, 1, 1.333, 1.333, 1.333, 1.333, 1.333, 1.333, 1.333, 1.333, 1.333]
    recurring = [
        rec('feed_young', 'care', 'Fertilizer, young palms', 'Engrais, jeunes palmiers', 'Years 1 to 3: about 1 kg per palm a year in March and October, mixed from 1 bag of urea, 3 of potassium chloride and 3 of kieserite.', 'Années 1 à 3 : environ 1 kg par palmier et par an en mars et en octobre, mélange de 1 sac d’urée, 3 de chlorure de potassium et 3 de kiesérite.',
            6, 2, 35, inputs=[('urea', round(palms * 0.5 / 7, 1), 1, src('OP1')), ('kcl', round(palms * 0.5 * 3 / 7, 1), 1, src('OP1')), ('kieserite', round(palms * 0.5 * 3 / 7, 1), 1, src('OP1'))], labour=lab(25000 / 2), sources=src('OP1')),
        rec('feed_adult', 'care', 'Fertilizer, producing palms', 'Engrais, palmiers en production', 'From year 4: 1.5 kg per palm a year (2 kg from year 7) of potassium chloride and kieserite (2 to 1), in March and October.', 'Dès la 4e année : 1,5 kg par palmier et par an (2 kg dès la 7e année) de chlorure de potassium et de kiesérite (2 pour 1), en mars et en octobre.',
            6, 36, inputs=[('kcl', round(palms * 0.75 * 2 / 3, 1), 1, src('OP1')), ('kieserite', round(palms * 0.75 / 3, 1), 1, src('OP1'))], labour=lab(25000 / 2), sources=src('OP1'), qty_by_year=adult),
        rec('circles', 'care', 'Circle weeding', 'Sarclage des ronds', 'Clean a circle around each palm twice a year, 100 FCFA a palm.', 'Nettoyer un rond autour de chaque palmier deux fois par an, 100 FCFA le palmier.', 6, 1, labour=lab(160 * 100), sources=src('OP1')),
        rec('weed', 'care', 'Weeding and herbicide', 'Désherbage et herbicide', 'Weed the rows and the harvest paths; 1 L of glyphosate a year.', 'Désherber les interlignes et les chemins de récolte ; 1 L de glyphosate par an.', 12, 3,
            inputs=[('glyphosate', 1, 1, src('OP1'))], labour=lab(40000), sources=src('OP1')),
        rec('prune', 'care', 'Pruning', 'Élagage', 'Prune once a year in the dry season, 100 FCFA a palm.', 'Élaguer une fois par an en saison sèche, 100 FCFA le palmier.', 12, 30, labour=lab(160 * 100), sources=src('OP1')),
    ]
    return {
        'name': L('Oil palm', 'Palmier à huile'), 'release': 'regional', 'badge': L('MINADER references', 'Références MINADER'), 'profile': 'orchard',
        'plants_per_ha': palms, 'loss_pct': 5, 'harvest_kg_per_person_day': round(13000 / lab(50000)), 'agronomist_visits': 1, 'horizon_months': 120,
        'horizon_options': [{'months': 60}, {'months': 120}], 'first_harvest_months': 38,
        'kc': {'ini': 0.95, 'mid': 1.0, 'end': 1.0, 'stages': [0.25, 0.5, 0.75]},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 0, 'harvest_days': 0, 'flowering_before_harvest_days': 0},
        'production': {'yield_by_year': [0, 0, 0, 0.31, 0.46, 0.62, 1, 1, 1, 1], 'harvest_months': list(range(12))},
        'yield_t_ha': yields(4.0, 16.0, 13.0),
        'harvest_label': L('Bunch harvest, year {n}', 'Récolte des régimes, année {n}'),
        'harvest_detail': L('Cut ripe bunches every 7 to 10 days and deliver them to the mill within 48 hours; more than three quarters of the crop comes from December to May.', 'Couper les régimes mûrs tous les 7 à 10 jours et les livrer à l’huilerie sous 48 heures ; plus des trois quarts de la récolte arrivent de décembre à mai.'),
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed in June 2025: village plantations paid about 80,000 FCFA a tonne of bunches, down from 105,000 FCFA.', 'Observé en juin 2025 : environ 80 000 FCFA la tonne de régimes payés aux plantations villageoises, contre 105 000 FCFA auparavant.'), 'src': src('OP3')},
        'products': {'fresh': {'label': L('Fresh fruit bunches', 'Régimes frais'), 'ratio': 1, 'unit': 'tonne', 'unit_kg': 1000, 'unit_label': L('tonne', 'tonne')}},
        'harvest_src': src('OP1'),
        'disease_note': L('Rodents damage young palms: protect them with mesh guards. Bunches must reach the mill within 48 hours (OP1).', 'Les rongeurs abîment les jeunes palmiers : les protéger par des manchons grillagés. Les régimes doivent arriver à l’huilerie sous 48 heures (OP1).'),
        'steps': steps, 'recurring': recurring, 'src': src('OP1', 'OP2', 'OP3', 'M1'),
        'basis': {
            'plants_per_ha': '143 palms per ha in 9 m equilateral triangles (OP1).',
            'kc': 'FAO-56 oil palm: Kc 0.95, 1.0, 1.0 (M1), used through the year.',
            'cycle': 'Production starts about 3 years after planting; bunches 4, 6, 8, then 13 t/ha (OP1), so yield shares 31, 46, 62 and 100% from year 4. Profitability in year 8 in the MINADER budget (OP1).',
            'yield_t_ha': 'Fresh fruit bunches. Average 13 t/ha (OP1); poor 4 = smallholders under 1 t of oil per ha (OP2) at 25% oil in the bunch (OP1); good 16 = four times that oil yield, as for smallholders in Indonesia and Malaysia (OP2), derived.',
            'labour': 'MINADER amounts at 2,500 FCFA a person day (OP1): holes 200 and planting 300 FCFA a palm, circle weeding 100 FCFA twice a year, pruning 100 FCFA, weeding 40,000 and fertilizing 25,000 FCFA a year; harvest 50,000 FCFA for 13 t, so 650 kg a day.',
        },
        'confidence': [
            {'block': L('Technical itinerary', 'Itinéraire technique'), 'level': 'high', 'note': L('Official MINADER technical and economic sheet (2024).', 'Fiche technico économique officielle du MINADER (2024).')},
            {'block': L('Yields', 'Rendements'), 'level': 'medium', 'note': L('MINADER yield curve; poor and good levels are derived.', 'Courbe de rendement du MINADER ; les niveaux faible et bon sont calculés.')},
            {'block': L('Prices at harvest', 'Prix à la récolte'), 'level': 'medium', 'note': L('Price paid to village plantations in 2025; you enter your price per tonne.', 'Prix payé aux plantations villageoises en 2025 ; vous saisissez votre prix à la tonne.')},
            {'block': L('Climate and water', 'Climat et eau'), 'level': 'medium', 'note': L('Modelled Foumbot climatology 1991 to 2021 with FAO-56 methods; oil palm grows mainly in the Littoral, South West and Centre.', 'Climatologie modélisée de Foumbot 1991 à 2021 et méthodes FAO-56 ; le palmier se cultive surtout au Littoral, au Sud Ouest et au Centre.')},
        ],
    }


def cucurbit_protection(field_days):
    # Only full spray calendar found for cucumber: 13 insecticide sprays and 1 preventive mancozeb spray (CU3).
    return [('insecticide_l', 1, 13, src('T2')), ('mancozeb', 2.5, 1, src('T2'))], PROXY_LAB['spray'] * 14


def cucumber():
    field_days = 50 + 45
    prot, prot_lab = cucurbit_protection(field_days)
    steps = [
        step('clear', 'prep', 'field', (-45, -21), 'Clearing, without burning', 'Défrichage, sans brûlis',
             'Slash by hand. Cucurbits are often sown after burning fallow in Cameroon; burning wastes organic matter and is not recommended.',
             'Défricher à la main. Au Cameroun, les cucurbitacées sont souvent semées après brûlis de jachère ; le brûlis gaspille la matière organique et n’est pas recommandé.',
             labour=PROXY_LAB['clear'], sources=src('CU30', 'T1')),
        step('plough', 'prep', 'field', (-21, -3), 'Tillage and beds', 'Labour et planches',
             'Till to about 30 cm, level and form beds or ridges.', 'Labourer à environ 30 cm, niveler et former planches ou billons.',
             labour=16, sources=src('CU1', 'CU3', 'CU24')),
        step('basal', 'planting', 'field', (-7, 0), 'Basal manure', 'Fumure de fond',
             'Well decomposed poultry manure or compost, 800 g per planting hole, about 20 t per ha.',
             'Fiente bien décomposée ou compost, 800 g par trou de plantation, soit environ 20 t par ha.',
             inputs=[('farmyard_manure', 20000, 1, src('CU1'))], labour=8, sources=src('CU1', 'CU2', 'CU24')),
        step('sow', 'planting', 'field', (0, 0), 'Sowing', 'Semis',
             'Two seeds per hole about 2 cm deep in twin rows 100 × 50 × 50 cm (about 26,700 plants per ha), then thin to one plant.',
             'Deux graines par poquet à environ 2 cm de profondeur en doubles rangs 100 × 50 × 50 cm (environ 26 700 plants par ha), puis démarier à un plant.',
             inputs=[('seed_cucumber', 2, 1, src('CU2', 'CU24'))], labour=4, sources=src('CU1', 'CU4', 'CU9', 'CU24')),
        step('water', 'care', 'field', (0, field_days), 'Watering', 'Arrosage',
             'Regular watering, about 50 mm a week from flowering; no overhead watering at flowering, which drops the flowers.',
             'Arrosage régulier, environ 50 mm par semaine dès la floraison ; pas d’aspersion à la floraison, qui fait tomber les fleurs.',
             sources=src('CU1', 'CU7')),
        step('top1', 'care', 'field', (14, 14), 'First top dressing', 'Première fumure d’entretien',
             'NPK 15-15-15, 4 g per hole, two weeks after sowing.', 'NPK 15-15-15, 4 g par poquet, deux semaines après le semis.',
             inputs=[('npk_15_15_15', 100, 1, src('CU1'))], labour=PROXY_LAB['fert'], sources=src('CU1', 'T1')),
        step('trellis', 'care', 'field', (14, 30), 'Trellising and training', 'Palissage et conduite',
             'Posts 1.6 to 1.8 m high every 4 to 5 m with wires and twine, set before the vines run; train the vines up.',
             'Poteaux de 1,6 à 1,8 m tous les 4 à 5 m avec fils et ficelle, posés avant que les tiges ne courent ; guider les tiges vers le haut.',
             inputs=[('trellis_set', 1, 1, src('CU24', 'CU7'))], labour=40, sources=src('CU7', 'CU24')),
        step('organic2', 'care', 'field', (28, 28), 'Organic top up', 'Complément organique',
             'A second 400 g of decomposed manure per hole at four weeks.', 'Un second apport de 400 g de fumier décomposé par poquet à quatre semaines.',
             inputs=[('farmyard_manure', 10700, 1, src('CU1'))], sources=src('CU1')),
        step('top2', 'care', 'field', (42, 42), 'Fruiting dressing', 'Fumure de fructification',
             'At six weeks, a mix of urea (25%) and potassium sulphate (75%), 4 g per hole.', 'À six semaines, un mélange d’urée (25 %) et de sulfate de potassium (75 %), 4 g par poquet.',
             inputs=[('urea', 27, 1, src('CU1')), ('k2so4', 80, 1, src('CU1'))], sources=src('CU1')),
        step('weed', 'care', 'field', (14, 60), 'Weeding', 'Sarclage',
             'Hoe every two weeks until flowering, then hand weed; clean plots also carry fewer fruit flies.',
             'Biner toutes les deux semaines jusqu’à la floraison, puis désherber à la main ; une parcelle propre attire aussi moins de mouches des fruits.',
             labour=12, sources=src('CU4', 'CU6', 'CU24')),
        step('pollinate', 'care', 'field', (30, 90), 'Pollination', 'Pollinisation',
             'Cucumber needs bees: in a Ngaoundéré trial, flowers kept away from insects set no fruit. Place 2 to 3 hives per ha and avoid insecticides when bees forage.',
             'Le concombre a besoin des abeilles : dans un essai à Ngaoundéré, les fleurs isolées des insectes n’ont donné aucun fruit. Placer 2 à 3 ruches par ha et éviter les insecticides quand les abeilles butinent.',
             sources=src('CU4', 'CU7')),
        step('protect', 'protection', 'field', (4, field_days), 'Crop protection', 'Protection de la culture',
             'Fruit flies destroy about 37% of cucurbit fruits at Koutaba, next to Foumbot: trap, bag or treat early and remove stung fruits. The plan follows the only full cucumber spray calendar found, from a tunnel trial in Mayotte (13 insecticide sprays and one preventive mancozeb), at the tomato rates as proxies.',
             'Les mouches des fruits détruisent environ 37 % des fruits de cucurbitacées à Koutaba, à côté de Foumbot : piéger, ensacher ou traiter tôt et retirer les fruits piqués. Le plan suit le seul calendrier complet trouvé pour le concombre, issu d’un essai sous tunnel à Mayotte (13 insecticides et un mancozèbe préventif), aux doses de la tomate comme substitut.',
             inputs=prot, labour=prot_lab, sources=src('CU3', 'CU5', 'CU1', 'T2')),
        step('harvest', 'harvest', 'harvest', (0, 45), 'Harvest', 'Récolte',
             'Harvest at 15 to 25 cm, two or three times a week, before the seeds harden.', 'Récolter à 15 à 25 cm, deux ou trois fois par semaine, avant que les graines ne durcissent.',
             sources=src('CU7', 'CU3', 'CU8')),
        step('sell', 'harvest', 'harvest', (0, 45), 'Packing and sale', 'Conditionnement et vente',
             'About 5 days of shelf life in the open: sell quickly. In Yaoundé cucumbers sell by net bag or by piece. In Cameroonian French, “concombre” often means the seed cucurbit (ngon); be precise with buyers.',
             'Environ 5 jours de conservation à l’air libre : vendre vite. À Yaoundé, le concombre se vend au filet ou à la pièce. En français du Cameroun, « concombre » désigne souvent la cucurbitacée à graines (ngon) ; être précis avec les acheteurs.',
             labour=2, sources=src('CU2', 'CU11', 'CU27')),
    ]
    return {
        'name': L('Cucumber', 'Concombre'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'),
        'plants_per_ha': 26667, 'ky': 1.1, 'heat_c': 30, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 1000, 'agronomist_visits': 1,
        'kc': {'ini': 0.6, 'mid': 1.0, 'end': 0.75, 'stages': kc_stages([20, 30, 40, 15])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 50, 'harvest_days': 45, 'flowering_before_harvest_days': 12},
        'yield_t_ha': {'wet': yields(5.4, 15.0), 'dry': yields(5.4, 15.0)},
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed: Yaoundé retail about 119 to 192 FCFA/kg (2021, derived per fruit); Abidjan 350 to 600 FCFA/kg (2024 to 2026, level not stated).', 'Observé : Yaoundé au détail environ 119 à 192 FCFA/kg (2021, calculé par fruit) ; Abidjan 350 à 600 FCFA/kg (2024 à 2026, niveau non précisé).'),
                  'src': src('CU11', 'CU31', 'CU38')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('CU24'),
        'disease_note': L('Downy and powdery mildew rise with humidity; fruit flies are worse in the rainy season (CU3, CU6).', 'Le mildiou et l’oïdium augmentent avec l’humidité ; les mouches des fruits sont plus nombreuses en saison des pluies (CU3, CU6).'),
        'steps': steps, 'src': src('CU1', 'CU2', 'CU3', 'CU4', 'CU5', 'M1', 'M6'),
        'basis': {
            'plants_per_ha': 'Twin rows 100 × 50 × 50 cm, 26,666 plants per ha (CU1).',
            'ky': 'No FAO value for cucumber; watermelon value 1.1 used as a cucurbit proxy (M6).',
            'heat_c': 'Optimum about 30 °C (CU2); no field heat threshold found, the optimum is used as the limit.',
            'kc': 'FAO-56 cucumber: Kc 0.6, 1.0, 0.75; stage lengths 20/30/40/15 days (M1).',
            'cycle': 'First harvest 40 to 60 days after sowing (CU2), 50 used; harvest 45 to 98 days, 45 used; first flowers 30 to 45 days after sowing (CU2, CU4).',
            'yield_t_ha': 'Poor 5.4 = Nigerian smallholders (CU15); good 15 = best NIHORT treatments (CU16); average the midpoint. No irrigated open field reference: same values in both seasons.',
            'harvest_kg_per_person_day': 'Derived: 10 person days of harvest per ha for 10 to 15 t/ha (CU24), lower value. Low confidence: the research note judges 10 days low for a harvest of several weeks.',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': REGIONAL_CONF(L('Benin sheet, PROTA and a CIRAD trial; one Cameroon pollination trial.', 'Fiche du Bénin, PROTA et un essai du CIRAD ; un essai de pollinisation au Cameroun.'),
                                    L('Nigerian surveys and trials; no Cameroon yield measurement.', 'Enquêtes et essais au Nigeria ; pas de mesure de rendement au Cameroun.'),
                                    L('One old Yaoundé observation and Abidjan series; you enter your own price.', 'Une ancienne observation à Yaoundé et des séries d’Abidjan ; vous saisissez votre prix.')) + [CUCURBIT_LABOUR],
    }


def zucchini():
    field_days = 58 + 30
    prot, prot_lab = cucurbit_protection(field_days)
    steps = [
        step('clear', 'prep', 'field', (-60, -30), 'Clearing, without burning', 'Défrichage, sans brûlis',
             'Prepare the land 1 to 2 months ahead. Cucurbits often follow burnt fallow in Cameroon; burning is not recommended.',
             'Préparer le terrain 1 à 2 mois à l’avance. Au Cameroun, les cucurbitacées suivent souvent un brûlis de jachère ; le brûlis n’est pas recommandé.',
             labour=PROXY_LAB['clear'], sources=src('Z5', 'Z12', 'T1')),
        step('plough', 'prep', 'field', (-30, -3), 'Tillage and raised beds', 'Labour et planches surélevées',
             'Raised beds about 25 cm high, well drained: more than 40 mm of rain in a day waterlogs the plants and splits the stems.',
             'Planches surélevées d’environ 25 cm, bien drainées : plus de 40 mm de pluie en un jour engorge les plants et fend les tiges.',
             labour=16, sources=src('Z3', 'Z1', 'CU24')),
        step('basal', 'planting', 'field', (-7, 0), 'Basal manure and DAP', 'Fumure de fond et DAP',
             'Organic matter 50 to 70 t per ha in the holes or furrows, plus DAP before sowing.', 'Matière organique 50 à 70 t par ha dans les trous ou sillons, plus du DAP avant le semis.',
             inputs=[('farmyard_manure', 50000, 1, src('Z1')), ('dap', 124, 1, src('Z2', 'Z4'))], labour=PROXY_LAB['manure'], sources=src('Z1', 'Z2', 'Z4', 'T2')),
        step('sow', 'planting', 'field', (0, 0), 'Sowing', 'Semis',
             'Two or three seeds per hill, 1.5 to 2.5 cm deep, at 60 to 100 × 60 cm; thin to one plant. F1 hybrids yield 50 to 100% more than open pollinated seed. The seed quantity is uncertain: 2.25 kg per ha is a transplant rate from a temperate guide, and direct sowing needs several times more.',
             'Deux ou trois graines par poquet, à 1,5 à 2,5 cm de profondeur, à 60 à 100 × 60 cm ; démarier à un plant. Les hybrides F1 rendent 50 à 100 % de plus que les variétés fixées. La quantité de semence est incertaine : 2,25 kg par ha est une dose pour plants repiqués tirée d’un guide de climat tempéré, et le semis direct en demande plusieurs fois plus.',
             inputs=[('seed_zucchini', 2.25, 1, src('Z26'))], labour=4, sources=src('Z1', 'Z2', 'Z4', 'Z26', 'CU24')),
        step('water', 'care', 'field', (0, field_days), 'Watering', 'Arrosage',
             'About 25 mm a week, more at flowering and fruiting; keep the soil moist but never waterlogged.', 'Environ 25 mm par semaine, davantage à la floraison et à la fructification ; sol frais mais jamais engorgé.',
             sources=src('Z1', 'Z2')),
        step('top', 'care', 'field', (21, 30), 'Top dressing', 'Fumure d’entretien',
             'Calcium ammonium nitrate 3 to 4 weeks after sowing, about 15 cm from the plant.', 'Ammonitrate calcique 3 à 4 semaines après le semis, à environ 15 cm du plant.',
             inputs=[('can', 185, 1, src('Z2'))], labour=PROXY_LAB['fert'], sources=src('Z2', 'Z1', 'T1')),
        step('weed', 'care', 'field', (14, 50), 'Weeding', 'Sarclage',
             'Keep the plot clean until the leaves cover the ground; weeds also shelter fruit flies.', 'Garder la parcelle propre jusqu’à la couverture du sol ; les adventices abritent aussi les mouches des fruits.',
             labour=12, sources=src('Z6', 'CU4', 'CU24')),
        step('pollinate', 'care', 'field', (35, 88), 'Pollination', 'Pollinisation',
             'Bees and wasps pollinate the flowers; hives during flowering often raise the yield.', 'Abeilles et guêpes pollinisent les fleurs ; des ruches pendant la floraison augmentent souvent le rendement.',
             sources=src('Z1')),
        step('protect', 'protection', 'field', (0, field_days), 'Crop protection', 'Protection de la culture',
             'Powdery mildew is the main leaf disease; fruit flies, aphids and whiteflies follow, and mites above 30 °C. No courgette spray count was found: the plan uses the cucumber calendar as a cucurbit proxy.',
             'L’oïdium est la principale maladie des feuilles ; viennent ensuite les mouches des fruits, les pucerons et les aleurodes, et les acariens au dessus de 30 °C. Aucun nombre de traitements n’a été trouvé pour la courgette : le plan reprend le calendrier du concombre comme substitut.',
             inputs=prot, labour=prot_lab, sources=src('Z1', 'Z2', 'CU3', 'T2')),
        step('harvest', 'harvest', 'harvest', (0, 30), 'Harvest', 'Récolte',
             'Cut the fruits at 10 to 25 cm, daily or three times a week: they grow very fast.', 'Couper les fruits à 10 à 25 cm, chaque jour ou trois fois par semaine : ils grossissent très vite.',
             sources=src('Z1', 'Z2', 'Z3')),
        step('sell', 'harvest', 'harvest', (0, 30), 'Packing and sale', 'Conditionnement et vente',
             'Immature fruits keep only 5 to 6 days at 25 to 35 °C: plan buyers before harvest.', 'Les fruits jeunes ne se gardent que 5 à 6 jours à 25 à 35 °C : trouver les acheteurs avant la récolte.',
             labour=2, sources=src('Z1')),
    ]
    return {
        'name': L('Zucchini', 'Courgette'), 'release': 'regional', 'badge': L('Regional references', 'Références régionales'),
        'plants_per_ha': 22222, 'ky': 1.1, 'heat_c': 30, 'loss_pct': LOCAL_LOSS, 'harvest_kg_per_person_day': 1000, 'agronomist_visits': 1,
        'kc': {'ini': 0.5, 'mid': 0.95, 'end': 0.75, 'stages': kc_stages([25, 35, 25, 15])},
        'cycle': {'nursery_days': 0, 'to_first_harvest_days': 58, 'harvest_days': 30, 'flowering_before_harvest_days': 13},
        'yield_t_ha': {'wet': yields(4.9, 20.0), 'dry': yields(4.9, 20.0)},
        'price': {'reference_xaf_kg': None, 'index': [1] * 12, 'note': NO_PRICE,
                  'observed': L('Observed: Abidjan 350 to 500 FCFA/kg (2024 to 2026, level not stated).', 'Observé : Abidjan 350 à 500 FCFA/kg (2024 à 2026, niveau non précisé).'), 'src': src('Z14', 'Z16', 'Z17', 'Z21')},
        'packaging': {'item': 'crate', 'kg_per_unit': 20, 'uses': 1},
        'harvest_src': src('CU24'),
        'disease_note': L('Heavy rain splits stems and favours mildew; production does best at the start of the dry season (Z1, Z3).', 'Les fortes pluies fendent les tiges et favorisent le mildiou ; la production réussit mieux au début de la saison sèche (Z1, Z3).'),
        'steps': steps, 'src': src('Z1', 'Z2', 'Z5', 'M1', 'M6'),
        'basis': {
            'plants_per_ha': 'Derived: 60 to 100 cm × 60 cm gives 16,667 to 27,778 plants per ha (Z2, Z4), midpoint.',
            'ky': 'No FAO value for zucchini; watermelon value 1.1 used as a cucurbit proxy (M6).',
            'heat_c': 'Spider mites invade above 30 °C (Z1); not a physiological limit.',
            'kc': 'FAO-56 squash and zucchini: Kc 0.5, 0.95, 0.75; stage lengths 25/35/25/15 days (M1).',
            'cycle': 'First harvest 55 to 60 days (Z1), 58 used; harvest 30 to 40 days (Z1), 30 used; first flowers 35 to 55 days after sowing (Z1, Z5).',
            'yield_t_ha': 'Poor 4.9 = Kenyan well managed farms, low value (Z5); good 20 = the average level PROTA gives for tropical Africa (Z1), used here as the good outcome; average the midpoint. No irrigated reference: same values in both seasons.',
            'harvest_kg_per_person_day': 'Cucumber value used as a proxy (CU24); low confidence.',
            'loss_pct': 'No measured loss found; the tomato value for a local sale is used as a proxy (T5, T6).',
        },
        'confidence': REGIONAL_CONF(L('PROTA and Kenyan guides; no Cameroon itinerary found.', 'PROTA et guides du Kenya ; pas d’itinéraire camerounais trouvé.'),
                                    L('PROTA level and Kenyan farm values only.', 'Niveau PROTA et valeurs d’exploitations du Kenya seulement.'),
                                    L('No Cameroon price; you enter your own.', 'Pas de prix au Cameroun ; vous saisissez le vôtre.')) + [CUCURBIT_LABOUR],
    }


# ---------------------------------------------------------------- production under cover and field machinery
def _local(pre):
    """Turns the S ids of one research file into published ids; ids of other files (CU3) are kept."""
    def ids(lst):
        return src(*[(pre + i[1:]) if re.match(r'^S\d+$', i) else i for i in lst])

    def txt(s):
        return re.sub(r'\bS(\d+)\b', lambda m: pre + m.group(1), s or '')
    return ids, txt


def protected(R):
    """Greenhouse and net house: price per m2 by size, frame and cover lives, climate under the cover and the yields
    of the crops grown under it. Values without a source are flagged and listed in ASSUMPTIONS."""
    P = R['protected']
    ids, txt = _local('PR')
    G = P['structures']['greenhouse']
    N = P['structures']['net']
    tiers = [{'from_m2': t['from_m2'], 'xaf_m2': t['value']} for t in G['price_xaf_m2']]
    ratio = N['price_ratio_to_greenhouse']['value']

    def system(S, label, desc, frame, cover, tiers, water, extra_basis, build):
        return {
            'label': label, 'desc': desc, 'frame_label': frame, 'cover_label': cover, 'build_label': build[0], 'build_detail': build[1],
            'price_tiers': tiers, 'cover_share': S['cover_share']['value'],
            'frame_life_seasons': life(S['frame_life_years']['value']), 'cover_life_seasons': life(S['cover_life_years']['value']),
            'temp_delta_c': S['temp_delta_c']['value'], 'rain_factor': S['rain_on_crop'], 'disease_shift': S['disease_shift']['value'],
            'water': water, 'build_weeks': S['build_weeks']['value'], 'src': ids(S['source_ids']),
            'basis': ' '.join(txt(x) for x in [S['cover_share']['notes'], S['cover_life_years']['notes'], S['temp_delta_c']['notes'], S['disease_shift']['notes'], extra_basis]),
        }

    systems = {
        'net': system(N, L('Net house', 'Maison filet'),
                      L('Steel frame covered with insect net, no plastic: about 4°C warmer than outside and rain still reaches the crop.', 'Armature en acier couverte de filet anti insectes, sans plastique : environ 4 °C de plus qu’à l’extérieur et la pluie atteint toujours la culture.'),
                      L('Net house frame, installed', 'Armature de la maison filet, posée'), L('Insect net cover', 'Couverture en filet anti insectes'),
                      [{'from_m2': t['from_m2'], 'xaf_m2': round(t['xaf_m2'] * ratio, -1)} for t in tiers], None, txt(N['price_ratio_to_greenhouse']['notes']),
                      (L('Build the net house', 'Construire la maison filet'), L('The builder sets the frame, stretches the insect net over the roof and the walls and fits a double door; the beds are then formed inside.', 'Le constructeur monte l’armature, tend le filet anti insectes sur le toit et les murs et pose une double porte ; les planches sont ensuite formées à l’intérieur.'))),
        'greenhouse': system(G, L('Greenhouse', 'Serre'),
                             L('Plastic roof with insect net walls and vents: the crop is kept dry and watered by drip, and the air is warmer inside.', 'Toit en plastique avec murs et aérations en filet anti insectes : la culture reste au sec, elle est arrosée au goutte à goutte et l’air est plus chaud à l’intérieur.'),
                             L('Greenhouse frame, installed', 'Armature de la serre, posée'), L('Greenhouse film, UV treated', 'Film de serre traité contre les UV'),
                             tiers, 'drip', txt(G['price_xaf_m2'][0]['notes'] + ' ' + G['price_xaf_m2'][1]['notes'] + ' ' + G['price_check']),
                             (L('Build the greenhouse', 'Construire la serre'), L('The builder sets the steel arches, the UV treated film, the insect net walls and vents and a double door; the drip lines and the beds are then laid inside.', 'Le constructeur monte les arceaux en acier, le film traité contre les UV, les murs et aérations en filet anti insectes et une double porte ; les lignes de goutte à goutte et les planches sont ensuite installées à l’intérieur.'))),
    }
    notes = {
        ('tomato', 'greenhouse'): L('Kenyan greenhouse survey (mean 10.5 kg per m²) and the Anna F1 guide: about 75 days to the first harvest, then 8 months of picking.', 'Enquête kenyane sous serre (moyenne 10,5 kg par m²) et guide de la variété Anna F1 : environ 75 jours jusqu’à la première récolte, puis 8 mois de cueillette.'),
        ('tomato', 'net'): L('Two year trial in Tanzania under fine insect net, with field varieties and the open field calendar.', 'Essai de deux ans en Tanzanie sous filet fin anti insectes, avec des variétés de plein champ et le calendrier du plein champ.'),
        ('greenbean', 'greenhouse'): L('Moroccan greenhouses with climbing varieties: 20 to 30 t/ha per crop, picked over about three months.', 'Serres marocaines avec des variétés à rames : 20 à 30 t/ha par culture, cueillies pendant environ trois mois.'),
        ('pepper', 'greenhouse'): L('National average of Capsicum under unheated greenhouses in Tunisia, about 6.6 kg per m², with five months of picking as for greenhouse hybrids in Kenya.', 'Moyenne nationale des Capsicum sous serre froide en Tunisie, environ 6,6 kg par m², avec cinq mois de cueillette comme pour les hybrides sous serre au Kenya.'),
        ('chili', 'greenhouse'): L('National average of Capsicum under unheated greenhouses in Tunisia, mostly hot pepper, about 6.6 kg per m² over five months of picking.', 'Moyenne nationale des Capsicum sous serre froide en Tunisie, surtout du piment, environ 6,6 kg par m² sur cinq mois de cueillette.'),
        ('cucumber', 'greenhouse'): L('Tunnel trial in Mayotte with drip irrigation, checked against plastic tunnels in Egypt; its calendar is close to the open field one.', 'Essai sous tunnel à Mayotte avec goutte à goutte, recoupé avec des tunnels plastiques en Égypte ; son calendrier est proche de celui du plein champ.'),
        ('zucchini', 'greenhouse'): L('No African reference found: official survey of Almeria greenhouses in Spain, 7.5 kg per m² in a cycle of about four months.', 'Aucune référence africaine trouvée : enquête officielle sur les serres d’Almería en Espagne, 7,5 kg par m² sur un cycle d’environ quatre mois.'),
    }
    crops = {}
    for crop, by in P['crops'].items():
        for sysk, d in by.items():
            y = d['yield_kg_m2']
            e = {'yield_t_ha': {k: round(y[k] * 10, 2) for k in ('poor', 'average', 'good')}, 'src': ids(d['source_ids']), 'note': notes[(crop, sysk)],
                 'basis': txt(d['yield_notes'] + ' ' + d.get('cycle_notes', ''))}
            if d.get('cycle'):
                e['cycle'] = d['cycle']
            if d.get('continuous_flowering'):
                e['continuous_flowering'] = True
            crops.setdefault(crop, {})[sysk] = e
    return {
        'module_m2': P['module']['m2'], 'module_src': ids(P['module']['source_ids']), 'module_basis': txt(P['module']['notes']),
        'systems': systems, 'crops': crops,
        # Upkeep of every structure, and what changes when the structure is already built or needs repairs.
        'upkeep': {'xaf_m2_day': P['upkeep']['xaf_m2_day'], 'label': L('Upkeep and small repairs of the structure', 'Entretien et petites réparations de la structure'), 'src': ids(P['upkeep']['source_ids']), 'basis': txt(P['upkeep']['notes'])},
        'status': {
            'repair_weeks': P['status']['repair_weeks']['value'],
            'repairs_label': L('Repairs to the structure (your quote)', 'Réparations de la structure (votre devis)'),
            'cover_label': {'greenhouse': L('New greenhouse film, UV treated', 'Nouveau film de serre traité contre les UV'), 'net': L('New insect net cover', 'Nouvelle couverture en filet anti insectes')},
            'repair_step': L('Repair the structure', 'Réparer la structure'),
            'repair_detail': L('Replace what is worn before planting: the cover, the doors, the gutters and the net of the vents; check that the arches are sound and tight.', 'Remplacer ce qui est usé avant la plantation : la couverture, les portes, les gouttières et le filet des aérations ; vérifier que les arceaux sont sains et bien tendus.'),
            'basis': txt(P['status']['notes'] + ' ' + P['status']['repairs_life']['notes'] + ' ' + P['status']['repair_weeks']['notes']),
        },
        'confidence': {'block': L('Production under cover', 'Production sous abri'), 'level': 'low',
                       'note': L('Structure prices from Côte d’Ivoire and Kenya; yields from Kenya, Tanzania, Ghana, Mayotte, Morocco and Tunisia, and from Spain for zucchini; no Cameroon reference yet. Get a builder’s quote before committing.',
                                 'Prix des structures en Côte d’Ivoire et au Kenya ; rendements au Kenya, en Tanzanie, au Ghana, à Mayotte, au Maroc et en Tunisie, et en Espagne pour la courgette ; pas encore de référence camerounaise. Demander un devis à un constructeur avant de s’engager.')},
    }


def machinery(R):
    """Hired machines for land preparation: price per hectare of each operation, the operations each preparation step
    needs, the hand work left and the rule that suggests machines."""
    M = R['machinery']
    ids, txt = _local('MA')
    ops = {k: {'label': L(o['label_en'], o['label_fr']), 'price': o['price_xaf_ha'], 'range': o['range_xaf_ha'], 'unit': 'ha', 'src': ids(o['source_ids']), 'basis': txt(o['notes'])}
           for k, o in M['operations'].items()}
    steps = {crop: {sid: dict({'ops': v['ops']}, **({'hand_share': v['hand_share']} if 'hand_share' in v else {})) for sid, v in by.items()} for crop, by in M['steps'].items()}
    return {
        'ops': ops, 'steps': steps,
        'hand_share': M['hand_share']['value'], 'workers_per_day_max': M['workers_per_day_max']['value'],
        'src': ids(['S1', 'S2', 'S6', 'S7']),
        'basis': txt(M['price_check'] + ' ' + M['public_provider'] + ' ' + M['hand_share']['notes'] + ' ' + M['workers_per_day_max']['notes']),
        'confidence': {'block': L('Machine hire', 'Location de machines'), 'level': 'low',
                       'note': L('Midpoints of the ranges of one Cameroonian tomato budget (June 2026), checked against a Yaoundé provider; no tariff is published by CENEEMA. Enter your own quote.',
                                 'Points milieux des fourchettes d’un budget de la tomate au Cameroun (juin 2026), recoupés avec un prestataire de Yaoundé ; le CENEEMA ne publie pas de tarif. Saisissez votre propre devis.')},
    }


# ---------------------------------------------------------------- climate, scenarios, assumptions
def climate(R):
    c = R['tomato']['climate']['foumbot_climate']
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
        'site': L('Foumbot, Noun, West Cameroon', 'Foumbot, Noun, Ouest Cameroun'), 'lat': 5.5,
        'months': [{'tmax': c['monthly_max_temp_c'][m], 'tmin': c['monthly_min_temp_c'][m], 'rain': c['monthly_rain_mm'][m]} for m in months],
        'src': src('T21'),
        'basis': 'Modelled climatology 1991 to 2021, annual rain about 1,680 mm (T21).',
    }


def price_spread(R):
    """Typical spread of the price within a market and a month: median of half range over mid range across
    the dated tomato crate observations that give a range for one market and one period."""
    excl = {'T23', 'T27', 'T31', 'T32', 'T36', 'T37'}  # changes over weeks or months, crisis prices, export prices
    vals = []
    for o in R['tomato']['prices']['observations']:
        c = o.get('price_xaf_per_crate')
        ids = {'T' + re.sub(r'^[A-Z]+', '', i) for i in o.get('source_ids', [])}
        if not c or c[0] == c[1] or ids & excl:
            continue
        vals.append((c[1] - c[0]) / (c[1] + c[0]))
    return round(statistics.median(vals), 2), len(vals)


UNITS = {
    'kg': L('kg', 'kg'), 'g': L('g', 'g'), 'l': L('L', 'L'), 'unit': L('units', 'unités'), 'person day': L('person days', 'jours de travail'),
    'ha': L('ha', 'ha'), 'm2': L('m²', 'm²'), 'stake': L('stakes', 'tuteurs'), 'roll': L('rolls', 'rouleaux'), 'pack': L('packs', 'conditionnements'),
    'set': L('sets', 'lots'), 'season': L('season', 'saison'), 'ha season': L('ha × season', 'ha × saison'), 'ha year': L('ha × year', 'ha × an'), 'year': L('year', 'an'), 'fruit': L('fruits', 'fruits'), 'tonne': L('tonnes', 'tonnes'), 'm3': L('m³', 'm³'),
}

ASSUMPTIONS = [
    L('Two growing seasons a year on the same plot, as in the MINADER budget: equipment lifespans in years are doubled into seasons.', 'Deux saisons de culture par an sur la même parcelle, comme dans le budget du MINADER : la durée de vie du matériel en années est doublée en saisons.'),
    L('A crop is treated as a rainy season crop when rain covers at least half of its water need, otherwise as a dry season crop with the irrigated yield references.', 'Une culture est traitée comme culture de saison des pluies quand la pluie couvre au moins la moitié de ses besoins en eau, sinon comme culture de saison sèche avec les références de rendement irriguées.'),
    L('Poor and good yields are the bounds of the published range for the season and the average is its midpoint; where a crop departs from this rule (a national or Cameroon average, a regional reference), its notes say so.', 'Les rendements faible et bon sont les bornes de la fourchette publiée pour la saison et la moyenne en est le point milieu ; quand une culture s’écarte de cette règle (moyenne nationale ou camerounaise, référence régionale), ses notes le précisent.'),
    L('In the failure outcome, 10% of the average yield is sold. Outcome weights (20%, 45%, 25%, 10%) are indicative and shift toward poor outcomes by 3 points per risk level.', 'En cas d’échec, 10 % du rendement moyen est vendu. Les poids des issues (20 %, 45 %, 25 %, 10 %) sont indicatifs et glissent vers les mauvaises issues de 3 points par niveau de risque.'),
    L('Disease pressure is high when a month from flowering to the end of harvest receives 200 mm of rain or more, medium from 100 mm, matching the months of worst late blight reported in the West.', 'La pression des maladies est forte quand un mois entre la floraison et la fin de la récolte reçoit 200 mm de pluie ou plus, moyenne à partir de 100 mm, ce qui correspond aux mois de mildiou les plus graves signalés à l’Ouest.'),
    L('Watering cans and hoses are treated as surface application (FAO efficiency 60%); drip 90%. Manual watering moves about 6 m³ of water per person day and is capped at 0.25 ha; with a pump and basins, the MINADER norm of 25 person days per ha is used.', 'Arrosoirs et tuyaux sont traités comme une irrigation de surface (efficience FAO 60 %) ; goutte à goutte 90 %. L’arrosage manuel déplace environ 6 m³ d’eau par jour de travail et est limité à 0,25 ha ; avec motopompe et bassins, la norme MINADER de 25 jours de travail par ha est utilisée.'),
    L('Pump fuel uses the manufacturer flow and consumption at full flow, a floor: lift and long hoses raise real use.', 'Le carburant de la pompe suit le débit et la consommation constructeur à plein débit, un minimum : la hauteur d’aspiration et les longs tuyaux augmentent la consommation réelle.'),
    L('Where a crop source gives no labour figure, the MINADER tomato norms per hectare are used, or the Philippine cucumber guide for cucurbits; where it gives no spray rate, the tomato rates are used. Each case cites its source in the itinerary.', 'Quand une source ne donne pas de temps de travail, les normes MINADER de la tomate par hectare sont utilisées, ou le guide philippin du concombre pour les cucurbitacées ; sans dose de traitement, les doses de la tomate sont utilisées. Chaque cas cite sa source dans l’itinéraire.'),
    L('A harvest crate holds about 20 kg, the weight reported in one Dschang study; crate weights vary between markets. It sizes packaging, transport and harvest labour per kg.', 'Un cageot contient environ 20 kg, le poids relevé dans une étude à Dschang ; le poids varie selon les marchés. Il sert à calculer l’emballage, le transport et la main d’œuvre de récolte par kg.'),
    L('A 10% contingency reserve is added to every budget. A wheelbarrow is bought from 0.5 ha and a push cart from 1 ha.', 'Une réserve pour imprévus de 10 % est ajoutée à chaque budget. Une brouette est achetée à partir de 0,5 ha et un pousse pousse à partir de 1 ha.'),
    L('Lines without a sourced price (stakes, trellis, some seeds) stay in the plan with their quantity and a zero cost: get a local quote before committing.', 'Les lignes sans prix sourcé (tuteurs, palissage, certaines semences) restent dans le plan avec leur quantité et un coût nul : demander un devis local avant de s’engager.'),
    L('Long crops (cassava, plantain, avocado) are planned month by month over their horizon. The capital needed is the deepest cumulative deficit of the average outcome plus the 10% reserve; without a price, the costs up to the end of the first harvest.', 'Les cultures longues (manioc, plantain, avocat) sont planifiées mois par mois sur leur horizon. Le capital nécessaire est le déficit cumulé le plus profond de l’issue moyenne plus la réserve de 10 % ; sans prix, les coûts jusqu’à la fin de la première récolte.'),
    L('For long crops the failure outcome sells 10% of the average yield at the first harvest and poor yields afterwards. Equipment is bought again at the end of its life within the horizon; no resale value is counted.', 'Pour les cultures longues, l’issue d’échec vend 10 % du rendement moyen à la première récolte puis des rendements faibles. Le matériel est racheté en fin de vie pendant l’horizon ; aucune valeur de revente n’est comptée.'),
    L('Land rent for long crops counts two seasons a year. Processing costs per tonne of product follow the ratio of each product; the cassava stick uses the gari labour and firewood per tonne of roots.', 'La location de terre des cultures longues compte deux saisons par an. Les coûts de transformation par tonne de produit suivent le taux de chaque produit ; le bâton de manioc reprend le travail et le bois du gari par tonne de racines.'),
    L('Plantain: successive harvests on the same mat 300 days apart, three cycles. Avocado: yield shares by tree age 0, 0, 15, 35, 50, 75, 90 then 100%. Both are Djalumo Agro assumptions fitted to the sources named in each crop.', 'Plantain : récoltes successives sur la même souche à 300 jours d’intervalle, trois cycles. Avocat : part du rendement selon l’âge 0, 0, 15, 35, 50, 75, 90 puis 100 %. Ce sont deux hypothèses de Djalumo Agro calées sur les sources citées pour chaque culture.'),
    L('Exchange rates are fixed at mid October 2026 values (BCEAO for the CFA franc, 16 October; naira 13 October); they are not live.', 'Les taux de change sont fixés aux valeurs de mi octobre 2026 (BCEAO pour le franc CFA, 16 octobre ; naira 13 octobre) ; ils ne sont pas en temps réel.'),
    L('Plan length: a long crop or an orchard is analysed over the length the grower chooses (one to three plantain cycles; three, five or ten years for an orchard). Costs and sales outside that length are not counted.', 'Durée du plan : une culture longue ou un verger est analysé sur la durée choisie (un à trois cycles de plantain ; trois, cinq ou dix ans pour un verger). Les coûts et les ventes hors de cette durée ne sont pas comptés.'),
    L('Pineapple: the poor yield (half the Cameroon average), planting at 1,000 suckers a day, induction labour and harvest at 400 kg a day are Djalumo Agro assumptions; the fertilizer program and sucker price come from Benin.', 'Ananas : le rendement faible (moitié de la moyenne camerounaise), la plantation à 1 000 rejets par jour, le travail d’induction et la récolte à 400 kg par jour sont des hypothèses de Djalumo Agro ; le programme d’engrais et le prix des rejets viennent du Bénin.'),
    L('Cocoa: fungicide and insecticide doses, harvest and post harvest work at 15 kg of dry beans a day and monthly suckering are Djalumo Agro assumptions on the frequencies of Cameroon guides; the plantain grown as temporary shade is neither costed nor sold.', 'Cacao : les doses de fongicide et d’insecticide, la récolte et le post récolte à 15 kg de fèves sèches par jour et l’égourmandage mensuel sont des hypothèses de Djalumo Agro sur les fréquences des guides camerounais ; le plantain cultivé en ombrage temporaire n’est ni chiffré ni vendu.'),
    L('Oil palm: labour comes from the MINADER amounts at 2,500 FCFA a person day; bunches are sold to a mill by the tonne.', 'Palmier à huile : le travail vient des montants du MINADER à 2 500 FCFA la journée ; les régimes sont vendus à une huilerie à la tonne.'),
    L('Greenhouse and net house prices come from a builder in Côte d’Ivoire, in the same currency zone, until Cameroonian quotes are collected: 15,000 FCFA per m² below 1,000 m² and 13,000 from 1,000 m². A net house costs 84% of a greenhouse, the ratio of the Indian official cost norms. The frame is assumed to last 10 years and the cover 4; each plan is charged the share of their life it uses.', 'Les prix des serres et des maisons filet viennent d’un constructeur de Côte d’Ivoire, dans la même zone monétaire, en attendant des devis camerounais : 15 000 FCFA par m² en dessous de 1 000 m² et 13 000 à partir de 1 000 m². Une maison filet coûte 84 % d’une serre, le rapport des normes de coûts officielles indiennes. L’armature est supposée durer 10 ans et la couverture 4 ; chaque plan supporte la part de leur durée de vie qu’il utilise.'),
    L('Under a ventilated greenhouse the day is assumed 5°C warmer than outside, and 4°C under a net house as measured in Tanzania. No rain reaches the crop under a greenhouse, which is watered by drip, and rain driven disease pressure is lowered by one level. Structures are sized in whole modules of 240 m². A structure already built is not bought again: the plan counts its upkeep, about 0.26 FCFA per m² and per day after the Almería cost survey, and takes the drip system as installed unless told otherwise. Repairs are entered by the grower and, like a new cover, are charged over four years.', 'Sous une serre ventilée, la journée est supposée plus chaude de 5 °C qu’à l’extérieur, et de 4 °C sous une maison filet comme mesuré en Tanzanie. Aucune pluie n’atteint la culture sous serre, qui est arrosée au goutte à goutte, et la pression des maladies liées à la pluie baisse d’un niveau. Les structures sont dimensionnées en modules entiers de 240 m². Une structure déjà construite n’est pas achetée à nouveau : le plan compte son entretien, environ 0,26 FCFA par m² et par jour d’après l’enquête de coûts d’Almería, et considère le goutte à goutte comme installé sauf indication contraire. Les réparations sont saisies par le producteur et, comme une nouvelle couverture, imputées sur quatre ans.'),
    L('Yields under cover replace the season references. Greenhouse tomato is planned at 5, 10 and 15 kg per m² over eight months of harvest, a cautious range around the Kenyan survey mean of 10.5 kg; sweet pepper and chili at 3.3, 6.6 and 9.9 kg over five months, around the Tunisian national average; green bean from 2 to 3 kg and zucchini from 3.75 to 11.25 kg. Where a source gives only an average, poor and good are half and one and a half times it. Care, protection and watering are extended to the longer harvests. Tomato and peppers flower throughout the harvest under cover: their heat risk is high when more than a third of the flowering months reach their heat limit inside the greenhouse, and medium when at least one month comes within 2°C of it.', 'Les rendements sous abri remplacent les références de saison. La tomate sous serre est planifiée à 5, 10 et 15 kg par m² sur huit mois de récolte, une fourchette prudente autour de la moyenne de 10,5 kg de l’enquête kenyane ; le poivron et le piment à 3,3, 6,6 et 9,9 kg sur cinq mois, autour de la moyenne nationale tunisienne ; le haricot vert de 2 à 3 kg et la courgette de 3,75 à 11,25 kg. Quand une source ne donne qu’une moyenne, les issues faible et bonne valent la moitié et une fois et demie cette moyenne. L’entretien, la protection et l’arrosage sont prolongés sur les récoltes plus longues. La tomate et les piments fleurissent pendant toute la récolte sous abri : leur risque de chaleur est fort quand plus d’un tiers des mois de floraison atteignent leur limite de chaleur dans la serre, et moyen quand au moins un mois s’en approche à moins de 2 °C.'),
    L('Hired machine prices are the midpoints of the ranges of one Cameroonian tomato budget of June 2026 and carry low confidence: enter a local quote when you have one. A tenth of the hand work of a mechanised step remains (half for chili, whose planting holes are dug by hand). Machines are suggested when land preparation needs more than 15 workers on the same day.', 'Les prix de location de machines sont les points milieux des fourchettes d’un budget camerounais de la tomate de juin 2026 et restent peu fiables : saisissez un devis local dès que vous en avez un. Un dixième du travail manuel d’une étape mécanisée demeure (la moitié pour le piment, dont les trous de plantation sont creusés à la main). Les machines sont suggérées quand la préparation du terrain demande plus de 15 ouvriers le même jour.'),
]


def build():
    R = load_research()
    SOURCES.update(METHOD_SOURCES)
    spread, n = price_spread(R)
    kb = {
        'version': '3.2.0', 'built': '2026-10-25',
        'fx': FX, 'fx_src': src('C38', 'C43', 'C45', 'C46'),
        'limits': {'min_capital_usd': 100, 'reserve_rate': 0.10, 'wet_season_rain_share': 0.5, 'seasons_per_year': SEASONS_PER_YEAR},
        'climate': climate(R),
        'thresholds': {'disease_rain_mm_high': 200, 'disease_rain_mm_medium': 100},
        'market': {'city_extra_loss_pct': 5.0, 'src': src('T6')},
        'scenario': {'failure_yield_share': 0.10,
                     'price_factor': {'good': round(1 + spread, 2), 'average': 1, 'poor': round(1 - spread, 2), 'failure': round(1 - spread, 2)},
                     'basis': 'Price factors: median half range of %d dated crate price ranges within one market and one period is %.2f (T22 to T36, derived).' % (n, spread)},
        'scenario_weights': {'base': {'good': 0.20, 'average': 0.45, 'poor': 0.25, 'failure': 0.10}, 'shift_per_risk_point': 0.03},
        'items': build_items(),
        'services': build_services(),
        'water': build_water(),
        'tools_kit': TOOLS_KIT,
        'phases': PHASES,
        'units': UNITS,
        'crops': {'tomato': tomato(R), 'greenbean': greenbean(), 'pepper': pepper(), 'chili': chili(), 'cucumber': cucumber(), 'zucchini': zucchini(), 'cassava': cassava(), 'plantain': plantain(), 'pineapple': pineapple(), 'avocado': avocado(), 'cocoa': cocoa(), 'oil_palm': oil_palm()},
        'protected': protected(R),
        'machinery': machinery(R),
        'assumptions': ASSUMPTIONS,
    }
    # Merged sources: rewrite the ids quoted in free text so they match the published list.
    tok = re.compile(r'\b(?:AN|AV|CC|CU|CH|CA|OP|PL|PR|MA|T|Z|G|P|C|M)\d+\b')

    def realias(x):
        if isinstance(x, dict):
            return {k: realias(v) for k, v in x.items()}
        if isinstance(x, list):
            return [realias(v) for v in x]
        if isinstance(x, str):
            return tok.sub(lambda m: ALIAS.get(m.group(0), m.group(0)), x)
        return x
    kb = realias(kb)
    missing = sorted({m.group(0) for m in tok.finditer(json.dumps(kb, ensure_ascii=False))} - set(SOURCES))
    if missing:
        raise SystemExit('Source ids quoted but unknown: ' + ', '.join(missing))
    # Keep only the sources actually cited, so the published list stays readable.
    used = set()

    def walk(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in ('src', 'src_fuel', 'labour_src', 'maintenance_src', 'harvest_src', 'fx_src') and isinstance(v, list):
                    used.update(v)
                else:
                    walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(kb)
    # Ids quoted in free text, e.g. "(T7, T8)"
    for m in re.finditer(r'\b(?:AN|AV|CC|CU|CH|CA|OP|PL|PR|MA|T|Z|G|P|C|M)\d+\b', json.dumps(kb, ensure_ascii=False)):
        if m.group(0) in SOURCES:
            used.add(m.group(0))
    kb['sources'] = {k: SOURCES[k] for k in sorted(used, key=lambda s: (re.sub(r'\d', '', s), int(re.sub(r'\D', '', s))))}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False, indent=1)
    print('kb.json written:', len(kb['crops']), 'crops,', len(kb['items']), 'items,', len(kb['sources']), 'sources cited; price spread', spread, 'from', n, 'ranges')


if __name__ == '__main__':
    build()
