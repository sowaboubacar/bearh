import {
  Clock,
  Clipboard,
  Calendar,
  StickyNote,
  Newspaper,
  Users,
  BarChart2,
  MessageSquare,
  Package,
  UserPlus,
  DollarSign,
  FileText,
  Share,
  UserCheck,
  Briefcase,
  Layers,
  Key,
  File,
  Send,
  Info,
  Calendar1,
  BarChart,
  TrophyIcon,
  Vote,
} from "lucide-react";

import {
  AccessActions,
  BonusCategoryActions,
  CandidateActions,
  CollaboratorVideoActions,
  DepartmentActions,
  EnterpriseVideoActions,
  GuardTourActions,
  HourGroupActions,
  KpiFormActions,
  KpiValueActions,
  ObservationActions,
  PatrimoineActions,
  PatrimoineTypeActions,
  PointageActions,
  PositionActions,
  PrimeActions,
  SystemConfigActions,
  TeamActions,
  NewsActions,
  HallOfFameActions,
  TaskActions,
  PermissionsActions,
  NoteActions,
  ExpenseReportActions,
  DocumentActions,
  UserActions,
} from "~/core/entities/utils/access-permission";
import { NavigationItem } from "~/types/global";

export const navigationsDataSet = {
  navAllUsers: [
    {
      title: "Pointage",
      url: "/o/attendance/check-in",
      icon: Clock,
      taskbarChildren: [
        { icon: Clock, label: "Je Pointe", url: "/o/attendance/check-in", condition: { any: [PointageActions.CheckIn, PointageActions.CheckBreakStart, PointageActions.CheckBreakEnd, PointageActions.CheckOut] } },
        {
          icon: FileText,
          label: "Suivi Pointage",
          url: "/o/attendance/history",
          condition: {
            any: [
              PointageActions.ViewAttendanceGlobalUpdateMetric,
              PointageActions.ViewAttendanceGlobalUpdateHistory,
              PointageActions.FilterAttendanceGlobalUpdateHistory,
              PointageActions.ExportAttendanceInsight,
            ],
          },
        },
      ],
      condition: {
        any: [
          PointageActions.ViewAttendanceGlobalUpdateMetric,
          PointageActions.ViewAttendanceGlobalUpdateHistory,
          PointageActions.FilterAttendanceGlobalUpdateHistory,
          PointageActions.ExportAttendanceInsight,
          PointageActions.CheckIn,
          PointageActions.CheckBreakStart,
          PointageActions.CheckBreakEnd,
          PointageActions.CheckOut,
        ],
      },
    },
    // Hall of Fame
    {
      title: "Employé Du Mois",
      url: "/o/hall-of-fame",
      icon: TrophyIcon,
      taskbarChildren: [
        { icon: TrophyIcon, label: "Employé Du Mois", url: "/o/hall-of-fame", },
        { icon: Vote, label: "Vote En Cours", url: "/o/hall-of-fame/ongoing", condition: { any: [HallOfFameActions.CastVote] } },
      ],
      
    },

    {
      title: "Note de Service",
      url: "/o/news",
      icon: Newspaper,
      taskbarChildren: [
        { icon: Newspaper, label: "Note de Service", url: "/o/news", condition: { any: [NewsActions.List] } },
      ],
      condition: {
        any: [NewsActions.List],
      },
    },
    {
      title: "Tâches",
      url: "/o/task",
      icon: Clipboard,
      taskbarChildren: [
        { icon: Clipboard, label: "Mes tâches", url: "/o/task", condition: { any: [TaskActions.List, TaskActions.ListOwn] } },
      ],
      condition: {
        any: [TaskActions.List, TaskActions.ListOwn],
      },
    },
    {
      title: "Congés & Permissions",
      url: "/o/permission-and-leave",
      icon: Calendar,
      taskbarChildren: [
        {
          icon: Calendar,
          label: "Faire une Demande ",
          url: "/o/permission-and-leave/new",
          condition: { any: [PermissionsActions.Create] },
        },
        { icon: Clock, label: " Historiques", url: "/o/permission-and-leave", condition: { any: [PermissionsActions.List, PermissionsActions.ListOwn] } },
      ],
      condition: {
        any: [PermissionsActions.List, PermissionsActions.ListOwn],
      },
    },
    {
      title: "Prise de Notes",
      url: "/o/note",
      icon: StickyNote,
      taskbarChildren: [
        { icon: StickyNote, label: "Mes Notes", url: "/o/note", condition: { any: [NoteActions.List, NoteActions.ListOwn] } },
        { icon: Share, label: "Partagées", url: "/o/note/shared", condition: { any: [NoteActions.List, NoteActions.ListOwn] } },
      ],
      condition: {
        any: [NoteActions.List, NoteActions.ListOwn],
      },
    },
    {
      title: "Notes de Frais",
      url: "/o/expense-report",
      icon: DollarSign,
      taskbarChildren: [
        { icon: FileText, label: "Notes de Frais", url: "/o/expense-report", condition: { any: [ExpenseReportActions.List, ExpenseReportActions.ListOwn] } },
        {
          icon: DollarSign,
          label: "Nouvelle Note",
          url: "/o/expense-report/new",
          condition: { any: [ExpenseReportActions.Create] },
        },
      ],
      condition: {
        any: [ExpenseReportActions.List, ExpenseReportActions.ListOwn],
      },
    },
    {
      title: "Médiathèque",
      url: "/o/media-manager",
      icon: File,
      taskbarChildren: [
        { icon: File, label: "Mes Documents", url: "/o/media-manager", condition: { any: [DocumentActions.List, DocumentActions.ListOwn] } },
      ],
      condition: {
        any: [DocumentActions.List, DocumentActions.ListOwn],
      },
    },
  ],
  navHRManagers: [
    {
      title: "Employés",
      url: "/o/users",
      icon: Users,
      taskbarChildren: [
        {
          icon: UserCheck,
          label: "Mes Supervisés",
          url: "/o/users/my-subordinates",
        },
        { icon: Users, label: "Mes Collègues", url: "/o/users",
          condition: {any: [UserActions.List]}
         },
      ],
      condition: {
        any: [UserActions.List],
      },
    },
    // {
    //   title: "Fiche de paie",
    //   url: "/o/payroll",
    //   icon: DollarSign,
    //   taskbarChildren: [
    //     { icon: DollarSign, label: "Fiches de paie", url: "/o/payroll", },
    //     { icon: DollarSign, label: "Configuration", url: "/o/payroll/config", },
    //   ],
    // },
    {
      title: "KPI & Evaluations",
      url: "/o/evaluations",
      icon: BarChart2,
      taskbarChildren: [
        { icon: BarChart, label: "Evaluations", url: "/o/evaluations",  condition: {
          any: [KpiValueActions.List, KpiValueActions.ListOwn],
        }, },
        {
          icon: BarChart2,
          label: "KPI",
          url: "/o/kpi-form",
          condition: {
            all: [KpiFormActions.List, KpiFormActions.Create],
          },
        },
      ],
      condition: {
        any: [KpiValueActions.List, KpiValueActions.ListOwn,KpiFormActions.List, KpiFormActions.Create],
      },
    },
    {
      title: "Remarques",
      url: "/o/observation",
      icon: MessageSquare,
      taskbarChildren: [
        {
          icon: MessageSquare,
          label: "Ajouter",
          url: "/o/observation/new",
          condition: ObservationActions.Create,
        },
        {
          icon: FileText,
          label: "Historique",
          url: "/o/observation",
          condition: {
            any: [ObservationActions.List, ObservationActions.ListOwn],
          },
        },
      ],
      condition: {
        any: [ObservationActions.List, ObservationActions.ListOwn],
      },
    },
    {
      title: "Base de talents",
      url: "/o/candidates",
      icon: UserPlus,
      taskbarChildren: [
        {
          icon: UserPlus,
          label: "Candidatures",
          url: "/o/candidates",
          condition: CandidateActions.List,
        },
        {
          icon: UserPlus,
          label: "Nouveau",
          url: "/o/candidates/new",
          condition: CandidateActions.Create,
        },
      ],
      condition: {
        any: [CandidateActions.List],
      },
    },
    {
      title: "Primes",
      url: "/o/prime",
      icon: DollarSign,
      taskbarChildren: [
        {
          icon: FileText,
          label: "Historique",
          url: "/o/prime",
          condition: { any: [PrimeActions.List, PrimeActions.ListOwn] },
        },
        {
          icon: FileText,
          label: "Catégories",
          url: "/o/category-prime",
          condition: BonusCategoryActions.List,
        },
      ],
      condition: {
        any: [
          BonusCategoryActions.List,
          PrimeActions.List,
          PrimeActions.ListOwn,
        ],
      },
    },
    {
      title: "Base de Connaissances",
      url: "/o/enterprise-videos",
      icon: Info,
      taskbarChildren: [
        {
          icon: Send,
          label: "Ma Pharmacie",
          url: "/o/enterprise-videos",
          condition: { all: [EnterpriseVideoActions.List] },
        },
        {
          icon: Send,
          label: "Mes Collègues",
          url: "/o/collaborator-videos",
          condition: { all: [CollaboratorVideoActions.List] },
        },
      ],
      condition: {
        any: [EnterpriseVideoActions.List, CollaboratorVideoActions.List],
      },
    },
  ],
  navGeneralManagement: [
    {
      title: "Patrimoine",
      url: "/o/patrimoine",
      icon: Package,
      taskbarChildren: [
        {
          icon: Package,
          label: "Inventaire",
          url: "/o/patrimoine",
          condition: PatrimoineActions.List,
        },
        {
          icon: Layers,
          label: "Type d'Actif",
          url: "/o/patrimoine-type",
          condition: PatrimoineTypeActions.List,
        },
      ],
      condition: {
        any: [PatrimoineActions.List, PatrimoineTypeActions.List],
      },
    },
    {
      title: "Organisation",
      url: "/o/departments",
      icon: Briefcase,
      taskbarChildren: [
        {
          icon: Briefcase,
          label: "Départements",
          url: "/o/departments",
          condition: { any: [DepartmentActions.List] },
        },
        {
          icon: Users,
          label: "Équipes",
          url: "/o/teams",
          condition: { all: [TeamActions.List] },
        },
        {
          icon: UserCheck,
          label: "Postes",
          url: "/o/positions",
          condition: { all: [PositionActions.List] },
        },
        {
          icon: Key,
          label: "Accès",
          url: "/o/access",
          condition: { all: [AccessActions.List] },
        },
        {
          icon: Clock,
          label: "Programmes",
          url: "/o/hour-group",
          condition: { all: [HourGroupActions.List] },
        },
        {
          icon: Calendar1,
          label: "Garde",
          url: "/o/guard-tour",
          condition: { any: [GuardTourActions.List] },
        },
      ],
      condition: {
        any: [
          DepartmentActions.List,
          TeamActions.List,
          PositionActions.List,
          AccessActions.List,
          HourGroupActions.List,
          GuardTourActions.List,
        ],
      },
    },
    {
      title: "Configuration Générale",
      url: "/o/settings",
      icon: Info,
      taskbarChildren: [
        {
          icon: Send,
          label: "Paramètrage",
          url: "/o/settings",
          condition: {
            all: [
              SystemConfigActions.Edit,
              SystemConfigActions.View,
              SystemConfigActions.Reset,
            ],
          },
        },
      ],
      condition: {
        all: [
          SystemConfigActions.Edit,
          SystemConfigActions.View,
          SystemConfigActions.Reset,
        ],
      },
    },
  ],
};



export function getByUrl(url: string) {
  const allNavigations = [
    ...navigationsDataSet.navAllUsers,
    ...navigationsDataSet.navHRManagers,
    ...navigationsDataSet.navGeneralManagement
  ];
  return allNavigations.find((nav) => nav.url === url);
}