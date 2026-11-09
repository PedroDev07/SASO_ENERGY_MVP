import { useState } from 'react';
import { AppShell, Modal } from '../../components/ui';
import { PO_FLOW, SITE_TYPES, useStore, type PO } from '../../state/store';
import { useT } from '../../i18n';

const KPI_LABELS = ['Unidades vendidas', 'kW instalados', 'Integradores ativos', 'POs em aberto'];
const STAGES = ['Lead', 'Pré-proposta enviada', 'Visita técnica', 'Em validação', 'Proposta final enviada', 'Em execução', 'Concluída'];
const PIPE = [9, 8, 5, 4, 3, 6, 10];
const REGIONS = ['Centro-Oeste', 'Sudeste', 'Sul', 'Nordeste', 'Norte'];
const REG = [10, 6, 3, 2, 1];
const STATUS_TONE = ['t-gray', 't-blue', 't-blue', 't-amber', 't-green', 't-green', 't-green'];
const COLS = ['PO', 'Local', 'Tipo', 'Qtd', 'Status', 'Previsto', 'Realizado', ''];

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
  const { t } = useT();
  const full = state.settings.clienteVisivel === 'completo';
  const [edit, setEdit] = useState<PO | null>(null);
  const [next, setNext] = useState(0);
  const [fwd, setFwd] = useState(false);
  const [form, setForm] = useState({ name: '', place: '', kind: SITE_TYPES[0] });

  const open = state.pos.filter(p => p.status < PO_FLOW.length - 1).length;
  const kpis = ['18', '720', '12', String(open)];
  const support = state.queue.filter(q => q.supplierSupport);

  return (
    <AppShell profile="fornecedor">
      <div className="between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1>{t('Painel do fornecedor')}</h1>
          <p className="sub">{t('Acompanhamento do CRM e das ordens de compra.')}</p>
        </div>
        <button className="btn dark" onClick={() => setFwd(true)}>{t('Encaminhar lead à SASO')}</button>
      </div>

      <section className="alert" aria-label={t('Visão sem valores.')} style={{ justifyContent: 'flex-start', gap: 8, padding: '12px 18px' }}>
        <span><strong>{t('Visão sem valores.')}</strong> {t('Esta tela não exibe preços, propostas, valores de EPC nem pagamentos. Dados pessoais de clientes finais não saem do Brasil.')}</span>
      </section>

      <div className="grid-4">
        {KPI_LABELS.map((label, i) => (
          <div key={label} className="card" style={{ padding: 18, gap: 0 }}>
            <div className="muted" style={{ fontSize: 13 }}>{t(label)}</div>
            <div className="display" style={{ fontSize: 32, fontWeight: 700 }}>{kpis[i]}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card pad-lg grow" aria-label={t('Pipeline por etapa (unidades)')} style={{ gap: 10 }}>
          <h2>{t('Pipeline por etapa (unidades)')}</h2>
          {STAGES.map((label, i) => <BarRow key={label} label={t(label)} n={PIPE[i]} color="#4A4960" />)}
        </section>
        <section className="card pad-lg grow" aria-label={t('Distribuição por região (unidades)')} style={{ gap: 10 }}>
          <h2>{t('Distribuição por região (unidades)')}</h2>
          {REGIONS.map((label, i) => <BarRow key={label} label={t(label)} n={REG[i]} color="var(--amber)" />)}
        </section>
      </div>

      {support.length > 0 && (
        <section className="card pad-lg" aria-label={t('Pedidos de apoio técnico')}>
          <div className="between"><h2>{t('Pedidos de apoio técnico')}</h2><span className="muted small">{t('Somente arquivos técnicos. Preços e dados comerciais não são compartilhados.')}</span></div>
          {support.map(q => (
            <div className="item" key={q.id}>
              <div className="between">
                <strong>{full ? `${q.name} · ${q.place}` : t(ufRegion(q.place))}</strong>
                <span className="chip t-blue">{q.units}× EVD002-60KW</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {q.files.filter(f => !/contrato/i.test(f.name)).map(f => (
                  <span key={f.name} className="chip t-gray">{f.name} · v{f.ver}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="card pad-lg" aria-label={t('Ordens de compra')}>
        <div className="between"><h2>{t('Ordens de compra')}</h2><span className="muted small">{t('Você confirma o recebimento e atualiza o status')}</span></div>
        <div className="table-wrap">
          <table style={{ minWidth: 900 }}>
            <thead><tr>{COLS.map((c, i) => <th key={i}>{c ? t(c) : ''}</th>)}</tr></thead>
            <tbody>
              {state.pos.map(o => {
                const last = o.status === PO_FLOW.length - 1;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.id}</td>
                    <td>{full ? o.full : t(o.region)}</td>
                    <td>{t(o.kind)}</td>
                    <td>{o.qty}</td>
                    <td><span className={`chip ${STATUS_TONE[o.status]}`}>{t(PO_FLOW[o.status])}</span></td>
                    <td className="muted">{t(o.eta)}</td>
                    <td className="muted">{t(o.done)}</td>
                    <td style={{ textAlign: 'right', paddingRight: 0 }}>
                      <button className="btn sm" disabled={last} onClick={() => { setEdit(o); setNext(o.status + 1); }}>
                        {last ? '✓' : t('Atualizar status')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note">{t('Fluxo do status')}: {PO_FLOW.map(s => t(s)).join(' · ')}.</p>
      </section>

      <p className="note">{t('Dados ilustrativos.')}</p>

      {edit && (
        <Modal
          title={`${t('Atualizar status')} · ${edit.id}`}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEdit(null)}>{t('Cancelar')}</button>
              <button
                className="btn primary"
                onClick={() => {
                  dispatch({ type: 'ADVANCE_PO', id: edit.id, status: next });
                  toast(t('{id}: {status}.', { id: edit.id, status: t(PO_FLOW[next]) }), 'ok');
                  setEdit(null);
                }}
              >
                {t('Confirmar')}
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>{full ? edit.full : t(edit.region)} · {edit.qty}× EVD002-60KW</p>
          <div className="stack" style={{ gap: 8 }}>
            {PO_FLOW.map((s, i) => {
              const past = i <= edit.status;
              return (
                <label key={s} className={`option ${next === i ? 'sel' : ''} ${past ? 'off' : ''}`}>
                  <input type="radio" name="st" disabled={past} checked={next === i} onChange={() => setNext(i)} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{t(s)}</span>
                  {i === edit.status && <span className="chip t-gray">{t('atual')}</span>}
                  {i < edit.status && <span className="small muted">✓</span>}
                </label>
              );
            })}
          </div>
        </Modal>
      )}

      {fwd && (
        <Modal
          title={t('Encaminhar lead à SASO')}
          onClose={() => setFwd(false)}
          footer={
            <>
              <button className="btn" onClick={() => setFwd(false)}>{t('Cancelar')}</button>
              <button
                className="btn dark"
                disabled={!form.name.trim() || !form.place.trim()}
                onClick={() => {
                  dispatch({ type: 'FORWARD_LEAD', ...form });
                  toast(t('Lead {name} encaminhado à SASO.', { name: form.name }), 'ok');
                  setForm({ name: '', place: '', kind: SITE_TYPES[0] });
                  setFwd(false);
                }}
              >
                {t('Encaminhar')}
              </button>
            </>
          }
        >
          <label className="field"><span>{t('Nome do cliente ou local')}</span><input className="input" autoFocus value={form.name} placeholder={t('Ex.: Rede Postos Horizonte')} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
          <label className="field"><span>{t('Cidade (UF)')}</span><input className="input" value={form.place} placeholder={t('Ex.: Uberlândia (MG)')} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} /></label>
          <label className="field">
            <span>{t('Tipo de local')}</span>
            <select className="select" value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>
              {SITE_TYPES.map(k => <option key={k} value={k}>{t(k)}</option>)}
            </select>
          </label>
          <p className="note">{t('A SASO recebe o lead e escolhe o integrador credenciado da região.')}</p>
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
