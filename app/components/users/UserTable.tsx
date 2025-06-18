import { useState } from "react";
import { Link, useFetcher } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { ObservationModal } from "~/components/users/ObservationModal";
import { EvaluationModal } from "~/components/users/EvaluationModal";
import { TaskAssignModal } from "~/components/users/TaskAssignModal";
import { AccessRightModal } from "~/components/users/AccessRightModal";
import { DepartmentModal } from "~/components/users/DepartmentModal";
import { PositionModal } from "~/components/users/PositionModal";
import { HourGroupModal } from "~/components/users/HourGroupModal";
import { TeamModal } from "~/components/users/TeamModal";
import { BonusCategoryModal } from "~/components/users/BonusCategoryModal";
import type { IUser } from "~/core/entities/user.entity.server";
import {
  Trash2Icon,
  PencilIcon,
  UserPlusIcon,
  ClipboardListIcon,
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  LayersIcon,
  FileTextIcon,
  CoinsIcon,
  Info,
  Badge,
  BadgeCheckIcon,
  Award,
} from "lucide-react";
import { IAccess } from "~/core/entities/access.entity.server";
import { IBonusCategory } from "~/core/entities/bonusCategory.entity.server";
import { IDepartment } from "~/core/entities/department.entity.server";
import { IHourGroup } from "~/core/entities/hourGroup.entity.server";
import { IKpiForm } from "~/core/entities/kpiForm.entity.server";
import { IPosition } from "~/core/entities/position.entity.server";
import { ITask } from "~/core/entities/task.entity.server";
import { ITeam } from "~/core/entities/team.entity.server";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "~/lib/utils";

interface UserTableProps {
  users: IUser[];

  applicableKpis?: Record<string, IKpiForm[]>;
  tasks?: ITask[];
  accesses?: IAccess[];
  departments?: IDepartment[];
  hourGroups?: IHourGroup[];
  teams?: ITeam[];
  positions?: IPosition[];
  bonusCategories?: IBonusCategory[];
  isWinnerRecords?: Record<string, any>;
  can?: Record<string, boolean>;
}

export function UserTable({
  users,
  applicableKpis = {},
  tasks,
  accesses,
  departments,
  hourGroups,
  teams,
  positions,
  bonusCategories,
  isWinnerRecords,
  can
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showTaskAssignModal, setShowTaskAssignModal] = useState(false);
  const [showAccessRightModal, setShowAccessRightModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showHourGroupModal, setShowHourGroupModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBonusCategoryModal, setShowBonusCategoryModal] = useState(false);

  const fetcher = useFetcher();

  const handleAction = (user: IUser, action: string) => {
    setSelectedUser(user);
    switch (action) {
      case "observation":
        setShowObservationModal(true);
        break;
      case "evaluation":
        setShowEvaluationModal(true);
        break;
      case "task":
        setShowTaskAssignModal(true);
        break;
      case "access":
        setShowAccessRightModal(true);
        break;
      case "department":
        setShowDepartmentModal(true);
        break;
      case "position":
        setShowPositionModal(true);
        break;
      case "hourGroup":
        setShowHourGroupModal(true);
        break;
      case "team":
        setShowTeamModal(true);
        break;
      case "bonusCategory":
        setShowBonusCategoryModal(true);
        break;
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      fetcher.submit(
        { _action: "delete", userId },
        { method: "post", action: "/o/users" }
      );
    }
  };

  return (
    <div className="w-full overflow-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-semibold whitespace-nowrap">
              Nom
            </TableHead>
            <TableHead className="text-base font-semibold whitespace-nowrap">
              Email
            </TableHead>
            <TableHead className="text-base font-semibold whitespace-nowrap">
              Poste
            </TableHead>
            <TableHead className="text-base font-semibold whitespace-nowrap">
              Statut
            </TableHead>
            <TableHead className="text-base font-semibold whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users &&
            users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-base font-medium whitespace-nowrap truncate ">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      className={cn(
                        "h-20 w-20 sm:h-16 sm:w-16",
                        {
                          "border-yellow-300 border-2":
                            isWinnerRecords &&
                            isWinnerRecords[user.id]?.isWinner === true,
                          "border-white":
                            isWinnerRecords[user.id]?.isWinner !== true,
                        }
                      )}
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
                    {user.firstName} {user.lastName}
                  </div>
                </TableCell>
                <TableCell className="text-base whitespace-nowrap">
                  {user.email}
                </TableCell>
                <TableCell className="text-base whitespace-nowrap">
                  {user.currentPosition
                    ? user.currentPosition?.title
                    : "Aucun poste"}
                </TableCell>
                <TableCell className="text-base whitespace-nowrap">
                  {user.status && (
                    <div className=" bg-emerald-600 text-white px-2 py-1 rounded-md">
                      {user.status}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 sm:gap-3">
                   {
                    can?.view && ( <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="h-10 w-10"
                    >
                      <Link to={`/o/users/view/${user.id}`}>
                        <Info className="h-5 w-5" />
                      </Link>
                    </Button>)
                   }
                   
                   { can?.edit && ( <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="h-10 w-10"
                    >
                      <Link to={`/o/users/edit/${user.id}`}>
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                    </Button>)}
                   
                   { can?.delete_ && (  <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                      className="h-10 w-10"
                    >
                      <Trash2Icon className="h-5 w-5" />
                    </Button>)}
                   
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-10 px-4 text-base"
                        >
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">

                        {can?.quickMakeObservation && ( <DropdownMenuItem
                          onSelect={() => handleAction(user, "observation")}
                          className="text-base py-2"
                        >
                          <ClipboardListIcon className="mr-2 h-5 w-5" />
                          <span>Observation</span>
                        </DropdownMenuItem>)}
                        {can?.quickMakeKpiEvaluation && (
                          <DropdownMenuItem
                          onSelect={() => handleAction(user, "evaluation")}
                          className="text-base py-2"
                        >
                          <UserPlusIcon className="mr-2 h-5 w-5" />
                          <span>Évaluer</span>
                        </DropdownMenuItem>)}

                        {can?.quickAssignTask && (<DropdownMenuItem
                          onSelect={() => handleAction(user, "task")}
                          className="text-base py-2"
                        >
                          <BriefcaseIcon className="mr-2 h-5 w-5" />
                          <span>Assigner tâche</span>
                        </DropdownMenuItem>)}
                        
                        <DropdownMenuSeparator />

                        {can?.quickChangeAccess && (
                          <DropdownMenuItem
                            onSelect={() => handleAction(user, "access")}
                            className="text-base py-2"
                          >
                            <LayersIcon className="mr-2 h-5 w-5" />
                            <span>Droits d'accès</span>
                          </DropdownMenuItem>
                        )}

                        {can?.quickChangeDepartment && (
                          <DropdownMenuItem
                          onSelect={() => handleAction(user, "department")}
                          className="text-base py-2"
                        >
                          <UsersIcon className="mr-2 h-5 w-5" />
                          <span>Département</span>
                        </DropdownMenuItem>
                        )}
                        
                        {can?.quickChangePosition && (
                          <DropdownMenuItem
                          onSelect={() => handleAction(user, "position")}
                          className="text-base py-2"
                        >
                          <BriefcaseIcon className="mr-2 h-5 w-5" />
                          <span>Poste</span>
                        </DropdownMenuItem>
                        )}

                        {can?.quickChangeHourGroup && (
                          <DropdownMenuItem
                          onSelect={() => handleAction(user, "hourGroup")}
                          className="text-base py-2"
                        >
                          <ClockIcon className="mr-2 h-5 w-5" />
                          <span>Groupe horaire</span>
                        </DropdownMenuItem>
                        )}
                        
                        {can?.quickChangeTeam && (
                            <DropdownMenuItem
                            onSelect={() => handleAction(user, "team")}
                            className="text-base py-2"
                          >
                            <UsersIcon className="mr-2 h-5 w-5" />
                            <span>Équipe</span>
                          </DropdownMenuItem>
                        )}
                      
                        <DropdownMenuSeparator />

                        {can?.quickChangeBonusCategory && (
                          <DropdownMenuItem
                          onSelect={() => handleAction(user, "bonusCategory")}
                          className="text-base py-2"
                        >
                          <LayersIcon className="mr-2 h-5 w-5" />
                          <span>Catégories de prime</span>
                        </DropdownMenuItem>
                        )}

                        
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <>
          <ObservationModal
            isOpen={showObservationModal}
            onClose={() => setShowObservationModal(false)}
            user={selectedUser}
          />
          <EvaluationModal
            isOpen={showEvaluationModal}
            onClose={() => setShowEvaluationModal(false)}
            user={selectedUser}
            applicableKpis={
              applicableKpis ? applicableKpis[selectedUser?.id as string] : []
            }
          />
          <TaskAssignModal
            isOpen={showTaskAssignModal}
            onClose={() => setShowTaskAssignModal(false)}
            user={selectedUser}
            tasks={tasks}
          />
          <AccessRightModal
            isOpen={showAccessRightModal}
            onClose={() => setShowAccessRightModal(false)}
            user={selectedUser}
            accesses={accesses}
          />
          <DepartmentModal
            isOpen={showDepartmentModal}
            onClose={() => setShowDepartmentModal(false)}
            user={selectedUser}
            departments={departments}
          />
          <PositionModal
            isOpen={showPositionModal}
            onClose={() => setShowPositionModal(false)}
            user={selectedUser}
            positions={positions}
          />
          <HourGroupModal
            isOpen={showHourGroupModal}
            onClose={() => setShowHourGroupModal(false)}
            user={selectedUser}
            hourGroups={hourGroups}
          />
          <TeamModal
            isOpen={showTeamModal}
            onClose={() => setShowTeamModal(false)}
            user={selectedUser}
            teams={teams}
          />
          <BonusCategoryModal
            isOpen={showBonusCategoryModal}
            onClose={() => setShowBonusCategoryModal(false)}
            user={selectedUser}
            bonusCategories={bonusCategories}
          />
        </>
      )}
    </div>
  );
}
