import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Pager from '../components/Pager.jsx';
import UserDrawer from '../components/UserDrawer.jsx';
import { ROLE_LABEL } from '../data.js';
import { listUsers, PAGE_SIZE } from '../api.js';

const ROLE_FILTERS = [['all', 'All'], ['student', 'Students'], ['coordinator', 'Coordinators'], ['admin', 'Administrators']];
const STATUS_FILTERS = [['all', 'Any status'], ['active', 'Active'], ['inactive', 'Deactivated']];

// Gestion des comptes (sprint 1, story 1) : liste paginée, recherche, filtres, création, modification, désactivation.
export default function UsersView({ me, onNotify, onError }) {
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [reload, setReload] = useState(0);
  const [drawer, setDrawer] = useState({ open: false, user: null });
  const seq = useRef(0);

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
    const id = ++seq.current;
    setLoading(true);
    listUsers({
      role: role === 'all' ? undefined : role, q: query,
      active: status === 'all' ? undefined : status === 'active', skip: page * PAGE_SIZE,
    })
      .then(({ items, total: t }) => {
        if (id !== seq.current) return;
        if (items.length === 0 && page > 0) {
          setPage(Math.max(0, Math.ceil(t / PAGE_SIZE) - 1));
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
  }, [role, status, query, page, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (setter) => (v) => { setter(v); setPage(0); };
  const resetAll = () => { setInput(''); setQuery(''); setRole('all'); setStatus('all'); setPage(0); };
  const closeDrawer = () => setDrawer((d) => ({ ...d, open: false }));
  const saved = (message, _user, err) => {
    if (err) return onError(err);
    closeDrawer();
    onNotify(message);
    setReload((n) => n + 1);
  };

  const filtered = role !== 'all' || status !== 'all' || query !== '';

  return (
    <>
      <div className="toolbar">
        <label className="input-wrap">
          <span className="sr">Search users</span>
          <Icon name="search" />
          <input className="input" type="search" placeholder="Search by name or email" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter by role">
          {ROLE_FILTERS.map(([v, label]) => (
            <button key={v} className="chip" aria-pressed={role === v} onClick={() => pick(setRole)(v)}>{label}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(([v, label]) => (
            <button key={v} className="chip" aria-pressed={status === v} onClick={() => pick(setStatus)(v)}>{label}</button>
          ))}
        </div>
        <button className="btn primary push-right" onClick={() => setDrawer({ open: true, user: null })}><Icon name="plus" />New user</button>
      </div>

      <div className={`panel tablewrap${loading && loaded ? ' busy' : ''}`} aria-busy={loading}>
        {!loaded ? (
          <div className="empty"><b>Loading…</b></div>
        ) : rows.length === 0 ? (
          <div className="empty">
            {filtered ? (
              <>
                <b>No users match</b>Try a different search or{' '}
                <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={resetAll}>show everyone</button>.
              </>
            ) : <><b>No users yet</b>Create the first account with “New user”.</>}
          </div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} tabIndex={0} onClick={() => setDrawer({ open: true, user: u })}
                  onKeyDown={(e) => e.key === 'Enter' && setDrawer({ open: true, user: u })}>
                  <td><span className="ttl">{u.name}</span>{u.id === me.id && <span className="ref"> (you)</span>}</td>
                  <td className="muted">{u.email}</td>
                  <td className="muted">{ROLE_LABEL[u.role]}</td>
                  <td><span className={`pill ${u.active ? 's4' : 's0'}`}>{u.active ? 'Active' : 'Deactivated'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {loaded && <Pager page={page} pageSize={PAGE_SIZE} total={total} busy={loading} onPage={setPage} />}

      <UserDrawer user={drawer.user} me={me} open={drawer.open} onClose={closeDrawer} onSaved={saved} />
    </>
  );
}
