import { useEffect, useRef, useState } from 'react';
import Attachments from './Attachments.jsx';
import Icon from './Icon.jsx';
import { Pill, Tracker } from './Status.jsx';
import { Priority } from '../views/ComplaintList.jsx';
import { STAGES, PRIORITIES } from '../data.js';

// Transitions autorisées par le backend (indices de STAGES)
const NEXT = { 0: [1], 1: [2], 2: [3], 3: [4, 2], 4: [] };
const REOPEN = 'Reopen (back to In progress)';

const statusLabel = (from, to) => (from === 3 && to === 2 ? REOPEN : STAGES[to]);

function Note({ value, onChange, placeholder }) {
  return (
    <label className="field"><span className="l">Message</span>
      <textarea className="input" style={{ minHeight: 90 }} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SaveButton({ busy, disabled, label = 'Save update', onClick }) {
  return <button className="btn primary block" disabled={busy || disabled} onClick={onClick}>{busy ? 'Saving…' : label}</button>;
}

function StudentForm({ c, onAction }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (c.stage === 4) return <div className="note-ok dsec"><Icon name="info" /><span>This complaint is closed.</span></div>;

  const send = async () => {
    setBusy(true);
    const err = await onAction({ kind: 'comment', note: note.trim() });
    setBusy(false);
    if (!err) setNote('');
  };

  return (
    <section className="panel pad dsec">
      <h3>Send a message</h3>
      <Note value={note} onChange={setNote} placeholder="Add details or ask for news." />
      <SaveButton busy={busy} disabled={!note.trim()} label="Send message" onClick={send} />
    </section>
  );
}

function CoordinatorForm({ c, onAction }) {
  const options = c.stage === 1 || c.stage === 2 ? NEXT[c.stage] : [];
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (c.stage === 4) return <div className="note-ok dsec"><Icon name="info" /><span>This complaint is closed.</span></div>;

  const changed = stage !== c.stage;
  const save = async () => {
    setBusy(true);
    await onAction({ kind: 'staff', stage: changed ? stage : null, note: note.trim() });
    setBusy(false);
  };

  return (
    <section className="panel pad dsec">
      <h3>Post an update</h3>
      {options.length > 0 && (
        <label className="field"><span className="l">Status</span>
          <select className="input" value={stage} onChange={(e) => setStage(+e.target.value)}>
            <option value={c.stage}>{STAGES[c.stage]} (current)</option>
            {options.map((i) => <option key={i} value={i}>{STAGES[i]}</option>)}
          </select>
        </label>
      )}
      <Note value={note} onChange={setNote} placeholder={stage === 3 ? 'Describe the resolution.' : 'What has been done and what happens next.'} />
      <SaveButton busy={busy} disabled={!changed && !note.trim()} onClick={save} />
    </section>
  );
}

function AdminForm({ c, coordinators, onAction }) {
  const canAssign = c.stage <= 2;
  const options = c.stage === 0 ? [] : NEXT[c.stage];
  const [coord, setCoord] = useState(c.assigneeId ?? '');
  const [priority, setPriority] = useState(c.priority ?? '');
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const assignChanged = canAssign && coord !== '' && (coord !== c.assigneeId || priority !== (c.priority ?? ''));
  // Priorité seule : plainte non assignable (résolue) ou aucun coordinateur choisi
  const priorityChanged = !assignChanged && priority !== (c.priority ?? '') && priority !== '';
  const statusChanged = stage !== c.stage;
  const dirty = assignChanged || priorityChanged || statusChanged || note.trim();

  const save = async () => {
    setBusy(true);
    await onAction({
      kind: 'admin', assign: assignChanged ? { coordinatorId: +coord, priority: priority || null } : null,
      priority: priorityChanged ? priority : null, stage: statusChanged ? stage : null, note: note.trim(),
    });
    setBusy(false);
  };

  if (c.stage === 4) return <div className="note-ok dsec"><Icon name="info" /><span>This complaint is closed.</span></div>;

  return (
    <section className="panel pad dsec">
      <h3>Handle this complaint</h3>
      {canAssign && (
        <label className="field"><span className="l">Coordinator</span>
          <select className="input" value={coord} onChange={(e) => setCoord(e.target.value === '' ? '' : +e.target.value)}>
            <option value="">Choose a coordinator</option>
            {coordinators.map((u) => <option key={u.id} value={u.id}>{u.name}{u.department ? ` (${u.department})` : ''}</option>)}
          </select>
          {c.stage === 0 && <small>Assigning moves the complaint to Assigned.</small>}
        </label>
      )}
      <label className="field"><span className="l">Priority</span>
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">No priority</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
        </select>
      </label>
      {options.length > 0 && (
        <label className="field"><span className="l">Status</span>
          <select className="input" value={stage} onChange={(e) => setStage(+e.target.value)}>
            <option value={c.stage}>{STAGES[c.stage]} (current)</option>
            {options.map((i) => <option key={i} value={i}>{statusLabel(c.stage, i)}</option>)}
          </select>
        </label>
      )}
      <Note value={note} onChange={setNote} placeholder="What is happening and what to expect next." />
      <SaveButton busy={busy} disabled={!dirty} onClick={save} />
    </section>
  );
}

export default function Drawer({ complaint: c, role, userId, coordinators, open, loading, onClose, onAction, onUpload, onDeleteAttachment }) {
  const ref = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    if (open) {
      ref.current.scrollTop = 0;
      const t = setTimeout(() => closeBtn.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, c?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  let body = null;
  if (c) {
    const isStudent = role === 'student';
    const formKey = `${c.id}-${c.log.length}-${c.stage}-${c.assigneeId}-${c.priority}`;
    let action;
    if (role === 'admin') action = <AdminForm key={formKey} c={c} coordinators={coordinators} onAction={onAction} />;
    else if (role === 'coordinator') action = <CoordinatorForm key={formKey} c={c} onAction={onAction} />;
    else action = <StudentForm key={formKey} c={c} onAction={onAction} />;

    body = (
      <>
        <Pill stage={c.stage} />
        <h2>{c.title}</h2>
        <div className="dsec"><Tracker stage={c.stage} /></div>
        <dl className="panel meta">
          {c.cat && <div><dt>Category</dt><dd>{c.cat}</dd></div>}
          <div><dt>Priority</dt><dd><Priority value={c.priority} /></dd></div>
          <div><dt>Submitted</dt><dd>{c.date}</dd></div>
          <div>
            <dt>{isStudent ? 'Handled by' : 'From'}</dt>
            <dd>{isStudent ? (c.assignee || 'Not assigned yet') : c.owner}</dd>
          </div>
          {!isStudent && <div><dt>Assigned to</dt><dd>{c.assignee || 'Unassigned'}</dd></div>}
        </dl>
        <div className="dsec"><h3>Description</h3><p>{c.desc}</p></div>
        <Attachments key={`${c.id}-${c.attachments.length}`} complaint={c} role={role} userId={userId}
          onUpload={onUpload} onDelete={onDeleteAttachment} />
        {action}
        <div className="dsec">
          <h3>Updates</h3>
          {loading && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
          <ul className="log">
            {[...c.log].reverse().map((l, i) => (
              <li key={i}><b>{l.st}</b><span>{l.when}</span><p>{l.note}</p></li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  return (
    <>
      {open && <div className="scrim open" onClick={onClose} />}
      <aside ref={ref} className={`drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Complaint details" aria-hidden={!open}>
        <div className="dr-top">
          <span className="ref">{c?.ref}</span>
          <button ref={closeBtn} className="icon-btn" onClick={onClose} aria-label="Close details"><Icon name="x" /></button>
        </div>
        {body}
      </aside>
    </>
  );
}
