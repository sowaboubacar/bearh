import { ActionFunction } from "@remix-run/node";
import { ObservationActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { observationService } from "~/services/observation.service.server";

export const action: ActionFunction = async ({ request }) => {
    // Always require user authentication before any other operation
    const authenticatedUser = await authService.requireUser(request,
     {
      condition: {any:  [
        UserActions.QuickMakeObservation,
        ObservationActions.Create,
      ]}
     }
    );
  
    const formData = await request.formData();
    const user = formData.get("user") as string;
    const type = formData.get("type") as string;
    const content = formData.get("content") as string;
  
    try {
      const observation = await observationService.createOne({
        user,
        type,
        content,
        author: authenticatedUser.id, // Set the authenticated user as the author
      });
     return Response.json({
        success: true,
        observation
     })
    } catch (error) {
      console.error("Error creating observation:", error);
      return Response.json(
        { success: false, error: "Échec de la création de l'observation" },
        { status: 400 }
      );
    }
  };