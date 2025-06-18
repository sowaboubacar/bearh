/* eslint-disable @typescript-eslint/no-explicit-any */
export type PermissionCondition =
  | string
  | { any: PermissionCondition[] } // OR condition
  | { all: PermissionCondition[] }; // AND condition

export interface PermissionContext {
  /* User ID of the user who is trying to perform the action */
  targetUserId?: string;
  /* User ID of the user who is the owner of the resource */
  resourceOwnerId?: string;
  /* Type of the resource */
  resourceType?: string;
  /* ID of the resource */
  resourceId?: string;
  /* Extra context data */
  [key: string]: any;
}

export enum UserActions {
  // Own scope
  ViewOwn = "user:view-own", // Can view own profile
  EditOwn = "user:edit-own", // Can edit own profile
  DeleteOwn = "user:delete-own", // Can delete own profile

  // Action on user profile
  ViewOwnOnProfileAttendanceInsight = "user:view-own-on-profile-attendance-insight", // Can view own attendance insight on profile
  ViewOwnOnProfileKpiInsight = "user:view-own-on-profile-kpi-insight", // Can view own KPI insight on profile
  ViewOwnOnProfileTaskInsight = "user:view-own-on-profile-task-insight", // Can view own task insight on profile
  ViewOwnOnProfileDocumentInsight = "user:view-own-on-profile-document-insight", // Can view own document insight on profile
  ViewOwnOnProfileVideoInsight = "user:view-own-on-profile-video-insight", // Can view own video insight on profile
  ViewOwnOnProfileExpenseInsight = "user:view-own-on-profile-expense-insight", // Can view own expense insight on profile
  ViewOwnOnProfilePositionsInsight = "user:view-own-on-profile-positions-insight", // Can view own positions insight on profile
  ViewOwnOnProfileDepartmentsInsight = "user:view-own-on-profile-departments-insight", // Can view own departments insight on profile
  ViewOwnOnProfileTeamsInsight = "user:view-own-on-profile-teams-insight", // Can view own teams insight on profile
  ViewOwnOnProfileHourGroupsInsight = "user:view-own-on-profile-hour-groups-insight", // Can view own hour groups insight on profile
  ViewOwnOnProfilePrimeInsight = "user:view-own-on-profile-prime-insight", // Can view own prime insight on profile
  ViewOwnOnProfileObservationInsight = "user:view-own-on-profile-observation--insight", // Can view own observation on profile
  ViewOwnOnProfilePerformenaceInsight = "user:view-own-on-profile-performenace-insight", // Can view own performance on profile
  ViewOwnOneProfileMonthlyReportInsight = "user:view-own-one-profile-monthly-report-insight", // Can view own monthly report on profile
  ViewOneOwnProfileNotesInsight = "user:view-one-own-profile-notes-insight", // Can view own notes on profile
  OnOwnProfileUseEditIntent = "user:on-own-profile-use-edit-intent", // Can use edit intent on own profile (click on edit button)

  // Global Scope 
  List = "user:list",
  Create = "user:create",
  Edit = "user:edit",
  Delete = "user:delete",
  View = "user:view",
  // Action user can do on listing page
  QuickMakeObservation = "user:quick-make-observation",
  QuickMakeKpiEvaluation = "user:quick-make-kpi-evaluation",
  QuickAssignTask = "user:quick-assign-task",
  QuickChangeAccess = "user:quick-change-access",
  QuickChangePosition = "user:quick-change-position",
  QuickChangeTeam = "user:quick-change-team",
  QuickChangeDepartment = "user:quick-change-department",
  QuickChangeHourGroup = "user:quick-change-hour-group",
  QuickChangeBonusCategory = "user:quick-change-bonus-category", 
  Search = "user:search",
  QuickFilterOnRole = "user:quick-filter-on-role",
  // Extra Global Scope
  Export = "user:export",
  Archive = "user:archive",

  // Global Scope Action on user profile (related to same action above)
  ViewOnProfileAttendanceInsight = "user:view-on-profile-attendance-insight",
  ViewOnProfileKpiInsight = "user:view-on-profile-kpi-insight",
  ViewOnProfileTaskInsight = "user:view-on-profile-task-insight",
  ViewOnProfileDocumentInsight = "user:view-on-profile-document-insight",
  ViewOnProfileVideoInsight = "user:view-on-profile-video-insight",
  ViewOnProfileExpenseInsight = "user:view-on-profile-expense-insight",
  ViewOnProfilePositionsInsight = "user:view-on-profile-positions-insight",
  ViewOnProfileDepartmentsInsight = "user:view-on-profile-departments-insight",
  ViewOnProfileTeamsInsight = "user:view-on-profile-teams-insight",
  ViewOnProfileHourGroupsInsight = "user:view-on-profile-hour-groups-insight",
  ViewOnProfilePrimeInsight = "user:view-on-profile-prime-insight",
  ViewOnProfileObservationInsight = "user:view-on-profile-observation--insight",
  ViewOnProfilePerformenaceInsight = "user:view-on-profile-performenace-insight",
  ViewOneProfileMonthlyReportInsight = "user:view-one-profile-monthly-report-insight",
  ViewOneProfileNotesInsight = "user:view-one-profile-notes-insight",
  UseEditIntent = "user:use-edit-intent",
  ViewUserStatus = "user:view-user-status", // On any page (listing, profile, etc) user can view the status of the user (active, inactive, etc)
}

export enum PointageActions {
  // Own Scope
  // Nothing for now

  // Global Scope
  DoSharedAuthLoginOnPublicCheckRoute = "pointage-do-shared-auth-login-on-public-check-route", // Can use his own PIN to auth the /check public route and allow other user to check in/out
  CheckIn = "pointage:check-in", // Can check in
  CheckOut = "pointage:check-out", // Can check out
  CheckBreakStart = "pointage:check-break-start", // Can start a break
  CheckBreakEnd = "pointage:check-break-end", // Can end a break
  ViewAttendanceGlobalUpdateMetric = "pointage:view-attendance-global-update-metric", // Can view attendance global update metric on /o/attendance/history
  ViewAttendanceGlobalUpdateHistory = "pointage:view-attendance-global-update-history", // Can view attendance global update history
  FilterAttendanceGlobalUpdateHistory = "pointage:filter-attendance-global-update-history", // Can filter attendance global update history

  ExportAttendanceInsight = "pointage:export-attendance-insight", // Can export attendance insight
}

export enum AccessActions {
  List = "access:list",
  Create = "access:create",
  Edit = "access:edit",
  Delete = "access:delete",
  View = "access:view",

  Search = "access:search",
  Export = "access:export",
  Archive = "access:archive",
}

export enum CandidateActions {
  List = "candidate:list",
  Create = "candidate:create",
  Edit = "candidate:edit",
  Delete = "candidate:delete",
  View = "candidate:view",

  Search = "candidate:search",
  Export = "candidate:export",
  Archive = "candidate:archive",
}

export enum ObservationActions {
  // Own Scope
  ViewOwn = "observation:view-own",
  EditOwn = "observation:edit-own",
  DeleteOwn = "observation:delete-own",
  ListOwn = "observation:list-own",

  // Global Scope
  List = "observation:list",
  Create = "observation:create",
  Edit = "observation:edit",
  View = "observation:view",
  Search = "observation:search",
  Delete = "observation:delete",
  Export = "observation:export",
  Archive = "observation:archive", 
}

export enum DepartmentActions {
  List = "department:list",
  Create = "department:create",
  Edit = "department:edit",
  Delete = "department:delete",
  View = "department:view",

  Search = "department:search",
  Export = "department:export",
  Archive = "department:archive",
}

export enum TeamActions {
  List = "team:list",
  Create = "team:create",
  Edit = "team:edit",
  Delete = "team:delete",
  View = "team:view",

  Search = "team:search",
  Export = "team:export",
  Archive = "team:archive",
}

export enum KpiFormActions {
  List = "kpiForm:list",
  Create = "kpiForm:create",
  Edit = "kpiForm:edit",
  Delete = "kpiForm:delete",
  View = "kpiForm:view",

  Search = "kpiForm:search",
  Export = "kpiForm:export",
  Archive = "kpiForm:archive",
}

export enum KpiValueActions {
  // Own
  ListOwn = "kpiValue:list-own",
  EditOwn = "kpiValue:edit-own",
  ViewOwn = "kpiValue:view-own",

  List = "kpiValue:list",
  View = "kpiValue:view",
  Search = "kpiValue:search",

  // Other KpiValue action are already handled on UserActions

  Export = "kpiValue:export",
  Archive = "kpiValue:archive",
}

export enum NewsActions {
  List = "news:list",
  Create = "news:create",
  Edit = "news:edit",
  View = "news:view",
  Search = "news:search",
  Publish = "news:publish",
  Filter = "news:filter",
  Delete = "news:delete",
  Export = "news:export",
  Archive = "news:archive",
}

export enum NoteActions {
  // Own Scope
  ViewOwn = "note:view-own",
  EditOwn = "note:edit-own",
  DeleteOwn = "note:delete-own",
  ListOwn = "note:list-own",

  // Global Scope
  List = "note:list",
  Create = "note:create",
  Edit = "note:edit",
  View = "note:view",
  Delete = "note:delete",
  Search = "note:search",
  Export = "note:export",
  Archive = "note:archive",
}

export enum PatrimoineActions {
  List = "patrimoine:list",
  Create = "patrimoine:create",
  Edit = "patrimoine:edit",
  View = "patrimoine:view",
  Search = "patrimoine:search",
  Delete = "patrimoine:delete",
  Export = "patrimoine:export",
  Archive = "patrimoine:archive",
}

export enum PatrimoineTypeActions {
  List = "patrimoineType:list",
  Create = "patrimoineType:create",
  Edit = "patrimoineType:edit",
  View = "patrimoineType:view",
  Search = "patrimoineType:search",
  Delete = "patrimoineType:delete",
  Export = "patrimoineType:export",
  Archive = "patrimoineType:archive",
}

export enum HallOfFameActions {
  CastVote = "hallOfFame:cast-vote",
}

export enum BonusCategoryActions {
  List = "bonusCategory:list",
  Create = "bonusCategory:create",
  Edit = "bonusCategory:edit",
  View = "bonusCategory:view",
  Search = "bonusCategory:search",
  Delete = "bonusCategory:delete",
  Export = "bonusCategory:export",
  Archive = "bonusCategory:archive",
}

export enum PrimeActions {
  ListOwn = "prime:list-own",
  List = "prime:list",
}

export enum PermissionsActions {
  // Own Scope
  ListOwn = "permissions:list-own",
  DeleteOwn = "permissions:delete-own",
  EditOwn = "permissions:edit-own",
  ViewOwn = "permissions:view-own",

  // Global Scope
  List = "permissions:list",
  Create = "permissions:create",
  Edit = "permissions:edit",
  View = "permissions:view",
  Treat = "permissions:treat", // Can treat a permission request (accept, reject, etc)
  Search = "permissions:search",
  Delete = "permissions:delete",
  Export = "permissions:export",
  Archive = "permissions:archive",
}

export enum PositionActions {
  // Own Scope
  ViewOwn = "position:view-own", // If this set to true and user don't have View permission, he can view his own position but not others

  // Global Scope
  List = "position:list",
  Create = "position:create",
  Edit = "position:edit",
  View = "position:view",
  Search = "position:search",
  Delete = "position:delete",
  Export = "position:export",
  Archive = "position:archive",
}

export enum TaskActions {
  // Own Scope
  ListOwn = "task:list-own",
  ViewOwn = "task:view-own",
  EditOwn = "task:edit-own",
  DeleteOwn = "task:delete-own",
  ToggleDoneOwn = "task:toggle-done-own",

  // Global Scope
  // Note that assigning task is not included here, it's a separate permission (in user actions)
  List = "task:list",
  Create = "task:create",
  Edit = "task:edit",
  View = "task:view",
  Search = "task:search",
  Delete = "task:delete",
  Export = "task:export",
  Archive = "task:archive",
}

export enum SystemConfigActions {
  View = "systemConfig:view",
  Edit = "systemConfig:edit",
  Reset = "systemConfig:reset",
}

export enum HourGroupActions {
  // Own Scope
  ViewOwn = "hourGroup:view-own",

  // Global Scope
  List = "hourGroup:list",
  Create = "hourGroup:create",
  Edit = "hourGroup:edit",
  Delete = "hourGroup:delete",
  View = "hourGroup:view",
  Search = "hourGroup:search",
  Export = "hourGroup:export",
  Archive = "hourGroup:archive",
}

export enum GuardTourActions {
  List = "guardTour:list",
  Create = "guardTour:create",
  Edit = "guardTour:edit",
  Search = "guardTour:search",
  View = "guardTour:view",
  Delete = "guardTour:delete",
  Export = "guardTour:export",
  Archive = "guardTour:archive",
}

export enum ExpenseReportActions {
  // Own Scope
  ViewOwn = "expenseReport:view-own",
  EditOwn = "expenseReport:edit-own",
  DeleteOwn = "expenseReport:delete-own",
  ListOwn = "expenseReport:list-own",

  // Global Scope
  Treat = "expenseReport:treat", // Can treat an expense report (accept, reject, etc)
  List = "expenseReport:list",
  Create = "expenseReport:create",
  Edit = "expenseReport:edit",
  View = "expenseReport:view",
  Search = "expenseReport:search",
  Delete = "expenseReport:delete",
  Export = "expenseReport:export",
  Archive = "expenseReport:archive",
}

export enum EnterpriseVideoActions {
  List = "enterpriseVideo:list",
  Create = "enterpriseVideo:create",
  View = "enterpriseVideo:view",
  Search = "enterpriseVideo:search",
  Edit = "enterpriseVideo:edit",
  Delete = "enterpriseVideo:delete",
  Export = "enterpriseVideo:export",
  Archive = "enterpriseVideo:archive",
}

export enum CollaboratorVideoActions {
  // Own Scope
  ViewOwn = "collaboratorVideo:view-own",
  EditOwn = "collaboratorVideo:edit-own",
  DeleteOwn = "collaboratorVideo:delete-own",
  ListOwn = "collaboratorVideo:list-own",

  // Global Scope
  List = "collaboratorVideo:list",
  Create = "collaboratorVideo:create",
  Edit = "collaboratorVideo:edit",
  View = "collaboratorVideo:view",
  Search = "collaboratorVideo:search",
  Delete = "collaboratorVideo:delete",
  Export = "collaboratorVideo:export",
  Archive = "collaboratorVideo:archive",
}

export enum DocumentActions {
  // Own Scope
  ViewOwn = "document:view-own",
  EditOwn = "document:edit-own",
  DeleteOwn = "document:delete-own",
  ListOwn = "document:list-own",

  // Global Scope
  List = "document:list",
  Upload = "document:upload", // Be able to upload a document directly on the media manager /o/media-manager
  InFormUpload = "document:in-form-upload", // Be able to upload when the media manager is in a form
  Edit = "document:edit",
  Delete = "document:delete",
  View = "document:view",
  Search = "document:search",
  Export = "document:export",
  Archive = "document:archive",
}

export enum AuthActions {
  LoginWithPIN = "auth:login-with-pin",
  LoginWithPassword = "auth:login-with-password", // To login, user must have at least one of the login permission
  ChangePassword = "auth:change-password",
  ChangePIN = "auth:change-pin",
  ResetPassword = "auth:reset-password",
  ResetPIN = "auth:reset-pin",
}

export interface AccessPermission {
  user: UserActions[];
  pointage: PointageActions[];
  access: AccessActions[];
  candidate: CandidateActions[];
  department: DepartmentActions[];
  team: TeamActions[];
  kpiForm: KpiFormActions[];
  kpiValue: KpiValueActions[];
  news: NewsActions[];
  note: NoteActions[];
  patrimoine: PatrimoineActions[];
  permissions: PermissionsActions[];
  position: PositionActions[];
  task: TaskActions[];
  systemConfig: SystemConfigActions[];
  hourGroup: HourGroupActions[];
  guardTour: GuardTourActions[];
  expenseReport: ExpenseReportActions[];
  enterpriseVideo: EnterpriseVideoActions[];
  collaboratorVideo: CollaboratorVideoActions[];
  document: DocumentActions[];
  auth: AuthActions[];
}

// Definitions of permissions hierarchy

export const permissionHierarchy: { [key: string]: string[] } = {
  // UserActions
  [UserActions.Create]: [UserActions.View],
  [UserActions.Edit]: [UserActions.View],
  [UserActions.Delete]: [UserActions.View],
  [UserActions.Export]: [UserActions.List],
  [UserActions.Archive]: [UserActions.Delete],
  [UserActions.List]: [UserActions.Search],
  [UserActions.View]: [
    UserActions.ViewOwn,
    UserActions.ViewUserStatus,
    // Insights sur le profil
    UserActions.ViewOnProfileAttendanceInsight,
    UserActions.ViewOnProfileKpiInsight,
    UserActions.ViewOnProfileTaskInsight,
    UserActions.ViewOnProfileDocumentInsight,
    UserActions.ViewOnProfileVideoInsight,
    UserActions.ViewOnProfileExpenseInsight,
    UserActions.ViewOnProfilePositionsInsight,
    UserActions.ViewOnProfileDepartmentsInsight,
    UserActions.ViewOnProfileTeamsInsight,
    UserActions.ViewOnProfileHourGroupsInsight,
    UserActions.ViewOnProfilePrimeInsight,
    UserActions.ViewOnProfileObservationInsight,
    UserActions.ViewOnProfilePerformenaceInsight,
    UserActions.ViewOneProfileMonthlyReportInsight,
    UserActions.ViewOneProfileNotesInsight,
  ],
  [UserActions.EditOwn]: [UserActions.ViewOwn],
  [UserActions.DeleteOwn]: [UserActions.ViewOwn],
  [UserActions.UseEditIntent]: [UserActions.Edit],
  [UserActions.OnOwnProfileUseEditIntent]: [UserActions.EditOwn],

  // PointageActions
  [PointageActions.CheckIn]: [],
  [PointageActions.CheckOut]: [],
  [PointageActions.CheckBreakStart]: [],
  [PointageActions.CheckBreakEnd]: [],
  [PointageActions.ViewAttendanceGlobalUpdateHistory]: [
    PointageActions.ViewAttendanceGlobalUpdateMetric,
  ],
  [PointageActions.FilterAttendanceGlobalUpdateHistory]: [
    PointageActions.ViewAttendanceGlobalUpdateHistory,
  ],
  [PointageActions.ExportAttendanceInsight]: [],

  // AccessActions
  [AccessActions.Create]: [AccessActions.View],
  [AccessActions.Edit]: [AccessActions.View],
  [AccessActions.Delete]: [AccessActions.View],
  [AccessActions.Export]: [AccessActions.List],
  [AccessActions.Archive]: [AccessActions.Delete],
  [AccessActions.List]: [AccessActions.Search],
  [AccessActions.View]: [],

  // CandidateActions
  [CandidateActions.Create]: [CandidateActions.View],
  [CandidateActions.Edit]: [CandidateActions.View],
  [CandidateActions.Delete]: [CandidateActions.View],
  [CandidateActions.Export]: [CandidateActions.List],
  [CandidateActions.Archive]: [CandidateActions.Delete],
  [CandidateActions.List]: [CandidateActions.Search],
  [CandidateActions.View]: [],

  // ObservationActions
  [ObservationActions.Create]: [ObservationActions.View],
  [ObservationActions.Edit]: [ObservationActions.View],
  [ObservationActions.Delete]: [ObservationActions.View],
  [ObservationActions.Export]: [ObservationActions.List],
  [ObservationActions.Archive]: [ObservationActions.Delete],
  [ObservationActions.List]: [ObservationActions.Search],
  [ObservationActions.View]: [ObservationActions.ViewOwn],
  [ObservationActions.EditOwn]: [ObservationActions.ViewOwn],
  [ObservationActions.DeleteOwn]: [ObservationActions.ViewOwn],
  [ObservationActions.ListOwn]: [],

  // DepartmentActions
  [DepartmentActions.Create]: [DepartmentActions.View],
  [DepartmentActions.Edit]: [DepartmentActions.View],
  [DepartmentActions.Delete]: [DepartmentActions.View],
  [DepartmentActions.Export]: [DepartmentActions.List],
  [DepartmentActions.Archive]: [DepartmentActions.Delete],
  [DepartmentActions.List]: [DepartmentActions.Search],
  [DepartmentActions.View]: [],

  // TeamActions
  [TeamActions.Create]: [TeamActions.View],
  [TeamActions.Edit]: [TeamActions.View],
  [TeamActions.Delete]: [TeamActions.View],
  [TeamActions.Export]: [TeamActions.List],
  [TeamActions.Archive]: [TeamActions.Delete],
  [TeamActions.List]: [TeamActions.Search],
  [TeamActions.View]: [],

  // KpiFormActions
  [KpiFormActions.Create]: [KpiFormActions.View],
  [KpiFormActions.Edit]: [KpiFormActions.View],
  [KpiFormActions.Delete]: [KpiFormActions.View],
  [KpiFormActions.Export]: [KpiFormActions.List],
  [KpiFormActions.Archive]: [KpiFormActions.Delete],
  [KpiFormActions.List]: [KpiFormActions.Search],
  [KpiFormActions.View]: [],

  // KpiValueActions
  [KpiValueActions.Export]: [KpiValueActions.List],
  [KpiValueActions.Archive]: [],
  [KpiValueActions.List]: [KpiValueActions.Search],
  [KpiValueActions.View]: [],

  // NewsActions
  [NewsActions.Create]: [NewsActions.View],
  [NewsActions.Edit]: [NewsActions.View],
  [NewsActions.Delete]: [NewsActions.View],
  [NewsActions.Publish]: [NewsActions.Edit],
  [NewsActions.Export]: [NewsActions.List],
  [NewsActions.Archive]: [NewsActions.Delete],
  [NewsActions.List]: [NewsActions.Search],
  [NewsActions.View]: [],

  // NoteActions
  [NoteActions.Create]: [NoteActions.View],
  [NoteActions.Edit]: [NoteActions.View],
  [NoteActions.Delete]: [NoteActions.View],
  [NoteActions.Export]: [NoteActions.List],
  [NoteActions.Archive]: [NoteActions.Delete],
  [NoteActions.List]: [NoteActions.Search],
  [NoteActions.View]: [NoteActions.ViewOwn],
  [NoteActions.EditOwn]: [NoteActions.ViewOwn],
  [NoteActions.DeleteOwn]: [NoteActions.ViewOwn],
  [NoteActions.ListOwn]: [],

  // PatrimoineActions
  [PatrimoineActions.Create]: [PatrimoineActions.View],
  [PatrimoineActions.Edit]: [PatrimoineActions.View],
  [PatrimoineActions.Delete]: [PatrimoineActions.View],
  [PatrimoineActions.Export]: [PatrimoineActions.List],
  [PatrimoineActions.Archive]: [PatrimoineActions.Delete],
  [PatrimoineActions.List]: [PatrimoineActions.Search],
  [PatrimoineActions.View]: [],

  // PermissionsActions
  [PermissionsActions.Create]: [PermissionsActions.View],
  [PermissionsActions.Edit]: [PermissionsActions.View],
  [PermissionsActions.Delete]: [PermissionsActions.View],
  [PermissionsActions.Treat]: [PermissionsActions.View],
  [PermissionsActions.Export]: [PermissionsActions.List],
  [PermissionsActions.Archive]: [PermissionsActions.Delete],
  [PermissionsActions.List]: [PermissionsActions.Search],
  [PermissionsActions.View]: [PermissionsActions.ViewOwn],
  [PermissionsActions.EditOwn]: [PermissionsActions.ViewOwn],
  [PermissionsActions.DeleteOwn]: [PermissionsActions.ViewOwn],
  [PermissionsActions.ListOwn]: [],

  // PositionActions
  [PositionActions.Create]: [PositionActions.View],
  [PositionActions.Edit]: [PositionActions.View],
  [PositionActions.Delete]: [PositionActions.View],
  [PositionActions.Export]: [PositionActions.List],
  [PositionActions.Archive]: [PositionActions.Delete],
  [PositionActions.List]: [PositionActions.Search],
  [PositionActions.View]: [PositionActions.ViewOwn],

  // TaskActions
  [TaskActions.Create]: [TaskActions.View],
  [TaskActions.Edit]: [TaskActions.View],
  [TaskActions.Delete]: [TaskActions.View],
  [TaskActions.Export]: [TaskActions.List],
  [TaskActions.Archive]: [TaskActions.Delete],
  [TaskActions.List]: [TaskActions.Search],
  [TaskActions.View]: [TaskActions.ViewOwn],
  [TaskActions.EditOwn]: [TaskActions.ViewOwn],
  [TaskActions.DeleteOwn]: [TaskActions.ViewOwn],
  [TaskActions.ToggleDoneOwn]: [TaskActions.ViewOwn],
  [TaskActions.ListOwn]: [],

  // SystemConfigActions
  [SystemConfigActions.Edit]: [SystemConfigActions.View],
  [SystemConfigActions.Reset]: [SystemConfigActions.Edit],
  [SystemConfigActions.View]: [],

  // HourGroupActions
  [HourGroupActions.Create]: [HourGroupActions.View],
  [HourGroupActions.Edit]: [HourGroupActions.View],
  [HourGroupActions.Delete]: [HourGroupActions.View],
  [HourGroupActions.Export]: [HourGroupActions.List],
  [HourGroupActions.Archive]: [HourGroupActions.Delete],
  [HourGroupActions.List]: [HourGroupActions.Search],
  [HourGroupActions.View]: [HourGroupActions.ViewOwn],

  // GuardTourActions
  [GuardTourActions.Create]: [GuardTourActions.View],
  [GuardTourActions.Edit]: [GuardTourActions.View],
  [GuardTourActions.Delete]: [GuardTourActions.View],
  [GuardTourActions.Export]: [GuardTourActions.List],
  [GuardTourActions.Archive]: [GuardTourActions.Delete],
  [GuardTourActions.List]: [GuardTourActions.Search],
  [GuardTourActions.View]: [],

  // ExpenseReportActions
  [ExpenseReportActions.Create]: [ExpenseReportActions.View],
  [ExpenseReportActions.Edit]: [ExpenseReportActions.View],
  [ExpenseReportActions.Delete]: [ExpenseReportActions.View],
  [ExpenseReportActions.Treat]: [ExpenseReportActions.View],
  [ExpenseReportActions.Export]: [ExpenseReportActions.List],
  [ExpenseReportActions.Archive]: [ExpenseReportActions.Delete],
  [ExpenseReportActions.List]: [ExpenseReportActions.Search],
  [ExpenseReportActions.View]: [ExpenseReportActions.ViewOwn],
  [ExpenseReportActions.EditOwn]: [ExpenseReportActions.ViewOwn],
  [ExpenseReportActions.DeleteOwn]: [ExpenseReportActions.ViewOwn],
  [ExpenseReportActions.ListOwn]: [],

  // EnterpriseVideoActions
  [EnterpriseVideoActions.Create]: [EnterpriseVideoActions.View],
  [EnterpriseVideoActions.Edit]: [EnterpriseVideoActions.View],
  [EnterpriseVideoActions.Delete]: [EnterpriseVideoActions.View],
  [EnterpriseVideoActions.Export]: [EnterpriseVideoActions.List],
  [EnterpriseVideoActions.Archive]: [EnterpriseVideoActions.Delete],
  [EnterpriseVideoActions.List]: [EnterpriseVideoActions.Search],
  [EnterpriseVideoActions.View]: [],

  // CollaboratorVideoActions
  [CollaboratorVideoActions.Create]: [CollaboratorVideoActions.View],
  [CollaboratorVideoActions.Edit]: [CollaboratorVideoActions.View],
  [CollaboratorVideoActions.Delete]: [CollaboratorVideoActions.View],
  [CollaboratorVideoActions.Export]: [CollaboratorVideoActions.List],
  [CollaboratorVideoActions.Archive]: [CollaboratorVideoActions.Delete],
  [CollaboratorVideoActions.List]: [CollaboratorVideoActions.Search],
  [CollaboratorVideoActions.View]: [CollaboratorVideoActions.ViewOwn],
  [CollaboratorVideoActions.EditOwn]: [CollaboratorVideoActions.ViewOwn],
  [CollaboratorVideoActions.DeleteOwn]: [CollaboratorVideoActions.ViewOwn],
  [CollaboratorVideoActions.ListOwn]: [],

  // DocumentActions
  [DocumentActions.Upload]: [DocumentActions.View],
  [DocumentActions.InFormUpload]: [DocumentActions.View],
  [DocumentActions.Edit]: [DocumentActions.View],
  [DocumentActions.Delete]: [DocumentActions.View],
  [DocumentActions.Export]: [DocumentActions.List],
  [DocumentActions.Archive]: [DocumentActions.Delete],
  [DocumentActions.List]: [DocumentActions.Search],
  [DocumentActions.View]: [DocumentActions.ViewOwn],
  [DocumentActions.EditOwn]: [DocumentActions.ViewOwn],
  [DocumentActions.DeleteOwn]: [DocumentActions.ViewOwn],
  [DocumentActions.ListOwn]: [],

  // AuthActions
  [AuthActions.ChangePassword]: [],
  [AuthActions.ChangePIN]: [],
  [AuthActions.ResetPassword]: [],
  [AuthActions.ResetPIN]: [],
  [AuthActions.LoginWithPIN]: [],
  [AuthActions.LoginWithPassword]: [],
};

export const permissionCategories: Record<
  keyof AccessPermission,
  { label: string; actions: Record<string, string> }
> = {
  user: {
    label: "Utilisateur",
    actions: {
      [UserActions.ViewOwn]: "Consulter son propre profil",
      [UserActions.EditOwn]: "Modifier son propre profil",
      [UserActions.DeleteOwn]: "Supprimer son propre profil",
      [UserActions.ViewOwnOnProfileAttendanceInsight]:
        "Consulter ses propres informations de présence sur le profil",
      [UserActions.ViewOwnOnProfileKpiInsight]:
        "Consulter ses propres informations KPI sur le profil",
      [UserActions.ViewOwnOnProfileTaskInsight]:
        "Consulter ses propres informations de tâches sur le profil",
      [UserActions.ViewOwnOnProfileDocumentInsight]:
        "Consulter ses propres documents sur le profil",
      [UserActions.ViewOwnOnProfileVideoInsight]:
        "Consulter ses propres vidéos sur le profil",
      [UserActions.ViewOwnOnProfileExpenseInsight]:
        "Consulter ses propres dépenses sur le profil",
      [UserActions.ViewOwnOnProfilePositionsInsight]:
        "Consulter ses propres positions sur le profil",
      [UserActions.ViewOwnOnProfileDepartmentsInsight]:
        "Consulter ses propres départements sur le profil",
      [UserActions.ViewOwnOnProfileTeamsInsight]:
        "Consulter ses propres équipes sur le profil",
      [UserActions.ViewOwnOnProfileHourGroupsInsight]:
        "Consulter ses propres groupes d'heures sur le profil",
      [UserActions.ViewOwnOnProfilePrimeInsight]:
        "Consulter ses propres primes sur le profil",
      [UserActions.ViewOwnOnProfileObservationInsight]:
        "Consulter ses propres observations sur le profil",
      [UserActions.ViewOwnOnProfilePerformenaceInsight]:
        "Consulter ses propres performances sur le profil",
      [UserActions.ViewOwnOneProfileMonthlyReportInsight]:
        "Consulter son propre rapport mensuel sur le profil",
      [UserActions.ViewOneOwnProfileNotesInsight]:
        "Consulter ses propres notes sur le profil",
      [UserActions.OnOwnProfileUseEditIntent]:
        "Utiliser l'intention de modification sur son propre profil",
      [UserActions.List]: "Consulter la liste des utilisateurs",
      [UserActions.Create]: "Ajouter un utilisateur",
      [UserActions.Edit]: "Modifier un utilisateur",
      [UserActions.Delete]: "Supprimer un utilisateur",
      [UserActions.View]: "Consulter un utilisateur",
      [UserActions.QuickMakeObservation]: "Faire rapidement une observation",
      [UserActions.QuickMakeKpiEvaluation]:
        "Faire rapidement une évaluation KPI",
      [UserActions.QuickAssignTask]: "Assigner rapidement une tâche",
      [UserActions.QuickChangeAccess]: "Changer rapidement l'accès",
      [UserActions.QuickChangePosition]: "Changer rapidement la position",
      [UserActions.QuickChangeTeam]: "Changer rapidement l'équipe",
      [UserActions.QuickChangeDepartment]: "Changer rapidement le département",
      [UserActions.QuickChangeHourGroup]:
        "Changer rapidement le groupe d'heures",
      [UserActions.QuickChangeBonusCategory]:
        "Changer rapidement la catégorie de bonus",
      [UserActions.Search]: "Rechercher des utilisateurs",
      [UserActions.QuickFilterOnRole]: "Filtrer rapidement par rôle",
      [UserActions.Export]: "Exporter les utilisateurs",
      [UserActions.Archive]: "Archiver les utilisateurs",
      [UserActions.ViewOnProfileAttendanceInsight]:
        "Consulter les informations de présence sur le profil",
      [UserActions.ViewOnProfileKpiInsight]:
        "Consulter les informations KPI sur le profil",
      [UserActions.ViewOnProfileTaskInsight]:
        "Consulter les informations de tâches sur le profil",
      [UserActions.ViewOnProfileDocumentInsight]:
        "Consulter les documents sur le profil",
      [UserActions.ViewOnProfileVideoInsight]:
        "Consulter les vidéos sur le profil",
      [UserActions.ViewOnProfileExpenseInsight]:
        "Consulter les dépenses sur le profil",
      [UserActions.ViewOnProfilePositionsInsight]:
        "Consulter les positions sur le profil",
      [UserActions.ViewOnProfileDepartmentsInsight]:
        "Consulter les départements sur le profil",
      [UserActions.ViewOnProfileTeamsInsight]:
        "Consulter les équipes sur le profil",
      [UserActions.ViewOnProfileHourGroupsInsight]:
        "Consulter les groupes d'heures sur le profil",
      [UserActions.ViewOnProfilePrimeInsight]:
        "Consulter les primes sur le profil",
      [UserActions.ViewOnProfileObservationInsight]:
        "Consulter les observations sur le profil",
      [UserActions.ViewOnProfilePerformenaceInsight]:
        "Consulter les performances sur le profil",
      [UserActions.ViewOneProfileMonthlyReportInsight]:
        "Consulter le rapport mensuel sur le profil",
      [UserActions.ViewOneProfileNotesInsight]:
        "Consulter les notes sur le profil",
      [UserActions.UseEditIntent]: "Utiliser l'intention de modification",
      [UserActions.ViewUserStatus]: "Consulter le statut de l'utilisateur",
    },
  },

  pointage: {
    label: "Pointage",
    actions: {
      [PointageActions.DoSharedAuthLoginOnPublicCheckRoute]:
        "Utiliser son propre PIN pour authentifier la route /check public et permettre à d'autres utilisateurs de pointer",
      [PointageActions.CheckIn]: "Pointer à l'entrée",
      [PointageActions.CheckOut]: "Pointer à la sortie",
      [PointageActions.CheckBreakStart]: "Commencer une pause",
      [PointageActions.CheckBreakEnd]: "Terminer une pause",
      [PointageActions.ViewAttendanceGlobalUpdateMetric]:
        "Consulter les métriques globales de mise à jour des présences sur /o/attendance/history",
      [PointageActions.ViewAttendanceGlobalUpdateHistory]:
        "Consulter l'historique global des mises à jour des présences",
      [PointageActions.FilterAttendanceGlobalUpdateHistory]:
        "Filtrer l'historique global des mises à jour des présences",
      [PointageActions.ExportAttendanceInsight]:
        "Exporter les informations de présence",
    },
  },

  access: {
    label: "Accès",
    actions: {
      [AccessActions.List]: "Consulter la liste des accès",
      [AccessActions.Create]: "Ajouter un accès",
      [AccessActions.Edit]: "Modifier un accès",
      [AccessActions.Delete]: "Supprimer un accès",
      [AccessActions.View]: "Consulter un accès",
      [AccessActions.Search]: "Rechercher des accès",
      [AccessActions.Export]: "Exporter les accès",
      [AccessActions.Archive]: "Archiver les accès",
    },
  },

  candidate: {
    label: "Candidat",
    actions: {
      [CandidateActions.List]: "Consulter la liste des candidats",
      [CandidateActions.Create]: "Ajouter un candidat",
      [CandidateActions.Edit]: "Modifier un candidat",
      [CandidateActions.Delete]: "Supprimer un candidat",
      [CandidateActions.View]: "Consulter un candidat",
      [CandidateActions.Search]: "Rechercher des candidats",
      [CandidateActions.Export]: "Exporter les candidats",
      [CandidateActions.Archive]: "Archiver les candidats",
    },
  },

  department: {
    label: "Département",
    actions: {
      [DepartmentActions.List]: "Consulter la liste des départements",
      [DepartmentActions.Create]: "Ajouter un département",
      [DepartmentActions.Edit]: "Modifier un département",
      [DepartmentActions.Delete]: "Supprimer un département",
      [DepartmentActions.View]: "Consulter un département",
      [DepartmentActions.Search]: "Rechercher des départements",
      [DepartmentActions.Export]: "Exporter les départements",
      [DepartmentActions.Archive]: "Archiver les départements",
    },
  },

  team: {
    label: "Équipe",
    actions: {
      [TeamActions.List]: "Consulter la liste des équipes",
      [TeamActions.Create]: "Ajouter une équipe",
      [TeamActions.Edit]: "Modifier une équipe",
      [TeamActions.Delete]: "Supprimer une équipe",
      [TeamActions.View]: "Consulter une équipe",
      [TeamActions.Search]: "Rechercher des équipes",
      [TeamActions.Export]: "Exporter les équipes",
      [TeamActions.Archive]: "Archiver les équipes",
    },
  },

  kpiForm: {
    label: "Formulaire KPI",
    actions: {
      [KpiFormActions.List]: "Consulter la liste des formulaires KPI",
      [KpiFormActions.Create]: "Ajouter un formulaire KPI",
      [KpiFormActions.Edit]: "Modifier un formulaire KPI",
      [KpiFormActions.Delete]: "Supprimer un formulaire KPI",
      [KpiFormActions.View]: "Consulter un formulaire KPI",
      [KpiFormActions.Search]: "Rechercher des formulaires KPI",
      [KpiFormActions.Export]: "Exporter les formulaires KPI",
      [KpiFormActions.Archive]: "Archiver les formulaires KPI",
    },
  },

  kpiValue: {
    label: "Valeur KPI",
    actions: {
      [KpiValueActions.List]: "Consulter la liste des valeurs KPI",
      [KpiValueActions.View]: "Consulter une valeur KPI",
      [KpiValueActions.Search]: "Rechercher des valeurs KPI",
      [KpiValueActions.Export]: "Exporter les valeurs KPI",
      [KpiValueActions.Archive]: "Archiver les valeurs KPI",
    },
  },

  news: {
    label: "Actualité",
    actions: {
      [NewsActions.List]: "Consulter la liste des actualités",
      [NewsActions.Create]: "Ajouter une actualité",
      [NewsActions.Edit]: "Modifier une actualité",
      [NewsActions.Delete]: "Supprimer une actualité",
      [NewsActions.View]: "Consulter une actualité",
      [NewsActions.Search]: "Rechercher des actualités",
      [NewsActions.Publish]: "Publier une actualité",
      [NewsActions.Filter]: "Filtrer les actualités",
      [NewsActions.Export]: "Exporter les actualités",
      [NewsActions.Archive]: "Archiver les actualités",
    },
  },

  note: {
    label: "Note",
    actions: {
      [NoteActions.ViewOwn]: "Consulter ses propres notes",
      [NoteActions.EditOwn]: "Modifier ses propres notes",
      [NoteActions.DeleteOwn]: "Supprimer ses propres notes",
      [NoteActions.ListOwn]: "Consulter la liste de ses propres notes",
      [NoteActions.List]: "Consulter la liste des notes",
      [NoteActions.Create]: "Ajouter une note",
      [NoteActions.Edit]: "Modifier une note",
      [NoteActions.Delete]: "Supprimer une note",
      [NoteActions.View]: "Consulter une note",
      [NoteActions.Search]: "Rechercher des notes",
      [NoteActions.Export]: "Exporter les notes",
      [NoteActions.Archive]: "Archiver les notes",
    },
  },

  patrimoine: {
    label: "Patrimoine",
    actions: {
      [PatrimoineActions.List]: "Consulter la liste du patrimoine",
      [PatrimoineActions.Create]: "Ajouter un patrimoine",
      [PatrimoineActions.Edit]: "Modifier un patrimoine",
      [PatrimoineActions.Delete]: "Supprimer un patrimoine",
      [PatrimoineActions.View]: "Consulter un patrimoine",
      [PatrimoineActions.Search]: "Rechercher des patrimoines",
      [PatrimoineActions.Export]: "Exporter le patrimoine",
      [PatrimoineActions.Archive]: "Archiver le patrimoine",
    },
  },

  permissions: {
    label: "Permissions",
    actions: {
      [PermissionsActions.ListOwn]: "Consulter ses propres permissions",
      [PermissionsActions.DeleteOwn]: "Supprimer ses propres permissions",
      [PermissionsActions.EditOwn]: "Modifier ses propres permissions",
      [PermissionsActions.ViewOwn]: "Consulter ses propres permissions",
      [PermissionsActions.List]: "Consulter la liste des permissions",
      [PermissionsActions.Create]: "Ajouter une permission",
      [PermissionsActions.Edit]: "Modifier une permission",
      [PermissionsActions.Delete]: "Supprimer une permission",
      [PermissionsActions.View]: "Consulter une permission",
      [PermissionsActions.Treat]: "Traiter une demande de permission",
      [PermissionsActions.Search]: "Rechercher des permissions",
      [PermissionsActions.Export]: "Exporter les permissions",
      [PermissionsActions.Archive]: "Archiver les permissions",
    },
  },

  position: {
    label: "Position",
    actions: {
      [PositionActions.ViewOwn]: "Consulter sa propre position",
      [PositionActions.List]: "Consulter la liste des positions",
      [PositionActions.Create]: "Ajouter une position",
      [PositionActions.Edit]: "Modifier une position",
      [PositionActions.Delete]: "Supprimer une position",
      [PositionActions.View]: "Consulter une position",
      [PositionActions.Search]: "Rechercher des positions",
      [PositionActions.Export]: "Exporter les positions",
      [PositionActions.Archive]: "Archiver les positions",
    },
  },

  task: {
    label: "Tâche",
    actions: {
      [TaskActions.ListOwn]: "Consulter la liste de ses propres tâches",
      [TaskActions.ViewOwn]: "Consulter ses propres tâches",
      [TaskActions.EditOwn]: "Modifier ses propres tâches",
      [TaskActions.DeleteOwn]: "Supprimer ses propres tâches",
      [TaskActions.ToggleDoneOwn]: "Marquer ses propres tâches comme terminées",
      [TaskActions.List]: "Consulter la liste des tâches",
      [TaskActions.Create]: "Ajouter une tâche",
      [TaskActions.Edit]: "Modifier une tâche",
      [TaskActions.Delete]: "Supprimer une tâche",
      [TaskActions.View]: "Consulter une tâche",
      [TaskActions.Search]: "Rechercher des tâches",
      [TaskActions.Export]: "Exporter les tâches",
      [TaskActions.Archive]: "Archiver les tâches",
    },
  },

  systemConfig: {
    label: "Configuration Système",
    actions: {
      [SystemConfigActions.View]: "Consulter la configuration système",
      [SystemConfigActions.Edit]: "Modifier la configuration système",
      [SystemConfigActions.Reset]: "Réinitialiser la configuration système",
    },
  },

  hourGroup: {
    label: "Groupe d'Heures",
    actions: {
      [HourGroupActions.ViewOwn]: "Consulter son propre groupe d'heures",
      [HourGroupActions.List]: "Consulter la liste des groupes d'heures",
      [HourGroupActions.Create]: "Ajouter un groupe d'heures",
      [HourGroupActions.Edit]: "Modifier un groupe d'heures",
      [HourGroupActions.Delete]: "Supprimer un groupe d'heures",
      [HourGroupActions.View]: "Consulter un groupe d'heures",
      [HourGroupActions.Search]: "Rechercher des groupes d'heures",
      [HourGroupActions.Export]: "Exporter les groupes d'heures",
      [HourGroupActions.Archive]: "Archiver les groupes d'heures",
    },
  },

  guardTour: {
    label: "Tournée de Garde",
    actions: {
      [GuardTourActions.List]: "Consulter la liste des tournées de garde",
      [GuardTourActions.Create]: "Ajouter une tournée de garde",
      [GuardTourActions.Edit]: "Modifier une tournée de garde",
      [GuardTourActions.Delete]: "Supprimer une tournée de garde",
      [GuardTourActions.View]: "Consulter une tournée de garde",
      [GuardTourActions.Search]: "Rechercher des tournées de garde",
      [GuardTourActions.Export]: "Exporter les tournées de garde",
      [GuardTourActions.Archive]: "Archiver les tournées de garde",
    },
  },

  expenseReport: {
    label: "Rapport de Dépenses",
    actions: {
      [ExpenseReportActions.ViewOwn]:
        "Consulter ses propres rapports de dépenses",
      [ExpenseReportActions.EditOwn]:
        "Modifier ses propres rapports de dépenses",
      [ExpenseReportActions.DeleteOwn]:
        "Supprimer ses propres rapports de dépenses",
      [ExpenseReportActions.ListOwn]:
        "Consulter la liste de ses propres rapports de dépenses",
      [ExpenseReportActions.Treat]: "Traiter un rapport de dépenses",
      [ExpenseReportActions.List]:
        "Consulter la liste des rapports de dépenses",
      [ExpenseReportActions.Create]: "Ajouter un rapport de dépenses",
      [ExpenseReportActions.Edit]: "Modifier un rapport de dépenses",
      [ExpenseReportActions.Delete]: "Supprimer un rapport de dépenses",
      [ExpenseReportActions.View]: "Consulter un rapport de dépenses",
      [ExpenseReportActions.Search]: "Rechercher des rapports de dépenses",
      [ExpenseReportActions.Export]: "Exporter les rapports de dépenses",
      [ExpenseReportActions.Archive]: "Archiver les rapports de dépenses",
    },
  },

  enterpriseVideo: {
    label: "Vidéo d'Entreprise",
    actions: {
      [EnterpriseVideoActions.List]:
        "Consulter la liste des vidéos d'entreprise",
      [EnterpriseVideoActions.Create]: "Ajouter une vidéo d'entreprise",
      [EnterpriseVideoActions.Edit]: "Modifier une vidéo d'entreprise",
      [EnterpriseVideoActions.Delete]: "Supprimer une vidéo d'entreprise",
      [EnterpriseVideoActions.View]: "Consulter une vidéo d'entreprise",
      [EnterpriseVideoActions.Search]: "Rechercher des vidéos d'entreprise",
      [EnterpriseVideoActions.Export]: "Exporter les vidéos d'entreprise",
      [EnterpriseVideoActions.Archive]: "Archiver les vidéos d'entreprise",
    },
  },

  collaboratorVideo: {
    label: "Vidéo de Collaborateur",
    actions: {
      [CollaboratorVideoActions.ViewOwn]:
        "Consulter ses propres vidéos de collaborateur",
      [CollaboratorVideoActions.EditOwn]:
        "Modifier ses propres vidéos de collaborateur",
      [CollaboratorVideoActions.DeleteOwn]:
        "Supprimer ses propres vidéos de collaborateur",
      [CollaboratorVideoActions.ListOwn]:
        "Consulter la liste de ses propres vidéos de collaborateur",
      [CollaboratorVideoActions.List]:
        "Consulter la liste des vidéos de collaborateur",
      [CollaboratorVideoActions.Create]: "Ajouter une vidéo de collaborateur",
      [CollaboratorVideoActions.Edit]: "Modifier une vidéo de collaborateur",
      [CollaboratorVideoActions.Delete]: "Supprimer une vidéo de collaborateur",
      [CollaboratorVideoActions.View]: "Consulter une vidéo de collaborateur",
      [CollaboratorVideoActions.Search]:
        "Rechercher des vidéos de collaborateur",
      [CollaboratorVideoActions.Export]: "Exporter les vidéos de collaborateur",
      [CollaboratorVideoActions.Archive]:
        "Archiver les vidéos de collaborateur",
    },
  },

  document: {
    label: "Document",
    actions: {
      [DocumentActions.ViewOwn]: "Consulter ses propres documents",
      [DocumentActions.EditOwn]: "Modifier ses propres documents",
      [DocumentActions.DeleteOwn]: "Supprimer ses propres documents",
      [DocumentActions.ListOwn]: "Consulter la liste de ses propres documents",
      [DocumentActions.List]: "Consulter la liste des documents",
      [DocumentActions.Upload]: "Télécharger un document",
      [DocumentActions.InFormUpload]:
        "Télécharger un document via un formulaire",
      [DocumentActions.Edit]: "Modifier un document",
      [DocumentActions.Delete]: "Supprimer un document",
      [DocumentActions.View]: "Consulter un document",
      [DocumentActions.Search]: "Rechercher des documents",
      [DocumentActions.Export]: "Exporter les documents",
      [DocumentActions.Archive]: "Archiver les documents",
    },
  },

  auth: {
    label: "Authentification",
    actions: {
      [AuthActions.LoginWithPIN]: "Se connecter avec un PIN",
      [AuthActions.LoginWithPassword]: "Se connecter avec un mot de passe",
      [AuthActions.ChangePassword]: "Changer le mot de passe",
      [AuthActions.ChangePIN]: "Changer le PIN",
      [AuthActions.ResetPassword]: "Réinitialiser le mot de passe",
      [AuthActions.ResetPIN]: "Réinitialiser le PIN",
    },
  },
};
