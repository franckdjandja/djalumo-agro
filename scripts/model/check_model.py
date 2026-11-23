"""Compares a recalculated model with the planner engine figures written next to it by make.mjs.

The workbook must have been recalculated first (Excel, or LibreOffice headless) so that its formulas carry values.
Usage: python3 check_model.py out.xlsx            (reads out.engine.json)
Exit code 1 when a figure differs from the engine by more than 0.5 %.
"""
import json
import sys

from openpyxl import load_workbook

path = sys.argv[1]
data = json.load(open(path[:-5] + ".engine.json", encoding="utf-8"))
wb = load_workbook(path, data_only=True)
FR = data["lang"] == "fr"
plan, cash = "Plan", "Trésorerie" if FR else "Cash flow"
bad = 0


def same(label, got, want, tol=0.005):
    global bad
    if want is None:
        return
    ok = got is not None and abs(got - want) <= max(1.0, abs(want) * tol)
    bad += 0 if ok else 1
    print(f"{'ok ' if ok else 'BAD'} {label}: model {got if got is None else round(got, 2)} / planner {round(want, 2)}")


for v in data["variants"]:
    ws = wb[f"{plan} {v['name']}"]
    e = v["engine"]
    print(f"Variant {v['name']}: {v['title']}")
    same("total budget", ws["C28"].value, e["total"])
    same("expected margin", ws["I18"].value, e["expectedMargin"])
    for i, k in enumerate(["good", "average", "poor", "failure"]):
        same(f"margin {k}", ws[f"I{14 + i}"].value, e["margins"][k])
        same(f"cash after season {k}", ws[f"K{14 + i}"].value, e["cashAfter"][k])
    same("deepest cash need, average", ws["C33"].value, e["peakNeed"], 0.02)
    same("break-even yield", ws["C31"].value, e["breakEvenYield"])
    same("break-even price", ws["C32"].value, e["breakEvenPrice"])
    if ws["C19"].value != "OK":
        bad += 1
        print("BAD likelihoods do not add up to 100%")
    errors = [c.coordinate for row in ws.iter_rows() for c in row if isinstance(c.value, str) and c.value.startswith("#")]
    if errors:
        bad += 1
        print("BAD error values in", errors[:10])

print("all figures match the planner" if not bad else f"{bad} figure(s) differ from the planner")
sys.exit(1 if bad else 0)
