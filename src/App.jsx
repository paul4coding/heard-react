import { useCallback, useEffect, useRef, useState } from 'react';
import AuthPage from './components/AuthPage.jsx';
import AppShell from './components/AppShell.jsx';
import Drawer from './components/Drawer.jsx';
import Landing from './components/Landing.jsx';
import Toast from './components/Toast.jsx';
import ComplaintList from './views/ComplaintList.jsx';
import NewComplaint, { ComplaintSuccess } from './views/NewComplaint.jsx';
import { StudentOverview, AdminOverview, CoordinatorOverview } from './views/Overviews.jsx';
import { STATUSES } from './data.js';
import * as api from './api.js';

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!api.getToken());
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [view, setView] = useState('overview');
  const [lastNew, setLastNew] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [shownId, setShownId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [theme, setTheme] = useState(null);
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState('landing');
  const toastTimer = useRef(null);

  const role = user?.role;
  const dark = theme ? theme === 'dark' : systemDark();

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  const notify = useCallback((message, error = false) => {
    setToast({ message, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const close = useCallback(() => setOpenId(null), []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setComplaints([]);
    setStats(null);
    setOpenId(null);
    setLastNew(null);
    setView('overview');
    setScreen('landing');
    window.scrollTo(0, 0);
  }, []);

  // Toute erreur API : 401 => retour à la connexion, sinon message
  const fail = useCallback((e) => {
    if (e.status === 401) {
      logout();
      notify('Your session has expired. Sign in again.', true);
    } else {
      notify(e.message, true);
    }
    return e.message;
  }, [logout, notify]);

  const loadData = useCallback(async (u) => {
    setLoading(true);
    try {
      const jobs = [api.listComplaints(u.role).then(setComplaints)];
      if (u.role === 'student') jobs.push(api.listCategories().then(setCategories));
      if (u.role === 'admin') {
        jobs.push(api.getStats().then(setStats));
        jobs.push(api.listCoordinators().then((rows) => setCoordinators(rows.map(api.toUser))));
      }
      await Promise.all(jobs);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [fail]);

  // Reprise de session au chargement
  useEffect(() => {
    if (!api.getToken()) return;
    api.me()
      .then((u) => { setUser(u); loadData(u); })
      .catch(() => api.setToken(null))
      .finally(() => setBooting(false));
  }, [loadData]);

  const login = async (username, password) => {
    try {
      const u = await api.login(username, password);
      setUser(u);
      setView('overview');
      setLastNew(null);
      window.scrollTo(0, 0);
      loadData(u);
      return null;
    } catch (e) {
      return e.status === 401 ? 'Incorrect username or password.' : e.message;
    }
  };

  const replace = (c) => setComplaints((list) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [c, ...list]));

  const open = async (id) => {
    if (role === 'student' && view === 'new' && lastNew) {
      setLastNew(null);
      setView('mine');
    }
    setShownId(id);
    setOpenId(id);
    setDetailLoading(true);
    try {
      replace(await api.getComplaint(role, id));
    } catch (e) {
      fail(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const nav = (v) => {
    setView(v);
    setLastNew(null);
    close();
    window.scrollTo(0, 0);
  };

  const create = async (data) => {
    try {
      const c = await api.createComplaint(data);
      replace(c);
      setLastNew(c);
      window.scrollTo(0, 0);
      return null;
    } catch (e) {
      return fail(e);
    }
  };

  // Applique une action du tiroir, dans l'ordre : affectation/priorité -> statut -> message
  const act = async (a) => {
    const id = openId;
    try {
      let c = null;
      if (a.kind === 'comment') {
        c = await api.addComment(role, id, a.note);
      } else {
        if (a.assign) c = await api.assign(id, a.assign.coordinatorId, a.assign.priority);
        else if (a.priority) c = await api.setPriority(id, a.priority);
        let noteSent = false;
        if (a.stage != null) {
          if (a.stage === 3 && a.note) {
            c = await api.addComment(role, id, a.note, true); // la résolution passe la plainte en RESOLVED
            noteSent = true;
          } else {
            c = await api.setStatus(role, id, STATUSES[a.stage]);
          }
        }
        if (a.note && !noteSent) c = await api.addComment(role, id, a.note);
      }
      if (c) replace(c);
      if (role === 'admin') api.getStats().then(setStats).catch(() => {});
      notify(a.kind === 'comment' ? 'Message sent' : 'Update saved');
      return null;
    } catch (e) {
      // Une étape a pu réussir avant l'échec : on resynchronise la plainte
      api.getComplaint(role, id).then(replace).catch(() => {});
      return fail(e);
    }
  };

  if (booting) return null;

  const toggleTheme = () => setTheme(dark ? 'light' : 'dark');

  if (!user && screen === 'landing') {
    return <Landing dark={dark} onTheme={toggleTheme} onSignIn={() => { setScreen('auth'); window.scrollTo(0, 0); }} />;
  }
  if (!user) return <AuthPage onLogin={login} onBack={() => setScreen('landing')} />;

  const props = { complaints, onOpen: open };
  let content;
  switch (`${role}.${view}`) {
    case 'student.overview':
      content = <StudentOverview {...props} name={user.name} onNew={() => nav('new')} />;
      break;
    case 'student.new':
      content = lastNew
        ? <ComplaintSuccess complaint={lastNew} onView={open} onAgain={() => setLastNew(null)} />
        : <NewComplaint categories={categories} onSubmit={create} />;
      break;
    case 'admin.overview':
      content = <AdminOverview {...props} stats={stats} />;
      break;
    case 'coordinator.overview':
      content = <CoordinatorOverview {...props} />;
      break;
    default:
      content = <ComplaintList key={`${role}.${view}`} complaints={complaints} role={role} loading={loading} onOpen={open} />;
  }

  return (
    <>
      <AppShell role={role} user={user} view={view} dark={dark} onNav={nav} onLogout={logout} onTheme={toggleTheme}>
        {content}
      </AppShell>
      <Drawer
        complaint={complaints.find((c) => c.id === shownId)}
        role={role} coordinators={coordinators} loading={detailLoading}
        open={openId !== null} onClose={close} onAction={act}
      />
      <Toast toast={toast} />
    </>
  );
}
