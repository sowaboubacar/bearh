/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import config from "~/config/config.server";
import { userService } from "~/services/user.service.server";
import { redirect, Session } from "@remix-run/node";
import { commitSession, getSession } from "~/utils/session.server";
import type { IUser } from "~/core/entities/user.entity.server";
import {
  AccessPermission,
  DepartmentActions,
  PermissionCondition,
  PermissionContext,
  permissionHierarchy,
  UserActions,
} from "~/core/entities/utils/access-permission";

/**
 * Authentication service class providing methods for user authentication,
 * token generation, session management, and route protection.
 */
class AuthService {
  private config = config;

  /**
   * Authenticates a user using their email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A Promise that resolves to the authenticated user object if credentials are valid, or null otherwise.
   */
  async withEmailAuthenticate(
    email: string,
    password: string
  ): Promise<IUser | null> {
    const user = await userService.findByEmailAndPassword(email, password);
    if (user) {
      return user;
    }
    return null;
  }

  /**
   * Authenticates a user using a PIN code.
   *
   * @param pin - The PIN code to authenticate with.
   * @returns A Promise that resolves to the authenticated user object if the PIN is valid, or null otherwise.
   */
  async withPinAuthenticate(pin: string): Promise<IUser | null> {
    const user = await userService.findByPin(pin);
    if (user) {
      return user;
    }
    return null;
  }

  /**
   * Generates a signed JWT token for the authenticated user.
   *
   * @param user - The user object for whom to generate the token.
   * @returns A JWT token string signed with the session secret.
   */
  generateToken(user: IUser): string {
    // Include only necessary data in the token payload to minimize exposure.
    const payload = { id: user.id };

    return jwt.sign(payload, this.config.secrets.sessionSecret, {
      expiresIn: "24h",
    });
  }

  /**
   * Retrieves the authenticated user from the session and validates the JWT token.
   * This method is used to protect routes that require authentication.
   *
   * @param request - The incoming HTTP request object.
   * @param canArgs - An object containing the user ID, permission condition, and context for the route. To be passed to the can method.
   * @returns A Promise that resolves to the authenticated user object.
   * @throws Redirects to the login page if the user is not authenticated or the token is invalid.
   */
  async requireUser(
    request: Request,
    canArgs?: {
      userId?: string;
      condition: PermissionCondition;
      context?: PermissionContext;
      effectivePermissionsCache?: {
        isSuperUser: boolean;
        permissions: string[];
      };
    }
  ) {
    try {
      const session = await getSession(request.headers.get("Cookie"));
      const token = session.get("token") as string | undefined;

      if (!token) {
        throw redirect("/", {
          headers: { "Set-Cookie": await commitSession(session) },
        });
      }

      // Verify token
      const decodedToken = jwt.verify(
        token,
        this.config.secrets.sessionSecret
      ) as { id: string };

      // Get user with necessary relations
      const user = await userService.readOne({
        id: decodedToken.id,
        populate: "documents,supervisors,access,avatar",
      });

      if (!user) {
        throw redirect("/", {
          headers: { "Set-Cookie": await commitSession(session) },
        });
      }

      // Check permissions if required
      if (canArgs?.condition) {
        
        // Cache effective permissions for reuse
        const effectivePermissions = await this.effectivePermissions(user.id);
        
        const canPerform = await this.can(
          user.id,
          canArgs.condition,
          canArgs.context,
          effectivePermissions
        );

        if (!canPerform) {
          throw redirect("/o/insufficient-permissions", {
            headers: { "Set-Cookie": await commitSession(session) },
          });
        }
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        const session = await getSession(request.headers.get("Cookie"));
        throw redirect("/", {
          headers: { "Set-Cookie": await commitSession(session) },
        });
      }
      throw error;
    }
  }

  /**
   * Redirects the user to the dashboard if they are already authenticated.
   * This method is used on pages where authenticated users should not access, such as the login page.
   *
   * @param request - The incoming HTTP request object.
   * @returns A Promise that resolves to void.
   * @throws Redirects to the dashboard if the user is authenticated.
   */
  async redirectIfAuthenticated(request: Request): Promise<IUser | null> {
    try {
      const session = await getSession(request.headers.get("Cookie"));
      const token = session.get("token") as string | undefined;

      if (!token) {
        // No token; user is not authenticated
        return null;
      }

      // Verify the token synchronously
      const decodedToken = jwt.verify(
        token,
        this.config.secrets.sessionSecret
      ) as { id: string };

      // Fetch the user from the database
      const user = await userService.readOne({ id: decodedToken.id });

      if (user) {
        const setCookieHeader = await commitSession(session);
        // User is authenticated; redirect to dashboard
        throw redirect("/o/attendance/check-in", {
          headers: { "Set-Cookie": setCookieHeader },
        });
      }

      return null;
    } catch (error) {
      // Token invalid or other error; do nothing
      return null;
    }
  }

  /**
   * Validates the shared authentication token from the session and retrieves the authenticated user.
   * This method is used to protect routes that require shared authentication.
   *
   * @param request - The incoming HTTP request object.
   * @returns A Promise that resolves to the authenticated user if the shared auth is valid, or null otherwise.
   */
  async requiredSharedAuth(
    request: Request
  ): Promise<IUser | null> {
    try {
      const session = await getSession(request.headers.get("Cookie"));
      const sharedAuth = session.get("sharedAuth") as
        | { token: string }
        | undefined;

      if (!sharedAuth || !sharedAuth.token) {
        // No shared auth token; shared auth is not valid
        const setCookieHeader = await commitSession(session);
        // User is authenticated; redirect to dashboard
        throw redirect("/shared-auth-login", {
          headers: { "Set-Cookie": setCookieHeader },
        });
      }

      // Verify the shared auth token synchronously
      const decoded = jwt.verify(
        sharedAuth.token,
        this.config.secrets.sessionSecret
      ) as { id: string };

      // Fetch the user associated with the token
      const user = await userService.readOne({
        id: decoded.id,
        populate: "documents,supervisors,access,avatar",
      });

      if (!user) {
        // User not found; shared auth is not valid
        const setCookieHeader = await commitSession(session);
        // User is authenticated; redirect to dashboard
        throw redirect("/shared-auth-login", {
          headers: { "Set-Cookie": setCookieHeader },
        });
      }

      return user;
    } catch (error) {
      // Token invalid or error occurred; shared auth is not valid
      const setCookieHeader = await commitSession(
        await getSession(request.headers.get("Cookie"))
      );
      // User is authenticated; redirect to dashboard
      throw redirect("/shared-auth-login", {
        headers: { "Set-Cookie": setCookieHeader },
      });
    }
  }

  /**
   * Authenticates a user using a PIN for shared authentication and generates a token.
   *
   * @param pin - The PIN code for shared authentication.
   * @returns A Promise that resolves to an object containing the authenticated user and token if successful, or null otherwise.
   */
  async withPinSharedAuth(
    pin: string
  ): Promise<{ user: IUser; token: string } | null> {
    try {
      // Reuse the existing withPinAuthenticate method
      const user = await this.withPinAuthenticate(pin);

      if (user) {
        const token = this.generateToken(user);
        return { user, token };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Stores the shared authentication token in the session.
   *
   * @param session - The session object to update.
   * @param token - The shared authentication token to store.
   * @returns The updated session object.
   */
  setSharedAuth(session: Session, token: string): Session {
    session.set("sharedAuth", { token });
    return session;
  }

  /**
   * Stores the authentication token in the session.
   *
   * @param session - The session object to update.
   * @param token - The authentication token to store.
   * @returns The updated session object.
   */
  setAuthToken(session: Session, token: string): Session {
    session.set("token", token);
    return session;
  }

  /**
   * Logs out the user by clearing the authentication tokens from the session.
   *
   * @param session - The session object to update.
   * @returns The updated session object.
   */
  logout(session: Session): Session {
    session.unset("token");
    session.unset("sharedAuth");
    return session;
  }

  // Access right logics

  /**
   * Flattens the AccessPermission object into a flat array of permission strings.
   *
   * @param {AccessPermission} permissions - The AccessPermission object.
   * @returns {string[]} - A flat array of permission strings.
   */
  private flattenPermissions(permissions: AccessPermission): string[] {
    if (!permissions) return [];
    return Array.from(new Set(Object.values(permissions).flat()));
  }

  /**
   * Retrieves the user's permissions and position's permissions.
   * The method fetches the user's access and current position's access from the database,
   * flattens the permissions, and returns the user's permissions and position's permissions.
   *
   * @param userId - The ID of the user to retrieve permissions for.
   * @returns {Promise<{ isPharmacyOwner: boolean; userPermissions: string[]; positionPermissions: string[] }>} - An object containing the user's permissions and position's permissions.
   */
  async userPermissions(userId: string): Promise<any> {
    const user = await userService.findUserWithAccess(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is a pharmacy owner
    if (user.role === "pharmacy-owner") {
      return {
        isPharmacyOwner: true,
        userPermissions: ["*"],
        positionPermissions: ["*"],
      };
    }

    // User is an employee; gather permissions from user.access and currentPosition.access
    const userPermissions = this.flattenPermissions(user.access?.permissions);
    const positionPermissions = user.currentPosition?.access?.permissions
      ? this.flattenPermissions(user.currentPosition.access.permissions)
      : [];

    return { isPharmacyOwner: false, userPermissions, positionPermissions };
  }

  /**
   * Retrieves the effective permissions for a user.
   * The method combines the user's permissions and their position's permissions,
   * expands the permissions using the permission hierarchy, and checks if the user is a super user.
   *
   *
   * @param userId The ID of the user to retrieve permissions for.
   * @returns An object containing the user's effective permissions and whether they are a super user.
   */
  async effectivePermissions(
    userId: string
  ): Promise<{ isSuperUser: boolean; permissions: string[] }> {
    
    // Get user permissions and role
    const { isPharmacyOwner, userPermissions, positionPermissions } = await this.userPermissions(userId);

    // Early return for pharmacy owners (superusers)
    if (isPharmacyOwner) {
      return { isSuperUser: true, permissions: ["*"] };
    }

    // Combine permissions from user and position
    const combinedPermissions = Array.from(
      new Set([...userPermissions, ...positionPermissions])
    );

    // Expand permissions using existing hierarchy
    const expandedPermissions = this.expandPermissions(
      combinedPermissions,
      permissionHierarchy
    );

    const isSuperUser = expandedPermissions.includes("*");


    return { isSuperUser, permissions: expandedPermissions };
  }

  /**
   * Expands a set of permissions using the permission hierarchy.
   * The method recursively expands each permission to include all inherited permissions.
   *
   *
   * @param permissions The permissions to expand.
   * @param hierarchy The permission hierarchy object. Defines the inherited permissions for each permission.
   * @returns An array of expanded permissions.
   */
  private expandPermissions(
    permissions: string[],
    hierarchy: { [key: string]: string[] }
  ): string[] {
    const expanded = new Set<string>();

    function recurse(permission: string) {
      if (!expanded.has(permission)) {
        expanded.add(permission);

        const inheritedPermissions = hierarchy[permission];
        if (inheritedPermissions) {
          inheritedPermissions.forEach(recurse);
        }
      }
    }

    permissions.forEach(recurse);

    return Array.from(expanded);
  }

  /**
   * Checks if a user has the required permissions to perform an action.
   * The method uses the effectivePermissions method to determine the user's permissions.
   * If the user is a super user, they have all permissions.
   * If the user has the required permission, the method returns true.
   *
   *
   * @param userId The ID of the user to check permissions for.
   * @param condition The permission condition to check. This can be a string, an object with an "any" or "all" key, or a combination of these.
   * @param context
   * @param effectivePermissionsCache
   * @returns
   */
  async can(
    userId: string,
    condition: PermissionCondition,
    context: PermissionContext = {},
    effectivePermissionsCache?: { isSuperUser: boolean; permissions: string[] }
  ): Promise<boolean> {
    
    // Get or use cached permissions
    const { isSuperUser, permissions } = effectivePermissionsCache || 
      await this.effectivePermissions(userId);

    // Early return for superusers
    if (isSuperUser) {
      return true;
    }

    const checkPermission = async (permCondition: PermissionCondition): Promise<boolean> => {
      if (!permCondition) {
        return false;
      }

      // String permission check
      if (typeof permCondition === "string") {
        const hasPermission = permissions.includes(permCondition);

        // Handle "Own" permissions
        if (permCondition.endsWith("Own")) {
          const isOwner = (context.targetUserId === userId) || 
                         (context.resourceOwnerId === userId);
          return hasPermission && isOwner;
        }

        return hasPermission;
      }

      // ANY conditions
      if ("any" in permCondition) {
        for (const cond of permCondition.any) {
          if (await checkPermission(cond)) {
            return true;
          }
        }
        return false;
      }

      // ALL conditions
      if ("all" in permCondition) {
        for (const cond of permCondition.all) {
          if (!(await checkPermission(cond))) {
            return false;
          }
        }
        return true;
      }

      return false;
    };

    const result = await checkPermission(condition);
    return result;
  }

}

export const authService = new AuthService();
