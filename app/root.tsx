import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCw } from "lucide-react";
import "~/utils/chartjs";

import "./styles/global.css";
import "./tailwind.css";
import { ThemeProvider } from "~/components/val/theme-provider";
import { commitSession, getSession } from "./utils/session.server";
import { useEffect } from "react";


export const loader = async ({ request }: { request: Request }) => {

  const session = await getSession(request.headers.get("Cookie"));
  const theme = session.get("theme") || "light";
  session.set("theme", theme);
  const setCookieHeader = await commitSession(session);

  const env = process.env.NODE_ENV;
  return Response.json(
    { theme, env },
    {
      headers: { "Set-Cookie": setCookieHeader },
    }
  );
};

export const links: LinksFunction = () => [
  // Favicon
  {
    rel: "icon",
    href: "/img/logo-green-1.png",
    type: "image/jpg",
  },
  // Preconnect for fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },

  // Font Stylesheet
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },

  // Stylesheets
  { rel: "stylesheet", href: "/styles/tailwind.css" },
  { rel: "stylesheet", href: "/styles/global.css" },
];

export function meta() {
  return [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    { name: "theme-color", content: " #00787d" },
    {
      name: "description",
      content:
        "Vous êtes au quartier général en ligne de la pharmacie Val d'Oise.",
    },
    { title: "Plateforme RH - Pharmacie Val d'Oise" },
  ];
}

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { theme } = useLoaderData<typeof loader>() || { theme: "light" };
  // Override localstorage key "theme" with the value from the loader data
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <html lang="fr" className={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00787d" />
        <link rel="manifest" href="/manifest.json" />
        <Meta />
        {title ? <title>{title}</title> : null}
        <Links />
        <style>{`
          @media (prefers-color-scheme: dark) {
            :root {
              color-scheme: light;
            }
          }
        `}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { theme, env } = useLoaderData<typeof loader>();

  // Uncomment to enable service worker in production
  useEffect(() => {
    if ("serviceWorker" in navigator && env === "production") {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <Document>
      <ThemeProvider initialTheme={theme}>
        <Outlet />
      </ThemeProvider>
    </Document>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  console.error("Error in root.tsx: ", error);

  let errorTitle: string;
  let errorMessage: string;
  let statusCode: number | null = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorTitle = `${error.status} ${error.statusText}`;
    errorMessage = error.data;
  } else {
    errorTitle = "Unexpected Error";
    errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
  }

  // Handling specific error statuses
  switch (statusCode) {
    case 403:
      return (
        <ErrorPage
          title="403 Forbidden"
          message="You do not have permission to access this resource."
        />
      );

    case 404:
      return (
        <ErrorPage
          title="404 Not Found"
          message="The resource you are looking for does not exist."
        />
      );

    case 500:
      return (
        <ErrorPage
          title="500 Internal Server Error"
          message="Something went wrong. Our team has been notified."
        />
      );

    case 400:
      // 400 errors should ideally be handled at the form-level, not a full-page display.
      console.warn("400 Bad Request: ", errorMessage);
      return null; // No full-page display for 400 errors

    default:
      return <ErrorPage title={errorTitle} message={errorMessage} />;
  }
}

// ErrorPage Component for reusable error layouts
function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <Document title={title}>
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://plus.unsplash.com/premium_photo-1671098088734-8b8532731aef?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        <Card className="max-w-md w-full p-6 text-center space-y-6 bg-white/90 backdrop-blur shadow-xl">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
              <img
                src="/img/logo-rect-white.png"
                alt="logo"
                className="h-auto w-auto mx-auto mb-4"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-teal-800">
              {title}
            </h1>
            <p className="text-gray-600">{message}</p>
          </div>

          <div className="flex justify-center">
            <Button
              asChild
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Link to="/" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Link>
            </Button>
          </div>

          <footer className="text-sm text-gray-600 pt-6 border-t border-gray-200">
            © {new Date().getFullYear()} Pharmacie Val d&apos;Oise - Portail RH
          </footer>
        </Card>
      </div>
    </Document>
  );
}
