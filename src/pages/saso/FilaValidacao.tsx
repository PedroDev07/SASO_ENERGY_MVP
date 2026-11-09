import { useEffect, useMemo, useState } from 'react';
import { AppShell, Modal } from '../../components/ui';
import { INTEGRADOR, useStore, type QueueItem } from '../../state/store';

const INTEGRADORES = [
  { name: INTEGRADOR, level: 'Certificado', region: 'Goiânia (GO)', active: 7 },
  { name: 'Eletro Cerrado Ltda', level: 'Certificado', region: 'Anápolis (GO)', active: 5 },
  { name: 'Voltagem Sul Ltda', level: 'Credenciado', region: 'Goiânia (GO)', active: 3 },
  { name: 'Norte Energia Integração', level: 'Credenciado', region: 'Palmas (TO)', active: 1 },
];

function chip(q: QueueItem) {
  if (q.daysLeft === 0) return { text: 'Vence hoje', cls: 't-red' };
  if (q.daysLeft === 1) return { text: '1 dia útil', cls: 't-amber' };
  return { text: `${q.daysLeft} dias úteis`, cls: 't-blue' };
}

const brl = (digits: string) => {
  if (!digits) return '';
  const n = Number(digits) / 100;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function FilaValidacao() {
  const { state, dispatch, toast } = useStore();
  const queue = useMemo(() => state.queue.filter(q => q.status === 'fila').sort((a, b) => a.daysLeft - b.daysLeft), [state.queue]);
  const [selId, setSelId] = useState<string | undefined>(queue[0]?.id);
  const sel = queue.find(q => q.id === selId) ?? queue[0];

  const [price, setPrice] = useState('');
  const [validade, setValidade] = useState('60 dias');
  const [cond, setCond] = useState('4 parcelas: 25% · 25% · 35% · 15%');
  const [comment, setComment] = useState('');
  const [errs, setErrs] = useState<{ price?: string; comment?: string }>({});
  const [assign, setAssign] = useState<string | null>(null);
  const [chosen, setChosen] = useState(INTEGRADOR);

  useEffect(() => { setPrice(''); setComment(''); setErrs({}); }, [sel?.id]);

  const decide = (decision: 'aprovado' | 'ajustes' | 'reprovado') => {
    if (!sel) return;
    const e: typeof errs = {};
    if (!comment.trim()) e.comment = 'Escreva um comentário para o integrador.';
    if (decision === 'aprovado' && !price) e.price = 'Informe o valor do EPC para gerar a proposta final.';
    setErrs(e);
    if (Object.keys(e).length) return;
    dispatch({ type: 'DECIDE', id: sel.id, decision, comment: comment.trim() });
    const msg = {
      aprovado: `${sel.name} aprovado. Proposta final gerada e enviada ao integrador.`,
      ajustes: `Ajustes pedidos para ${sel.name}. O integrador já foi avisado.`,
      reprovado: `${sel.name} reprovado. O integrador já foi avisado.`,
    }[decision];
    toast(msg, decision === 'aprovado' ? 'ok' : 'info');
    const next = queue.find(q => q.id !== sel.id);
    setSelId(next?.id);
  };

  const lead = state.distribute.find(d => d.id === assign);

  return (
    <AppShell profile="saso">
        <div>
          <h1>Fila de validação técnica</h1>
          <p className="sub">Ordenada por prazo. Meta: resposta em até 5 dias úteis.</p>
        </div>

        <div className="row">
          <section aria-label="Fila" className="card" style={{ flex: '1 1 420px', maxWidth: 520, padding: 18, gap: 10 }}>
            <div className="between"><h2>Projetos na fila</h2><span className="muted small">{queue.length} {queue.length === 1 ? 'projeto' : 'projetos'}</span></div>
            {queue.length === 0 && <p className="muted" style={{ margin: 0 }}>Fila zerada. Todos os projetos foram respondidos. 🎉</p>}
            {queue.map(q => {
              const c = chip(q);
              const on = q.id === sel?.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelId(q.id)}
                  aria-pressed={on}
                  style={{
                    textAlign: 'left', cursor: 'pointer', padding: '12px 14px', borderRadius: 12,
                    border: `1.5px solid ${on ? 'var(--saso)' : 'var(--line)'}`, background: on ? '#F3F6FD' : '#fff',
                    display: 'flex', flexDirection: 'column', gap: 6, transition: 'all .15s',
                  }}
                >
                  <div className="between" style={{ width: '100%' }}>
                    <strong>{q.name}</strong>
                    <span className={`chip ${c.cls}`}>{c.text}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{q.integrator.replace(/ Ltda$/, '')} · {q.place}</div>
                </button>
              );
            })}

            <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
              <h2 style={{ marginBottom: 10 }}>Leads para distribuir</h2>
              {state.distribute.length === 0 && <p className="muted" style={{ margin: 0 }}>Nenhum lead aguardando distribuição.</p>}
              {state.distribute.map(l => (
                <div key={l.id} className="line-row" style={{ flexWrap: 'wrap' }}>
                  <div><div style={{ fontWeight: 600 }}>{l.name}</div><div className="muted small">{l.place} · origem: {l.origin}</div></div>
                  <button className="btn sm" onClick={() => { setChosen(INTEGRADOR); setAssign(l.id); }}>Escolher integrador</button>
                </div>
              ))}
            </div>
          </section>

          {sel ? (
            <section aria-label="Detalhe do projeto" className="card" style={{ flex: '999 1 560px', padding: 24, gap: 18 }} key={sel.id}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h2 className="display" style={{ fontSize: 22 }}>{sel.name} · {sel.place}</h2>
                  <div className="muted">{sel.integrator} · {sel.units} {sel.units === 1 ? 'eletroposto' : 'eletropostos'} EVD002-60KW</div>
                </div>
                <span className={`chip lg ${chip(sel).cls}`}>{sel.daysLeft === 0 ? 'Vence hoje' : `${sel.daysLeft} ${sel.daysLeft === 1 ? 'dia útil restante' : 'dias úteis restantes'}`}</span>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>Premissas informadas</h3>
                <div className="grid-2" style={{ gap: '8px 24px' }}>
                  {sel.premises.map(p => (
                    <div key={p.k} className="line-row" style={{ padding: '6px 0' }}>
                      <span className="muted">{p.k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{p.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>Arquivos (versão validada em destaque)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {sel.files.map((f, i) => (
                    <div key={f.name} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${i === 0 ? '#9CCDB3' : '#D5DBD3'}`, background: i === 0 ? '#F3FAF6' : '#FAFBF9' }}>
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      <div className="muted small">{f.ver}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 12, background: '#EEF2FB', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="between">
                  <h3>Preço fechado do Full EPC</h3>
                  <span style={{ fontSize: 12, color: 'var(--blue-dark)', fontWeight: 600 }}>Visível apenas para SASO e para o integrador dono da proposta</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <label className="field" style={{ flex: '1 1 220px' }}>
                    <span>Valor único (R$)</span>
                    <input
                      className={`input ${errs.price ? 'err' : ''}`}
                      inputMode="numeric"
                      placeholder="[VALOR DO EPC]"
                      value={brl(price)}
                      onChange={e => { setPrice(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)); setErrs(x => ({ ...x, price: undefined })); }}
                      style={{ borderColor: errs.price ? undefined : '#AAB8DA' }}
                    />
                    {errs.price && <span className="err-msg">{errs.price}</span>}
                  </label>
                  <label className="field" style={{ flex: '1 1 220px' }}>
                    <span>Validade da proposta</span>
                    <input className="input" value={validade} onChange={e => setValidade(e.target.value)} style={{ borderColor: '#AAB8DA' }} />
                  </label>
                  <label className="field" style={{ flex: '1 1 220px' }}>
                    <span>Condição de pagamento</span>
                    <input className="input" value={cond} onChange={e => setCond(e.target.value)} style={{ borderColor: '#AAB8DA' }} />
                  </label>
                </div>
              </div>

              <label className="field">
                <span>Comentário para o integrador (obrigatório)</span>
                <textarea
                  className={`textarea ${errs.comment ? 'err' : ''}`}
                  rows={3}
                  value={comment}
                  placeholder="Ex.: Projeto aprovado. Confirmar o trajeto do cabeamento na visita de instalação."
                  onChange={e => { setComment(e.target.value); setErrs(x => ({ ...x, comment: undefined })); }}
                />
                {errs.comment && <span className="err-msg">{errs.comment}</span>}
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <button className="btn primary" onClick={() => decide('aprovado')}>Aprovar e gerar proposta final</button>
                <button className="btn" onClick={() => decide('ajustes')}>Pedir ajustes</button>
                <button className="btn danger" onClick={() => decide('reprovado')}>Reprovar</button>
                <button
                  className="btn"
                  style={{ marginLeft: 'auto' }}
                  disabled={sel.supplierSupport}
                  onClick={() => { dispatch({ type: 'SUPPLIER_SUPPORT', id: sel.id }); toast(`Apoio técnico pedido ao fornecedor para ${sel.name}. Só os arquivos técnicos foram liberados.`, 'info'); }}
                >
                  {sel.supplierSupport ? '✓ Apoio do fornecedor solicitado' : 'Solicitar apoio técnico do fornecedor'}
                </button>
              </div>
              <p className="note">O apoio técnico do fornecedor libera apenas os arquivos técnicos deste projeto, sem preços.</p>
            </section>
          ) : (
            <section className="card" style={{ flex: '999 1 560px', padding: 40, alignItems: 'center', textAlign: 'center' }}>
              <h2 className="display" style={{ fontSize: 22 }}>Nenhum projeto aguardando validação</h2>
              <p className="muted" style={{ margin: 0 }}>Quando um integrador enviar um projeto, ele aparece aqui, ordenado por prazo.</p>
            </section>
          )}
        </div>
        <p className="note">Dados e nomes ilustrativos.</p>

      {lead && (
        <Modal
          title={`Distribuir: ${lead.name}`}
          onClose={() => setAssign(null)}
          footer={
            <>
              <button className="btn" onClick={() => setAssign(null)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={() => {
                  dispatch({ type: 'ASSIGN_LEAD', id: lead.id, integrator: chosen });
                  toast(`${lead.name} enviado para ${chosen}. Prazo de aceite: 48 h.`, 'ok', chosen === INTEGRADOR ? { label: 'Ver no office do integrador', to: '/integrador' } : undefined);
                  setAssign(null);
                }}
              >
                Enviar lead
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>{lead.place} · origem: {lead.origin}. O integrador tem 48 horas para aceitar.</p>
          <div className="stack" style={{ gap: 8 }}>
            {INTEGRADORES.map(i => (
              <label key={i.name} className={`option ${chosen === i.name ? 'sel' : ''}`}>
                <input type="radio" name="integ" checked={chosen === i.name} onChange={() => setChosen(i.name)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  <div className="muted small">{i.region} · {i.active} projetos ativos</div>
                </div>
                <span className={`chip ${i.level === 'Certificado' ? 't-green' : 't-blue'}`}>{i.level}</span>
              </label>
            ))}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
