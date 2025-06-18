import { createDatabaseSessionStorage } from "./session-db-storage.server";
import { createCookie } from '@remix-run/node';
import config from "~/config/config.server";

const sessionCookie = createCookie("__session", {
  httpOnly: true,
  secure: config.isProduction && process.env.NODE_ENV === "production", // Ensure secure is false in development
  secrets: config.secrets.sessionSecrets,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

// Create the session storage
export const sessionStorage = createDatabaseSessionStorage({
  cookie: sessionCookie,
});


export const { getSession, commitSession, destroySession } = sessionStorage;