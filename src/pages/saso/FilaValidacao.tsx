import { useEffect, useMemo, useState } from 'react';
import { AppShell, Modal } from '../../components/ui';
import { INTEGRADOR, useStore, type FileRef, type QueueItem } from '../../state/store';
import { useT } from '../../i18n';

const INTEGRADORES = [
  { name: INTEGRADOR, level: 'Certificado', region: 'Goiânia (GO)', active: 7 },
  { name: 'Eletro Cerrado Ltda', level: 'Certificado', region: 'Anápolis (GO)', active: 5 },
  { name: 'Voltagem Sul Ltda', level: 'Credenciado', region: 'Goiânia (GO)', active: 3 },
  { name: 'Norte Energia Integração', level: 'Credenciado', region: 'Palmas (TO)', active: 1 },
];

function chip(q: QueueItem): { text: string; long: string; cls: string } {
  if (q.daysLeft === 0) return { text: 'Vence hoje', long: 'Vence hoje', cls: 't-red' };
  if (q.daysLeft === 1) return { text: '1 dia útil', long: '1 dia útil restante', cls: 't-amber' };
  return { text: '{n} dias úteis', long: '{n} dias úteis restantes', cls: 't-blue' };
}

export default function FilaValidacao() {
  const { state, dispatch, toast } = useStore();
  const { t, money, lang } = useT();
  const queue = useMemo(() => state.queue.filter(q => q.status === 'fila').sort((a, b) => a.daysLeft - b.daysLeft), [state.queue]);
  const [selId, setSelId] = useState<string | undefined>(queue[0]?.id);
  const sel = queue.find(q => q.id === selId) ?? queue[0];

  const [price, setPrice] = useState('');
  const [validade, setValidade] = useState('');
  const [cond, setCond] = useState('');
  const [comment, setComment] = useState('');
  const [errs, setErrs] = useState<{ price?: boolean; comment?: boolean }>({});
  const [assign, setAssign] = useState<string | null>(null);
  const [chosen, setChosen] = useState(INTEGRADOR);

  useEffect(() => { setPrice(''); setComment(''); setErrs({}); }, [sel?.id]);
  useEffect(() => { setValidade(t('60 dias')); setCond(t('4 parcelas: 25% · 25% · 35% · 15%')); }, [sel?.id, lang, t]);

  const brl = (digits: string) => (digits ? money(Number(digits) / 100) : '');
  const fileVer = (f: FileRef) =>
    [`v${f.ver}`, f.latest ? t('última versão') : '', f.count ? t(f.count === 1 ? '{n} arquivo' : '{n} arquivos', { n: f.count }) : '']
      .filter(Boolean).join(' · ');

  const decide = (decision: 'aprovado' | 'ajustes' | 'reprovado') => {
    if (!sel) return;
    const e: typeof errs = {};
    if (!comment.trim()) e.comment = true;
    if (decision === 'aprovado' && !price) e.price = true;
    setErrs(e);
    if (Object.keys(e).length) return;
    dispatch({ type: 'DECIDE', id: sel.id, decision, comment: comment.trim() });
    const msg = {
      aprovado: '{name} aprovado. Proposta final gerada e enviada ao integrador.',
      ajustes: 'Ajustes pedidos para {name}. O integrador já foi avisado.',
      reprovado: '{name} reprovado. O integrador já foi avisado.',
    }[decision];
    toast(t(msg, { name: sel.name }), decision === 'aprovado' ? 'ok' : 'info');
    const next = queue.find(q => q.id !== sel.id);
    setSelId(next?.id);
  };

  const lead = state.distribute.find(d => d.id === assign);
  const units = (n: number) => t(n === 1 ? '{n} eletroposto' : '{n} eletropostos', { n });

  return (
    <AppShell profile="saso">
      <div>
        <h1>{t('Fila de validação técnica')}</h1>
        <p className="sub">{t('Ordenada por prazo. Meta: resposta em até 5 dias úteis.')}</p>
      </div>

      <div className="row">
        <section aria-label={t('Projetos na fila')} className="card" style={{ flex: '1 1 420px', maxWidth: 520, padding: 18, gap: 10 }}>
          <div className="between"><h2>{t('Projetos na fila')}</h2><span className="muted small">{t(queue.length === 1 ? '{n} projeto' : '{n} projetos', { n: queue.length })}</span></div>
          {queue.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('Fila zerada. Todos os projetos foram respondidos.')} 🎉</p>}
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
                  <span className={`chip ${c.cls}`}>{t(c.text, { n: q.daysLeft })}</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>{q.integrator.replace(/ Ltda$/, '')} · {q.place}</div>
              </button>
            );
          })}

          <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
            <h2 style={{ marginBottom: 10 }}>{t('Leads para distribuir')}</h2>
            {state.distribute.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('Nenhum lead aguardando distribuição.')}</p>}
            {state.distribute.map(l => (
              <div key={l.id} className="line-row" style={{ flexWrap: 'wrap' }}>
                <div><div style={{ fontWeight: 600 }}>{l.name}</div><div className="muted small">{t('{place} · origem: {origin}', { place: l.place, origin: t(l.origin) })}</div></div>
                <button className="btn sm" onClick={() => { setChosen(INTEGRADOR); setAssign(l.id); }}>{t('Escolher integrador')}</button>
              </div>
            ))}
          </div>
        </section>

        {sel ? (
          <section aria-label={t('Detalhe do projeto')} className="card" style={{ flex: '999 1 560px', padding: 24, gap: 18 }} key={sel.id}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 className="display" style={{ fontSize: 22 }}>{sel.name} · {sel.place}</h2>
                <div className="muted">{sel.integrator} · {units(sel.units)} EVD002-60KW</div>
              </div>
              <span className={`chip lg ${chip(sel).cls}`}>{t(chip(sel).long, { n: sel.daysLeft })}</span>
            </div>

            <div>
              <h3 style={{ marginBottom: 8 }}>{t('Premissas informadas')}</h3>
              <div className="grid-2" style={{ gap: '8px 24px' }}>
                {sel.premises.map(p => (
                  <div key={p.k} className="line-row" style={{ padding: '6px 0' }}>
                    <span className="muted">{t(p.k)}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{t(p.v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: 8 }}>{t('Arquivos (versão validada em destaque)')}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {sel.files.map((f, i) => (
                  <div key={f.name} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${i === 0 ? '#9CCDB3' : '#D5DBD3'}`, background: i === 0 ? '#F3FAF6' : '#FAFBF9' }}>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div className="muted small">{fileVer(f)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 18, borderRadius: 12, background: '#EEF2FB', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="between">
                <h3>{t('Preço fechado do Full EPC')}</h3>
                <span style={{ fontSize: 12, color: 'var(--blue-dark)', fontWeight: 600 }}>{t('Visível apenas para SASO e para o integrador dono da proposta')}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <label className="field" style={{ flex: '1 1 220px' }}>
                  <span>{t('Valor único (R$)')}</span>
                  <input
                    className={`input ${errs.price ? 'err' : ''}`}
                    inputMode="numeric"
                    placeholder={t('[VALOR DO EPC]')}
                    value={brl(price)}
                    onChange={e => { setPrice(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)); setErrs(x => ({ ...x, price: undefined })); }}
                    style={{ borderColor: errs.price ? undefined : '#AAB8DA' }}
                  />
                  {errs.price && <span className="err-msg">{t('Informe o valor do EPC para gerar a proposta final.')}</span>}
                </label>
                <label className="field" style={{ flex: '1 1 220px' }}>
                  <span>{t('Validade da proposta')}</span>
                  <input className="input" value={validade} onChange={e => setValidade(e.target.value)} style={{ borderColor: '#AAB8DA' }} />
                </label>
                <label className="field" style={{ flex: '1 1 220px' }}>
                  <span>{t('Condição de pagamento')}</span>
                  <input className="input" value={cond} onChange={e => setCond(e.target.value)} style={{ borderColor: '#AAB8DA' }} />
                </label>
              </div>
            </div>

            <label className="field">
              <span>{t('Comentário para o integrador (obrigatório)')}</span>
              <textarea
                className={`textarea ${errs.comment ? 'err' : ''}`}
                rows={3}
                value={comment}
                placeholder={t('Ex.: Projeto aprovado. Confirmar o trajeto do cabeamento na visita de instalação.')}
                onChange={e => { setComment(e.target.value); setErrs(x => ({ ...x, comment: undefined })); }}
              />
              {errs.comment && <span className="err-msg">{t('Escreva um comentário para o integrador.')}</span>}
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <button className="btn primary" onClick={() => decide('aprovado')}>{t('Aprovar e gerar proposta final')}</button>
              <button className="btn" onClick={() => decide('ajustes')}>{t('Pedir ajustes')}</button>
              <button className="btn danger" onClick={() => decide('reprovado')}>{t('Reprovar')}</button>
              <button
                className="btn"
                style={{ marginLeft: 'auto' }}
                disabled={sel.supplierSupport}
                onClick={() => { dispatch({ type: 'SUPPLIER_SUPPORT', id: sel.id }); toast(t('Apoio técnico pedido ao fornecedor para {name}. Só os arquivos técnicos foram liberados.', { name: sel.name }), 'info'); }}
              >
                {sel.supplierSupport ? `✓ ${t('Apoio do fornecedor solicitado')}` : t('Solicitar apoio técnico do fornecedor')}
              </button>
            </div>
            <p className="note">{t('O apoio técnico do fornecedor libera apenas os arquivos técnicos deste projeto, sem preços.')}</p>
          </section>
        ) : (
          <section className="card" style={{ flex: '999 1 560px', padding: 40, alignItems: 'center', textAlign: 'center' }}>
            <h2 className="display" style={{ fontSize: 22 }}>{t('Nenhum projeto aguardando validação')}</h2>
            <p className="muted" style={{ margin: 0 }}>{t('Quando um integrador enviar um projeto, ele aparece aqui, ordenado por prazo.')}</p>
          </section>
        )}
      </div>
      <p className="note">{t('Dados e nomes ilustrativos.')}</p>

      {lead && (
        <Modal
          title={t('Distribuir: {name}', { name: lead.name })}
          onClose={() => setAssign(null)}
          footer={
            <>
              <button className="btn" onClick={() => setAssign(null)}>{t('Cancelar')}</button>
              <button
                className="btn primary"
                onClick={() => {
                  dispatch({ type: 'ASSIGN_LEAD', id: lead.id, integrator: chosen });
                  toast(t('{name} enviado para {integrator}. Prazo de aceite: 48 h.', { name: lead.name, integrator: chosen }), 'ok', chosen === INTEGRADOR ? { label: t('Ver no office do integrador'), to: '/integrador' } : undefined);
                  setAssign(null);
                }}
              >
                {t('Enviar lead')}
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>{t('{place} · origem: {origin}. O integrador tem 48 horas para aceitar.', { place: lead.place, origin: t(lead.origin) })}</p>
          <div className="stack" style={{ gap: 8 }}>
            {INTEGRADORES.map(i => (
              <label key={i.name} className={`option ${chosen === i.name ? 'sel' : ''}`}>
                <input type="radio" name="integ" checked={chosen === i.name} onChange={() => setChosen(i.name)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  <div className="muted small">{t('{region} · {n} projetos ativos', { region: i.region, n: i.active })}</div>
                </div>
                <span className={`chip ${i.level === 'Certificado' ? 't-green' : 't-blue'}`}>{t(i.level)}</span>
              </label>
            ))}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
