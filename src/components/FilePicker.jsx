import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { ACCEPT, ACCEPT_MEDIA, MAX_MB, MAX_MEDIA_MB, checkFile, checkMedia, formatSize, isVideo } from '../utils.js';

// Zone de dépôt + aperçu d'image. Garde sa propre liste ; le parent reçoit un tableau de File via onChange.
// Pour la vider (après un envoi), le parent change la `key` du composant.
// Sprint 1 : une seule image facultative par plainte (capacity = 1).
// `media` : accepte aussi les courtes vidéos (preuves d'une enquête)
export default function FilePicker({ capacity, onChange, disabled = false, noun = 'photo', media = false }) {
  const check = media ? checkMedia : checkFile;
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const latest = useRef(items);
  latest.current = items;

  useEffect(() => () => latest.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const update = (next) => {
    setItems(next);
    onChange(next.map((i) => i.file));
  };

  const add = (list) => {
    if (disabled) return;
    let msg = '';
    const next = [...items];
    [...list].forEach((file) => {
      const bad = check(file);
      if (bad) msg = bad;
      else if (next.length >= capacity) msg = capacity === 1 ? `Only one ${noun} can be attached. Remove it to choose another.` : `You can attach up to ${capacity} ${noun}s.`;
      else next.push({ file, url: URL.createObjectURL(file), key: `${file.name}-${file.size}-${file.lastModified}-${next.length}` });
    });
    setErr(msg);
    update(next);
  };

  const remove = (i) => {
    URL.revokeObjectURL(items[i].url);
    update(items.filter((_, j) => j !== i));
    setErr('');
  };

  return (
    <div>
      <div
        className={`drop${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <div className="ic"><Icon name="upload" /></div>
        <b>{capacity > 1 ? `Drag ${noun}s here` : `Drag a ${noun} here`}</b>
        <p>{media ? `Photo (PNG, JPEG, GIF, WebP) or short video (MP4, WebM), up to ${MAX_MEDIA_MB} MB` : `PNG, JPEG, GIF or WebP, up to ${MAX_MB} MB`}</p>
        <button type="button" className="btn" disabled={disabled || items.length >= capacity} onClick={() => input.current.click()}>{capacity > 1 ? `Choose ${noun}s` : `Choose a ${noun}`}</button>
        <input ref={input} type="file" accept={media ? ACCEPT_MEDIA : ACCEPT} multiple={capacity > 1} hidden data-testid="file-input"
          onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {items.length > 0 && (
        <div className="previews">
          {items.map((i, idx) => (
            <div className="pv" key={i.key}>
              {isVideo(i.file.type) ? <video src={i.url} muted preload="metadata" aria-label={i.file.name} /> : <img src={i.url} alt={i.file.name} />}
              <span className="tag">{isVideo(i.file.type) ? 'Video' : noun.charAt(0).toUpperCase() + noun.slice(1)} · {formatSize(i.file.size)}</span>
              <button type="button" className="x" aria-label={`Remove ${i.file.name}`} onClick={() => remove(idx)}><Icon name="x" /></button>
            </div>
          ))}
        </div>
      )}
      <small role="alert" style={{ display: 'block', color: 'var(--bad)', fontWeight: 500, marginTop: 6 }}>{err}</small>
    </div>
  );
}
