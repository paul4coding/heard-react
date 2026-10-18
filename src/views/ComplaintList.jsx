import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Pill, Mini } from '../components/Status.jsx';
import { STAGES } from '../data.js';
import { fromLabel } from '../utils.js';

const HEADS = {
  student: ['Complaint', 'Category', 'Progress', 'Updated'],
  admin: ['Complaint', 'Category', 'From', 'Status', 'Assigned to', 'Updated'],
  head: ['Complaint', 'Category', 'From', 'Status', 'Updated'],
};

export default function ComplaintList({ complaints, role, studentName, onOpen }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const needle = q.toLowerCase();
  const rows = complaints.filter(
    (c) => (filter === 'all' || c.stage === filter) &&
      (!needle || c.title.toLowerCase().includes(needle) || c.id.toLowerCase().includes(needle))
  );

  const cells = (c) => {
    const from = fromLabel(c, role, studentName);
    return (
      <>
        <td><span className="ref">{c.id}</span><span className="ttl">{c.title}</span></td>
        <td className="muted">{c.cat}</td>
        {role === 'student' && (
          <td>
            <Mini stage={c.stage} />
            <span className="sr">{STAGES[c.stage]}</span>{' '}
            <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>{STAGES[c.stage]}</span>
          </td>
        )}
        {role !== 'student' && (
          <td className="muted">
            {c.anon ? <span className="anon"><Icon name="eyeoff" />{from}</span> : from}
          </td>
        )}
        {role !== 'student' && <td><Pill stage={c.stage} /></td>}
        {role === 'admin' && (
          <td className="muted">
            {c.assignee ? c.assignee : <span style={{ color: 'var(--bad)', fontWeight: 600 }}>Unassigned</span>}
          </td>
        )}
        <td className="muted">{c.log[c.log.length - 1].when.split(',')[0]}</td>
      </>
    );
  };

  return (
    <>
      <div className="toolbar">
        <label className="input-wrap">
          <span className="sr">Search complaints</span>
          <Icon name="search" />
          <input className="input" type="search" placeholder="Search by title or reference" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter by status">
          {['all', ...STAGES.map((_, i) => i)].map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : STAGES[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="panel tablewrap">
        {rows.length === 0 ? (
          <div className="empty">
            <b>No complaints match</b>Try a different search or{' '}
            <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={() => setFilter('all')}>show all statuses</button>.
          </div>
        ) : (
          <table>
            <thead><tr>{HEADS[role].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} tabIndex={0} onClick={() => onOpen(c.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(c.id)}>
                  {cells(c)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
