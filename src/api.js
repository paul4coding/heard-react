import { STATUSES, STAGES } from './data.js';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'heard_token';
const PREFIX = { STUDENT: '/api/student', COORDINATOR: '/api/coordinator', ADMIN: '/api/admin' };

export const roleKey = (r) => r.toLowerCase();

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function errorMessage(data, status) {
  const d = data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e) => e.msg?.replace(/^Value error, /, '')).filter(Boolean).join(' ');
  return `Request failed (${status})`;
}

async function request(path, { method = 'GET', json, form, withHeaders = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = new URLSearchParams(form);
  }
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorMessage(data, res.status), res.status);
  return withHeaders ? { data, headers: res.headers } : data;
}

/* ---------- Auth ---------- */
export async function login(username, password) {
  const t = await request('/auth/login', { method: 'POST', form: { username, password } });
  setToken(t.access_token);
  return me();
}

export async function me() {
  const u = await request('/auth/me');
  return toUser(u);
}

/* ---------- Normalisation ---------- */
const userName = (u) => (u ? `${u.first_name} ${u.last_name}`.trim() || u.username : null);

export const toUser = (u) => ({
  id: u.id,
  username: u.username,
  name: userName(u),
  role: roleKey(u.role),
  department: u.department?.name ?? null,
});

const utc = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const fmtDate = (s) => utc(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtWhen = (s) =>
  utc(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
  utc(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export function toComplaint(c) {
  const stage = STATUSES.indexOf(c.status);
  const history = (c.history || []).map((h) => ({
    t: utc(h.changed_at).getTime(),
    st: STAGES[STATUSES.indexOf(h.new_status)],
    when: fmtWhen(h.changed_at),
    note: h.old_status ? `Changed by ${userName(h.changed_by)}.` : 'Complaint received.',
  }));
  const comments = (c.comments || []).map((m) => ({
    t: utc(m.created_at).getTime(),
    st: m.is_resolution ? 'Resolution' : `Message from ${userName(m.author)}`,
    when: fmtWhen(m.created_at),
    note: m.message,
  }));
  return {
    id: c.id,
    ref: c.reference,
    title: c.title,
    desc: c.description,
    cat: c.category.name,
    stage,
    status: c.status,
    priority: c.priority,
    owner: userName(c.student),
    assignee: userName(c.assigned_to),
    assigneeId: c.assigned_to?.id ?? null,
    date: fmtDate(c.created_at),
    updated: fmtDate(c.updated_at),
    log: [...history, ...comments].sort((a, b) => a.t - b.t),
  };
}

/* ---------- Complaints ---------- */
export const PAGE_SIZE = 20;

// Liste paginée côté serveur : { items, total } (le total vient de l'en-tête X-Total-Count)
export async function listComplaints(role, { status, q, skip = 0, limit = PAGE_SIZE, unassigned } = {}) {
  const p = new URLSearchParams({ skip, limit });
  if (status) p.set('status', status);
  if (q) p.set('q', q);
  if (unassigned) p.set('unassigned', 'true');
  const { data, headers } = await request(`${PREFIX[role.toUpperCase()]}/complaints?${p}`, { withHeaders: true });
  return { items: data.map(toComplaint), total: Number(headers.get('X-Total-Count') ?? data.length) };
}

// Compteurs par statut (étudiant / coordinateur)
export const getMyStats = (role) => request(`${PREFIX[role.toUpperCase()]}/stats`);

export async function getComplaint(role, id) {
  return toComplaint(await request(`${PREFIX[role.toUpperCase()]}/complaints/${id}`));
}

export async function createComplaint(data) {
  return toComplaint(await request('/api/student/complaints', { method: 'POST', json: data }));
}

export async function addComment(role, id, message, isResolution = false) {
  return toComplaint(
    await request(`${PREFIX[role.toUpperCase()]}/complaints/${id}/comments`, {
      method: 'POST', json: { message, is_resolution: isResolution },
    })
  );
}

export async function setStatus(role, id, status) {
  return toComplaint(
    await request(`${PREFIX[role.toUpperCase()]}/complaints/${id}/status`, { method: 'PATCH', json: { status } })
  );
}

export const listCategories = () => request('/api/student/categories');

/* ---------- Admin ---------- */
export async function assign(id, assignedToId, priority) {
  return toComplaint(
    await request(`/api/admin/complaints/${id}/assign`, {
      method: 'PATCH', json: { assigned_to_id: assignedToId, priority: priority || null },
    })
  );
}

export async function setPriority(id, priority) {
  return toComplaint(await request(`/api/admin/complaints/${id}/priority`, { method: 'PATCH', json: { priority } }));
}

export const listCoordinators = () => request('/api/admin/users?role=COORDINATOR&limit=200');
export const getStats = () => request('/api/admin/stats');
