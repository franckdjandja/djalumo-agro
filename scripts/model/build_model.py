"""Writes the editable financial model from the data prepared by make.mjs.

Every figure the client may want to change is an input cell (blue); everything else is a formula, so the
workbook recalculates when the area, a price, a yield or a cost line changes.
Usage: python3 build_model.py data.json out.xlsx
"""
import json
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

data = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
FR = data["lang"] == "fr"
C2 = data["currency2"]

T = {
    "summary": "Synthèse" if FR else "Summary",
    "plan": "Plan",
    "cash": "Trésorerie" if FR else "Cash flow",
    "sources": "Sources",
    "title": "Modèle financier de saison" if FR else "Seasonal financial model",
    "preparedFor": "Préparé pour" if FR else "Prepared for",
    "ref": "Référence" if FR else "Reference",
    "preparedBy": "Préparé par" if FR else "Prepared by",
    "reviewedBy": "Revu par" if FR else "Reviewed by",
    "pricesDate": "Date des prix" if FR else "Prices dated",
    "refs": "Références du Planificateur" if FR else "Planner references",
    "toFill": "à compléter" if FR else "to complete",
    "toPrice": "prix à renseigner" if FR else "price to enter",
    "compare": "Comparaison des variantes" if FR else "Variants compared",
    "indicator": "Indicateur" if FR else "Indicator",
    "variant": "Variante" if FR else "Variant",
    "planting": "Plantation" if FR else "Planting",
    "assumptions": "Hypothèses" if FR else "Assumptions",
    "area": "Surface cultivée" if FR else "Cultivated area",
    "loss": "Pertes après récolte" if FR else "Post-harvest losses",
    "fee": "Frais de marché sur les ventes" if FR else "Market fees on sales",
    "reserve": "Réserve pour imprévus" if FR else "Contingency reserve",
    "reserveNote": "du besoin de financement" if FR else "of the funding need",
    "fx": ("FCFA pour 1 " + C2) if FR else ("FCFA per 1 " + C2),
    "priceOrigin": "Origine du prix de vente" if FR else "Selling price basis",
    "priceRef": "prix de référence du Planificateur, ajusté aux mois de récolte" if FR else "planner reference price, adjusted to the harvest months",
    "priceUser": "prix indiqué par le client" if FR else "price given by the client",
    "outcomes": "Les quatre issues" if FR else "The four outcomes",
    "outcome": "Issue" if FR else "Outcome",
    "names": ["Bonne récolte", "Récolte moyenne", "Faible récolte", "Échec"] if FR else ["Good harvest", "Average harvest", "Poor harvest", "Failure"],
    "yield": "Rendement (t/ha)" if FR else "Yield (t/ha)",
    "price": "Prix de vente (FCFA/kg)" if FR else "Selling price (FCFA/kg)",
    "prob": "Probabilité" if FR else "Likelihood",
    "sold": "Quantité vendue (kg)" if FR else "Quantity sold (kg)",
    "revenue": "Recettes (FCFA)" if FR else "Revenue (FCFA)",
    "harvestCosts": "Récolte et vente (FCFA)" if FR else "Harvest and sale (FCFA)",
    "seasonCosts": "Coûts de la saison (FCFA)" if FR else "Season costs (FCFA)",
    "margin": "Marge de la saison (FCFA)" if FR else "Season margin (FCFA)",
    "marginC2": ("Marge (" + C2 + ")") if FR else ("Margin (" + C2 + ")"),
    "cashEnd": "Trésorerie en fin de saison (FCFA)" if FR else "Cash at the end of the season (FCFA)",
    "expected": "Moyenne pondérée" if FR else "Weighted average",
    "probCheck": "Contrôle des probabilités" if FR else "Likelihood check",
    "probOk": "La somme des probabilités doit faire 100 %" if FR else "Likelihoods must add up to 100%",
    "results": "Résultats de la variante" if FR else "Results of the variant",
    "fieldCash": "Coûts au champ payés en argent" if FR else "Field costs paid in cash",
    "perKg": "Coût de récolte et de vente par kg vendu" if FR else "Harvest and sale cost per kg sold",
    "upfront": "Matériel acheté au départ" if FR else "Equipment bought at the start",
    "amort": "Amortissement du matériel sur la saison" if FR else "Equipment cost charged to the season",
    "need": "Besoin de financement, récolte moyenne" if FR else "Funding need, average harvest",
    "reserveAmt": "Réserve pour imprévus" if FR else "Contingency reserve",
    "budget": "Budget total à financer" if FR else "Total budget to finance",
    "expMargin": "Marge attendue (moyenne pondérée)" if FR else "Expected margin (weighted average)",
    "lossProb": "Probabilité de perdre de l’argent" if FR else "Likelihood of losing money",
    "beYield": "Rendement d’équilibre (t/ha)" if FR else "Break-even yield (t/ha)",
    "bePrice": "Prix d’équilibre au rendement moyen (FCFA/kg)" if FR else "Break-even price at the average yield (FCFA/kg)",
    "peakAvg": "Besoin de trésorerie maximal, récolte moyenne" if FR else "Deepest cash need, average harvest",
    "peakPoor": "Besoin de trésorerie maximal, faible récolte" if FR else "Deepest cash need, poor harvest",
    "detail": "Budget détaillé" if FR else "Detailed budget",
    "cols": (["Étape", "Poste", "Catégorie", "Base", "Quantité par ha", "Quantité", "Unité", "Prix unitaire (FCFA)", "Total (FCFA)", "Part payée en argent", "Montant payé (FCFA)", "Durée de vie (saisons)", "Coût pour la saison (FCFA)", "Sources"]
             if FR else ["Step", "Item", "Category", "Basis", "Quantity per ha", "Quantity", "Unit", "Unit price (FCFA)", "Total (FCFA)", "Share paid in cash", "Paid (FCFA)", "Life (seasons)", "Cost for the season (FCFA)", "Sources"]),
    "secHa": "Coûts au champ, proportionnels à la surface" if FR else "Field costs, in proportion to the area",
    "secKg": "Récolte et vente, par kg vendu (quantité de la récolte moyenne)" if FR else "Harvest and sale, per kg sold (quantity of the average harvest)",
    "secUp": "Matériel acheté au départ, dimensionné à la surface" if FR else "Equipment bought at the start, sized to the area",
    "perHa": "par ha" if FR else "per ha",
    "perKgB": "par kg vendu" if FR else "per kg sold",
    "sub": "Sous-total" if FR else "Subtotal",
    "total": "Total" if FR else "Total",
    "month": "Mois" if FR else "Month",
    "fixedShare": "Part des dépenses au champ et du matériel" if FR else "Share of field and equipment spending",
    "saleShare": "Part des ventes" if FR else "Share of sales",
    "spend": "Dépenses" if FR else "Spending",
    "sales": "Ventes" if FR else "Sales",
    "cum": "Solde cumulé" if FR else "Cumulative balance",
    "peak": "Besoin de trésorerie maximal" if FR else "Deepest cash need",
    "endBal": "Solde en fin de période" if FR else "Balance at the end",
    "cashNote": ("Montants en FCFA. Les dépenses au champ et le matériel suivent le calendrier du Planificateur ; la récolte, son coût et les ventes suivent les mois de récolte. La réserve pour imprévus n’est pas dépensée ici."
                 if FR else "Amounts in FCFA. Field spending and equipment follow the planner calendar; the harvest, its cost and the sales follow the harvest months. The contingency reserve is not spent here."),
    "srcCols": ["Identifiant", "Titre", "Éditeur", "Année", "Lien"] if FR else ["Id", "Title", "Publisher", "Year", "Link"],
    "srcNote": "Les identifiants renvoient à la colonne Sources des onglets Plan." if FR else "The ids refer to the Sources column of the Plan sheets.",
    "howH": "Comment lire et modifier ce modèle" if FR else "How to read and change this model",
    "how": ([
        "Les cellules en bleu sont des hypothèses : vous pouvez les modifier. Les cellules en noir sont calculées et se mettent à jour seules.",
        "Les cellules sur fond jaune sont les leviers principaux : surface, rendements et prix de vente.",
        "Les quantités du budget suivent la surface. Le matériel est arrondi à l’unité supérieure : vérifiez-le si vous changez beaucoup la surface.",
        "Les quatre issues, leurs rendements et leurs probabilités viennent du Planificateur de saison de Djalumo Agro, à partir de références publiques datées listées dans l’onglet Sources.",
        "Aucune issue n’est garantie. Vérifiez les prix et les devis localement avant d’engager de l’argent.",
    ] if FR else [
        "Blue cells are assumptions: you can change them. Black cells are calculated and update on their own.",
        "Cells on a yellow background are the main levers: area, yields and selling prices.",
        "Budget quantities follow the area. Equipment is rounded up to whole units: check it if you change the area a lot.",
        "The four outcomes, their yields and their likelihoods come from the Djalumo Agro Season Planner, built on dated public references listed in the Sources sheet.",
        "No outcome is guaranteed. Check prices and quotes locally before committing money.",
    ]),
}

ARIAL = "Arial"
GREEN = "0A3D2E"
f_base = Font(name=ARIAL, size=10)
f_input = Font(name=ARIAL, size=10, color="0000FF")
f_link = Font(name=ARIAL, size=10, color="008000")
f_bold = Font(name=ARIAL, size=10, bold=True)
f_head = Font(name=ARIAL, size=10, bold=True, color="FFFFFF")
f_title = Font(name=ARIAL, size=15, bold=True, color=GREEN)
f_sec = Font(name=ARIAL, size=12, bold=True, color=GREEN)
f_note = Font(name=ARIAL, size=9, italic=True, color="5B6F65")
fill_head = PatternFill("solid", fgColor=GREEN)
fill_key = PatternFill("solid", fgColor="FFFF00")
fill_group = PatternFill("solid", fgColor="EEF4F0")
fill_total = PatternFill("solid", fgColor="DDE9E1")
thin = Side(style="thin", color="C9D6CE")
box = Border(top=thin, bottom=thin, left=thin, right=thin)
wrap = Alignment(wrap_text=True, vertical="top")

FCFA = '#,##0;(#,##0);"-"'
FCFA_D = '#,##0.00;(#,##0.00);"-"'
PCT = '0.0%;(0.0%);"-"'
QTY = '#,##0.00;(#,##0.00);"-"'
T_HA = '0.0;(0.0);"-"'


def put(ws, ref, value, font=f_base, fmt=None, fill=None, align=None, border=False):
    c = ws[ref]
    c.value = value
    c.font = font
    if fmt:
        c.number_format = fmt
    if fill:
        c.fill = fill
    if align:
        c.alignment = align
    if border:
        c.border = box
    return c


def header_row(ws, row, labels, col0=1, height=30):
    for i, lab in enumerate(labels):
        put(ws, f"{get_column_letter(col0 + i)}{row}", lab, f_head, fill=fill_head, align=Alignment(wrap_text=True, vertical="center"), border=True)
    ws.row_dimensions[row].height = height


def q(sheet):
    return "'" + sheet + "'"


wb = Workbook()
wb.remove(wb.active)
summary = wb.create_sheet(T["summary"])
keys = []  # per variant: cell addresses used by the summary

for v in data["variants"]:
    pn = f"{T['plan']} {v['name']}"
    cn = f"{T['cash']} {v['name']}"
    ws = wb.create_sheet(pn)
    put(ws, "A1", f"{T['variant']} {v['name']} : {v['title']}" if FR else f"{T['variant']} {v['name']}: {v['title']}", f_title)
    put(ws, "A2", (f"Plantation le {v['start']}, première récolte vers le {v['firstHarvest']}, dernière récolte vers le {v['lastHarvest']}." if FR
                   else f"Planting on {v['start']}, first harvest around {v['firstHarvest']}, last harvest around {v['lastHarvest']}."), f_note)

    # Assumptions
    put(ws, "A4", T["assumptions"], f_sec)
    rows = [(T["area"], v["area"], "ha", QTY, True), (T["loss"], v["lossShare"], "", PCT, False), (T["fee"], v["fee"], "", PCT, False),
            (T["reserve"], v["reserveRate"], T["reserveNote"], PCT, False), (T["fx"], data["fx2"], "", FCFA_D, False)]
    for i, (lab, val, unit, fmt, key) in enumerate(rows):
        r = 5 + i
        put(ws, f"A{r}", lab)
        put(ws, f"C{r}", val, f_input, fmt, fill_key if key else None, border=True)
        put(ws, f"D{r}", unit, f_note)
    put(ws, "A10", T["priceOrigin"])
    put(ws, "C10", T["priceUser"] if v["priceSource"] == "user" else T["priceRef"], f_note)
    AREA, LOSS, FEE, RES, FX = "$C$5", "$C$6", "$C$7", "$C$8", "$C$9"

    # Detailed budget first (its subtotals feed the outcomes)
    lines = v["lines"]
    groups = [("ha", T["secHa"]), ("kg", T["secKg"]), ("upfront", T["secUp"])]
    top = 37
    put(ws, f"A{top - 1}", T["detail"], f_sec)
    header_row(ws, top, T["cols"])
    r = top + 1
    sub = {}
    AVG_SOLD = "$E$15"
    for kind, title in groups:
        put(ws, f"A{r}", title, f_bold, fill=fill_group)
        for col in range(2, 15):
            ws.cell(row=r, column=col).fill = fill_group
        r += 1
        first = r
        for l in [x for x in lines if x["kind"] == kind]:
            put(ws, f"A{r}", l["step"], f_note, align=Alignment(wrap_text=True, vertical="top"))
            put(ws, f"B{r}", l["label"], align=Alignment(wrap_text=True, vertical="top"))
            put(ws, f"C{r}", l["cat"], f_note)
            if kind == "kg":
                put(ws, f"D{r}", T["perKgB"])
                put(ws, f"F{r}", f"={AVG_SOLD}", fmt=QTY)
            else:
                put(ws, f"D{r}", T["perHa"])
                put(ws, f"E{r}", l["qtyPerHa"], f_input, QTY)
                if kind == "upfront" and l["unitKey"] in ("unit", "set"):
                    put(ws, f"F{r}", f"=ROUNDUP(ROUND(E{r}*{AREA},6),0)", fmt=QTY)
                else:
                    put(ws, f"F{r}", f"=E{r}*{AREA}", fmt=QTY)
            put(ws, f"G{r}", l["unit"])
            put(ws, f"H{r}", l["price"], f_input, FCFA_D if l["price"] < 100 else FCFA, fill_key if l["unpriced"] else None)
            put(ws, f"I{r}", f"=F{r}*H{r}", fmt=FCFA)
            put(ws, f"J{r}", l["cashShare"], f_input, PCT)
            put(ws, f"K{r}", f"=I{r}*J{r}", fmt=FCFA)
            if kind == "upfront":
                put(ws, f"L{r}", l["life"], f_input, "0")
                put(ws, f"M{r}", f"=IF(L{r}>0,K{r}/L{r},K{r})", fmt=FCFA)
            else:
                put(ws, f"M{r}", f"=K{r}", fmt=FCFA)
            put(ws, f"N{r}", (T["toPrice"] + (" · " + l["src"] if l["src"] else "")) if l["unpriced"] else l["src"], f_note)
            r += 1
        last = r - 1
        put(ws, f"B{r}", T["sub"], f_bold, fill=fill_total)
        for col in "ACDEFGHIJLN":
            ws[f"{col}{r}"].fill = fill_total
        if last >= first:
            put(ws, f"K{r}", f"=SUM(K{first}:K{last})", f_bold, FCFA, fill_total)
            put(ws, f"M{r}", f"=SUM(M{first}:M{last})", f_bold, FCFA, fill_total)
            per_kg = f"=SUMPRODUCT(H{first}:H{last},J{first}:J{last})"
        else:
            put(ws, f"K{r}", 0, f_bold, FCFA, fill_total)
            put(ws, f"M{r}", 0, f_bold, FCFA, fill_total)
            per_kg = "=0"
        sub[kind] = {"row": r, "perKg": per_kg}
        r += 2
    put(ws, f"B{r}", T["total"], f_bold, fill=fill_total)
    put(ws, f"K{r}", f"=K{sub['ha']['row']}+K{sub['kg']['row']}+K{sub['upfront']['row']}", f_bold, FCFA, fill_total)
    put(ws, f"M{r}", f"=M{sub['ha']['row']}+M{sub['kg']['row']}+M{sub['upfront']['row']}", f_bold, FCFA, fill_total)

    # Results block (rows 22 to 34) and outcomes (rows 13 to 19)
    put(ws, "A21", T["results"], f_sec)
    put(ws, "C21", "FCFA", f_bold)
    put(ws, "D21", C2, f_bold)
    res = [
        (22, T["fieldCash"], f"=K{sub['ha']['row']}", FCFA, True),
        (23, T["perKg"] + " (FCFA/kg)", sub["kg"]["perKg"], FCFA_D, False),
        (24, T["upfront"], f"=K{sub['upfront']['row']}", FCFA, True),
        (25, T["amort"], f"=M{sub['upfront']['row']}", FCFA, True),
        (26, T["need"], "=C22+G15+C24", FCFA, True),
        (27, T["reserveAmt"], f"=C26*{RES}", FCFA, True),
        (28, T["budget"], "=C26+C27", FCFA, True),
        (29, T["expMargin"], "=I18", FCFA, True),
        (30, T["lossProb"], "=SUMPRODUCT(--(I14:I17<0),D14:D17)", PCT, False),
        (31, T["beYield"], f'=IFERROR((C22+C25)/({AREA}*1000*(1-{LOSS})*(C15*(1-{FEE})-C23)),"")', T_HA, False),
        (32, T["bePrice"], f'=IFERROR((C22+C25+E15*C23)/(E15*(1-{FEE})),"")', FCFA_D, False),
        (33, T["peakAvg"], None, FCFA, True),
        (34, T["peakPoor"], None, FCFA, True),
    ]
    for row, lab, formula, fmt, conv in res:
        put(ws, f"A{row}", lab, f_bold if row in (28, 29) else f_base)
        if formula:
            put(ws, f"C{row}", formula, f_bold if row in (28, 29) else f_base, fmt, border=True)
        if conv:
            put(ws, f"D{row}", f"=C{row}/{FX}", fmt=FCFA, border=True)

    put(ws, "A12", T["outcomes"], f_sec)
    header_row(ws, 13, [T["outcome"], T["yield"], T["price"], T["prob"], T["sold"], T["revenue"], T["harvestCosts"], T["seasonCosts"], T["margin"], T["marginC2"], T["cashEnd"]], height=42)
    for i, s in enumerate(v["scenarios"]):
        row = 14 + i
        put(ws, f"A{row}", T["names"][i], f_bold, border=True)
        put(ws, f"B{row}", s["yieldTHa"], f_input, T_HA, fill_key, border=True)
        put(ws, f"C{row}", s["price"], f_input, FCFA_D, fill_key, border=True)
        put(ws, f"D{row}", s["weight"], f_input, PCT, border=True)
        put(ws, f"E{row}", f"=B{row}*1000*{AREA}*(1-{LOSS})", fmt=FCFA, border=True)
        put(ws, f"F{row}", f"=E{row}*C{row}*(1-{FEE})", fmt=FCFA, border=True)
        put(ws, f"G{row}", f"=E{row}*$C$23", fmt=FCFA, border=True)
        put(ws, f"H{row}", f"=$C$22+G{row}+$C$25", fmt=FCFA, border=True)
        put(ws, f"I{row}", f"=F{row}-H{row}", f_bold, FCFA, border=True)
        put(ws, f"J{row}", f"=I{row}/{FX}", fmt=FCFA, border=True)
        put(ws, f"K{row}", f"=F{row}-($C$22+G{row}+$C$24)", fmt=FCFA, border=True)
    put(ws, "A18", T["expected"], f_bold, fill=fill_total, border=True)
    put(ws, "D18", "=SUM(D14:D17)", f_bold, PCT, fill_total, border=True)
    put(ws, "I18", "=SUMPRODUCT(D14:D17,I14:I17)", f_bold, FCFA, fill_total, border=True)
    put(ws, "J18", f"=I18/{FX}", f_bold, FCFA, fill_total, border=True)
    put(ws, "K18", "=SUMPRODUCT(D14:D17,K14:K17)", f_bold, FCFA, fill_total, border=True)
    for col in "BCEFGH":
        ws[f"{col}18"].fill = fill_total
        ws[f"{col}18"].border = box
    put(ws, "A19", T["probCheck"], f_note)
    put(ws, "C19", f'=IF(ABS(D18-1)<0.001,"OK","{T["probOk"]}")', f_note)

    widths = [16, 44, 13, 13, 14, 14, 15, 15, 16, 14, 16, 13, 17, 16]
    for i, w in enumerate(widths):
        ws.column_dimensions[get_column_letter(i + 1)].width = w
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    # Monthly cash flow, one block per outcome
    cs = wb.create_sheet(cn)
    put(cs, "A1", (f"{T['cash']}, {T['variant'].lower()} {v['name']}"), f_title)
    put(cs, "A2", T["cashNote"], f_note)
    cash = v["cash"]
    first, last = 6, 6 + len(cash) - 1
    header_row(cs, 5, [T["month"], T["fixedShare"], T["saleShare"]] + [x for _ in range(4) for x in (T["spend"], T["sales"], T["cum"])], height=42)
    for i, name in enumerate(T["names"]):
        c0 = 4 + i * 3
        cs.merge_cells(start_row=4, start_column=c0, end_row=4, end_column=c0 + 2)
        put(cs, f"{get_column_letter(c0)}4", name, f_bold, align=Alignment(horizontal="center"))
    P = q(pn)
    for k, m in enumerate(cash):
        row = first + k
        put(cs, f"A{row}", m["label"], border=True)
        put(cs, f"B{row}", m["fixedShare"], f_input, PCT, border=True)
        put(cs, f"C{row}", m["saleShare"], f_input, PCT, border=True)
        for i in range(4):
            c0 = 4 + i * 3
            sp, sa, cu = (get_column_letter(c0 + j) for j in range(3))
            orow = 14 + i
            put(cs, f"{sp}{row}", f"=$B{row}*({P}!$C$22+{P}!$C$24)+$C{row}*{P}!$G${orow}", f_link, FCFA, border=True)
            put(cs, f"{sa}{row}", f"=$C{row}*{P}!$F${orow}", f_link, FCFA, border=True)
            prev = f"{cu}{row - 1}+" if row > first else ""
            put(cs, f"{cu}{row}", f"={prev}{sa}{row}-{sp}{row}", f_bold, FCFA, border=True)
    tr = last + 1
    put(cs, f"A{tr}", T["total"], f_bold, fill=fill_total, border=True)
    put(cs, f"B{tr}", f"=SUM(B{first}:B{last})", f_bold, PCT, fill_total, border=True)
    put(cs, f"C{tr}", f"=SUM(C{first}:C{last})", f_bold, PCT, fill_total, border=True)
    peaks = {}
    for i in range(4):
        c0 = 4 + i * 3
        sp, sa, cu = (get_column_letter(c0 + j) for j in range(3))
        put(cs, f"{sp}{tr}", f"=SUM({sp}{first}:{sp}{last})", f_bold, FCFA, fill_total, border=True)
        put(cs, f"{sa}{tr}", f"=SUM({sa}{first}:{sa}{last})", f_bold, FCFA, fill_total, border=True)
        put(cs, f"{cu}{tr}", "", fill=fill_total, border=True)
        put(cs, f"{cu}{tr + 2}", f"=MAX(0,-MIN({cu}{first}:{cu}{last}))", f_bold, FCFA, border=True)
        put(cs, f"{cu}{tr + 3}", f"={cu}{last}", f_base, FCFA, border=True)
        peaks[i] = f"{q(cn)}!{cu}{tr + 2}"
    put(cs, f"A{tr + 2}", T["peak"], f_bold)
    put(cs, f"A{tr + 3}", T["endBal"])
    cs.column_dimensions["A"].width = 14
    cs.column_dimensions["B"].width = 16
    cs.column_dimensions["C"].width = 12
    for c in range(4, 16):
        cs.column_dimensions[get_column_letter(c)].width = 14
    cs.sheet_view.showGridLines = False
    cs.page_setup.orientation = "landscape"
    cs.sheet_properties.pageSetUpPr.fitToPage = True
    cs.page_setup.fitToHeight = 0
    put(ws, "C33", f"={peaks[1]}", f_link, FCFA, border=True)
    put(ws, "C34", f"={peaks[2]}", f_link, FCFA, border=True)
    keys.append({"plan": q(pn), "title": v["title"], "start": v["start"]})

# Summary
s = summary
put(s, "A1", T["title"], f_title)
put(s, "A2", "Djalumo Agro", f_note)
info = [(T["preparedFor"], data["preparedFor"] or T["toFill"]), (T["ref"], data["ref"] or T["toFill"]), (T["preparedBy"], data["preparedBy"]),
        (T["reviewedBy"], data["reviewedBy"] or T["toFill"]), (T["pricesDate"], data["pricesDate"]), (T["refs"], f"{data['kbVersion']} ({data['kbBuilt']})")]
for i, (lab, val) in enumerate(info):
    put(s, f"A{4 + i}", lab, f_bold)
    put(s, f"B{4 + i}", val, f_input if lab in (T["reviewedBy"], T["preparedFor"], T["ref"]) else f_base, fill=fill_key if val == T["toFill"] else None)
put(s, "A11", T["compare"], f_sec)
header_row(s, 12, [T["indicator"]] + [f"{T['variant']} {v['name']}" for v in data["variants"]])
mrows = [
    (T["variant"], lambda k: k["title"], None),
    (T["planting"], lambda k: k["start"], None),
    (T["area"] + " (ha)", lambda k: f"={k['plan']}!C5", QTY),
    (T["budget"] + " (FCFA)", lambda k: f"={k['plan']}!C28", FCFA),
    (T["budget"] + f" ({C2})", lambda k: f"={k['plan']}!D28", FCFA),
    (T["peakAvg"] + " (FCFA)", lambda k: f"={k['plan']}!C33", FCFA),
    (T["peakPoor"] + " (FCFA)", lambda k: f"={k['plan']}!C34", FCFA),
    (T["expMargin"] + " (FCFA)", lambda k: f"={k['plan']}!I18", FCFA),
    (T["expMargin"] + f" ({C2})", lambda k: f"={k['plan']}!J18", FCFA),
] + [(f"{T['margin']}, {T['names'][i].lower()}", (lambda i: lambda k: f"={k['plan']}!I{14 + i}")(i), FCFA) for i in range(4)] + [
    (T["lossProb"], lambda k: f"={k['plan']}!C30", PCT),
    (T["beYield"], lambda k: f"={k['plan']}!C31", T_HA),
    (T["bePrice"], lambda k: f"={k['plan']}!C32", FCFA_D),
]
for j, (lab, fn, fmt) in enumerate(mrows):
    row = 13 + j
    put(s, f"A{row}", lab, f_bold if j in (3, 7) else f_base, border=True, align=Alignment(wrap_text=True, vertical="top"))
    for i, k in enumerate(keys):
        val = fn(k)
        put(s, f"{get_column_letter(2 + i)}{row}", val, f_link if str(val).startswith("=") else f_base, fmt, border=True, align=Alignment(wrap_text=True, vertical="top"))
hr = 13 + len(mrows) + 1
put(s, f"A{hr}", T["howH"], f_sec)
for i, t in enumerate(T["how"]):
    s.merge_cells(start_row=hr + 1 + i, start_column=1, end_row=hr + 1 + i, end_column=1 + len(keys))
    put(s, f"A{hr + 1 + i}", t, align=wrap)
    s.row_dimensions[hr + 1 + i].height = 30 if len(keys) > 1 else 42
s.column_dimensions["A"].width = 46
for c in range(2, 2 + len(keys)):
    s.column_dimensions[get_column_letter(c)].width = 30
s.row_dimensions[13].height = 42
s.sheet_view.showGridLines = False
s.page_setup.orientation = "landscape"
s.sheet_properties.pageSetUpPr.fitToPage = True
s.page_setup.fitToHeight = 0

# Sources
src = wb.create_sheet(T["sources"])
put(src, "A1", T["sources"], f_title)
put(src, "A2", T["srcNote"], f_note)
header_row(src, 4, T["srcCols"])
for i, x in enumerate(data["sources"]):
    row = 5 + i
    put(src, f"A{row}", x["id"], f_bold, border=True)
    put(src, f"B{row}", x.get("title", ""), border=True, align=wrap)
    put(src, f"C{row}", x.get("publisher", ""), border=True, align=wrap)
    put(src, f"D{row}", x.get("year", ""), border=True)
    c = put(src, f"E{row}", x.get("url", ""), Font(name=ARIAL, size=9, color="0D5C44", underline="single") if x.get("url") else f_base, border=True, align=wrap)
    if x.get("url"):
        c.hyperlink = x["url"]
for col, w in zip("ABCDE", (12, 60, 30, 8, 50)):
    src.column_dimensions[col].width = w
src.sheet_view.showGridLines = False

wb.calculation.fullCalcOnLoad = True
wb.properties.creator = "Djalumo Agro"
wb.properties.title = T["title"]
wb.save(out)
