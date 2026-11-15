import { useEffect, useRef, useState } from 'react';
import { Lightbox } from './Attachments.jsx';
import Icon from './Icon.jsx';
import { formatSize, isVideo } from '../utils.js';

// Une preuve (photo ou courte vidéo). Le fichier exige le jeton : on le télécharge avec l'en-tête Authorization.
function EvidenceThumb({ load, att, onView }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const urlRef = useRef(null);

  useEffect(() => {
    let alive = true;
    load(att.id)
      .then((u) => {
        if (!alive) return URL.revokeObjectURL(u);
        urlRef.current = u;
        setUrl(u);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [att.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const video = isVideo(att.type);
  return (
    <div className="att">
      <button type="button" className="att-th" onClick={() => url && onView(url, att)} aria-label={`Open ${att.name}`} disabled={failed || !url}>
        {failed ? <span className="att-msg">Could not load</span>
          : !url ? <span className="att-msg">Loading…</span>
          : video ? <><video src={url} muted preload="metadata" /><span className="play"><Icon name="video" /></span></>
          : <img src={url} alt={att.name} />}
      </button>
      <span className="att-name" title={att.name}>{att.name}</span>
      <span className="att-size">{formatSize(att.size)} · {att.kind === 'DEFENSE' ? 'Defense' : att.kind === 'PROOF' ? 'Transfer receipt' : 'Evidence'}</span>
    </div>
  );
}

// items : preuves renvoyées par l'API ; load(id) renvoie une URL locale
export default function EvidenceGrid({ items, load }) {
  const [view, setView] = useState(null);
  if (!items?.length) return null;
  return (
    <>
      <div className="att-grid">
        {items.map((e) => (
          <EvidenceThumb key={e.id} load={load} onView={(url, att) => setView({ url, att })}
            att={{ id: e.id, name: e.filename, type: e.content_type, size: e.size, kind: e.kind }} />
        ))}
      </div>
      {view && <Lightbox url={view.url} att={view.att} onClose={() => setView(null)} />}
    </>
  );
}
