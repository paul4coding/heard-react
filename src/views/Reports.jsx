import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Strip, SecHead } from '../components/Lists.jsx';
import { STAGES, STATUSES } from '../data.js';
import { downloadReportCsv, getReport } from '../api.js';

function Bars({ title, rows, total }) {
  const max = Math.max(...rows.map(([, n]) => n), 1);
  return (
    <div className="panel pad">
      <h3 style={{ marginBottom: 16 }}>{title}</h3>
      {rows.length === 0 && <p style={{ color: 'var(--ink-3)' }}>No complaints in this period.</p>}
      <div className="bars">
        {rows.map(([k, n]) => (
          <div className="bar" key={k}>
            <div className="t"><b>{k}</b><span>{n} of {total}</span></div>
            <div className="b"><i style={{ width: `${Math.round((n / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Rapport sur les plaintes (sprint 2, story 19) : l'administrateur voit tout, le coordinateur seulement son département.
export default function Reports({ role, onError }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [err, setErr] = useState('');

  const generate = useCallback(async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) return setErr('The start date must be before the end date.');
    setErr('');
    setBusy(true);
    try {
      setReport(await getReport(role, { dateFrom, dateTo }));
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }, [role, dateFrom, dateTo, onError]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const csv = async () => {
    setCsvBusy(true);
    try {
      await downloadReportCsv(role, { dateFrom, dateTo });
    } catch (e) {
      onError(e);
    } finally {
      setCsvBusy(false);
    }
  };

  const scopeLabel = !report ? '' : report.scope === 'all' ? 'All departments' : report.scope === 'none' ? 'No department assigned' : `Department: ${report.scope}`;

  return (
    <>
      <section className="panel pad report-form">
        <label className="field"><span className="l">From</span>
          <input className="input" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} /></label>
        <label className="field"><span className="l">To</span>
          <input className="input" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} /></label>
        <div className="report-actions">
          <button className="btn primary" disabled={busy} onClick={generate}>{busy ? 'Generating…' : 'Generate report'}</button>
          <button className="btn" disabled={csvBusy || !report} onClick={csv}><Icon name="upload" />{csvBusy ? 'Preparing…' : 'Download CSV'}</button>
          {(dateFrom || dateTo) && <button className="btn ghost" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear dates</button>}
        </div>
        {err && <p className="error" role="alert" style={{ margin: '12px 0 0' }}>{err}</p>}
      </section>

      {!report ? (
        <div className="panel empty"><b>Loading…</b></div>
      ) : (
        <>
          <SecHead title={scopeLabel} note={report.date_from || report.date_to ? `${report.date_from ?? 'start'} to ${report.date_to ?? 'today'}` : 'All dates'} />
          <Strip items={[
            [report.total, 'Complaints'],
            [report.by_status.RESOLVED + report.by_status.CLOSED, 'Resolved or closed'],
            [report.avg_resolution_hours != null ? `${report.avg_resolution_hours} h` : '—', 'Average resolution time'],
            [report.rejections_total, 'Rejections'],
          ]} />
          <div style={{ height: 16 }} />
          <Strip items={[
            [report.satisfied, 'Satisfied'],
            [report.not_satisfied, 'Not satisfied'],
            [report.awaiting_review, 'Waiting for student review'],
            [report.rejected_pending, 'Rejected, to reassign'],
          ]} />
          <div style={{ height: 16 }} />
          <div className="two">
            <Bars title="By status" total={report.total} rows={STATUSES.map((s, i) => [STAGES[i], report.by_status[s] ?? 0])} />
            <Bars title="By category" total={report.total} rows={Object.entries(report.by_category).sort((a, b) => b[1] - a[1])} />
          </div>
        </>
      )}
    </>
  );
}
