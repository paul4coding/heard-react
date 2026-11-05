import { useEffect, useRef, useState } from 'react';
import Attachments, { CommentPictures } from './Attachments.jsx';
import FilePicker from './FilePicker.jsx';
import Icon from './Icon.jsx';
import { Pill, Tracker } from './Status.jsx';
import { Priority } from '../views/ComplaintList.jsx';
import { STAGES, PRIORITIES, SHOW_PRIORITY } from '../data.js';

// Transitions autorisées par le backend (indices de STAGES)
const NEXT = { 0: [1], 1: [2], 2: [3], 3: [4, 2], 4: [] };
const REOPEN = 'Reopen (back to In progress)';
const MAX_RESOLUTION_PICTURES = 5;

const statusLabel = (from, to, hasReview) => {
  if (from === 3 && to === 2) return REOPEN;
  if (to === 4 && !hasReview) return 'Closed (waiting for the student’s review)';
  return STAGES[to];
};

function Note({ value, onChange, placeholder, label = 'Message' }) {
  return (
    <label className="field"><span className="l">{label}</span>
      <textarea className="input" style={{ minHeight: 90 }} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SaveButton({ busy, disabled, label = 'Save update', onClick }) {
  return <button className="btn primary block" disabled={busy || disabled} onClick={onClick}>{busy ? 'Saving…' : label}</button>;
}

const Closed = () => <div className="note-ok dsec"><Icon name="info" /><span>This complaint is closed.</span></div>;

/* ---------- Étudiant : avis sur la résolution (sprint 2, story 18) ---------- */
function ReviewPanel({ c, onAction }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState('');

  if (c.review) {
    return (
      <div className={`review-done ${c.review.satisfied ? 'ok' : 'no'} dsec`}>
        <Icon name={c.review.satisfied ? 'check' : 'info'} />
        <span>
          <b>{c.review.satisfied ? 'You said you are satisfied.' : 'You said you are not satisfied.'}</b>
          {c.review.comment && <em>“{c.review.comment}”</em>}
          {c.stage === 3 && ' An administrator will now close the complaint or reopen it.'}
        </span>
      </div>
    );
  }
  if (c.stage !== 3) return null;

  const send = async (satisfied) => {
    setBusy(satisfied ? 'yes' : 'no');
    await onAction({ kind: 'review', satisfied, comment: comment.trim() });
    setBusy('');
  };

  return (
    <section className="panel pad dsec review">
      <h3>Is your complaint solved?</h3>
      <p className="hint">Read the resolution below, then tell us. An administrator can close the complaint only after your answer.</p>
      <Note label="Comment (optional)" value={comment} onChange={setComment} placeholder="Anything you want to add about the result." />
      <div className="review-btns">
        <button className="btn primary" disabled={!!busy} onClick={() => send(true)}>{busy === 'yes' ? 'Sending…' : 'Satisfied'}</button>
        <button className="btn" disabled={!!busy} onClick={() => send(false)}>{busy === 'no' ? 'Sending…' : 'Not satisfied'}</button>
      </div>
    </section>
  );
}

function StudentForm({ c, onAction }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    const err = await onAction({ kind: 'comment', note: note.trim() });
    setBusy(false);
    if (!err) setNote('');
  };

  return (
    <>
      <ReviewPanel c={c} onAction={onAction} />
      {c.stage === 4 ? <Closed /> : (
        <section className="panel pad dsec">
          <h3>Send a message</h3>
          <Note value={note} onChange={setNote} placeholder="Add details or ask for news." />
          <SaveButton busy={busy} disabled={!note.trim()} label="Send message" onClick={send} />
        </section>
      )}
    </>
  );
}

/* ---------- Résolution : images facultatives (coordinateur et administrateur) ---------- */
function ResolutionPictures({ onChange, disabled }) {
  return (
    <div className="field"><span className="l">Pictures <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional, up to {MAX_RESOLUTION_PICTURES})</span></span>
      <FilePicker capacity={MAX_RESOLUTION_PICTURES} noun="picture" onChange={onChange} disabled={disabled} />
      <small>The student will see them with your message as proof of what was done.</small>
    </div>
  );
}

/* ---------- Coordinateur ---------- */
function RejectBox({ onAction }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);

  const reject = async () => {
    if (reason.trim().length < 5) return setErr('Explain in at least 5 characters why this complaint is not for you.');
    if (!confirm) return setConfirm(true);
    setBusy(true);
    const e = await onAction({ kind: 'reject', reason: reason.trim() });
    setBusy(false);
    if (e) { setErr(e); setConfirm(false); }
  };

  if (!open) {
    return (
      <div className="dsec">
        <button className="btn block" onClick={() => setOpen(true)}>This complaint is not for me</button>
      </div>
    );
  }
  return (
    <section className="panel pad dsec reject">
      <h3>Reject this complaint</h3>
      <p className="hint">It goes back to an administrator, who will send it to the right coordinator.</p>
      <Note label="Why is it wrongly assigned?" value={reason} onChange={(v) => { setReason(v); setErr(''); setConfirm(false); }} placeholder="e.g. This is a library matter, not facilities." />
      {err && <p className="error" role="alert">{err}</p>}
      <div className="review-btns">
        <button className="btn danger" disabled={busy} onClick={reject}>{busy ? 'Rejecting…' : confirm ? 'Confirm rejection' : 'Reject complaint'}</button>
        <button className="btn" disabled={busy} onClick={() => { setOpen(false); setConfirm(false); setErr(''); }}>Cancel</button>
      </div>
    </section>
  );
}

function CoordinatorForm({ c, onAction }) {
  const options = c.stage === 1 || c.stage === 2 ? NEXT[c.stage] : [];
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  if (c.stage === 4) return <Closed />;
  if (c.stage === 3) {
    return <div className="note-ok dsec"><Icon name="info" /><span>
      {c.review ? 'The student has given their opinion. An administrator will close the complaint.' : 'Waiting for the student’s opinion before an administrator closes the complaint.'}
    </span></div>;
  }

  const changed = stage !== c.stage;
  const resolving = stage === 3;
  const needsNote = resolving && files.length > 0 && !note.trim();
  const save = async () => {
    setBusy(true);
    await onAction({ kind: 'staff', stage: changed ? stage : null, note: note.trim(), files: resolving ? files : [] });
    setBusy(false);
  };

  return (
    <>
      {c.assignmentSource === 'AUTO' && c.stage === 1 && <RejectBox onAction={onAction} />}
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
        <Note value={note} onChange={setNote} placeholder={resolving ? 'Describe the resolution.' : 'What has been done and what happens next.'} />
        {resolving && <ResolutionPictures onChange={setFiles} disabled={busy} />}
        {needsNote && <p className="error" role="alert">Describe the resolution to attach pictures.</p>}
        <SaveButton busy={busy} disabled={(!changed && !note.trim()) || needsNote} onClick={save} />
      </section>
    </>
  );
}

/* ---------- Administrateur ---------- */
function AdminForm({ c, coordinators, onAction }) {
  const canAssign = c.stage <= 2;
  const options = c.stage === 0 ? [] : NEXT[c.stage];
  const [coord, setCoord] = useState(c.assigneeId ?? '');
  const [priority, setPriority] = useState(c.priority ?? '');
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const assignChanged = canAssign && coord !== '' && (coord !== c.assigneeId || priority !== (c.priority ?? ''));
  // Priorité seule : plainte non assignable (résolue) ou aucun coordinateur choisi
  const priorityChanged = !assignChanged && priority !== (c.priority ?? '') && priority !== '';
  const statusChanged = stage !== c.stage;
  const resolving = stage === 3 && c.stage === 2;
  const needsNote = resolving && files.length > 0 && !note.trim();
  const dirty = assignChanged || priorityChanged || statusChanged || note.trim();

  const save = async () => {
    setBusy(true);
    await onAction({
      kind: 'admin', assign: assignChanged ? { coordinatorId: +coord, priority: priority || null } : null,
      priority: priorityChanged ? priority : null, stage: statusChanged ? stage : null, note: note.trim(),
      files: resolving ? files : [],
    });
    setBusy(false);
  };

  if (c.stage === 4) return <Closed />;

  return (
    <section className="panel pad dsec">
      <h3>Handle this complaint</h3>
      {c.rejected && (
        <div className="banner warn">
          <Icon name="info" />
          <span><b>Rejected by a coordinator.</b> {c.rejectionReason && <em>“{c.rejectionReason}”</em>} Send it to another coordinator below.</span>
        </div>
      )}
      {c.stage === 3 && !c.review && (
        <div className="banner">
          <Icon name="info" />
          <span>Waiting for the student to say if they are satisfied. You can close the complaint after that.</span>
        </div>
      )}
      {canAssign && (
        <label className="field"><span className="l">Coordinator</span>
          <select className="input" value={coord} onChange={(e) => setCoord(e.target.value === '' ? '' : +e.target.value)}>
            <option value="">Choose a coordinator</option>
            {coordinators.map((u) => <option key={u.id} value={u.id}>{u.name}{u.department ? ` (${u.department})` : ''}</option>)}
          </select>
          {c.stage === 0 && <small>Assigning moves the complaint to Assigned. A coordinator cannot reject a complaint you assigned.</small>}
        </label>
      )}
      {SHOW_PRIORITY && (
        <label className="field"><span className="l">Priority</span>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">No priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
      )}
      {options.length > 0 && (
        <label className="field"><span className="l">Status</span>
          <select className="input" value={stage} onChange={(e) => setStage(+e.target.value)}>
            <option value={c.stage}>{STAGES[c.stage]} (current)</option>
            {options.map((i) => (
              <option key={i} value={i} disabled={i === 4 && !c.review}>{statusLabel(c.stage, i, !!c.review)}</option>
            ))}
          </select>
        </label>
      )}
      <Note value={note} onChange={setNote} placeholder={resolving ? 'Describe the resolution.' : 'What is happening and what to expect next.'} />
      {resolving && <ResolutionPictures onChange={setFiles} disabled={busy} />}
      {needsNote && <p className="error" role="alert">Describe the resolution to attach pictures.</p>}
      <SaveButton busy={busy} disabled={!dirty || needsNote} onClick={save} />
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
    const formKey = `${c.id}-${c.log.length}-${c.stage}-${c.assigneeId}-${c.priority}-${!!c.review}-${c.rejected}`;
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
          {SHOW_PRIORITY && <div><dt>Priority</dt><dd><Priority value={c.priority} /></dd></div>}
          <div><dt>Submitted</dt><dd>{c.date}</dd></div>
          <div>
            <dt>{isStudent ? 'Handled by' : 'From'}</dt>
            <dd>{isStudent ? (c.assignee || 'Not assigned yet') : c.owner}</dd>
          </div>
          {!isStudent && <div><dt>Assigned to</dt><dd>{c.assignee || (c.rejected ? 'Rejected, to reassign' : 'Unassigned')}</dd></div>}
          {!isStudent && c.review && <div><dt>Student review</dt><dd>{c.review.satisfied ? 'Satisfied' : 'Not satisfied'}{c.review.comment ? ` — ${c.review.comment}` : ''}</dd></div>}
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
              <li key={i}>
                <b>{l.st}</b><span>{l.when}</span><p>{l.note}</p>
                <CommentPictures role={role} complaintId={c.id} commentId={l.commentId} pictures={l.pictures} />
              </li>
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
