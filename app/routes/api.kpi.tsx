import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { IUser } from "~/core/entities/user.entity.server";
import {
  KpiFormActions,
  UserActions,
} from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { kpiFormService } from "~/services/kpiForm.service.server";
import { kpiValueService } from "~/services/kpiValue.service.server";
import { userService } from "~/services/user.service.server";

export const loader: LoaderFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: {
      all: [KpiFormActions.List],
    },
  });
  const url = new URL(request.url);
  const user = url.searchParams.get("user") as string;
  const userObject = await userService.readOne({ id: user });

  const kpis = await kpiFormService.getApplicableForms(userObject as IUser);

  return Response.json({ kpis, success: true, message: "OK" });
};

export const action: ActionFunction = async ({ request }) => {
  const authenticatedUser = await authService.requireUser(request, {
    condition: UserActions.QuickMakeKpiEvaluation,
  });

  const formData = await request.formData();
  const kpiForm = formData.get("kpiForm") as string;
  const user = formData.get("user") as string;
  const scores = JSON.parse(formData.get("scores") as string);

  try {
    const kpiValue = await kpiValueService.createOne({
      user,
      kpiForm,
      scores,
      evaluator: authenticatedUser.id, // Set the authenticated user as the author
    });
    return Response.json({
      success: true,
      kpiValue,
      message: "OK",
    });
  } catch (error) {
    console.error("Error creating kpiValue:", error);
    return Response.json(
      { success: false, error: "Impossible de terminer l'operation" },
      { status: 400 }
    );
  }
};
