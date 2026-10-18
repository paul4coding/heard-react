import Icon from '../components/Icon.jsx';
import { Tracker } from '../components/Status.jsx';
import { Strip, QList, SecHead } from '../components/Lists.jsx';

export function StudentOverview({ complaints, name, onOpen, onNew }) {
  const active = complaints.filter((c) => c.stage < 3);
  const done = complaints.filter((c) => c.stage >= 3);
  const sub = `${active.length} ${active.length === 1 ? 'complaint is' : 'complaints are'} open.`;

  return (
    <>
      <section className="panel welcome">
        <div><h2>Hi {name.split(' ')[0]}, here is where things stand.</h2><p>{sub}</p></div>
        <button className="btn lg" onClick={onNew}><Icon name="plus" />Lodge a complaint</button>
      </section>
      <SecHead title="Open complaints" note="Select one to see every update" />
      {active.length ? (
        <div className="cards">
          {active.map((c) => (
            <button key={c.id} className="panel tcard" onClick={() => onOpen(c.id)}>
              <div className="hd"><span>{c.ref}</span><span>{c.cat}</span></div>
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
    </>
  );
}

export function AdminOverview({ complaints: all, stats, onOpen }) {
  const cnt = (s) => stats?.by_status?.[s] ?? 0;
  const unassigned = all.filter((c) => c.assigneeId === null && c.stage < 4);
  const entries = Object.entries(stats?.by_category ?? {});
  const max = Math.max(...entries.map(([, n]) => n), 1);

  return (
    <>
      <Strip items={[
        [cnt('SUBMITTED'), 'New and unassigned'],
        [cnt('ASSIGNED') + cnt('IN_PROGRESS'), 'Assigned or in progress'],
        [cnt('RESOLVED'), 'Resolved, to close'],
        [cnt('CLOSED'), 'Closed'],
      ]} />
      <SecHead title="Needs a decision" note={`${unassigned.length} waiting for assignment`} />
      <div className="two">
        <div className="panel pad"><QList list={unassigned} empty="Every complaint has been assigned." onOpen={onOpen} /></div>
        <div className="panel pad">
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
        </div>
      </div>
    </>
  );
}

export function CoordinatorOverview({ complaints: m, onOpen }) {
  const n = (s) => m.filter((c) => c.stage === s).length;
  return (
    <>
      <Strip items={[[m.length, 'Assigned to you'], [n(1), 'Not started'], [n(2), 'In progress'], [n(3) + n(4), 'Resolved']]} />
      <SecHead title="Your queue" note="Open the complaint to post an update" />
      <div className="panel pad"><QList list={m.filter((c) => c.stage < 3)} empty="Nothing is waiting on you." onOpen={onOpen} /></div>
    </>
  );
}
