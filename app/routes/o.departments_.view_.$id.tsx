import { type LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  Link,
 
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
 
} from "~/components/ui/card";
import { ArrowLeft, Edit} from "lucide-react";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { departmentService } from "~/services/department.service.server";
import { authService } from "~/services/auth.service.server";
import { DepartmentActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser =await authService.requireUser(request, {condition: {any: [DepartmentActions.View]}});
  try {
    const department = await departmentService.readOne({
      id: params.id,
      populate: "attachments,members",
    });

    if (!department) {
      throw Response.json({ message: "Department non trouvée" }, { status: 404 });
    }
  

    const can = {  
      edit: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Edit ),
      list:  await authService.can(currentLoggedUser?.id as string, DepartmentActions.List ),
    }
    return Response.json({ department , can});
  } catch (error) {
    console.error("Error fetching department:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération de la department.",
      },
      { status: 500 }
    );
  }
};

export default function DepartmentDetailPage() {
  const { department,can  } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">

      { can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/departments">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {department.name}
          </CardTitle>
          {can?.edit && (
             <Button  
            asChild 
            className="h-11 w-full sm:w-auto text-base"
          >
            <Link prefetch="intent" to={`/o/departments/edit/${department.id}`}>
              <Edit className="mr-2 h-5 w-5" />
              Modifier
            </Link>
          </Button>
          )}
        
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Description</h3>
            <p className="text-base text-muted-foreground">
              {department.description || "Aucune description fournie"}
            </p>
          </div>
  
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Membres</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {department.members?.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center p-3 bg-muted rounded-lg"
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3">
                    <AvatarImage 
                      src={member.avatar} 
                      alt={`${member.firstName} ${member.lastName}`} 
                    />
                    <AvatarFallback className="text-base">
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base sm:text-lg">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
              ))}
            </div>
          </div>
  
          {department.attachments && department.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={department.attachments} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );  
}
