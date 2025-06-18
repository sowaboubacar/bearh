import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Progress } from '~/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import type { IKpiValue } from '~/core/entities/kpiValue.entity.server'

interface UserEvaluationsProps {
  evaluations: IKpiValue[]
}

export function UserEvaluations({ evaluations }: UserEvaluationsProps) {

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Évaluations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {evaluations && evaluations?.map((evaluation, index) => (
            <AccordionItem 
              key={evaluation.id} 
              value={`item-${index}`}
              className="border rounded-lg px-4 sm:px-6"
            >
              <AccordionTrigger className="py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                  <span className="text-base sm:text-lg font-medium">
                    Évaluation du {new Date(evaluation.evaluationDate).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-base whitespace-nowrap">
                      Score total: {evaluation.totalScore.toFixed(2)}
                    </span>
                    <Progress 
                      value={evaluation.totalScore} 
                      className="w-[100px] h-3" 
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 sm:pb-6 space-y-6">
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base whitespace-nowrap">
                          Critère
                        </TableHead>
                        <TableHead className="text-base whitespace-nowrap">
                          Score
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluation.scores.map((score, scoreIndex) => (
                        <TableRow key={scoreIndex}>
                          <TableCell className="text-base">
                            {score.criterionName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                              <Progress 
                                value={score.score} 
                                className="w-[100px] h-3" 
                              />
                              <span className="text-base whitespace-nowrap">
                                {score.score.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
  
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-base text-muted-foreground">
                    Évaluateur: {evaluation.evaluator.toString()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Formulaire KPI: {evaluation.kpiForm.toString()}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );  
}

