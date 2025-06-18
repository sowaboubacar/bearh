import { useState, useEffect } from "react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { taskService } from "~/services/task.service.server";
import { userService } from "~/services/user.service.server";
import { positionService } from "~/services/position.service.server";
import { teamService } from "~/services/team.service.server";
import { departmentService } from "~/services/department.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { accessService } from "~/services/access.service.server";
import { authService } from "~/services/auth.service.server";
import { TaskActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [TaskActions.Edit, TaskActions.EditOwn] }
  });

  try {
    const task = await taskService.readOne({
      id: params.taskId,
      populate: "assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,author"
    });

    if (!task) {
      throw Response.json({ message: "Tâche non trouvée" }, { status: 404 });
    }

    // Check if user has permission to edit this specific task
    const hasFullEditAccess = await authService.can(currentLoggedUser.id, TaskActions.Edit);
    const canEditOwn = await authService.can(currentLoggedUser.id, TaskActions.EditOwn, {
      resourceOwnerId: task.author.id.toString(),
      targetUserId: currentLoggedUser.id
    });

    if (!hasFullEditAccess && !canEditOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const users = await userService.readMany({});
    const positions = await positionService.readMany({});
    const teams = await teamService.readMany({});
    const departments = await departmentService.readMany({});
    const hourGroups = await hourGroupService.readMany({});
    const access = await accessService.readMany({});

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [TaskActions.List, TaskActions.ListOwn]})
    };

    return Response.json({
      task,
      users,
      positions,
      teams,
      departments,
      hourGroups,
      access,
      can,
    });
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ params, request }) => {
  const authenticatedUser = await authService.requireUser(request,{condition: {any: [TaskActions.Edit, TaskActions.EditOwn]}});

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;

  const assignedTo = {
    users: formData.getAll("assignedTo.users") as string[],
    positions: formData.getAll("assignedTo.positions") as string[],
    teams: formData.getAll("assignedTo.teams") as string[],
    departments: formData.getAll("assignedTo.departments") as string[],
    hourGroups: formData.getAll("assignedTo.hourGroups") as string[],
    access: formData.getAll("assignedTo.access") as string[],
  };

  try {
    const updatedTask = await taskService.updateOneAfterFindIt(params.id, {
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      updatedBy: authenticatedUser.id,
    });
    return redirect(`/o/task/view/${params.taskId}`);
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json(
      { success: false, error: "Échec de la mise à jour de la tâche" },
      { status: 400 }
    );
  }
};

export default function EditTask() {
  const { task, users, positions, teams, departments, hourGroups, access, can } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );


  const [assignedTo, setAssignedTo] = useState({
    users: task.assignedTo.users.map(user => user.id),
    positions: task.assignedTo.positions.map(position => position.id),
    teams: task.assignedTo.teams.map(team => team.id),
    departments: task.assignedTo.departments.map(department => department.id),
    hourGroups: task.assignedTo.hourGroups.map(hourGroup => hourGroup.id),
    access: task.assignedTo.access.map(accessItem => accessItem.id),
  });
  const handleAssignedToChange = (category, id) => {
    setAssignedTo((prev) => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter((item) => item !== id)
        : [...prev[category], id],
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/task">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  )}
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier la Tâche
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-8">
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base font-medium">
                  Erreur
                </AlertTitle>
                <AlertDescription className="text-base">
                  {actionData.error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label 
                  htmlFor="title" 
                  className="text-base font-medium"
                >
                  Titre
                </Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="description" 
                  className="text-base font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="min-h-[120px] text-base p-3 resize-y"
                />
              </div>
            </div>
  
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Assigné à
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Utilisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {users.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={assignedTo.users.includes(user.id)}
                            onCheckedChange={() => handleAssignedToChange('users', user.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`user-${user.id}`} 
                            className="text-base"
                          >
                            {user.firstName} {user.lastName}
                          </label>
                          {assignedTo.users.includes(user.id) && (
                            <input type="hidden" name="assignedTo.users" value={user.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Postes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {positions.map((position) => (
                        <div 
                          key={position.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`position-${position.id}`}
                            checked={assignedTo.positions.includes(position.id)}
                            onCheckedChange={() => handleAssignedToChange('positions', position.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`position-${position.id}`} 
                            className="text-base"
                          >
                            {position.title}
                          </label>
                          {assignedTo.positions.includes(position.id) && (
                            <input type="hidden" name="assignedTo.positions" value={position.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
  
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Équipes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {teams.map((team) => (
                        <div 
                          key={team.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={assignedTo.teams.includes(team.id)}
                            onCheckedChange={() => handleAssignedToChange('teams', team.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`team-${team.id}`} 
                            className="text-base"
                          >
                            {team.name}
                          </label>
                          {assignedTo.teams.includes(team.id) && (
                            <input type="hidden" name="assignedTo.teams" value={team.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
  
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Départements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {departments.map((department) => (
                        <div 
                          key={department.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`department-${department.id}`}
                            checked={assignedTo.departments.includes(department.id)}
                            onCheckedChange={() => handleAssignedToChange('departments', department.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`department-${department.id}`} 
                            className="text-base"
                          >
                            {department.name}
                          </label>
                          {assignedTo.departments.includes(department.id) && (
                            <input type="hidden" name="assignedTo.departments" value={department.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
  
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Groupes Horaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {hourGroups.map((hourGroup) => (
                        <div 
                          key={hourGroup.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`hourGroup-${hourGroup.id}`}
                            checked={assignedTo.hourGroups.includes(hourGroup.id)}
                            onCheckedChange={() => handleAssignedToChange('hourGroups', hourGroup.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`hourGroup-${hourGroup.id}`} 
                            className="text-base"
                          >
                            {hourGroup.name}
                          </label>
                          {assignedTo.hourGroups.includes(hourGroup.id) && (
                            <input type="hidden" name="assignedTo.hourGroups" value={hourGroup.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
  
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Groupes d'Accès
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] px-4">
                      {access.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center space-x-3 py-3 border-b last:border-0"
                        >
                          <Checkbox
                            id={`access-${item.id}`}
                            checked={assignedTo.access.includes(item.id)}
                            onCheckedChange={() => handleAssignedToChange('access', item.id)}
                            className="h-5 w-5"
                          />
                          <label 
                            htmlFor={`access-${item.id}`} 
                            className="text-base"
                          >
                            {item.name}
                          </label>
                          {assignedTo.access.includes(item.id) && (
                            <input type="hidden" name="assignedTo.access" value={item.id} />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
  
            <div className="space-y-6">
  
              <div className="space-y-3">
                <Label 
                  htmlFor="dueDate" 
                  className="text-base font-medium"
                >
                  Date d'échéance
                </Label>
                <Input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isSubmitting || navigation.state === "submitting"}
            >
              {isSubmitting || navigation.state === "submitting" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mise à jour en cours...
                </span>
              ) : (
                "Mettre à jour la tâche"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )  
}


