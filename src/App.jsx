import { useCallback, useEffect, useRef, useState } from 'react';
import AuthPage from './components/AuthPage.jsx';
import AppShell from './components/AppShell.jsx';
import Drawer from './components/Drawer.jsx';
import Landing from './components/Landing.jsx';
import Toast from './components/Toast.jsx';
import ComplaintList from './views/ComplaintList.jsx';
import NewComplaint, { ComplaintSuccess } from './views/NewComplaint.jsx';
import { StudentOverview, AdminOverview, HeadOverview } from './views/Overviews.jsx';
import { INITIAL_COMPLAINTS, PEOPLE, STAGES } from './data.js';
import { nowStamp } from './utils.js';

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function App() {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('overview');
  const [lastNew, setLastNew] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [shownId, setShownId] = useState(null);
  const [theme, setTheme] = useState(null);
  const [toast, setToast] = useState('');
  const [screen, setScreen] = useState('landing');
  const [authTab, setAuthTab] = useState('in');
  const toastTimer = useRef(null);

  const dark = theme ? theme === 'dark' : systemDark();

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  const open = (id) => {
    if (role === 'student' && view === 'new' && lastNew) {
      setLastNew(null);
      setView('mine');
    }
    setShownId(id);
    setOpenId(id);
  };
  const close = useCallback(() => setOpenId(null), []);

  const enter = (r, name) => {
    setRole(r);
    setUser({ name, sub: PEOPLE[r].sub });
    setView('overview');
    setLastNew(null);
    window.scrollTo(0, 0);
  };

  const logout = () => {
    close();
    setRole(null);
    setScreen('landing');
    window.scrollTo(0, 0);
  };

  const nav = (v) => {
    setView(v);
    setLastNew(null);
    close();
    window.scrollTo(0, 0);
  };

  const visible = () => {
    if (role === 'student') return complaints.filter((c) => c.owner === 'me');
    if (role === 'head') return complaints.filter((c) => c.assignee === PEOPLE.head.name);
    return complaints;
  };

  const create = (data) => {
    const next = Math.max(...complaints.map((c) => +c.id.slice(4))) + 1;
    const c = {
      ...data, id: `CMP-${next}`, stage: 0, owner: 'me', assignee: null, date: 'Oct 14',
      log: [{ st: 'Submitted', when: nowStamp(), note: 'Complaint received.' }], rating: null,
    };
    setComplaints([c, ...complaints]);
    setLastNew(c);
    window.scrollTo(0, 0);
  };

  const save = (payload) => {
    setComplaints((list) => list.map((c) => {
      if (c.id !== openId) return c;
      if (payload.kind === 'review') return { ...c, rating: payload.rating, review: payload.review };
      let { stage } = payload;
      let assignee = c.assignee;
      if (payload.kind === 'admin') {
        if (payload.route === 'head') { assignee = payload.head; if (stage < 2) stage = 2; }
        else { assignee = 'Administrator'; if (stage < 1) stage = 1; }
      }
      const msg = payload.note ||
        (payload.kind === 'admin' && assignee !== 'Administrator' ? `Assigned to ${assignee}.` : `Status changed to ${STAGES[stage]}.`);
      return { ...c, stage, assignee, log: [...c.log, { st: STAGES[stage], when: nowStamp(), note: msg }] };
    }));
    notify(payload.kind === 'review' ? 'Review submitted' : 'Update saved');
  };

  const toggleTheme = () => setTheme(dark ? 'light' : 'dark');

  if (!role && screen === 'landing') {
    return (
      <Landing
        dark={dark} onTheme={toggleTheme}
        onSignIn={() => { setAuthTab('in'); setScreen('auth'); window.scrollTo(0, 0); }}
        onSignUp={() => { setAuthTab('up'); setScreen('auth'); window.scrollTo(0, 0); }}
      />
    );
  }
  if (!role) return <AuthPage onEnter={enter} initialTab={authTab} onBack={() => setScreen('landing')} />;

  const list = visible();
  const openFrom = { complaints: list, onOpen: open };
  let content;
  switch (`${role}.${view}`) {
    case 'student.overview':
      content = <StudentOverview {...openFrom} name={user.name} onNew={() => nav('new')} />;
      break;
    case 'student.new':
      content = lastNew
        ? <ComplaintSuccess complaint={lastNew} onView={open} onAgain={() => setLastNew(null)} />
        : <NewComplaint onSubmit={create} />;
      break;
    case 'admin.overview':
      content = <AdminOverview {...openFrom} />;
      break;
    case 'head.overview':
      content = <HeadOverview {...openFrom} />;
      break;
    default:
      content = <ComplaintList key={`${role}.${view}`} complaints={list} role={role} studentName={PEOPLE.student.name} onOpen={open} />;
  }

  return (
    <>
      <AppShell
        role={role} user={user} view={view} dark={dark}
        onNav={nav} onLogout={logout}
        onTheme={toggleTheme}
      >
        {content}
      </AppShell>
      <Drawer
        complaint={complaints.find((c) => c.id === shownId)}
        role={role} studentName={PEOPLE.student.name}
        open={!!openId} onClose={close} onSave={save} onError={notify}
      />
      <Toast message={toast} />
    </>
  );
}
