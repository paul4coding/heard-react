import { useEffect, useState } from 'react';
import { Tone } from '../components/Investigation.jsx';
import { CASE_STATE } from '../data.js';
import * as api from '../api.js';

// Administrateur : factures à valider (proposées par les coordinateurs) et dossiers payés à clôturer.
export default function Invoices({ refreshKey, onOpen, onError }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    api.listPendingInvoices().then((r) => alive && setRows(r)).catch((e) => { if (alive) { onError(e); setRows([]); } });
    return () => { alive = false; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows) return <div className="panel empty"><b>Loading…</b></div>;
  if (!rows.length) {
    return <div className="panel empty"><b>Nothing to do.</b>No invoice is waiting for your validation and no paid case is waiting to be closed.</div>;
  }
  const todo = rows.filter((r) => r.state === 'INVOICE_REVIEW');
  const toClose = rows.filter((r) => r.state === 'PAID');
  const List = ({ title, note, items }) => items.length > 0 && (
    <div className="panel pad" style={{ marginBottom: 18 }}>
      <div className="sec-head"><h2>{title}</h2><p>{note}</p></div>
      <div className="qlist">
        {items.map((r) => (
          <button key={r.designation_id} className="qitem" onClick={() => onOpen(r.complaint_id)}>
            <div className="t"><b>{r.title}</b>
              <span>{r.reference} · {r.student_name} · amount {r.amount}{r.proposed_by ? ` · proposed by ${r.proposed_by}` : ''}{r.receipt ? ` · receipt ${r.receipt}` : ''}</span></div>
            <Tone map={CASE_STATE} value={r.state} />
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <List title="Invoices to validate" note="The student sees an invoice only after you validate it." items={todo} />
      <List title="Paid, to close" note="The student has paid. Close the case." items={toClose} />
    </>
  );
}
