import { useCallback, useEffect, useState } from 'react';
import EvidenceGrid from './Evidence.jsx';
import FilePicker from './FilePicker.jsx';
import Receipt from './Receipt.jsx';
import { METHOD_LABEL } from './PayPanel.jsx';
import Icon from './Icon.jsx';
import { CASE_STATE, DESIGNATION_STATUS, EVENT_LABEL, OUTCOME } from '../data.js';
import * as api from '../api.js';

export const Tone = ({ map, value }) => {
  const [label, tone] = map[value] || [value, 'mute'];
  return <span className={`pill t-${tone}`}>{label}</span>;
};

const FINAL = ['CLOSED'];
const CLOSE_OUTCOMES = {
  INVESTIGATING: ['NO_FAULT', 'NOT_ESTABLISHED', 'ABUSIVE'],
  CONTESTED: ['NOT_ESTABLISHED', 'NO_FAULT', 'ABUSIVE'],
  NO_RESPONSE: ['NOT_ESTABLISHED', 'NO_FAULT', 'ABUSIVE'],
  ACKNOWLEDGED: ['RECOGNIZED'],
  PAID: ['PAID'],
};

const fullName = (u) => `${u.first_name} ${u.last_name}`.trim() || u.username;

function Area({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="field"><span className="l">{label}</span>
      <textarea className="input" style={{ minHeight: rows * 28 }} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------- Constats internes ---------- */
function Findings({ data, locked, busy, onSave }) {
  const [text, setText] = useState(data.findings);
  return (
    <div className="dsec">
      <Area label="Findings (internal, never shown to students)" value={text} onChange={setText} rows={3}
        placeholder="What you checked: cameras, witnesses, maintenance log…" />
      {!locked && (
        <button className="btn" disabled={busy || text.trim() === data.findings.trim()} onClick={() => onSave(text.trim())}>
          {busy === 'findings' ? 'Saving…' : 'Save findings'}
        </button>
      )}
    </div>
  );
}

/* ---------- Désigner un étudiant ---------- */
function DesignateForm({ role, c, busy, onSubmit }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (picked || q.trim().length < 2) { setHits([]); return undefined; }
    const t = setTimeout(() => api.searchStudents(role, q.trim()).then(setHits).catch(() => setHits([])), 250);
    return () => clearTimeout(t);
  }, [q, picked, role]);

  const ready = picked && (note.trim() || files.length);
  const send = () => {
    if (!confirm) return setConfirm(true);
    onSubmit({ studentId: picked.id, note: note.trim(), files });
  };

  return (
    <section className="panel pad dsec inv-form">
      <h3>Designate a student</h3>
      <p className="hint">Only if the facts point to someone. The student receives a notification and an email with the evidence and can answer or contest. Nothing is decided yet.</p>
      <div className="field"><span className="l">Student</span>
        {picked ? (
          <div className="picked">
            <b>{fullName(picked)}</b><span>{picked.email}{picked.student_id ? ` · ${picked.student_id}` : ''}</span>
            <button type="button" className="btn ghost" onClick={() => { setPicked(null); setQ(''); setConfirm(false); }}>Change</button>
          </div>
        ) : (
          <>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or student number" aria-label="Search a student" />
            {hits.length > 0 && (
              <ul className="hits">
                {hits.map((s) => (
                  <li key={s.id}><button type="button" onClick={() => setPicked(s)}><b>{fullName(s)}</b><span>{s.email}{s.student_id ? ` · ${s.student_id}` : ''}</span></button></li>
                ))}
              </ul>
            )}
            {q.trim().length >= 2 && hits.length === 0 && <small>No student found.</small>}
          </>
        )}
      </div>
      {picked && picked.id === c.ownerId && (
        <div className="banner warn"><Icon name="info" /><span><b>This student is also the person who lodged the complaint.</b> That is allowed when the evidence shows they caused the damage.</span></div>
      )}
      <Area label="Written report (shown to the student)" value={note} onChange={(v) => { setNote(v); setConfirm(false); }}
        placeholder="What the evidence shows, where and when." />
      <div className="field"><span className="l">Photos or short video <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional, up to 5)</span></span>
        <FilePicker capacity={5} noun="file" media onChange={(f) => { setFiles(f); setConfirm(false); }} disabled={!!busy} />
        <small>A written report, a photo or a video is required.</small>
      </div>
      <button className="btn primary block" disabled={!ready || !!busy} onClick={send}>
        {busy === 'designate' ? 'Sending…' : confirm ? `Confirm: notify ${fullName(picked)} by app and email` : 'Designate and notify'}
      </button>
    </section>
  );
}

/* ---------- Un étudiant désigné ---------- */
function DesignationCard({ d, data, role, c, busy, run, onError }) {
  const [reason, setReason] = useState('');
  const [clearing, setClearing] = useState(false);
  const [amount, setAmount] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const [backReason, setBackReason] = useState('');
  const active = ['PENDING', 'ACKNOWLEDGED', 'CONTESTED', 'NO_RESPONSE'].includes(d.status);
  const live = active && !FINAL.includes(data.state);
  const load = (id) => api.fetchInvestigationEvidenceUrl(role, c.id, id);
  const call = (key, fn, ok) => run(key, fn, ok);
  const mine = (k) => busy === k;

  return (
    <div className={`desig ${active ? 'active' : 'past'}`}>
      <div className="desig-head">
        <div><b>{fullName(d.student)}</b>{d.is_complainant && <span className="tag-self">also the complainant</span>}
          <span className="sub">{d.student.email}{d.student.student_id ? ` · ${d.student.student_id}` : ''}</span></div>
        <Tone map={DESIGNATION_STATUS} value={d.status} />
      </div>
      {d.note && <p className="quote">{d.note}</p>}
      <EvidenceGrid items={d.evidence.filter((e) => e.kind === 'EVIDENCE')} load={load} />
      <p className="sub">Designated {api.fmtWhen(d.created_at)}{d.status === 'PENDING' && ` · answer expected before ${api.fmtDate(d.due_at)}`}</p>

      {d.responded_at && (
        <div className={`answer ${d.status === 'CONTESTED' ? 'no' : 'ok'}`}>
          <b>{d.status === 'CONTESTED' ? 'The student contests' : 'The student acknowledges'} <span>{api.fmtWhen(d.responded_at)}</span></b>
          <p>{d.response_text || 'No comment.'}</p>
          <EvidenceGrid items={d.evidence.filter((e) => e.kind === 'DEFENSE')} load={load} />
        </div>
      )}
      {d.status === 'CLEARED' && d.clear_reason && <p className="sub">Put out of cause: {d.clear_reason}</p>}
      {d.amount != null && (
        <p className="sub"><b>Amount: {d.amount}</b>
          {d.invoice_number ? ` · invoice ${d.invoice_number} validated by ${fullName(d.validated_by)}` : ' · invoice not validated yet'}
          {d.paid_at ? ` · paid${d.payment_method ? ` by ${METHOD_LABEL[d.payment_method]}` : ''} ${api.fmtWhen(d.paid_at)} · receipt ${d.receipt}` : d.invoice_number ? ' · waiting for the student to pay' : ''}</p>
      )}
      {d.evidence.some((e) => e.kind === 'PROOF') && (
        <div className="dsec"><h3>Bank transfer receipt</h3><EvidenceGrid items={d.evidence.filter((e) => e.kind === 'PROOF')} load={load} /></div>
      )}
      {d.paid_at && <button className="btn" onClick={() => setReceipt(true)}>View and print the receipt</button>}
      {receipt && <Receipt load={() => api.getStaffReceipt(role, c.id, d.id)} onClose={() => setReceipt(false)} onError={onError} />}

      {live && (
        <div className="desig-actions">
          {role === 'admin' && data.state === 'INVOICE_REVIEW' && d.status === 'ACKNOWLEDGED' && (
            <div className="invoice-box">
              <b>Invoice to validate: {d.amount}</b>
              <p className="sub">Proposed by the coordinator. The student will see it only after you validate it.</p>
              {!rejecting ? (
                <div className="review-btns">
                  <button className="btn primary" disabled={!!busy}
                    onClick={() => call(`validate${d.id}`, () => api.validateInvoice(role, c.id, d.id), 'Invoice validated, the student is notified')}>
                    {mine('validate') ? 'Validating…' : 'Validate the invoice'}
                  </button>
                  <button className="btn" disabled={!!busy} onClick={() => setRejecting(true)}>Send back</button>
                </div>
              ) : (
                <div className="clear-box">
                  <Area label="Why is the invoice sent back? (the coordinator will read it)" value={backReason} onChange={setBackReason} rows={2}
                    placeholder="e.g. The amount is too high for this damage." />
                  <div className="review-btns">
                    <button className="btn danger" disabled={!!busy || backReason.trim().length < 5}
                      onClick={() => call(`reject${d.id}`, () => api.rejectInvoice(role, c.id, d.id, backReason.trim()), 'Invoice sent back to the coordinator')}>
                      {mine('reject') ? 'Sending…' : 'Confirm'}
                    </button>
                    <button className="btn" onClick={() => { setRejecting(false); setBackReason(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {role !== 'admin' && data.state === 'INVOICE_REVIEW' && d.status === 'ACKNOWLEDGED' && (
            <p className="sub">Waiting for an administrator to validate the invoice. You can still correct the amount below.</p>
          )}
          {['ACKNOWLEDGED', 'INVOICE_REVIEW'].includes(data.state) && d.status === 'ACKNOWLEDGED' && !(role === 'admin' && data.state === 'INVOICE_REVIEW') && (
            <div className="amount-row">
              <input className="input" type="number" min="1" max={data.max_amount} value={amount}
                placeholder={`Amount (max ${data.max_amount})`} aria-label="Amount" onChange={(e) => setAmount(e.target.value)} />
              <button className="btn primary" disabled={!!busy || !(+amount >= 1)}
                onClick={() => call(`amount${d.id}`, () => api.setAmount(role, c.id, d.id, +amount), 'Invoice sent to an administrator for validation')}>
                {mine('amount') ? 'Sending…' : data.state === 'INVOICE_REVIEW' ? 'Change the amount' : 'Send for validation'}
              </button>
            </div>
          )}
          {['PENDING', 'NO_RESPONSE'].includes(d.status) && (
            <button className="btn" disabled={!!busy} onClick={() => call(`remind${d.id}`, () => api.remindDesignation(role, c.id, d.id), 'Reminder sent')}>
              {mine('remind') ? 'Sending…' : `Send a reminder (+${data.response_days} days)`}
            </button>
          )}
          {data.state === 'PAID' ? null : !clearing ? (
            <button className="btn" disabled={!!busy} onClick={() => setClearing(true)}>Put this student out of cause</button>
          ) : (
            <div className="clear-box">
              <Area label="Why? (the student will read it)" value={reason} onChange={setReason} rows={2} placeholder="e.g. His badge proves he was elsewhere." />
              <div className="review-btns">
                <button className="btn danger" disabled={!!busy || reason.trim().length < 5}
                  onClick={() => call(`clear${d.id}`, () => api.clearDesignation(role, c.id, d.id, reason.trim()), 'Student put out of cause')}>
                  {mine('clear') ? 'Saving…' : 'Confirm'}
                </button>
                <button className="btn" onClick={() => { setClearing(false); setReason(''); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Clore l'enquête ---------- */
function CloseBox({ data, role, busy, onClose }) {
  const options = CLOSE_OUTCOMES[data.state];
  const [outcome, setOutcome] = useState(options?.[0]);
  const [note, setNote] = useState(data.state === 'PAID' ? 'Payment received, case closed' : '');
  if (!options) return null;
  if (data.state === 'PAID' && role !== 'admin') {
    return <div className="note-ok dsec"><Icon name="info" /><span>The student has paid. An administrator will close the case.</span></div>;
  }
  if (data.state === 'PAID') {
    return (
      <section className="panel pad dsec">
        <h3>Close the case</h3>
        <p className="hint">The student confirmed and paid the validated invoice. Close the case to finish it.</p>
        <Area label="Note" value={note} onChange={setNote} rows={2} placeholder="Closing note." />
        <button className="btn primary block" disabled={!!busy || note.trim().length < 3} onClick={() => onClose('PAID', note.trim())}>
          {busy === 'close' ? 'Closing…' : 'Close the case'}
        </button>
      </section>
    );
  }
  return (
    <section className="panel pad dsec">
      <h3>Close the investigation</h3>
      <p className="hint">{data.state === 'ACKNOWLEDGED'
        ? 'Close here if no amount is asked: the facts the student acknowledged are recorded.'
        : 'Close here when nobody is responsible. Anyone still designated is put out of cause and told.'}</p>
      <label className="field"><span className="l">Outcome</span>
        <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{OUTCOME[o]}</option>)}
        </select>
      </label>
      <Area label="Note" value={note} onChange={setNote} rows={2} placeholder="Why you close it." />
      <button className="btn block" disabled={!!busy || note.trim().length < 3} onClick={() => onClose(outcome, note.trim())}>
        {busy === 'close' ? 'Closing…' : 'Close the investigation'}
      </button>
    </section>
  );
}

function Timeline({ events }) {
  if (!events?.length) return null;
  return (
    <div className="dsec">
      <h3>Investigation history</h3>
      <ul className="log">
        {[...events].reverse().map((e) => (
          <li key={e.id}>
            <b>{EVENT_LABEL[e.action] || e.action}</b>
            <span>{api.fmtWhen(e.created_at)}{e.actor ? ` · ${fullName(e.actor)}` : ''}</span>
            {e.note && e.action !== 'OPENED' && e.action !== 'FINDINGS' && <p>{e.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Panneau principal (dans le tiroir de la plainte) ---------- */
export default function Investigation({ role, complaint: c, onNotify, onError }) {
  const [data, setData] = useState(undefined); // undefined = chargement, null = pas d'enquête
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.getInvestigation(role, c.id));
    } catch (e) {
      onError(e);
      setData(null);
    }
  }, [role, c.id, onError]);

  useEffect(() => { setData(undefined); setErr(''); load(); }, [load]);

  const run = async (key, fn, ok) => {
    setBusy(key.replace(/\d+$/, ''));
    setErr('');
    try {
      setData(await fn());
      if (ok) onNotify(ok);
      return true;
    } catch (e) {
      setErr(onError(e));
      return false;
    } finally {
      setBusy('');
    }
  };

  if (data === undefined) return <div className="dsec"><h3>Investigation</h3><p style={{ color: 'var(--ink-3)' }}>Loading…</p></div>;

  if (data === null) {
    return (
      <section className="panel pad dsec">
        <h3>Investigation</h3>
        {c.stage === 4 ? <p className="hint">This complaint is closed and was not investigated.</p> : (
          <>
            <p className="hint">Check the facts first (cameras, witnesses). If someone is responsible, you can designate them with the evidence; otherwise close the investigation.</p>
            {err && <p className="error" role="alert">{err}</p>}
            <button className="btn primary block" disabled={!!busy} onClick={() => run('findings', () => api.saveFindings(role, c.id, ''), 'Investigation opened')}>
              {busy === 'findings' ? 'Opening…' : 'Start the investigation'}
            </button>
          </>
        )}
      </section>
    );
  }

  const locked = FINAL.includes(data.state);
  const canDesignate = data.state === 'INVESTIGATING';
  return (
    <>
      <section className="panel pad dsec">
        <div className="inv-head">
          <h3>Investigation</h3>
          <Tone map={CASE_STATE} value={data.state} />
        </div>
        {data.outcome && <div className="banner"><Icon name="info" /><span><b>{OUTCOME[data.outcome]}.</b> {data.outcome_note}</span></div>}
        {err && <p className="error" role="alert">{err}</p>}
        <Findings key={data.findings + data.state} data={data} locked={locked} busy={busy}
          onSave={(t) => run('findings', () => api.saveFindings(role, c.id, t), 'Findings saved')} />
        {data.designations.length > 0 && (
          <div className="dsec">
            <h3>Designated students</h3>
            {[...data.designations].reverse().map((d) => (
              <DesignationCard key={d.id} d={d} data={data} role={role} c={c} busy={busy} run={run} onError={onError} />
            ))}
          </div>
        )}
      </section>
      {canDesignate && (
        <DesignateForm key={data.designations.length} role={role} c={c} busy={busy}
          onSubmit={(v) => run('designate', () => api.designateStudent(role, c.id, v), 'Student notified by app and email')} />
      )}
      {!locked && <CloseBox key={data.state} data={data} role={role} busy={busy} onClose={(o, n) => run('close', () => api.closeInvestigation(role, c.id, o, n), 'Investigation closed')} />}
      <Timeline events={data.events} />
    </>
  );
}
