import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Redirect /login to /
  if (path === "/login") {
    return redirect("/");
  }

  return Response.json({ message: "Content for the URL" });
}
