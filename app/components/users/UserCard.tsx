import { useState } from "react";
import { Link, useFetcher } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  Trash2Icon,
  PencilIcon,
  UserPlusIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  LayersIcon,
  FileTextIcon,
  CoinsIcon,
  Info,
  Award,
  Trophy,
} from "lucide-react";
import { ObservationModal } from "~/components/users/ObservationModal";
import { EvaluationModal } from "~/components/users/EvaluationModal";
import { AccessRightModal } from "~/components/users/AccessRightModal";
import { DepartmentModal } from "~/components/users/DepartmentModal";
import { PositionModal } from "~/components/users/PositionModal";
import { HourGroupModal } from "~/components/users/HourGroupModal";
import { TeamModal } from "~/components/users/TeamModal";
import { TaskAssignModal } from "./TaskAssignModal";
import { BonusModal } from "./BonusModal";
import { BonusCategoryModal } from "./BonusCategoryModal";
import type { IUser } from "~/core/entities/user.entity.server";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useToast } from "~/hooks/use-toast";
import { Toaster } from "~/components/ui/toaster";
import type { IKpiForm } from "~/core/entities/kpiForm.entity.server";
import { ITask } from "~/core/entities/task.entity.server";
import { IAccess } from "~/core/entities/access.entity.server";
import { IDepartment } from "~/core/entities/department.entity.server";
import { IHourGroup } from "~/core/entities/hourGroup.entity.server";
import { ITeam } from "~/core/entities/team.entity.server";
import { IPosition } from "~/core/entities/position.entity.server";
import { IBonusCategory } from "~/core/entities/bonusCategory.entity.server";

interface UserCardProps {
  user: IUser;
  applicableKpis?: IKpiForm[];
  tasks?: ITask[];
  accesses?: IAccess[];
  departments?: IDepartment[];
  hourGroups?: IHourGroup[];
  teams?: ITeam[];
  positions?: IPosition[];
  bonusCategories?: IBonusCategory[];
  className?: string;
  isWinnerRecords?: Record<string, any>;
  can?: Record<string, boolean>;
}

export function UserCard({
  user,
  applicableKpis,
  tasks,
  accesses,
  departments,
  hourGroups,
  teams,
  positions,
  bonusCategories,
  className = "",
  isWinnerRecords,
  can
}: UserCardProps) {
  const fetcher = useFetcher();
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showTaskAssignModal, setShowTaskAssignModal] = useState(false);
  const [showAccessRightModal, setShowAccessRightModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showHourGroupModal, setShowHourGroupModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showBonusCategoryModal, setShowBonusCategoryModal] = useState(false);
  const { toast } = useToast();

  if (!user) return null;
  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("userId", user.id as string);
      fetcher.submit(formData, { method: "post", action: "/o/users" });
    }
  };

  const showFeedback = (title: string = "Succès", description: string = "Votre opération est enregistré") => {
    toast({
      title,
      description,
    });
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg  w-full",
        className
      )}
    >
      <Toaster/>
      <CardHeader className="bg-primary text-white p-4 sm:p-6">
        <CardTitle className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <Avatar
              className={cn("h-20 w-20 sm:h-16 sm:w-16 border-2 border-primary", {
                "border-yellow-300": isWinnerRecords?.isWinner === true,
                "border-white": isWinnerRecords?.isWinner !== true,
              })}
            >
              <AvatarImage  
                src={user.avatar?.file?.url}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="text-lg text-primary font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {isWinnerRecords?.isWinner && (
              <div
                className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"
                title="Points de récompense"
              >
                <Award className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <Badge
              variant="outline"
              className="mt-2 bg-white/20 text-white px-3 py-1 text-base"
            >
               {user.currentPosition ? user.currentPosition?.title : "Aucun poste"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-base text-muted-foreground">Email</p>
            <p className="text-base font-medium break-all truncate">
              {user.email}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-base text-muted-foreground">Statut</p>
            <p className="text-base font-medium">
              {user.status && (
                <Badge className=" bg-emerald-800 text-white">
                  {user.status}
                </Badge>
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 bg-muted/50 p-4 sm:p-6">
        {can?.view && (
           <Button
           asChild
           variant="outline"
           className="w-full sm:w-auto h-11 text-base"
         >
           <Link to={`/o/users/view/${user.id}`}>
             <Info className="mr-2 h-5 w-5" />
           </Link>
         </Button>
        )}
       

        <div className="flex flex-wrap items-center justify-end gap-3">
          
          {can?.edit && (
            <Button variant="outline" size="icon" className="h-11 w-11" asChild>
            <Link to={`/o/users/edit/${user.id}`}>
              <PencilIcon className="h-5 w-5" />
            </Link>
          </Button>
          )}
          
              {can?.delete_ && (
                <Button
                variant="destructive"
                size="icon"
                className="h-11 w-11"
                onClick={handleDelete}
              >
                <Trash2Icon className="h-5 w-5" />
              </Button>
              )}
          

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 text-base">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2" align="end">
              {can?.quickMakeObservation && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowObservationModal(true)}
              >
                <ClipboardListIcon className="mr-2 h-5 w-5" />
                <span>Observation</span>
              </DropdownMenuItem>
              )}
              {can?.quickMakeKpiEvaluation && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowEvaluationModal(true)}
              >
                <UserPlusIcon className="mr-2 h-5 w-5" />
                <span>Évaluer</span>
              </DropdownMenuItem>
              )}
              
              {/* <DropdownMenuItem 
                className="h-11 text-base"
                asChild
              >
                <Link to={`/o/chat/new?with=${user.id}`}>
                  <MessageSquareIcon className="mr-2 h-5 w-5" />
                  <span>Message</span>
                </Link>
              </DropdownMenuItem> */}

              {can?.quickAssignTask && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowTaskAssignModal(true)}
              >
                <BriefcaseIcon className="mr-2 h-5 w-5" />
                <span>Assigner tâche</span>
              </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-2" />

              {can?.quickChangeAccess && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowAccessRightModal(true)}
              >
                <LayersIcon className="mr-2 h-5 w-5" />
                <span>Droits d'accès</span>
              </DropdownMenuItem>
              )}
              
              {can?.quickChangeDepartment && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowDepartmentModal(true)}
              >
                <UsersIcon className="mr-2 h-5 w-5" />
                <span>Département</span>
              </DropdownMenuItem>
              )}
              
              {can?.quickChangePosition && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowPositionModal(true)}
              >
                <BriefcaseIcon className="mr-2 h-5 w-5" />
                <span>Poste</span>
              </DropdownMenuItem>
              )}
              
              {can?.quickChangeHourGroup && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowHourGroupModal(true)}
              >
                <ClockIcon className="mr-2 h-5 w-5" />
                <span>Groupe horaire</span>
              </DropdownMenuItem>
              )}
              
              {can?.quickChangeTeam && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowTeamModal(true)}
              >
                <UsersIcon className="mr-2 h-5 w-5" />
                <span>Équipe</span>
              </DropdownMenuItem>
              )}

              

              <DropdownMenuSeparator className="my-2" />

              {/* <DropdownMenuItem 
                className="h-11 text-base"
                onSelect={() => setShowBonusModal(true)}
              >
                <CoinsIcon className="mr-2 h-5 w-5" />
                <span>Prime additionnelle</span>
              </DropdownMenuItem> */}

              {can?.quickChangeBonusCategory && (
                <DropdownMenuItem
                className="h-11 text-base"
                onSelect={() => setShowBonusCategoryModal(true)}
              >
                <LayersIcon className="mr-2 h-5 w-5" />
                <span>Catégories de prime</span>
              </DropdownMenuItem>
              )}

              

              <DropdownMenuSeparator className="my-2" />

              {/* <DropdownMenuItem 
                className="h-11 text-base"
                asChild
              >
                <Link to={`/o/media-manager/uploadFor?quickUser=${user.id}`}>
                  <FileTextIcon className="mr-2 h-5 w-5" />
                  <span>Ajouter document</span>
                </Link>
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>

      <ObservationModal
        isOpen={showObservationModal}
        onClose={() => {
          showFeedback(); setShowObservationModal(false)
        }}
        user={user}
      />
      <EvaluationModal
        isOpen={showEvaluationModal}
        onClose={() => { setShowEvaluationModal(false)}}
        user={user}
        applicableKpis={applicableKpis}
      />
      <TaskAssignModal
        isOpen={showTaskAssignModal}
        onClose={() => setShowTaskAssignModal(false)}
        user={user}
        tasks={tasks}
      />
      <AccessRightModal
        isOpen={showAccessRightModal}
        onClose={() => setShowAccessRightModal(false)}
        user={user}
        accesses={accesses}
      />
      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        user={user}
        departments={departments}
      />
      <PositionModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        user={user}
        positions={positions}
      />
      <HourGroupModal
        isOpen={showHourGroupModal}
        onClose={() => setShowHourGroupModal(false)}
        user={user}
        hourGroups={hourGroups}
      />
      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        user={user}
        teams={teams}
      />
      <BonusCategoryModal
        isOpen={showBonusCategoryModal}
        onClose={() => setShowBonusCategoryModal(false)}
        user={user}
        bonusCategories={bonusCategories}
      />
    </Card>
  );
}
