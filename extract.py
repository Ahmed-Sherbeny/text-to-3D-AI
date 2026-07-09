import json
with open(r'C:\Users\Pola\Documents\antigravity\zealous-planck\Untitled4 (2).ipynb', encoding='utf-8') as f:
    nb = json.load(f)
with open(r'C:\Users\Pola\Documents\antigravity\zealous-planck\notebook2_code.py', 'w', encoding='utf-8') as out:
    out.write('\n\n# --- CELL ---\n\n'.join([''.join(cell.get('source', [])) for cell in nb.get('cells', []) if cell.get('cell_type') == 'code']))
