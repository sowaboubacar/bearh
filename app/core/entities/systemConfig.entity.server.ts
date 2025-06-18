/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "~/core/db/plugins/paginate.plugin.server";


export interface ISystemConfig extends IBaseModel {
  isBlocked?: boolean; // Si bloqué, les mises à jour ne sont pas autorisées
  /**
   * 
   * Par defaut, l'utilisateur que cible specifiquement l'action
   * effectué est notifié indépendamment de cette configuration.
   * Ex: Lorsqu'un ajoute un utilisateur à une équipe, l'utilisateur ajouté est notifié
   */
  settings: {
    // Configuration de l'employé du mois
    employeeOfTheMonth: {
      isVoteOngoing: boolean; // Est-ce que le vote est en cours. Ceci est automatiquement mis à jour par le système
      selection: {
        mode: "automatic" | "manual" | "mixed"; // "automatic", "manual", "mixed"
        voteDuration: number; // Durée des votes en heures
        automaticSelectionAndVoteStartDay: number; // Jour du mois où le vote commence. 48h (le 28 à 02h:00) la nomination est automatique  et le vote est clos
      };
      display: {
        showVotes: boolean; // Afficher les votes
        showMetrics: boolean; // Afficher les métriques
      };
      metricsWeights: {
        positiveObservation: number;
        negativeObservation: number;
        tasksCompleted: number;
        kpiAverageScore: number;
        workingHours: number;
        breakHours: number;
        lateDays: number;
        absentDays: number;
        // Autres métriques peuvent être ajoutées ici plus tard
      };
      notifications: {
        voters: {
          enabled: boolean;
          votersList: mongoose.Schema.Types.ObjectId[]; // Related to user entity
          template: string; // Message de notification
        };
        news: {
          enabled: boolean; // Notification de la nouvelle sur le mur de la pharmacie
        };
        winner: {
          enabled: boolean;
          template: string; // Message de notification
        };
        loser: {
          enabled: boolean;
          template: string; // Message de notification
        };
        others: {
          enabled: boolean;
          template: string; // Message de notification
        };
      };
    };
    location: { latitude: string; longitude: string; radius: number }; // Coordonnées de la pharmacie

    // A qui envoyer les notifications lorsque ces événements se produisent
    notifications: {
      checkIn: {
        // Qui est notifié lorsqu'un utilisateur commence sa journée de travail
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      checkOut: {
        // Qui est notifié lorsqu'un utilisateur termine sa journée de travail
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      breakStart: {
        // Qui est notifié lorsqu'un utilisateur commence sa pause
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      breakEnd: {
        // Qui est notifié lorsqu'un utilisateur termine sa pause
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      permission: {
        // Qui est notifié lorsqu'une permission est demandée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      permissionApproved: {
        // Qui est notifié lorsqu'une permission est approuvée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      permissionRejected: {
        // Qui est notifié lorsqu'une permission est rejetée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      news: {
        // Qui est notifié lorsqu'une nouvelle est publiée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      observation: {
        // Qui est notifié lorsqu'une remarque est faite à un utilisateur
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      taskAssigned: {
        // Qui est notifié lorsqu'une tâche est assignée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      taskCompleted: {
        // Qui est notifié lorsqu'une tâche est complétée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      expenseRequest: {
        // Qui est notifié lorsqu'une demande de remboursement est soumise
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      expenseRequestApproved: {
        // Qui est notifié lorsqu'une demande de remboursement est approuvée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      expenseRequestRejected: {
        // Qui est notifié lorsqu'une demande de remboursement est rejetée
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      guardTourUpdate: {
        // Qui est notifié lorsqu'une tour de garde de la pharmacie est mise à jour
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      evaluateAnEmployee: {
        // Qui est notifié lorsqu'un employé est évalué via un formulaire d'évaluation (KPI)
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      addToOrUpdateDepartmentMemberships: {
        // Qui est notifié lorsqu'un utilisateur est ajouté ou mis à jour dans un département
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      addToOrUpdateTeamMemberships: {
        // Qui est notifié lorsqu'un utilisateur est ajouté ou mis à jour dans une équipe
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      addToOrUpdatePositionMemberships: {
        // Qui est notifié lorsqu'un utilisateur est ajouté ou mis à jour dans un fiche de poste
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      addToOrUpdateHourGroupMemberships: {
        // Qui est notifié lorsqu'un utilisateur est ajouté ou mis à jour dans un groupe horaire
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      accessControlUpdate: {
        // Qui est notifié lorsqu'un contrôle d'accès est mis à jour
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      accessControlAssignedToUser: {
        // Qui est notifié lorsqu'un contrôle d'accès est assigné à un utilisateur
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
      accessControlAssignedToPosition: {
        // Qui est notifié lorsqu'un contrôle d'accès est assigné à une fiche de poste (donc à tous les utilisateurs de cette fiche de poste)
        recipients: mongoose.Schema.Types.ObjectId[]; // Related to user entity
      };
    };

    /**
     * Exemple de configuration de calcul de bonus
    * 
    * {
          "frequency": "quarterly", // Trimestriel
          "executionDay": 5, // 5ème jour du mois (Premier trimestre sera le 5 Mars, 2ème trimestre le 5 Juin, et 4 ème trimestre le 5 Décembre)
          "executionTime": "02:00", // 2h du matin
          "nextExecutionDate": "2024-01-05T02:00:00Z", // Mise à jour automatique par le système après chaque exécution
          "lastExecutionDate": "2023-10-05T02:00:00Z" // Mise à jour automatique par le système après chaque exécution
        }

    */
    bonusCalculation: {
      frequency:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semi-annually"
        | "annually"; // Fréquence de calcul du bonus
      executionDay: number; // Jour du mois où le cron sera exécuté (1 à 28 ou "last")
      executionTime: string; // Heure d'exécution (ex: "02:00")
      nextExecutionDate?: Date; // Date calculée pour la prochaine exécution
      lastExecutionDate?: Date; // Dernière date d'exécution
    };
  };
  lastUpdatedBy?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export type ISystemConfigMethods = {};

export type SystemConfigModel = Model<ISystemConfig, {}, ISystemConfigMethods>;

const systemConfigSchema = new Schema<
  ISystemConfig,
  SystemConfigModel,
  ISystemConfigMethods
>(
  {
    isBlocked: {
      type: Boolean,
      default: false,
    },
    settings: {
      employeeOfTheMonth: {
        isVoteOngoing: {
          type: Boolean,
          default: false,
        },
        selection: {
          mode: {
            type: String,
            enum: ["automatic", "manual", "mixed"],
            default: "automatic",
          },
          voteDuration: {
            type: Number,
            default: 48, // Durée des votes en heures. 48h (le 28 à 02h:00) la nomination est automatique  et le vote est clos            
          },
          automaticSelectionAndVoteStartDay: {
            type: Number,
            default: 25, // Jour du mois où le vote commence. 48h (le 28 à 02h:00) la nomination est automatique  et le vote est clos
          },
        },
        display: {
          showVotes: {
            type: Boolean,
            default: true,
          },
          showMetrics: {
            type: Boolean,
            default: true,
          },
        },
        metricsWeights: {
          positiveObservation: {
            type: Number,
            default: 1,
          },
          negativeObservation: {
            type: Number,
            default : -1,
          },
          tasksCompleted: {
            type: Number,
            default: 5,
          },
          kpiAverageScore: {
            type: Number,
            default: 4,
          },
          workingHours: {
            type: Number,
            default: 3,
          },
          breakHours: {
            type: Number,
            default: -1,
          },
          lateDays: {
            type: Number,
            default: -2,
          },
          absentDays: {
            type: Number,
            default: -3,
          },
        },
        notifications: {
          voters: {
            enabled: {
              type: Boolean,
              default: true,
            },
            votersList: [
              {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
              },
            ],
            template: {
              type: String,
              default: "Merci de voter pour l'employé du mois!",
            },
          },
          news: {
            enabled: {
              type: Boolean,
              default: true,
            },
          },
          winner: {
            enabled: {
              type: Boolean,
              default: true,
            },
            template: {
              type: String,
              default: "Félicitations! Vous êtes l'employé du mois!",
            },
          },
          loser: {
            enabled: {
              type: Boolean,
              default: true,
            },
            template: {
              type: String,
              default: "Vous n'avez pas gagné l'employé du mois cette fois-ci!. Mais ne vous découragez pas!. Nous sommes fiers de vous!",
            },
          },
          others: {
            enabled: {
              type: Boolean,
              default: true,

            },
            template: {
              type: String,
              default: "Nous sommes fiers de vous annoncer que l'employé du mois a été sélectionné!",
            },
          },
        },
      },
      location: {
        latitude: {
          type: String,
        },
        longitude: {
          type: String,
        },
        radius: {
          type: Number,
        },
      },
      notifications: {
        checkIn: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        checkOut: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        breakStart: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        breakEnd: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        permission: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        permissionApproved: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        permissionRejected: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        news: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        observation: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        taskAssigned: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        taskCompleted: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        expenseRequest: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        expenseRequestApproved: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        expenseRequestRejected: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        guardTourUpdate: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        evaluateAnEmployee: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        addToOrUpdateDepartmentMemberships: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        addToOrUpdateTeamMemberships: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        addToOrUpdatePositionMemberships: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        addToOrUpdateHourGroupMemberships: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        accessControlUpdate: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        accessControlAssignedToUser: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
        accessControlAssignedToPosition: {
          recipients: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
              default: [],
            },
          ],
        },
      },
      bonusCalculation: {
        frequency: {
          type: String,
          enum: [
            "daily",
            "weekly",
            "monthly",
            "quarterly",
            "semi-annually",
            "annually",
          ],
          required: true,
        },
        executionDay: {
          type: Number,
          required: true,
        },
        executionTime: {
          type: String,
          required: true,
        },
        nextExecutionDate: {
          type: Date,
        },
        lastExecutionDate: {
          type: Date,
        },
      },
    },
    lastUpdatedBy: {
      type: String, // Will be updated by the system (user or system)
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Only lookup to this if the lastUpdatedBy is a user
    },
  },
  {
    timestamps: true,
  }
);

systemConfigSchema.plugin(toJSON);
systemConfigSchema.plugin(paginate);

const SystemConfig =
  mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfig, SystemConfigModel>(
    "SystemConfig",
    systemConfigSchema
  );
export default SystemConfig;
