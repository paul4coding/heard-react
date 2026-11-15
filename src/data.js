// Cycle de vie défini par le backend : SUBMITTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
export const STATUSES = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const STAGES = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// Sprint 2 (story 10) : l'étudiant choisit une catégorie en déposant sa plainte ; elle est routée vers le coordinateur
// de la catégorie. La catégorie est donc affichée partout.
export const SHOW_CATEGORIES = true;

// Story 13 : niveau de sévérité (badge). L'administrateur le règle d'un clic dans la liste ; le coordinateur le voit,
// et ses plaintes ouvertes les plus urgentes arrivent en tête.
export const SHOW_PRIORITY = true;

// Rôles de l'interface (le backend envoie STUDENT / COORDINATOR / ADMIN)
export const ROLE_LABEL = { student: 'Student', coordinator: 'Coordinator', admin: 'Administrator' };

export const NAV = {
  student: [['overview', 'Overview', 'home'], ['mine', 'My complaints', 'list'], ['new', 'Lodge a complaint', 'plus'], ['responsibility', 'Investigations', 'shield']],
  admin: [['overview', 'Overview', 'chart'], ['all', 'All complaints', 'list'], ['categories', 'Categories', 'list'], ['reports', 'Reports', 'chart'], ['invoices', 'Invoices', 'shield'], ['emails', 'Emails', 'mail'], ['users', 'Users', 'users']],
  coordinator: [['overview', 'Overview', 'home'], ['queue', 'Assigned to me', 'list'], ['reports', 'Reports', 'chart']],
};

export const TITLES = {
  student: {
    overview: ['Overview', 'Track your complaints and lodge new ones.'],
    mine: ['My complaints', 'Everything you have lodged, newest first.'],
    new: ['Lodge a complaint', 'Choose a category and we will send it straight to the right person.'],
    responsibility: ['Investigations', 'Files where you are named. Read the evidence and answer.'],
  },
  admin: {
    overview: ['Overview', 'See what needs a decision today.'],
    all: ['All complaints', 'Assign, resolve and update every complaint on campus.'],
    categories: ['Categories', 'Which coordinator handles which category.'],
    reports: ['Reports', 'Figures about every complaint, by status and by category.'],
    invoices: ['Invoices', 'Validate the invoices proposed by coordinators and close the cases that are paid.'],
    emails: ['Emails', 'Messages the app wrote to students (no real sending in this version).'],
    users: ['Users', 'Create, edit and deactivate student, coordinator and administrator accounts.'],
  },
  coordinator: {
    overview: ['Overview', 'Your queue and what needs an update.'],
    queue: ['Assigned to me', 'Complaints sent to you by category or by an administrator.'],
    reports: ['Reports', 'Figures about the complaints of your department.'],
  },
};

// Enquête et responsabilité : libellés et tons (couleurs) des états
export const CASE_STATE = {
  INVESTIGATING: ['Investigating', 'info'],
  AWAITING_RESPONSE: ['Waiting for the student', 'warn'],
  ACKNOWLEDGED: ['Acknowledged', 'brand'],
  CONTESTED: ['Contested', 'bad'],
  NO_RESPONSE: ['No answer', 'bad'],
  INVOICE_REVIEW: ['Invoice to validate', 'warn'],
  PAYMENT_DUE: ['Payment due', 'warn'],
  PAID: ['Paid, to close', 'ok'],
  CLOSED: ['Closed', 'mute'],
};
export const DESIGNATION_STATUS = {
  PENDING: ['Waiting for an answer', 'warn'],
  ACKNOWLEDGED: ['Acknowledged', 'brand'],
  CONTESTED: ['Contested', 'bad'],
  NO_RESPONSE: ['No answer', 'bad'],
  CLEARED: ['Put out of cause', 'mute'],
};
export const OUTCOME = {
  NO_FAULT: 'No fault (natural cause)',
  NOT_ESTABLISHED: 'Nobody could be identified',
  ABUSIVE: 'Complaint without ground',
  RECOGNIZED: 'Facts acknowledged by the student',
  PAID: 'Paid by the student',
};
export const EVENT_LABEL = {
  OPENED: 'Investigation opened', FINDINGS: 'Findings updated', DESIGNATED: 'Student designated',
  ACKNOWLEDGED: 'Student acknowledged', CONTESTED: 'Student contested', INVOICE_PROPOSED: 'Invoice proposed',
  INVOICE_VALIDATED: 'Invoice validated', INVOICE_REJECTED: 'Invoice sent back', PAID: 'Paid', CLEARED: 'Put out of cause', REMINDER: 'Reminder sent',
  NO_RESPONSE: 'No answer', CLOSED: 'Investigation closed',
};
