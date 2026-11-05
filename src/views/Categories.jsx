import { useCallback, useEffect, useState } from 'react';
import { listAdminCategories, listCoordinators, setCategoryCoordinator } from '../api.js';

// Écran administrateur : quelle catégorie est gérée par quel coordinateur (un coordinateur = une seule catégorie).
export default function Categories({ onNotify, onError }) {
  const [cats, setCats] = useState(null);
  const [coords, setCoords] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, u] = await Promise.all([listAdminCategories(), listCoordinators()]);
      setCats(c.filter((x) => x.is_active));
      setCoords(u);
    } catch (e) {
      onError(e);
    }
  }, [onError]);

  useEffect(() => { load(); }, [load]);

  const change = async (cat, value) => {
    setBusy(cat.id);
    try {
      await setCategoryCoordinator(cat.id, value === '' ? null : +value);
      onNotify('Category updated');
      await load();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };

  if (!cats) return <div className="panel empty"><b>Loading…</b></div>;

  const taken = new Set(cats.filter((c) => c.coordinator).map((c) => c.coordinator.id));
  const fullName = (u) => `${u.first_name} ${u.last_name}`.trim() || u.username;

  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        Each category has its own coordinator, and a coordinator handles only one category.
        A complaint goes straight to the coordinator of the category the student chose. “Other” stays with the administrators.
      </p>
      <div className="panel tablewrap">
        <table>
          <thead><tr><th>Category</th><th>Coordinator</th><th>Email</th></tr></thead>
          <tbody>
            {cats.map((c) => {
              const options = coords.filter((u) => u.id === c.coordinator?.id || !taken.has(u.id));
              const email = c.coordinator ? coords.find((u) => u.id === c.coordinator.id)?.email : null;
              return (
                <tr key={c.id}>
                  <td><span className="ttl">{c.name}</span><span className="ref" style={{ display: 'block' }}>{c.description}</span></td>
                  <td>
                    <select className="input" value={c.coordinator?.id ?? ''} disabled={busy === c.id}
                      aria-label={`Coordinator of ${c.name}`} onChange={(e) => change(c, e.target.value)}>
                      <option value="">Administrators (no coordinator)</option>
                      {options.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td className="muted">{email ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {coords.some((u) => !taken.has(u.id)) && (
        <p className="more-note">
          Without a category: {coords.filter((u) => !taken.has(u.id)).map((u) => u.name).join(', ')}.
        </p>
      )}
    </>
  );
}
