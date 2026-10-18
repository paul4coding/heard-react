import { STAGES } from '../data.js';

export const Pill = ({ stage }) => <span className={`pill s${stage}`}>{STAGES[stage]}</span>;

export const Tracker = ({ stage }) => (
  <ol className="track" aria-label={`Progress: ${STAGES[stage]}`}>
    {STAGES.map((n, i) => (
      <li key={n} className={i < stage ? 'done' : i === stage ? 'now' : ''}>
        <span className="seg" />
        <span className="lbl">{n}</span>
      </li>
    ))}
  </ol>
);

export const Mini = ({ stage }) => (
  <div className="mini" aria-hidden="true">
    {STAGES.map((n, i) => <i key={n} className={i <= stage ? 'on' : ''} />)}
  </div>
);
