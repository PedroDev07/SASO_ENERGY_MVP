import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppShell } from '../../components/ui';
import { SITE_TYPES, useStore } from '../../state/store';
import { useT } from '../../i18n';

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

const PRODUCTS = [
  { code: 'EVD002-60KW', spec: '60 kW DC · 2 conectores CCS2' },
  { code: 'EVD002-120KW', spec: '120 kW DC · 2 conectores CCS2' },
  { code: 'EVA-22KW', spec: '22 kW AC · 1 conector Tipo 2' },
];

const STEPS = ['Pré-proposta', 'Visita técnica e premissas', 'Validação da engenharia', 'Proposta final'];

type FieldKey = (typeof FIELDS)[number]['key'];
type UploadKey = (typeof UPLOADS)[number]['key'];

export default function PreProposta() {
  const { state, dispatch, toast } = useStore();
  const { t, date } = useT();
  const { hash } = useLocation();
  const faixa = state.settings.formatoPreco === 'faixa';
  const priceLabel = t(faixa ? 'Faixa de preço de referência' : 'A partir de');
  const priceValue = t(faixa ? '[PREÇO MÍNIMO] a [PREÇO MÁXIMO]' : '[PREÇO DE REFERÊNCIA]');

  const [cliente, setCliente] = useState('Posto Rota 60 Ltda');
  const [produto, setProduto] = useState(PRODUCTS[0].code);
  const [qtd, setQtd] = useState('2');
  const [tipo, setTipo] = useState(SITE_TYPES[0]);

  const [vals, setVals] = useState<Record<FieldKey, string>>({ endereco: '', padrao: '', potencia: '', distancia: '', vagas: '', eletropostos: '' });
  const [needs, setNeeds] = useState({ obra: false, trafo: false, carga: false });
  const [files, setFiles] = useState<Record<UploadKey, string[]>>({ local: [], quadro: [], padrao: [] });
  const [over, setOver] = useState<UploadKey | null>(null);
  const [obs, setObs] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey | 'fotos', boolean>>>({});
  const inputs = useRef<Partial<Record<UploadKey, HTMLInputElement | null>>>({});
  const premissasRef = useRef<HTMLElement>(null);

  const { pdf, enviada, prazo } = state.preProposta;
  const prazoTxt = prazo && !Number.isNaN(Date.parse(prazo)) ? date(new Date(prazo)) : '';
  const prod = PRODUCTS.find(p => p.code === produto) ?? PRODUCTS[0];

  useEffect(() => {
    if (hash === '#premissas') premissasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  const stepState = (i: number) => {
    const current = enviada ? 2 : pdf ? 1 : 0;
    return i < current ? 'done' : i === current ? 'cur' : 'todo';
  };

  const gerarPdf = () => {
    dispatch({ type: 'PRE_PDF' });
    toast(t('Pré-proposta nº 0001 gerada. Salve como PDF na janela de impressão.'), 'ok');
    setTimeout(() => window.print(), 250);
  };

  const preencherExemplo = () => {
    setVals(Object.fromEntries(FIELDS.map(f => [f.key, f.key === 'padrao' ? t(f.example) : f.example])) as Record<FieldKey, string>);
    setNeeds({ obra: true, trafo: false, carga: true });
    setFiles({ local: ['foto-fachada.jpg', 'foto-vagas.jpg', 'foto-acesso.jpg'], quadro: ['quadro-geral.jpg'], padrao: ['padrao-entrada.jpg'] });
    setObs(t('Cliente quer iniciar a operação antes do fim do ano.'));
    setErrors({});
  };

  const addFiles = (key: UploadKey, list: FileList | null) => {
    if (!list?.length) return;
    setFiles(f => ({ ...f, [key]: [...f[key], ...Array.from(list).map(x => x.name)] }));
    setErrors(e => ({ ...e, fotos: undefined }));
  };

  const enviar = () => {
    const e: typeof errors = {};
    FIELDS.forEach(f => { if (f.required && !vals[f.key].trim()) e[f.key] = true; });
    if (!files.local.length) e.fotos = true;
    setErrors(e);
    if (Object.keys(e).length) { toast(t('Preencha os campos obrigatórios antes de enviar.'), 'warn'); return; }
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
      files: UPLOADS.filter(u => files[u.key].length).map(u => ({ name: u.file, ver: 1, count: files[u.key].length })),
    });
    toast(t('Projeto enviado para a engenharia SASO.'), 'ok', { label: t('Ver na fila da engenharia'), to: '/saso' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const req = <span style={{ color: 'var(--red)' }}> *</span>;
  const files_n = (n: number) => t(n === 1 ? '{n} arquivo' : '{n} arquivos', { n });

  return (
    <AppShell profile="integrador">
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1>{t('Nova proposta Full EPC')}</h1>
          <p className="sub">{t('Oportunidade: {name} · protegida por 45 dias', { name: 'Posto Rota 60 · Anápolis (GO)' })}</p>
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
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t(st === 'done' ? 'Etapa {n} · concluída' : 'Etapa {n}', { n: i + 1 })}</div>
                <div style={{ fontWeight: 600 }}>{t(label)}</div>
              </li>
            );
          })}
        </ol>

        {enviada && (
          <section className="alert" style={{ background: 'var(--green-soft)', color: 'var(--green-dark)' }}>
            <span><strong>{t('Enviado para validação.')}</strong> {t('A engenharia SASO responde até {data} (5 dias úteis).', { data: prazoTxt })}</span>
            <Link to="/integrador" className="link">{t('Voltar ao office')}</Link>
          </section>
        )}

        <div className="row">
          <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="card pad-lg" style={{ gap: 16 }}>
              <h2>{t('1. Pré-proposta (gerada na hora)')}</h2>
              <div className="grid-2">
                <label className="field"><span>{t('Cliente final')}</span><input className="input" value={cliente} onChange={e => setCliente(e.target.value)} /></label>
                <label className="field">
                  <span>{t('Produto')}</span>
                  <select className="select" value={produto} onChange={e => setProduto(e.target.value)}>
                    {PRODUCTS.map(p => <option key={p.code} value={p.code}>{p.code} · {t(p.spec)}</option>)}
                  </select>
                </label>
                <label className="field"><span>{t('Quantidade de eletropostos')}</span><input className="input" inputMode="numeric" value={qtd} onChange={e => setQtd(e.target.value.replace(/\D/g, ''))} /></label>
                <label className="field">
                  <span>{t('Tipo de local')}</span>
                  <select className="select" value={tipo} onChange={e => setTipo(e.target.value)}>
                    {SITE_TYPES.map(x => <option key={x} value={x}>{t(x)}</option>)}
                  </select>
                </label>
              </div>
              <div className="soft-green between" style={{ alignItems: 'center', gap: 12 }}>
                <div>
                  <div className="lbl">{priceLabel}</div>
                  <div className="val">{priceValue}</div>
                  <div style={{ fontSize: 12, color: 'var(--green-text)' }}>{t('Preço de referência para o kit padrão. O valor final depende das condições do local.')}</div>
                </div>
                <button className="btn primary" onClick={gerarPdf}>{t(pdf ? 'Gerar PDF novamente' : 'Gerar PDF da pré-proposta')}</button>
              </div>
            </section>

            <section ref={premissasRef} id="premissas" className="card pad-lg" style={{ gap: 16, scrollMarginTop: 80 }}>
              <div className="between">
                <h2>{t('2. Visita técnica · formulário de premissas')}</h2>
                <span className="muted small">{t('Campos definidos pela engenharia SASO')} · <button className="link small" onClick={preencherExemplo} disabled={enviada}>{t('preencher exemplo')}</button></span>
              </div>
              <div className="grid-2">
                {FIELDS.map(f => (
                  <label className="field" key={f.key}>
                    <span>{t(f.label)}{f.required && req}</span>
                    <input
                      className={`input ${errors[f.key] ? 'err' : ''}`}
                      placeholder={t(f.ph)}
                      value={vals[f.key]}
                      disabled={enviada}
                      inputMode={f.key === 'endereco' || f.key === 'padrao' ? 'text' : 'numeric'}
                      onChange={e => { setVals(v => ({ ...v, [f.key]: e.target.value })); setErrors(er => ({ ...er, [f.key]: undefined })); }}
                    />
                    {errors[f.key] && <span className="err-msg">{t('Campo obrigatório')}</span>}
                  </label>
                ))}
              </div>
              <fieldset disabled={enviada}>
                <legend>{t('O local precisa de')}</legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                  {([['obra', 'Obra civil'], ['trafo', 'Transformador'], ['carga', 'Aumento de carga']] as const).map(([k, l]) => (
                    <label className="check" key={k}>
                      <input type="checkbox" checked={needs[k]} onChange={e => setNeeds(n => ({ ...n, [k]: e.target.checked }))} /> {t(l)}
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
                      <strong>{t(u.label)}</strong>
                      <div className="small" style={{ marginTop: 4 }}>
                        {list.length ? `✓ ${files_n(list.length)} · ${list[list.length - 1]}` : t('Arraste ou toque para enviar')}
                      </div>
                      <input ref={el => { inputs.current[u.key] = el; }} type="file" multiple accept="image/*,.pdf,.zip" hidden onChange={e => addFiles(u.key, e.target.files)} />
                    </div>
                  );
                })}
              </div>
              {errors.fotos && <span className="err-msg" style={{ marginTop: -8 }}>{t('Envie ao menos as fotos do local.')}</span>}
              <label className="field"><span>{t('Observações')}</span><textarea className="textarea" rows={3} value={obs} disabled={enviada} onChange={e => setObs(e.target.value)} /></label>
              <div className="between" style={{ alignItems: 'center' }}>
                <span className="muted" style={{ fontSize: 13 }}>{t('Após o envio, a engenharia SASO responde em até 5 dias úteis.')}</span>
                {enviada
                  ? <span className="chip lg t-green">✓ {t('Enviado · resposta até {data}', { data: prazoTxt })}</span>
                  : <button className="btn primary" onClick={enviar}>{t('Enviar para validação')}</button>}
              </div>
            </section>
          </div>

          <aside aria-label={t('Prévia do PDF')} className="card" style={{ flex: '1 1 340px', maxWidth: 420, padding: 18, position: 'sticky', top: 20 }}>
            <h2>{t('Prévia do PDF')}</h2>
            <div style={{ border: '1px solid #D5DBD3', borderRadius: 6, padding: 20, background: '#FCFCFB', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 420 }}>
              <div className="display" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700 }}>
                <span>SASO <span style={{ color: 'var(--green)', fontWeight: 500, letterSpacing: '.12em', fontSize: '.85em' }}>ENERGY</span></span>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{t('Pré-proposta nº {n}', { n: '0001' })}</span>
              </div>
              <div style={{ height: 1, background: 'var(--line)' }} />
              <div style={{ fontWeight: 700 }}>{t('{qtd}× Eletroposto {modelo}', { qtd: qtd || '—', modelo: prod.code })}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t('Cliente: {name}', { name: `${cliente || '—'} · Anápolis (GO)` })}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t('Local: {tipo}', { tipo: t(tipo) })}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>{t('Escopo Full EPC: equipamentos, instalação, comissionamento, app de cobrança e treinamento para gestão do ativo.')}</div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--green-soft)' }}>
                <div style={{ fontSize: 11, color: 'var(--green-text)', fontWeight: 600 }}>{priceLabel}</div>
                <div className="display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-dark)' }}>{priceValue}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 'auto' }}>{t('Valor de referência sujeito à validação técnica do local. Validade: 60 dias.')}</div>
            </div>
            <p className="note">{t('O PDF mostra um valor único e nunca separa o preço dos equipamentos.')}</p>
          </aside>
        </div>
      </div>

      {/* Documento impresso / salvo em PDF */}
      <div className="print-only" style={{ fontSize: 13, color: '#14211B' }}>
        <div className="display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, fontSize: 22 }}>
          <span>SASO <span style={{ color: '#0B7A4B', fontWeight: 500, letterSpacing: '.12em', fontSize: '.85em' }}>ENERGY</span></span>
          <span style={{ fontSize: 13, fontFamily: 'Inter', fontWeight: 500, color: '#5B675F' }}>{t('Pré-proposta nº {n}', { n: '0001' })} · {date(new Date())}</span>
        </div>
        <div style={{ height: 2, background: '#0B7A4B', margin: '14px 0 24px' }} />
        <h1 style={{ fontSize: 26 }}>{t('{qtd}× Eletroposto {modelo}', { qtd, modelo: prod.code })}</h1>
        <p style={{ color: '#44504A' }}>{prod.code} · {t(prod.spec)}</p>
        <table style={{ margin: '18px 0' }}>
          <tbody>
            <tr><td style={{ color: '#5B675F', width: 180 }}>{t('Cliente')}</td><td>{cliente}</td></tr>
            <tr><td style={{ color: '#5B675F' }}>{t('Local')}</td><td>{t(tipo)} · Anápolis (GO)</td></tr>
            <tr><td style={{ color: '#5B675F' }}>{t('Integrador')}</td><td>{t('Integrador Exemplo Ltda · Nível Certificado')}</td></tr>
            <tr><td style={{ color: '#5B675F' }}>{t('Escopo Full EPC')}</td><td>{t('Equipamentos, instalação, comissionamento, app de cobrança e treinamento para gestão do ativo.')}</td></tr>
          </tbody>
        </table>
        <div style={{ padding: 18, borderRadius: 10, background: '#E3F3EA', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div style={{ fontSize: 12, color: '#2F5A45', fontWeight: 600 }}>{priceLabel}</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 700, color: '#0B5A38' }}>{priceValue}</div>
        </div>
        <p style={{ color: '#5B675F', fontSize: 12, marginTop: 20 }}>{t('Valor de referência sujeito à validação técnica do local. Validade: 60 dias. Documento ilustrativo.')}</p>
      </div>
    </AppShell>
  );
}
