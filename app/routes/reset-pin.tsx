import { useState, useEffect } from "react";
import {
  Link,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, ArrowLeft, Copy, Loader2, LogIn } from "lucide-react";
import { generatePIN } from "~/core/utils/pin.server";
import { ActionFunction, LinksFunction, LoaderFunction } from "@remix-run/node";
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

export function meta() {
  return [
    {
      name: "description",
      content:
        "Demandez un nouveau PIN pour accéder à la plateforme RH de la Pharmacie Val d'Oise.",
    },
    { title: "Demander un nouveau PIN - Pharmacie Val d'Oise" },
  ];
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  const token = params.get("token") as string;
  let tokenIsValid = false;
  try {
    tokenIsValid = await tokenService.verifyToken(
      token,
      config.auth.tokenTypes.RESET_PIN
    );
  } catch (error) {
    console.error("Error verifying token: ", error);
    tokenIsValid = false;
  }
  return Response.json({ token, tokenIsValid });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const action = formData.get("action") as string;

  if (action === "generate") {
    if (typeof token !== "string") {
      return Response.json({ error: "Données invalides" }, { status: 400 });
    }

    // We generate the 4 character PIN
    const pin = generatePIN();

    try {
      const user = await tokenService.resetPIN(token, pin);
      await emailService.sendPINChangedEmail(user.email, user.username);
      return Response.json({ isSubmitted: true, pin });
    } catch (error) {
      return Response.json(
        { error: "Échec de la réinitialisation du PIN" },
        { status: 500 }
      );
    }
  }
};

export default function NewPinGeneratedPage() {
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("light");
  const actionData = useActionData<typeof action>();
  const { token, tokenIsValid } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  useEffect(() => {
    if (!token || !tokenIsValid) {
      setError(
        "Lien invalide ou expiré. Veuillez demander une nouvelle réinitialisation de PIN."
      );
    }
  }, [token, tokenIsValid]);

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


  const copyPin = () => {
    if (actionData?.pin) {
      navigator.clipboard.writeText(actionData.pin);
      const copyButton = document.querySelector(".copy-button");
      if (copyButton) {
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
          copyButton.innerHTML = originalContent;
        }, 2000);
      }
    }
  };
  
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
                    Générer un nouveau PIN
                  </h5>
                </CardTitle>
                <CardDescription className="text-base">
                  {tokenIsValid
                    ? "Cliquez sur le bouton ci-dessous pour générer votre nouveau PIN"
                    : "Votre lien de réinitialisation n'est pas valide"}
                </CardDescription>
              </CardHeader>
  
              <CardContent className="p-6 space-y-6">
                {error ? (
                  actionData?.pin ? (
                    <div className="space-y-6">
                      <Alert>
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="text-base font-medium">
                          Votre nouveau PIN
                        </AlertTitle>
                        <AlertDescription>
                          <div className="flex items-center justify-between mt-3">
                            <code className="bg-muted p-3 rounded text-base">
                              {actionData.pin}
                            </code>
                            <Button
                              variant="outline"
                              className="copy-button h-12 w-12"
                              onClick={copyPin}
                            >
                              <Copy className="h-5 w-5" />
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
  
                      <Alert className="bg-yellow-100">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="text-base font-medium">
                          Attention
                        </AlertTitle>
                        <AlertDescription className="text-base">
                          Ce PIN ne sera affiché qu'une seule fois. Assurez-vous
                          de le copier avant de quitter cette page.
                        </AlertDescription>
                      </Alert>
  
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full h-12 text-base font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                      >
                        <LogIn className="mr-2 h-5 w-5" />
                        Se connecter maintenant
                      </Link>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="text-base font-medium">
                        Erreur
                      </AlertTitle>
                      <AlertDescription className="text-base">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )
                ) : tokenIsValid ? (
                  <Form method="post">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="action" value="generate" />
                    <Button
                      type="submit"
                      className="w-full h-12 text-base"
                      disabled={navigation.state === "submitting"}
                    >
                      {navigation.state === "submitting" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Génération en cours...
                        </span>
                      ) : (
                        "Générer un nouveau PIN"
                      )}
                    </Button>
                  </Form>
                ) : null}
  
                {!actionData?.pin && (
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
                )}
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
                La génération d'un nouveau PIN garantit la sécurité de votre
                compte. Assurez-vous de le mémoriser ou de le stocker en lieu sûr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );  
}
