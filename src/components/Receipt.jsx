import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import * as api from '../api.js';

// Reçu d'une facture payée. `load` renvoie les données ; le bouton ouvre l'impression (ou « enregistrer en PDF »).
export default function Receipt({ load, onClose, onError }) {
  const [r, setR] = useState(null);

  useEffect(() => {
    let alive = true;
    load().then((x) => alive && setR(x)).catch((e) => { if (alive) { onError(e); onClose(); } });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const rows = r && [
    ['Receipt number', r.receipt],
    ['Invoice number', r.invoice_number],
    ['Paid by', `${r.student_name}${r.student_number ? ` (${r.student_number})` : ''}`],
    ['Complaint', `${r.complaint_reference} · ${r.complaint_title}`],
    ...(r.category ? [['Category', r.category]] : []),
    ['Invoice validated', r.validated_at ? `${api.fmtWhen(r.validated_at)}${r.validated_by ? ` by ${r.validated_by}` : ''}` : '—'],
    ['Payment date', api.fmtWhen(r.paid_at)],
  ];

  return (
    <div className="lightbox receipt-overlay" role="dialog" aria-modal="true" aria-label="Receipt" onClick={onClose}>
      <div className="receipt-sheet" onClick={(e) => e.stopPropagation()}>
        {!r ? <p>Loading…</p> : (
          <>
            <div className="receipt-head"><Logo /><span className="receipt-tag">RECEIPT</span></div>
            <p className="receipt-amount-label">Amount paid</p>
            <p className="receipt-amount">{r.amount}</p>
            <dl className="receipt-rows">
              {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <p className="receipt-foot">Thank you. This receipt confirms the payment of the validated invoice {r.invoice_number}.</p>
            <div className="receipt-actions">
              <button className="btn primary" onClick={() => window.print()}><Icon name="upload" />Print or save as PDF</button>
              <button className="btn" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
