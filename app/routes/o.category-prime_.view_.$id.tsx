import { type LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { authService } from "~/services/auth.service.server";
import { BonusCategoryActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
 const loggedUser = await authService.requireUser(request, {condition: {any: [BonusCategoryActions.View]}});
  try {
    const bonusCategory = await bonusCategoryService.readOne({
      id: params.id,
      populate: "members",
    });

    if (!bonusCategory) {
      throw Response.json({ message: "bonusCategory non trouvée" }, { status: 404 });
    }

    const can = {
      edit: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.Edit]}),
      list: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.List]}),
    };

    return Response.json({ bonusCategory, can });
  } catch (error) {
    console.error("Error fetching bonusCategory:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération de la bonusCategory.",
      },
      { status: 500 }
    );
  }
};

export default function BonusCategoryDetailPage() {
  const { bonusCategory, can } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/category-prime">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
            Retour à la liste
          </Link>
        </Button>
      )}
  
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {bonusCategory.name}
          </CardTitle>
          {can?.edit && (
          <Button 
            asChild
            className="h-11 w-full sm:w-auto text-base"
          >
            <Link prefetch="intent" to={`/o/category-prime/edit/${bonusCategory.id}`}>
              <Edit className="mr-2 h-5 w-5" />
                Modifier
              </Link>
            </Button>
          )}
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Description</h3>
            <div className="space-y-3">
              <p className="text-base sm:text-lg text-muted-foreground">
                {bonusCategory.baseAmount} FCFA de base 
              </p>
              <p className="text-base sm:text-lg text-muted-foreground">
                {bonusCategory.coefficient} de coefficient multiplicateur de la moyenne des notes KPI
              </p>
              <p className="text-base sm:text-lg text-muted-foreground">
                +/- {bonusCategory.remarkBonusAmount} FCFA par une remarque
              </p>
            </div>
          </div>
  
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Membres</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonusCategory.members?.map((member) => (
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
        </CardContent>
      </Card>
    </div>
  );  
}
