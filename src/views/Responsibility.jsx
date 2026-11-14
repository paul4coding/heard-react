import { useEffect, useState } from 'react';
import { Tone } from '../components/Investigation.jsx';
import { DESIGNATION_STATUS } from '../data.js';
import * as api from '../api.js';

// Écran de l'étudiant : les enquêtes où il est désigné.
export default function Responsibility({ refreshKey, onOpen, onError }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    api.listMyLiabilities().then((r) => alive && setRows(r)).catch((e) => { if (alive) { onError(e); setRows([]); } });
    return () => { alive = false; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows) return <div className="panel empty"><b>Loading…</b></div>;
  if (!rows.length) {
    return (
      <div className="panel empty">
        <b>Nobody has named you in an investigation.</b>
        When a coordinator checks the facts of a complaint and finds you may be concerned, the file appears here. You will be told by notification and email.
      </div>
    );
  }
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>You are named in {rows.length === 1 ? 'one investigation' : `${rows.length} investigations`}. Being named is not a decision: read the evidence and answer.</p>
      <div className="panel pad">
        <div className="qlist">
          {rows.map((r) => (
            <button key={r.id} className="qitem" onClick={() => onOpen(r.id)}>
              <div className="t"><b>{r.complaint_title}</b>
                <span>{r.complaint_reference} · named {api.fmtDate(r.created_at)}{r.amount != null ? ` · invoice ${r.amount}` : ''}</span></div>
              {r.needs_action && <span className="pill t-warn">Action needed</span>}
              <Tone map={DESIGNATION_STATUS} value={r.status} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
