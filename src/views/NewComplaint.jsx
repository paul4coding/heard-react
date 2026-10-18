import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { CATS, DEPTS } from '../data.js';

const MAX_FILES = 5;
const MAX_SIZE = 50 * 1024 * 1024;

export function ComplaintSuccess({ complaint: c, onView, onAgain }) {
  return (
    <section className="panel success">
      <div className="ok"><Icon name="check" /></div>
      <h2>Complaint lodged</h2>
      <p>{c.anon ? 'Your name is hidden from everyone. You can still follow it from your dashboard.' : 'An administrator will review it shortly. We will update the status as it moves.'}</p>
      <div className="refbox">{c.id}</div>
      <div className="acts">
        <button className="btn primary" onClick={() => onView(c.id)}>View complaint</button>
        <button className="btn" onClick={onAgain}>Lodge another</button>
      </div>
    </section>
  );
}

export default function NewComplaint({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const [dept, setDept] = useState(DEPTS[0]);
  const [loc, setLoc] = useState('');
  const [desc, setDesc] = useState('');
  const [anon, setAnon] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileErr, setFileErr] = useState('');
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const fileInput = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const addFiles = (list) => {
    let msg = '';
    const next = [...files];
    [...list].forEach((f) => {
      if (!/^(image|video)\//.test(f.type)) msg = `${f.name} is not an image or video. Choose a photo or a video file.`;
      else if (f.size > MAX_SIZE) msg = `${f.name} is over 50 MB. Choose a smaller file.`;
      else if (next.length >= MAX_FILES) msg = 'You can attach up to 5 files. Remove one to add another.';
      else next.push({ name: f.name, type: f.type, url: URL.createObjectURL(f) });
    });
    setFileErr(msg);
    setFiles(next);
  };

  const remove = (i) => {
    URL.revokeObjectURL(files[i].url);
    setFiles(files.filter((_, j) => j !== i));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      setErr('Add a title and describe what happened to continue.');
      return;
    }
    onSubmit({
      title: title.trim(), cat, dept, desc: desc.trim(), anon,
      media: files.map((f) => ({ t: f.type.startsWith('video') ? 'video' : 'image', n: f.name })),
    });
  };

  return (
    <div className="formgrid">
      <form className="panel pad" noValidate onSubmit={submit}>
        <label className="field"><span className="l">Title</span>
          <input className="input" placeholder="e.g. Broken projector in Room B204" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
          <legend style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: 6, padding: 0 }}>Category</legend>
          <div className="cats">
            {CATS.map((c) => (
              <label className="cat" key={c}>
                <input type="radio" name="n-cat" value={c} checked={cat === c} onChange={() => setCat(c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="row2">
          <label className="field"><span className="l">Department</span>
            <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
              {DEPTS.map((d) => <option key={d}>{d}</option>)}
            </select></label>
          <label className="field"><span className="l">Location <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></span>
            <input className="input" placeholder="Building and room" value={loc} onChange={(e) => setLoc(e.target.value)} /></label>
        </div>
        <label className="field"><span className="l">What happened?</span>
          <textarea className="input" placeholder="Describe the problem, when it started and how it affects you." value={desc} onChange={(e) => setDesc(e.target.value)} /></label>

        <div className="field">
          <span className="l">Photos or video <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></span>
          <div
            className={`drop${over ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
            onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
          >
            <div className="ic"><Icon name="upload" /></div>
            <b>Drag files here</b>
            <p>Images or video, up to 5 files and 50 MB each</p>
            <button type="button" className="btn" onClick={() => fileInput.current.click()}>Choose files</button>
            <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
          <div className="previews">
            {files.map((f, i) => {
              const vid = f.type.startsWith('video');
              return (
                <div className="pv" key={f.url}>
                  {vid ? <video src={f.url} muted preload="metadata" /> : <img src={f.url} alt={f.name} />}
                  <span className="tag">{vid ? 'Video' : 'Photo'}</span>
                  <button type="button" className="x" aria-label={`Remove ${f.name}`} onClick={() => remove(i)}><Icon name="x" /></button>
                </div>
              );
            })}
          </div>
          <small role="alert" style={{ color: 'var(--bad)', fontWeight: 500 }}>{fileErr}</small>
        </div>

        <label className="switch">
          <input type="checkbox" role="switch" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          <span className="tg" />
          <span><b>Submit anonymously</b><small>Your name stays hidden from administrators and department heads. You can still track this complaint from your own dashboard.</small></span>
        </label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary lg" type="submit">Lodge complaint</button>
      </form>

      <aside className="panel pad">
        <h3>What happens next</h3>
        <ol className="steps">
          <li><span><b>An administrator reviews it</b>Usually within one working day.</span></li>
          <li><span><b>It is assigned</b>To the right department head, or resolved by the administrator.</span></li>
          <li><span><b>You follow the progress</b>Every status change appears on your dashboard.</span></li>
          <li><span><b>You review the outcome</b>Rate the fix and tell us if something was missed.</span></li>
        </ol>
      </aside>
    </div>
  );
}
