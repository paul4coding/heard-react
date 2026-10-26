// Cycle de vie défini par le backend : SUBMITTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
export const STATUSES = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const STAGES = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// La catégorisation des plaintes par l'administrateur est la story 6 du plan (Sprint 3, Release 2).
// Tant qu'elle n'est pas livrée, aucune catégorie n'est affichée, même si des anciennes plaintes en ont une.
// Au Sprint 3 : passer à true (colonne, détail, graphique) et ajouter l'action admin pour catégoriser.
export const SHOW_CATEGORIES = false;

// Les niveaux de priorité sont la story 13 du plan (Sprint 4, Release 3) : ni dans les formulaires ni dans les listes avant.
// Au Sprint 4 : passer à true (colonne, détail, champ du formulaire de l'administrateur).
export const SHOW_PRIORITY = false;

// Filtrer les plaintes par statut / catégorie est la story 14 du plan (Sprint 4, administrateur). La recherche n'est dans aucun sprint.
// Le Sprint 1 demande seulement les listes (étudiant : ses plaintes ; admin : toutes). La pagination, elle, reste active.
// Au Sprint 4 : passer à true (barre de recherche et filtres de statut des listes de plaintes).
export const SHOW_FILTERS = false;

// Rôles de l'interface (le backend envoie STUDENT / COORDINATOR / ADMIN)
export const ROLE_LABEL = { student: 'Student', coordinator: 'Coordinator', admin: 'Administrator' };

export const NAV = {
  student: [['overview', 'Overview', 'home'], ['mine', 'My complaints', 'list'], ['new', 'Lodge a complaint', 'plus']],
  admin: [['overview', 'Overview', 'chart'], ['all', 'All complaints', 'list'], ['users', 'Users', 'users']],
  coordinator: [['overview', 'Overview', 'home'], ['queue', 'Assigned to me', 'list']],
};

export const TITLES = {
  student: {
    overview: ['Overview', 'Track your complaints and lodge new ones.'],
    mine: ['My complaints', 'Everything you have lodged, newest first.'],
    new: ['Lodge a complaint', 'Tell us what is wrong and we will route it to the right person.'],
  },
  admin: {
    overview: ['Overview', 'See what needs a decision today.'],
    all: ['All complaints', 'Assign, resolve and update every complaint on campus.'],
    users: ['Users', 'Create, edit and deactivate student, coordinator and administrator accounts.'],
  },
  coordinator: {
    overview: ['Overview', 'Your queue and what needs an update.'],
    queue: ['Assigned to me', 'Complaints the administrators have sent to you.'],
  },
};
