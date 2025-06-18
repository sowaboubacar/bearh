import { LoaderFunction } from "@remix-run/node";
import { userMonthlyReportService } from "~/services/userMonthlyReport.service.server";
import { userService } from "~/services/user.service.server";
import { generateCsvReport } from "~/utils/generateCsvReport.server";
import { authService } from "~/services/auth.service.server";
import { UserActions } from "~/core/entities/utils/access-permission";


function getPreviousMonthYear() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
}

export const loader: LoaderFunction = async ({ params, request }) => {
  await authService.requireUser(request, {condition: UserActions.ViewOnProfileDocumentInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID required", { status: 400 });
  }

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const startMonth = url.searchParams.get("startMonth");
  const endMonth = url.searchParams.get("endMonth");

  const user = await userService.readOne({ id: userId });
  let reportsData: any = {};
  let comparisonMode = false;
  let options: any = {
    user: { firstName: user?.firstName, lastName: user?.lastName },
  };

  if (!year || !startMonth || !endMonth) {
    const { year: py, month: pm } = getPreviousMonthYear();
    const rpt = await userMonthlyReportService.getMonthlyReport(userId, py, pm);
    reportsData = { [`${py}-${pm}`]: rpt };
    options.year = py;
    options.startMonth = pm;
    options.endMonth = pm;
  } else {
    const y = parseInt(year, 10);
    const sm = parseInt(startMonth, 10);
    const em = parseInt(endMonth, 10);

    if (sm > em) {
      throw new Response(
        "Le mois de début ne peut pas être supérieur au mois de fin.",
        { status: 400 }
      );
    }

    const totalMonths = em - sm + 1;
    if (totalMonths > 1) {
      comparisonMode = true;
      options.comparisonMode = true;
      for (let m = sm; m <= em; m++) {
        const rpt = await userMonthlyReportService.getMonthlyReport(userId, y, m);
        reportsData[`${y}-${m}`] = rpt;
      }
    } else {
      const rpt = await userMonthlyReportService.getMonthlyReport(userId, y, sm);
      reportsData = { [`${y}-${sm}`]: rpt };
      options.year = y;
      options.startMonth = sm;
      options.endMonth = sm;
    }
  }

  options.reportsData = reportsData;
  options.comparisonMode = comparisonMode;

  const csvContent = await generateCsvReport(options);
  
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport_global_${user?.firstName}_${user?.lastName}.csv"`,
    },
  });
};

