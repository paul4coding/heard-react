// Cycle de vie défini par le backend : SUBMITTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
export const STATUSES = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const STAGES = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

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
