import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import './styles.css';
import { PROFILES, StoreProvider, useStore, type Profile } from './state/store';
import { DemoBar, Toasts } from './components/ui';
import { LOCALE, useT } from './i18n';
import Login from './pages/Login';
import Office from './pages/integrador/Office';
import PreProposta from './pages/integrador/PreProposta';
import Etapas from './pages/integrador/Etapas';
import EmBreve from './pages/EmBreve';
import FilaValidacao from './pages/saso/FilaValidacao';
import PainelFornecedor from './pages/fornecedor/PainelFornecedor';
import Cronograma from './pages/Cronograma';

const TITLES: [string, string][] = [
  ['/integrador/pre-proposta', 'Pré-proposta e premissas'],
  ['/integrador/projetos', 'Painel de etapas do projeto'],
  ['/integrador', 'Office do integrador'],
  ['/saso', 'Fila de validação técnica'],
  ['/fornecedor', 'Painel do fornecedor'],
  ['/cronograma', 'Cronograma de entrega'],
];

function ScrollAndTitle() {
  const { pathname, hash } = useLocation();
  const { t, lang } = useT();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  useEffect(() => {
    const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1];
    document.title = title ? `${t(title)} · SASO ENERGY` : `SASO ENERGY · ${t('Entrar')}`;
    document.documentElement.lang = LOCALE[lang];
  }, [pathname, t, lang]);
  return null;
}

/** Só deixa entrar quem está logado com o perfil daquela área. */
function Guard({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { state } = useStore();
  if (state.session?.profile !== profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { state } = useStore();
  if (state.session) return <Navigate to={PROFILES[state.session.profile].home} replace />;
  return <Login />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <ScrollAndTitle />
        <Routes>
          <Route path="/" element={<LoginRoute />} />
          <Route path="/integrador" element={<Guard profile="integrador"><Office /></Guard>} />
          <Route path="/integrador/pre-proposta" element={<Guard profile="integrador"><PreProposta /></Guard>} />
          <Route path="/integrador/projetos/:id" element={<Guard profile="integrador"><Etapas /></Guard>} />
          <Route path="/integrador/:secao" element={<Guard profile="integrador"><EmBreve profile="integrador" /></Guard>} />
          <Route path="/saso" element={<Guard profile="saso"><FilaValidacao /></Guard>} />
          <Route path="/saso/:secao" element={<Guard profile="saso"><EmBreve profile="saso" /></Guard>} />
          <Route path="/fornecedor" element={<Guard profile="fornecedor"><PainelFornecedor /></Guard>} />
          <Route path="/fornecedor/:secao" element={<Guard profile="fornecedor"><EmBreve profile="fornecedor" /></Guard>} />
          <Route path="/cronograma" element={<Cronograma />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DemoBar />
        <Toasts />
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
);
