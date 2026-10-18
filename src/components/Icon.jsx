const PATHS = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>,
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M22 8l-6 4 6 4z" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <path d="M17.9 17.9A10 10 0 0 1 12 19C6 19 2 12 2 12a18 18 0 0 1 4.1-5M9.9 5.1A9 9 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22" />,
  star: <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.3c2.3.7 4 2.6 4 5.7" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  bubble: <path d="M5 6h14v9h-8l-4 3v-3H5z" />,
};

export default function Icon({ name }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
