"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from "react";

type Language = "en" | "de";

interface Translations {
  // Navigation & Headers
  timeReporting: string;
  vacations: string;
  projects: string;
  settings: string;
  notifications: string;
  navigation: string;
  actions: string;
  goToAdmin: string;
  
  // Status labels
  draft: string;
  pending: string;
  approved: string;
  rejected: string;
  locked: string;
  
  // Calendar
  timereportingsStatus: string;
  weekend: string;
  officialHoliday: string;
  vacationAbsence: string;
  pendingUnsaved: string;
  total: string;
  
  // Actions
  submitTimesheet: string;
  save: string;
  saveHours: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  addProject: string;
  addSelected: string;
  close: string;
  reset: string;
  apply: string;
  
  // Buttons & Labels
  grantLeave: string;
  addHoliday: string;
  addEmployee: string;
  saveChanges: string;
  
  // Messages
  loadingCalendar: string;
  noProjects: string;
  selectProjects: string;
  
  // Form labels
  hours: string;
  note: string;
  date: string;
  from: string;
  to: string;
  type: string;
  status: string;
  name: string;
  email: string;
  role: string;
  
  // Vacations / Absences
  absences: string;
  holidays: string;
  leaveBalance: string;
  usedDays: string;
  remainingDays: string;
  totalDays: string;
  requestedDays: string;
  filters: string;
  
  // Reports
  customerReport: string;
  customerReportAdv: string;
  monthlyReport: string;
  
  // Misc
  employee: string;
  company: string;
  project: string;
  signOut: string;
  admin: string;
  developer: string;
  
  // Admin sidebar
  timesheets: string;
  companies: string;
  employees: string;
  viewLeaves: string;
  officialHolidays: string;
  
  // Work Hours Modal
  logWorkHours: string;
  recordTime: string;
  hoursWorked: string;
  description: string;
  optional: string;
  hoursValidation: string;
  hoursHint: string;
  whatDidYouWorkOn: string;
  saving: string;
  
  // Vacations Page
  vacation: string;
  sick: string;
  personal: string;
  parental: string;
  myLeaveBalance: string;
  leaveHistory: string;
  noLeavesFound: string;
  days: string;
  day: string;
  currentYear: string;
  lastYear: string;
  availableDays: string;
  sortBy: string;
  startDate: string;
  endDate: string;
  loading: string;
  
  // Projects
  availableProjects: string;
  searchProjects: string;
  noProjectsFound: string;
  
  // Admin
  leaveManagement: string;
  assignTimeOff: string;
  selectEmployee: string;
  leaveType: string;
  selectLeaveType: string;
  dateRange: string;
  businessDays: string;
  addAbsence: string;
  createAbsence: string;
  employeeSummary: string;
  currentYearBalance: string;
  carryOver: string;
  allEmployees: string;
  noEmployeesFound: string;
  selectDate: string;
  added: string;
  
  // Settings
  profileSettings: string;
  manageAccount: string;
  accountInfo: string;
  fullName: string;
  enterName: string;
  enterEmail: string;
  password: string;
  changePassword: string;
  quickLinks: string;
  manageEmployees: string;
  manageLeaveDays: string;
  users: string;
  
  // Raport (Timesheets)
  reviewSubmissions: string;
  totalEmployees: string;
  pendingReview: string;
  totalHours: string;
  loadingTimesheets: string;
  details: string;
  action: string;

  // Companies
  companyManagement: string;
  companiesDescription: string;
  activeCompanies: string;
  newCompany: string;
  addCompany: string;
  
  // Projects
  projectManagement: string;
  organizeCompanies: string;
  loadingProjects: string;
  companyName: string;
  projectName: string;
  
  // Users
  employeeManagement: string;
  manageTeam: string;
  loadingEmployees: string;
  admins: string;
  developers: string;
  
  // Vacations (Official Holidays)
  managePublicHolidays: string;
  totalHolidaysLabel: string;
  upcoming: string;
  past: string;
  nextHoliday: string;
  loadingHolidays: string;
  holiday: string;
  
  // ModifyAbsences
  absenceRecords: string;
  viewManageAbsences: string;
  loadingAbsences: string;
  noAbsencesFound: string;
  adjustFilters: string;
  records: string;
  absence: string;
  
  // Notifications
  allCaughtUp: string;
  unread: string;
  noNotifications: string;
  youreAllCaughtUp: string;
  deleteRead: string;
  
  // Login Page
  welcomeBack: string;
  signInToContinue: string;
  emailAddress: string;
  signIn: string;
  signingIn: string;
  passwordRequirements: string;
  timeBookingSystem: string;
  allRightsReserved: string;
  
  // User Management
  newEmployee: string;
  addTeamMember: string;
  fillRequiredFields: string;
  adding: string;
  passwordValidation: string;
  chooseRole: string;
  leaveBlankToKeep: string;
  weakPassword: string;
  
  // Holiday Management
  addNewHoliday: string;
  createHolidayEntry: string;
  holidayName: string;
  noHolidaysFound: string;
  addHolidayToStart: string;
  
  // Project Management
  newProject: string;
  addToCompany: string;
  viewOptions: string;
  confirmDelete: string;
  confirmSubmitTimesheet: string;
  submitTimesheetWarning: string;
  submitTimesheetWarningDetail: string;
  projectUpdated: string;
  projectDeleted: string;
  
  // Raport (Timesheet) Entry
  hrs: string;
  view: string;
  
  // Vacation Popover
  vacationsLeft: string;
  year: string;
  left: string;
  spent: string;
  
  // Error messages
  somethingWentWrong: string;
  noValidRole: string;
  passwordNotSecure: string;
  
  // Pending Work Prompt
  pendingHours: string;
  unsavedWorkHoursMessage: string;
  discard: string;
  keep: string;
  allWorkHoursSaved: string;
  
  // Notification actions
  reviewInRaports: string;
  viewAbsences: string;
  
  // Toast messages
  projectsSavedSuccessfully: string;
  failedToSaveProjects: string;
  timesheetSubmitted: string;
  failedToSubmitTimesheet: string;
  
  // Form placeholders
  selectAnOption: string;
  leavePeriod: string;
  
  // Grant Leave Tab
  daysAvailable: string;
  remaining: string;
  carriedOver: string;
  selectEmployeeToViewBalance: string;
  requestSummary: string;
  duration: string;
  businessDay: string;
  period: string;
  pleaseFillAllFields: string;
  selectedEmployeeNotFound: string;
  failedToCreateAbsence: string;
  absenceCreatedSuccessfully: string;
  errorCreatingAbsence: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Headers
    timeReporting: "Time Reporting",
    vacations: "Vacations",
    projects: "Projects",
    settings: "Settings",
    notifications: "Notifications",
    navigation: "Navigation",
    actions: "Actions",
    goToAdmin: "Go to Admin",
    
    // Status labels
    draft: "Draft",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    locked: "Locked",
    
    // Calendar
    timereportingsStatus: "Timereportings status",
    weekend: "Weekend",
    officialHoliday: "Official Holiday",
    vacationAbsence: "Vacation / Absence",
    pendingUnsaved: "Pending (unsaved)",
    total: "Total",
    
    // Actions
    submitTimesheet: "Submit timesheet",
    save: "Save",
    saveHours: "Save Hours",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    addProject: "Add Project",
    addSelected: "Add Selected",
    close: "Close",
    reset: "Reset",
    apply: "Apply",
    
    // Buttons & Labels
    grantLeave: "Grant Leave",
    addHoliday: "Add Holiday",
    addEmployee: "Add Employee",
    saveChanges: "Save Changes",
    
    // Messages
    loadingCalendar: "Loading calendar...",
    noProjects: "No projects available",
    selectProjects: "Select projects to add",
    
    // Form labels
    hours: "Hours",
    note: "Note",
    date: "Date",
    from: "From",
    to: "To",
    type: "Type",
    status: "Status",
    name: "Name",
    email: "Email",
    role: "Role",
    
    // Vacations / Absences
    absences: "Absences",
    holidays: "Holidays",
    leaveBalance: "Leave Balance",
    usedDays: "Used Days",
    remainingDays: "Remaining Days",
    totalDays: "Total Days",
    requestedDays: "Requested Days",
    filters: "Filters",
    
    // Reports
    customerReport: "Customer Report",
    customerReportAdv: "Customer Report ADV",
    monthlyReport: "Monthly Report",
    
    // Misc
    employee: "Employee",
    company: "Company",
    project: "Project",
    signOut: "Sign Out",
    admin: "Admin",
    developer: "Developer",
    
    // Admin sidebar
    timesheets: "Timesheets",
    companies: "Companies",
    employees: "Employees",
    viewLeaves: "View Leaves",
    officialHolidays: "Official Holidays",
    
    // Work Hours Modal
    logWorkHours: "Log Work Hours",
    recordTime: "Record your time for this project",
    hoursWorked: "Hours Worked",
    description: "Description",
    optional: "optional",
    hoursValidation: "Only non-negative fractions of 0.25 are allowed",
    hoursHint: "Use increments of 0.25 (e.g., 1, 1.25, 1.5, 1.75)",
    whatDidYouWorkOn: "What did you work on?",
    saving: "Saving...",
    
    // Vacations Page
    vacation: "Vacation",
    sick: "Sick",
    personal: "Personal",
    parental: "Parental",
    myLeaveBalance: "My Leave Balance",
    leaveHistory: "Leave History",
    noLeavesFound: "No leaves found",
    days: "days",
    day: "day",
    currentYear: "Current Year",
    lastYear: "Last Year",
    availableDays: "Available Days",
    sortBy: "Sort by",
    startDate: "Start Date",
    endDate: "End Date",
    loading: "Loading...",
    
    // Projects
    availableProjects: "Available Projects",
    searchProjects: "Search projects...",
    noProjectsFound: "No projects found",
    
    // Admin
    leaveManagement: "Leave Management",
    assignTimeOff: "Assign time-off to team members",
    selectEmployee: "Select Employee",
    leaveType: "Leave Type",
    selectLeaveType: "Select leave type",
    dateRange: "Date Range",
    businessDays: "Business Days",
    addAbsence: "Add Absence",
    createAbsence: "Create Absence",
    employeeSummary: "Employee Summary",
    currentYearBalance: "Current Year Balance",
    carryOver: "Carry Over",
    allEmployees: "All Employees",
    noEmployeesFound: "No employees found",
    selectDate: "Select date",
    added: "Added",
    
    // Settings
    profileSettings: "Profile Settings",
    manageAccount: "Manage your account information",
    accountInfo: "Account Information",
    fullName: "Full Name",
    enterName: "Enter name",
    enterEmail: "Enter email",
    password: "Password",
    changePassword: "Change password (leave empty to keep current)",
    quickLinks: "Quick Links",
    manageEmployees: "Manage employees",
    manageLeaveDays: "Manage leave days",
    users: "Users",
    
    // Raport (Timesheets)
    reviewSubmissions: "Review and manage employee submissions",
    totalEmployees: "Total Employees",
    pendingReview: "Pending Review",
    totalHours: "Total Hours",
    loadingTimesheets: "Loading timesheets...",
    details: "Details",
    action: "Action",

    // Companies
    companyManagement: "Company Management",
    companiesDescription: "Manage all companies in your organizations",
    activeCompanies: "Active Companies",
    newCompany: "New Company",
    addCompany: "Add Company",
    
    // Projects
    projectManagement: "Project Management",
    organizeCompanies: "Organize companies and their projects",
    loadingProjects: "Loading projects...",
    companyName: "Company Name",
    projectName: "Project Name",
    
    // Users
    employeeManagement: "Employee Management",
    manageTeam: "Manage team members and their roles",
    loadingEmployees: "Loading employees...",
    admins: "Admins",
    developers: "Developers",
    
    // Vacations (Official Holidays)
    managePublicHolidays: "Manage public holidays and days off",
    totalHolidaysLabel: "Total Holidays",
    upcoming: "Upcoming",
    past: "Past",
    nextHoliday: "Next Holiday",
    loadingHolidays: "Loading holidays...",
    holiday: "Holiday",
    
    // ModifyAbsences
    absenceRecords: "Absence Records",
    viewManageAbsences: "View and manage employee absences",
    loadingAbsences: "Loading absences...",
    noAbsencesFound: "No absences found",
    adjustFilters: "Try adjusting your filters",
    records: "records",
    absence: "absence",
    
    // Notifications
    allCaughtUp: "All caught up",
    unread: "unread",
    noNotifications: "No notifications",
    youreAllCaughtUp: "You're all caught up!",
    deleteRead: "Delete Read",
    
    // Login Page
    welcomeBack: "Welcome back",
    signInToContinue: "Sign in to continue to your dashboard",
    emailAddress: "Email Address",
    signIn: "Sign In",
    signingIn: "Signing in...",
    passwordRequirements: "Password must contain at least 8 characters, one uppercase letter A-Z, one number, and one special symbol (! @ # $ % ^ & * ( ) . _ - + =).",
    timeBookingSystem: "Time Booking System",
    allRightsReserved: "All rights reserved.",
    
    // User Management
    newEmployee: "New Employee",
    addTeamMember: "Add a team member",
    fillRequiredFields: "Fill in the required fields to create a new user and set a secure password.",
    adding: "Adding...",
    passwordValidation: "Min 8 chars, 1 uppercase, 1 number, 1 symbol",
    chooseRole: "Choose Role",
    leaveBlankToKeep: "Leave blank to keep",
    weakPassword: "Weak password",
    
    // Holiday Management
    addNewHoliday: "Add New Holiday",
    createHolidayEntry: "Create an official holiday entry",
    holidayName: "Holiday Name",
    noHolidaysFound: "No holidays found",
    addHolidayToStart: "Add a new holiday to get started",
    
    // Project Management
    newProject: "New Project",
    addToCompany: "Add a project to a company",
    viewOptions: "View Options",
    confirmDelete: "Are you sure you want to delete this project?",
    confirmSubmitTimesheet: "Are you sure you want to submit this timesheet?",
    submitTimesheetWarning: "Warning: You will not be able to modify working hours for this month after submission.",
    submitTimesheetWarningDetail: "If you need to make changes, please contact an administrator.",
    projectUpdated: "Project updated successfully.",
    projectDeleted: "Project deleted successfully.",
    
    // Raport (Timesheet) Entry
    hrs: "hrs",
    view: "View",
    
    // Vacation Popover
    vacationsLeft: "Vacations Left",
    year: "Year",
    left: "Left (days)",
    spent: "Spent",
    
    // Error messages
    somethingWentWrong: "Oops! Something went wrong. Please try again!",
    noValidRole: "No valid role assigned to this user.",
    passwordNotSecure: "Password is not secure. Check requirements.",
    
    // Pending Work Prompt
    pendingHours: "Pending Hours",
    unsavedWorkHoursMessage: "You have unsaved work hours. Do you want to keep them for now or discard them?",
    discard: "Discard",
    keep: "Keep",
    allWorkHoursSaved: "All work hours have been saved!",
    
    // Notification actions
    reviewInRaports: "Review in Raports",
    viewAbsences: "View Absences",
    
    // Toast messages
    projectsSavedSuccessfully: "Projects saved successfully",
    failedToSaveProjects: "Failed to save projects",
    timesheetSubmitted: "Timesheet submitted successfully!",
    failedToSubmitTimesheet: "Failed to submit timesheet",
    
    // Form placeholders
    selectAnOption: "Select an option",
    leavePeriod: "Leave Period",
    
    // Grant Leave Tab
    daysAvailable: "days available",
    remaining: "remaining",
    carriedOver: "carried over",
    selectEmployeeToViewBalance: "Select an employee to view their leave balance",
    requestSummary: "Request Summary",
    duration: "Duration",
    businessDay: "business day",
    period: "Period",
    pleaseFillAllFields: "Please fill in all fields",
    selectedEmployeeNotFound: "Selected employee not found",
    failedToCreateAbsence: "Failed to create absence",
    absenceCreatedSuccessfully: "Absence created successfully!",
    errorCreatingAbsence: "Error creating absence",
  },
  de: {
    // Navigation & Headers
    timeReporting: "Zeiterfassung",
    vacations: "Urlaub",
    projects: "Projekte",
    settings: "Einstellungen",
    notifications: "Benachrichtigungen",
    navigation: "Navigation",
    actions: "Aktionen",
    goToAdmin: "Zur Administration",
    
    // Status labels
    draft: "Entwurf",
    pending: "Ausstehend",
    approved: "Genehmigt",
    rejected: "Abgelehnt",
    locked: "Gesperrt",
    
    // Calendar
    timereportingsStatus: "Zeiterfassungsstatus",
    weekend: "Wochenende",
    officialHoliday: "Feiertag",
    vacationAbsence: "Urlaub / Abwesenheit",
    pendingUnsaved: "Ausstehend (ungespeichert)",
    total: "Gesamt",
    
    // Actions
    submitTimesheet: "Zeiterfassung einreichen",
    save: "Speichern",
    saveHours: "Stunden speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    addProject: "Projekt hinzufügen",
    addSelected: "Ausgewählte hinzufügen",
    close: "Schließen",
    reset: "Zurücksetzen",
    apply: "Anwenden",
    
    // Buttons & Labels
    grantLeave: "Urlaub gewähren",
    addHoliday: "Feiertag hinzufügen",
    addEmployee: "Mitarbeiter hinzufügen",
    saveChanges: "Änderungen speichern",
    
    // Messages
    loadingCalendar: "Kalender wird geladen...",
    noProjects: "Keine Projekte verfügbar",
    selectProjects: "Projekte zum Hinzufügen auswählen",
    
    // Form labels
    hours: "Stunden",
    note: "Notiz",
    date: "Datum",
    from: "Von",
    to: "Bis",
    type: "Typ",
    status: "Status",
    name: "Name",
    email: "E-Mail",
    role: "Rolle",
    
    // Vacations / Absences
    absences: "Abwesenheiten",
    holidays: "Feiertage",
    leaveBalance: "Urlaubskonto",
    usedDays: "Genutzte Tage",
    remainingDays: "Verbleibende Tage",
    totalDays: "Gesamttage",
    requestedDays: "Beantragte Tage",
    filters: "Filter",
    
    // Reports
    customerReport: "Kundenbericht",
    customerReportAdv: "Kundenbericht ADV",
    monthlyReport: "Monatsbericht",
    
    // Misc
    employee: "Mitarbeiter",
    company: "Unternehmen",
    project: "Projekt",
    signOut: "Abmelden",
    admin: "Admin",
    developer: "Entwickler",
    
    // Admin sidebar
    timesheets: "Zeitnachweise",
    companies: "Unternehmen",
    employees: "Mitarbeiter",
    viewLeaves: "Urlaub anzeigen",
    officialHolidays: "Feiertage",
    
    // Work Hours Modal
    logWorkHours: "Arbeitszeit erfassen",
    recordTime: "Erfassen Sie Ihre Zeit für dieses Projekt",
    hoursWorked: "Gearbeitete Stunden",
    description: "Beschreibung",
    optional: "optional",
    hoursValidation: "Nur nicht-negative Vielfache von 0,25 erlaubt",
    hoursHint: "Verwenden Sie Schritte von 0,25 (z.B. 1, 1,25, 1,5, 1,75)",
    whatDidYouWorkOn: "Woran haben Sie gearbeitet?",
    saving: "Speichern...",
    
    // Vacations Page
    vacation: "Urlaub",
    sick: "Krank",
    personal: "Persönlich",
    parental: "Elternzeit",
    myLeaveBalance: "Mein Urlaubskonto",
    leaveHistory: "Urlaubshistorie",
    noLeavesFound: "Keine Abwesenheiten gefunden",
    days: "Tage",
    day: "Tag",
    currentYear: "Aktuelles Jahr",
    lastYear: "Letztes Jahr",
    availableDays: "Verfügbare Tage",
    sortBy: "Sortieren nach",
    startDate: "Startdatum",
    endDate: "Enddatum",
    loading: "Laden...",
    
    // Companies
    companyManagement: "Unternehmensverwaltung",
    companiesDescription: "Alle Unternehmen in Ihrer Organisation verwalten",
    activeCompanies: "Aktive Unternehmen",
    newCompany: "Neues Unternehmen",
    addCompany: "Unternehmen hinzufügen",
    
    // Projects
    availableProjects: "Verfügbare Projekte",
    searchProjects: "Projekte suchen...",
    noProjectsFound: "Keine Projekte gefunden",
    
    // Admin
    leaveManagement: "Urlaubsverwaltung",
    assignTimeOff: "Freizeit an Teammitglieder zuweisen",
    selectEmployee: "Mitarbeiter auswählen",
    leaveType: "Abwesenheitsart",
    selectLeaveType: "Abwesenheitsart auswählen",
    dateRange: "Zeitraum",
    businessDays: "Arbeitstage",
    addAbsence: "Abwesenheit hinzufügen",
    createAbsence: "Abwesenheit erstellen",
    employeeSummary: "Mitarbeiterübersicht",
    currentYearBalance: "Aktuelles Jahr Saldo",
    carryOver: "Übertrag",
    allEmployees: "Alle Mitarbeiter",
    noEmployeesFound: "Keine Mitarbeiter gefunden",
    selectDate: "Datum auswählen",
    added: "Hinzugefügt",
    
    // Settings
    profileSettings: "Profileinstellungen",
    manageAccount: "Kontoinformationen verwalten",
    accountInfo: "Kontoinformationen",
    fullName: "Vollständiger Name",
    enterName: "Name eingeben",
    enterEmail: "E-Mail eingeben",
    password: "Passwort",
    changePassword: "Passwort ändern (leer lassen, um aktuelles zu behalten)",
    quickLinks: "Schnellzugriff",
    manageEmployees: "Mitarbeiter verwalten",
    manageLeaveDays: "Urlaubstage verwalten",
    users: "Benutzer",
    
    // Raport (Timesheets)
    reviewSubmissions: "Mitarbeitereinreichungen überprüfen und verwalten",
    totalEmployees: "Gesamt Mitarbeiter",
    pendingReview: "Ausstehende Überprüfung",
    totalHours: "Gesamtstunden",
    loadingTimesheets: "Zeitnachweise werden geladen...",
    details: "Details",
    action: "Aktion",
    
    // Projects
    projectManagement: "Projektverwaltung",
    organizeCompanies: "Unternehmen und ihre Projekte organisieren",
    loadingProjects: "Projekte werden geladen...",
    companyName: "Firmenname",
    projectName: "Projektname",
    
    // Users
    employeeManagement: "Mitarbeiterverwaltung",
    manageTeam: "Teammitglieder und ihre Rollen verwalten",
    loadingEmployees: "Mitarbeiter werden geladen...",
    admins: "Administratoren",
    developers: "Entwickler",
    
    // Vacations (Official Holidays)
    managePublicHolidays: "Feiertage und freie Tage verwalten",
    totalHolidaysLabel: "Feiertage gesamt",
    upcoming: "Bevorstehend",
    past: "Vergangen",
    nextHoliday: "Nächster Feiertag",
    loadingHolidays: "Feiertage werden geladen...",
    holiday: "Feiertag",
    
    // ModifyAbsences
    absenceRecords: "Abwesenheitseinträge",
    viewManageAbsences: "Mitarbeiterabwesenheiten anzeigen und verwalten",
    loadingAbsences: "Abwesenheiten werden geladen...",
    noAbsencesFound: "Keine Abwesenheiten gefunden",
    adjustFilters: "Versuchen Sie, Ihre Filter anzupassen",
    records: "Einträge",
    absence: "Abwesenheit",
    
    // Notifications
    allCaughtUp: "Alles erledigt",
    unread: "ungelesen",
    noNotifications: "Keine Benachrichtigungen",
    youreAllCaughtUp: "Alles erledigt!",
    deleteRead: "Gelesene löschen",
    
    // Login Page
    welcomeBack: "Willkommen zurück",
    signInToContinue: "Melden Sie sich an, um zu Ihrem Dashboard zu gelangen",
    emailAddress: "E-Mail-Adresse",
    signIn: "Anmelden",
    signingIn: "Anmelden...",
    passwordRequirements: "Das Passwort muss mindestens 8 Zeichen, einen Großbuchstaben A-Z, eine Zahl und ein Sonderzeichen (! @ # $ % ^ & * ( ) . _ - + =) enthalten.",
    timeBookingSystem: "Zeiterfassungssystem",
    allRightsReserved: "Alle Rechte vorbehalten.",
    
    // User Management
    newEmployee: "Neuer Mitarbeiter",
    addTeamMember: "Teammitglied hinzufügen",
    fillRequiredFields: "Füllen Sie die erforderlichen Felder aus, um einen neuen Benutzer zu erstellen und ein sicheres Passwort festzulegen.",
    adding: "Hinzufügen...",
    passwordValidation: "Mind. 8 Zeichen, 1 Großbuchstabe, 1 Zahl, 1 Symbol",
    chooseRole: "Rolle auswählen",
    leaveBlankToKeep: "Leer lassen, um beizubehalten",
    weakPassword: "Schwaches Passwort",
    
    // Holiday Management
    addNewHoliday: "Neuen Feiertag hinzufügen",
    createHolidayEntry: "Einen offiziellen Feiertagseintrag erstellen",
    holidayName: "Feiertagsname",
    noHolidaysFound: "Keine Feiertage gefunden",
    addHolidayToStart: "Fügen Sie einen neuen Feiertag hinzu",
    
    // Project Management
    newProject: "Neues Projekt",
    addToCompany: "Projekt zu einem Unternehmen hinzufügen",
    viewOptions: "Optionen anzeigen",
    confirmDelete: "Möchten Sie dieses Projekt wirklich löschen?",
    confirmSubmitTimesheet: "Sind Sie sicher, dass Sie diese Zeiterfassung einreichen möchten?",
    submitTimesheetWarning: "Warnung: Sie können die Arbeitsstunden für diesen Monat nach der Einreichung nicht mehr ändern.",
    submitTimesheetWarningDetail: "Wenn Sie Änderungen vornehmen müssen, wenden Sie sich bitte an einen Administrator.",
    projectUpdated: "Projekt erfolgreich aktualisiert.",
    projectDeleted: "Projekt erfolgreich gelöscht.",
    
    // Raport (Timesheet) Entry
    hrs: "Std",
    view: "Ansehen",
    
    // Vacation Popover
    vacationsLeft: "Verbleibender Urlaub",
    year: "Jahr",
    left: "Übrig (Tage)",
    spent: "Verbraucht",
    
    // Error messages
    somethingWentWrong: "Ups! Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut!",
    noValidRole: "Diesem Benutzer ist keine gültige Rolle zugewiesen.",
    passwordNotSecure: "Passwort ist nicht sicher. Überprüfen Sie die Anforderungen.",
    
    // Pending Work Prompt
    pendingHours: "Ausstehende Stunden",
    unsavedWorkHoursMessage: "Sie haben ungespeicherte Arbeitsstunden. Möchten Sie diese vorerst behalten oder verwerfen?",
    discard: "Verwerfen",
    keep: "Behalten",
    allWorkHoursSaved: "Alle Arbeitsstunden wurden gespeichert!",
    
    // Notification actions
    reviewInRaports: "In Berichten anzeigen",
    viewAbsences: "Abwesenheiten anzeigen",
    
    // Toast messages
    projectsSavedSuccessfully: "Projekte erfolgreich gespeichert",
    failedToSaveProjects: "Projekte konnten nicht gespeichert werden",
    timesheetSubmitted: "Zeiterfassung erfolgreich eingereicht!",
    failedToSubmitTimesheet: "Zeiterfassung konnte nicht eingereicht werden",
    
    // Form placeholders
    selectAnOption: "Option auswählen",
    leavePeriod: "Abwesenheitszeitraum",
    
    // Grant Leave Tab
    daysAvailable: "Tage verfügbar",
    remaining: "verbleibend",
    carriedOver: "übertragen",
    selectEmployeeToViewBalance: "Wählen Sie einen Mitarbeiter aus, um dessen Urlaubskonto anzuzeigen",
    requestSummary: "Anfrageübersicht",
    duration: "Dauer",
    businessDay: "Arbeitstag",
    period: "Zeitraum",
    pleaseFillAllFields: "Bitte füllen Sie alle Felder aus",
    selectedEmployeeNotFound: "Ausgewählter Mitarbeiter nicht gefunden",
    failedToCreateAbsence: "Abwesenheit konnte nicht erstellt werden",
    absenceCreatedSuccessfully: "Abwesenheit erfolgreich erstellt!",
    errorCreatingAbsence: "Fehler beim Erstellen der Abwesenheit",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load saved language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "de")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const newLang = prev === "en" ? "de" : "en";
      localStorage.setItem("language", newLang);
      return newLang;
    });
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

