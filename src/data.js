// Cycle de vie défini par le backend : SUBMITTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
export const STATUSES = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const STAGES = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// Sprint 2 (story 10) : l'étudiant choisit une catégorie en déposant sa plainte ; elle est routée vers le coordinateur
// de la catégorie. La catégorie est donc affichée partout.
export const SHOW_CATEGORIES = true;

// Les niveaux de priorité sont la story 13 du plan (Sprint 4, Release 3) : ni dans les formulaires ni dans les listes avant.
// Au Sprint 4 : passer à true (colonne, détail, champ du formulaire de l'administrateur).
export const SHOW_PRIORITY = false;

// Rôles de l'interface (le backend envoie STUDENT / COORDINATOR / ADMIN)
export const ROLE_LABEL = { student: 'Student', coordinator: 'Coordinator', admin: 'Administrator' };

export const NAV = {
  student: [['overview', 'Overview', 'home'], ['mine', 'My complaints', 'list'], ['new', 'Lodge a complaint', 'plus']],
  admin: [['overview', 'Overview', 'chart'], ['all', 'All complaints', 'list'], ['categories', 'Categories', 'list'], ['reports', 'Reports', 'chart'], ['users', 'Users', 'users']],
  coordinator: [['overview', 'Overview', 'home'], ['queue', 'Assigned to me', 'list'], ['reports', 'Reports', 'chart']],
};

export const TITLES = {
  student: {
    overview: ['Overview', 'Track your complaints and lodge new ones.'],
    mine: ['My complaints', 'Everything you have lodged, newest first.'],
    new: ['Lodge a complaint', 'Choose a category and we will send it straight to the right person.'],
  },
  admin: {
    overview: ['Overview', 'See what needs a decision today.'],
    all: ['All complaints', 'Assign, resolve and update every complaint on campus.'],
    categories: ['Categories', 'Which coordinator handles which category.'],
    reports: ['Reports', 'Figures about every complaint, by status and by category.'],
    users: ['Users', 'Create, edit and deactivate student, coordinator and administrator accounts.'],
  },
  coordinator: {
    overview: ['Overview', 'Your queue and what needs an update.'],
    queue: ['Assigned to me', 'Complaints sent to you by category or by an administrator.'],
    reports: ['Reports', 'Figures about the complaints of your department.'],
  },
};
