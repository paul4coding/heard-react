import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { Tracker } from './Status.jsx';

const FEATURES = [
  ['bubble', 'One place for everything', 'Classroom, facilities, sanitation and admin issues all go through the same simple form.'],
  ['users', 'The right person on it', 'Administrators assign every complaint to a coordinator who posts updates.'],
  ['chart', 'Clear status, always', 'Five visible stages from Submitted to Closed, with a history of every change.'],
  ['mail', 'Talk to the team', 'Exchange messages on your complaint until it is resolved and closed.'],
];

const STEPS = [
  ['Lodge it', 'Describe the problem and pick a category.'],
  ['We route it', 'An administrator reviews it and assigns a coordinator.'],
  ['Follow along', 'Every update shows up on your dashboard.'],
  ['Close the loop', 'Once resolved, the administrator closes the complaint.'],
];

export default function Landing({ onSignIn, dark, onTheme }) {
  return (
    <div className="landing">
      <header className="l-nav">
        <Logo />
        <nav className="l-nav-links" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="tools">
          <button className="icon-btn" onClick={onTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <button className="btn" onClick={onSignIn}>Sign in</button>
        </div>
      </header>

      <section className="l-hero">
        <div>
          <span className="l-eyebrow">Student complaint management</span>
          <h1>Report it once. Watch it get fixed.</h1>
          <p className="l-lede">One place for every classroom, facilities and admin complaint on campus, with a clear status from the moment you send it.</p>
          <div className="l-cta">
            <button className="btn primary lg" onClick={onSignIn}>Lodge a complaint</button>
            <button className="btn lg" onClick={onSignIn}>Sign in</button>
          </div>
        </div>
        <div className="panel l-card" aria-hidden="true">
          <div className="hd"><span>CMP-1048</span><span className="pill s3">In progress</span></div>
          <h3>Projector in Room B204 keeps flickering</h3>
          <Tracker stage={3} />
          <p className="l-note"><b>Dr. Naidoo:</b> A replacement lamp is on order. Technicians will fit it on Thursday.</p>
        </div>
      </section>

      <section className="l-stats">
        <div className="panel strip">
          <div className="stat"><b>5</b><span>Visible stages per complaint</span></div>
          <div className="stat"><b>3</b><span>Roles: student, coordinator, admin</span></div>
          <div className="stat"><b>1</b><span>Reference per complaint</span></div>
          <div className="stat"><b>24/7</b><span>Follow progress online</span></div>
        </div>
      </section>

      <section id="features" className="l-section">
        <h2>Built so nothing gets lost</h2>
        <div className="l-grid">
          {FEATURES.map(([icon, t, d]) => (
            <div className="panel pad l-feature" key={t}>
              <span className="l-ic"><Icon name={icon} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="l-section">
        <h2>How it works</h2>
        <ol className="l-steps">
          {STEPS.map(([t, d]) => (
            <li className="panel pad" key={t}><b>{t}</b><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="l-section">
        <div className="panel welcome">
          <div><h2>Something wrong on campus?</h2><p>It takes a minute to lodge a complaint and you can follow it every step of the way.</p></div>
          <button className="btn lg" onClick={onSignIn}>Get started</button>
        </div>
      </section>

      <footer className="l-foot"><Logo /><span>Student complaint management</span></footer>
    </div>
  );
}
