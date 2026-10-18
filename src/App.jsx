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
const OVERVIEW_ITEMS = 50; // plaintes récentes affichées dans les aperçus (les compteurs, eux, sont exacts)

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!api.getToken());
  const [overview, setOverview] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // incrémenté après chaque modification : les listes se rechargent
  const [categories, setCategories] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [view, setView] = useState('overview');
  const [lastNew, setLastNew] = useState(null);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
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

  const close = useCallback(() => setOpen(false), []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setOverview(null);
    setOpen(false);
    setSelected(null);
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

  // Données de l'aperçu : compteurs exacts + quelques plaintes récentes (jamais toute la base)
  const loadOverview = useCallback(async (u) => {
    try {
      if (u.role === 'admin') {
        const [stats, unassigned] = await Promise.all([
          api.getStats(),
          api.listComplaints('admin', { unassigned: true, limit: 20 }),
        ]);
        setOverview({ stats, unassigned });
      } else {
        const [stats, { items }] = await Promise.all([
          api.getMyStats(u.role),
          api.listComplaints(u.role, { limit: OVERVIEW_ITEMS }),
        ]);
        setOverview({ stats, items });
      }
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  const loadStatic = useCallback(async (u) => {
    try {
      if (u.role === 'student') setCategories(await api.listCategories());
      if (u.role === 'admin') setCoordinators((await api.listCoordinators()).map(api.toUser));
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  // Reprise de session au chargement
  useEffect(() => {
    if (!api.getToken()) return;
    api.me()
      .then((u) => { setUser(u); loadOverview(u); loadStatic(u); })
      .catch(() => api.setToken(null))
      .finally(() => setBooting(false));
  }, [loadOverview, loadStatic]);

  const login = async (username, password) => {
    try {
      const u = await api.login(username, password);
      setUser(u);
      setView('overview');
      setLastNew(null);
      setOverview(null);
      window.scrollTo(0, 0);
      loadOverview(u);
      loadStatic(u);
      return null;
    } catch (e) {
      return e.status === 401 ? 'Incorrect username or password.' : e.message;
    }
  };

  const refreshAll = () => {
    setRefreshKey((k) => k + 1);
    loadOverview(user);
  };

  // Ouvre le tiroir tout de suite avec la ligne déjà connue, puis charge le détail (messages, historique)
  const openComplaint = async (c) => {
    if (role === 'student' && view === 'new' && lastNew) {
      setLastNew(null);
      setView('mine');
    }
    setSelected(c);
    setOpen(true);
    setDetailLoading(true);
    try {
      const full = await api.getComplaint(role, c.id);
      setSelected((cur) => (cur && cur.id === c.id ? full : cur));
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
    refreshAll(); // d'autres utilisateurs ont pu modifier des plaintes
  };

  const create = async (data) => {
    try {
      const c = await api.createComplaint(data);
      setLastNew(c);
      refreshAll();
      window.scrollTo(0, 0);
      return null;
    } catch (e) {
      return fail(e);
    }
  };

  // Applique une action du tiroir, dans l'ordre : affectation/priorité -> message -> statut
  const act = async (a) => {
    const id = selected.id;
    const keep = (c) => setSelected((cur) => (cur && cur.id === id ? c : cur));
    try {
      let c = null;
      if (a.kind === 'comment') {
        c = await api.addComment(role, id, a.note);
      } else {
        if (a.assign) c = await api.assign(id, a.assign.coordinatorId, a.assign.priority);
        else if (a.priority) c = await api.setPriority(id, a.priority);
        if (a.stage === 3 && a.note) {
          c = await api.addComment(role, id, a.note, true); // la résolution passe la plainte en RESOLVED
        } else {
          // Le backend refuse les messages sur une plainte clôturée : on poste donc la note avant le changement de statut
          if (a.note) c = await api.addComment(role, id, a.note);
          if (a.stage != null) c = await api.setStatus(role, id, STATUSES[a.stage]);
        }
      }
      if (c) keep(c);
      notify(a.kind === 'comment' ? 'Message sent' : 'Update saved');
      return null;
    } catch (e) {
      // Une étape a pu réussir avant l'échec : on resynchronise la plainte
      api.getComplaint(role, id).then(keep).catch(() => {});
      return fail(e);
    } finally {
      refreshAll();
    }
  };

  if (booting) return null;

  const toggleTheme = () => setTheme(dark ? 'light' : 'dark');

  if (!user) {
    return (
      <>
        {screen === 'landing'
          ? <Landing dark={dark} onTheme={toggleTheme} onSignIn={() => { setScreen('auth'); window.scrollTo(0, 0); }} />
          : <AuthPage onLogin={login} onBack={() => setScreen('landing')} />}
        <Toast toast={toast} />
      </>
    );
  }

  const listView = role === 'admin' ? 'all' : role === 'coordinator' ? 'queue' : 'mine';
  const props = { data: overview, onOpen: openComplaint, onAll: () => nav(listView) };
  let content;
  switch (`${role}.${view}`) {
    case 'student.overview':
      content = <StudentOverview {...props} name={user.name} onNew={() => nav('new')} />;
      break;
    case 'student.new':
      content = lastNew
        ? <ComplaintSuccess complaint={lastNew} onView={openComplaint} onAgain={() => setLastNew(null)} />
        : <NewComplaint categories={categories} onSubmit={create} />;
      break;
    case 'admin.overview':
      content = <AdminOverview {...props} />;
      break;
    case 'coordinator.overview':
      content = <CoordinatorOverview {...props} />;
      break;
    default:
      content = <ComplaintList key={`${role}.${view}`} role={role} refreshKey={refreshKey} onOpen={openComplaint} onError={fail} />;
  }

  return (
    <>
      <AppShell role={role} user={user} view={view} dark={dark} onNav={nav} onLogout={logout} onTheme={toggleTheme}>
        {content}
      </AppShell>
      <Drawer
        complaint={selected}
        role={role} coordinators={coordinators} loading={detailLoading}
        open={open} onClose={close} onAction={act}
      />
      <Toast toast={toast} />
    </>
  );
}
