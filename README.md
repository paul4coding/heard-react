# Heard — Student Complaint Management (frontend)

React + Vite single-page app for lodging and following student complaints. It talks to the FastAPI backend, [Joycodewad/complaints_backend](https://github.com/Joycodewad/complaints_backend) (JWT auth, role-based API, PostgreSQL).

**Heard** gives every complaint a clear status from the moment it is sent:
`Submitted → Assigned → In progress → Resolved → Closed`.

## Features
- **Public landing page** and sign-in with **email and password** (accounts are created by an administrator).
- **Student**: lodge a complaint (**category**, title, description and one optional photo). The category decides which coordinator receives it. Follow its progress, exchange messages, see the pictures of the resolution, and say **satisfied or not satisfied** when it is resolved (an administrator can close it only after that).
- **Coordinator**: work through complaints routed to their category (In progress, Resolved with a note and up to 5 pictures), **reject** a complaint wrongly assigned to them (with a reason; it goes back to the administrator), message the student, and see the **report** of their own department.
- **Administrator**: **user management** (create, edit, deactivate and reactivate student, coordinator and administrator accounts, reset passwords), dashboard with live statistics, see and reassign **rejected complaints**, assign complaints (a complaint assigned or reassigned by an administrator cannot be rejected), resolve with pictures, close (after the student's review, or after 3 days without a review) or reopen, comment, and generate **reports** (all departments, CSV export).
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
| Choose the category | ✅ | | |
| Reject a wrongly assigned complaint | | ✅ (only if routed by category) | |
| Assign / reassign | | | ✅ |
| Set In progress / Resolved (with pictures) | | ✅ | ✅ |
| Satisfied / not satisfied | ✅ (when resolved) | | |
| Close / reopen | | | ✅ (close needs the student's review, or 3 days after the resolution) |
| Reports | | their department | all |
| Comment | ✅ | ✅ | ✅ |

## Notes
- **Sprint 2**: categories are shown everywhere (`SHOW_CATEGORIES = true`). The 7 categories and their coordinators come from the backend (`python -m scripts.seed_categories`); an existing database first needs `python -m scripts.migrate_sprint2`.
- **Priority is hidden** until Sprint 4 (story 13: the administrator assigns priority levels). The switch is `SHOW_PRIORITY` in `src/data.js`; the API already supports it.
- The API has no public registration, anonymous complaints or ratings, so the UI does not offer them.
- Never commit `.env` files or secrets.
