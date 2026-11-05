import { useEffect, useState } from 'react';
import { listCategories } from '../api.js';
import FilePicker from '../components/FilePicker.jsx';
import Icon from '../components/Icon.jsx';
import { MAX_FILES } from '../utils.js';

export function ComplaintSuccess({ complaint: c, onView, onAgain }) {
  return (
    <section className="panel success">
      <div className="ok"><Icon name="check" /></div>
      <h2>Complaint lodged</h2>
      {c.assignee
        ? <p>It was sent to <b>{c.assignee}</b>, who handles {c.cat}. We will update the status as it moves.</p>
        : <p>An administrator will review it shortly and send it to the right person. We will update the status as it moves.</p>}
      {c.uploadWarning && <p className="error" role="alert" style={{ margin: '16px 0 0' }}>{c.uploadWarning}</p>}
      {!c.uploadWarning && c.attachments.length > 0 && (
        <p style={{ marginTop: 8 }}>Your photo is attached.</p>
      )}
      <div className="refbox">{c.ref}</div>
      <div className="acts">
        <button className="btn primary" onClick={() => onView(c)}>View complaint</button>
        <button className="btn" onClick={onAgain}>Lodge another</button>
      </div>
    </section>
  );
}

export default function NewComplaint({ onSubmit }) {
  const [categories, setCategories] = useState(null);
  const [catErr, setCatErr] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories).catch((e) => setCatErr(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!category) return setErr('Choose the category that fits your complaint.');
    if (title.trim().length < 5) return setErr('The title needs at least 5 characters.');
    if (desc.trim().length < 10) return setErr('Describe what happened in at least 10 characters.');
    setBusy(true);
    setErr('');
    const error = await onSubmit({ title: title.trim(), description: desc.trim(), category_id: +category, files });
    if (error) {
      setErr(error);
      setBusy(false);
    }
  };

  return (
    <div className="formgrid">
      <form className="panel pad" noValidate onSubmit={submit}>
        <label className="field"><span className="l">Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!categories}>
            <option value="">{categories ? 'Choose a category' : catErr ? 'Categories unavailable' : 'Loading…'}</option>
            {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {category && <small>{categories.find((c) => c.id === +category)?.description}</small>}
          {catErr && <small className="field-err">{catErr}</small>}
        </label>
        <label className="field"><span className="l">Title</span>
          <input className="input" placeholder="e.g. Broken projector in Room B204" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field"><span className="l">What happened?</span>
          <textarea className="input" placeholder="Describe the problem, when it started and how it affects you." value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <div className="field"><span className="l">Photo <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(optional)</span></span>
          <FilePicker capacity={MAX_FILES} onChange={setFiles} disabled={busy} />
        </div>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary lg" type="submit" disabled={busy}>{busy ? (files.length ? 'Sending and uploading…' : 'Sending…') : 'Lodge complaint'}</button>
      </form>

      <aside className="panel pad">
        <h3>What happens next</h3>
        <ol className="steps">
          <li><span><b>It goes to the right coordinator</b>The category you choose decides who receives it. Other goes to an administrator.</span></li>
          <li><span><b>The coordinator works on it</b>You see the status move from Assigned to In progress.</span></li>
          <li><span><b>It is resolved, with pictures if needed</b>You will see what was done.</span></li>
          <li><span><b>You give your opinion</b>Tell us if you are satisfied. Then an administrator closes the complaint.</span></li>
        </ol>
      </aside>
    </div>
  );
}
