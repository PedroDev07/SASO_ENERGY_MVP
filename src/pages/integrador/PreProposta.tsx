import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppShell } from '../../components/ui';
import { useStore } from '../../state/store';

const FIELDS = [
  { key: 'endereco', label: 'Endereço do local', ph: 'Rua, número, cidade', example: 'Rod. BR-060, km 12 · Anápolis (GO)', required: true },
  { key: 'padrao', label: 'Padrão de entrada', ph: 'Ex.: trifásico', example: 'Trifásico', required: true },
  { key: 'potencia', label: 'Potência disponível (kW)', ph: '[VALOR]', example: '150', required: true },
  { key: 'distancia', label: 'Distância do quadro ao local (m)', ph: '[VALOR]', example: '35', required: false },
  { key: 'vagas', label: 'Quantidade de vagas', ph: '[VALOR]', example: '4', required: false },
  { key: 'eletropostos', label: 'Quantidade de eletropostos', ph: '[VALOR]', example: '2', required: false },
] as const;

const UPLOADS = [
  { key: 'local', label: 'Fotos do local', file: 'Fotos do local.zip' },
  { key: 'quadro', label: 'Foto do quadro', file: 'Foto do quadro.jpg' },
  { key: 'padrao', label: 'Foto do padrão de entrada', file: 'Foto do padrão de entrada.jpg' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];
type UploadKey = (typeof UPLOADS)[number]['key'];

export default function PreProposta() {
  const { state, dispatch, toast } = useStore();
  const { hash } = useLocation();
  const faixa = state.settings.formatoPreco === 'faixa';
  const priceLabel = faixa ? 'Faixa de preço de referência' : 'A partir de';
  const priceValue = faixa ? '[PREÇO MÍNIMO] a [PREÇO MÁXIMO]' : '[PREÇO DE REFERÊNCIA]';

  const [cliente, setCliente] = useState('Posto Rota 60 Ltda');
  const [produto, setProduto] = useState('EVD002-60KW · 60 kW DC · 2 conectores CCS2');
  const [qtd, setQtd] = useState('2');
  const [tipo, setTipo] = useState('Posto de combustível');

  const [vals, setVals] = useState<Record<FieldKey, string>>({ endereco: '', padrao: '', potencia: '', distancia: '', vagas: '', eletropostos: '' });
  const [needs, setNeeds] = useState({ obra: false, trafo: false, carga: false });
  const [files, setFiles] = useState<Record<UploadKey, string[]>>({ local: [], quadro: [], padrao: [] });
  const [over, setOver] = useState<UploadKey | null>(null);
  const [obs, setObs] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey | 'fotos', string>>>({});
  const inputs = useRef<Partial<Record<UploadKey, HTMLInputElement | null>>>({});
  const premissasRef = useRef<HTMLElement>(null);

  const { pdf, enviada, prazo } = state.preProposta;

  useEffect(() => {
    if (hash === '#premissas') premissasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  const stepState = (i: number) => {
    const current = enviada ? 2 : pdf ? 1 : 0;
    return i < current ? 'done' : i === current ? 'cur' : 'todo';
  };
  const STEPS = ['Pré-proposta', 'Visita técnica e premissas', 'Validação da engenharia', 'Proposta final'];

  const gerarPdf = () => {
    dispatch({ type: 'PRE_PDF' });
    toast('Pré-proposta nº 0001 gerada. Salve como PDF na janela de impressão.', 'ok');
    setTimeout(() => window.print(), 250);
  };

  const preencherExemplo = () => {
    setVals(Object.fromEntries(FIELDS.map(f => [f.key, f.example])) as Record<FieldKey, string>);
    setNeeds({ obra: true, trafo: false, carga: true });
    setFiles({ local: ['foto-fachada.jpg', 'foto-vagas.jpg', 'foto-acesso.jpg'], quadro: ['quadro-geral.jpg'], padrao: ['padrao-entrada.jpg'] });
    setObs('Cliente quer iniciar a operação antes do fim do ano.');
    setErrors({});
  };

  const addFiles = (key: UploadKey, list: FileList | null) => {
    if (!list?.length) return;
    setFiles(f => ({ ...f, [key]: [...f[key], ...Array.from(list).map(x => x.name)] }));
    setErrors(e => ({ ...e, fotos: undefined }));
  };

  const enviar = () => {
    const e: typeof errors = {};
    FIELDS.forEach(f => { if (f.required && !vals[f.key].trim()) e[f.key] = 'Campo obrigatório'; });
    if (!files.local.length) e.fotos = 'Envie ao menos as fotos do local.';
    setErrors(e);
    if (Object.keys(e).length) { toast('Preencha os campos obrigatórios antes de enviar.', 'warn'); return; }
    const yn = (b: boolean) => (b ? 'Sim' : 'Não');
    dispatch({
      type: 'SUBMIT_VALIDATION',
      name: cliente.replace(/ Ltda$/i, ''),
      place: 'Anápolis (GO)',
      units: Number(vals.eletropostos || qtd) || 1,
      premises: [
        { k: 'Tipo de local', v: tipo }, { k: 'Padrão de entrada', v: vals.padrao },
        { k: 'Potência disponível', v: `${vals.potencia} kW` }, { k: 'Distância quadro–local', v: vals.distancia ? `${vals.distancia} m` : '—' },
        { k: 'Vagas / eletropostos', v: `${vals.vagas || '—'} / ${vals.eletropostos || qtd}` }, { k: 'Obra civil', v: yn(needs.obra) },
        { k: 'Transformador', v: yn(needs.trafo) }, { k: 'Aumento de carga', v: yn(needs.carga) },
      ],
      files: UPLOADS.filter(u => files[u.key].length).map(u => ({ name: u.file, ver: `v1 · ${files[u.key].length} ${files[u.key].length === 1 ? 'arquivo' : 'arquivos'}` })),
    });
    toast('Projeto enviado para a engenharia SASO.', 'ok', { label: 'Ver na fila da engenharia', to: '/saso' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell profile="integrador">
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h1>Nova proposta Full EPC</h1>
            <p className="sub">Oportunidade: Posto Rota 60 · Anápolis (GO) · protegida por 45 dias</p>
          </div>

          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {STEPS.map((label, i) => {
              const st = stepState(i);
              return (
                <li
                  key={label}
                  style={{
                    flex: '1 1 220px', padding: '12px 14px', borderRadius: 12, transition: 'all .3s',
                    background: st === 'cur' ? 'var(--green)' : st === 'done' ? 'var(--green-soft)' : '#fff',
                    color: st === 'cur' ? '#fff' : st === 'done' ? 'var(--green-dark)' : 'var(--muted-2)',
                    border: `1px solid ${st === 'cur' ? 'var(--green)' : 'var(--line)'}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Etapa {i + 1}{st === 'done' ? ' · concluída' : ''}</div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                </li>
              );
            })}
          </ol>

          {enviada && (
            <section className="alert" style={{ background: 'var(--green-soft)', color: 'var(--green-dark)' }}>
              <span><strong>Enviado para validação.</strong> A engenharia SASO responde até {prazo} (5 dias úteis).</span>
              <Link to="/integrador" className="link">Voltar ao office</Link>
            </section>
          )}

          <div className="row">
            <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <section className="card pad-lg" style={{ gap: 16 }}>
                <h2>1. Pré-proposta (gerada na hora)</h2>
                <div className="grid-2">
                  <label className="field"><span>Cliente final</span><input className="input" value={cliente} onChange={e => setCliente(e.target.value)} /></label>
                  <label className="field">
                    <span>Produto</span>
                    <select className="select" value={produto} onChange={e => setProduto(e.target.value)}>
                      <option>EVD002-60KW · 60 kW DC · 2 conectores CCS2</option>
                      <option>EVD002-120KW · 120 kW DC · 2 conectores CCS2</option>
                      <option>EVA-22KW · 22 kW AC · 1 conector Tipo 2</option>
                    </select>
                  </label>
                  <label className="field"><span>Quantidade de eletropostos</span><input className="input" inputMode="numeric" value={qtd} onChange={e => setQtd(e.target.value.replace(/\D/g, ''))} /></label>
                  <label className="field">
                    <span>Tipo de local</span>
                    <select className="select" value={tipo} onChange={e => setTipo(e.target.value)}>
                      {['Posto de combustível', 'Condomínio', 'Shopping', 'Hotel', 'Estacionamento', 'Garagem de frota', 'Supermercado'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
                <div className="soft-green between" style={{ alignItems: 'center', gap: 12 }}>
                  <div>
                    <div className="lbl">{priceLabel}</div>
                    <div className="val">{priceValue}</div>
                    <div style={{ fontSize: 12, color: 'var(--green-text)' }}>Preço de referência para o kit padrão. O valor final depende das condições do local.</div>
                  </div>
                  <button className="btn primary" onClick={gerarPdf}>{pdf ? 'Gerar PDF novamente' : 'Gerar PDF da pré-proposta'}</button>
                </div>
              </section>

              <section ref={premissasRef} id="premissas" className="card pad-lg" style={{ gap: 16, scrollMarginTop: 80 }}>
                <div className="between">
                  <h2>2. Visita técnica · formulário de premissas</h2>
                  <span className="muted small">Campos definidos pela engenharia SASO · <button className="link small" onClick={preencherExemplo} disabled={enviada}>preencher exemplo</button></span>
                </div>
                <div className="grid-2">
                  {FIELDS.map(f => (
                    <label className="field" key={f.key}>
                      <span>{f.label}{f.required && <span style={{ color: 'var(--red)' }}> *</span>}</span>
                      <input
                        className={`input ${errors[f.key] ? 'err' : ''}`}
                        placeholder={f.ph}
                        value={vals[f.key]}
                        disabled={enviada}
                        inputMode={f.key === 'endereco' || f.key === 'padrao' ? 'text' : 'numeric'}
                        onChange={e => { setVals(v => ({ ...v, [f.key]: e.target.value })); setErrors(er => ({ ...er, [f.key]: undefined })); }}
                      />
                      {errors[f.key] && <span className="err-msg">{errors[f.key]}</span>}
                    </label>
                  ))}
                </div>
                <fieldset disabled={enviada}>
                  <legend>O local precisa de</legend>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {([['obra', 'Obra civil'], ['trafo', 'Transformador'], ['carga', 'Aumento de carga']] as const).map(([k, l]) => (
                      <label className="check" key={k}>
                        <input type="checkbox" checked={needs[k]} onChange={e => setNeeds(n => ({ ...n, [k]: e.target.checked }))} /> {l}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid-3">
                  {UPLOADS.map(u => {
                    const list = files[u.key];
                    return (
                      <div
                        key={u.key}
                        role="button"
                        tabIndex={0}
                        className={`drop ${over === u.key ? 'over' : ''} ${list.length ? 'filled' : ''}`}
                        onClick={() => !enviada && inputs.current[u.key]?.click()}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !enviada && inputs.current[u.key]?.click()}
                        onDragOver={e => { e.preventDefault(); setOver(u.key); }}
                        onDragLeave={() => setOver(null)}
                        onDrop={e => { e.preventDefault(); setOver(null); if (!enviada) addFiles(u.key, e.dataTransfer.files); }}
                      >
                        <strong>{u.label}</strong>
                        <div className="small" style={{ marginTop: 4 }}>
                          {list.length ? `✓ ${list.length} ${list.length === 1 ? 'arquivo' : 'arquivos'} · ${list[list.length - 1]}` : 'Arraste ou toque para enviar'}
                        </div>
                        <input ref={el => { inputs.current[u.key] = el; }} type="file" multiple accept="image/*,.pdf,.zip" hidden onChange={e => addFiles(u.key, e.target.files)} />
                      </div>
                    );
                  })}
                </div>
                {errors.fotos && <span className="err-msg" style={{ marginTop: -8 }}>{errors.fotos}</span>}
                <label className="field"><span>Observações</span><textarea className="textarea" rows={3} value={obs} disabled={enviada} onChange={e => setObs(e.target.value)} /></label>
                <div className="between" style={{ alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: 13 }}>Após o envio, a engenharia SASO responde em até 5 dias úteis.</span>
                  {enviada
                    ? <span className="chip lg t-green">✓ Enviado · resposta até {prazo}</span>
                    : <button className="btn primary" onClick={enviar}>Enviar para validação</button>}
                </div>
              </section>
            </div>

            <aside aria-label="Prévia do PDF" className="card" style={{ flex: '1 1 340px', maxWidth: 420, padding: 18, position: 'sticky', top: 20 }}>
              <h2>Prévia do PDF</h2>
              <div style={{ border: '1px solid #D5DBD3', borderRadius: 6, padding: 20, background: '#FCFCFB', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 420 }}>
                <div className="display" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>SASO <span style={{ color: 'var(--green)', fontWeight: 500, letterSpacing: '.12em', fontSize: '.85em' }}>ENERGY</span></span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Pré-proposta nº 0001</span>
                </div>
                <div style={{ height: 1, background: 'var(--line)' }} />
                <div style={{ fontWeight: 700 }}>{qtd || '—'}× Eletroposto {produto.split(' · ')[0]}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Cliente: {cliente || '—'} · Anápolis (GO)</div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Local: {tipo}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Escopo Full EPC: equipamentos, instalação, comissionamento, app de cobrança e treinamento para gestão do ativo.</div>
                <div style={{ padding: 10, borderRadius: 8, background: 'var(--green-soft)' }}>
                  <div style={{ fontSize: 11, color: 'var(--green-text)', fontWeight: 600 }}>{priceLabel}</div>
                  <div className="display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-dark)' }}>{priceValue}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 'auto' }}>Valor de referência sujeito à validação técnica do local. Validade: 60 dias.</div>
              </div>
              <p className="note">O PDF mostra um valor único e nunca separa o preço dos equipamentos.</p>
            </aside>
          </div>
      </div>

      {/* Documento impresso / salvo em PDF */}
      <div className="print-only" style={{ fontSize: 13, color: '#14211B' }}>
        <div className="display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, fontSize: 22 }}>
          <span>SASO <span style={{ color: '#0B7A4B', fontWeight: 500, letterSpacing: '.12em', fontSize: '.85em' }}>ENERGY</span></span>
          <span style={{ fontSize: 13, fontFamily: 'Inter', fontWeight: 500, color: '#5B675F' }}>Pré-proposta nº 0001 · {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
        <div style={{ height: 2, background: '#0B7A4B', margin: '14px 0 24px' }} />
        <h1 style={{ fontSize: 26 }}>{qtd}× Eletroposto {produto.split(' · ')[0]}</h1>
        <p style={{ color: '#44504A' }}>{produto}</p>
        <table style={{ margin: '18px 0' }}>
          <tbody>
            <tr><td style={{ color: '#5B675F', width: 180 }}>Cliente</td><td>{cliente}</td></tr>
            <tr><td style={{ color: '#5B675F' }}>Local</td><td>{tipo} · Anápolis (GO)</td></tr>
            <tr><td style={{ color: '#5B675F' }}>Integrador</td><td>Integrador Exemplo Ltda · Nível Certificado</td></tr>
            <tr><td style={{ color: '#5B675F' }}>Escopo Full EPC</td><td>Equipamentos, instalação, comissionamento, app de cobrança e treinamento para gestão do ativo.</td></tr>
          </tbody>
        </table>
        <div style={{ padding: 18, borderRadius: 10, background: '#E3F3EA', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div style={{ fontSize: 12, color: '#2F5A45', fontWeight: 600 }}>{priceLabel}</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 700, color: '#0B5A38' }}>{priceValue}</div>
        </div>
        <p style={{ color: '#5B675F', fontSize: 12, marginTop: 20 }}>Valor de referência sujeito à validação técnica do local. Validade: 60 dias. Documento ilustrativo.</p>
      </div>
    </AppShell>
  );
}
