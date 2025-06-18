/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Briefcase,
  Building,
  Calendar,
  Users,
  Award,
  FileText,
  Eye,
  ClipboardList,
  CheckSquare,
  Video,
  CreditCard,
  StickyNote,
  BarChart,
} from "lucide-react";
import { PermissionCondition, UserActions } from "~/core/entities/utils/access-permission";

export interface UserSection {
  title: string;
  description: string;
  link: string;
  icon: any;
  condition?: PermissionCondition
}

export const userSections: UserSection[] = [
  // Attendances
  {
    title: "Analytiques Pointages",
    description: "Consultez les métriques et graphiques de pointage de l'utilisateur.",
    link: "/o/users/view/:id/attendance",
    icon: Calendar,
    condition: UserActions.ViewOnProfileAttendanceInsight
  },
  {
    title: "Fiche de poste",
    description:
      "Consultez et modifiez les informations relatives au poste de l'utilisateur.",
    link: "/o/users/view/:id/positions",
    icon: Briefcase,
    condition: UserActions.ViewOnProfilePositionsInsight
  },
  {
    title: "Département",
    description: "Voir le département auquel l'utilisateur appartient.",
    link: "/o/users/view/:id/departments",
    icon: Building,
    condition: UserActions.ViewOnProfileDepartmentsInsight
  },
  {
    title: "Programme",
    description: "Gérez les programmes associés à l'utilisateur.",
    link: "/o/users/view/:id/hour-groups",
    icon: Calendar,
    condition: UserActions.ViewOnProfileHourGroupsInsight
  },
  {
    title: "Équipe",
    description: "Découvrez l'équipe de l'utilisateur.",
    link: "/o/users/view/:id/teams",
    icon: Users,
    condition: UserActions.ViewOnProfileTeamsInsight
  },
  {
    title: "Primes",
    description: "Visualisez les primes et bonus de l'utilisateur.",
    link: "/o/users/view/:id/primes",
    icon: Award,
    condition: UserActions.ViewOnProfilePrimeInsight
  },
  {
    title: "Documents",
    description: "Accédez aux documents de l'utilisateur.",
    link: "/o/users/view/:id/documents",
    icon: FileText,
    condition: UserActions.ViewOnProfileDocumentInsight
  },
  {
    title: "Observations",
    description: "Consultez les observations concernant l'utilisateur.",
    link: "/o/users/view/:id/observations",
    icon: Eye,
    condition: UserActions.ViewOnProfileObservationInsight
  },
  {
    title: "Évaluations",
    description: "Évaluez les performances de l'utilisateur.",
    link: "/o/users/view/:id/evaluations",
    icon: ClipboardList,
    condition: UserActions.ViewOnProfileKpiInsight
  },
  {
    title: "Tâches",
    description: "Gérez les tâches assignées à l'utilisateur.",
    link: "/o/users/view/:id/tasks",
    icon: CheckSquare,
    condition: UserActions.ViewOnProfileTaskInsight
  },
  {
    title: "Vidéos & Contenus",
    description: "Visionnez les vidéos & contenus associées à l'utilisateur.",
    link: "/o/users/view/:id/contents",
    icon: Video,
    condition: UserActions.ViewOwnOnProfileVideoInsight
  },
  {
    title: "Notes de frais", 
    description: "Gérez les notes de frais de l'utilisateur.",
    link: "/o/users/view/:id/expense-reports",
    icon: CreditCard,
    condition: UserActions.ViewOnProfileExpenseInsight
  },
  {
    title: "Notes", 
    description: "Prenez ou consultez des notes sur l'utilisateur.",
    link: "/o/users/view/:id/notes",
    icon: StickyNote,
    condition: UserActions.ViewOneProfileNotesInsight
  },
  {
    title: "Rapport Global", 
    description: "Obtenez un rapport global sur l'utilisateur.",
    link: "/o/users/view/:id/global-reports",
    icon: BarChart,
    condition: UserActions.ViewOneProfileMonthlyReportInsight
  },
];
