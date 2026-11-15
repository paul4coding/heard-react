import { useEffect, useMemo, useRef, useState } from 'react';
import FilePicker from './FilePicker.jsx';

export const METHOD_LABEL = { ALIPAY: 'Alipay', WECHAT: 'WeChat Pay', BANK: 'Bank transfer' };

// Icônes simples des moyens de paiement (dessinées ici, pas de logos officiels).
function MethodIcon({ method }) {
  if (method === 'ALIPAY') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#1677FF" />
        <text x="24" y="33" textAnchor="middle" fontSize="26" fontWeight="700" fill="#fff" fontFamily="'Segoe UI',system-ui,sans-serif">支</text></svg>
    );
  }
  if (method === 'WECHAT') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#07C160" />
        <ellipse cx="20" cy="21" rx="10" ry="8.4" fill="#fff" /><circle cx="16.5" cy="19" r="1.5" fill="#07C160" /><circle cx="23.5" cy="19" r="1.5" fill="#07C160" />
        <ellipse cx="30" cy="28" rx="8.6" ry="7" fill="#fff" stroke="#07C160" strokeWidth="1.6" /><circle cx="27" cy="26.6" r="1.2" fill="#07C160" /><circle cx="33" cy="26.6" r="1.2" fill="#07C160" /></svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#3340F5" />
      <path d="M24 10 9 18v3h30v-3L24 10Zm-11 14v10h4V24h-4Zm9 0v10h4V24h-4Zm9 0v10h4V24h-4ZM9 36v3h30v-3H9Z" fill="#fff" /></svg>
  );
}

// Faux QR code : une grille déterministe (le même numéro de facture donne le même dessin), avec les trois repères d'angle.
function FakeQr({ seed }) {
  const N = 25;
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    const inFinder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
    const out = [];
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) if (!inFinder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  const finder = (fx, fy) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width="7" height="7" fill="#12152B" /><rect x={fx + 1} y={fy + 1} width="5" height="5" fill="#fff" />
      <rect x={fx + 2} y={fy + 2} width="3" height="3" fill="#12152B" />
    </g>
  );
  return (
    <svg className="fake-qr" viewBox={`-2 -2 ${N + 4} ${N + 4}`} role="img" aria-label="Demo QR code" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#12152B" />)}
      {finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
    </svg>
  );
}

// Choix du moyen de paiement : Alipay / WeChat (faux code QR + « scan »), ou virement bancaire (reçu du virement obligatoire).
export default function PayPanel({ amount, invoice, reference, busy, err, onPay, onCancel }) {
  const [method, setMethod] = useState('');
  const [scan, setScan] = useState('idle'); // idle | scanning
  const [slip, setSlip] = useState([]);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const qr = method === 'ALIPAY' || method === 'WECHAT';
  const simulateScan = () => {
    setScan('scanning');
    timer.current = setTimeout(() => onPay(method, []), 1400);
  };
  const back = () => { clearTimeout(timer.current); setScan('idle'); setSlip([]); setMethod(''); };

  return (
    <div className="pay-panel">
      {!method && (
        <>
          <p><b>Choose how to pay {amount}</b></p>
          <div className="pay-methods">
            {['ALIPAY', 'WECHAT', 'BANK'].map((m) => (
              <button key={m} type="button" className="pay-method" onClick={() => setMethod(m)}>
                <MethodIcon method={m} /><span>{METHOD_LABEL[m]}</span>
              </button>
            ))}
          </div>
          <button className="btn" disabled={!!busy} onClick={onCancel}>Cancel</button>
        </>
      )}

      {qr && (
        <>
          <p><b>Pay {amount} with {METHOD_LABEL[method]}</b></p>
          <div className={`qr-box ${scan}`}>
            <FakeQr seed={`${invoice}-${method}`} />
            {scan === 'scanning' && <div className="qr-scan"><i /><span>Scanned, confirming the payment…</span></div>}
          </div>
          <p className="hint" style={{ textAlign: 'center' }}>Open {METHOD_LABEL[method]} on your phone and scan this code. Invoice {invoice} · {reference}.</p>
          {err && <p className="error" role="alert">{err}</p>}
          <div className="review-btns">
            <button className="btn primary" disabled={!!busy || scan === 'scanning'} onClick={simulateScan}>
              {scan === 'scanning' || busy ? 'Scanning…' : 'Simulate phone scan'}
            </button>
            <button className="btn" disabled={!!busy || scan === 'scanning'} onClick={back}>Other method</button>
          </div>
        </>
      )}

      {method === 'BANK' && (
        <>
          <p><b>Pay {amount} by bank transfer</b></p>
          <dl className="bank-box">
            <div><dt>Beneficiary</dt><dd>Heard University · Student affairs</dd></div>
            <div><dt>Account</dt><dd>XX00 0000 0000 0000</dd></div>
            <div><dt>Reference</dt><dd>{invoice}</dd></div>
            <div><dt>Amount</dt><dd>{amount}</dd></div>
          </dl>
          <div className="field"><span className="l">Receipt of your transfer <span style={{ color: 'var(--warn)' }}>(required)</span></span>
            <FilePicker capacity={1} noun="receipt" onChange={setSlip} disabled={!!busy} />
          </div>
          {err && <p className="error" role="alert">{err}</p>}
          <div className="review-btns">
            <button className="btn primary" disabled={!!busy || slip.length === 0} onClick={() => onPay('BANK', slip)}>
              {busy ? 'Validating…' : 'Confirm and pay'}
            </button>
            <button className="btn" disabled={!!busy} onClick={back}>Other method</button>
          </div>
          {slip.length === 0 && <p className="hint">Attach the receipt of your transfer to validate the payment.</p>}
        </>
      )}
    </div>
  );
}
