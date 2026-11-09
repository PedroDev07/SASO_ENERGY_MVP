import { useCallback } from 'react';
import { useStore } from './state/store';
import { DICT } from './dict';

export type Lang = 'pt' | 'en' | 'zh';
export type Vars = Record<string, string | number>;

export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: 'pt', short: 'PT', name: 'Português' },
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'zh', short: '中文', name: '中文' },
];

export const LOCALE: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US', zh: 'zh-CN' };

/** Marcadores de valor do design ([VALOR], [DATA]...) dentro de textos livres. */
const TOKENS: Record<string, [string, string]> = {
  '[VALOR DO EPC]': ['[EPC VALUE]', '[EPC 金额]'],
  '[PREÇO DE REFERÊNCIA]': ['[REFERENCE PRICE]', '[参考价格]'],
  '[PREÇO MÍNIMO]': ['[MIN PRICE]', '[最低价格]'],
  '[PREÇO MÁXIMO]': ['[MAX PRICE]', '[最高价格]'],
  '[VALOR]': ['[VALUE]', '[数值]'],
  '[DATA]': ['[DATE]', '[日期]'],
};

/**
 * As chaves são o próprio texto em português. Sem tradução cadastrada,
 * o texto aparece em português (o script `npm run i18n:check` aponta as faltas).
 */
export function translate(lang: Lang, key: string, vars?: Vars, translateVars = false): string {
  const idx = lang === 'en' ? 0 : 1;
  let s = lang === 'pt' ? key : DICT[key]?.[idx];
  if (s === undefined) {
    s = key;
    if (lang !== 'pt') for (const [tk, tr] of Object.entries(TOKENS)) s = s.split(tk).join(tr[idx]);
  }
  if (vars) {
    for (const k of Object.keys(vars)) {
      const v = vars[k];
      const val = translateVars && typeof v === 'string' ? translate(lang, v) : String(v);
      s = s.split(`{${k}}`).join(val);
    }
  }
  return s;
}

export function useT() {
  const { state } = useStore();
  const lang = state.settings.lang;
  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
  /** Traduz também os valores das variáveis (para textos guardados no estado, como avisos). */
  const tv = useCallback((key: string, vars?: Vars) => translate(lang, key, vars, true), [lang]);
  const date = useCallback((d: Date) => d.toLocaleDateString(LOCALE[lang]), [lang]);
  const money = useCallback((n: number) => n.toLocaleString(LOCALE[lang], { style: 'currency', currency: 'BRL' }), [lang]);
  return { t, tv, lang, date, money };
}
