import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authService } from "~/services/auth.service.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const loggedUser = await authService.requireUser(request);
  return redirect("/o/attendance/check-in");
}
