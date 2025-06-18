import {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useNavigate,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { useEffect, useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ErrorComponent } from "~/components/val/error-component";
import { AuthActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { commitSession, getSession } from "~/utils/session.server";

export function meta() {
  return [
    {
      name: "description",
      content:
        "Accédez à votre espace personnel sur la plateforme RH de la Pharmacie Val d'Oise.",
    },
    { title: "Accéder à votre espace - Pharmacie Val d'Oise" },
  ];
}

export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
  //await authService.redirectIfAuthenticated(request);
  return Response.json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const pin = formData.get("pin") as string;
  const loginMethod = formData.get("loginMethod") as string;

  if (loginMethod === "email") {
    const user = await authService.withEmailAuthenticate(email, password);
    if (!user) {
      return Response.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    //Ensure User have the right to access the platform with email
    // const canLoginWithPassword = await authService.can(user.id as string, {
    //   all: [AuthActions.LoginWithPassword],
    // });

    // if (!canLoginWithPassword) {
    //   return Response.json(
    //     { error: "Vous n'avez pas le droit de vous connecter avec ces identifiants" },
    //     { status: 401 }
    //   );
    // }
    // Generate and save the token
    const token = authService.generateToken(user);
    const session = await getSession(request.headers.get("Cookie"));
    authService.setAuthToken(session, token);

    return redirect("/o/attendance/check-in", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else if (loginMethod === "pin") {
    const user = await authService.withPinAuthenticate(pin);
    if (!user) {
      return Response.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Ensure User have the right to access the platform with pin
    const canLoginWithPin  = await authService.can(user.id as string, {
      all: [AuthActions.LoginWithPassword],
    });

    if (!canLoginWithPin) {
      return Response.json(
        { error: "Vous n'avez pas le droit de vous connecter avec ces identifiants" },
        { status: 401 }
      );
    }

    const token = authService.generateToken(user);
    const session = await getSession(request.headers.get("Cookie"));
    authService.setAuthToken(session, token);
    const setCookieHeader = await commitSession(session);

    return redirect("/o/attendance/check-in", {
      headers: {
        "Set-Cookie": setCookieHeader,
      },
    });
  }
  return null;
};

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState("pin");
  const navigate = useNavigate();
  const gotoAttendance = (e) => {
    e.preventDefault();
    navigate("/check");
  };
  //navigate("/check");
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
      <div className="flex w-full items-center justify-center p-3 sm:p-4 lg:w-1/2 auth-blank-bg">
        <div className="w-full max-w-[300px] xs:max-w-[320px] sm:max-w-sm">
          {theme === "dark" ? (
            <img
              src="/img/logo-rect-dark.png"
              alt="logo"
              className="mx-auto mb-3 h-7 w-auto xs:h-8 sm:h-10 sm:mb-4"
            />
          ) : (
            <img
              src="/img/logo-rect-white.png"
              alt="logo"
              className="mx-auto mb-3 h-7 w-auto xs:h-8 sm:h-10 sm:mb-4"
            />
          )}
          <p className="mb-4 text-center text-[11px] xs:text-xs text-muted-foreground font-semibold sm:mb-6">
            Bienvenue sur le portail RH de la Pharmacie Val d'Oise :::
          </p>
          <Card className="w-full card-auth">
            <CardHeader className="text-center px-3 py-4 xs:p-4 sm:p-6">
              <CardTitle>
                <h5 className="mb-1.5 text-xl xs:text-2xl font-bold sm:text-3xl sm:mb-2">
                  Connexion
                </h5>
                {actionData?.error && (
                  <p className="text-xs xs:text-sm text-red-500">
                    {actionData.error}
                  </p>
                )}
              </CardTitle>
              <CardDescription className="text-xs xs:text-sm sm:text-base">
                Entrez vos informations pour vous connecter à votre compte
              </CardDescription>
            </CardHeader>
            <Form method="post">
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <input type="hidden" name="loginMethod" value={loginMethod} />
                <Tabs defaultValue="pin" onValueChange={setLoginMethod}>
                  <TabsList className="grid h-9 xs:h-10 w-full grid-cols-2 mb-3 sm:mb-4">
                    <TabsTrigger value="pin" className="text-xs xs:text-sm">
                      Code PIN
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-xs xs:text-sm">
                      Email
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pin">
                    <div className="grid gap-3 sm:gap-4">
                      <div className="grid gap-1.5 sm:gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pin" className="text-xs xs:text-sm">
                            Code PIN
                          </Label>
                          <Link
                            prefetch="intent"
                            to="/forgot-pin"
                            className="text-[11px] xs:text-xs underline sm:text-sm"
                          >
                            PIN oublié ?
                          </Link>
                        </div>
                        <Input
                          id="pin"
                          type="password"
                          name="pin"
                          placeholder="Entrez votre code PIN"
                          required
                          className="h-9 text-xs xs:h-10 xs:text-sm"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-9 text-xs xs:h-10 xs:text-sm"
                        disabled={navigation.state === "submitting"}
                      >
                        {navigation.state === "submitting"
                          ? "Connexion en cours..."
                          : "Se connecter"}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="email">
                    <div className="grid gap-3 sm:gap-4">
                      <div className="grid gap-1.5 sm:gap-2">
                        <Label htmlFor="email" className="text-xs xs:text-sm">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="moi@PharmacieValDoise.com"
                          required
                          className="h-9 text-xs xs:h-10 xs:text-sm"
                        />
                      </div>
                      <div className="grid gap-1.5 sm:gap-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="password"
                            className="text-xs xs:text-sm"
                          >
                            Mot de passe
                          </Label>
                          <Link
                            prefetch="intent"
                            to="/forgot-password"
                            className="text-[11px] xs:text-xs underline sm:text-sm"
                          >
                            Mot de passe oublié ?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          name="password"
                          required
                          className="h-9 text-xs xs:h-10 xs:text-sm"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-9 text-xs xs:h-10 xs:text-sm"
                        disabled={navigation.state === "submitting"}
                      >
                        {navigation.state === "submitting"
                          ? "Connexion en cours..."
                          : "Se connecter"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                <Button
                  onClick={gotoAttendance}
                  variant="outline"
                  className="mt-3 w-full h-9 text-xs xs:h-10 xs:text-sm sm:mt-4"
                  disabled={navigation.state === "submitting"}
                >
                  Point ma Présence
                </Button>
              </CardContent>
            </Form>
          </Card>
          <div className="mt-3 text-center text-[11px] xs:text-xs text-muted-foreground sm:mt-4">
            © 2024 Pharm. Val Doise - By Selys-Africa
          </div>
        </div>
      </div>

      <div className="hidden w-1/2 lg:block bg-[url('https://images.unsplash.com/photo-1562243061-204550d8a2c9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
        <div className="h-full w-full bg-primary/70">
          <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center text-primary-foreground">
            <h1 className="text-xl xs:text-2xl font-bold mb-2 sm:text-3xl lg:text-4xl">
              Bienvenue sur ValDoiseRH
            </h1>
            <p className="text-sm xs:text-base sm:text-lg">
              Le quartier général online de la Pharmacie Val d&apos;Oise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
