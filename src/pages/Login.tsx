import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/ui';
import { PROFILES, useStore, type Profile } from '../state/store';

const OPTIONS: { id: Profile; title: string; text: string }[] = [
  { id: 'integrador', title: 'Integrador', text: 'Vendas, propostas e projetos' },
  { id: 'saso', title: 'SASO', text: 'Engenharia e gestão' },
  { id: 'fornecedor', title: 'Fornecedor', text: 'Ordens de compra' },
];

export default function Login() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>('integrador');
  const [email, setEmail] = useState(PROFILES.integrador.email);
  const [senha, setSenha] = useState('demonstracao');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const pick = (p: Profile) => { setProfile(p); setEmail(PROFILES[p].email); setError(''); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Informe um e-mail válido.'); return; }
    if (senha.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: 'LOGIN', profile, email });
      navigate(PROFILES[profile].home);
    }, 450);
  };

  return (
    <div className="login">
      <section className="login-art">
        <Brand />
        <div>
          <h1>Venda, valide e entregue eletropostos em um só lugar.</h1>
          <p>Integradores, engenharia e operação trabalhando no mesmo fluxo, cada um vendo apenas o que deve ver.</p>
        </div>
        <ul>
          <li><strong>45 dias</strong><span>de proteção para cada oportunidade</span></li>
          <li><strong>48 h</strong><span>para aceitar um lead</span></li>
          <li><strong>5 dias úteis</strong><span>para a validação técnica</span></li>
        </ul>
      </section>

      <section className="login-form">
        <form onSubmit={submit} noValidate>
          <div className="mobile-only" style={{ marginBottom: 8 }}><Brand /></div>
          <div>
            <h2 className="display" style={{ fontSize: 26 }}>Entrar na plataforma</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>Escolha seu tipo de acesso.</p>
          </div>

          <div className="profile-pick" role="radiogroup" aria-label="Tipo de acesso">
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
                <strong>{o.title}</strong>
                <span>{o.text}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span>E-mail</span>
            <input className={`input ${error.includes('e-mail') ? 'err' : ''}`} type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="between" style={{ fontWeight: 600 }}>
              Senha
              <button type="button" className="link small" onClick={() => setForgot(true)}>Esqueci minha senha</button>
            </span>
            <div style={{ position: 'relative' }}>
              <input className={`input ${error.includes('senha') ? 'err' : ''}`} type={show ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} style={{ paddingRight: 72 }} />
              <button type="button" className="link small" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: 13 }}>{show ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </label>
          {error && <span className="err-msg">{error}</span>}
          {forgot && <p className="note" style={{ color: 'var(--green-dark)' }}>Enviamos um link de redefinição para {email || 'seu e-mail'}.</p>}

          <button className="btn primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando…' : `Entrar como ${OPTIONS.find(o => o.id === profile)!.title}`}
          </button>
          <p className="note" style={{ textAlign: 'center' }}>
            {profile === 'integrador' ? 'Ainda não é credenciado? Fale com a SASO para iniciar o credenciamento.' : 'Acesso restrito a usuários autorizados.'}
          </p>
        </form>
      </section>
    </div>
  );
}
