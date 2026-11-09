import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell, Modal } from '../../components/ui';
import { PO_FLOW, PROJECT_STEPS, useStore, type Project } from '../../state/store';
import { useT } from '../../i18n';

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
  const { t, tv } = useT();
  const p = state.projects.find(x => x.id === id);
  const [modal, setModal] = useState(false);
  const [file, setFile] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!p) {
    return (
      <AppShell profile="integrador">
        <h1>{t('Projeto não encontrado')}</h1>
        <Link className="link" to="/integrador">{t('Voltar ao office')}</Link>
      </AppShell>
    );
  }

  const po = p.poId ? state.pos.find(x => x.id === p.poId) : undefined;
  const eq = equipment(p, po?.status);
  const stage = p.step >= 5 ? 'Em execução' : 'Contrato assinado';
  const existing = p.docs.find(d => d.name === file);

  const send = () => {
    dispatch({ type: 'UPLOAD_DOC', projectId: p.id, name: file, cat });
    toast(existing
      ? t('{file} atualizado para a v{ver}. A versão anterior fica guardada.', { file, ver: existing.ver + 1 })
      : t('{file} enviado ao projeto.', { file }), 'ok');
    setModal(false); setFile('');
  };

  return (
    <AppShell profile="integrador">
      <div className="between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="muted" style={{ fontSize: 13 }}>{t('Projeto · {etapa}', { etapa: t(stage) })}</div>
          <h1 style={{ marginTop: 2 }}>{p.name} · {p.place}</h1>
          <p className="sub">{t('{n} eletropostos {modelo} · Proposta nº {proposta}', { n: p.units, modelo: 'EVD002-60KW', proposta: p.proposal })}</p>
        </div>
        <span className="chip lg t-green">{t('Etapa atual: {etapa}', { etapa: t(CURRENT_LABEL[p.step]) })}</span>
      </div>

      {state.projects.length > 1 && (
        <div className="seg" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
          {state.projects.map(x => (
            <Link key={x.id} to={`/integrador/projetos/${x.id}`} className={x.id === p.id ? 'on' : ''}>{x.name}</Link>
          ))}
        </div>
      )}

      <section aria-label={t('Linha do tempo')} className="card pad-lg" style={{ gap: 16 }}>
        <h2>{t('Linha do tempo')}</h2>
        <div className="table-wrap">
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(6,minmax(140px,1fr))', gap: 12, minWidth: 900 }}>
            {PROJECT_STEPS.map((label, i) => {
              const done = i < p.step, cur = i === p.step;
              return (
                <li key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 8, borderRadius: 99, background: done ? 'var(--green)' : cur ? 'var(--amber-flag)' : 'var(--track)', transition: 'background .4s' }} />
                  <div style={{ fontWeight: 600, color: done || cur ? 'var(--ink)' : 'var(--muted)' }}>{t(label)}</div>
                  <div className="muted small">{t(p.dates[i])}</div>
                  <span className={`chip ${done ? 't-green' : cur ? 't-amber' : 't-gray'}`}>{t(done ? 'Concluída' : cur ? 'Em andamento' : 'Pendente')}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="row">
        <section aria-label={t('Status do equipamento')} className="card pad-lg" style={{ flex: '1 1 360px' }}>
          <h2>{t('Status do equipamento')}</h2>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--green-soft)' }}>
            <div style={{ fontSize: 12, color: 'var(--green-text)', fontWeight: 600 }}>{t('Situação')}</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-dark)' }}>{t(eq.text)}</div>
            <div style={{ fontSize: 13, color: 'var(--green-text)', marginTop: 4 }}>
              {eq.delivered ? t('Entregue em {data}', { data: po?.done ?? p.dates[3] }) : t('Previsto para entrega no local: [DATA]')}
            </div>
          </div>
          <p className="note">{t('Você acompanha apenas o status do equipamento. As informações de compra ficam com a SASO.')}</p>
        </section>

        <section aria-label={t('Status dos pagamentos a você')} className="card pad-lg" style={{ flex: '1 1 360px', gap: 0 }}>
          <h2 style={{ marginBottom: 8 }}>{t('Status dos pagamentos a você')}</h2>
          {p.payments.map(x => (
            <div className="line-row" key={x.label} style={{ padding: '10px 0' }}>
              <span>{t(x.label)}</span>
              <span className={`chip ${x.state === 'Pago' ? 't-green' : 't-amber'}`} style={{ alignSelf: 'center' }}>{t(x.state)}</span>
            </div>
          ))}
          <p className="note" style={{ marginTop: 10 }}>{t('Status atualizado pela SASO. Os valores não aparecem na plataforma.')}</p>
        </section>

        <section aria-label={t('Documentos do projeto')} className="card pad-lg" style={{ flex: '1 1 360px', gap: 0 }}>
          <div className="between" style={{ marginBottom: 6 }}>
            <h2>{t('Documentos do projeto')}</h2>
            <button className="link" onClick={() => setModal(true)}>{t('Enviar arquivo')}</button>
          </div>
          {p.docs.map(d => (
            <div className="line-row" key={d.name}>
              <div><div style={{ fontWeight: 600 }}>{d.name}</div><div className="muted small">{t(d.cat)}</div></div>
              <span className="muted small">v{d.ver}{d.validated ? ` · ${t('validada')}` : ''}</span>
            </div>
          ))}
        </section>
      </div>

      <section aria-label={t('Quem acessou este projeto')} className="card pad-lg" style={{ gap: 0 }}>
        <h2 style={{ marginBottom: 4 }}>{t('Quem acessou este projeto')}</h2>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>{t('Seus clientes estão protegidos: todo acesso fica registrado.')}</p>
        <div className="table-wrap">
          <table style={{ minWidth: 560 }}>
            <thead><tr><th>{t('Quem')}</th><th>{t('Ação')}</th><th>{t('Quando')}</th></tr></thead>
            <tbody>
              {p.access.map((a, i) => (
                <tr key={i}><td>{t(a.who)}</td><td>{tv(a.what, a.vars)}</td><td className="muted">{a.when}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="note">{t('Dados e nomes ilustrativos.')}</p>

      {modal && (
        <Modal
          title={t('Enviar arquivo ao projeto')}
          onClose={() => setModal(false)}
          footer={<><button className="btn" onClick={() => setModal(false)}>{t('Cancelar')}</button><button className="btn primary" disabled={!file} onClick={send}>{t('Enviar')}</button></>}
        >
          <div className={`drop ${file ? 'filled' : ''}`} onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
            <strong>{file || t('Escolher arquivo')}</strong>
            <div className="small" style={{ marginTop: 4 }}>{file ? t('Toque para trocar') : t('PDF, imagem ou ZIP')}</div>
          </div>
          <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0]?.name ?? '')} />
          <label className="field">
            <span>{t('Categoria')}</span>
            <select className="select" value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(c => <option key={c} value={c}>{t(c)}</option>)}</select>
          </label>
          {existing && <p className="note" style={{ color: 'var(--amber-text)' }}>{t('Já existe um arquivo com esse nome. Ele vira a v{ver} e a versão anterior fica guardada.', { ver: existing.ver + 1 })}</p>}
          <p className="note">{t('Dica: envie de novo um arquivo com o mesmo nome (ex.: “Projeto elétrico.pdf”) para ver o controle de versões.')}</p>
        </Modal>
      )}
    </AppShell>
  );
}
