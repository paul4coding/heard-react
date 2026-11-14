import { useEffect, useState } from 'react';
import * as api from '../api.js';

// Administrateur : les emails écrits par l'application. Cette version n'envoie rien pour de vrai (pas de SMTP).
export default function Emails({ onError }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.listOutbox().then(setRows).catch((e) => { onError(e); setRows([]); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows) return <div className="panel empty"><b>Loading…</b></div>;
  if (!rows.length) return <div className="panel empty"><b>No email yet.</b>Emails appear here when a student is named in an investigation.</div>;
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>These are the emails the app wrote. In this version they are stored, not sent. A real mail server can send the same messages later.</p>
      <div className="panel pad">
        <ul className="mails">
          {rows.map((m) => (
            <li key={m.id}>
              <details>
                <summary><b>{m.subject}</b><span>To {m.to_email} · {api.fmtWhen(m.created_at)}</span></summary>
                <pre>{m.body}</pre>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
