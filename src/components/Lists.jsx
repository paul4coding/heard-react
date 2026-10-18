import Icon from './Icon.jsx';
import { Pill } from './Status.jsx';

export function Strip({ items }) {
  return (
    <div className="panel strip">
      {items.map(([n, l]) => (
        <div className="stat" key={l}><b>{n}</b><span>{l}</span></div>
      ))}
    </div>
  );
}

export function QList({ list, empty, onOpen }) {
  if (!list.length) return <div className="empty"><b>Nothing here</b>{empty}</div>;
  return (
    <div className="qlist">
      {list.map((c) => (
        <button key={c.id} className="qitem" onClick={() => onOpen(c.id)}>
          <div className="t"><b>{c.title}</b><span>{c.ref} &nbsp;{c.cat}</span></div>
          <Pill stage={c.stage} />
        </button>
      ))}
    </div>
  );
}

export const SecHead = ({ title, note }) => (
  <div className="sec-head"><h2>{title}</h2><p>{note}</p></div>
);
