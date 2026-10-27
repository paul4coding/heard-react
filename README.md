# Heard — Student Complaint Management (frontend)

React + Vite single-page app for lodging and following student complaints. It talks to the FastAPI backend, [Joycodewad/complaints_backend](https://github.com/Joycodewad/complaints_backend) (JWT auth, role-based API, PostgreSQL).

**Heard** gives every complaint a clear status from the moment it is sent:
`Submitted → Assigned → In progress → Resolved → Closed`.

## Features
- **Public landing page** and sign-in with **email and password** (accounts are created by an administrator).
- **Student**: lodge a complaint (title, description and one optional photo; no category: the administrator will categorize complaints in Sprint 3), follow its progress, exchange messages, add or replace the photo while the complaint is open.
- **Coordinator**: work through assigned complaints (In progress, Resolved with a resolution note) and message the student.
- **Administrator**: **user management** (create, edit, deactivate and reactivate student, coordinator and administrator accounts, reset passwords), dashboard with live statistics, assign complaints to coordinators, set priority, close or reopen, comment.
- **Photo**: one optional image (PNG, JPEG, GIF or WebP, 10 MB) with drag and drop, preview, a full-screen viewer, and type/size checks before sending. Everyone who can open the complaint can view it.
- **Server-side pagination** (20 per page), search by title or reference, and status filters on every list.
- Exact counters from the API, silent refresh on navigation and after every change.
- Light and dark themes, responsive layout (mobile to desktop), keyboard-accessible forms and drawer.
- Clear error handling: validation messages, expired session, unreachable API.

## Tech stack
React 18 · Vite 5 · plain CSS (design tokens, dark mode) · `fetch` API client with JWT.

## Getting started
```bash
# 1. Start the backend (see its README) — http://localhost:8000
# 2. Start the frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm install
npm run dev                 # http://localhost:5173
npm run build               # production build in dist/
```

### Demo accounts
When the backend is seeded (`python -m scripts.seed`): `student@univ.edu`, `coord@univ.edu`, `admin@univ.edu`, all with password `admin123`.
Sign in with the email, for example `admin@univ.edu`.
**Change or delete them before deploying.**

## Configuration
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the backend API |

## Project structure
```
src/
├── api.js              # API client: auth, complaints, pagination, stats
├── data.js             # statuses, navigation and page titles per role
├── App.jsx             # session, routing between views, drawer actions
├── components/         # AuthPage, Landing, AppShell, Drawer, Pager, FilePicker, Attachments, Status, Logo…
└── views/              # Overviews (per role), ComplaintList, NewComplaint
```

## Roles at a glance
| | Student | Coordinator | Administrator |
|---|---|---|---|
| Lodge a complaint | ✅ | | |
| See | their own | assigned to them | all |
| Assign / set priority | | | ✅ |
| Set In progress / Resolved | | ✅ | ✅ |
| Close / reopen | | | ✅ |
| Comment | ✅ | ✅ | ✅ |

## Notes
- **Categories are hidden** until Sprint 3 (story 6: the administrator categorizes complaints), even for old complaints that have one. The switch is `SHOW_CATEGORIES` in `src/data.js` (set it to `true` and add the admin action in Sprint 3).
- **Priority is hidden** until Sprint 4 (story 13: the administrator assigns priority levels). The switch is `SHOW_PRIORITY` in `src/data.js`; the API already supports it.
- The API has no public registration, anonymous complaints or ratings, so the UI does not offer them.
- Never commit `.env` files or secrets.
