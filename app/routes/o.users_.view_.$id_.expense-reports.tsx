/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  Form,
  useSearchParams,
  useFetcher,
  useNavigation,
} from "@remix-run/react";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { useState } from "react";
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
import { Search, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
import { expenseReportService } from "~/services/expenseReport.service.server";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ExpenseReportActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: UserActions.ViewOnProfileExpenseInsight});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;
  const user = await userService.readOne({
    id: params.id,
    populate: "avatar,currentHourGroup,currentPosition",
  });

  try {
    const reports = await expenseReportService.readManyPaginated(
      {
        $or: [
          { "items.description": { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
        ],
      },
      { limit, page, sortBy: "submissionDate:desc" }
    );

    const can =  {
      view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
      expenseReport: {
        view: await authService.can(currentLoggedUser?.id as string, ExpenseReportActions.View)
      }
    }
    return Response.json({ reports, search, user, page, limit , can});
  } catch (error) {
    console.error("Error fetching expense reports:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des notes de frais.",
      },
      { status: 500 }
    );
  }
};

export default function ExpenseReportList() {
  const { reports, search, user, page, limit, can } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleAction = (
    id: string,
    action: "delete" | "approve" | "reject"
  ) => {
    setIsProcessing(true);
    fetcher.submit(
      { id, action },
      { method: "post", action: "o/expense-report" }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

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
        <h1 className="text-3xl font-bold mt-4 text-center">Notes de frais</h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <Form
              className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
              onSubmit={handleSearch}
            >
              <Input
                type="search"
                name="search"
                placeholder="Rechercher des notes de frais"
                defaultValue={search ?? ""}
                className="h-12 text-base rounded-full border-2 border-primary"
              />
              <Button type="submit" className="h-12 w-12 flex-shrink-0  rounded-full border-2 border-primary">
                <Search className="h-5 w-5" />
              </Button>
            </Form>
          </div>

          {isLoading ? (
            <LoadingSkeleton view={"list"} itemCount={limit} />
          ) : reports.results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base whitespace-nowrap">
                      Date de soumission
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Montant total
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Statut
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Pièces Jointes
                    </TableHead>
                    <TableHead className="text-base text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.results.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium text-base">
                        {formatDate(report.submissionDate)}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {formatAmount(report.totalAmount)}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {report.status}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {report.attachments.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">

                          {can?.expenseReport && (
                          <Button
                            asChild
                            variant="outline"
                            className="h-11 w-11"
                          >
                            <Link
                              prefetch="intent"
                              to={`/o/expense-report/view/${report.id}`}
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                          </Button>
                          )}
                         
                        </div>
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

          {reports.totalResults > 0 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page - 1).toString() })
                }
                disabled={page === 1}
                className="w-full sm:w-auto h-11 text-base"
              >
                Précédent
              </Button>
              <span className="text-base">
                Page {page} sur {Math.ceil(reports.totalResults / limit)}
              </span>
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page + 1).toString() })
                }
                disabled={page * limit >= reports.totalResults}
                className="w-full sm:w-auto h-11 text-base"
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
