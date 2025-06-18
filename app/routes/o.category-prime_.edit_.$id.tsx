/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  Form,
  Link,
  useRouteError,
  isRouteErrorResponse,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { authService } from "~/services/auth.service.server";
import { userService } from "~/services/user.service.server";
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { BonusCategoryActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  await authService.requireUser(request, {condition: BonusCategoryActions.Edit});

  try {
    const bonusCategory = await bonusCategoryService.readOne({
      id: params.id,
      populate: "members",
    });

    if (!bonusCategory) {
      throw Response.json(
        { message: "Catégorie non trouvé" },
        { status: 404 }
      );
    }

    const users = await userService.readMany({}); // Adjust this to fetch only users who can be managers

    return Response.json({ bonusCategory, users });
  } catch (error) {
    console.error("Error fetching bonusCategory:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération du département.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  await authService.requireUser(request, {condition: BonusCategoryActions.Edit});

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const baseAmount = Number(formData.get("baseAmount"));
  const remarkBonusAmount = Number(formData.get("remarkBonusAmount"));
  const coefficient = Number(formData.get("coefficient"));
  const members = formData.getAll("members") as string[];

  try {
    const dp = await bonusCategoryService.updateOneAfterFindIt(
      params.id as string,
      { 
        name, 
        baseAmount,
        remarkBonusAmount,
        coefficient,
        members
       }
    );

     // @ts-ignore
     await Promise.all(dp.members?.map((member) => userService.updateCurrentBonusCategory(dp?.id, member)));
    return redirect(`/o/category-prime/view/${dp?.id}`);
  } catch (error) {
    console.error("Error updating bonusCategory:", error);
    return Response.json(
      {
        error: "Une erreur est survenue lors de la mise à jour du département.",
      },
      { status: 400 }
    );
  }
};

export default function EditBonusCategoryPage() {
  const { bonusCategory, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [name, setName] = useState(bonusCategory.name);
  const [baseAmount, setBaseAmount] = useState(bonusCategory.baseAmount);
  const [remarkBonusAmount, setRemarkBonusAmount] = useState(bonusCategory.remarkBonusAmount);
  const [coefficient, setCoefficient] = useState(bonusCategory.coefficient);


  const isSubmitting = navigation.state === "submitting";
  
  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submit(formData, { method: "post" });
  };


  const [members, setMembers] = useState<string[]>(
    bonusCategory.members.map((member: any) => member.id)
  );
  const handleMemberToggle = (userId: string) => {
    setMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
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
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier le Catégorie
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base">Erreur</AlertTitle>
                <AlertDescription className="text-base">
                  {actionData.error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="name" className="text-base font-medium">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="baseAmount" className="text-base font-medium">
                Montant de base
              </Label>
              <Input
                id="baseAmount"
                name="baseAmount"
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="coefficient" className="text-base font-medium">
                Coefficient
              </Label>
              <Input
                id="coefficient"
                name="coefficient"
                type="number"
                value={coefficient}
                onChange={(e) => setCoefficient(Number(e.target.value))}
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="remarkBonusAmount" className="text-base font-medium">
                Montant de la remarque
              </Label>
              <Input
                id="remarkBonusAmount"
                name="remarkBonusAmount"
                type="number"
                value={remarkBonusAmount}
                onChange={(e) => setRemarkBonusAmount(Number(e.target.value))}
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-base font-medium">Membres</Label>
              <Card>
                <ScrollArea className="h-72 sm:h-80 w-full rounded-md border p-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 py-3 sm:py-4"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={members.includes(user.id)}
                        onCheckedChange={() => handleMemberToggle(user.id)}
                        className="h-5 w-5 sm:h-6 sm:w-6"
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {user.firstName} {user.lastName}
                      </label>
                      {members.includes(user.id) && (
                        <input type="hidden" name="members" value={user.id} />
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                "Mettre à jour le Catégorie"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
