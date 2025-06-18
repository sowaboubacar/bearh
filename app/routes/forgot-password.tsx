import { useEffect, useState } from "react";
import { Link, Form, useActionData, useNavigation } from "@remix-run/react";
import { ActionFunction, json, LinksFunction } from "@remix-run/node";
import emailService from "~/core/utils/email.server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { PharmacyIcons } from "~/components/val/pharmacy-icons";
import { tokenService } from "~/services/token.service.server";
import { userService } from "~/services/user.service.server";
import config from "~/config/config.server";
import { IToken } from "~/core/entities/token.entity.server";
import { authService } from "~/services/auth.service.server";
import { AuthActions } from "~/core/entities/utils/access-permission";




export const links : LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href:
      "https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    rel: "preload",
    as: "image",
    href: "/img/logo-rect-white.png",
  },
  {
    rel: "preload",
    as: "image",
    href: "/img/logo-rect-dark.png",
  },
];

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }

  const user = await userService.readOne({ email });
  if (!user) {
    // But don't show this to the user as it could be a security risk
    return Response.json({ error: "Aucun utilisateur trouvé avec cet email", isSubmitted: true });
  }

  // Ensure user is authorized to reset password
  const canDoThis = await authService.can(user?.id as string,  { any: [
    AuthActions.ChangePassword,
    AuthActions.ResetPassword
  ]})
  if (!canDoThis) {
    return Response.json({ error: "Vous n'êtes pas autorisé à réinitialiser le mot de passe de cet utilisateur" }, { status: 403 });
  }
  
  // We have a user, generate a reset token and send the email
  const token: IToken = await tokenService.generateResetToken(user, config.auth.tokenTypes.RESET_PASSWORD);
  await emailService.sendForgotPasswordEmail(email, token.token);

  return Response.json({ isSubmitted: true });
};

export function meta() {
  return [
    {
      name: "description",
      content:
        "Réinitialisez votre mot de passe pour accéder à la plateforme RH de la Pharmacie Val d'Oise.",
    },
    { title: "Mot de passe oublié - Pharmacie Val d'Oise" },
  ];
}
export default function ForgotPassword() {
  const [theme, setTheme] = useState("light");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch("/api/set-theme");
        if (response.ok) {
          const data = await response.json();
          setTheme(data.theme || "light");
        } else {
          console.error(
            "Erreur lors de la récupération du thème :",
            response.statusText
          );
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du thème :", err);
      }
    };

    fetchTheme();
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full items-center justify-center p-4 lg:w-1/2">
        <div className="w-full max-w-[320px] sm:max-w-sm">
          {theme === "dark" ? (
            <img
              src="/img/logo-rect-dark.png"
              alt="logo"
              className="mx-auto mb-3 h-8 w-auto sm:h-10 sm:mb-4"
            />
          ) : (
            <img
              src="/img/logo-rect-white.png"
              alt="logo"
              className="mx-auto mb-3 h-8 w-auto sm:h-10 sm:mb-4"
            />
          )}
          <p className="mb-4 text-center text-xs text-muted-foreground font-semibold sm:mb-6">
            Portail RH de la Pharmacie Val d&apos;Oise
          </p>
          <Card className="w-full">
            <CardHeader className="space-y-2 sm:space-y-3">
              <CardTitle className="text-center">
                <h5 className="text-2xl font-bold sm:text-3xl">Mot de passe oublié</h5>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Entrez votre adresse e-mail pour recevoir les instructions de
                réinitialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!actionData?.isSubmitted ? (
                <Form method="post" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="moi@PharmacieValDoise.com"
                      required
                      className="h-10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10" 
                    disabled={navigation.state === "submitting"}
                  >
                    {navigation.state === "submitting" ? "Instructions en cours d'envoie..." : "Envoyer les instructions"}
                  </Button>
                </Form>
              ) : (
                <Alert className="text-sm sm:text-base">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <AlertTitle className="font-semibold">Email envoyé</AlertTitle>
                  <AlertDescription>
                    Si un compte existe avec cette adresse e-mail, vous recevrez
                    bientôt les instructions de réinitialisation.
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-4 sm:mt-6">
                <Link
                  to="/"
                  prefetch="intent"
                  disabled={navigation.state === "submitting"}
                  className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Retour à la page de connexion
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            © 2024 Pharm. Val Doise - By Selys-Africa
          </div>
        </div>
      </div>
      <div className="hidden w-1/2 lg:block bg-[url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
        <div className="h-full w-full bg-primary/70 backdrop-blur-sm">
          <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center text-primary-foreground">
            <PharmacyIcons className="h-12 w-12 mb-6 sm:h-16 sm:w-16 sm:mb-8" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Réinitialisation du mot de passe
            </h1>
            <p className="text-base sm:text-lg max-w-lg">
              Nous comprenons que vous puissiez oublier votre mot de passe. Suivez les
              instructions pour le réinitialiser en toute sécurité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

