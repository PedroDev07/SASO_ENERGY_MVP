import re, glob, json, sys
keys = {}
for f in sorted(glob.glob('src/**/*.ts*', recursive=True)):
    if f.endswith('dict.ts') or f.endswith('i18n.ts'): continue
    src = open(f, encoding='utf-8').read()
    src = re.sub(r"^import .*$", "", src, flags=re.M)
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", src):
        s = m.group(1)
        if not re.search(r"[A-Za-zÀ-ÿ]", s): continue
        if s.startswith(('/', '#', 't-', 'var(', '.', 'http')) or re.fullmatch(r"[a-z0-9-]+", s) or re.fullmatch(r"[A-Z_]+", s): continue
        if re.fullmatch(r"[\w-]+(\s[\w-]+)*", s) and ' ' in s and s == s.lower() and not re.search(r"[À-ÿ]", s) and re.search(r"\b(btn|chip|card|line|grow|field|input|link|small|muted|drop|err|pad|item|between|note|main|side|option|stack|row|display|sel|on|off|filled|over|centered|print|no|mobile|only|primary|danger|dark|lg|sm|ghost|t)\b", s): continue
        keys.setdefault(s, f)
json.dump(keys, open(sys.argv[1], 'w'), ensure_ascii=False, indent=0)
print(len(keys))
