import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import type { IExpenseReport } from '~/core/entities/expenseReport.entity.server'

interface UserExpenseReportsProps {
  expenseReports: IExpenseReport[]
}

export function UserExpenseReports({ expenseReports }: UserExpenseReportsProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Notes de frais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {expenseReports && expenseReports?.map((report, index) => (
            <AccordionItem 
              key={report.id} 
              value={`item-${index}`}
              className="border rounded-lg px-4 sm:px-6"
            >
              <AccordionTrigger className="py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                  <span className="text-base sm:text-lg font-medium">
                    Note de frais du {new Date(report.submissionDate).toLocaleString()}
                  </span>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <span className="text-base whitespace-nowrap">
                      Total: {report.totalAmount.toFixed(2)} €
                    </span>
                    <Badge 
                      className="text-base px-3 py-1" 
                      variant={
                        report.status === 'Approved' ? 'success' :
                        report.status === 'Pending' ? 'warning' :
                        'destructive'
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 sm:pb-6">
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base whitespace-nowrap">
                          Description
                        </TableHead>
                        <TableHead className="text-base whitespace-nowrap">
                          Montant
                        </TableHead>
                        <TableHead className="text-base whitespace-nowrap">
                          Reçu
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.items.map((item, itemIndex) => (
                        <TableRow key={itemIndex}>
                          <TableCell className="text-base">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-base whitespace-nowrap">
                            {item.amount.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-base">
                            {item.receipt ? 'Oui' : 'Non'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
  
                <div className="space-y-4 mt-6">
                  {report.attachments && report.attachments.length > 0 && (
                    <div>
                      <p className="text-base font-semibold">
                        Pièces jointes: {report.attachments.length}
                      </p>
                    </div>
                  )}
                  
                  {report.approver && (
                    <div className="pt-2 border-t">
                      <p className="text-base text-muted-foreground">
                        Approuvé par: {report.approver?.firstName} {report.approver?.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );  
}

