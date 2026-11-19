import Icon from './Icon.jsx';

export default function Toast({ toast }) {
  return (
    <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
      <Icon name={toast?.error ? 'info' : 'check'} />
      <span>{toast?.message}</span>
    </div>
  );
}
