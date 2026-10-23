import { useEffect, useRef, useState } from 'react';
import FilePicker from './FilePicker.jsx';
import Icon from './Icon.jsx';
import { fetchAttachmentUrl } from '../api.js';
import { MAX_FILES, formatSize, isVideo } from '../utils.js';

// Visionneuse plein écran (image ou vidéo). Échap ferme la visionneuse seulement, pas le tiroir.
function Lightbox({ url, att, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={att.name} onClick={onClose}>
      <button className="icon-btn lb-close" aria-label="Close preview" onClick={onClose}><Icon name="x" /></button>
      <div className="lb-body" onClick={(e) => e.stopPropagation()}>
        {isVideo(att.type) ? <video src={url} controls autoPlay /> : <img src={url} alt={att.name} />}
        <p>{att.name} · {formatSize(att.size)}</p>
      </div>
    </div>
  );
}

function Thumb({ role, complaintId, att, canDelete, onView, onDelete }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const urlRef = useRef(null);
  const video = isVideo(att.type);

  const load = async () => {
    if (urlRef.current) return urlRef.current;
    setLoading(true);
    try {
      urlRef.current = await fetchAttachmentUrl(role, complaintId, att.id);
      setUrl(urlRef.current);
      return urlRef.current;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Les images se chargent tout de suite ; les vidéos (lourdes) seulement au clic
  useEffect(() => {
    if (!video) load();
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, [att.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async () => {
    const u = await load();
    if (u) onView(u, att);
  };

  return (
    <div className="att">
      <button type="button" className="att-th" onClick={open} aria-label={`Open ${att.name}`} disabled={failed}>
        {failed ? <span className="att-msg">Could not load</span>
          : video ? <span className="att-msg"><Icon name="video" />{loading ? 'Loading…' : 'Play video'}</span>
            : url ? <img src={url} alt={att.name} /> : <span className="att-msg">Loading…</span>}
      </button>
      <span className="att-name" title={att.name}>{att.name}</span>
      <span className="att-size">{formatSize(att.size)}</span>
      {canDelete && (
        <button type="button" className={`att-rm${confirm ? ' sure' : ''}`}
          aria-label={confirm ? `Confirm removing ${att.name}` : `Remove ${att.name}`}
          onClick={() => (confirm ? onDelete(att.id) : setConfirm(true))}
          onBlur={() => setConfirm(false)}>
          {confirm ? 'Remove?' : <Icon name="x" />}
        </button>
      )}
    </div>
  );
}

export default function Attachments({ complaint: c, role, userId, onUpload, onDelete }) {
  const [files, setFiles] = useState([]);
  const [pickerKey, setPickerKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);

  const isOwner = role === 'student';
  const closed = c.stage === 4;
  const capacity = MAX_FILES - c.attachments.length;
  const canAdd = isOwner && !closed && capacity > 0;
  if (!c.attachments.length && !(isOwner && !closed)) return null;

  const upload = async () => {
    setBusy(true);
    const err = await onUpload(files);
    setBusy(false);
    if (!err) {
      setFiles([]);
      setPickerKey((k) => k + 1); // vide le sélecteur
    }
  };

  return (
    <div className="dsec">
      <h3>Attachments{c.attachments.length ? ` (${c.attachments.length})` : ''}</h3>
      {c.attachments.length === 0 && <p style={{ color: 'var(--ink-3)', marginBottom: 12 }}>No files attached yet.</p>}
      {c.attachments.length > 0 && (
        <div className="att-grid">
          {c.attachments.map((a) => (
            <Thumb key={a.id} role={role} complaintId={c.id} att={a}
              canDelete={isOwner && !closed && a.uploaderId === userId}
              onView={(url, att) => setView({ url, att })} onDelete={onDelete} />
          ))}
        </div>
      )}
      {canAdd && (
        <div style={{ marginTop: 14 }}>
          <FilePicker key={pickerKey} capacity={capacity} onChange={setFiles} disabled={busy} />
          {files.length > 0 && (
            <button className="btn primary block" style={{ marginTop: 10 }} disabled={busy} onClick={upload}>
              {busy ? 'Uploading…' : `Upload ${files.length} file${files.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      )}
      {isOwner && !closed && capacity === 0 && (
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 10 }}>
          You reached the limit of {MAX_FILES} files. Remove one to add another.
        </p>
      )}
      {view && <Lightbox url={view.url} att={view.att} onClose={() => setView(null)} />}
    </div>
  );
}
