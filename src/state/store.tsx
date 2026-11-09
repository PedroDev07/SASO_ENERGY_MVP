import type { Lang } from '../i18n';
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';

/* ---------- Tipos ---------- */

export type Profile = 'integrador' | 'saso' | 'fornecedor';

export interface Session { profile: Profile; name: string; email: string }

export const PROFILES: Record<Profile, { label: string; home: string; name: string; email: string }> = {
  integrador: { label: 'Integrador', home: '/integrador', name: 'Integrador Exemplo Ltda', email: 'contato@integradorexemplo.com.br' },
  saso: { label: 'SASO', home: '/saso', name: 'Engenharia SASO', email: 'engenharia@sasoenergy.com.br' },
  fornecedor: { label: 'Fornecedor', home: '/fornecedor', name: 'Fornecedor', email: 'operacoes@fornecedor.com.br' },
};

export const profileOf = (path: string): Profile | null =>
  path.startsWith('/integrador') ? 'integrador' : path.startsWith('/saso') ? 'saso' : path.startsWith('/fornecedor') ? 'fornecedor' : null;

export const STAGES = [
  'Lead', 'Pré-proposta enviada', 'Visita técnica', 'Em validação', 'Proposta final enviada',
  'Contrato assinado', 'Em execução', 'Concluída', 'Perdida',
];

export const PROJECT_STEPS = [
  'Proposta aceita', 'Projeto validado', 'Ordem de compra emitida',
  'Equipamento disponível', 'Instalação concluída', 'Comissionamento',
];

export const PO_FLOW = [
  'Recebida', 'Em produção', 'Embarcada', 'Em desembaraço', 'Disponível no armazém', 'Liberada', 'Entregue',
];

export const INTEGRADOR = 'Integrador Exemplo Ltda';

export const SITE_TYPES = ['Posto de combustível', 'Condomínio', 'Shopping', 'Hotel', 'Estacionamento', 'Garagem de frota', 'Supermercado'];

export interface Lead { id: string; name: string; place: string; kind: string; hoursLeft: number; status: 'aguardando' | 'aceito' }
export interface Premise { k: string; v: string }
export interface FileRef { name: string; ver: number; latest?: boolean; count?: number }
export interface QueueItem {
  id: string; name: string; integrator: string; place: string; units: number; daysLeft: number;
  status: 'fila' | 'aprovado' | 'ajustes' | 'reprovado'; premises: Premise[]; files: FileRef[];
  supplierSupport?: boolean; comment?: string;
}
export interface Doc { name: string; cat: string; ver: number; validated?: boolean }
export interface Access { who: string; what: string; when: string; vars?: Record<string, string | number> }
export interface Payment { label: string; state: 'Pago' | 'Pendente' }
export interface Project {
  id: string; name: string; place: string; units: number; proposal: string; step: number;
  dates: string[]; payments: Payment[]; docs: Doc[]; access: Access[]; poId?: string;
}
export interface PO { id: string; region: string; full: string; kind: string; qty: number; status: number; eta: string; done: string }
export interface LeadToDistribute { id: string; name: string; place: string; origin: string }
export interface Notice { id: string; to: Profile; title: string; body: string; vars?: Record<string, string | number>; at: string; read: boolean }
export interface Protection { name: string; days: number }
export interface Settings { formatoPreco: 'apartir' | 'faixa'; clienteVisivel: 'regiao' | 'completo'; lang: Lang }

export interface State {
  pipeline: number[];
  leads: Lead[];
  queue: QueueItem[];
  projects: Project[];
  pos: PO[];
  distribute: LeadToDistribute[];
  notices: Notice[];
  protections: Protection[];
  settings: Settings;
  session: Session | null;
  docAlert: boolean;
  preProposta: { pdf: boolean; enviada: boolean; prazo?: string };
}

/* ---------- Utilidades ---------- */

const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n: number) => String(n).padStart(2, '0');
export const today = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
export const stamp = () => { const d = new Date(); return `${today()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const addBusinessDays = (n: number) => {
  const d = new Date();
  while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; }
  return d.toISOString();
};

/* ---------- Dados iniciais (ilustrativos, conforme o design v1) ---------- */

export const initialState = (): State => ({
  pipeline: [3, 5, 2, 2, 1, 1, 3, 7, 2],
  leads: [
    { id: 'l1', name: 'Posto Rota 60', place: 'Anápolis (GO)', kind: 'Posto de combustível', hoursLeft: 36, status: 'aguardando' },
    { id: 'l2', name: 'Condomínio Vila Jardim', place: 'Goiânia (GO)', kind: 'Condomínio', hoursLeft: 6, status: 'aguardando' },
  ],
  queue: [
    {
      id: 'q1', name: 'Shopping Cerrado', integrator: INTEGRADOR, place: 'Brasília (DF)', units: 2, daysLeft: 1, status: 'fila',
      premises: [
        { k: 'Tipo de local', v: 'Estacionamento' }, { k: 'Padrão de entrada', v: 'Trifásico' },
        { k: 'Potência disponível', v: '[VALOR] kW' }, { k: 'Distância quadro–local', v: '[VALOR] m' },
        { k: 'Vagas / eletropostos', v: '[VALOR] / 2' }, { k: 'Obra civil', v: 'Sim' },
        { k: 'Transformador', v: 'Não' }, { k: 'Aumento de carga', v: 'A avaliar' },
      ],
      files: [
        { name: 'Projeto elétrico.pdf', ver: 3, latest: true }, { name: 'Fotos do local.zip', ver: 1 },
        { name: 'Foto do quadro.jpg', ver: 1 }, { name: 'Croqui.pdf', ver: 2 },
      ],
    },
    mkQueue('q2', 'Frota Transportes Alfa', 'Eletro Cerrado Ltda', 'Anápolis (GO)', 1, 0, 'Garagem de frota'),
    mkQueue('q3', 'Condomínio Bela Vista', 'Voltagem Sul Ltda', 'Goiânia (GO)', 2, 3, 'Condomínio'),
    mkQueue('q4', 'Posto Estrada Real', INTEGRADOR, 'Pirenópolis (GO)', 2, 4, 'Posto de combustível'),
    mkQueue('q5', 'Clínica Vida', 'Eletro Cerrado Ltda', 'Anápolis (GO)', 1, 5, 'Clínica'),
  ],
  projects: [
    {
      id: 'hotel-planalto', name: 'Hotel Planalto', place: 'Pirenópolis (GO)', units: 2, proposal: '0014', step: 3,
      dates: ['12/09', '19/09', '24/09', '[DATA]', '—', '—'], poId: 'PO-0007',
      payments: [
        { label: 'Comissão · parcela 1', state: 'Pago' }, { label: 'Comissão · parcela 2', state: 'Pendente' },
        { label: 'Mão de obra de instalação', state: 'Pendente' },
      ],
      docs: [
        { name: 'Fotos do local.zip', cat: 'Fotos', ver: 1 },
        { name: 'Projeto elétrico.pdf', cat: 'Projeto elétrico', ver: 3, validated: true },
        { name: 'ART-0001.pdf', cat: 'ART/TRT', ver: 1 },
        { name: 'Contrato assinado.pdf', cat: 'Contrato assinado', ver: 1 },
      ],
      access: [
        { who: 'Engenharia SASO', what: 'Validou o projeto', when: '19/09 · 14:32' },
        { who: 'Operações SASO', what: 'Atualizou a etapa', when: '24/09 · 09:10' },
        { who: 'Você', what: 'Enviou projeto elétrico v3', when: '17/09 · 16:48' },
      ],
    },
    {
      id: 'supermercado-bom-preco', name: 'Supermercado Bom Preço', place: 'Goiânia (GO)', units: 3, proposal: '0011', step: 2,
      dates: ['02/09', '10/09', '[DATA]', '—', '—', '—'],
      payments: [{ label: 'Comissão · parcela 1', state: 'Pendente' }, { label: 'Mão de obra de instalação', state: 'Pendente' }],
      docs: [
        { name: 'Projeto elétrico.pdf', cat: 'Projeto elétrico', ver: 2, validated: true },
        { name: 'Contrato assinado.pdf', cat: 'Contrato assinado', ver: 1 },
      ],
      access: [{ who: 'Engenharia SASO', what: 'Validou o projeto', when: '10/09 · 11:05' }],
    },
    {
      id: 'estacionamento-centro', name: 'Estacionamento Centro', place: 'Anápolis (GO)', units: 4, proposal: '0009', step: 5,
      dates: ['05/08', '12/08', '15/08', '28/08', '06/09', '[DATA]'],
      payments: [
        { label: 'Comissão · parcela 1', state: 'Pago' }, { label: 'Comissão · parcela 2', state: 'Pago' },
        { label: 'Mão de obra de instalação', state: 'Pago' },
      ],
      docs: [
        { name: 'Projeto elétrico.pdf', cat: 'Projeto elétrico', ver: 1, validated: true },
        { name: 'ART-0003.pdf', cat: 'ART/TRT', ver: 1 },
        { name: 'Fotos da instalação.zip', cat: 'Fotos', ver: 1 },
      ],
      access: [{ who: 'Operações SASO', what: 'Agendou o comissionamento', when: '07/09 · 08:40' }],
    },
  ],
  pos: [
    { id: 'PO-0007', region: 'Centro-Oeste', full: 'Hotel Planalto · Pirenópolis (GO)', kind: 'Liberação de estoque', qty: 2, status: 4, eta: '[DATA]', done: '[DATA]' },
    { id: 'PO-0008', region: 'Sudeste', full: 'Shopping Alfa · Campinas (SP)', kind: 'Produção', qty: 4, status: 1, eta: '[DATA]', done: '—' },
    { id: 'PO-0009', region: 'Centro-Oeste', full: 'Posto Rota 60 · Anápolis (GO)', kind: 'Produção', qty: 2, status: 2, eta: '[DATA]', done: '—' },
    { id: 'PO-0010', region: 'Sul', full: 'Condomínio Lago · Curitiba (PR)', kind: 'Produção', qty: 2, status: 3, eta: '[DATA]', done: '—' },
    { id: 'PO-0011', region: 'Nordeste', full: 'Frota Litoral · Fortaleza (CE)', kind: 'Liberação de estoque', qty: 1, status: 0, eta: '[DATA]', done: '—' },
  ],
  distribute: [
    { id: 'd1', name: 'Rede Supermercados Norte', place: 'Palmas (TO)', origin: 'Fornecedor' },
    { id: 'd2', name: 'Hotel Fazenda Serra', place: 'Caldas Novas (GO)', origin: 'Site SASO' },
  ],
  notices: [],
  protections: [
    { name: 'Hotel Planalto', days: 12 }, { name: 'Clínica Vida', days: 5 }, { name: 'Padaria Central', days: 2 },
  ],
  settings: { formatoPreco: 'apartir', clienteVisivel: 'regiao', lang: 'pt' },
  session: null,
  docAlert: true,
  preProposta: { pdf: false, enviada: false },
});

function mkQueue(id: string, name: string, integrator: string, place: string, units: number, daysLeft: number, tipo: string): QueueItem {
  return {
    id, name, integrator, place, units, daysLeft, status: 'fila',
    premises: [
      { k: 'Tipo de local', v: tipo }, { k: 'Padrão de entrada', v: 'Trifásico' },
      { k: 'Potência disponível', v: '[VALOR] kW' }, { k: 'Distância quadro–local', v: '[VALOR] m' },
      { k: 'Vagas / eletropostos', v: `[VALOR] / ${units}` }, { k: 'Obra civil', v: 'Não' },
      { k: 'Transformador', v: 'Não' }, { k: 'Aumento de carga', v: 'Sim' },
    ],
    files: [{ name: 'Projeto elétrico.pdf', ver: 1, latest: true }, { name: 'Fotos do local.zip', ver: 1 }],
  };
}

/* ---------- Ações ---------- */

export type Action =
  | { type: 'ACCEPT_LEAD'; id: string }
  | { type: 'REFUSE_LEAD'; id: string }
  | { type: 'PRE_PDF' }
  | { type: 'SUBMIT_VALIDATION'; name: string; place: string; units: number; premises: Premise[]; files: FileRef[] }
  | { type: 'DECIDE'; id: string; decision: 'aprovado' | 'ajustes' | 'reprovado'; comment: string }
  | { type: 'SUPPLIER_SUPPORT'; id: string }
  | { type: 'LOGIN'; profile: Profile; email?: string }
  | { type: 'LOGOUT' }
  | { type: 'ASSIGN_LEAD'; id: string; integrator: string }
  | { type: 'FORWARD_LEAD'; name: string; place: string; kind: string }
  | { type: 'ADVANCE_PO'; id: string; status: number }
  | { type: 'UPLOAD_DOC'; projectId: string; name: string; cat: string }
  | { type: 'DOC_ALERT_RESOLVED' }
  | { type: 'READ_NOTICES'; to: Profile }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'RESET' };

const notice = (to: Profile, title: string, body: string, vars?: Notice['vars']): Notice => ({ id: uid(), to, title, body, vars, at: stamp(), read: false });
const bump = (arr: number[], i: number, d: number) => arr.map((n, j) => (j === i ? Math.max(0, n + d) : n));

const EQUIP_EVENT: Record<number, string> = {
  0: 'Pedido confirmado', 1: 'Equipamento em produção', 2: 'Equipamento embarcado',
  3: 'Equipamento em desembaraço aduaneiro', 4: 'Equipamento liberado no armazém de São Paulo',
  5: 'Equipamento liberado para transporte', 6: 'Equipamento entregue no local',
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'ACCEPT_LEAD': {
      const lead = s.leads.find(l => l.id === a.id); if (!lead) return s;
      return {
        ...s,
        leads: s.leads.map(l => (l.id === a.id ? { ...l, status: 'aceito' } : l)),
        pipeline: bump(s.pipeline, 0, 1),
        protections: [{ name: lead.name, days: 45 }, ...s.protections.filter(p => p.name !== lead.name)],
        notices: [notice('saso', 'Lead aceito', '{integrator} aceitou o lead {name}.', { integrator: INTEGRADOR, name: lead.name }), ...s.notices],
      };
    }
    case 'REFUSE_LEAD': {
      const lead = s.leads.find(l => l.id === a.id); if (!lead) return s;
      return {
        ...s,
        leads: s.leads.filter(l => l.id !== a.id),
        distribute: [...s.distribute, { id: uid(), name: lead.name, place: lead.place, origin: 'devolvido pelo integrador' }],
        notices: [notice('saso', 'Lead devolvido', '{name} voltou para redistribuição.', { name: lead.name }), ...s.notices],
      };
    }
    case 'PRE_PDF':
      return s.preProposta.pdf ? s : { ...s, preProposta: { ...s.preProposta, pdf: true }, pipeline: bump(s.pipeline, 1, 1) };
    case 'SUBMIT_VALIDATION': {
      const item: QueueItem = {
        id: uid(), name: a.name, integrator: INTEGRADOR, place: a.place, units: a.units, daysLeft: 5,
        status: 'fila', premises: a.premises, files: a.files,
      };
      return {
        ...s,
        queue: [...s.queue, item],
        pipeline: bump(s.pipeline, 3, 1),
        preProposta: { pdf: true, enviada: true, prazo: addBusinessDays(5) },
        notices: [notice('saso', 'Novo projeto na fila', '{name} · {place} enviado por {integrator}.', { name: a.name, place: a.place, integrator: INTEGRADOR }), ...s.notices],
      };
    }
    case 'DECIDE': {
      const item = s.queue.find(q => q.id === a.id); if (!item) return s;
      const mine = item.integrator === INTEGRADOR;
      let pipeline = s.pipeline;
      if (mine && a.decision === 'aprovado') pipeline = bump(bump(pipeline, 3, -1), 4, 1);
      if (mine && a.decision === 'reprovado') pipeline = bump(bump(pipeline, 3, -1), 8, 1);
      const titles = { aprovado: 'Projeto aprovado', ajustes: 'Ajustes solicitados', reprovado: 'Projeto reprovado' };
      const bodies = {
        aprovado: '{name}: a proposta final foi gerada e está disponível.',
        ajustes: '{name}: a engenharia pediu ajustes. “{comment}”',
        reprovado: '{name}: o projeto foi reprovado. “{comment}”',
      };
      return {
        ...s,
        pipeline,
        queue: s.queue.map(q => (q.id === a.id ? { ...q, status: a.decision, comment: a.comment } : q)),
        notices: mine ? [notice('integrador', titles[a.decision], bodies[a.decision], { name: item.name, comment: a.comment }), ...s.notices] : s.notices,
      };
    }
    case 'SUPPLIER_SUPPORT': {
      const item = s.queue.find(q => q.id === a.id); if (!item) return s;
      return {
        ...s,
        queue: s.queue.map(q => (q.id === a.id ? { ...q, supplierSupport: true } : q)),
        notices: [notice('fornecedor', 'Apoio técnico solicitado', '{name} · {place}: arquivos técnicos liberados.', { name: item.name, place: item.place }), ...s.notices],
      };
    }
    case 'ASSIGN_LEAD': {
      const lead = s.distribute.find(d => d.id === a.id); if (!lead) return s;
      const mine = a.integrator === INTEGRADOR;
      return {
        ...s,
        distribute: s.distribute.filter(d => d.id !== a.id),
        leads: mine ? [...s.leads, { id: uid(), name: lead.name, place: lead.place, kind: 'Novo lead', hoursLeft: 48, status: 'aguardando' }] : s.leads,
        notices: mine ? [notice('integrador', 'Novo lead para você', '{name} · {place}. Você tem 48 h para aceitar.', { name: lead.name, place: lead.place }), ...s.notices] : s.notices,
      };
    }
    case 'FORWARD_LEAD':
      return {
        ...s,
        distribute: [...s.distribute, { id: uid(), name: a.name, place: a.place, origin: 'Fornecedor' }],
        notices: [notice('saso', 'Lead encaminhado pelo fornecedor', '{name} · {place} ({kind}).', { name: a.name, place: a.place, kind: a.kind }), ...s.notices],
      };
    case 'ADVANCE_PO': {
      const po = s.pos.find(p => p.id === a.id); if (!po) return s;
      const delivered = a.status === PO_FLOW.length - 1;
      const projects = s.projects.map(p => {
        if (p.poId !== a.id) return p;
        const dates = [...p.dates];
        let step = p.step;
        if (delivered && step === 3) { dates[3] = today(); step = 4; }
        return { ...p, step, dates, access: [{ who: 'Operações SASO', what: 'Atualizou o equipamento: {event}', vars: { event: EQUIP_EVENT[a.status] }, when: stamp() }, ...p.access] };
      });
      const linked = s.projects.find(p => p.poId === a.id);
      return {
        ...s,
        pos: s.pos.map(p => (p.id === a.id ? { ...p, status: a.status, done: today() } : p)),
        projects,
        notices: linked
          ? [notice('integrador', 'Status do equipamento', '{name}: {event}.', { name: linked.name, event: EQUIP_EVENT[a.status] }), notice('saso', 'PO atualizada pelo fornecedor', '{id}: {status}.', { id: po.id, status: PO_FLOW[a.status] }), ...s.notices]
          : [notice('saso', 'PO atualizada pelo fornecedor', '{id}: {status}.', { id: po.id, status: PO_FLOW[a.status] }), ...s.notices],
      };
    }
    case 'UPLOAD_DOC':
      return {
        ...s,
        projects: s.projects.map(p => {
          if (p.id !== a.projectId) return p;
          const existing = p.docs.find(d => d.name === a.name);
          const ver = existing ? existing.ver + 1 : 1;
          const docs = existing
            ? p.docs.map(d => (d.name === a.name ? { ...d, ver, validated: false } : d))
            : [...p.docs, { name: a.name, cat: a.cat, ver }];
          return { ...p, docs, access: [{ who: 'Você', what: 'Enviou {name} v{ver}', vars: { name: a.name, ver }, when: stamp() }, ...p.access] };
        }),
      };
    case 'DOC_ALERT_RESOLVED':
      return { ...s, docAlert: false, notices: [notice('saso', 'Documento para análise', '{integrator} enviou o certificado NR-35 atualizado.', { integrator: INTEGRADOR }), ...s.notices] };
    case 'READ_NOTICES':
      return { ...s, notices: s.notices.map(n => (n.to === a.to ? { ...n, read: true } : n)) };
    case 'SET_SETTINGS':
      return { ...s, settings: { ...s.settings, ...a.settings } };
    case 'LOGIN': {
      const p = PROFILES[a.profile];
      return { ...s, session: { profile: a.profile, name: p.name, email: a.email || p.email } };
    }
    case 'LOGOUT':
      return { ...s, session: null };
    case 'RESET': {
      const fresh = initialState();
      return { ...fresh, settings: { ...fresh.settings, lang: s.settings.lang } };
    }
  }
}

/* ---------- Provider, persistência e avisos rápidos (toasts) ---------- */

const KEY = 'saso-energy-demo-v4';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch { /* sem armazenamento: segue com os dados iniciais */ }
  return initialState();
}

export interface Toast { id: string; text: string; tone: 'ok' | 'info' | 'warn'; action?: { label: string; to: string } }

interface Ctx {
  state: State;
  dispatch: (a: Action) => void;
  toast: (text: string, tone?: Toast['tone'], action?: Toast['action']) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ }
  }, [state]);

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
    window.clearTimeout(timers.current[id]);
  }, []);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok', action?: Toast['action']) => {
    const id = uid();
    setToasts(t => [...t.slice(-2), { id, text, tone, action }]);
    timers.current[id] = window.setTimeout(() => dismiss(id), 5200);
  }, [dismiss]);

  return <StoreContext.Provider value={{ state, dispatch, toast, toasts, dismiss }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}
