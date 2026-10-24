import { useState } from 'react';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { Tracker } from './Status.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr('Enter your email address and password to continue.');
      return;
    }
    if (!EMAIL.test(email.trim())) {
      setErr('Enter a valid email address, for example you@university.edu.');
      return;
    }
    setBusy(true);
    setErr('');
    const error = await onLogin(email.trim(), password);
    if (error) {
      setErr(error);
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <section className="brand-panel" aria-label="About Heard">
        <Logo />
        <div>
          <h1>Report it once. Watch it get fixed.</h1>
          <p className="lede">One place for every classroom, facilities and admin complaint on campus, with a clear status from the moment you send it.</p>
        </div>
        <div className="demo-card" aria-hidden="true">
          <div className="top"><span className="ref">CMP-2026-0048</span><span className="pill s2">In progress</span></div>
          <h3>Projector in Room B204 keeps flickering</h3>
          <Tracker stage={2} />
          <p className="note"><b>Dr. Naidoo:</b> A replacement lamp is on order. Technicians will fit it on Thursday.</p>
        </div>
      </section>

      <section className="auth-panel">
        <button className="btn ghost auth-back" onClick={onBack}>&larr; Home</button>
        <div className="auth-box">
          <Logo />
          <h2>Welcome back</h2>
          <p className="sub">Sign in to lodge a complaint or follow up on one.</p>
          <form noValidate onSubmit={submit}>
            <label className="field"><span className="l">Email address</span>
              <span className="input-wrap"><Icon name="mail" />
                <input className="input" type="email" placeholder="you@university.edu" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
            </label>
            <label className="field"><span className="l">Password</span>
              <span className="input-wrap"><Icon name="lock" />
                <input className="input" type={show ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="peek" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                  <Icon name={show ? 'eyeoff' : 'eye'} />
                </button>
              </span>
            </label>
            {err && <p className="error" role="alert">{err}</p>}
            <button className="btn primary lg block" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="hint"><Icon name="info" /><span>Accounts are created by an administrator. Ask yours if you do not have one yet.</span></p>
        </div>
      </section>
    </main>
  );
}
