import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { ROLE_LABEL } from '../data.js';
import { createUser, updateUser } from '../api.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['student', 'coordinator', 'admin'];

// "Amina Diallo" -> { first_name: "Amina", last_name: "Diallo" } (l'API stocke prénom et nom séparément)
const splitName = (full) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return { first_name: first ?? '', last_name: rest.join(' ') };
};

// Tiroir de création / modification d'un compte (sprint 1, story 1) :
// nom complet, email, rôle, statut du compte (+ mot de passe à la création, réinitialisation en option ensuite).
export default function UserDrawer({ user, me, open, onClose, onSaved }) {
  const editing = !!user;
  const isSelf = editing && user.id === me.id;
  const [form, setForm] = useState({ name: '', email: '', role: 'student', active: true, password: '' });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const ref = useRef(null);
  const first = useRef(null);

  // Réinitialise le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? { name: user.name, email: user.email, role: user.role, active: user.active, password: '' }
      : { name: '', email: '', role: 'student', active: true, password: '' });
    setErrors({});
    setApiErr('');
    setConfirming(false);
    setShowPw(false);
    ref.current && (ref.current.scrollTop = 0);
    const t = setTimeout(() => first.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter the full name.';
    if (!form.email.trim()) e.email = 'Enter an email address.';
    else if (!EMAIL.test(form.email.trim())) e.email = 'Enter a valid email address, for example you@university.edu.';
    if (!editing && form.password.length < 8) e.password = 'The password needs at least 8 characters.';
    if (editing && form.password && form.password.length < 8) e.password = 'The new password needs at least 8 characters.';
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    setApiErr('');
    if (Object.keys(e).length) return;
    // Désactiver un compte existant demande une confirmation explicite
    if (editing && user.active && !form.active && !confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    const { first_name, last_name } = splitName(form.name);
    try {
      const body = { first_name, last_name, email: form.email.trim(), role: form.role.toUpperCase(), is_active: form.active };
      if (form.password) body.password = form.password;
      const saved = editing ? await updateUser(user.id, body) : await createUser(body);
      onSaved(editing ? 'User updated' : 'User created', saved);
    } catch (err) {
      // Les messages d'erreur de l'API sont en français : on affiche un message clair en anglais pour les cas connus
      setApiErr(err.status === 409 && /email/i.test(err.message) ? 'This email address is already used by another account.'
        : err.status === 409 ? 'You cannot deactivate or change the role of your own account.' : err.message);
      setConfirming(false);
      if (err.status === 401) onSaved(null, null, err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && <div className="scrim open" onClick={onClose} />}
      <aside ref={ref} className={`drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={editing ? 'Edit user' : 'New user'} aria-hidden={!open}>
        <div className="dr-top">
          <span className="ref">{editing ? `User #${user.id}` : 'New user'}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <h2>{editing ? user.name : 'Create an account'}</h2>

        <form className="panel pad" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label className="field"><span className="l">Full name</span>
            <input ref={first} className="input" placeholder="Amina Diallo" autoComplete="off" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <small className="field-err" role="alert">{errors.name}</small>}
          </label>
          <label className="field"><span className="l">Email address</span>
            <input className="input" type="email" placeholder="name@university.edu" autoComplete="off" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
            {errors.email && <small className="field-err" role="alert">{errors.email}</small>}
          </label>
          <div className="row2">
            <label className="field"><span className="l">Role</span>
              <select className="input" value={form.role} onChange={set('role')} disabled={isSelf}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <label className="field"><span className="l">Account status</span>
              <select className="input" value={form.active ? 'active' : 'inactive'} onChange={(e) => { setForm({ ...form, active: e.target.value === 'active' }); setConfirming(false); }} disabled={isSelf}>
                <option value="active">Active</option>
                <option value="inactive">Deactivated</option>
              </select>
            </label>
          </div>
          {isSelf && <p className="note-ok" style={{ marginBottom: 16 }}><Icon name="info" /><span>This is your own account: you cannot change your role or deactivate it.</span></p>}
          <label className="field"><span className="l">{editing ? 'New password' : 'Password'}{editing && <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}> (leave empty to keep the current one)</span>}</span>
            <span className="input-wrap">
              <Icon name="lock" />
              <input className="input" type={showPw ? 'text' : 'password'} placeholder={editing ? 'Reset the password' : 'At least 8 characters'} autoComplete="new-password" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} />
              <button type="button" className="peek" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}><Icon name={showPw ? 'eyeoff' : 'eye'} /></button>
            </span>
            {errors.password && <small className="field-err" role="alert">{errors.password}</small>}
          </label>

          {apiErr && <p className="error" role="alert">{apiErr}</p>}

          {confirming ? (
            <div className="confirm-box" role="alertdialog" aria-label="Confirm deactivation">
              <b>Deactivate {user.name}?</b>
              <p>They will no longer be able to sign in. You can reactivate the account at any time.</p>
              <div className="confirm-acts">
                <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
                <button type="submit" className="btn danger" disabled={busy}>{busy ? 'Saving…' : 'Deactivate'}</button>
              </div>
            </div>
          ) : (
            <button className="btn primary block" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create user'}</button>
          )}
        </form>
      </aside>
    </>
  );
}
