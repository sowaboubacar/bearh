import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { IPrime } from '~/core/entities/prime.entity.server'

interface UserBonusProps {
  bonuses?: IPrime[]
}

export function UserBonus({ bonuses }: UserBonusProps) {
  // Sample data to override the props
  bonuses = [
    {
      id: '1',
      user: '123', // Assuming this is a string representation of ObjectId
      baseAmount: 1000,
      performanceBonus: 500,
      remarkBonus: 200,
      totalAmount: 1700,
      period: 'Q1 2024',
      calculationDetails: {
        performance: 'Good',
        remark: 'Excellent',
      },
    },
    {
      id: '2',
      user: '123',
      baseAmount: 1200,
      performanceBonus: 600,
      remarkBonus: 300,
      totalAmount: 2100,
      period: 'Q2 2024',
      calculationDetails: {
        performance: 'Excellent',
        remark: 'Good',
      },
    },
    {
      id: '3',
      user: '123',
      baseAmount: 1500,
      performanceBonus: 700,
      remarkBonus: 400,
      totalAmount: 2600,
      period: 'Q3 2024',
      calculationDetails: {
        performance: 'Excellent',
        remark: 'Excellent',
      },
    },
  ]
  
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Primes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Desktop and tablet view */}
        <div className="hidden sm:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base whitespace-nowrap">
                  Période
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Montant de base
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Bonus de performance
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Bonus remarquable
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Montant total
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Détails
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonuses && bonuses?.map((bonus) => (
                <TableRow key={bonus.id}>
                  <TableCell className="text-base">
                    {bonus.period}
                  </TableCell>
                  <TableCell className="text-base">
                    {bonus.baseAmount.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-base">
                    {bonus.performanceBonus.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-base">
                    {bonus.remarkBonus.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-base font-medium">
                    {bonus.totalAmount.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-base">
                    <div>Performance: {bonus.calculationDetails.performance}</div>
                    <div>Remarque: {bonus.calculationDetails.remark}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
  
        {/* Mobile view */}
        <div className="sm:hidden space-y-6">
          {bonuses && bonuses?.map((bonus) => (
            <Card key={bonus.id}>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-base text-muted-foreground">Période</p>
                  <p className="text-base font-medium">{bonus.period}</p>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Montant de base</p>
                    <p className="text-base">{bonus.baseAmount.toFixed(2)} €</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Bonus performance</p>
                    <p className="text-base">{bonus.performanceBonus.toFixed(2)} €</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Bonus remarquable</p>
                    <p className="text-base">{bonus.remarkBonus.toFixed(2)} €</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Montant total</p>
                    <p className="text-base font-medium">{bonus.totalAmount.toFixed(2)} €</p>
                  </div>
                </div>
  
                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Performance</p>
                    <p className="text-base">{bonus.calculationDetails.performance}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Remarque</p>
                    <p className="text-base">{bonus.calculationDetails.remark}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )  
}

