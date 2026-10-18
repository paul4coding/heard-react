import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Pill, Tracker } from './Status.jsx';
import { STAGES, HEADS } from '../data.js';
import { fromLabel } from '../utils.js';

function AdminForm({ c, onSave }) {
  const self = c.assignee === 'Administrator';
  const [route, setRoute] = useState(self ? 'self' : 'head');
  const [head, setHead] = useState(c.assignee && !self ? c.assignee : HEADS[0]);
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');

  return (
    <section className="panel pad dsec">
      <h3>Handle this complaint</h3>
      <div className="routes">
        <label className="route">
          <input type="radio" name="route" checked={route === 'head'} onChange={() => setRoute('head')} />
          <span><b>Assign to a department head</b><small>It goes to their queue and they post updates.</small></span>
        </label>
        <label className="route">
          <input type="radio" name="route" checked={route === 'self'} onChange={() => setRoute('self')} />
          <span><b>Resolve it myself</b><small>You own this complaint until it is closed.</small></span>
        </label>
      </div>
      {route === 'head' && (
        <label className="field"><span className="l">Department head</span>
          <select className="input" value={head} onChange={(e) => setHead(e.target.value)}>
            {HEADS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span className="l">Status</span>
        <select className="input" value={stage} onChange={(e) => setStage(+e.target.value)}>
          {STAGES.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </select>
      </label>
      <label className="field"><span className="l">Note for the student</span>
        <textarea className="input" style={{ minHeight: 90 }} placeholder="What is happening and what to expect next." value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="btn primary block" onClick={() => onSave({ kind: 'admin', route, head, stage, note: note.trim() })}>Save update</button>
    </section>
  );
}

function HeadForm({ c, onSave }) {
  const [stage, setStage] = useState(c.stage);
  const [note, setNote] = useState('');
  return (
    <section className="panel pad dsec">
      <h3>Post an update</h3>
      <label className="field"><span className="l">Status</span>
        <select className="input" value={stage} onChange={(e) => setStage(+e.target.value)}>
          {[2, 3, 4].map((i) => <option key={i} value={i}>{STAGES[i]}</option>)}
        </select>
      </label>
      <label className="field"><span className="l">Note for the student</span>
        <textarea className="input" style={{ minHeight: 90 }} placeholder="What has been done and what happens next." value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="btn primary block" onClick={() => onSave({ kind: 'head', stage, note: note.trim() })}>Save update</button>
    </section>
  );
}

function ReviewForm({ onSave, onError }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  return (
    <section className="panel pad dsec">
      <h3>Review the outcome</h3>
      <p style={{ color: 'var(--ink-2)', marginBottom: 14 }}>Did this fix the problem?</p>
      <div className="stars" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= rating ? 'on' : ''} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
            <Icon name="star" />
          </button>
        ))}
      </div>
      <label className="field"><span className="l">Comments <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></span>
        <textarea className="input" style={{ minHeight: 90 }} placeholder="Tell us what worked or what was missed." value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button className="btn primary block" onClick={() => (rating ? onSave({ kind: 'review', rating, review: text.trim() }) : onError('Choose a star rating first'))}>Submit review</button>
    </section>
  );
}

export default function Drawer({ complaint: c, role, studentName, open, onClose, onSave, onError }) {
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
    let action;
    if (role === 'admin') action = <AdminForm key={`${c.id}-${c.log.length}`} c={c} onSave={onSave} />;
    else if (role === 'head') action = <HeadForm key={`${c.id}-${c.log.length}`} c={c} onSave={onSave} />;
    else if (c.stage === 4) {
      action = c.rating ? (
        <section className="panel pad dsec">
          <h3>Your review</h3>
          <div className="review-done" aria-label={`${c.rating} out of 5 stars`}>
            {Array.from({ length: c.rating }, (_, i) => <Icon key={i} name="star" />)}
          </div>
          <p style={{ color: 'var(--ink-2)' }}>{c.review || ''}</p>
        </section>
      ) : <ReviewForm key={c.id} onSave={onSave} onError={onError} />;
    } else {
      action = <div className="note-ok dsec"><Icon name="info" /><span>We will update this page as soon as the status changes.</span></div>;
    }

    body = (
      <>
        <Pill stage={c.stage} />
        <h2>{c.title}</h2>
        <div className="dsec"><Tracker stage={c.stage} /></div>
        <dl className="panel meta">
          <div><dt>Category</dt><dd>{c.cat}</dd></div>
          <div><dt>Department</dt><dd>{c.dept}</dd></div>
          <div><dt>Submitted</dt><dd>{c.date}</dd></div>
          <div>
            <dt>{isStudent ? 'Handled by' : 'From'}</dt>
            <dd>{isStudent ? (c.assignee || 'Not assigned yet') : (c.anon ? 'Anonymous' : fromLabel(c, role, studentName))}</dd>
          </div>
        </dl>
        {c.anon && !isStudent && (
          <div className="note-ok dsec"><Icon name="eyeoff" /><span>This student chose to stay anonymous. Any note you post will reach them on their dashboard.</span></div>
        )}
        <div className="dsec"><h3>Description</h3><p>{c.desc}</p></div>
        {c.media.length > 0 && (
          <div className="dsec">
            <h3>Attachments</h3>
            <div className="media">
              {c.media.map((m) => (
                <div className="m" key={m.n}><div className={`th ${m.t}`}><Icon name={m.t} /></div><span>{m.n}</span></div>
              ))}
            </div>
          </div>
        )}
        {action}
        <div className="dsec">
          <h3>Updates</h3>
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
          <span className="ref">{c?.id}</span>
          <button ref={closeBtn} className="icon-btn" onClick={onClose} aria-label="Close details"><Icon name="x" /></button>
        </div>
        {body}
      </aside>
    </>
  );
}
