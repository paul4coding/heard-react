import Icon from '../components/Icon.jsx';
import { Tracker } from '../components/Status.jsx';
import { Strip, QList, SecHead } from '../components/Lists.jsx';
import { SHOW_CATEGORIES } from '../data.js';

const count = (stats, ...keys) => keys.reduce((n, k) => n + (stats?.by_status?.[k] ?? 0), 0);
const Loading = () => <div className="panel empty"><b>Loading…</b></div>;

// `data` = { stats, items } : les compteurs viennent du serveur (exacts) ; les listes montrent les plaintes les plus récentes.
export function StudentOverview({ data, name, onOpen, onNew, onAll }) {
  if (!data) return <Loading />;
  const { stats, items } = data;
  const active = items.filter((c) => c.stage < 3);
  const done = items.filter((c) => c.stage >= 3);
  const openCount = count(stats, 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS');
  const truncated = stats.total > items.length;

  return (
    <>
      <section className="panel welcome">
        <div>
          <h2>Hi {name.split(' ')[0]}, here is where things stand.</h2>
          <p>{openCount} {openCount === 1 ? 'complaint is' : 'complaints are'} open.</p>
        </div>
        <button className="btn lg" onClick={onNew}><Icon name="plus" />Lodge a complaint</button>
      </section>
      <SecHead title="Open complaints" note="Select one to see every update" />
      {active.length ? (
        <div className="cards">
          {active.map((c) => (
            <button key={c.id} className="panel tcard" onClick={() => onOpen(c)}>
              <div className="hd"><span>{c.ref}</span><span>{c.cat ?? ''}</span></div>
              <h3>{c.title}</h3>
              <Tracker stage={c.stage} />
            </button>
          ))}
        </div>
      ) : (
        <div className="panel empty"><b>No open complaints</b>When you lodge one, you will be able to follow it here.</div>
      )}
      <SecHead title="Resolved" note="Completed complaints" />
      <div className="panel pad"><QList list={done} empty="Resolved complaints will show up here." onOpen={onOpen} /></div>
      {truncated && (
        <p className="more-note">
          Showing your {items.length} most recent of {stats.total} complaints.{' '}
          <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={onAll}>See all complaints</button>
        </p>
      )}
    </>
  );
}

export function AdminOverview({ data, onOpen, onAll }) {
  if (!data) return <Loading />;
  const { stats, unassigned } = data;
  // Release 1 : sans catégorie tant que l'administrateur n'a pas catégorisé (sprint 3) -> pas de graphique vide
  const entries = SHOW_CATEGORIES ? Object.entries(stats?.by_category ?? {}).filter(([k]) => k !== 'Uncategorized') : [];
  const max = Math.max(...entries.map(([, n]) => n), 1);

  return (
    <>
      <Strip items={[
        [count(stats, 'SUBMITTED'), 'New and unassigned'],
        [count(stats, 'ASSIGNED', 'IN_PROGRESS'), 'Assigned or in progress'],
        [count(stats, 'RESOLVED'), 'Resolved, to close'],
        [count(stats, 'CLOSED'), 'Closed'],
      ]} />
      <SecHead title="Needs a decision" note={`${unassigned.total} waiting for assignment`} />
      <div className={`two${entries.length ? '' : ' one'}`}>
        <div className="panel pad">
          <QList list={unassigned.items} empty="Every complaint has been assigned." onOpen={onOpen} />
          {unassigned.total > unassigned.items.length && (
            <p className="more-note">
              {unassigned.items.length} of {unassigned.total} shown.{' '}
              <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={onAll}>See all complaints</button>
            </p>
          )}
        </div>
        {entries.length > 0 && <div className="panel pad">
          <h3 style={{ marginBottom: 16 }}>Complaints by category</h3>
          {entries.length === 0 && <p style={{ color: 'var(--ink-3)' }}>No complaints yet.</p>}
          <div className="bars">
            {entries.map(([k, n]) => (
              <div className="bar" key={k}>
                <div className="t"><b>{k}</b><span>{n} of {stats.total}</span></div>
                <div className="b"><i style={{ width: `${Math.round((n / max) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          {stats?.avg_resolution_hours != null && (
            <p style={{ color: 'var(--ink-2)', marginTop: 18, fontSize: 14 }}>
              Average resolution time: <b>{stats.avg_resolution_hours} h</b>
            </p>
          )}
        </div>}
      </div>
    </>
  );
}

export function CoordinatorOverview({ data, onOpen, onAll }) {
  if (!data) return <Loading />;
  const { stats, items } = data;
  const queue = items.filter((c) => c.stage < 3);
  return (
    <>
      <Strip items={[
        [stats.total, 'Assigned to you'], [count(stats, 'ASSIGNED'), 'Not started'],
        [count(stats, 'IN_PROGRESS'), 'In progress'], [count(stats, 'RESOLVED', 'CLOSED'), 'Resolved'],
      ]} />
      <SecHead title="Your queue" note="Open the complaint to post an update" />
      <div className="panel pad">
        <QList list={queue} empty="Nothing is waiting on you." onOpen={onOpen} />
        {stats.total > items.length && (
          <p className="more-note">
            Showing your {items.length} most recent of {stats.total} complaints.{' '}
            <button className="btn ghost" style={{ height: 'auto', padding: '0 4px', color: 'var(--brand)' }} onClick={onAll}>See all complaints</button>
          </p>
        )}
      </div>
    </>
  );
}
