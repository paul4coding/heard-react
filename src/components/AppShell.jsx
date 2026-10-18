import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { NAV, TITLES, ROLE_LABEL } from '../data.js';
import { initials } from '../utils.js';

export default function AppShell({ role, user, view, dark, onNav, onTheme, onLogout, children }) {
  const [h, p] = TITLES[role][view];

  return (
    <div className="app">
      <aside className="side">
        <Logo />
        <nav className="nav" aria-label="Main">
          {NAV[role].map(([k, label, icon]) => (
            <button key={k} aria-current={view === k ? 'page' : undefined} onClick={() => onNav(k)}>
              <Icon name={icon} />{label}
            </button>
          ))}
        </nav>
        <div className="spacer" />
        <div className="me">
          <div className="avatar">{initials(user.name)}</div>
          <div><div className="n">{user.name}</div><div className="r">{ROLE_LABEL[role]}</div></div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><h1>{h}</h1><p>{p}</p></div>
          <div className="tools">
            <button className="icon-btn" onClick={onTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
            <button className="btn" onClick={onLogout}><Icon name="logout" />Sign out</button>
          </div>
        </header>
        <div>{children}</div>
      </main>
    </div>
  );
}
