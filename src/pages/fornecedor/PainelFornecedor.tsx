import { useState } from 'react';
import { AppShell, Modal } from '../../components/ui';
import { PO_FLOW, useStore, type PO } from '../../state/store';

const T = {
  pt: {
    title: 'Painel do fornecedor', sub: 'Acompanhamento do CRM e das ordens de compra.',
    forward: 'Encaminhar lead à SASO', noValues: 'Visão sem valores.',
    noValuesText: 'Esta tela não exibe preços, propostas, valores de EPC nem pagamentos. Dados pessoais de clientes finais não saem do Brasil.',
    kpis: ['Unidades vendidas', 'kW instalados', 'Integradores ativos', 'POs em aberto'],
    pipeline: 'Pipeline por etapa (unidades)', regions: 'Distribuição por região (unidades)',
    pos: 'Ordens de compra', posHint: 'Você confirma o recebimento e atualiza o status',
    cols: ['PO', 'Local', 'Tipo', 'Qtd', 'Status', 'Previsto', 'Realizado', ''],
    update: 'Atualizar status', flow: 'Fluxo do status', data: 'Dados ilustrativos.',
    support: 'Pedidos de apoio técnico', supportHint: 'Somente arquivos técnicos. Preços e dados comerciais não são compartilhados.',
    stages: ['Lead', 'Pré-proposta enviada', 'Visita técnica', 'Em validação', 'Proposta final enviada', 'Em execução', 'Concluída'],
    regionNames: ['Centro-Oeste', 'Sudeste', 'Sul', 'Nordeste', 'Norte'],
    status: PO_FLOW,
    kinds: { 'Liberação de estoque': 'Liberação de estoque', 'Produção': 'Produção' } as Record<string, string>,
    modalTitle: 'Atualizar status', confirm: 'Confirmar', cancel: 'Cancelar', current: 'atual',
    fName: 'Nome do cliente ou local', fPlace: 'Cidade (UF)', fKind: 'Tipo de local', fNote: 'A SASO recebe o lead e escolhe o integrador credenciado da região.', send: 'Encaminhar',
  },
  en: {
    title: 'Supplier dashboard', sub: 'CRM and purchase order tracking.',
    forward: 'Forward lead to SASO', noValues: 'No-pricing view.',
    noValuesText: 'This screen shows no prices, proposals, EPC values or payments. End-customer personal data never leaves Brazil.',
    kpis: ['Units sold', 'kW installed', 'Active integrators', 'Open POs'],
    pipeline: 'Pipeline by stage (units)', regions: 'Distribution by region (units)',
    pos: 'Purchase orders', posHint: 'You confirm receipt and update the status',
    cols: ['PO', 'Location', 'Type', 'Qty', 'Status', 'Expected', 'Done', ''],
    update: 'Update status', flow: 'Status flow', data: 'Illustrative data.',
    support: 'Technical support requests', supportHint: 'Technical files only. Prices and commercial data are not shared.',
    stages: ['Lead', 'Pre-proposal sent', 'Site visit', 'Under validation', 'Final proposal sent', 'In execution', 'Completed'],
    regionNames: ['Center-West', 'Southeast', 'South', 'Northeast', 'North'],
    status: ['Received', 'In production', 'Shipped', 'In customs', 'Available at warehouse', 'Released', 'Delivered'],
    kinds: { 'Liberação de estoque': 'Stock release', 'Produção': 'Production' } as Record<string, string>,
    modalTitle: 'Update status', confirm: 'Confirm', cancel: 'Cancel', current: 'current',
    fName: 'Customer or site name', fPlace: 'City (State)', fKind: 'Site type', fNote: 'SASO receives the lead and picks the accredited integrator for the region.', send: 'Forward',
  },
};

const STATUS_TONE = ['t-gray', 't-blue', 't-blue', 't-amber', 't-green', 't-green', 't-green'];
const PIPE = [9, 8, 5, 4, 3, 6, 10];
const REG = [10, 6, 3, 2, 1];
const REGION_PT = ['Centro-Oeste', 'Sudeste', 'Sul', 'Nordeste', 'Norte'];
const ufRegion = (place: string) => {
  const uf = place.match(/\(([A-Z]{2})\)/)?.[1] ?? '';
  if (['GO', 'DF', 'MT', 'MS'].includes(uf)) return 'Centro-Oeste';
  if (['SP', 'RJ', 'MG', 'ES'].includes(uf)) return 'Sudeste';
  if (['PR', 'SC', 'RS'].includes(uf)) return 'Sul';
  if (['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'].includes(uf)) return 'Norte';
  return 'Nordeste';
};

export default function PainelFornecedor() {
  const { state, dispatch, toast } = useStore();
  const lang = state.settings.lang;
  const t = T[lang];
  const full = state.settings.clienteVisivel === 'completo';
  const [edit, setEdit] = useState<PO | null>(null);
  const [next, setNext] = useState(0);
  const [fwd, setFwd] = useState(false);
  const [form, setForm] = useState({ name: '', place: '', kind: 'Posto de combustível' });

  const open = state.pos.filter(p => p.status < PO_FLOW.length - 1).length;
  const kpis = ['18', '720', '12', String(open)];
  const support = state.queue.filter(q => q.supplierSupport);
  const regionLabel = (r: string) => t.regionNames[REGION_PT.indexOf(r)] ?? r;

  return (
    <AppShell
      profile="fornecedor"
      extra={
        <button className="btn sm" onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { lang: lang === 'pt' ? 'en' : 'pt' } })} aria-label="Idioma / Language">
          <span style={{ opacity: lang === 'pt' ? 1 : 0.4 }}>PT</span>·<span style={{ opacity: lang === 'en' ? 1 : 0.4 }}>EN</span>
        </button>
      }
    >
        <div className="between" style={{ alignItems: 'flex-end' }}>
          <div>
            <h1>{t.title}</h1>
            <p className="sub">{t.sub}</p>
          </div>
          <button className="btn dark" onClick={() => setFwd(true)}>{t.forward}</button>
        </div>

        <section className="alert" aria-label="Aviso de visibilidade" style={{ justifyContent: 'flex-start', gap: 8, padding: '12px 18px' }}>
          <span><strong>{t.noValues}</strong> {t.noValuesText}</span>
        </section>

        <div className="grid-4">
          {t.kpis.map((label, i) => (
            <div key={label} className="card" style={{ padding: 18, gap: 0 }}>
              <div className="muted" style={{ fontSize: 13 }}>{label}</div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700 }}>{kpis[i]}</div>
            </div>
          ))}
        </div>

        <div className="row" style={{ alignItems: 'stretch' }}>
          <section className="card pad-lg grow" aria-label={t.pipeline} style={{ gap: 10 }}>
            <h2>{t.pipeline}</h2>
            {t.stages.map((label, i) => <BarRow key={label} label={label} n={PIPE[i]} color="#4A4960" />)}
          </section>
          <section className="card pad-lg grow" aria-label={t.regions} style={{ gap: 10 }}>
            <h2>{t.regions}</h2>
            {t.regionNames.map((label, i) => <BarRow key={label} label={label} n={REG[i]} color="var(--amber)" />)}
          </section>
        </div>

        {support.length > 0 && (
          <section className="card pad-lg" aria-label={t.support}>
            <div className="between"><h2>{t.support}</h2><span className="muted small">{t.supportHint}</span></div>
            {support.map(q => (
              <div className="item" key={q.id}>
                <div className="between">
                  <strong>{full ? `${q.name} · ${q.place}` : regionLabel(ufRegion(q.place))}</strong>
                  <span className="chip t-blue">{q.units}× EVD002-60KW</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {q.files.filter(f => !/contrato/i.test(f.name)).map(f => (
                    <span key={f.name} className="chip t-gray">{f.name} · {f.ver.split(' · ')[0]}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="card pad-lg" aria-label={t.pos}>
          <div className="between"><h2>{t.pos}</h2><span className="muted small">{t.posHint}</span></div>
          <div className="table-wrap">
            <table style={{ minWidth: 900 }}>
              <thead><tr>{t.cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>
                {state.pos.map(o => {
                  const last = o.status === PO_FLOW.length - 1;
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.id}</td>
                      <td>{full ? o.full : regionLabel(o.region)}</td>
                      <td>{t.kinds[o.kind] ?? o.kind}</td>
                      <td>{o.qty}</td>
                      <td><span className={`chip ${STATUS_TONE[o.status]}`}>{t.status[o.status]}</span></td>
                      <td className="muted">{o.eta}</td>
                      <td className="muted">{o.done}</td>
                      <td style={{ textAlign: 'right', paddingRight: 0 }}>
                        <button className="btn sm" disabled={last} onClick={() => { setEdit(o); setNext(o.status + 1); }}>
                          {last ? '✓' : t.update}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note">{t.flow}: {t.status.join(' · ')}.</p>
        </section>

        <p className="note">{t.data}</p>

      {edit && (
        <Modal
          title={`${t.modalTitle} · ${edit.id}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEdit(null)}>{t.cancel}</button>
              <button
                className="btn primary"
                onClick={() => {
                  dispatch({ type: 'ADVANCE_PO', id: edit.id, status: next });
                  const linked = state.projects.find(p => p.poId === edit.id);
                  toast(
                    `${edit.id}: ${t.status[next]}.${linked ? (lang === 'en' ? ' The integrator was notified.' : ' O integrador foi avisado.') : ''}`,
                    'ok',
                    linked ? { label: lang === 'en' ? 'See integrator view' : 'Ver tela do integrador', to: `/integrador/projetos/${linked.id}` } : undefined,
                  );
                  setEdit(null);
                }}
              >
                {t.confirm}
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>{full ? edit.full : regionLabel(edit.region)} · {edit.qty}× EVD002-60KW</p>
          <div className="stack" style={{ gap: 8 }}>
            {t.status.map((s, i) => {
              const past = i <= edit.status;
              return (
                <label key={s} className={`option ${next === i ? 'sel' : ''} ${past ? 'off' : ''}`}>
                  <input type="radio" name="st" disabled={past} checked={next === i} onChange={() => setNext(i)} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{s}</span>
                  {i === edit.status && <span className="chip t-gray">{t.current}</span>}
                  {i < edit.status && <span className="small muted">✓</span>}
                </label>
              );
            })}
          </div>
        </Modal>
      )}

      {fwd && (
        <Modal
          title={t.forward}
          onClose={() => setFwd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setFwd(false)}>{t.cancel}</button>
              <button
                className="btn dark"
                disabled={!form.name.trim() || !form.place.trim()}
                onClick={() => {
                  dispatch({ type: 'FORWARD_LEAD', ...form });
                  toast(lang === 'en' ? `Lead ${form.name} forwarded to SASO.` : `Lead ${form.name} encaminhado à SASO.`, 'ok', { label: lang === 'en' ? 'See SASO queue' : 'Ver na SASO', to: '/saso' });
                  setForm({ name: '', place: '', kind: 'Posto de combustível' });
                  setFwd(false);
                }}
              >
                {t.send}
              </button>
            </>
          }
        >
          <label className="field"><span>{t.fName}</span><input className="input" autoFocus value={form.name} placeholder="Ex.: Rede Postos Horizonte" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="field"><span>{t.fPlace}</span><input className="input" value={form.place} placeholder="Ex.: Uberlândia (MG)" onChange={e => setForm(f => ({ ...f, place: e.target.value }))} /></label>
          <label className="field">
            <span>{t.fKind}</span>
            <select className="select" value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>
              {['Posto de combustível', 'Condomínio', 'Shopping', 'Hotel', 'Garagem de frota', 'Supermercado'].map(k => <option key={k}>{k}</option>)}
            </select>
          </label>
          <p className="note">{t.fNote}</p>
        </Modal>
      )}
    </AppShell>
  );
}

function BarRow({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 36px', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <div className="bar" style={{ height: 12, background: 'var(--line-2)' }}><div style={{ width: `${(n / 10) * 100}%`, background: color }} /></div>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{n}</span>
    </div>
  );
}
