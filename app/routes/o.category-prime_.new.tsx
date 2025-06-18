/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type ActionFunction, type LoaderFunction, redirect, json } from "@remix-run/node";
import { useActionData, useNavigation, Form, Link, useRouteError, isRouteErrorResponse, useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { authService } from "~/services/auth.service.server";
import { userService } from "~/services/user.service.server";
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
 import { BonusCategoryActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: BonusCategoryActions.Create});
  const users = await userService.readMany({}); // Adjust this to fetch only users who can be managers
  return Response.json({ users });
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: BonusCategoryActions.Create});

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const baseAmount = Number(formData.get("baseAmount")); 
  const remarkBonusAmount = Number(formData.get("remarkBonusAmount"));
  const coefficient = Number(formData.get("coefficient"));
  const members = formData.getAll("members") as string[];

  try {
   const dp = await bonusCategoryService.createOne({ 
      name, 
      baseAmount,
      remarkBonusAmount,
      coefficient,
      members
    });

  // @ts-ignore
  await Promise.all(dp.members?.map((member) => userService.updateCurrentBonusCategory(dp?.id, member)));
  
    return redirect(`/o/category-prime/view/${dp.id}`);
  } catch (error) {
    console.error("Error creating department:", error);
    return Response.json({ error: "Une erreur est survenue lors de la création du categorie." }, { status: 400 });
  }
};

export default function NewConusCategoryPage() {
  const { users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [baseAmount, setBaseAmount] = useState(0);
  const [remarkBonusAmount, setRemarkBonusAmount] = useState(0);
  const [coefficient, setCoefficient] = useState(0);


  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submit(formData, { method: 'post' });
  };

  const [members, setMembers] = useState<string[]>([]);
  const handleMemberToggle = (userId: string) => {
    setMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
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
            Nouvelle Catégorie
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
                Titre
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
              <Label className="text-base font-medium">
                Membres du départment
              </Label>
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
                  Création en cours...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}

