/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Types } from "mongoose";
import DocumentService from "~/services/document.service.server";

interface PluginOptions {
  documentFields?: string[];
  logErrors?: boolean;
}

export function documentReferencePlugin(
  schema: mongoose.Schema,
  options: PluginOptions = {}
) {
  const documentFields = options.documentFields || [];
  const logErrors = options.logErrors ?? true;

  // Détection automatique des champs référencés
  if (documentFields.length === 0) {
    schema.eachPath((path, schemaType) => {
      if (
        schemaType instanceof mongoose.Schema.Types.ObjectId &&
        (schemaType as any).options.ref === "Document"
      ) {
        documentFields.push(path);
      } else if (
        schemaType instanceof mongoose.Schema.Types.Array &&
        (schemaType as any).caster instanceof mongoose.Schema.Types.ObjectId &&
        (schemaType as any).caster.options.ref === "Document"
      ) {
        documentFields.push(path);
      }
    });
  }

  if (documentFields.length === 0) {
    console.warn("Aucun champ de référence de document trouvé dans le schéma.");
    return;
  }

  // Middleware pre-save
  schema.pre("save", async function (next) {
    const doc = this;
    const modelName = doc.constructor.modelName;

    try {
      const entityId = doc._id;
      const isNew = doc.isNew;

      let previousDoc: any = null;
      if (!isNew) {
        previousDoc = await doc.constructor.findById(doc._id).lean();
      }

      for (const field of documentFields) {
        const currentValue = doc.get(field);
        const newValue = Array.isArray(currentValue)
          ? currentValue.map(String)
          : currentValue != null
          ? [String(currentValue)]
          : [];

        let previousValue: string[] = [];
        if (previousDoc) {
          const prevValue = previousDoc[field];
          previousValue = Array.isArray(prevValue)
            ? prevValue.map(String)
            : prevValue != null
            ? [String(prevValue)]
            : [];
        }

        const addedDocumentIds = newValue.filter((id) => !previousValue.includes(id));
        const removedDocumentIds = previousValue.filter((id) => !newValue.includes(id));

        if (addedDocumentIds.length > 0) {
          await DocumentService.addDocumentReferences({
            documentIds: addedDocumentIds,
            entityName: modelName,
            entityId: entityId,
            field: field,
          });
        }

        if (removedDocumentIds.length > 0) {
          await DocumentService.removeDocumentReferences({
            documentIds: removedDocumentIds,
            entityName: modelName,
            entityId: entityId,
            field: field,
          });
        }
      }

      next();
    } catch (error) {
      if (logErrors) {
        console.error(
          `Erreur dans le pre-save du plugin pour ${modelName} :`,
          error
        );
      }
      next(error as Error);
    }
  });

  // Opérations de suppression
  const deletionOperations = [
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findOneAndRemove",
    "findByIdAndDelete",
    "findByIdAndRemove",
  ];

  deletionOperations.forEach((operation) => {
    schema.post(operation, async function (result) {
      await handleDeletionMiddleware(result);
    });
  });

  // Fonction helper pour le middleware de suppression
  async function handleDeletionMiddleware(docs: any) {
    if (!docs) return;
    const modelName = docs.constructor.modelName || docs.model.modelName;
    const documents = Array.isArray(docs) ? docs : [docs];

    console.log("Performing deletion middleware for", modelName);
    try {
      for (const doc of documents) {
        const entityId = doc._id;
        for (const field of documentFields) {
          const documentIds = Array.isArray(doc[field])
            ? doc[field]
            : [doc[field]];
          const validDocumentIds = documentIds.filter((id) => id != null);

          if (validDocumentIds.length > 0) {
            await DocumentService.removeDocumentReferences({
              documentIds: validDocumentIds as Types.ObjectId[],
              entityName: modelName,
              entityId: entityId,
              field: field,
            });
          }
        }
      }
    } catch (error) {
      if (logErrors) {
        console.error(
          `Erreur dans le middleware de suppression du plugin pour ${modelName} :`,
          error
        );
      }
    }
  }

  // Méthode d'instance pour ajouter une référence
  schema.methods.addDocumentReference = async function (
    documentIds: string | Types.ObjectId | Array<string | Types.ObjectId>,
    field: string
  ) {
    if (!documentFields.includes(field)) {
      throw new Error(
        `Le champ '${field}' n'est pas reconnu comme champ de référence de document.`
      );
    }

    const doc = this;
    const modelName = doc.constructor.modelName;

    try {
      const entityId = doc._id;
      const docIds = Array.isArray(documentIds) ? documentIds : [documentIds];

      await DocumentService.addDocumentReferences({
        documentIds: docIds,
        entityName: modelName,
        entityId: entityId,
        field: field,
      });

      if (Array.isArray(doc[field])) {
        doc[field] = doc[field].concat(docIds);
      } else {
        doc[field] = docIds[0];
      }

      await doc.save();
    } catch (error) {
      if (logErrors) {
        console.error(
          `Erreur lors de l'ajout de la référence de document pour ${modelName} :`,
          error
        );
      }
      throw error;
    }
  };

  // Méthode d'instance pour supprimer une référence
  schema.methods.removeDocumentReference = async function (
    documentIds: string | Types.ObjectId | Array<string | Types.ObjectId>,
    field: string
  ) {
    if (!documentFields.includes(field)) {
      throw new Error(
        `Le champ '${field}' n'est pas reconnu comme champ de référence de document.`
      );
    }

    const doc = this;
    const modelName = doc.constructor.modelName;

    try {
      const entityId = doc._id;
      const docIds = Array.isArray(documentIds) ? documentIds : [documentIds];

      await DocumentService.removeDocumentReferences({
        documentIds: docIds,
        entityName: modelName,
        entityId: entityId,
        field: field,
      });

      if (Array.isArray(doc[field])) {
        doc[field] = doc[field].filter(
          (id: Types.ObjectId) => !docIds.includes(String(id))
        );
      } else {
        if (docIds.includes(String(doc[field]))) {
          doc[field] = null;
        }
      }

      await doc.save();
    } catch (error) {
      if (logErrors) {
        console.error(
          `Erreur lors de la suppression de la référence de document pour ${modelName} :`,
          error
        );
      }
      throw error;
    }
  };
}