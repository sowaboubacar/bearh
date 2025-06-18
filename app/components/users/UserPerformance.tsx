/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'

interface UserPerformanceProps {
  performance?: any
}

export function UserPerformance({ performance }: UserPerformanceProps) {
  // Generate sample data to ovveride the props
  performance = {
    metrics: {
      'Productivité': 80,
      'Qualité': 90,
      'Efficacité': 70,
      'Fiabilité': 85,
      'Innovation': 60,
    },
    comments: 'Travail de qualité, mais peut être plus innovant',
    lastUpdated: new Date(),
  }


  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {performance && ( <>
          <div className="space-y-6">
            {Object.entries(performance.metrics).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base sm:text-lg font-semibold">{key}</span>
                  <span className="text-base sm:text-lg font-medium">{value}%</span>
                </div>
                <Progress 
                  value={value} 
                  className="h-3 sm:h-4" 
                />
              </div>
            ))}
          </div>
          
          <div className="mt-8 sm:mt-10">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              Commentaires
            </h3>
            <p className="text-base">
              {performance.comments}
            </p>
          </div>
          
          <div className="mt-6 sm:mt-8">
            <p className="text-base text-muted-foreground">
              Dernière mise à jour: {new Date(performance.lastUpdated).toLocaleString()}
            </p>
          </div>
        </>)}
      </CardContent>
    </Card>
  )  
}

