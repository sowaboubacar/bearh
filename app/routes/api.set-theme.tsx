import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { authService } from "~/services/auth.service.server";
import { commitSession, getSession } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request);
  const { theme, isSidebarOpen } = await request.json();
  const session = await getSession(request.headers.get("Cookie"));

  session.set("theme", theme);
  session.set("isSidebarOpen", isSidebarOpen);

  const setCookieHeader = await commitSession(session);

  return Response.json(
    { success: true, theme, isSidebarOpen },
    {
      headers: { "Set-Cookie": setCookieHeader },
    }
  );
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const theme = session.get("theme") || "light";
  const isSidebarOpen = session.get("isSidebarOpen") || true;

  session.set("theme", theme);
  session.set("isSidebarOpen", isSidebarOpen);
  const setCookieHeader = await commitSession(session);
  return Response.json(
    { theme, isSidebarOpen },
    {
      headers: { "Set-Cookie": setCookieHeader },
    }
  );
};
