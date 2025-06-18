import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, Plus, Trash2, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { expenseReportService } from '~/services/expenseReport.service.server'
import { userService } from '~/services/user.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { ExpenseReportActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.Edit, ExpenseReportActions.EditOwn] }
  });

  try {
    const report = await expenseReportService.readOne({
      id: params.id,
      populate: 'user,approver,attachments'
    });

    if (!report) {
      throw Response.json({ message: "Note de frais non trouvée" }, { status: 404 });
    }

    // Check if user has permission to edit this specific report
    const hasFullEditAccess = await authService.can(currentLoggedUser.id, ExpenseReportActions.Edit);
    const canEditOwn = await authService.can(currentLoggedUser.id, ExpenseReportActions.EditOwn, {
      resourceOwnerId: report.user.id.toString(),
      targetUserId: currentLoggedUser.id
    });

    if (!hasFullEditAccess && !canEditOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      list: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.List, ExpenseReportActions.ListOwn] })
    };

    return Response.json({ report, can });
  } catch (error) {
    console.error("Error fetching expense report:", error);
    throw Response.json({ message: "Une erreur s'est produite lors de la récupération de la note de frais." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.Edit, ExpenseReportActions.EditOwn] }
  });

  try {
    const report = await expenseReportService.readOne({
      id: params.id,
      populate: 'user'
    });

    if (!report) {
      throw Response.json({ message: "Note de frais non trouvée" }, { status: 404 });
    }

    // Check if user has permission to edit this specific report
    const hasFullEditAccess = await authService.can(currentLoggedUser.id, ExpenseReportActions.Edit);
    const canEditOwn = await authService.can(currentLoggedUser.id, ExpenseReportActions.EditOwn, {
      resourceOwnerId: report.user.id,
      targetUserId: currentLoggedUser.id
    });

    if (!hasFullEditAccess && !canEditOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    // Process form data and update
    const formData = await request.formData();
    // ... rest of your update logic

    return redirect(`/o/expense-report/view/${params.id}`);
  } catch (error) {
    console.error("Error updating expense report:", error);
    return Response.json({ message: "Une erreur s'est produite lors de la mise à jour de la note de frais." }, { status: 500 });
  }
};

export default function EditExpenseReport() {

  const { report, users,can } = useLoaderData<typeof loader>()
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    report.attachments 
  );
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [items, setItems] = useState(report.items)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { description: '', amount: '' }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: 'description' | 'amount', value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const submit = useSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach(doc => {
      formData.append('attachments', doc.id);
    });
    submit(formData, { method: 'post' });
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    //setSelectedDocuments(prevDocs => [...prevDocs, ...documents]);
    setSelectedDocuments(documents);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/expense-report">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
            Retour à la liste
          </Link>
        </Button>
      )}
  
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier la note de frais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {actionData?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-base font-medium">
                Erreur
              </AlertTitle>
              <AlertDescription className="text-base">
                {actionData.error}
              </AlertDescription>
            </Alert>
          )}
          
          <Form method="post" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row gap-4 sm:items-end"
                >
                  <div className="flex-grow space-y-2">
                    <Label 
                      htmlFor={`description-${index}`}
                      className="text-base font-medium"
                    >
                      Description
                    </Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="w-full sm:w-1/4 space-y-2">
                    <Label 
                      htmlFor={`amount-${index}`}
                      className="text-base font-medium"
                    >
                      Montant
                    </Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      required
                      className="h-11 text-base"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleRemoveItem(index)}
                    className="h-11 w-11"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
              
              <Button 
                type="button" 
                onClick={handleAddItem} 
                className="w-full h-11 text-base"
              >
                <Plus className="mr-2 h-5 w-5" /> 
                Ajouter un élément
              </Button>
              <input type="hidden" name="items" value={JSON.stringify(items)} />
  
              <div className="space-y-2 sm:space-y-3">
                <Label 
                  htmlFor="attachments"
                  className="text-base font-medium"
                >
                  Images & Pièces jointes
                </Label>
                <UploadWidget 
                  onSelect={handleDocumentSelect} 
                  defaultSelectedDocuments={report.attachments}
                  multiple={true}
                  accept="image/*,application/pdf" 
                  maxSize={5 * 1024 * 1024} 
                  onBusyStateChange={setUploadWidgetIsBusy}
                  className="w-full"
                />
              </div>
  
              <Button 
                type="submit" 
                className="w-full h-11 text-base"
                disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === 'submitting'}
              >
                {isSubmitting || navigation.state === 'submitting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mise à jour...
                  </span>
                ) : (
                  'Mettre à jour la note de frais'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );  
}
