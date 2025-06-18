import { ActionFunction, redirect } from "@remix-run/node";
import { getSession, destroySession } from "~/utils/session.server";
import { authService } from "~/services/auth.service.server";

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request);
  const session = await getSession(request.headers.get("Cookie"));
  authService.logout(session);
  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
};
