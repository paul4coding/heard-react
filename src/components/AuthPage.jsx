import { useState } from 'react';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { Tracker } from './Status.jsx';
import { DEPTS, PEOPLE } from '../data.js';

const ROLES = [
  ['student', 'Student', 'user'],
  ['head', 'Department head', 'users'],
  ['admin', 'Administrator', 'shield'],
];

function RolePicker({ legend, name, value, onChange }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
      <legend className="l" style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: 6, padding: 0 }}>{legend}</legend>
      <div className="roles">
        {ROLES.map(([v, label, icon]) => (
          <label className="role" key={v}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span><Icon name={icon} />{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SignIn({ onEnter, onSwap }) {
  const [role, setRole] = useState('student');
  const [show, setShow] = useState(false);

  return (
    <div>
      <h2>Welcome back</h2>
      <p className="sub">Sign in to lodge a complaint or follow up on one.</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); onEnter(role, PEOPLE[role].name); }}>
        <RolePicker legend="Sign in as" name="role-in" value={role} onChange={setRole} />
        <label className="field"><span className="l">University email</span>
          <span className="input-wrap"><Icon name="mail" />
            <input className="input" type="email" placeholder="you@university.edu" autoComplete="email" />
          </span>
        </label>
        <label className="field"><span className="l">Password</span>
          <span className="input-wrap"><Icon name="lock" />
            <input className="input" type={show ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" />
            <button type="button" className="peek" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eyeoff' : 'eye'} />
            </button>
          </span>
        </label>
        <button className="btn primary lg block" type="submit">Sign in</button>
      </form>
      <p className="hint"><Icon name="info" /><span>This is a design prototype. Pick a role and sign in to preview that dashboard. Any email and password will work.</span></p>
      <p className="swap">New here? <button type="button" onClick={onSwap}>Create an account</button></p>
    </div>
  );
}

function SignUp({ onEnter, onSwap }) {
  const [role, setRole] = useState('student');
  const [f, setF] = useState({ name: '', id: '', email: '', dept: '', p1: '', p2: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const student = role === 'student';

  const submit = (e) => {
    e.preventDefault();
    let msg = '';
    if (!f.name.trim() || !f.email.trim() || !f.dept) msg = 'Fill in your name, email and department to continue.';
    else if (f.p1.length < 8) msg = 'Choose a password with at least 8 characters.';
    else if (f.p1 !== f.p2) msg = 'The two passwords do not match. Retype them to continue.';
    setErr(msg);
    if (!msg) onEnter(role, f.name.trim());
  };

  return (
    <div>
      <h2>Create your account</h2>
      <p className="sub">It takes a minute. Use your university email.</p>
      <form noValidate onSubmit={submit}>
        <RolePicker legend="I am a" name="role-up" value={role} onChange={setRole} />
        <div className="row2">
          <label className="field"><span className="l">Full name</span>
            <input className="input" placeholder="Amara Okafor" autoComplete="name" value={f.name} onChange={set('name')} /></label>
          <label className="field"><span className="l">{student ? 'Student ID' : 'Staff invite code'}</span>
            <input className="input" placeholder={student ? 'e.g. 2026-04817' : 'Sent by your administrator'} value={f.id} onChange={set('id')} /></label>
        </div>
        <label className="field"><span className="l">University email</span>
          <input className="input" type="email" placeholder="you@university.edu" autoComplete="email" value={f.email} onChange={set('email')} /></label>
        <label className="field"><span className="l">Department</span>
          <select className="input" value={f.dept} onChange={set('dept')}>
            <option value="">Choose your department</option>
            {DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <div className="row2">
          <label className="field"><span className="l">Password</span>
            <input className="input" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={f.p1} onChange={set('p1')} /></label>
          <label className="field"><span className="l">Confirm password</span>
            <input className="input" type="password" placeholder="Repeat password" autoComplete="new-password" value={f.p2} onChange={set('p2')} /></label>
        </div>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary lg block" type="submit">Create account</button>
      </form>
      <p className="swap">Already registered? <button type="button" onClick={onSwap}>Sign in</button></p>
    </div>
  );
}

export default function AuthPage({ onEnter, onBack, initialTab = 'in' }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <main className="auth">
      <section className="brand-panel" aria-label="About Heard">
        <Logo />
        <div>
          <h1>Report it once. Watch it get fixed.</h1>
          <p className="lede">One place for every classroom, facilities and admin complaint on campus, with a clear status from the moment you send it.</p>
        </div>
        <div className="demo-card" aria-hidden="true">
          <div className="top"><span className="ref">CMP-1048</span><span className="pill s3">In progress</span></div>
          <h3>Projector in Room B204 keeps flickering</h3>
          <Tracker stage={3} />
          <p className="note"><b>Dr. Naidoo:</b> A replacement lamp is on order. Technicians will fit it on Thursday.</p>
        </div>
      </section>

      <section className="auth-panel">
        <button className="btn ghost auth-back" onClick={onBack}>&larr; Home</button>
        <div className="auth-box">
          <Logo />
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'in'} onClick={() => setTab('in')}>Sign in</button>
            <button role="tab" aria-selected={tab === 'up'} onClick={() => setTab('up')}>Create account</button>
          </div>
          {tab === 'in'
            ? <SignIn onEnter={onEnter} onSwap={() => setTab('up')} />
            : <SignUp onEnter={onEnter} onSwap={() => setTab('in')} />}
        </div>
      </section>
    </main>
  );
}
