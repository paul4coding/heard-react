import { useState } from 'react';
import Icon from '../components/Icon.jsx';

export function ComplaintSuccess({ complaint: c, onView, onAgain }) {
  return (
    <section className="panel success">
      <div className="ok"><Icon name="check" /></div>
      <h2>Complaint lodged</h2>
      <p>An administrator will review it shortly. We will update the status as it moves.</p>
      <div className="refbox">{c.ref}</div>
      <div className="acts">
        <button className="btn primary" onClick={() => onView(c.id)}>View complaint</button>
        <button className="btn" onClick={onAgain}>Lodge another</button>
      </div>
    </section>
  );
}

export default function NewComplaint({ categories, onSubmit }) {
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState(categories[0]?.id ?? null);
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (title.trim().length < 5) return setErr('The title needs at least 5 characters.');
    if (desc.trim().length < 10) return setErr('Describe what happened in at least 10 characters.');
    if (!catId) return setErr('Choose a category.');
    setBusy(true);
    setErr('');
    const error = await onSubmit({ title: title.trim(), description: desc.trim(), category_id: catId });
    if (error) {
      setErr(error);
      setBusy(false);
    }
  };

  return (
    <div className="formgrid">
      <form className="panel pad" noValidate onSubmit={submit}>
        <label className="field"><span className="l">Title</span>
          <input className="input" placeholder="e.g. Broken projector in Room B204" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
          <legend style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: 6, padding: 0 }}>Category</legend>
          <div className="cats">
            {categories.map((c) => (
              <label className="cat" key={c.id} title={c.description}>
                <input type="radio" name="n-cat" value={c.id} checked={catId === c.id} onChange={() => setCatId(c.id)} />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field"><span className="l">What happened?</span>
          <textarea className="input" placeholder="Describe the problem, when it started and how it affects you." value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary lg" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Lodge complaint'}</button>
      </form>

      <aside className="panel pad">
        <h3>What happens next</h3>
        <ol className="steps">
          <li><span><b>An administrator reviews it</b>And assigns it to a coordinator.</span></li>
          <li><span><b>The coordinator works on it</b>You see the status move from Assigned to In progress.</span></li>
          <li><span><b>You follow the progress</b>Every change and message appears on your dashboard.</span></li>
          <li><span><b>It is resolved, then closed</b>You can message the team at any time before it is closed.</span></li>
        </ol>
      </aside>
    </div>
  );
}
