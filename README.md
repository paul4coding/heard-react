# Heard — frontend (React + Vite)

Interface de gestion des plaintes étudiantes, connectée à l'API FastAPI (`complaints_backend`).

## Lancer
```bash
# 1. Backend (voir son README) : http://localhost:8000
# 2. Frontend
cp .env.example .env     # VITE_API_URL=http://localhost:8000
npm install
npm run dev              # http://localhost:5173
```

## Comptes de démo (backend seedé)
`student`, `coord`, `admin` — mot de passe `admin123`.

## Rôles
- **Student** : dépose une plainte, suit son statut, envoie des messages.
- **Coordinator** : traite les plaintes assignées (In progress, Resolved + résolution).
- **Administrator** : assigne, fixe la priorité, clôture/rouvre, statistiques.

Les comptes sont créés par un administrateur (pas d'inscription publique côté API).
