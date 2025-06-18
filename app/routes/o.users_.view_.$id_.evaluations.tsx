/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  Form,
  useSearchParams,
  useNavigation,
} from "@remix-run/react";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { Input } from "~/components/ui/input";
import NoDataMessage from "~/components/val/no-data-message";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Search,
} from "lucide-react";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
import { kpiValueService } from "~/services/kpiValue.service.server";
import { UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await authService.requireUser(request, {condition: UserActions.QuickMakeKpiEvaluation});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentDepartment and departmentsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  try {
    const evaluations = await kpiValueService.readManyPaginated(
      {
        user: userId
      },
      { populate: "kpiForm,user,evaluator" }
    );

    const can =  {
      view: await authService.can(currentUser?.id as string, UserActions.View),
    }
    return Response.json({ evaluations, search, user, page, limit, can });
  } catch (error) {
    console.error("Error fetching kpiValues:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des kpiValues.",
      },
      { status: 500 }
    );
  }
};

export default function TaskList() {
  const { evaluations, search, user, page, limit, can } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams({ search: searchTerm });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6 max-w-8xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <CompactUserHeader user={user} can={can}/>
        <h1 className="text-3xl font-bold mt-4 text-center">
          KPI & Historiques des Evaluations
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <Form
              onSubmit={handleSearch}
              className="flex items-center gap-2 w-full sm:w-auto sm:flex-1  rounded-full border-2 border-primary"
            >
              <Input
                type="search"
                name="search"
                placeholder="Rechercher dans l'inventaire des evaluations..."
                defaultValue={search}
                className="h-12 text-base"
              />
              <Button type="submit" className="h-12 w-12 flex-shrink-0  rounded-full border-2 border-primary">
                <Search className="h-5 w-5" />
              </Button>
            </Form>
          </div>

          {isLoading ? (
            <LoadingSkeleton view={"list"} itemCount={limit} />
          ) : evaluations.results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base whitespace-nowrap">
                      Employé
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Date Evaluation
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Evaluateur
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap">
                      Moyenne Des Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.results?.map((kpiValue) => (
                    <TableRow key={kpiValue.id}>
                      <TableCell className="font-medium text-base">
                        {kpiValue.user.firstName} {kpiValue.user.lastName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-base">
                        {new Date(kpiValue.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {kpiValue.evaluator?.firstName}{" "}
                        {kpiValue.evaluator?.lastName}
                      </TableCell>
                      <TableCell className="text-base">
                        {kpiValue.meanScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <NoDataMessage
              type="tasks"
              createLink="/o/task/new"
              view={"list"}
            />
          )}

          {evaluations.totalResults > 0 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page - 1).toString() })
                }
                disabled={page === 1}
                className="w-full sm:w-auto h-12 text-base"
              >
                Précédent
              </Button>
              <span className="text-base">
                Page {page} sur {Math.ceil(evaluations.totalResults / limit)}
              </span>
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page + 1).toString() })
                }
                disabled={page * limit >= evaluations.totalResults}
                className="w-full sm:w-auto h-12 text-base"
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
