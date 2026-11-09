import { useState } from 'react';
import { LangSwitch } from '../components/ui';
import { useT } from '../i18n';

const G = '#0B7A4B', B = '#1F4FBF', A = '#A86A00', X = '#5B675F';

const ROWS: [string, number, number, string][] = [
  ['Detalhamento e design final', 1, 2, G],
  ['Login, perfis e permissões', 1, 4, G],
  ['Cadastro e credenciamento', 2, 4, G],
  ['Catálogo e tabela de preços', 3, 4, G],
  ['Office inicial e registro de acessos', 3, 4, G],
  ['Pipeline, CRM, proteção de 45 dias e recompra', 5, 7, B],
  ['Leads com prazo de 48 h', 6, 7, B],
  ['Pré-proposta em PDF', 6, 8, B],
  ['Formulário de premissas', 7, 8, B],
  ['Documentos por projeto, com versões', 7, 8, B],
  ['Validação técnica (5 dias úteis)', 9, 10, A],
  ['Proposta final em PDF', 10, 11, A],
  ['Ordens de compra e acesso do fornecedor', 10, 11, A],
  ['Painel de etapas e status de pagamento', 11, 12, A],
  ['Relatórios por perfil', 11, 12, A],
  ['Notificações por e-mail e WhatsApp', 9, 12, A],
  ['Testes de segurança, treinamento e lançamento', 12, 13, A],
  ['Aprovação do WhatsApp na Meta (em paralelo)', 1, 4, X],
  ['Testes das permissões (contínuos)', 1, 13, X],
];

const MILESTONES = [
  { col: '5 / 6', title: 'Aceite 1', sub: 'Fim da semana 4' },
  { col: '9 / 10', title: 'Aceite 2', sub: 'Fim da semana 8' },
  { col: '14 / 15', title: 'Aceite final', sub: 'Semana 13' },
];

const PHASES = [
  { color: G, key: G, title: 'Fase 1 · Mês 1', legend: 'Fase 1 · Base e credenciamento', gets: 'cadastro e credenciamento de integradores, office inicial, catálogo e tabela de preços.', needs: 'níveis de credenciamento e lista de documentos.' },
  { color: B, key: B, title: 'Fase 2 · Mês 2', legend: 'Fase 2 · Vender', gets: 'pipeline e CRM, leads, pré-proposta e formulário de premissas, documentos dos projetos.', needs: 'formato do preço da pré-proposta e campos das premissas.' },
  { color: A, key: A, title: 'Fase 3 · Mês 3', legend: 'Fase 3 · Validar, entregar e fechar', gets: 'validação, proposta final, ordens de compra, painel de etapas, relatórios, notificações e treinamento.', needs: 'dados do cliente que o fornecedor vê e tratamento de valores entre SASO e fornecedor.' },
];

const GRID = '300px repeat(13, minmax(0, 1fr))';

export default function Cronograma() {
  const { t } = useT();
  const [focus, setFocus] = useState<string | null>(null);
  const dim = (c: string) => (focus && focus !== c ? 0.18 : 1);

  return (
    <div className="page">
      <main className="main centered" style={{ padding: 32, gap: 22 }}>
        <header className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>SASO ENERGY</div>
            <h1 style={{ marginTop: 2, fontSize: 30 }}>{t('Cronograma de entrega: 3 fases, 1 por mês')}</h1>
            <p className="sub" style={{ marginTop: 6 }}>{t('Plataforma em operação em 13 semanas. Cada fase termina com uma demonstração e o aceite da SASO.')}</p>
          </div>
          <LangSwitch />
        </header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[...PHASES.map(p => ({ c: p.color, l: p.legend })), { c: X, l: 'Ao longo de todo o projeto' }].map(({ c, l }) => (
            <button
              key={l}
              onClick={() => setFocus(f => (f === c ? null : c))}
              aria-pressed={focus === c}
              style={{
                display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${focus === c ? c : 'transparent'}`, background: focus === c ? '#fff' : 'transparent',
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, background: c }} />{t(l)}
            </button>
          ))}
          {focus && <button className="link small" onClick={() => setFocus(null)}>{t('mostrar todas')}</button>}
        </div>

        <section aria-label="Gráfico de cronograma" className="card" style={{ overflowX: 'auto', display: 'block' }}>
          <div style={{ minWidth: 960, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID }}>
              <div />
              <div style={{ gridColumn: '2 / 6', textAlign: 'center', padding: 8, background: 'var(--green-soft)', color: 'var(--green-dark)', fontWeight: 600, borderRadius: '8px 0 0 8px' }}>{t('Mês 1')}</div>
              <div style={{ gridColumn: '6 / 10', textAlign: 'center', padding: 8, background: 'var(--blue-soft)', color: 'var(--blue-dark)', fontWeight: 600 }}>{t('Mês 2')}</div>
              <div style={{ gridColumn: '10 / 15', textAlign: 'center', padding: 8, background: 'var(--amber-soft)', color: 'var(--amber-text)', fontWeight: 600, borderRadius: '0 8px 8px 0' }}>{t('Mês 3')}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: GRID, marginTop: 4, color: 'var(--muted)', fontSize: 12 }}>
              <div />
              {Array.from({ length: 13 }, (_, i) => <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>{t('S{n}', { n: i + 1 })}</div>)}
            </div>

            {ROWS.map(([label, s, e, c], i) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', minHeight: 36, borderTop: '1px solid var(--line-2)', opacity: dim(c), transition: 'opacity .2s' }}>
                <div style={{ padding: '6px 8px' }}>{t(label)}</div>
                <div
                  title={t('{label}: semanas {s} a {e}', { label: t(label), s, e })}
                  style={{
                    gridColumn: `${s + 1} / ${e + 2}`, height: 20, borderRadius: 6, background: c, margin: '0 2px',
                    transformOrigin: 'left', animation: `grow .7s cubic-bezier(.2,.8,.2,1) ${i * 0.03}s both`,
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'start', borderTop: '2px solid var(--ink)', marginTop: 4, paddingTop: 8 }}>
              <div style={{ padding: '6px 8px', fontWeight: 700 }}>{t('Marcos de aceite')}</div>
              {MILESTONES.map(m => (
                <div key={m.title} style={{ gridColumn: m.col, textAlign: 'center' }}>
                  <div style={{ width: 18, height: 18, background: 'var(--ink)', transform: 'rotate(45deg)', margin: '4px auto 10px' }} />
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t(m.title)}</div>
                  <div className="muted small">{t(m.sub)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {PHASES.map(p => (
            <section key={p.title} className="card" style={{ flex: '1 1 340px', borderTop: `6px solid ${p.color}`, padding: 18, gap: 8, opacity: dim(p.key), transition: 'opacity .2s' }}>
              <h2 style={{ color: p.color }}>{t(p.title)}</h2>
              <div><strong>{t('A SASO recebe:')}</strong> {t(p.gets)}</div>
              <div><strong>{t('Precisa estar decidido:')}</strong> {t(p.needs)}</div>
            </section>
          ))}
        </div>

        <p className="note">{t('Semanas e divisão de parcelas são uma proposta para discussão. O cronograma assume a fase de detalhamento nas semanas 1 e 2 e depende das definições dos pontos em aberto.')}</p>
      </main>
    </div>
  );
}
