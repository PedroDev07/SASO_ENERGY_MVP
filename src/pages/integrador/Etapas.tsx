import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell, Modal } from '../../components/ui';
import { PO_FLOW, PROJECT_STEPS, useStore, type Project } from '../../state/store';

const CURRENT_LABEL = ['Proposta aceita', 'Validação do projeto', 'Ordem de compra', 'Equipamento disponível', 'Instalação', 'Comissionamento'];

const CATS = ['Fotos', 'Projeto elétrico', 'ART/TRT', 'Contrato assinado', 'Croqui', 'Outros'];

const EQUIP_TEXT: Record<number, string> = {
  0: 'Pedido confirmado', 1: 'Em produção', 2: 'Embarcado', 3: 'Em desembaraço aduaneiro',
  4: 'Liberado no armazém de São Paulo', 5: 'Liberado para transporte', 6: 'Entregue no local',
};

function equipment(p: Project, poStatus?: number) {
  if (poStatus !== undefined) return { text: EQUIP_TEXT[poStatus], delivered: poStatus === PO_FLOW.length - 1 };
  if (p.step < 2) return { text: 'Aguardando ordem de compra', delivered: false };
  if (p.step === 2) return { text: 'Em produção', delivered: false };
  return { text: 'Entregue no local', delivered: true };
}

export default function Etapas() {
  const { id = 'hotel-planalto' } = useParams();
  const { state, dispatch, toast } = useStore();
  const p = state.projects.find(x => x.id === id);
  const [modal, setModal] = useState(false);
  const [file, setFile] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!p) {
    return (
      <AppShell profile="integrador"><h1>Projeto não encontrado</h1><Link className="link" to="/integrador">Voltar ao office</Link></AppShell>
    );
  }

  const po = p.poId ? state.pos.find(x => x.id === p.poId) : undefined;
  const eq = equipment(p, po?.status);
  const stage = p.step >= 5 ? 'Em execução' : 'Contrato assinado';
  const existing = p.docs.find(d => d.name === file);

  const send = () => {
    dispatch({ type: 'UPLOAD_DOC', projectId: p.id, name: file, cat });
    toast(existing ? `${file} atualizado para a v${existing.ver + 1}. A versão anterior fica guardada.` : `${file} enviado ao projeto.`, 'ok');
    setModal(false); setFile('');
  };

  return (
    <AppShell profile="integrador">
        <div className="between" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Projeto · {stage}</div>
            <h1 style={{ marginTop: 2 }}>{p.name} · {p.place}</h1>
            <p className="sub">{p.units} eletropostos EVD002-60KW · Proposta nº {p.proposal}</p>
          </div>
          <span className="chip lg t-green">Etapa atual: {CURRENT_LABEL[p.step]}</span>
        </div>

        {state.projects.length > 1 && (
          <div className="seg" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
            {state.projects.map(x => (
              <Link key={x.id} to={`/integrador/projetos/${x.id}`} className={x.id === p.id ? 'on' : ''}>{x.name}</Link>
            ))}
          </div>
        )}

        <section aria-label="Linha do tempo" className="card pad-lg" style={{ gap: 16 }}>
          <h2>Linha do tempo</h2>
          <div className="table-wrap">
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(6,minmax(140px,1fr))', gap: 12, minWidth: 900 }}>
              {PROJECT_STEPS.map((label, i) => {
                const done = i < p.step, cur = i === p.step;
                return (
                  <li key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 8, borderRadius: 99, background: done ? 'var(--green)' : cur ? 'var(--amber-flag)' : 'var(--track)', transition: 'background .4s' }} />
                    <div style={{ fontWeight: 600, color: done || cur ? 'var(--ink)' : 'var(--muted)' }}>{label}</div>
                    <div className="muted small">{p.dates[i]}</div>
                    <span className={`chip ${done ? 't-green' : cur ? 't-amber' : 't-gray'}`}>{done ? 'Concluída' : cur ? 'Em andamento' : 'Pendente'}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <div className="row">
          <section aria-label="Equipamento" className="card pad-lg" style={{ flex: '1 1 360px' }}>
            <h2>Status do equipamento</h2>
            <div style={{ padding: 14, borderRadius: 12, background: 'var(--green-soft)' }}>
              <div style={{ fontSize: 12, color: 'var(--green-text)', fontWeight: 600 }}>Situação</div>
              <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-dark)' }}>{eq.text}</div>
              <div style={{ fontSize: 13, color: 'var(--green-text)', marginTop: 4 }}>
                {eq.delivered ? `Entregue em ${po?.done ?? p.dates[3]}` : 'Previsto para entrega no local: [DATA]'}
              </div>
            </div>
            <p className="note">Você acompanha apenas o status do equipamento. As informações de compra ficam com a SASO.</p>
          </section>

          <section aria-label="Pagamentos" className="card pad-lg" style={{ flex: '1 1 360px', gap: 0 }}>
            <h2 style={{ marginBottom: 8 }}>Status dos pagamentos a você</h2>
            {p.payments.map(x => (
              <div className="line-row" key={x.label} style={{ padding: '10px 0' }}>
                <span>{x.label}</span>
                <span className={`chip ${x.state === 'Pago' ? 't-green' : 't-amber'}`} style={{ alignSelf: 'center' }}>{x.state}</span>
              </div>
            ))}
            <p className="note" style={{ marginTop: 10 }}>Status atualizado pela SASO. Os valores não aparecem na plataforma.</p>
          </section>

          <section aria-label="Documentos" className="card pad-lg" style={{ flex: '1 1 360px', gap: 0 }}>
            <div className="between" style={{ marginBottom: 6 }}>
              <h2>Documentos do projeto</h2>
              <button className="link" onClick={() => setModal(true)}>Enviar arquivo</button>
            </div>
            {p.docs.map(d => (
              <div className="line-row" key={d.name}>
                <div><div style={{ fontWeight: 600 }}>{d.name}</div><div className="muted small">{d.cat}</div></div>
                <span className="muted small">v{d.ver}{d.validated ? ' · validada' : ''}</span>
              </div>
            ))}
          </section>
        </div>

        <section aria-label="Registro de acessos" className="card pad-lg" style={{ gap: 0 }}>
          <h2 style={{ marginBottom: 4 }}>Quem acessou este projeto</h2>
          <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>Seus clientes estão protegidos: todo acesso fica registrado.</p>
          <div className="table-wrap">
            <table style={{ minWidth: 560 }}>
              <thead><tr><th>Quem</th><th>Ação</th><th>Quando</th></tr></thead>
              <tbody>
                {p.access.map((a, i) => (
                  <tr key={i}><td>{a.who}</td><td>{a.what}</td><td className="muted">{a.when}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="note">Dados e nomes ilustrativos.</p>

      {modal && (
        <Modal
          title="Enviar arquivo ao projeto"
          onClose={() => setModal(false)}
          footer={<><button className="btn" onClick={() => setModal(false)}>Cancelar</button><button className="btn primary" disabled={!file} onClick={send}>Enviar</button></>}
        >
          <div className={`drop ${file ? 'filled' : ''}`} onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
            <strong>{file || 'Escolher arquivo'}</strong>
            <div className="small" style={{ marginTop: 4 }}>{file ? 'Toque para trocar' : 'PDF, imagem ou ZIP'}</div>
          </div>
          <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0]?.name ?? '')} />
          <label className="field">
            <span>Categoria</span>
            <select className="select" value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
          </label>
          {existing && <p className="note" style={{ color: 'var(--amber-text)' }}>Já existe um arquivo com esse nome. Ele vira a v{existing.ver + 1} e a versão anterior fica guardada.</p>}
          <p className="note">Dica: envie de novo um arquivo com o mesmo nome (ex.: “Projeto elétrico.pdf”) para ver o controle de versões.</p>
        </Modal>
      )}
    </AppShell>
  );
}
