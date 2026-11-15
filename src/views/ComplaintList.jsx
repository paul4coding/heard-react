import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Pager from '../components/Pager.jsx';
import { Pill, Mini } from '../components/Status.jsx';
import { STAGES, STATUSES, SHOW_PRIORITY, PRIORITIES } from '../data.js';
import { listComplaints, setPriority, PAGE_SIZE } from '../api.js';

const HEADS = {
  student: ['Complaint', 'Category', 'Progress', 'Submitted'],
  admin: ['Complaint', 'Category', 'From', 'Status', 'Priority', 'Assigned to', 'Submitted'],
  coordinator: ['Complaint', 'Category', 'From', 'Status', 'Priority', 'Submitted'],
};
// Sprint 2 : la catégorie est choisie par l'étudiant, la colonne est toujours affichée
// Priorité : masquée jusqu'au sprint 4 (voir SHOW_PRIORITY)
const headsFor = (role, showCat) => HEADS[role].filter((h) => (showCat || h !== 'Category') && (SHOW_PRIORITY || h !== 'Priority'));

const label = (p) => p.charAt(0) + p.slice(1).toLowerCase();

export const Priority = ({ value }) =>
  value ? <span className={`prio ${value.toLowerCase()}`}>{label(value)}</span> : <span className="prio none">None</span>;

// Badge de sévérité modifiable d'un clic (administrateur) : le choix est enregistré tout de suite.
function PrioSelect({ c, onSaved, onError }) {
  const [busy, setBusy] = useState(false);
  const change = async (e) => {
    const next = e.target.value;
    if (!next || next === c.priority) return;
    setBusy(true);
    try {
      onSaved(await setPriority(c.id, next));
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <select className={`prio prio-select ${c.priority ? c.priority.toLowerCase() : 'none'}`} value={c.priority ?? ''} disabled={busy}
      aria-label={`Priority of ${c.ref}`} onChange={change} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {!c.priority && <option value="">Set…</option>}
      {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
    </select>
  );
}

// Liste paginée côté serveur : seule la page affichée est chargée.
export default function ComplaintList({ role, refreshKey, onOpen, onNotify, onError }) {
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const seq = useRef(0);

  // Recherche : on attend 300 ms après la dernière frappe
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((prev) => {
        const next = input.trim();
        if (prev !== next) setPage(0);
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    const id = ++seq.current; // ignore les réponses obsolètes (changement rapide de page / filtre)
    setLoading(true);
    listComplaints(role, {
      status: filter === 'all' || filter === 'rejected' ? undefined : STATUSES[filter], q: query, skip: page * PAGE_SIZE,
      rejected: filter === 'rejected',
    })
      .then(({ items, total: t }) => {
        if (id !== seq.current) return;
        if (items.length === 0 && page > 0) {
          setPage(Math.max(0, Math.ceil(t / PAGE_SIZE) - 1)); // la dernière page a été vidée
          return;
        }
        setRows(items);
        setTotal(t);
        setLoaded(true);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== seq.current) return;
        setLoading(false);
        onError(e);
      });
  }, [role, filter, query, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFilter = (f) => { setFilter(f); setPage(0); };
  const reset = () => { setInput(''); setQuery(''); setFilter('all'); setPage(0); };

  const showCat = true;

  const cells = (c) => (
    <>
      <td><span className="ref">{c.ref}</span><span className="ttl">{c.title}</span></td>
      {showCat && <td className="muted">{c.cat ?? '—'}</td>}
      {role === 'student' && (
        <td>
          <Mini stage={c.stage} />
          <span className="sr">{STAGES[c.stage]}</span>{' '}
          <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>{STAGES[c.stage]}</span>
          {c.stage === 3 && !c.review && <span className="tag-warn">Your review is needed</span>}
        </td>
      )}
      {role !== 'student' && <td className="muted">{c.owner}</td>}
      {role !== 'student' && <td><Pill stage={c.stage} /></td>}
      {SHOW_PRIORITY && role !== 'student' && (
        <td>
          {role === 'admin'
            ? <PrioSelect c={c} onError={onError} onSaved={(n) => { setRows((rs) => rs.map((r) => (r.id === n.id ? { ...r, priority: n.priority } : r))); onNotify?.(`Priority of ${n.ref} set to ${label(n.priority)}`); }} />
            : <Priority value={c.priority} />}
        </td>
      )}
      {role === 'admin' && (
        <td className="muted">
          {c.assignee ? c.assignee : <span style={{ color: 'var(--bad)', fontWeight: 600 }}>{c.rejected ? 'Rejected' : 'Unassigned'}</span>}
        </td>
      )}
      <td className="muted">{c.date}</td>
    </>
  );

  const filtered = filter !== 'all' || query !== '';

  return (
    <>
      <div className="toolbar">
        <label className="input-wrap">
          <span className="sr">Search complaints</span>
          <Icon name="search" />
          <input className="input" type="search" placeholder="Search by title or reference" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter by status">
          {['all', ...STAGES.map((_, i) => i), ...(role === 'admin' ? ['rejected'] : [])].map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => changeFilter(f)}>
              {f === 'all' ? 'All' : f === 'rejected' ? 'Rejected' : STAGES[f]}
            </button>
          ))}
        </div>
      </div>
      <div className={`panel tablewrap${loading && loaded ? ' busy' : ''}`} aria-busy={loading}>
        {!loaded ? (
          <div className="empty"><b>Loading…</b></div>
        ) : rows.length === 0 ? (
          <div className="empty">
            {filtered ? (
              <>
                <b>No complaints match</b>Try a different search or{' '}
                <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={reset}>show everything</button>.
              </>
            ) : (
              <><b>No complaints yet</b>They will show up here.</>
            )}
          </div>
        ) : (
          <table>
            <thead><tr>{headsFor(role, showCat).map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} tabIndex={0} onClick={() => onOpen(c)} onKeyDown={(e) => e.key === 'Enter' && onOpen(c)}>
                  {cells(c)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {loaded && <Pager page={page} pageSize={PAGE_SIZE} total={total} busy={loading} onPage={setPage} />}
    </>
  );
}
