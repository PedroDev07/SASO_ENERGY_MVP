import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell, Modal } from '../../components/ui';
import { INTEGRADOR, PROJECT_STEPS, STAGES, useStore, type QueueItem } from '../../state/store';
import { useT } from '../../i18n';

const SHORT_STEPS = ['Proposta aceita', 'Projeto validado', 'Ordem de compra', 'Equip. disponível', 'Instalação', 'Comissionamento'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia, {name}' : h < 18 ? 'Boa tarde, {name}' : 'Boa noite, {name}';
}

function validationChip(q: QueueItem): { text: string; vars?: Record<string, number>; tone: string; pct: number; bar: string } {
  if (q.status === 'aprovado') return { text: 'Aprovado · proposta final emitida', tone: 't-green', pct: 100, bar: 'var(--green)' };
  if (q.status === 'ajustes') return { text: 'Ajustes solicitados', tone: 't-amber', pct: 100, bar: 'var(--amber)' };
  if (q.status === 'reprovado') return { text: 'Reprovado', tone: 't-red', pct: 100, bar: 'var(--red)' };
  const pct = Math.round(((5 - q.daysLeft) / 5) * 100);
  if (q.daysLeft === 0) return { text: 'Vence hoje', tone: 't-red', pct: 100, bar: 'var(--red)' };
  if (q.daysLeft === 1) return { text: '1 dia útil restante', tone: 't-amber', pct, bar: 'var(--amber)' };
  return { text: '{n} de 5 dias úteis restantes', vars: { n: q.daysLeft }, tone: 't-blue', pct: Math.max(pct, 6), bar: 'var(--blue)' };
}

export default function Office() {
  const { state, dispatch, toast } = useStore();
  const { t } = useT();
  const navigate = useNavigate();
  const [docModal, setDocModal] = useState(false);
  const [docFile, setDocFile] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pending = state.leads.filter(l => l.status === 'aguardando');
  const accepted = state.leads.filter(l => l.status === 'aceito');
  const mine = state.queue.filter(q => q.integrator === INTEGRADOR);
  const inValidation = mine.filter(q => q.status === 'fila').length;
  const total = state.pipeline.reduce((a, b) => a + b, 0);

  return (
    <AppShell profile="integrador" wide>
      <header className="between" style={{ alignItems: 'center' }}>
        <div>
          <h1>{t(greeting(), { name: 'Integrador Exemplo' })}</h1>
          <p className="sub">
            {t('Você tem {leads} para aceitar e {projetos} em validação.', {
              leads: t(pending.length === 1 ? '{n} lead' : '{n} leads', { n: pending.length }),
              projetos: t(inValidation === 1 ? '{n} projeto' : '{n} projetos', { n: inValidation }),
            })}
          </p>
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <Link to="/integrador/pre-proposta" className="btn primary">{t('Gerar pré-proposta')}</Link>
          <Link to="/integrador/pre-proposta#premissas" className="btn">{t('Enviar projeto')}</Link>
        </div>
      </header>

      {state.docAlert && (
        <section className="alert" aria-label={t('Alerta de documento')}>
          <span><strong>{t('Documento perto do vencimento:')}</strong> {t('certificado NR-35 da equipe vence em 21 dias. Após o vencimento, o acesso é bloqueado.')}</span>
          <button className="link" onClick={() => setDocModal(true)}>{t('Atualizar documento')}</button>
        </section>
      )}

      <section className="card" aria-label={t('Minha pipeline')}>
        <div className="between">
          <h2>{t('Minha pipeline')}</h2>
          <span className="muted" style={{ fontSize: 13 }}>{t('{n} oportunidades', { n: total })}</span>
        </div>
        <div className="table-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(104px, 1fr))', gap: 8, minWidth: 960 }}>
            {STAGES.map((label, i) => {
              const lost = i === 8, late = i >= 6;
              return (
                <div key={label} style={{ padding: 12, borderRadius: 10, background: lost ? '#F6E4E2' : late ? 'var(--green-soft)' : 'var(--gray-soft)' }}>
                  <div className="display" style={{ fontSize: 26, fontWeight: 700, color: lost ? 'var(--red)' : late ? 'var(--green)' : 'var(--ink)' }}>
                    {state.pipeline[i]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{t(label)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card grow" aria-label={t('Leads aguardando aceite')}>
          <h2>{t('Leads aguardando aceite')}</h2>
          {pending.length === 0 && accepted.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('Nenhum lead aguardando. Novos leads chegam pela SASO.')}</p>}
          {pending.map(l => {
            const urgent = l.hoursLeft <= 12;
            const pct = Math.round(((48 - l.hoursLeft) / 48) * 100);
            return (
              <div className="item" key={l.id}>
                <div className="between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{l.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{l.place} · {t(l.kind)}</div>
                  </div>
                  <span className={`chip ${urgent ? 't-red' : 't-blue'}`}>{t('Faltam {n} h', { n: l.hoursLeft })}</span>
                </div>
                <div className="bar"><div style={{ width: `${Math.max(pct, 4)}%`, background: urgent ? 'var(--red)' : 'var(--blue)' }} /></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn primary sm"
                    onClick={() => {
                      dispatch({ type: 'ACCEPT_LEAD', id: l.id });
                      toast(t('Lead {name} aceito. A oportunidade fica protegida por 45 dias.', { name: l.name }), 'ok', { label: t('Gerar pré-proposta'), to: '/integrador/pre-proposta' });
                    }}
                  >
                    {t('Aceitar')}
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => {
                      dispatch({ type: 'REFUSE_LEAD', id: l.id });
                      toast(t('{name} voltou para a SASO redistribuir.', { name: l.name }), 'info');
                    }}
                  >
                    {t('Recusar')}
                  </button>
                </div>
              </div>
            );
          })}
          {accepted.map(l => (
            <div className="item" key={l.id} style={{ background: '#FAFCFA' }}>
              <div className="between">
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{l.place} · {t(l.kind)}</div>
                </div>
                <span className="chip t-green">{t('Aceito · protegido 45 dias')}</span>
              </div>
              <div><Link className="link" to="/integrador/pre-proposta">{t('Gerar pré-proposta')} →</Link></div>
            </div>
          ))}
          <p className="note">{t('Sem resposta em 48 horas, o lead volta para a SASO redistribuir.')}</p>
        </section>

        <section className="card grow" aria-label={t('Aguardando validação da engenharia')}>
          <h2>{t('Aguardando validação da engenharia')}</h2>
          {mine.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('Nenhum projeto em validação.')}</p>}
          {mine.map(q => {
            const c = validationChip(q);
            return (
              <div className="item" key={q.id}>
                <div className="between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{q.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{q.place} · {t(q.units === 1 ? '{n} eletroposto' : '{n} eletropostos', { n: q.units })}</div>
                  </div>
                  <span className={`chip ${c.tone}`}>{t(c.text, c.vars)}</span>
                </div>
                <div className="bar"><div style={{ width: `${c.pct}%`, background: c.bar }} /></div>
                {q.comment && q.status !== 'fila' && <div className="small muted">{t('Engenharia:')} “{q.comment}”</div>}
              </div>
            );
          })}
          <p className="note">{t('Prazo de 5 dias úteis a partir do envio.')}</p>
        </section>
      </div>

      <section className="card" aria-label={t('Projetos em andamento')} style={{ gap: 14 }}>
        <div className="between">
          <h2>{t('Projetos em andamento')}</h2>
          <Link to="/integrador/projetos/hotel-planalto" className="link">{t('Ver painel de etapas')}</Link>
        </div>
        <div className="table-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 760 }}>
            {state.projects.map(p => (
              <Link
                key={p.id}
                to={`/integrador/projetos/${p.id}`}
                className="proj-row"
                title={t('Etapa atual: {etapa}', { etapa: t(PROJECT_STEPS[p.step]) })}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1.2fr) repeat(6,minmax(70px,1fr))', gap: 8, alignItems: 'center', padding: '8px', margin: '0 -8px', borderRadius: 10 }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{p.place}</div>
                </div>
                {SHORT_STEPS.map((l, i) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 8, borderRadius: 99, background: i < p.step ? 'var(--green)' : i === p.step ? 'var(--amber-flag)' : 'var(--track)' }} />
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t(l)}</div>
                  </div>
                ))}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card grow" aria-label={t('Proteção de oportunidades')} style={{ gap: 0 }}>
          <h2 style={{ marginBottom: 10 }}>{t('Proteção de oportunidades')}</h2>
          {state.protections.map(o => (
            <div className="line-row" key={o.name}>
              <span>{o.name}</span>
              <span style={{ fontWeight: 600, color: o.days <= 3 ? 'var(--red)' : o.days <= 7 ? '#8A5A00' : 'var(--ink)' }}>{t('{n} dias', { n: o.days })}</span>
            </div>
          ))}
          <p className="note" style={{ marginTop: 10 }}>{t('Cada oportunidade registrada fica garantida a você por 45 dias.')}</p>
        </section>
        <section className="card grow" aria-label={t('Avisos da SASO')}>
          <h2>{t('Avisos da SASO')}</h2>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--green-soft)' }}>
            <strong>{t('Novo produto no catálogo.')}</strong>
            <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>{t('Ficha técnica do EVD002-60KW atualizada.')}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg)' }}>
            <strong>{t('Treinamento de comissionamento.')}</strong>
            <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>{t('Material de apoio disponível em Documentos.')}</div>
          </div>
        </section>
      </div>

      <p className="note">{t('Dados e nomes ilustrativos.')}</p>

      {docModal && (
        <Modal
          title={t('Atualizar certificado NR-35')}
          onClose={() => setDocModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setDocModal(false)}>{t('Cancelar')}</button>
              <button
                className="btn primary"
                disabled={!docFile}
                onClick={() => {
                  dispatch({ type: 'DOC_ALERT_RESOLVED' });
                  setDocModal(false);
                  toast(t('Certificado enviado. A SASO vai analisar o documento.'), 'ok');
                  navigate('/integrador');
                }}
              >
                {t('Enviar documento')}
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>{t('Envie o certificado atualizado. Seu acesso continua liberado enquanto a SASO analisa.')}</p>
          <div className={`drop ${docFile ? 'filled' : ''}`} onClick={() => fileRef.current?.click()}>
            <strong>{docFile || t('Escolher arquivo')}</strong>
            <div className="small" style={{ marginTop: 4 }}>{docFile ? t('Toque para trocar') : t('PDF ou imagem')}</div>
          </div>
          <input ref={fileRef} type="file" hidden accept=".pdf,image/*" onChange={e => setDocFile(e.target.files?.[0]?.name ?? '')} />
        </Modal>
      )}
    </AppShell>
  );
}
