"""Confere o dicionário: textos sem tradução, variáveis diferentes e chaves duplicadas."""
import re, glob, sys, collections

dict_src = open('src/dict.ts', encoding='utf-8').read()
entries = re.findall(r"^\s*'((?:[^'\\]|\\.)*)':\s*\['((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'\]", dict_src, flags=re.M)
keys = collections.Counter(k for k, _, _ in entries)
problems = [f'duplicada: {k}' for k, n in keys.items() if n > 1]
for k, en, zh in entries:
    vk = sorted(re.findall(r'\{\w+\}', k))
    for lang, v in (('en', en), ('zh', zh)):
        if sorted(re.findall(r'\{\w+\}', v)) != vk:
            problems.append(f'variáveis diferentes ({lang}): {k}')

# Textos usados no código que parecem frases de interface (contêm espaço ou acento ou são palavras capitalizadas)
IGNORE = re.compile(r"^(?:[/#.].*|[a-z]\d+|saso-energy-demo-v\d+|EVA-\d+KW|[\d\s.%,()/:-]+|.*px.*|.*var\(.*|.*repeat\(.*|.*rotate\(.*|.*\.(?:pdf|zip|jpg)|Inter.*|[a-z-]+|[A-Z_]+|[A-Z]{2,3}-\d+|PO-\d+|EV[AD]\d+.*|zh-CN|Escape|Enter|SASO|PO|all .*|opacity .*|background .*|.*@.*|.*\(\w\w\)|.*Ltda|.*Exemplo.*)$")
NAMES = {'Posto Rota 60', 'Condomínio Vila Jardim', 'Shopping Cerrado', 'Frota Transportes Alfa', 'Condomínio Bela Vista',
         'Posto Estrada Real', 'Clínica Vida', 'Hotel Planalto', 'Supermercado Bom Preço', 'Estacionamento Centro',
         'Rede Supermercados Norte', 'Hotel Fazenda Serra', 'Padaria Central', 'Norte Energia Integração',
         'Rod. BR-060, km 12 · Anápolis (GO)', 'Posto Rota 60 · Anápolis (GO)', '[VALOR] kW', '[VALOR] m', '[VALOR] / 2', '[VALOR]', '[DATA]',
         'Shopping Alfa · Campinas (SP)', 'Condomínio Lago · Curitiba (PR)', 'Frota Litoral · Fortaleza (CE)', 'Hotel Planalto · Pirenópolis (GO)',
         'useStore fora do StoreProvider', 'Office'}
missing = []
for f in sorted(glob.glob('src/**/*.ts*', recursive=True)):
    if f.endswith(('dict.ts', 'i18n.ts')): continue
    src = re.sub(r'^import .*$', '', open(f, encoding='utf-8').read(), flags=re.M)
    for s in re.findall(r"'((?:[^'\\\n]|\\.)*)'", src):
        if s in keys or s in NAMES or IGNORE.match(s) or not re.search(r'[A-Za-zÀ-ÿ]', s): continue
        if re.fullmatch(r'[\w-]+( [\w-]+)+', s) and s == s.lower() and not re.search(r'[À-ÿ]', s) and not s.startswith(('mostrar', 'preencher', 'seu ', 'devolvido', 'última')):
            continue  # nomes de classes CSS
        missing.append(f'{f}: {s}')
for p in problems + [f'sem tradução → {m}' for m in missing]:
    print(p)
print(f'{len(keys)} textos no dicionário · {len(problems)} problemas · {len(missing)} sem tradução')
sys.exit(1 if problems or missing else 0)
