import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import * as api from '../api.js';

const REFRESH_MS = 30000;

// Cloche de notifications : nombre de non lues, liste, ouverture de la plainte ou du dossier concerné.
export default function Notifications({ role, refreshKey, onOpenComplaint, onOpenLiability, onError }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.listNotifications(role));
    } catch (e) {
      if (e.status === 401) onError(e);
    }
  }, [role, onError]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load, refreshKey]);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const unread = items.filter((n) => !n.is_read).length;

  const pick = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      api.markNotificationRead(role, n.id).catch(() => {});
    }
    if (n.designation_id) onOpenLiability(n.designation_id);
    else if (n.complaint_id) onOpenComplaint(n.complaint_id);
  };

  return (
    <div className="notif" ref={box}>
      <button className="icon-btn" onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Icon name="bell" />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-pop" role="dialog" aria-label="Notifications">
          <div className="notif-top"><b>Notifications</b><span>{unread ? `${unread} unread` : 'All read'}</span></div>
          {items.length === 0 ? <p className="notif-empty">Nothing yet.</p> : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button className={n.is_read ? '' : 'unread'} onClick={() => pick(n)}>
                    <span>{n.message}</span>
                    <small>{api.fmtWhen(n.created_at)}{n.designation_id ? ' · investigation' : ''}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
