import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PROFILES, profileOf, useStore, type Profile } from '../state/store';
import { LANGS, useT } from '../i18n';

export function Brand({ small }: { small?: boolean }) {
  return (
    <div className="brand" style={small ? { fontSize: 16 } : undefined}>
      SASO <span className="x">ENERGY</span>
    </div>
  );
}

/** Navega e, se a rota for de outro perfil, entra como esse perfil (atalho da demonstração). */
export function useGo() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  return useCallback((to: string) => {
    const p = profileOf(to);
    if (p && state.session?.profile !== p) dispatch({ type: 'LOGIN', profile: p });
    navigate(to);
  }, [state.session?.profile, dispatch, navigate]);
}

/* ---------- Ícones ---------- */

export const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/* ---------- Seletor de idioma ---------- */

export function LangSwitch() {
  const { dispatch } = useStore();
  const { t, lang } = useT();
  return (
    <div className="lang" role="group" aria-label={t('Idioma')}>
      <GlobeIcon />
      {LANGS.map(l => (
        <button
          key={l.id}
          className={lang === l.id ? 'on' : ''}
          aria-pressed={lang === l.id}
          title={l.name}
          lang={l.id === 'zh' ? 'zh-CN' : l.id}
          onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { lang: l.id } })}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({ title, onClose, children, footer, width }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  const { t } = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { width } : undefined}>
        <header>
          <h2>{title}</h2>
          <button className="close" onClick={onClose} aria-label={t('Fechar')}>×</button>
        </header>
        {children}
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */

export function Toasts() {
  const { toasts, dismiss } = useStore();
  const { t } = useT();
  const go = useGo();
  const { pathname } = useLocation();
  const seen = useRef(pathname);
  // Ao trocar de tela, some com avisos antigos (nada de um perfil aparece na tela de outro)
  useEffect(() => {
    if (seen.current === pathname) return;
    seen.current = pathname;
    toasts.forEach(x => dismiss(x.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(x => (
        <div key={x.id} className={`toast ${x.tone}`}>
          <div className="txt">
            {x.text}
            {x.action && (
              <div>
                <button className="act" onClick={() => { dismiss(x.id); go(x.action!.to); }}>{x.action.label} →</button>
              </div>
            )}
          </div>
          <button className="close" onClick={() => dismiss(x.id)} aria-label={t('Fechar aviso')}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Sino de avisos ---------- */

export function Bell({ profile }: { profile: Profile }) {
  const { state, dispatch } = useStore();
  const { t, tv } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mine = state.notices.filter(n => n.to === profile);
  const unread = mine.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) { setOpen(false); dispatch({ type: 'READ_NOTICES', to: profile }); }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, dispatch, profile]);

  const toggle = () => {
    if (open) dispatch({ type: 'READ_NOTICES', to: profile });
    setOpen(o => !o);
  };

  return (
    <div className="bell" ref={ref}>
      <button onClick={toggle} aria-label={unread ? t('Avisos ({n} novos)', { n: unread }) : t('Avisos')} aria-expanded={open}>
        <BellIcon />
      </button>
      {unread > 0 && <span className="badge">{unread}</span>}
      {open && (
        <div className="panel">
          <h3>{t('Avisos')}</h3>
          {mine.length === 0 && <p className="muted" style={{ padding: '4px 10px 10px', margin: 0 }}>{t('Nenhum aviso novo.')}</p>}
          {mine.map(n => (
            <div key={n.id} className={`n ${n.read ? '' : 'unread'}`}>
              <strong>{t(n.title)}</strong>
              <p>{tv(n.body, n.vars)}</p>
              <time>{n.at}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Menus laterais por perfil ---------- */

interface NavItem { to: string; label: string; end?: boolean; match?: string }

const NAV: Record<Profile, NavItem[]> = {
  integrador: [
    { to: '/integrador', label: 'Office', end: true },
    { to: '/integrador/pipeline', label: 'Pipeline e CRM' },
    { to: '/integrador/leads', label: 'Leads' },
    { to: '/integrador/pre-proposta', label: 'Propostas' },
    { to: '/integrador/projetos/hotel-planalto', label: 'Projetos', match: '/integrador/projetos' },
    { to: '/integrador/documentos', label: 'Documentos' },
    { to: '/integrador/catalogo', label: 'Catálogo' },
    { to: '/integrador/relatorios', label: 'Relatórios' },
    { to: '/integrador/acessos', label: 'Registro de acessos' },
  ],
  saso: [
    { to: '/saso', label: 'Fila de validação', end: true },
    { to: '/saso/leads', label: 'Leads' },
    { to: '/saso/integradores', label: 'Integradores' },
    { to: '/saso/projetos', label: 'Projetos' },
    { to: '/saso/ordens', label: 'Ordens de compra' },
    { to: '/saso/catalogo', label: 'Catálogo e preços' },
    { to: '/saso/relatorios', label: 'Relatórios' },
    { to: '/saso/acessos', label: 'Registro de acessos' },
  ],
  fornecedor: [
    { to: '/fornecedor', label: 'Painel', end: true },
    { to: '/fornecedor/ordens', label: 'Ordens de compra' },
    { to: '/fornecedor/leads', label: 'Leads encaminhados' },
    { to: '/fornecedor/apoio', label: 'Apoio técnico' },
    { to: '/fornecedor/relatorios', label: 'Relatórios' },
  ],
};

const SUBTITLE: Record<Profile, string> = { integrador: 'Nível: Certificado', saso: 'Perfil: Engenharia', fornecedor: 'Perfil: Fornecedor' };

export function Sidebar({ profile }: { profile: Profile }) {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const name = state.session?.name ?? PROFILES[profile].name;
  const logout = () => { dispatch({ type: 'LOGOUT' }); navigate('/'); };

  return (
    <nav className={`side no-print side-${profile}`} aria-label={t('Menu principal')}>
      <Brand />
      {NAV[profile].map(n => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) => (isActive || (n.match && pathname.startsWith(n.match)) ? 'active' : '')}
        >
          {t(n.label)}
        </NavLink>
      ))}
      <button className="side-logout mobile-only" onClick={logout}>{t('Sair')}</button>
      <div className="user">
        <strong>{t(name)}</strong>
        <div style={{ marginTop: 4 }}>{t(SUBTITLE[profile])}</div>
        <button className="side-logout" onClick={logout}>{t('Sair')}</button>
      </div>
    </nav>
  );
}

/** Estrutura comum de todas as páginas logadas: menu lateral + barra superior + conteúdo. */
export function AppShell({ profile, children, wide }: { profile: Profile; children: ReactNode; wide?: boolean }) {
  return (
    <div className="shell page">
      <Sidebar profile={profile} />
      <div className="content">
        <div className="utilbar no-print">
          <LangSwitch />
          <Bell profile={profile} />
        </div>
        <main className={`main ${wide ? '' : 'centered'}`}>{children}</main>
      </div>
    </div>
  );
}

/* ---------- Barra de demonstração (para conduzir a apresentação) ---------- */

const SCRIPT: [string, string, string][] = [
  ['Integrador aceita um lead', 'No office, aceite o lead “Posto Rota 60”: ele entra na proteção de 45 dias.', '/integrador'],
  ['Gera a pré-proposta em PDF', 'Em “Gerar pré-proposta”, o PDF sai na hora com valor único.', '/integrador/pre-proposta'],
  ['Envia as premissas da visita', 'Use “preencher exemplo” e envie para validação.', '/integrador/pre-proposta#premissas'],
  ['Engenharia SASO valida', 'O projeto aparece na fila. Informe o preço, comente e aprove.', '/saso'],
  ['Fornecedor atualiza a ordem de compra', 'Avance a PO-0007 para “Entregue”, sem ver nenhum valor.', '/fornecedor'],
  ['Integrador acompanha tudo', 'O painel de etapas avança sozinho e o acesso fica registrado.', '/integrador/projetos/hotel-planalto'],
];

export function DemoBar() {
  const { state, dispatch, toast } = useStore();
  const { t } = useT();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const go = useGo();
  const [panel, setPanel] = useState<'decisoes' | 'roteiro' | null>(null);
  const s = state.settings;
  const current = profileOf(pathname);

  const toggle = (p: 'decisoes' | 'roteiro') => setPanel(x => (x === p ? null : p));

  return (
    <>
      {panel === 'decisoes' && (
        <div className="decisions" role="dialog" aria-label={t('Pontos em aberto')}>
          <div className="between">
            <h3>{t('Pontos em aberto · veja as duas opções')}</h3>
            <button className="link" onClick={() => setPanel(null)}>{t('Fechar')}</button>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="small" style={{ fontWeight: 600 }}>{t('Preço na pré-proposta')}</span>
            <div className="seg">
              <button className={s.formatoPreco === 'apartir' ? 'on' : ''} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { formatoPreco: 'apartir' } })}>{t('“A partir de”')}</button>
              <button className={s.formatoPreco === 'faixa' ? 'on' : ''} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { formatoPreco: 'faixa' } })}>{t('Faixa de preço')}</button>
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="small" style={{ fontWeight: 600 }}>{t('O que o fornecedor vê do cliente final')}</span>
            <div className="seg">
              <button className={s.clienteVisivel === 'regiao' ? 'on' : ''} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { clienteVisivel: 'regiao' } })}>{t('Só a região')}</button>
              <button className={s.clienteVisivel === 'completo' ? 'on' : ''} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { clienteVisivel: 'completo' } })}>{t('Cliente e cidade')}</button>
            </div>
          </div>
          <p className="note">{t('A escolha muda as telas na hora. Na versão final fica só a opção aprovada.')}</p>
        </div>
      )}
      {panel === 'roteiro' && (
        <div className="decisions" role="dialog" aria-label={t('Roteiro da demonstração')} style={{ width: 480 }}>
          <div className="between">
            <h3>{t('Roteiro da demonstração')}</h3>
            <button className="link" onClick={() => setPanel(null)}>{t('Fechar')}</button>
          </div>
          <ol className="script compact">
            {SCRIPT.map(([title, d, to]) => (
              <li key={title}>
                <button onClick={() => { setPanel(null); go(to); }}><strong>{t(title)}</strong><span>{t(d)}</span></button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <nav className="demo-bar no-print" aria-label={t('Navegação da demonstração')}>
        <span className="tag">{t('Demonstração')}</span>
        <Link to="/" className={pathname === '/' ? 'active' : ''} onClick={() => dispatch({ type: 'LOGOUT' })}>{t('Login')}</Link>
        <button className={current === 'integrador' ? 'active' : ''} onClick={() => go('/integrador')}>{t('Integrador')}</button>
        <button className={current === 'saso' ? 'active' : ''} onClick={() => go('/saso')}>SASO</button>
        <button className={current === 'fornecedor' ? 'active' : ''} onClick={() => go('/fornecedor')}>{t('Fornecedor')}</button>
        <Link to="/cronograma" className={pathname === '/cronograma' ? 'active' : ''}>{t('Cronograma')}</Link>
        <span className="sep" />
        <button onClick={() => toggle('roteiro')} aria-expanded={panel === 'roteiro'}>{t('Roteiro')}</button>
        <button onClick={() => toggle('decisoes')} aria-expanded={panel === 'decisoes'}>{t('Pontos em aberto')}</button>
        <button
          onClick={() => {
            const msg = t('Demonstração reiniciada com os dados iniciais.');
            dispatch({ type: 'RESET' });
            setPanel(null);
            navigate('/');
            setTimeout(() => toast(msg, 'info'), 50);
          }}
        >
          {t('Reiniciar')}
        </button>
      </nav>
    </>
  );
}
