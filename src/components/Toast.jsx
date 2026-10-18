import Icon from './Icon.jsx';

export default function Toast({ message }) {
  return (
    <div className={`toast${message ? ' show' : ''}`} role="status" aria-live="polite">
      <Icon name="check" />
      {message}
    </div>
  );
}
