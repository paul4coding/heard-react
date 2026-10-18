import Icon from '../components/Icon.jsx';
import { Tracker } from '../components/Status.jsx';
import { Strip, QList, SecHead } from '../components/Lists.jsx';
import { CATS } from '../data.js';

export function StudentOverview({ complaints, name, onOpen, onNew }) {
  const active = complaints.filter((c) => c.stage < 4);
  const resolved = complaints.filter((c) => c.stage === 4);
  const toRate = resolved.filter((c) => !c.rating);
  const sub = `${active.length} ${active.length === 1 ? 'complaint is' : 'complaints are'} open${
    toRate.length ? ` and ${toRate.length} ${toRate.length === 1 ? 'is' : 'are'} waiting for your review` : ''}.`;

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
              <div className="hd"><span>{c.id}</span><span>{c.anon ? 'Anonymous' : c.cat}</span></div>
              <h3>{c.title}</h3>
              <Tracker stage={c.stage} />
            </button>
          ))}
        </div>
      ) : (
        <div className="panel empty"><b>No open complaints</b>When you lodge one, you will be able to follow it here.</div>
      )}
      <SecHead title="Resolved" note="Tell us if the fix worked" />
      <div className="panel pad"><QList list={resolved} empty="Resolved complaints will show up here." onOpen={onOpen} /></div>
    </>
  );
}

export function AdminOverview({ complaints: all, onOpen }) {
  const cnt = (n) => all.filter((c) => c.stage === n).length;
  const unassigned = all.filter((c) => c.stage < 2);
  const counts = CATS.map((k) => [k, all.filter((c) => c.cat === k).length]);
  const max = Math.max(...counts.map(([, n]) => n), 1);

  return (
    <>
      <Strip items={[[cnt(0), 'New and unread'], [cnt(1), 'Under review'], [cnt(2) + cnt(3), 'Assigned or in progress'], [cnt(4), 'Resolved']]} />
      <SecHead title="Needs a decision" note={`${unassigned.length} waiting for assignment`} />
      <div className="two">
        <div className="panel pad"><QList list={unassigned} empty="Every complaint has been assigned or resolved." onOpen={onOpen} /></div>
        <div className="panel pad">
          <h3 style={{ marginBottom: 16 }}>Complaints by category</h3>
          <div className="bars">
            {counts.map(([k, n]) => (
              <div className="bar" key={k}>
                <div className="t"><b>{k}</b><span>{n} of {all.length}</span></div>
                <div className="b"><i style={{ width: `${Math.round((n / max) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function HeadOverview({ complaints: m, onOpen }) {
  const n = (s) => m.filter((c) => c.stage === s).length;
  return (
    <>
      <Strip items={[[m.length, 'Assigned to you'], [n(2), 'Not started'], [n(3), 'In progress'], [n(4), 'Resolved']]} />
      <SecHead title="Your queue" note="Open the complaint to post an update" />
      <div className="panel pad"><QList list={m.filter((c) => c.stage < 4)} empty="Nothing is waiting on you." onOpen={onOpen} /></div>
    </>
  );
}
