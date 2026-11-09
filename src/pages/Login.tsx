import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand, LangSwitch } from '../components/ui';
import { PROFILES, useStore, type Profile } from '../state/store';
import { useT } from '../i18n';

const OPTIONS: { id: Profile; title: string; text: string }[] = [
  { id: 'integrador', title: 'Integrador', text: 'Vendas, propostas e projetos' },
  { id: 'saso', title: 'SASO', text: 'Engenharia e gestão' },
  { id: 'fornecedor', title: 'Fornecedor', text: 'Ordens de compra' },
];

export default function Login() {
  const { dispatch } = useStore();
  const { t } = useT();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>('integrador');
  const [email, setEmail] = useState(PROFILES.integrador.email);
  const [senha, setSenha] = useState('demonstracao');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<'' | 'email' | 'senha'>('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const pick = (p: Profile) => { setProfile(p); setEmail(PROFILES[p].email); setError(''); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('email'); return; }
    if (senha.length < 6) { setError('senha'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: 'LOGIN', profile, email });
      navigate(PROFILES[profile].home);
    }, 450);
  };

  const title = t(OPTIONS.find(o => o.id === profile)!.title);

  return (
    <div className="login">
      <section className="login-art">
        <Brand />
        <div>
          <h1>{t('Venda, valide e entregue eletropostos em um só lugar.')}</h1>
          <p>{t('Integradores, engenharia e operação trabalhando no mesmo fluxo, cada um vendo apenas o que deve ver.')}</p>
        </div>
        <ul>
          <li><strong>{t('45 dias')}</strong><span>{t('de proteção para cada oportunidade')}</span></li>
          <li><strong>{t('48 h')}</strong><span>{t('para aceitar um lead')}</span></li>
          <li><strong>{t('5 dias úteis')}</strong><span>{t('para a validação técnica')}</span></li>
        </ul>
      </section>

      <section className="login-form">
        <div className="login-lang"><LangSwitch /></div>
        <form onSubmit={submit} noValidate>
          <div className="mobile-only" style={{ marginBottom: 8 }}><Brand /></div>
          <div>
            <h2 className="display" style={{ fontSize: 26 }}>{t('Entrar na plataforma')}</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>{t('Escolha seu tipo de acesso.')}</p>
          </div>

          <div className="profile-pick" role="radiogroup" aria-label={t('Tipo de acesso')}>
            {OPTIONS.map(o => (
              <button
                type="button"
                key={o.id}
                role="radio"
                aria-checked={profile === o.id}
                className={`pick pick-${o.id} ${profile === o.id ? 'on' : ''}`}
                onClick={() => pick(o.id)}
              >
                <span className="dot" />
                <strong>{t(o.title)}</strong>
                <span>{t(o.text)}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span>{t('E-mail')}</span>
            <input className={`input ${error === 'email' ? 'err' : ''}`} type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="between" style={{ fontWeight: 600 }}>
              {t('Senha')}
              <button type="button" className="link small" onClick={() => setForgot(true)}>{t('Esqueci minha senha')}</button>
            </span>
            <div style={{ position: 'relative' }}>
              <input className={`input ${error === 'senha' ? 'err' : ''}`} type={show ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} style={{ paddingRight: 80 }} />
              <button type="button" className="link small" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: 13 }}>{show ? t('Ocultar') : t('Mostrar')}</button>
            </div>
          </label>
          {error && <span className="err-msg">{error === 'email' ? t('Informe um e-mail válido.') : t('A senha precisa ter pelo menos 6 caracteres.')}</span>}
          {forgot && <p className="note" style={{ color: 'var(--green-dark)' }}>{t('Enviamos um link de redefinição para {email}.', { email: email || t('seu e-mail') })}</p>}

          <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? t('Entrando…') : t('Entrar como {perfil}', { perfil: title })}
          </button>
          <p className="note" style={{ textAlign: 'center' }}>
            {profile === 'integrador' ? t('Ainda não é credenciado? Fale com a SASO para iniciar o credenciamento.') : t('Acesso restrito a usuários autorizados.')}
          </p>
        </form>
      </section>
    </div>
  );
}
