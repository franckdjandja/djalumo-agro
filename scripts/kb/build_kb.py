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
PREFIX = {'tomato': 'T', 'pepper': 'P', 'greenbean': 'G', 'cucumber': 'CU', 'zucchini': 'Z', 'costs': 'C'}
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
    kes = FX['XAF'] / FX['KES']  # XAF per Kenyan shilling, derived from the two USD rates
    item('seed_cucumber', 'Cucumber seed, open pollinated (Abidjan listing price)', 'Semence de concombre, variété fixée (prix d’annonce à Abidjan)', round(15500 / 50 * 1000), 'seed', 'kg', src('C63'), (0.05, '50 g pack', 'sachet de 50 g'),
         basis='No Cameroon price found. Marketer, 15,500 FCFA per 50 g, Abidjan listing 2026 (C63). A bulk Nairobi listing is cheaper (KES 1,000 per 100 g, CU46).')
    item('seed_zucchini', 'Zucchini seed (Kenya listing price)', 'Semence de courgette (prix d’annonce au Kenya)', round(900 / 100 * kes * 1000), 'seed', 'kg', src('Z24', 'C38', 'C43'), (0.1, '100 g pack', 'sachet de 100 g'),
         basis='No Cameroon price found. KES 900 per 100 g in Nairobi (Z24), converted at the October 2026 rates (C38, C43).')
    item('nursery_shade', 'Nursery shade structure', 'Ombrière de pépinière', 20000, 'nursery', 'unit', src('C3'))
    # Fertilizers and amendments
    item('npk_20_10_10', 'NPK 20-10-10', 'NPK 20-10-10', npk_kg, 'fertilizer', 'kg', src('C3'), (50, '50 kg bag', 'sac de 50 kg'),
         basis='26,000 XAF per 50 kg bag (C3, 2024). West region retail Q4 2022: 33,650 to 34,950 per bag (C1).')
    for key, f in [('npk_15_15_15', '15-15-15'), ('npk_11_22_16', '11-22-16'), ('npk_15_12_24', '15-12-24')]:
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
        'land_rent_season': {'label': L('Land rent for the season', 'Location du terrain pour la saison'), 'price': 50000, 'unit': 'ha', 'category': 'land', 'src': src('C3'),
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
NO_PRICE = L('No published farm gate price for Cameroon: enter the price you expect to get.', 'Aucun prix bord champ publié pour le Cameroun : saisissez le prix que vous comptez obtenir.')


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
    'set': L('sets', 'lots'), 'season': L('season', 'saison'), 'ha season': L('ha × season', 'ha × saison'), 'm3': L('m³', 'm³'),
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
    L('Exchange rates are fixed at mid October 2026 values (BCEAO for the CFA franc, 16 October; naira 13 October); they are not live.', 'Les taux de change sont fixés aux valeurs de mi octobre 2026 (BCEAO pour le franc CFA, 16 octobre ; naira 13 octobre) ; ils ne sont pas en temps réel.'),
]


def build():
    R = load_research()
    SOURCES.update(METHOD_SOURCES)
    spread, n = price_spread(R)
    kb = {
        'version': '2.0.0', 'built': '2026-10-18',
        'fx': FX, 'fx_src': src('C38', 'C43', 'C45', 'C46'),
        'limits': {'min_capital_usd': 100, 'reserve_rate': 0.10, 'wet_season_rain_share': 0.5},
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
        'crops': {'tomato': tomato(R), 'greenbean': greenbean(), 'pepper': pepper(), 'cucumber': cucumber(), 'zucchini': zucchini()},
        'assumptions': ASSUMPTIONS,
    }
    # Merged sources: rewrite the ids quoted in free text so they match the published list.
    tok = re.compile(r'\b(?:T|CU|Z|G|P|C|M)\d+\b')

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
    for m in re.finditer(r'\b(?:T|CU|Z|G|P|C|M)\d+\b', json.dumps(kb, ensure_ascii=False)):
        if m.group(0) in SOURCES:
            used.add(m.group(0))
    kb['sources'] = {k: SOURCES[k] for k in sorted(used, key=lambda s: (re.sub(r'\d', '', s), int(re.sub(r'\D', '', s))))}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False, indent=1)
    print('kb.json written:', len(kb['crops']), 'crops,', len(kb['items']), 'items,', len(kb['sources']), 'sources cited; price spread', spread, 'from', n, 'ranges')


if __name__ == '__main__':
    build()
