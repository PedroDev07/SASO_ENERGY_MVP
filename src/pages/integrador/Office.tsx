import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell, Modal } from '../../components/ui';
import { INTEGRADOR, PROJECT_STEPS, STAGES, useStore, type QueueItem } from '../../state/store';

const SHORT_STEPS = ['Proposta aceita', 'Projeto validado', 'Ordem de compra', 'Equip. disponível', 'Instalação', 'Comissionamento'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function validationChip(q: QueueItem): { text: string; tone: string; pct: number; bar: string } {
  if (q.status === 'aprovado') return { text: 'Aprovado · proposta final emitida', tone: 't-green', pct: 100, bar: 'var(--green)' };
  if (q.status === 'ajustes') return { text: 'Ajustes solicitados', tone: 't-amber', pct: 100, bar: 'var(--amber)' };
  if (q.status === 'reprovado') return { text: 'Reprovado', tone: 't-red', pct: 100, bar: 'var(--red)' };
  const pct = Math.round(((5 - q.daysLeft) / 5) * 100);
  if (q.daysLeft === 0) return { text: 'Vence hoje', tone: 't-red', pct: 100, bar: 'var(--red)' };
  if (q.daysLeft === 1) return { text: '1 dia útil restante', tone: 't-amber', pct, bar: 'var(--amber)' };
  return { text: `${q.daysLeft} de 5 dias úteis restantes`, tone: 't-blue', pct: Math.max(pct, 6), bar: 'var(--blue)' };
}

export default function Office() {
  const { state, dispatch, toast } = useStore();
  const navigate = useNavigate();
  const [docModal, setDocModal] = useState(false);
  const [docFile, setDocFile] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pending = state.leads.filter(l => l.status === 'aguardando');
  const accepted = state.leads.filter(l => l.status === 'aceito');
  const mine = state.queue.filter(q => q.integrator === INTEGRADOR);
  const inValidation = mine.filter(q => q.status === 'fila').length;
  const total = state.pipeline.reduce((a, b) => a + b, 0);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <AppShell profile="integrador" wide>
        <header className="between" style={{ alignItems: 'center' }}>
          <div>
            <h1>{greeting()}, Integrador Exemplo</h1>
            <p className="sub">
              Você tem {plural(pending.length, 'lead', 'leads')} para aceitar e {plural(inValidation, 'projeto', 'projetos')} em validação.
            </p>
          </div>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <Link to="/integrador/pre-proposta" className="btn primary">Gerar pré-proposta</Link>
            <Link to="/integrador/pre-proposta#premissas" className="btn">Enviar projeto</Link>
          </div>
        </header>

        {state.docAlert && (
          <section className="alert" aria-label="Alerta de documento">
            <span><strong>Documento perto do vencimento:</strong> certificado NR-35 da equipe vence em 21 dias. Após o vencimento, o acesso é bloqueado.</span>
            <button className="link" onClick={() => setDocModal(true)}>Atualizar documento</button>
          </section>
        )}

        <section className="card" aria-label="Pipeline por etapa">
          <div className="between">
            <h2>Minha pipeline</h2>
            <span className="muted" style={{ fontSize: 13 }}>{total} oportunidades</span>
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
                    <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 2 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="row" style={{ alignItems: 'stretch' }}>
          <section className="card grow" aria-label="Leads aguardando aceite">
            <h2>Leads aguardando aceite</h2>
            {pending.length === 0 && accepted.length === 0 && <p className="muted" style={{ margin: 0 }}>Nenhum lead aguardando. Novos leads chegam pela SASO.</p>}
            {pending.map(l => {
              const urgent = l.hoursLeft <= 12;
              const pct = Math.round(((48 - l.hoursLeft) / 48) * 100);
              return (
                <div className="item" key={l.id}>
                  <div className="between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{l.place} · {l.kind}</div>
                    </div>
                    <span className={`chip ${urgent ? 't-red' : 't-blue'}`}>Faltam {l.hoursLeft} h</span>
                  </div>
                  <div className="bar"><div style={{ width: `${Math.max(pct, 4)}%`, background: urgent ? 'var(--red)' : 'var(--blue)' }} /></div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn primary sm"
                      onClick={() => {
                        dispatch({ type: 'ACCEPT_LEAD', id: l.id });
                        toast(`Lead ${l.name} aceito. A oportunidade fica protegida por 45 dias.`, 'ok', { label: 'Gerar pré-proposta', to: '/integrador/pre-proposta' });
                      }}
                    >
                      Aceitar
                    </button>
                    <button
                      className="btn sm"
                      onClick={() => {
                        dispatch({ type: 'REFUSE_LEAD', id: l.id });
                        toast(`${l.name} voltou para a SASO redistribuir.`, 'info');
                      }}
                    >
                      Recusar
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
                    <div className="muted" style={{ fontSize: 13 }}>{l.place} · {l.kind}</div>
                  </div>
                  <span className="chip t-green">Aceito · protegido 45 dias</span>
                </div>
                <div><Link className="link" to="/integrador/pre-proposta">Gerar pré-proposta →</Link></div>
              </div>
            ))}
            <p className="note">Sem resposta em 48 horas, o lead volta para a SASO redistribuir.</p>
          </section>

          <section className="card grow" aria-label="Projetos aguardando validação">
            <h2>Aguardando validação da engenharia</h2>
            {mine.length === 0 && <p className="muted" style={{ margin: 0 }}>Nenhum projeto em validação.</p>}
            {mine.map(q => {
              const c = validationChip(q);
              return (
                <div className="item" key={q.id}>
                  <div className="between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{q.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{q.place} · {q.units} {q.units === 1 ? 'eletroposto' : 'eletropostos'}</div>
                    </div>
                    <span className={`chip ${c.tone}`}>{c.text}</span>
                  </div>
                  <div className="bar"><div style={{ width: `${c.pct}%`, background: c.bar }} /></div>
                  {q.comment && q.status !== 'fila' && <div className="small muted">Engenharia: “{q.comment}”</div>}
                </div>
              );
            })}
            <p className="note">Prazo de 5 dias úteis a partir do envio.</p>
          </section>
        </div>

        <section className="card" aria-label="Projetos em andamento" style={{ gap: 14 }}>
          <div className="between">
            <h2>Projetos em andamento</h2>
            <Link to="/integrador/projetos/hotel-planalto" className="link">Ver painel de etapas</Link>
          </div>
          <div className="table-wrap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 760 }}>
              {state.projects.map(p => (
                <Link
                  key={p.id}
                  to={`/integrador/projetos/${p.id}`}
                  className="proj-row"
                  title={`Etapa atual: ${PROJECT_STEPS[p.step]}`}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1.2fr) repeat(6,minmax(70px,1fr))', gap: 8, alignItems: 'center', padding: '8px', margin: '0 -8px', borderRadius: 10 }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{p.place}</div>
                  </div>
                  {SHORT_STEPS.map((l, i) => (
                    <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 8, borderRadius: 99, background: i < p.step ? 'var(--green)' : i === p.step ? 'var(--amber-flag)' : 'var(--track)' }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l}</div>
                    </div>
                  ))}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="row" style={{ alignItems: 'stretch' }}>
          <section className="card grow" aria-label="Proteção de oportunidades" style={{ gap: 0 }}>
            <h2 style={{ marginBottom: 10 }}>Proteção de oportunidades</h2>
            {state.protections.map(o => (
              <div className="line-row" key={o.name}>
                <span>{o.name}</span>
                <span style={{ fontWeight: 600, color: o.days <= 3 ? 'var(--red)' : o.days <= 7 ? '#8A5A00' : 'var(--ink)' }}>{o.days} dias</span>
              </div>
            ))}
            <p className="note" style={{ marginTop: 10 }}>Cada oportunidade registrada fica garantida a você por 45 dias.</p>
          </section>
          <section className="card grow" aria-label="Avisos da SASO">
            <h2>Avisos da SASO</h2>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--green-soft)' }}>
              <strong>Novo produto no catálogo.</strong>
              <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>Ficha técnica do EVD002-60KW atualizada.</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg)' }}>
              <strong>Treinamento de comissionamento.</strong>
              <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>Material de apoio disponível em Documentos.</div>
            </div>
          </section>
        </div>

        <p className="note">Dados e nomes ilustrativos.</p>

      {docModal && (
        <Modal
          title="Atualizar certificado NR-35"
          onClose={() => setDocModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setDocModal(false)}>Cancelar</button>
              <button
                className="btn primary"
                disabled={!docFile}
                onClick={() => {
                  dispatch({ type: 'DOC_ALERT_RESOLVED' });
                  setDocModal(false);
                  toast('Certificado enviado. A SASO vai analisar o documento.', 'ok');
                  navigate('/integrador');
                }}
              >
                Enviar documento
              </button>
            </>
          }
        >
          <p className="muted" style={{ margin: 0 }}>Envie o certificado atualizado. Seu acesso continua liberado enquanto a SASO analisa.</p>
          <div className={`drop ${docFile ? 'filled' : ''}`} onClick={() => fileRef.current?.click()}>
            <strong>{docFile || 'Escolher arquivo'}</strong>
            <div className="small" style={{ marginTop: 4 }}>{docFile ? 'Toque para trocar' : 'PDF ou imagem'}</div>
          </div>
          <input ref={fileRef} type="file" hidden accept=".pdf,image/*" onChange={e => setDocFile(e.target.files?.[0]?.name ?? '')} />
        </Modal>
      )}
    </AppShell>
  );
}
