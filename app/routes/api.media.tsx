import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { documentService } from "~/services/document.service.server";
import { authService } from "~/services/auth.service.server";
import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { DocumentActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [DocumentActions.ListOwn, DocumentActions.List] }
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const filter = searchParams.get("filter") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  // Create base query with filter
  let query: any = {
    label: { $regex: filter, $options: "i" }
  };

  // If user only has ListOwn permission, filter for their documents
  const hasFullListAccess = await authService.can(currentUser.id, DocumentActions.List);
  if (!hasFullListAccess) {
    query = {
      $and: [
        query,
        {
          $or: [
            { owner: currentUser.id },
            { "availableFor.users": currentUser.id },
            { "availableFor.access": "all" },
          ],
        }
      ]
    };
  }

  const documents = await documentService.readManyPaginated(
    query,
    {
      page: filter ? 1 : page,
      limit,
      sortBy: "updatedAt:desc",
      populate: "owner,uploadedBy,availableFor.users,availableFor.departments,availableFor.teams,availableFor.positions,availableFor.hourGroups",
    }
  );

  const can = {
    view: await authService.can(currentUser?.id as string, {
      any: [DocumentActions.ViewOwn, DocumentActions.View],
    }),
    edit: await authService.can(currentUser?.id as string, {
      any: [DocumentActions.EditOwn, DocumentActions.Edit],
    }),
    delete: await authService.can(currentUser?.id as string, {
      any: [DocumentActions.DeleteOwn, DocumentActions.Delete],
    }),
    upload: await authService.can(currentUser?.id as string, {
      any: [DocumentActions.Upload, DocumentActions.InFormUpload],
    }),
    list: await authService.can(currentUser?.id as string, {
      any: [DocumentActions.ListOwn, DocumentActions.List],
    }),
  };

  return Response.json({ documents, can });
};

export const action: ActionFunction = async ({ request }) => {
  let requiredPermission;
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      maxPartSize: 500_000_000,
      file: ({ filename }) => filename,
    }),
    unstable_createMemoryUploadHandler()
  );
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const action = formData.get("_action");

  switch (action) {
    case "upload":
      requiredPermission = DocumentActions.Upload;
      break;
    case "quick_upload":
      requiredPermission = DocumentActions.InFormUpload;
      break;
    case "update":
      requiredPermission = {any: [DocumentActions.Edit, DocumentActions.EditOwn]};
      break;
    case "delete":
      requiredPermission = {any: [DocumentActions.Delete, DocumentActions.DeleteOwn]};
      break;
    default:
      return Response.json(
        { success: false, error: "Action not supported" },
        { status: 400 }
      );
  }

  const currentUser = await authService.requireUser(request, {
    condition: requiredPermission,
  });

  if (!action) {
    return Response.json(
      { success: false, error: "Aucune action spécifiée" },
      { status: 400 }
    );
  }

  switch (action) {
    case "upload": {
      const files = formData.getAll("files") as File[];
      const userId = currentUser.id as string;
      const label = (formData.get("label") as string) || "";
      const description = (formData.get("description") as string) || "";

      if (files.length === 0) {
        return Response.json(
          { success: false, error: "Aucun fichier téléchargé" },
          { status: 400 }
        );
      }

      try {
        const uploadedDocuments = await Promise.all(
          files.map((file) =>
            documentService.uploadFile(file, userId, { label, description })
          )
        );
        return Response.json({ success: true, documents: uploadedDocuments });
      } catch (error) {
        console.error("Erreur lors du téléchargement des fichiers:", error);
        return Response.json(
          {
            success: false,
            error: "Erreur lors du téléchargement des fichiers",
          },
          { status: 500 }
        );
      }
    }

    case "quick_upload": {
      const files = formData.getAll("files") as File[];
      const quickUser = formData.get("quickUser") as string;
      const label = (formData.get("label") as string) || "";
      const description = (formData.get("description") as string) || "";

      if (files.length === 0) {
        return Response.json(
          { success: false, error: "Aucun fichier téléchargé" },
          { status: 400 }
        );
      }

      try {
        const uploadedDocuments = await Promise.all(
          files.map((file) =>
            documentService.uploadFile(file, quickUser, {
              label,
              description,
              uploadedBy: currentUser.id as string,
              availableFor: { users: [quickUser], access: "specific" },
            })
          )
        );
        return Response.json({ success: true, documents: uploadedDocuments });
      } catch (error) {
        console.error("Erreur lors du téléchargement des fichiers:", error);
        return Response.json(
          {
            success: false,
            error: "Erreur lors du téléchargement des fichiers",
          },
          { status: 500 }
        );
      }
    }

    case "delete": {
      const documentId = formData.get("documentId") as string;
      if (!documentId) {
        return Response.json(
          { success: false, error: "Aucun ID de document fourni" },
          { status: 400 }
        );
      }

      // Add ownership check for delete
      const document = await documentService.readOne({ id: documentId });
      const hasFullDeleteAccess = await authService.can(currentUser.id, DocumentActions.Delete);
      const canDeleteOwn = await authService.can(currentUser.id, DocumentActions.DeleteOwn, {
        resourceOwnerId: document?.owner.toString(),
        targetUserId: currentUser.id
      });

      if (!hasFullDeleteAccess && !canDeleteOwn) {
        return Response.json(
          { success: false, error: "Accès non autorisé" },
          { status: 403 }
        );
      }

      try {
        await documentService.removeDocument(documentId);
        return Response.json({
          success: true,
          message: "Document supprimé avec succès",
        });
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        return Response.json(
          {
            success: false,
            error: "Erreur lors de la suppression du document",
          },
          { status: 500 }
        );
      }
    }

    case "update": {
      const documentId = formData.get("documentId") as string;
      const label = (formData.get("label") as string) || "";
      const description = (formData.get("description") as string) || "";
      
      if (!documentId) {
        return Response.json(
          { success: false, error: "Aucun ID de document fourni" },
          { status: 400 }
        );
      }

      // Add ownership check for update
      const document = await documentService.readOne({ id: documentId });
      const hasFullEditAccess = await authService.can(currentUser.id, DocumentActions.Edit);
      const canEditOwn = await authService.can(currentUser.id, DocumentActions.EditOwn, {
        resourceOwnerId: document?.owner.toString(),
        targetUserId: currentUser.id
      });

      if (!hasFullEditAccess && !canEditOwn) {
        return Response.json(
          { success: false, error: "Accès non autorisé" },
          { status: 403 }
        );
      }

      try {
        const updatedDocument = await documentService.updateOneAfterFindIt(
          documentId,
          { label, description }
        );

        return Response.json({ success: true, document: updatedDocument });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du document:", error);
        return Response.json(
          {
            success: false,
            error: "Erreur lors de la mise à jour du document",
          },
          { status: 500 }
        );
      }
    }

    default:
      return Response.json(
        { success: false, error: "Action invalide" },
        { status: 400 }
      );
  }
};

