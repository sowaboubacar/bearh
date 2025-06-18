import { useState, useEffect } from "react";
import {
  Link,
  useParams,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { ActionFunction, LinksFunction, LoaderFunction } from "@remix-run/node";
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
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { tokenService } from "~/services/token.service.server";
import emailService from "~/core/utils/email.server";
import config from "~/config/config.server";



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


export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const token = params.get("token") as string;
  let tokenIsValid = false;
  try {
    tokenIsValid = await tokenService.verifyToken(
      token,
      config.auth.tokenTypes.RESET_PASSWORD
    );
  } catch (error) {
    console.error("Error verifying token: ", error);
    tokenIsValid = false;
  }
  return Response.json({ token, tokenIsValid });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const token = formData.get("token") as string;

  if (
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    typeof token !== "string"
  ) {
    return Response.json({ error: "Données invalides" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return Response.json(
      { error: "Les mots de passe ne correspondent pas" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères" },
      { status: 400 }
    );
  }

  try {
    const user = await tokenService.resetPassword(token, password);
    await emailService.sendPasswordChangedEmail(user.email, user.username);
    return Response.json({ isSubmitted: true });
  } catch (error) {
    return Response.json(
      { error: "Échec de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
};

export function meta() {
  return [
    {
      name: "description",
      content:
        "Réinitialisez votre mot de passe pour accéder à la plateforme RH de la Pharmacie Val d'Oise.",
    },
    { title: "Nouveau mot de passe - Pharmacie Val d'Oise" },
  ];
}

export default function ResetPassword() {
  const [theme, setTheme] = useState("light");
  const actionData = useActionData<typeof action>();
  const { token, tokenIsValid } = useLoaderData<typeof loader>();
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex w-full lg:w-1/2">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-6">
            {theme === "dark" ? (
              <img
                src="/img/logo-rect-dark.png"
                alt="logo"
                className="h-12 sm:h-14 w-auto mx-auto"
              />
            ) : (
              <img
                src="/img/logo-rect-white.png"
                alt="logo"
                className="h-12 sm:h-14 w-auto mx-auto"
              />
            )}
            
            <p className="text-center text-base text-muted-foreground font-semibold">
              Portail RH de la Pharmacie Val d'Oise
            </p>
  
            <Card className="w-full">
              <CardHeader className="space-y-3 p-6">
                <CardTitle className="text-center">
                  <h5 className="text-xl sm:text-2xl font-bold">
                    Réinitialisation du mot de passe
                  </h5>
                </CardTitle>
                <CardDescription className="text-base">
                  {actionData?.isSubmitted
                    ? "Votre mot de passe a été réinitialisé avec succès"
                    : tokenIsValid
                    ? "Entrez votre nouveau mot de passe ci-dessous"
                    : "Le lien de réinitialisation est invalide ou a expiré"}
                </CardDescription>
              </CardHeader>
  
              <CardContent className="p-6 space-y-6">
                {actionData?.isSubmitted ? (
                  <Alert>
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base font-medium">
                      Mot de passe réinitialisé
                    </AlertTitle>
                    <AlertDescription className="text-base">
                      Votre mot de passe a été réinitialisé avec succès. Vous
                      pouvez maintenant vous connecter avec votre nouveau mot de
                      passe.
                    </AlertDescription>
                  </Alert>
                ) : !tokenIsValid ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base font-medium">
                      Erreur
                    </AlertTitle>
                    <AlertDescription className="text-base">
                      Le lien de réinitialisation est invalide ou a expiré.
                      Veuillez demander un nouveau lien.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Form method="post" className="space-y-6">
                    <input type="hidden" name="token" value={token} />
                    
                    <div className="space-y-3">
                      <Label 
                        htmlFor="password"
                        className="text-base font-medium"
                      >
                        Nouveau mot de passe
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="h-12 text-base"
                      />
                    </div>
  
                    <div className="space-y-3">
                      <Label 
                        htmlFor="confirmPassword"
                        className="text-base font-medium"
                      >
                        Confirmer le mot de passe
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="h-12 text-base"
                      />
                    </div>
  
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
  
                    <Button
                      type="submit"
                      className="w-full h-12 text-base"
                      disabled={navigation.state === "submitting"}
                    >
                      {navigation.state === "submitting" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Réinitialisation en cours...
                        </span>
                      ) : (
                        "Réinitialiser le mot de passe"
                      )}
                    </Button>
                  </Form>
                )}
  
                <div className="pt-4">
                  <Link
                    to="/"
                    prefetch="intent"
                    className="inline-flex items-center text-base text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Retour à la page de connexion
                  </Link>
                </div>
              </CardContent>
            </Card>
  
            <div className="text-center text-base text-muted-foreground">
              © 2024 Pharm. Val Doise - By Selys-Africa
            </div>
          </div>
        </div>
      </div>
  
      <div className="hidden lg:block w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
          }}
        >
          <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm">
            <div className="flex h-full flex-col items-center justify-center px-12 text-center text-primary-foreground">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Sécurité renforcée
              </h1>
              <p className="text-lg sm:text-xl">
                La réinitialisation de votre mot de passe garantit la sécurité de
                votre compte. Choisissez un mot de passe fort pour protéger vos
                informations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );  
}




