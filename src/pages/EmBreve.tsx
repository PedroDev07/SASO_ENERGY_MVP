import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/ui';
import { PROFILES, type Profile } from '../state/store';
import { useT } from '../i18n';

type Info = { title: string; phase: 1 | 2 | 3; text: string };

const SECTIONS: Record<Profile, Record<string, Info>> = {
  integrador: {
    pipeline: { title: 'Pipeline e CRM', phase: 2, text: 'Funil completo por etapa, histórico de cada oportunidade, proteção de 45 dias e recompra.' },
    leads: { title: 'Leads', phase: 2, text: 'Todos os leads recebidos da SASO, com prazo de 48 horas para aceite e histórico.' },
    documentos: { title: 'Documentos', phase: 2, text: 'Documentos da empresa e dos projetos, com controle de versões e alerta de vencimento.' },
    catalogo: { title: 'Catálogo', phase: 1, text: 'Produtos com fichas técnicas e a tabela de preços de referência.' },
    relatorios: { title: 'Relatórios', phase: 3, text: 'Relatórios de vendas, conversão por etapa, prazos e comissões.' },
    acessos: { title: 'Registro de acessos', phase: 1, text: 'Quem acessou cada cliente e projeto, quando e o que fez.' },
  },
  saso: {
    leads: { title: 'Leads', phase: 2, text: 'Todos os leads recebidos, origem, distribuição aos integradores e prazos de aceite.' },
    integradores: { title: 'Integradores', phase: 1, text: 'Cadastro e credenciamento: níveis, documentos exigidos, vencimentos e bloqueios.' },
    projetos: { title: 'Projetos', phase: 3, text: 'Todos os projetos em andamento, com o painel de etapas e o status de pagamento.' },
    ordens: { title: 'Ordens de compra', phase: 3, text: 'Emissão e acompanhamento das ordens de compra junto ao fornecedor.' },
    catalogo: { title: 'Catálogo e preços', phase: 1, text: 'Produtos, fichas técnicas e a tabela de preços de referência usada nas pré-propostas.' },
    relatorios: { title: 'Relatórios', phase: 3, text: 'Visão gerencial: vendas, conversão, prazos de validação e desempenho por integrador.' },
    acessos: { title: 'Registro de acessos', phase: 1, text: 'Auditoria de todos os acessos da plataforma, por usuário e por projeto.' },
  },
  fornecedor: {
    ordens: { title: 'Ordens de compra', phase: 3, text: 'Histórico completo das ordens de compra recebidas e de cada atualização de status.' },
    leads: { title: 'Leads encaminhados', phase: 2, text: 'Leads enviados à SASO e o andamento de cada um, sem valores.' },
    apoio: { title: 'Apoio técnico', phase: 3, text: 'Pedidos de apoio técnico da engenharia SASO, somente com os arquivos técnicos.' },
    relatorios: { title: 'Relatórios', phase: 3, text: 'Unidades vendidas, kW instalados e distribuição por região.' },
  },
};

const PHASE = {
  1: { label: 'Fase 1 · Mês 1', color: 'var(--green)' },
  2: { label: 'Fase 2 · Mês 2', color: 'var(--blue)' },
  3: { label: 'Fase 3 · Mês 3', color: '#A86A00' },
};

export default function EmBreve({ profile }: { profile: Profile }) {
  const { secao = '' } = useParams();
  const { t } = useT();
  const s = SECTIONS[profile][secao];
  const home = PROFILES[profile].home;

  if (!s) {
    return (
      <AppShell profile={profile}>
        <h1>{t('Página não encontrada')}</h1>
        <Link to={home} className="link">{t('Voltar ao início')}</Link>
      </AppShell>
    );
  }

  const ph = PHASE[s.phase];
  return (
    <AppShell profile={profile}>
      <h1>{t(s.title)}</h1>
      <section className="card pad-lg" style={{ maxWidth: 640, borderTop: `6px solid ${ph.color}` }}>
        <span className="chip t-gray">{t('Entra na {fase}', { fase: t(ph.label) })}</span>
        <p style={{ margin: 0, fontSize: 15 }}>{t(s.text)}</p>
        <p className="note">{t('Esta área não faz parte das telas do design v1. Ela entra conforme o cronograma de entrega.')}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/cronograma" className="btn">{t('Ver cronograma')}</Link>
          <Link to={home} className="btn primary">{t('Voltar ao início')}</Link>
        </div>
      </section>
    </AppShell>
  );
}
