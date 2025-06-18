import { useState } from 'react'
import { ActionFunction, redirect, json } from '@remix-run/node'
import { Form, useActionData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { AlertCircle, Plus, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { expenseReportService } from '~/services/expenseReport.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { ExpenseReportActions } from "~/core/entities/utils/access-permission";

export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.Create] },
  });

  const formData = await request.formData()
  const items = JSON.parse(formData.get('items') as string)
  const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0)
  const attachments = formData.getAll("attachments");

  try {
    const newReport = await expenseReportService.createOne({
      user: currentLoggedUser?.id as string, // Set the authenticated user as the report owner
      items,
      totalAmount,
      submissionDate: new Date(),
      status: 'Pending',
      attachments
    })

  
    return redirect(`/o/expense-report/view/${newReport.id}`)
  } catch (error) {
    console.error("Error creating expense report:", error);
    return Response.json({ success: false, error: 'Échec de la création de la note de frais' }, { status: 400 })
  }
}

export default function NewExpenseReport() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [items, setItems] = useState([{ description: '', amount: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const submit = useSubmit();
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach(doc => {
      formData.append('attachments', doc.id);
    });
    console.log("Selected doc before submit: ", selectedDocuments);
    submit(formData, { method: 'post' });
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    console.log(documents);
    setSelectedDocuments(prevDocs => [...prevDocs, ...documents]);
    //setSelectedDocuments(documents);
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
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
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouvelle note de frais
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
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
                multiple={true}
                accept="image/*,application/pdf" 
                maxSize={5 * 1024 * 1024} 
                onBusyStateChange={setUploadWidgetIsBusy}
                className="w-full"
              />
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                'Créer la note de frais'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
