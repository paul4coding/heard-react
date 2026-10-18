export const initials = (n) =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const fromLabel = (c, role, studentName) => {
  if (c.anon) return role === 'student' && c.owner === 'me' ? 'You (anonymous)' : 'Anonymous';
  return c.owner === 'me' ? (role === 'student' ? 'You' : studentName) : c.owner;
};

export const nowStamp = () => 'Oct 14, ' + new Date().toTimeString().slice(0, 5);
