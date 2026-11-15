import { useEffect, useRef, useState } from 'react';
import EvidenceGrid from './Evidence.jsx';
import FilePicker from './FilePicker.jsx';
import Receipt from './Receipt.jsx';
import PayPanel, { METHOD_LABEL } from './PayPanel.jsx';
import Icon from './Icon.jsx';
import { Tone } from './Investigation.jsx';
import { DESIGNATION_STATUS, EVENT_LABEL, OUTCOME } from '../data.js';
import * as api from '../api.js';

// Tiroir de l'étudiant désigné : il voit la preuve, répond (texte + pièces), puis paie après confirmation.
// Il ne voit jamais qui a déposé la plainte, ni sa description, ni les notes internes.
export default function LiabilityDrawer({ id, onClose, onChanged, onNotify, onError }) {
  const [d, setD] = useState(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [pickerKey, setPickerKey] = useState(0);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const ref = useRef(null);
  const open = id != null;

  useEffect(() => {
    setD(null); setText(''); setFiles([]); setErr(''); setConfirming(false); setShowReceipt(false); setPickerKey((k) => k + 1);
    if (id == null) return undefined;
    let alive = true;
    api.getMyLiability(id).then((r) => alive && setD(r)).catch((e) => { if (alive) { onError(e); onClose(); } });
    if (ref.current) ref.current.scrollTop = 0;
    return () => { alive = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const answer = async (decision) => {
    if (decision === 'CONTEST' && text.trim().length < 5) {
      return setErr('Explain in at least 5 characters why you contest. This is what the coordinator will read.');
    }
    setBusy(decision);
    setErr('');
    try {
      setD(await api.respondLiability(id, { decision, text: text.trim(), files }));
      setFiles([]); setPickerKey((k) => k + 1);
      onNotify(decision === 'CONTEST' ? 'Your contestation was sent' : 'Your answer was sent');
      onChanged();
    } catch (e) {
      setErr(onError(e));
    } finally {
      setBusy('');
    }
  };

  const pay = async (method, files) => {
    setBusy('pay');
    setErr('');
    try {
      setD(await api.payLiability(id, { method, files }));
      setConfirming(false);
      onNotify('Payment recorded');
      onChanged();
    } catch (e) {
      setErr(onError(e));
    } finally {
      setBusy('');
    }
  };

  const load = (eid) => api.fetchLiabilityEvidenceUrl(id, eid);
  let body = null;
  if (d) {
    const cleared = d.status === 'CLEARED';
    body = (
      <>
        <Tone map={DESIGNATION_STATUS} value={d.status} />
        <h2>{d.complaint_title}</h2>
        <dl className="panel meta">
          <div><dt>Complaint</dt><dd>{d.complaint_reference}{d.category ? ` · ${d.category}` : ''}</dd></div>
          <div><dt>Named on</dt><dd>{api.fmtWhen(d.created_at)}</dd></div>
          {d.can_respond && <div><dt>Answer before</dt><dd>{api.fmtDate(d.due_at)}</dd></div>}
        </dl>

        <div className="banner">
          <Icon name="info" />
          <span><b>This is not a decision.</b> You were named after a check of the facts. Read the evidence, then answer. You can acknowledge or contest.</span>
        </div>

        <div className="dsec">
          <h3>Why you are named</h3>
          {d.note ? <p className="quote">{d.note}</p> : <p style={{ color: 'var(--ink-3)' }}>No written report: see the evidence below.</p>}
        </div>
        <div className="dsec">
          <h3>Evidence</h3>
          {d.evidence.filter((e) => e.kind === 'EVIDENCE').length
            ? <EvidenceGrid items={d.evidence.filter((e) => e.kind === 'EVIDENCE')} load={load} />
            : <p style={{ color: 'var(--ink-3)' }}>No photo or video.</p>}
        </div>

        {cleared && (
          <div className="review-done ok dsec"><Icon name="check" />
            <span><b>You are put out of cause.</b>{d.clear_reason && <em>“{d.clear_reason}”</em>}Nothing more is asked of you.</span></div>
        )}
        {d.outcome === 'RECOGNIZED' && <div className="banner"><Icon name="info" /><span><b>{OUTCOME.RECOGNIZED}.</b> The case is closed, no amount is asked.</span></div>}

        {d.can_respond && (
          <section className="panel pad dsec">
            <h3>Your answer</h3>
            <p className="hint">Write what you want the coordinator to know. When you contest, an explanation is required. You can add photos or a short video for your defense.</p>
            <label className="field"><span className="l">Your answer</span>
              <textarea className="input" style={{ minHeight: 110 }} value={text} maxLength={2000}
                placeholder="e.g. I was in the library at that time, my badge was scanned at 14:05."
                onChange={(e) => { setText(e.target.value); setErr(''); }} />
              <small>{text.length}/2000</small>
            </label>
            <div className="field"><span className="l">Photos or short video <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional, up to 5)</span></span>
              <FilePicker key={pickerKey} capacity={5} noun="file" media onChange={setFiles} disabled={!!busy} />
            </div>
            {err && <p className="error" role="alert">{err}</p>}
            <div className="review-btns">
              <button className="btn primary" disabled={!!busy} onClick={() => answer('ACKNOWLEDGE')}>{busy === 'ACKNOWLEDGE' ? 'Sending…' : 'I acknowledge'}</button>
              <button className="btn" disabled={!!busy} onClick={() => answer('CONTEST')}>{busy === 'CONTEST' ? 'Sending…' : 'I contest'}</button>
            </div>
          </section>
        )}

        {d.responded_at && (
          <div className={`answer ${d.status === 'CONTESTED' ? 'no' : 'ok'} dsec`}>
            <b>Your answer: {d.status === 'CONTESTED' ? 'you contest' : 'you acknowledge'} <span>{api.fmtWhen(d.responded_at)}</span></b>
            <p>{d.response_text || 'No comment.'}</p>
            <EvidenceGrid items={d.evidence.filter((e) => e.kind === 'DEFENSE')} load={load} />
            {d.status === 'CONTESTED' && <p className="sub">The coordinator will read it and decide: another investigation, or the case is closed.</p>}
          </div>
        )}

        {d.invoice_pending && (
          <div className="banner"><Icon name="info" /><span><b>Your acknowledgement is recorded.</b> The administration is preparing the invoice. You will be notified when you can pay.</span></div>
        )}

        {(d.amount != null) && (
          <section className="panel pad dsec pay">
            <h3>Invoice {d.invoice_number}</h3>
            <p className="amount">{d.amount}</p>
            {d.paid_at ? (
              <>
                <div className="review-done ok"><Icon name="check" /><span><b>Paid{d.payment_method ? ` by ${METHOD_LABEL[d.payment_method]}` : ''}</b>Receipt {d.receipt} · {api.fmtWhen(d.paid_at)}</span></div>
                {d.evidence.some((e) => e.kind === 'PROOF') && <EvidenceGrid items={d.evidence.filter((e) => e.kind === 'PROOF')} load={load} />}
                <button className="btn block" style={{ marginTop: 12 }} onClick={() => setShowReceipt(true)}>View and print the receipt</button>
                {d.case_state === 'PAID' && <p className="hint" style={{ marginTop: 12 }}>The administration will now close the case.</p>}
              </>
            ) : d.can_pay ? (
              <>
                <p className="hint">This invoice was checked and validated by the administration. Review the amount, then choose how to pay.</p>
                {err && !d.can_respond && <p className="error" role="alert">{err}</p>}
                {!confirming ? (
                  <button className="btn primary block" disabled={!!busy} onClick={() => setConfirming(true)}>Pay {d.amount}</button>
                ) : (
                  <PayPanel amount={d.amount} invoice={d.invoice_number} reference={d.complaint_reference} busy={busy === 'pay'} err={err}
                    onPay={pay} onCancel={() => setConfirming(false)} />
                )}
              </>
            ) : <p className="hint">This invoice is no longer due.</p>}
          </section>
        )}

        {d.events.length > 0 && (
          <div className="dsec">
            <h3>History</h3>
            <ul className="log">
              {[...d.events].reverse().map((e, i) => (
                <li key={i}><b>{EVENT_LABEL[e.action] || e.action}</b><span>{api.fmtWhen(e.created_at)}</span>{e.note && e.action !== 'DESIGNATED' && <p>{e.note}</p>}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {open && <div className="scrim open" onClick={onClose} />}
      <aside ref={ref} className={`drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Investigation file" aria-hidden={!open}>
        <div className="dr-top">
          <span className="ref">{d?.complaint_reference}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close details"><Icon name="x" /></button>
        </div>
        {open && !d && <p style={{ color: 'var(--ink-3)' }}>Loading…</p>}
        {body}
        {showReceipt && <Receipt load={() => api.getMyReceipt(id)} onClose={() => setShowReceipt(false)} onError={onError} />}
      </aside>
    </>
  );
}
